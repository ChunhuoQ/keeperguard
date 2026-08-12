import { describe, expect, it } from "vitest";
import { KeeperHubClient, stableIntentKey } from "../src/keeperhub.js";
import type { TransferIntent } from "../src/types.js";

const intent: TransferIntent = {
  incidentId: "incident|42%",
  chainId: 84532,
  recipientAddress: "0x0000000000000000000000000000000000000001",
  amount: "0",
};

describe("KeeperHub execution adapter", () => {
  it("derives stable, intent-specific idempotency keys", () => {
    expect(stableIntentKey(intent)).toBe(stableIntentKey({ ...intent }));
    expect(stableIntentKey(intent)).not.toBe(stableIntentKey({ ...intent, amount: "0.1" }));
    expect(stableIntentKey(intent)).toMatch(/^keeperguard-[a-f0-9]{40}$/);
  });

  it("simulates, broadcasts once, and waits for authoritative completion", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    let statusReads = 0;
    const fakeFetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      calls.push({ url, init });
      if (url.endsWith("/status")) {
        statusReads += 1;
        return Response.json(statusReads === 1 ? { status: "queued" } : {
          status: "completed",
          receipts: [{ verified: true, receiptStatus: "success", gasUsed: "21000", sponsored: true }],
        }, { headers: { "x-poll-interval-hint": "0" } });
      }
      const body = JSON.parse(String(init?.body));
      if (body.simulate) return Response.json({ success: true, wouldRevert: false, status: "simulated" });
      return Response.json({ executionId: "exec-1" }, { status: 202 });
    };
    const client = new KeeperHubClient("kh_test", "https://keeper.example", "https://rpc.example", fakeFetch as typeof fetch);
    await client.simulate(intent);
    const started = await client.broadcast(intent, stableIntentKey(intent));
    const proof = await client.waitForProof(started.executionId, 5_000);
    expect(proof).toMatchObject({ status: "completed", verified: true, receiptStatus: "success", sponsored: true });
    expect(statusReads).toBe(2);
    expect(calls[1].init?.headers).toHaveProperty("Idempotency-Key");
  });
});
