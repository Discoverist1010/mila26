# Blockchain-Functional Alpha Track Plan

This plan replaces the older early-MVP rewrite sequence. MILA26 is now moving toward a blockchain-functional alpha: MetaMask connection, Sepolia-only wallet signing, real transaction hash/contract address capture, and one wallet-signed SCP operation.

## Current Alpha Baseline

The current app reaches this safe pre-execution state:

Requirement Brief
-> Engineering Brief
-> Project Closure / Open Items
-> Smart Contract Artifact Spec
-> deterministic Smart Contract Artifact Preview
-> Check Result / Evidence-Lite
-> local compile/test representation
-> Deployment Gate
-> Wallet Signing Intent
-> Wallet Connection Readiness
-> Unsigned Deployment Intent
-> Wallet-Signed Sepolia Deployment local-session state
-> Deployment Evidence local-session surface
-> Record NAV Event wallet-signed SCP operation
-> Wallet Whitelist wallet-signed SCP operation
-> Allocation / Mint wallet-signed SCP operation
-> Other Smart Contract Operations unavailable until adapter/gate/evidence work exists

## Completed Foundation

- Backend skeleton and product route envelope.
- Backend-only LLM boundary and optional OpenAI provider.
- Requirement Brief and Engineering Brief contracts/routes.
- Project Closure Ledger and closure read model.
- Project Lifecycle Read Model.
- Cockpit Action Registry.
- Smart Contract Artifact Spec route.
- Deterministic artifact/check/evidence-lite route.
- SCP deterministic view model.
- Local Hardhat/OpenZeppelin restricted ERC-20-compatible fixture.
- Local compile/test result adapter.
- Deployment Gate read model and UI surface.
- Wallet Signing Intent read model and UI surface.
- Smart Contract Operations locked state.
- Golden-flow guardrails against fake blockchain execution.
- MetaMask-first wallet adapter/Sepolia design and pure wallet connection read model.
- Frontend-only MetaMask/EIP-1193 wallet connection and Sepolia verification.
- Unsigned deployment intent read model.
- Wallet-signed Sepolia deployment local-session state.
- Deployment evidence/readiness local-session surface.
- First wallet-signed SCP operation: Record NAV Event.
- Second wallet-signed SCP operation: Whitelist Wallet.

## Track 13B: MetaMask Wallet Connection + Sepolia Verification

Status: complete. Added the smallest safe wallet connection foundation.

Expected deliverables:

- MetaMask/injected EIP-1193 provider detection.
- User-triggered connect action in central Engineering Bot workflow surface.
- Real connected wallet address only after user approval.
- Sepolia chain verification: `11155111` / `0xaa36a7`.
- Account/chain change handling with cleanup.
- Safe provider error normalization.
- UI surfaces that show wallet connection readiness without signing or deployment.

Acceptance criteria:

- Wallet connection readiness remains separate from Wallet Signing Intent.
- Wallet execution remains not implemented.
- Right rail remains free of wallet/contract execution controls.
- SCP operations remain unavailable until operation-specific adapters and evidence gates are implemented.
- No fake wallet/contract/tx values are introduced.
- `npm run check` and `npm run test:e2e` pass.

What not to overbuild:

- No signing.
- No deployment transaction.
- No transaction hash.
- No contract address.
- No mainnet.
- No persistence.
- No wagmi/ethers dependency.
- No broad UI redesign.

## Track 14A: Unsigned Deployment Transaction Intent

Goal: define the reviewable unsigned deployment intent needed before a wallet signature.

Status: complete as a pure domain/read-model boundary. No signature request, transaction submission, transaction hash, contract address, receipt, backend route, or SCP operation unlock was added.

Expected deliverables:

- Typed unsigned deployment intent/read model.
- Inputs from compiled artifact/ABI/bytecode, constructor params, chain, wallet connection, Deployment Gate, and Wallet Signing Intent.
- Review rows explaining exactly what the user would later sign.
- Boundaries: no signature request, no submission, no tx hash, no contract address.

Acceptance criteria:

- User can inspect deployment intent before signing exists.
- Backend still does not hold keys.
- Intent fails closed if wallet is disconnected or wrong chain.

What not to overbuild:

- No wallet signing request.
- No transaction submission.
- No receipt tracking.
- No deployment route unless it is strictly a non-executing intent route.

## Track 14B: User Wallet Signs Sepolia Deployment

Status: complete as a frontend-only local-session execution path.

Goal: use the connected wallet to request a real Sepolia deployment signature/submission after intent review.

Expected deliverables:

- Wallet signature/submission flow using the approved adapter path.
- Sepolia-only guard.
- Immediate pre-send account/chain re-check.
- Duplicate-submit protection.
- User rejection handling.
- Safe pending/submitted/confirmed/failed handling.

## Track 15A: First SCP Wallet-Signed Operation - Record NAV Event

Status: complete when the app can submit one wallet-signed `recordValuation(uint256,string)` call through the connected Sepolia wallet after confirmed deployment evidence exists.

Expected deliverables:

- ABI inspection for `recordValuation(uint256,string)`.
- Valid non-zero receipt-returned contract address preflight.
- Immediate pre-send account/chain re-check.
- Provider-returned operation transaction hash only after submission.
- Provider receipt/event evidence only after receipt/log response.
- Local-session-only operation evidence.
- SCP exposes only operation-specific controls that have adapters, ABI gates, authorization gates, and evidence paths.

What not to overbuild:

- No generic operations registry.
- No operation history storage.
- No backend operation route.
- No role-management UI.
- No mainnet.
- No broad SCP operation suite.
- Real transaction hash only after provider response.
- Real contract address only after receipt confirmation.
- Local-session-only deployment status.
- Backend remains keyless.

Acceptance criteria:

- Only a real wallet-submitted transaction can create a transaction hash.
- Only a receipt-confirmed contract creation can create a contract address.
- No mainnet path exists.
- No backend private key exists.

What not to overbuild:

- No production deployment manager.
- No multi-chain support.
- No custody.

## Track 14C: Deployment Status + Evidence Linkage Surface

Status: complete as a local-session evidence/readiness surface.

Goal: link real deployment outputs from a real Sepolia transaction into MILA26 evidence/readiness without adding storage or new execution.

Expected deliverables:

- Represent real transaction hash after provider submission.
- Represent real contract address after receipt/deployment confirmation.
- Receipt status handling.
- SCP deployed-testnet state that is clearly testnet-only.
- Evidence/readiness projection for tx hash, contract address, chain, artifact, and local-session source.

Acceptance criteria:

- No fake tx hash or contract address.
- Failed/rejected/pending states are safe and understandable.
- Deployment status is backed by provider/chain data.
- Evidence persistence remains local-session-only.

What not to overbuild:

- No mainnet.
- No formal audit/security approval.
- No production monitoring.
- No database or Evidence Pack storage.

## Track 15A: First Wallet-Signed SCP Operation

Goal: unlock one low-risk operation after wallet-signed deployment.

Preferred operation:

- Record NAV Event.

Expected deliverables:

- Operation intent/review payload.
- Wallet-signed contract write.
- Transaction hash and receipt status.
- Evidence log item.
- SCP status update.

Acceptance criteria:

- Operation is disabled until deployed testnet contract exists.
- Operation checks wallet/chain/authorization state.
- No live-sounding sample metrics are shown unless backed by real event data.

What not to overbuild:

- No Mint/Burn/Distribution suite until one operation path is proven.
- No production oracle.
- No mainnet.

## Track 15B: Targeted Operation Hardening + Wallet Whitelist Operation

Status: complete when SCP exposes exactly one additional wallet-signed operation, Whitelist Wallet, without unlocking mint/allocation or a broad operation suite.

Expected deliverables:

- Confirm ABI function `setWalletAllowed(address,bool)` exists and call it with `allowed = true`.
- Require confirmed receipt-derived deployment evidence and a valid non-zero receipt-returned contract address.
- Require explicit user-provided valid non-zero target wallet address.
- Re-check account and Sepolia chain immediately before send.
- Provider-returned operation transaction hash only after submission.
- Provider receipt/event evidence only after receipt/log response.
- Local-session-only operation evidence.
- Contract authorization copy stays honest: authorization is enforced on-chain, not pre-claimed by the app.

What not to overbuild:

- No allocation/mint until investor registry and subscription parameters are coherent.
- No generic operation registry or command bus.
- No backend operation route.
- No persistence or durable operation history.
- No KYC, legal, audit, issuer-authorized, or investor-eligible claims.

## Later Tracks

After the lifecycle workspace update:

- E2E hardening for Subscription/Redemption parameter capture and subscription-redemption template handoff.
- Allocation/Mint Operation only after registry/subscription state is coherent.
- Website/access first slice without duplicating app lifecycle state.
- Investor Registry import/export and durable persistence.
- Distribution operation tracks.
- Valuation file ingest and validation.
- Evidence Pack expansion.
- Persistence/run history.
- Auth/user ownership.
- Hosted alpha hardening.

These should not precede the first safe wallet/testnet execution path unless there is a deliberate product decision to pause blockchain functionality.

## Universal Guardrails

- User wallet signs.
- Backend never holds private keys.
- Sepolia/testnet only until explicitly changed.
- Mainnet disabled.
- Wallet address appears only after real wallet connection.
- Transaction hash appears only after real transaction submission.
- Contract address appears only after real deployment.
- SCP operations unlock only after wallet-signed deployment and operation-specific authorization.
- No fake audit, security approval, production readiness, or legal/compliance claim.
- No monolithic lifecycle context.
- No right-rail wallet/contract execution buttons.
