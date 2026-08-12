# KeeperGuard — 3-minute finalist pitch

## 0:00–0:25 — Problem

Agents can detect risk, but autonomous treasury defense is dangerous. One bad feed can move
funds, and one blind retry can move them twice. Existing demos often stop at “request accepted.”

## 0:25–0:50 — Thesis

KeeperGuard turns incident response into four gates: evidence, policy, simulation, and proof.
KeeperHub is not a bolt-on transaction button—it is the reliability layer that makes the final
two gates possible.

## 0:50–1:45 — Live demo

1. Show the one-source rumor: 600 bps deviation, but KeeperGuard refuses to act.
2. Show three independent signals, including two official sources: median is $0.971.
3. Show the deterministic policy: threshold, chain, recipient, and amount cap.
4. Run the incident replay: intent persisted, simulation passes, idempotent broadcast starts.
5. Open the Base Sepolia transaction and KeeperHub receipt.

## 1:45–2:25 — Reliability

- Same semantic transaction from simulation to broadcast.
- Intent-derived idempotency key is persisted before execution.
- `unconfirmed` means stop and reconcile, not “retry with a new key.”
- Success requires KeeperHub's verified receipt and a second RPC.
- Every stage is written to an append-only audit trail.

## 2:25–2:50 — Why KeeperHub

KeeperHub supplies the organization wallet, sponsored gas, simulation, idempotency, execution
state, and authoritative receipt. Without that reliability surface KeeperGuard would be a risk
detector, not an onchain response agent.

## 2:50–3:00 — Close

KeeperGuard demonstrates the last mile the hackathon asks for: evidence becomes policy, policy
becomes a real transaction, and the transaction becomes proof.
