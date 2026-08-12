import { describe, expect, it } from "vitest";
import { assessEvidence } from "../src/evidence.js";
import { confirmedSignals, demoPolicy, rejectedSignals } from "../src/fixtures.js";

const recipient = "0x0000000000000000000000000000000000000001" as const;

describe("evidence gate", () => {
  it("approves fresh, independent signals with official confirmation", () => {
    const now = new Date("2026-08-12T09:00:00Z");
    const result = assessEvidence(confirmedSignals(now), demoPolicy(recipient), now);
    expect(result.confirmed).toBe(true);
    expect(result.independentSources).toBe(3);
    expect(result.officialSources).toBe(2);
    expect(result.deviationBps).toBe(290);
  });

  it("does not let one noisy source move funds", () => {
    const now = new Date("2026-08-12T09:00:00Z");
    const result = assessEvidence(rejectedSignals(now), demoPolicy(recipient), now);
    expect(result.confirmed).toBe(false);
    expect(result.reasons).toContain("insufficient independent sources");
    expect(result.reasons).toContain("no official confirmation");
  });

  it("deduplicates domains and rejects stale evidence", () => {
    const now = new Date("2026-08-12T09:00:00Z");
    const signals = confirmedSignals(now);
    signals[1] = { ...signals[1], domain: signals[0].domain };
    signals[2] = { ...signals[2], observedAt: "2026-08-12T08:00:00Z" };
    const result = assessEvidence(signals, demoPolicy(recipient), now);
    expect(result.confirmed).toBe(false);
    expect(result.rejected.map((entry) => entry.reason)).toEqual(["duplicate domain", "stale signal"]);
  });
});
