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
- Smart Contract Operations locked state.

This baseline is meant to make the next wallet/testnet work safer by keeping lifecycle status, evidence, and boundaries visible before execution is introduced.

## Not Implemented Yet

The current alpha-demo boundary does not include:

- wallet adapter or wallet connection.
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

Track 13A defines the wallet connection and Sepolia signing design. The recommended path is MetaMask first through a minimal EIP-1193 browser-provider boundary, with viem reserved for typed chain/account/contract/deployment primitives later.

Track 13B should implement wallet connection and Sepolia verification only. It should not prepare a deployment transaction, request a signature, submit a transaction, display a transaction hash, display a contract address, or unlock SCP operations.
