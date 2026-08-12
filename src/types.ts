export type HexAddress = `0x${string}`;

export interface RiskSignal {
  id: string;
  source: string;
  domain: string;
  official: boolean;
  observedAt: string;
  asset: string;
  priceUsd: number;
  kind: "oracle" | "dex" | "risk-feed";
}

export interface TreasuryPolicy {
  asset: string;
  safeAsset: string;
  maxDeviationBps: number;
  minIndependentSources: number;
  minOfficialSources: number;
  maxSignalAgeMinutes: number;
  maxActionAmount: string;
  chainId: number;
  recipientAddress: HexAddress;
}

export interface EvidenceAssessment {
  confirmed: boolean;
  medianPriceUsd: number;
  deviationBps: number;
  independentSources: number;
  officialSources: number;
  accepted: RiskSignal[];
  rejected: Array<{ signal: RiskSignal; reason: string }>;
  reasons: string[];
}

export interface GuardDecision {
  approved: boolean;
  action: "hold" | "escape-transfer";
  amount: string;
  reason: string;
  riskScore: number;
}

export interface TransferIntent {
  incidentId: string;
  chainId: number;
  recipientAddress: HexAddress;
  amount: string;
  tokenAddress?: HexAddress;
}

export interface KeeperHubReceipt {
  transactionHash?: string;
  transactionLink?: string;
  verified?: boolean;
  receiptStatus?: string;
  blockNumber?: string | number;
  gasUsed?: string;
  sponsored?: boolean;
}

export interface ExecutionProof {
  executionId: string;
  status: string;
  transactionHash?: string;
  transactionLink?: string;
  verified: boolean;
  receiptStatus?: string;
  blockNumber?: string | number;
  gasUsed?: string;
  sponsored?: boolean;
  independentlyVerified?: boolean;
  idempotentReplay?: boolean;
}

export type IncidentStage =
  | "received"
  | "evidence-rejected"
  | "policy-rejected"
  | "intent-persisted"
  | "simulated"
  | "broadcast"
  | "unconfirmed"
  | "completed"
  | "failed";

export interface AuditEvent {
  incidentId: string;
  stage: IncidentStage;
  at: string;
  detail: Record<string, unknown>;
}

export interface IncidentResult {
  incidentId: string;
  assessment: EvidenceAssessment;
  decision: GuardDecision;
  proof?: ExecutionProof;
}
