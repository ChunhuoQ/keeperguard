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

## Suggested upstream improvements

- Add a first-class `kh onboard --headless` command that wraps SIWE, key creation, and wallet wait.
- Make the organization-wallet vs login-wallet distinction part of every first-write response.
- Offer `kh proof --testnet` to perform a zero-value sponsored self-transfer and print a verified
  receipt checklist.
- Return a compact machine-readable verification object suitable for demos and CI attestations.
