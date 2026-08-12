import type { EvidenceAssessment, GuardDecision, TreasuryPolicy } from "./types.js";

export function decide(assessment: EvidenceAssessment, policy: TreasuryPolicy): GuardDecision {
  if (!assessment.confirmed) {
    return {
      approved: false,
      action: "hold",
      amount: "0",
      riskScore: Math.min(99, Math.round(assessment.deviationBps / 2)),
      reason: assessment.reasons.join("; ") || "evidence gate rejected the incident",
    };
  }
  const sourceStrength = Math.min(25, assessment.independentSources * 8 + assessment.officialSources * 5);
  const deviationStrength = Math.min(75, Math.round(assessment.deviationBps / 2));
  return {
    approved: true,
    action: "escape-transfer",
    amount: policy.maxActionAmount,
    riskScore: Math.min(100, sourceStrength + deviationStrength),
    reason: `${assessment.independentSources} independent sources confirmed ${assessment.deviationBps} bps deviation`,
  };
}
