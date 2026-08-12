# KeeperGuard

> Evidence first. Execution guaranteed.

KeeperGuard is an autonomous treasury incident-response agent. It requires fresh,
independent evidence—including at least one official source—before a treasury policy can
authorize an onchain action. Approved actions are simulated, broadcast, and verified through
[KeeperHub](https://keeperhub.com/). Ambiguous outcomes stop the agent instead of triggering a
dangerous duplicate transfer.

Built for the [KeeperHub Agents Onchain Hackathon](https://dorahacks.io/hackathon/agents-onchain/detail).

## Verified onchain proof

- Network: Base Sepolia (`84532`)
- KeeperHub execution: `xkcwcmw7ynga2mo28z7rf`
- Status: `completed`
- Receipt: `verified: true`, `receiptStatus: success`
- Gas: KeeperHub-sponsored
- Independent RPC verification: passed
- Transaction: [0x66446f82…778a2a](https://sepolia.basescan.org/tx/0x66446f82f1bc62733e7694363b8c3f89f294e829b07ffbdd7e097f0a24778a2a)

The first proof intentionally moves zero native tokens to the KeeperHub organization wallet.
It is a real mined transaction that proves the complete signing, sponsorship, broadcast,
receipt, and independent-verification path without putting funds at risk. Set an explicit
non-zero policy cap only after funding the organization wallet.

## Why it exists

An alert is not an execution policy. A single bad price feed, stale report, duplicated news
domain, or retry after a network timeout can turn an automated defense system into the attack.
KeeperGuard separates the system into four enforceable gates:

1. **Evidence:** fresh data, unique domains, minimum independent sources, official confirmation.
2. **Policy:** explicit asset, deviation threshold, chain, recipient, and maximum amount.
3. **Preflight:** KeeperHub simulation must report that the unchanged transaction will not revert.
4. **Proof:** the execution is complete only after a verified successful receipt and an independent RPC check.

## Execution lifecycle

```text
oracle + DEX TWAP + risk feed
             │
             ▼
 freshness / independence / official-source gate
             │
             ▼
 treasury policy and amount cap
             │
             ▼
 persist canonical intent + deterministic idempotency key
             │
             ▼
 KeeperHub simulate → broadcast → poll using server hint
             │
             ▼
 verified KeeperHub receipt + independent Base RPC receipt
```

KeeperGuard treats `queued`, `simulated`, `broadcast`, `unconfirmed`, and `completed` as
different states. A timeout or missing receipt is `unconfirmed`, never `failed`, so the agent
does not create a second transaction while the first may still land.

## Quickstart

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm test
npm run check
npm run demo
```

The offline demo proves both branches: three-source confirmation approves a policy-bounded
intent, while a large deviation reported by one unverified source is rejected.

### Zero to a verified KeeperHub transaction

Create a dedicated local login wallet. Never use a personal wallet or another competition's
credentials.

```bash
npm run wallet:init
npm run keeperhub:onboard
npm run preflight
npm run proof
```

`keeperhub:onboard` uses KeeperHub's headless SIWE flow, creates an organization API key, and
waits for the separate organization wallet. Secrets are stored only in the ignored `.env` with
mode `0600`. `proof` then performs the safe first-write sequence:

1. persist the exact intent and stable idempotency key;
2. simulate the transfer;
3. broadcast the unchanged body once;
4. poll the execution while honoring KeeperHub's poll hint;
5. require `completed`, `verified: true`, and `receiptStatus: success`;
6. fetch the same receipt through an independent Base Sepolia RPC.

The proof command defaults to amount `0`. To enable a value-moving response, first fund the
KeeperHub organization wallet, configure a policy amount, review the recipient, then set
`LIVE_EXECUTION=true`.

## Failure model

| Failure | KeeperGuard behavior |
|---|---|
| One source reports a dramatic depeg | Reject: insufficient independent and official evidence |
| Same publisher appears twice | Count the domain once |
| Stale or future-dated observation | Reject that signal |
| Simulation would revert | Never broadcast |
| Client disconnects after broadcast | Recover the persisted intent and reuse the same key |
| Receipt is not yet readable | Mark unconfirmed and stop; never rotate the key |
| KeeperHub says completed but receipt is not successful | Do not claim success |
| KeeperHub receipt and independent RPC disagree | Surface verification failure |

## Repository map

- `src/evidence.ts` — evidence validation and median-price assessment.
- `src/policy.ts` — deterministic treasury policy decision.
- `src/state.ts` — atomic intent journal and append-only audit log.
- `src/keeperhub.ts` — simulation, idempotent broadcast, receipt polling, RPC verification.
- `src/agent.ts` — end-to-end incident lifecycle.
- `site/` — deployable interactive judge console.
- `docs/` — architecture, submission copy, pitch, and onboarding teardown.
- `test/` — evidence, policy, persistence/order, and KeeperHub adapter tests.

## Security

- No private key or KeeperHub API key is committed.
- An intent is persisted before any broadcast.
- Idempotency keys are deterministically bound to incident, chain, recipient, amount, and token.
- Simulation and execution use the same semantic body.
- Non-zero execution is opt-in and policy capped.
- An unconfirmed write freezes progression instead of retrying blindly.

## License

MIT
