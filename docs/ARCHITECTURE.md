# KeeperGuard architecture

## Trust boundary

Signals are untrusted facts. They may influence an assessment but cannot directly authorize a
write. Policy is deterministic and KeeperHub is the only execution layer.

| Boundary | Invariant |
|---|---|
| Signal → evidence | Fresh, correct asset, unique domain, minimum independent and official sources |
| Evidence → policy | Deviation must cross the configured threshold |
| Policy → intent | Asset, chain, recipient and amount remain explicitly bounded |
| Intent → KeeperHub | Journal and deterministic idempotency key exist before broadcast |
| KeeperHub → success | Completed plus verified successful receipt plus independent RPC receipt |

## State machine

```text
received
  ├── evidence-rejected
  └── intent-persisted
          ├── simulation failure → failed / no broadcast
          └── simulated
                 └── broadcast
                       ├── unconfirmed → freeze and reconcile
                       ├── failed
                       └── completed → independently verified
```

## KeeperHub usage

KeeperGuard uses KeeperHub's Direct Execution surface because the emergency action is produced
at incident time. The same reliability contract can be deployed as a scheduled or event-triggered
KeeperHub Workflow once the data feeds and production treasury policy are configured.

The hackathon deployment also includes Workflow `tg0nwoz9j4v8wbtnkdrbv`: Manual Incident trigger
→ KeeperHub Condition (`riskScore >= 80`) → Base Sepolia Escape Transfer. A rejected run
(`dk0z2ywwpdacc9czz44qf`) produced no transaction; the approved run
(`pl2mb4yxbktlgb7egmsd3`) produced a verified successful receipt.

- `/api/chains` for enabled-chain preflight.
- `/api/execute/transfer` with `simulate: true`.
- `/api/execute/transfer` with a stable `Idempotency-Key`.
- `/api/execute/{executionId}/status` with `X-Poll-Interval-Hint`.
- receipt fields `verified`, `receiptStatus`, `blockNumber`, `gasUsed`, and `sponsored`.

The first public proof uses Base Sepolia gas sponsorship and a zero-value self-transfer. It is not
a mock: it exercises KeeperHub's organization wallet, signer, sponsor, relayer, chain receipt,
and independent RPC verification.
