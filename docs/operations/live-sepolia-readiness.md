# Live Sepolia Readiness And Evidence Vault Inputs

Status: Sprint 14A/14B opt-in foundation.

## Purpose

This workflow validates public Sepolia artefacts before MILA26 relies on them in prototype demos. It is explicitly opt-in and must not make normal tests depend on MetaMask, private keys, external RPC, or a running API server.

Run normal validation with:

```bash
npm run check
```

Run live Sepolia validation only when public testnet inputs are ready:

```bash
LIVE_SEPOLIA=1 npm run test:live-sepolia
```

The script also reads `.env` in the repo root. Shell environment values override `.env` values.

## Required Public Inputs

Add these only when ready to run live checks:

```bash
LIVE_SEPOLIA=1
MILA26_SEPOLIA_ISSUER_ADMIN_ADDRESS=0x...
MILA26_SEPOLIA_PAYMENT_ADDRESS=0x...
MILA26_SEPOLIA_REDEMPTION_WALLET_ADDRESS=0x...
MILA26_SEPOLIA_INVESTOR_ADDRESSES=0x...,0x...,0x...
```

Use public Sepolia addresses only.

Do not add:

- private keys;
- seed phrases;
- generated test wallet private-key exports;
- personal/mainnet wallet artefacts;
- production RPC secrets unless the service is intended for local testing.

## Optional RPC Checks

To validate Sepolia chain id and public address balances:

```bash
MILA26_SEPOLIA_RPC_URL=https://...
```

The harness checks:

- the RPC reports Sepolia chain id `0xaa36a7`;
- issuer/admin, payment, redemption, and representative investor addresses have readable balances;
- no private key or wallet signature is needed.

## Optional Evidence Vault Save

To fetch live transaction receipts and save provider-derived evidence records through the existing Evidence Vault API:

```bash
MILA26_LIVE_EVIDENCE_API_BASE_URL=http://127.0.0.1:5174
MILA26_LIVE_EVIDENCE_PROJECT_ID=usequities
MILA26_SEPOLIA_DEPLOYMENT_TX_HASH=0x...
MILA26_SEPOLIA_RECORD_NAV_TX_HASH=0x...
MILA26_SEPOLIA_WALLET_WHITELIST_TX_HASH=0x...
MILA26_SEPOLIA_ALLOCATION_MINT_TX_HASH=0x...
```

Before saving evidence, a workspace snapshot must already exist for the configured project id. The API will reject evidence saves if no workspace snapshot exists.

## Evidence Provenance Rules

Durable Evidence Vault records must preserve provenance:

- transaction hash source must be `provider_returned`;
- receipt source must be `provider_receipt` when a receipt is used;
- confirmed deployment contract address must be `receipt_returned`;
- operation contract address must be `confirmed_deployment_evidence`, because operation receipts do not deploy the contract;
- pending transaction hashes remain `submitted` evidence and must not be upgraded to confirmed without a successful receipt.

## Guided Follow-Up Inputs

When ready, provide:

1. Sepolia RPC URL, if you want live chain/balance/receipt checks.
2. Issuer/admin public wallet address.
3. Payment public wallet or contract address.
4. Redemption wallet public address.
5. Three to five representative investor public wallet addresses.
6. Optional deployment transaction hash after a real Sepolia deployment.
7. Optional Record NAV transaction hash after a real Sepolia operation.
8. Optional Wallet Whitelist transaction hash after a real Sepolia operation.
9. Optional Allocation/Mint transaction hash after a real Sepolia operation.
10. Evidence project id and API base URL only when you want the script to save records through the Evidence Vault API.

## Tab-By-Tab Follow-On Planning

Detailed Sprint 15 audit output now lives in `docs/product/workspace-tab-audit.md`. Use that document as the source for the Sprint 16 workspace completion backlog.

Before expanding functionality beyond the current live Sepolia/evidence foundation, review each tab one by one:

| Tab | Actions | Status | Information | Artefacts / persistence |
|---|---|---|---|---|
| Overview | Ask Engineering/Advisor, choose next action | Shared lifecycle readiness | AI answer, lifecycle summary | Conversation local-session; generated artefacts can be saved through Evidence Vault paths where supported |
| Product Setup | Requirement and engineering brief generation | Draft/ready/needs review | Product facts, assumptions, open questions | Requirement Brief, Engineering Brief, generated artefact records |
| Investor Wallets | Register/generate wallets, select for whitelist/allocation | Valid, duplicate, whitelisted local session | Up to 50 wallet rows | Workspace snapshot investor wallet rows; no private-key persistence |
| Subscription | Capture permitted stablecoins and payment terms | Parameters needed/ready | Stablecoin/payment inputs | Workspace snapshot lifecycle state |
| Contract Ops | Deploy, Record NAV, Whitelist Wallet, Allocation/Mint | Gated by wallet, deployment, ABI, lifecycle state, evidence | Operation summaries and evidence state | Durable Evidence Vault records after provider-derived hashes/receipts |
| Asset Servicing | NAV/update pathway | Current Record NAV operation status | Valuation and reference info | Record NAV evidence records |
| Redemption | Capture redemption delay, wallet, payout terms | Parameters needed/ready | Redemption wallet and delay | Workspace snapshot lifecycle state; future redemption evidence contract |
| Maturity | Capture closeout intent | Future/needs parameters | Maturity date and closeout method | Workspace snapshot lifecycle state; future closeout evidence contract |
| Evidence Vault | Save/load evidence and generated artefacts | Durable/current/historical/stale | Evidence and artefact records | SQLite-backed local MVP persistence |

This review should confirm that every visible active button is wired to state, validation, tests, and the correct persistence owner. Tabs remain visual separators only; shared lifecycle state remains the cross-tab source of truth.
