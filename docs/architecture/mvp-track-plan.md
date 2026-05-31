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
-> Wallet Connection Readiness design
-> Smart Contract Operations locked

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

## Track 13B: MetaMask Wallet Connection + Sepolia Verification

Goal: add the smallest safe wallet connection foundation.

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
- Right rail remains passive.
- SCP operations remain locked.
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

Goal: use the connected wallet to request a real Sepolia deployment signature/submission after intent review.

Expected deliverables:

- Wallet signature/submission flow using the approved adapter path.
- Sepolia-only guard.
- User rejection handling.
- Safe pending/submitted failure handling.
- Backend remains keyless.

Acceptance criteria:

- Only a real wallet-submitted transaction can create a transaction hash.
- No mainnet path exists.
- No backend private key exists.

What not to overbuild:

- No production deployment manager.
- No multi-chain support.
- No custody.

## Track 14C: Real Transaction Hash / Contract Address / Receipt Status

Goal: capture and display real deployment outputs from a real Sepolia transaction.

Expected deliverables:

- Real transaction hash after submission.
- Real contract address after receipt/deployment confirmation.
- Receipt status handling.
- SCP deployed-testnet state that is clearly testnet-only.
- Evidence linkage to tx hash, contract address, chain, and artifact.

Acceptance criteria:

- No fake tx hash or contract address.
- Failed/rejected/pending states are safe and understandable.
- Deployment status is backed by provider/chain data.

What not to overbuild:

- No mainnet.
- No formal audit/security approval.
- No production monitoring.

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

## Later Tracks

After 15A:

- Mint/allocation/distribution operation tracks.
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
- No right-rail workflow buttons.
