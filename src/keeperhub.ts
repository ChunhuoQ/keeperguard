import { createHash } from "node:crypto";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import type { ExecutionProof, KeeperHubReceipt, TransferIntent } from "./types.js";

interface JsonResponse<T> {
  status: number;
  body: T;
  pollHint?: number;
}

export function stableIntentKey(intent: TransferIntent): string {
  const canonical = [
    intent.incidentId.trim().replaceAll("%", "%25").replaceAll("|", "%7C"),
    String(intent.chainId),
    intent.recipientAddress.toLowerCase(),
    intent.amount,
    intent.tokenAddress?.toLowerCase() ?? "native",
  ].join("|");
  return `keeperguard-${createHash("sha256").update(canonical).digest("hex").slice(0, 40)}`;
}

export class KeeperHubClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = "https://app.keeperhub.com",
    private readonly rpcUrl = "https://sepolia.base.org",
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private async api<T>(path: string, init: RequestInit = {}): Promise<JsonResponse<T>> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(init.headers as Record<string, string> | undefined),
      },
    });
    const text = await response.text();
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = { error: text.slice(0, 500) }; }
    return {
      status: response.status,
      body: body as T,
      pollHint: Number(response.headers.get("x-poll-interval-hint") ?? "1"),
    };
  }

  async listChains(): Promise<unknown> {
    const response = await this.api<unknown>("/api/chains");
    if (response.status >= 400) throw new Error(`KeeperHub chains: ${response.status} ${JSON.stringify(response.body)}`);
    return response.body;
  }

  async simulate(intent: TransferIntent): Promise<Record<string, unknown>> {
    const response = await this.api<Record<string, unknown>>("/api/execute/transfer", {
      method: "POST",
      body: JSON.stringify({
        chainId: intent.chainId,
        recipientAddress: intent.recipientAddress,
        amount: intent.amount,
        ...(intent.tokenAddress ? { tokenAddress: intent.tokenAddress } : {}),
        simulate: true,
      }),
    });
    if (response.status >= 400 || response.body.wouldRevert || response.body.success === false) {
      throw new Error(`KeeperHub simulation rejected: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return response.body;
  }

  async broadcast(intent: TransferIntent, idempotencyKey: string): Promise<{ executionId: string; idempotentReplay?: boolean }> {
    const response = await this.api<{ executionId?: string; idempotentReplay?: boolean; error?: string }>(
      "/api/execute/transfer",
      {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({
          chainId: intent.chainId,
          recipientAddress: intent.recipientAddress,
          amount: intent.amount,
          ...(intent.tokenAddress ? { tokenAddress: intent.tokenAddress } : {}),
        }),
      },
    );
    if (response.status >= 400 || !response.body.executionId) {
      throw new Error(`KeeperHub broadcast rejected: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return { executionId: response.body.executionId, idempotentReplay: response.body.idempotentReplay };
  }

  async waitForProof(executionId: string, timeoutMs = 90_000): Promise<ExecutionProof> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const response = await this.api<Record<string, unknown>>(`/api/execute/${executionId}/status`);
      if (response.status >= 400) throw new Error(`KeeperHub status: ${response.status} ${JSON.stringify(response.body)}`);
      const status = String(response.body.status ?? "unknown");
      const receipts = Array.isArray(response.body.receipts) ? response.body.receipts as KeeperHubReceipt[] : [];
      const receipt = receipts[receipts.length - 1];
      const transactionHash = String(receipt?.transactionHash ?? response.body.transactionHash ?? "") || undefined;
      const transactionLink = String(receipt?.transactionLink ?? response.body.transactionLink ?? "") || undefined;
      if (status === "completed") {
        const verified = receipt?.verified === true && receipt.receiptStatus === "success";
        const independentlyVerified = transactionHash ? await this.verifyOnchain(transactionHash) : false;
        return {
          executionId,
          status,
          transactionHash,
          transactionLink,
          verified,
          receiptStatus: receipt?.receiptStatus,
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed,
          sponsored: receipt?.sponsored ?? (response.body.sponsored as boolean | undefined),
          independentlyVerified,
        };
      }
      if (["failed", "cancelled"].includes(status)) {
        throw new Error(`KeeperHub execution ${status}: ${JSON.stringify(response.body)}`);
      }
      const waitSeconds = Number.isFinite(response.pollHint) ? Math.max(0.5, response.pollHint ?? 1) : 1;
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
    }
    return { executionId, status: "unconfirmed", verified: false };
  }

  private async verifyOnchain(transactionHash: string): Promise<boolean> {
    if (!/^0x[0-9a-fA-F]{64}$/.test(transactionHash)) return false;
    const client = createPublicClient({ chain: baseSepolia, transport: http(this.rpcUrl) });
    try {
      const receipt = await client.getTransactionReceipt({ hash: transactionHash as `0x${string}` });
      return receipt.status === "success";
    } catch {
      return false;
    }
  }
}
