import { assessEvidence } from "./evidence.js";
import { stableIntentKey } from "./keeperhub.js";
import { decide } from "./policy.js";
import { StateStore } from "./state.js";
import type { IncidentResult, RiskSignal, TransferIntent, TreasuryPolicy } from "./types.js";

export class KeeperGuardAgent {
  constructor(
    private readonly store: StateStore,
    private readonly keeperHub?: {
      simulate(intent: TransferIntent): Promise<Record<string, unknown>>;
      broadcast(intent: TransferIntent, idempotencyKey: string): Promise<{ executionId: string; idempotentReplay?: boolean }>;
      waitForProof(executionId: string): Promise<import("./types.js").ExecutionProof>;
    },
  ) {}

  async run(
    incidentId: string,
    signals: RiskSignal[],
    policy: TreasuryPolicy,
    live = false,
    now = new Date(),
  ): Promise<IncidentResult> {
    await this.store.audit({ incidentId, stage: "received", at: now.toISOString(), detail: { signalCount: signals.length } });
    const assessment = assessEvidence(signals, policy, now);
    const decision = decide(assessment, policy);
    if (!assessment.confirmed) {
      await this.store.audit({ incidentId, stage: "evidence-rejected", at: now.toISOString(), detail: { reasons: assessment.reasons } });
      return { incidentId, assessment, decision };
    }
    if (!decision.approved) {
      await this.store.audit({ incidentId, stage: "policy-rejected", at: now.toISOString(), detail: { reason: decision.reason } });
      return { incidentId, assessment, decision };
    }

    const intent: TransferIntent = {
      incidentId,
      chainId: policy.chainId,
      recipientAddress: policy.recipientAddress,
      amount: live ? decision.amount : "0",
    };
    const key = stableIntentKey(intent);
    await this.store.persistIntent(key, intent);
    await this.store.audit({ incidentId, stage: "intent-persisted", at: new Date().toISOString(), detail: { idempotencyKey: key, intent } });

    if (!this.keeperHub) return { incidentId, assessment, decision };
    const simulation = await this.keeperHub.simulate(intent);
    await this.store.audit({ incidentId, stage: "simulated", at: new Date().toISOString(), detail: simulation });
    const broadcast = await this.keeperHub.broadcast(intent, key);
    await this.store.transition(key, { status: "broadcast", executionId: broadcast.executionId });
    await this.store.audit({ incidentId, stage: "broadcast", at: new Date().toISOString(), detail: broadcast });
    const proof = await this.keeperHub.waitForProof(broadcast.executionId);
    if (proof.status === "unconfirmed") {
      await this.store.transition(key, { status: "unconfirmed", executionId: broadcast.executionId });
      await this.store.audit({ incidentId, stage: "unconfirmed", at: new Date().toISOString(), detail: { ...proof } });
      return { incidentId, assessment, decision, proof };
    }
    await this.store.transition(key, { status: "completed", executionId: broadcast.executionId, transactionHash: proof.transactionHash });
    await this.store.audit({ incidentId, stage: "completed", at: new Date().toISOString(), detail: { ...proof } });
    return { incidentId, assessment, decision, proof: { ...proof, idempotentReplay: broadcast.idempotentReplay } };
  }
}
