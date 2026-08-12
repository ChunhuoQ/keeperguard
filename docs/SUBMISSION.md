# DoraHacks submission copy

## Project name

KeeperGuard

## Tagline

Evidence-gated autonomous treasury defense with verified execution through KeeperHub.

## Short description

KeeperGuard confirms onchain risk across independent sources, enforces deterministic treasury
policy, and executes a safe response through KeeperHub. Every action is simulated, idempotent,
audited, receipt-verified, and independently checked onchain.

## Full description

Autonomous incident response has two catastrophic failure modes: acting on one bad signal and
repeating a transaction whose outcome is unknown. KeeperGuard is designed around both.

Signals must be fresh, asset-specific, and domain-independent, with at least one official source.
A deterministic policy then limits the chain, recipient, deviation threshold, and maximum amount.
Approved intent is written to disk before execution and bound to a stable idempotency key.

KeeperHub handles the last mile: preflight simulation, organization-wallet signing, sponsored
gas, broadcast, status tracking, and a verified onchain receipt. KeeperGuard does not claim
success from an accepted request or hash alone. It requires a completed execution with
`verified: true` and `receiptStatus: success`, then verifies the same transaction through an
independent Base Sepolia RPC.

The public proof is a real KeeperHub-sponsored Base Sepolia transaction. The first run moves zero
value to the organization wallet on purpose, demonstrating the full execution path without asking
new builders for faucet funds or putting capital at risk.

The repository also includes a reusable headless onboarding flow that creates a dedicated SIWE
identity, organization API key, organization wallet, and verified first transaction. This starter
path targets the Best Onboarding UX Improvement bounty.

## What we used from KeeperHub

- Headless SIWE and organization wallet provisioning
- API key step-up flow
- Direct Execution API
- KeeperHub Workflow with an on-platform Condition branch
- Preflight simulation
- Deterministic idempotency
- Gas sponsorship on Base Sepolia
- Execution status and audit metadata
- Verified receipts and transaction links

## Proof transaction

https://sepolia.basescan.org/tx/0x2949e29d5aa0c5c84b1fb3331864db69ac6735335dde78ed90a33d3a32287c15

## Links to attach

- Source: https://github.com/ChunhuoQ/keeperguard
- Demo: https://github.com/ChunhuoQ/keeperguard/releases/download/v0.1.0/keeperguard-demo.mp4
- Live app: TO_BE_MADE_PUBLIC
