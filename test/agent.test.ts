import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { KeeperGuardAgent } from "../src/agent.js";
import { confirmedSignals, demoPolicy, rejectedSignals } from "../src/fixtures.js";
import { StateStore } from "../src/state.js";

const recipient = "0x0000000000000000000000000000000000000001" as const;
const now = new Date("2026-08-12T09:00:00Z");

describe("KeeperGuard agent", () => {
  it("never calls execution when evidence is rejected", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "keeperguard-"));
    const gateway = { simulate: vi.fn(), broadcast: vi.fn(), waitForProof: vi.fn() };
    const result = await new KeeperGuardAgent(new StateStore(directory), gateway).run(
      "rejected", rejectedSignals(now), demoPolicy(recipient), false, now,
    );
    expect(result.decision.approved).toBe(false);
    expect(gateway.simulate).not.toHaveBeenCalled();
    expect(gateway.broadcast).not.toHaveBeenCalled();
  });

  it("persists intent before simulation and records verified completion", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "keeperguard-"));
    const store = new StateStore(directory);
    const gateway = {
      simulate: vi.fn(async () => ({ success: true, wouldRevert: false })),
      broadcast: vi.fn(async () => ({ executionId: "exec-verified" })),
      waitForProof: vi.fn(async () => ({ executionId: "exec-verified", status: "completed", verified: true, receiptStatus: "success" })),
    };
    const result = await new KeeperGuardAgent(store, gateway).run(
      "approved", confirmedSignals(now), demoPolicy(recipient), false, now,
    );
    expect(result.proof?.verified).toBe(true);
    expect((await store.auditTrail()).map((event) => event.stage)).toEqual([
      "received", "intent-persisted", "simulated", "broadcast", "completed",
    ]);
  });
});
