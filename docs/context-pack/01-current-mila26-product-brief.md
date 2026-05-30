# Current MILA26 Product Brief

## Product Summary

MILA26 is an AI + blockchain tokenisation workspace for asset managers moving from product intent to a controlled blockchain-functional alpha.

The current alpha path focuses on a restricted ERC-20-compatible tokenised fund unit model. The app now guides the user through planning artifacts, smart-contract specification, deterministic artifact preview, check/evidence-lite, local compile/test representation, Deployment Gate, Wallet Signing Intent, and locked Smart Contract Operations.

MILA26 is not yet a live deployment tool. Wallet connection, signing, transaction submission, contract address display, transaction hash display, and SCP operations are still future tracks.

## Target User

The primary user is a small asset manager or tokenised-portfolio founder preparing a funding demo or internal technical review.

The product should make complex blockchain readiness understandable:

- what has been specified.
- what has been checked.
- what evidence exists.
- what is still blocked.
- what the user wallet will later sign.
- why the backend never holds private keys.

## Current Guided User Journey

The current app supports this lifecycle:

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
11. Smart Contract Operations locked state.

The central Engineering Bot remains the active workflow decision surface. The right rail remains passive status/safety. The Smart Contract Control Panel remains status/evidence/boundary/health until a real wallet-signed deployment exists.

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
- Wallet Connection Readiness design/read model.
- locked Smart Contract Operations state.

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

The local fixture compiles and tests with Hardhat, but the app does not run Hardhat dynamically and does not deploy.

## Current Wallet/Testnet Direction

Track 13A chooses a MetaMask-first wallet connection path through a minimal EIP-1193 browser-provider boundary.

Track 13B should connect wallet and verify Sepolia only. It should not request signatures, prepare deployment transactions, submit transactions, show transaction hashes, show contract addresses, or unlock SCP operations.

## Guardrails

- Backend never holds user private keys.
- User wallet signs future deployment and operations.
- Sepolia/testnet only for alpha.
- Mainnet disabled.
- Wallet address appears only after real wallet connection.
- Transaction hash appears only after real transaction submission.
- Contract address appears only after real deployment.
- SCP operations unlock only after wallet-signed deployment and operation authorization gates.
- No audit/security approval or production legal/compliance claim is made.

## What Should Not Be Lost

- Requirement-first workflow.
- Engineering Bot as the decision orchestrator.
- Separate typed artifacts and thin read models.
- Passive right rail.
- SCP honesty about locked/not-executed states.
- Golden-flow guardrails against fake deployment and fake signing.
- Backend-only LLM and private-key boundaries.
