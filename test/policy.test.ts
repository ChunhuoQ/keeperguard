import { describe, expect, it } from "vitest";
import { assessEvidence } from "../src/evidence.js";
import { confirmedSignals, demoPolicy, rejectedSignals } from "../src/fixtures.js";
import { decide } from "../src/policy.js";

const recipient = "0x0000000000000000000000000000000000000001" as const;
const now = new Date("2026-08-12T09:00:00Z");

describe("treasury policy", () => {
  it("authorizes only the policy-capped escape action", () => {
    const policy = { ...demoPolicy(recipient), maxActionAmount: "0.01" };
    const decision = decide(assessEvidence(confirmedSignals(now), policy, now), policy);
    expect(decision.approved).toBe(true);
    expect(decision.action).toBe("escape-transfer");
    expect(decision.amount).toBe("0.01");
  });

  it("holds when evidence is insufficient", () => {
    const policy = demoPolicy(recipient);
    const decision = decide(assessEvidence(rejectedSignals(now), policy, now), policy);
    expect(decision).toMatchObject({ approved: false, action: "hold", amount: "0" });
  });
});
