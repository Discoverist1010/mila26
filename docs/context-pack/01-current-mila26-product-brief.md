# Current MILA26 Product Brief

## Product Summary

MILA26 is an AI + blockchain tokenisation workspace for asset managers moving from product intent to a controlled blockchain-functional alpha.

The current product direction is a lifecycle workspace for a restricted ERC-20-compatible tokenised financial product. The user can describe the product intent in plain language, and MILA26 structures the work across requirements, investor registry, subscription, smart contract, asset servicing, redemption, maturity, and evidence.

The app has moved past pure planning. It now supports wallet connection, Sepolia verification, wallet-signed Sepolia deployment, local-session deployment evidence, Record NAV Event, and Whitelist Wallet as narrow wallet-signed SCP operations. It is still not a production deployment, custody, legal/compliance, KYC/AML, audit, mainnet, stablecoin payment, or redemption execution system.

## Target User

The primary user is a small asset manager or tokenised-portfolio founder preparing a funding demo or internal technical review.

The product should make complex blockchain readiness understandable:

- what has been specified.
- what has been checked.
- what evidence exists.
- what is still blocked or parameter-missing.
- what the user wallet has signed.
- what the user wallet may sign next.
- why the backend never holds private keys.

## Target Product Flow

The intended tokenisation lifecycle is:

1. Define the financial product and investor rules.
2. Register up to 50 whitelisted investor wallet addresses.
3. Configure stablecoin subscription parameters.
4. Configure redemption parameters, including redemption delay and payout-per-token mechanics.
5. Generate or configure the subscription-redemption smart-contract template.
6. Deploy to Sepolia through the user's connected wallet.
7. Service the asset with NAV and future investor update events.
8. Redeem outstanding tokens at maturity.
9. Preserve evidence for wallet-signed actions.

## Current Guided User Journey

The current app supports:

1. Requirement Brief creation.
2. Engineering Brief generation.
3. Project Closure / Open Items readiness.
4. Smart Contract Artifact Spec generation.
5. Deterministic Smart Contract Artifact Preview.
6. Spec-consistency Check Result.
7. Evidence-Lite linkage.
8. Known local Hardhat compile/test representation.
9. Deployment Gate Review.
10. Wallet Signing Intent.
11. MetaMask-first wallet connection and Sepolia verification.
12. Unsigned Sepolia deployment intent review.
13. Wallet-signed Sepolia deployment.
14. Deployment evidence/readiness from provider transaction and receipt data.
15. Record NAV Event as a wallet-signed SCP operation.
16. Whitelist Wallet as a wallet-signed SCP operation.
17. Lifecycle workspace UI with visual tabs and shared presentation state.

The central Engineering Bot remains the active workflow decision surface. The right rail remains passive status/safety. The Smart Contract Control Panel owns wallet-signed operation controls only after the relevant gates are satisfied.

## Current Outputs

The app can produce or represent:

- Requirement Brief.
- Engineering Brief.
- Closure Ledger / closure readiness.
- Smart Contract Artifact Spec.
- deterministic Artifact Preview.
- Smart Contract Artifact Check Result.
- Evidence-Lite.
- local Hardhat compile/test result representation.
- Deployment Gate Review.
- Wallet Signing Intent.
- Wallet Connection Readiness.
- unsigned deployment intent.
- wallet-signed Sepolia deployment state.
- local-session deployment evidence.
- Record NAV Event operation evidence.
- Whitelist Wallet operation evidence.
- shared lifecycle workspace presentation state.

## Current Smart Contract Direction

The current alpha contract direction is:

- restricted ERC-20-compatible tokenised fund units.
- OpenZeppelin-based local fixture.
- AccessControl / issuer roles.
- Pausable behavior.
- wallet allowlisting.
- issuer-controlled allocation/minting.
- valuation event.
- distribution event.
- transfer restrictions.

The current smart-contract product direction is a predefined subscription-redemption template with configurable stablecoins, subscription window, redemption window, redemption wallet, payout-per-token amount, and redemption delay. Local-session parameter capture, template handoff readiness, and Allocation/Mint readiness now exist. Browser hardening and an operation-specific wallet-signed contract should come before allocation/mint execution.

## Current Wallet/Testnet Direction

MILA26 uses a MetaMask-first wallet connection path through a minimal EIP-1193 browser-provider boundary.

The app can request wallet-signed Sepolia deployment from the reviewed unsigned deployment intent. Transaction hash appears only after provider return, and contract address appears only after receipt-confirmed contract creation.

The app can request Record NAV Event and Whitelist Wallet operations only after confirmed deployment evidence, Sepolia wallet readiness, valid contract address checks, ABI inspection, and operation-specific input validation.

## Guardrails

- Backend never holds user private keys.
- User wallet signs deployment and operations.
- Sepolia/testnet only for alpha.
- Mainnet disabled.
- Wallet address appears only after real wallet connection.
- Transaction hash appears only after real transaction submission.
- Contract address appears only after real deployment receipt.
- SCP operations unlock only after wallet-signed deployment evidence and operation authorization gates.
- Operation evidence is local-session-only until durable Evidence Vault storage is explicitly implemented.
- No audit/security approval or production legal/compliance claim is made.

## What Should Not Be Lost

- Requirement-first workflow.
- Engineering Bot as the decision orchestrator.
- Visual tabs as user-facing structure only.
- Shared lifecycle state instead of per-tab state silos.
- Separate typed artifacts and focused read models.
- Passive right rail.
- SCP honesty about locked/not-executed states.
- Provider/receipt provenance for hashes and addresses.
- Backend-only LLM and private-key boundaries.
