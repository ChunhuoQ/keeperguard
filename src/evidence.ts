import type { EvidenceAssessment, RiskSignal, TreasuryPolicy } from "./types.js";

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
};

export function assessEvidence(
  signals: RiskSignal[],
  policy: TreasuryPolicy,
  now = new Date(),
): EvidenceAssessment {
  const accepted: RiskSignal[] = [];
  const rejected: Array<{ signal: RiskSignal; reason: string }> = [];
  const seenDomains = new Set<string>();

  for (const signal of signals) {
    const ageMinutes = (now.getTime() - new Date(signal.observedAt).getTime()) / 60_000;
    let reason: string | undefined;
    if (signal.asset.toUpperCase() !== policy.asset.toUpperCase()) reason = "wrong asset";
    else if (!Number.isFinite(signal.priceUsd) || signal.priceUsd <= 0) reason = "invalid price";
    else if (ageMinutes < -1 || ageMinutes > policy.maxSignalAgeMinutes) reason = "stale signal";
    else if (seenDomains.has(signal.domain)) reason = "duplicate domain";

    if (reason) rejected.push({ signal, reason });
    else {
      accepted.push(signal);
      seenDomains.add(signal.domain);
    }
  }

  const medianPriceUsd = accepted.length ? median(accepted.map((signal) => signal.priceUsd)) : 1;
  const deviationBps = Math.round(Math.abs(1 - medianPriceUsd) * 10_000);
  const officialSources = accepted.filter((signal) => signal.official).length;
  const reasons: string[] = [];
  if (accepted.length < policy.minIndependentSources) reasons.push("insufficient independent sources");
  if (officialSources < policy.minOfficialSources) reasons.push("no official confirmation");
  if (deviationBps < policy.maxDeviationBps) reasons.push("deviation below policy threshold");

  return {
    confirmed: reasons.length === 0,
    medianPriceUsd,
    deviationBps,
    independentSources: accepted.length,
    officialSources,
    accepted,
    rejected,
    reasons,
  };
}
