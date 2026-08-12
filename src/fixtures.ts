import type { RiskSignal, TreasuryPolicy } from "./types.js";

export const demoPolicy = (recipientAddress: `0x${string}`): TreasuryPolicy => ({
  asset: "USDX",
  safeAsset: "USDC",
  maxDeviationBps: 100,
  minIndependentSources: 2,
  minOfficialSources: 1,
  maxSignalAgeMinutes: 10,
  maxActionAmount: "0",
  chainId: 84532,
  recipientAddress,
});

export function confirmedSignals(now = new Date()): RiskSignal[] {
  return [
    { id: "oracle-1", source: "Protocol Oracle", domain: "oracle.example", official: true, observedAt: now.toISOString(), asset: "USDX", priceUsd: 0.972, kind: "oracle" },
    { id: "dex-1", source: "Independent DEX TWAP", domain: "dex.example", official: false, observedAt: now.toISOString(), asset: "USDX", priceUsd: 0.968, kind: "dex" },
    { id: "risk-1", source: "Risk Council", domain: "risk.example", official: true, observedAt: now.toISOString(), asset: "USDX", priceUsd: 0.971, kind: "risk-feed" },
  ];
}

export function rejectedSignals(now = new Date()): RiskSignal[] {
  return [
    { id: "rumour-1", source: "Unverified Social Post", domain: "social.example", official: false, observedAt: now.toISOString(), asset: "USDX", priceUsd: 0.94, kind: "risk-feed" },
  ];
}
