# MVP Screen Flow

The current implemented screen is the MILA26 lifecycle workspace. It is aligned to the latest mockup direction but is not intended to be pixel-perfect.

## 1. Workspace Overview

- User goal: start or continue a tokenised financial product workspace.
- Primary UI: lifecycle tabs, large Engineering Bot answer area, next best action, lifecycle snapshot.
- Current status: implemented.
- Guardrail: the tabs are visual only; code uses shared lifecycle state.

## 2. Requirements

- User goal: turn plain-language product intent into a Requirement Brief.
- Primary UI: Engineering Bot and central primary action.
- Current status: implemented.
- Guardrail: Requirement Brief is an engineering/product artifact, not legal/compliance approval.

## 3. Investor Registry

- User goal: define up to 50 investor wallet addresses that can be whitelisted.
- Primary UI: visual tab and suggested action today; wallet whitelist operation exists in SCP after deployment evidence.
- Current status: partially implemented through Whitelist Wallet operation and read models.
- Gap: no full investor registry CRUD or import/export table yet.

## 4. Subscription

- User goal: define permitted stablecoins, subscription window, minimum subscription, payment wallet/contract address, and payment per token.
- Primary UI: visual tab and suggested action today.
- Current status: future parameter/template flow.
- Guardrail: no subscription smart-contract template execution yet.

## 5. Smart Contract

- User goal: prepare/review the smart-contract artifact spec, deterministic preview, local compile/test representation, deployment gate, and wallet-signed deployment path.
- Backend/API:
  - `POST /api/smart-contract/artifact-spec`
  - `POST /api/smart-contract/artifact`
- Current status: implemented through generated artifacts and SCP.
- Guardrail: preview/check/local compile-test status is not audit, mainnet, or production readiness.

## 6. Asset Servicing

- User goal: record NAV and later push investor information such as valuation, investment information, corporate actions, and notices.
- Primary UI: visual tab plus Record NAV Event in SCP after confirmed deployment evidence.
- Current status: Record NAV Event implemented; broader investor updates are future.
- Guardrail: current NAV operation evidence is local-session-only.

## 7. Redemption

- User goal: configure redemption dates/windows, redemption delay, redemption wallet, and stablecoin payout mechanics.
- Primary UI: visual tab and suggested action today.
- Current status: future subscription-redemption template parameters.
- Guardrail: no redemption wallet payout execution exists yet.

## 8. Maturity

- User goal: close out all outstanding tokens at product maturity.
- Primary UI: visual tab today.
- Current status: future maturity closeout flow.
- Guardrail: no forced final redemption execution exists yet.

## 9. Evidence

- User goal: inspect local-session evidence and generated artifacts.
- Primary UI: Product Vault, Recent Activity, generated artifacts, SCP evidence sections.
- Current status: local-session evidence implemented for deployment, Record NAV, and Whitelist Wallet.
- Gap: durable Evidence Vault persistence remains future.

## Current Wallet/Blockchain Execution Flow

1. Connect MetaMask/injected EIP-1193 wallet.
2. Verify Sepolia chain.
3. Prepare unsigned deployment intent.
4. Request wallet-signed Sepolia deployment.
5. Display transaction hash only after provider return.
6. Display contract address only after successful receipt.
7. Derive local-session deployment evidence.
8. Unlock only operation-specific SCP controls:
   - Record NAV Event;
   - Whitelist Wallet.

All other operations remain locked until explicitly implemented and tested.
