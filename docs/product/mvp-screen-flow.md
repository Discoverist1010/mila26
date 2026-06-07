# MVP Screen Flow

The current implemented screen is the MILA26 lifecycle workspace. It is aligned to the latest mockup direction but is not intended to be pixel-perfect.

The mockup-driven lifecycle workspace and all user-stated lifecycle flows are in MVP scope. Some screens are implemented, some are parameter/template-only next steps, and some remain unavailable until their code, adapter, authorization, and evidence gates are complete.

Prototype screens must be functional where shown as implemented. A tab is not complete merely because it looks correct; it must read/write shared lifecycle state, validate user input, update dependent workspace surfaces, and have focused test coverage.

## 1. Workspace Overview

- User goal: start or continue a tokenised financial product workspace.
- Primary UI: lifecycle tabs, large Engineering Bot answer area, next best action, lifecycle snapshot.
- Current status: implemented.
- Guardrail: the tabs are visual only; code uses shared lifecycle state.

## 2. Product Setup

- User goal: turn plain-language product intent into a Requirement Brief.
- Primary UI: Engineering Bot and central primary action.
- Current status: implemented.
- Guardrail: Requirement Brief is an engineering/product artifact, not legal/compliance approval.

## 3. Investor Wallets

- User goal: define or generate up to 50 investor wallet addresses that can be whitelisted and used for prototype investor activity.
- Primary UI: Investor Wallets tab with Test Wallet Lab, wallet rows, validation, duplicate detection, local-session whitelist status, activity-console placeholders, Contract Ops Whitelist Wallet handoff, and Allocation/Mint handoff.
- Current status: implemented for manual entry, generated test investor wallet packs, explicit test-only export preparation, Contract Ops Whitelist Wallet handoff, Allocation/Mint handoff, and Contract Ops funding-helper targets.
- Gap: no CSV/import/export beyond the explicit test-only wallet export, off-chain investor profile fields, or durable registry persistence yet.

## 4. Subscription

- User goal: define permitted stablecoins, subscription window, minimum subscription, payment wallet/contract address, and payment per token.
- Primary UI: Subscription tab parameter panel, validation status, lifecycle snapshot, Product Vault status, and Engineering Bot next action.
- Current status: implemented for local-session parameter capture and subscription-redemption template handoff input.
- Guardrail: no subscription smart-contract template execution yet.

## 5. Contract Ops

- User goal: prepare/review the smart-contract artifact spec, deterministic preview, local compile/test representation, deployment gate, wallet-signed deployment path, and released wallet-signed operations.
- Backend/API:
  - `POST /api/smart-contract/artifact-spec`
  - `POST /api/smart-contract/artifact`
- Current status: implemented through generated artifacts and the focused Contract Ops workspace.
- Guardrail: preview/check/local compile-test status is not audit, mainnet, or production readiness.

## 6. Asset Servicing

- User goal: record NAV and later push investor information such as valuation, investment information, corporate actions, and notices.
- Primary UI: visual tab plus Record NAV Event in Contract Ops after confirmed deployment evidence.
- Current status: Record NAV Event implemented; broader investor updates are future.
- Guardrail: current NAV operation evidence is local-session-only.

## 7. Redemption

- User goal: configure redemption dates/windows, redemption delay, redemption wallet, and stablecoin payout mechanics.
- Primary UI: Redemption tab parameter panel, validation status, lifecycle snapshot, Product Vault status, and Engineering Bot next action.
- Current status: implemented for local-session parameter capture and subscription-redemption template handoff input.
- Guardrail: no redemption wallet payout execution exists yet.

## 8. Maturity

- User goal: close out all outstanding tokens at product maturity.
- Primary UI: visual tab today.
- Current status: future maturity closeout flow.
- Guardrail: no forced final redemption execution exists yet.

## 9. Evidence

- User goal: inspect local-session evidence and generated artifacts.
- Primary UI: Product Vault, Recent Activity, generated artifacts, Contract Ops evidence summary, durable evidence save/load controls.
- Current status: local-session evidence implemented for deployment, Record NAV, Whitelist Wallet, and Allocation / Mint.
- Gap: durable Evidence Vault persistence remains future.

## Current Wallet/Blockchain Execution Flow

1. Connect MetaMask/injected EIP-1193 wallet.
2. Verify Sepolia chain.
3. Prepare unsigned deployment intent.
4. Request wallet-signed Sepolia deployment.
5. Display transaction hash only after provider return.
6. Display contract address only after successful receipt.
7. Derive local-session deployment evidence.
8. Unlock only operation-specific Contract Ops controls:
   - Record NAV Event;
   - Whitelist Wallet;
   - Allocation / Mint after the selected investor wallet is whitelisted and allocation parameters are coherent.
9. Use the Sepolia funding helper to copy issuer/admin, generated investor, payment, and redemption addresses for manual test funding/setup.

All other operations remain unavailable until explicitly implemented, gated, and tested.
