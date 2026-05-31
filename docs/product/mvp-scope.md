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

ERC-721 remains useful for comparison and later product variants, but it is not the current blockchain-functional alpha path.

## Scale

- 1 asset manager.
- Up to 20 investor wallet addresses.
- Local Mac laptop demo first.
- Ethereum Sepolia/testnet only.
- Funding-demo-ready, not production mainnet.

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
- First wallet-signed SCP operation later, likely Record NAV Event.

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
- Production oracle infrastructure.
- Multi-wallet connector orchestration before MetaMask path is proven.
- Redis queues, vector DB, microservices, Kubernetes, and heavy agent frameworks.

## Current Implemented Boundary

The app currently supports:

- lifecycle cockpit through Wallet Signing Intent.
- locked Smart Contract Operations state.
- local compile/test representation.
- deployment gate and wallet intent boundaries.
- MetaMask/Sepolia wallet connection.
- unsigned deployment intent.
- wallet-signed Sepolia deployment local-session status.
- deployment evidence/readiness local-session surface.

The app does not yet support:

- durable Evidence Pack storage for deployment evidence.
- SCP operation execution.
- persistence.

## Funding-Demo Success Criteria

- The demo tells a clear story from asset-manager intent to smart-contract readiness and wallet/testnet boundary.
- The app remains runnable on a local Mac laptop.
- The interface feels like a professional AI + blockchain project workspace for asset managers.
- The user can see current project context, next action, workflow gates, and safety boundaries without hunting through chat history.
- The wallet-signed model is clear: user wallet signs, backend never holds private keys.
- Sepolia/testnet-only boundary is visible.
- No fake deployment, fake transaction hash, fake contract address, fake audit, or fake production-ready claim appears.

## Risks And Assumptions

- Wallet UX can be fragile in live demos; Track 13B must normalize provider states and handle rejection/wrong-chain cases.
- Local compile/test is not a production audit.
- Contract deployment should stay blocked until Deployment Gate, Wallet Signing Intent, wallet connection, Sepolia verification, and unsigned deployment intent are all coherent.
- Real-world names should remain off-chain by default.
- Persistence should wait until the wallet/testnet execution shape is stable enough to store durable state safely.
