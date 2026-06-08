# MILA26 MVP Scope

## Target User

The MVP target user is one asset manager or tokenised portfolio founder preparing a funding-demo-ready Ethereum Sepolia workflow for tokenising a portfolio and proving a user-wallet-signed blockchain path.

## Current Alpha Path

The current implementation path is a restricted ERC-20-compatible tokenised fund unit model.

`restricted_erc20` is a MILA26 restriction profile layered over ERC-20 compatibility. It is not a separate formal ERC standard.

Current contract assumptions:

- fungible fund units.
- OpenZeppelin Contracts-based local fixture.
- AccessControl / issuer roles.
- Pausable behavior.
- wallet allowlisting.
- issuer-controlled allocation/minting.
- transfer restrictions.
- valuation event.
- distribution event.

ERC-721 may be explained if a user asks about it, but it is out of MVP scope and not an active ZiLi-OS Product Setup protocol base.

## Scale

- 1 asset manager.
- Up to 50 whitelisted investor wallet addresses.
- Local Mac laptop demo first.
- Ethereum Sepolia/testnet only.
- Funding-demo-ready, not production mainnet.

## MVP Scope Clarification

The MVP scope includes the latest mockup-driven lifecycle workspace and the full user-stated product journey:

- company and product intro website;
- access/login path for controlled users;
- AI-first lifecycle workspace;
- investor registry for up to 50 wallets;
- permitted stablecoin subscription parameters;
- redemption parameters, including configurable delay before payout;
- subscription-redemption smart-contract template handoff;
- Sepolia wallet-signed deployment and operation evidence;
- asset servicing updates such as NAV, valuation, notices, corporate actions, and maturity events;
- evidence surfaces and future durable Evidence Vault;
- reviewer and production-readiness gates.

These are MVP roadmap commitments, not claims that every item is already implemented.

## In Scope For Blockchain-Functional Alpha

- Turn-based Engineering Bot guidance.
- Requirement Brief generation.
- Engineering Brief generation.
- Closure/open-item readiness.
- Smart Contract Artifact Spec.
- deterministic Smart Contract Artifact Preview.
- Check Result and Evidence-Lite.
- Local Hardhat compile/test foundation.
- Deployment Gate Review.
- Wallet Signing Intent.
- MetaMask-first wallet connection.
- Sepolia chain verification.
- User wallet-signed Sepolia deployment.
- Real transaction hash and contract address only after real Sepolia execution.
- Deployment evidence/readiness surface with local-session-only persistence.
- wallet-signed Contract Ops operation for Record NAV Event.
- wallet-signed Contract Ops operation for Whitelist Wallet.
- visual lifecycle workspace tabs for overview, product setup, investor wallets, subscription, contract ops, asset servicing, redemption, maturity, and evidence vault.
- production-readiness plan covering prototype, beta, and GTM gates.

## Out Of Scope For Current Alpha

- Production mainnet deployment.
- Backend-held private keys.
- Custody operations.
- Formal audit-complete certification.
- Production legal/compliance approval.
- Full KYC/AML.
- Multi-tenant SaaS.
- Enterprise auth.
- Payment flows.
- Stablecoin subscription/redemption execution.
- Production redemption liquidity management.
- Automated investor advice delivery as regulated financial advice.
- Production oracle infrastructure.
- Multi-wallet connector orchestration before MetaMask path is proven.
- Redis queues, vector DB, microservices, Kubernetes, and heavy agent frameworks.

## Current Implemented Boundary

The app currently supports:

- lifecycle workspace UI and shared presentation state.
- local compile/test representation.
- deployment gate and wallet intent boundaries.
- MetaMask/Sepolia wallet connection.
- unsigned deployment intent.
- wallet-signed Sepolia deployment local-session status.
- deployment evidence/readiness local-session surface.
- Record NAV Event as a wallet-signed Contract Ops operation.
- Whitelist Wallet as a wallet-signed Contract Ops operation.
- Investor Wallets tab for up to 50 wallet addresses with validation, duplicate detection, generated test investor wallet packs, explicit test-only export preparation, local-session whitelist status, Contract Ops handoff, and Allocation/Mint handoff.
- Sepolia funding helper targets for issuer/admin, generated investor wallets, payment destination, and redemption wallet with copyable public addresses.
- Subscription tab parameter capture for permitted stablecoins, subscription window, minimum subscription amount, payment address, and payment per token.
- Redemption tab parameter capture for redemption window/date, redemption wallet, payout stablecoin, payout per token, and configurable delay.
- Subscription-redemption smart-contract template handoff readiness/draft status from shared lifecycle state.
- backend SQLite workspace snapshot persistence for project identity, versioned lifecycle state, and investor registry rows.
- durable Evidence Vault foundation for provider-derived deployment, Record NAV, Wallet Whitelist, and Allocation/Mint evidence records.
- generated artifact persistence for Requirement Brief, Engineering Brief, Smart Contract Spec, Artifact Preview, Check Result, and Evidence-Lite records.
- company/product website first slice at `/site`.

The app does not yet support:

- KYC/eligibility workflow.
- live stablecoin subscription execution.
- live redemption wallet receipt and stablecoin payout execution.
- Solidity implementation/execution of the subscription-redemption smart-contract template.
- maturity closeout flow.
- durable Evidence Pack storage for deployment evidence.
- controlled access/login.
- production observability, support, and release operations.

## Persistence Decision

Sprint 8 records the persistence boundary in `docs/architecture/persistence-boundary-decision.md`. Sprint 9/10 implements the first backend SQLite adapter for workspace snapshots, lifecycle state, and investor wallet rows. Sprint 11/12 extends it with durable evidence and generated artifact records.

The current decision is to keep active lifecycle state in the app during the session and save/load snapshots through backend routes when the user asks. Browser storage is not the production path for lifecycle state, wallet evidence, transaction hashes, contract addresses, private keys, generated artifacts, or investor registry records.

This matters because MILA26 should reduce throwaway effort without overstating evidence maturity. Requirements, parameters, wallet rules, generated artifacts, and provider-derived Sepolia evidence can now be stored through backend APIs. Active wallet state remains local-session-only and is not restored from persistence.

## Funding-Demo Success Criteria

- The demo tells a clear story from asset-manager intent to smart-contract readiness and wallet/testnet boundary.
- The prototype is working software, not a static mockup: user inputs must validate, update shared lifecycle state, propagate across tabs, and drive scoped artifacts/statuses.
- The app remains runnable on a local Mac laptop.
- The interface feels like a professional AI + blockchain project workspace for asset managers.
- The user can see current project context, next action, workflow gates, and safety boundaries without hunting through chat history.
- The wallet-signed model is clear: user wallet signs, backend never holds private keys.
- Sepolia/testnet-only boundary is visible.
- No fake deployment, fake transaction hash, fake contract address, fake audit, or fake production-ready claim appears.
- Implemented flows have focused tests; locked or future flows are visibly locked and not disguised as working execution.

## Risks And Assumptions

- Wallet UX can be fragile in live demos; operation flows must keep provider states, rejection handling, and wrong-chain handling explicit.
- Local compile/test is not a production audit.
- Contract deployment should stay blocked until Deployment Gate, Wallet Signing Intent, wallet connection, Sepolia verification, and unsigned deployment intent are all coherent.
- Real-world names should remain off-chain by default.
- Persistence should wait until the wallet/testnet execution shape is stable enough to store durable state safely.
