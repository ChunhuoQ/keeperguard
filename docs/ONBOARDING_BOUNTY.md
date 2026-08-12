# Onboarding contribution: zero secrets on screen, zero funds for the first proof

KeeperGuard includes a reusable headless onboarding path intended for the KeeperHub **Best
Onboarding UX Improvement** bounty.

## Builder friction addressed

The first integration usually stalls at four places:

1. mistaking the SIWE login wallet for the organization execution wallet;
2. requiring a browser or CAPTCHA for an autonomous/CI setup;
3. trying a positive-value transfer before the new organization wallet has funds;
4. treating `202 Accepted` as a verified transaction.

## Contribution

`src/onboarding.ts` turns those into one safe sequence:

```bash
npm run wallet:init
npm run keeperhub:onboard
npm run preflight
npm run proof
```

- Generates a competition-only EOA locally and writes it to an ignored mode-0600 `.env`.
- Signs in through SIWE, which creates the KeeperHub account without a CAPTCHA.
- Handles the API-key step-up challenge correctly and stores the key only once.
- Polls until the distinct organization wallet is available and prints only public addresses.
- Uses a sponsored zero-value Base Sepolia self-transfer for the first real mined proof.
- Requires the authoritative KeeperHub receipt and verifies the same hash through a second RPC.

This is directly reusable as a starter template for autonomous agents and CI runners. It gets a
new builder from an empty directory to a real KeeperHub transaction without requesting testnet
funds, exposing a private key, or teaching unsafe retry semantics.

## Reproducible outcome

The starter path was run from a new local identity against the production KeeperHub API on
2026-08-12. It provisioned a distinct organization wallet and completed a sponsored Base
Sepolia proof without faucet funds:

- Login identity: `0x6c601055152797bfec022805239f2767Cd079db1`
- Organization wallet: `0x9257137065e06b28925314f18a1ec6d9cab9d34d`
- Direct-execution ID: `xkcwcmw7ynga2mo28z7rf`
- Verified transaction: [`0x66446f…78a2a`](https://sepolia.basescan.org/tx/0x66446f82f1bc62733e7694363b8c3f89f294e829b07ffbdd7e097f0a24778a2a)
- Receipt: `completed`, `verified: true`, `receiptStatus: success`
- Independent Base Sepolia RPC check: passed

The full public result is stored in `data/live-proof.json`. No private key, API key, session
cookie, or signature is included.

## Before and after

| Builder task | Manual path | KeeperGuard starter |
|---|---|---|
| Create a safe identity | Choose tooling and protect a key manually | One command; ignored mode-0600 file |
| Understand wallet roles | Easy to confuse login and execution wallets | Both public addresses are named separately |
| Obtain programmatic auth | Dashboard navigation and one-time key copy | SIWE step-up handled and secret stored once |
| Fund the first test | Find a faucet and wait | Not required for the zero-value proof |
| Decide whether execution succeeded | Interpret `202`, poll status, inspect receipt | One command enforces all completion checks |
| Avoid a duplicate after uncertainty | Builder-specific retry logic | Stable intent-bound idempotency by default |

The improvement is therefore not merely fewer clicks. It installs the correct reliability
semantics at the moment a new builder is most likely to copy an unsafe example into an agent.

## Suggested upstream improvements

- Add a first-class `kh onboard --headless` command that wraps SIWE, key creation, and wallet wait.
- Make the organization-wallet vs login-wallet distinction part of every first-write response.
- Offer `kh proof --testnet` to perform a zero-value sponsored self-transfer and print a verified
  receipt checklist.
- Return a compact machine-readable verification object suitable for demos and CI attestations.
