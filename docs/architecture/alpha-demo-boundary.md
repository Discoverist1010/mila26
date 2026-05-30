# MILA26 Alpha Demo Boundary

MILA26 is moving from planning-demo readiness toward a blockchain-functional alpha. The current app supports artifact generation and pre-execution readiness, but it does not yet execute wallet or blockchain transactions.

## Current Supported Baseline

The current application can guide a project through:

- Requirement Brief.
- Engineering Brief.
- Project Closure / Open Items.
- Smart Contract Artifact Spec.
- deterministic Smart Contract Artifact Preview.
- Check Result / Evidence-Lite.
- known local Hardhat compile/test representation.
- Deployment Gate Review.
- Wallet Signing Intent.
- MetaMask-first EIP-1193 wallet connection and Sepolia readiness check.
- Smart Contract Operations locked state.

This baseline is meant to make the next wallet/testnet work safer by keeping lifecycle status, evidence, and boundaries visible before execution is introduced.

## Not Implemented Yet

The current alpha-demo boundary does not include:

- wallet signing.
- transaction preparation, submission, or confirmation tracking.
- Sepolia deployment execution.
- real contract address.
- real transaction hash.
- wallet-signed SCP operations.
- backend private-key custody.
- mainnet configuration.
- audit/security approval or production legal/compliance approval.

## Required Boundary For Future Tracks

Future blockchain-functional alpha tracks must preserve these rules:

- backend never holds user private keys.
- user wallet signs any future deployment transaction.
- Ethereum testnet remains the only allowed execution target until explicitly changed.
- mainnet remains disabled.
- SCP operations stay locked until a wallet-signed testnet deployment exists.
- contract address and transaction hash appear only after real wallet-signed testnet execution.
- local compile/test status must not be presented as runtime app-triggered compilation, audit approval, deployment readiness, or production readiness.

## Next Milestone

Track 13A defined the wallet connection and Sepolia signing design. Track 13B adds frontend-only provider detection, user-initiated account request, Sepolia/wrong-chain status, and safe provider error states through a minimal EIP-1193 browser-provider boundary.

The next milestone is unsigned deployment intent design. Future tracks still must not request a signature, submit a transaction, display a transaction hash, display a contract address, or unlock SCP operations until the required wallet-signed deployment flow exists.
