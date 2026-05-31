# MILA26 Alpha Demo Boundary

MILA26 is moving from planning-demo readiness toward a blockchain-functional alpha. The current app supports artifact generation, readiness gates, frontend wallet connection, and a narrow wallet-signed Sepolia deployment path. Deployment state is local-session-only until a later evidence linkage track.

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
- unsigned Sepolia deployment intent.
- wallet-signed Sepolia deployment from the connected browser wallet.
- Smart Contract Operations locked state.

This baseline keeps lifecycle status, evidence, and boundaries visible while allowing the first real testnet deployment step. It still does not make deployment evidence durable or unlock contract operations.

## Not Implemented Yet

The current alpha-demo boundary does not include:

- backend wallet signing.
- backend deployment execution.
- persistent deployment evidence/status linkage.
- wallet-signed SCP operations.
- backend private-key custody.
- mainnet configuration.
- audit/security approval or production legal/compliance approval.

## Required Boundary For Future Tracks

Future blockchain-functional alpha tracks must preserve these rules:

- backend never holds user private keys.
- user wallet signs any deployment transaction in the browser.
- Ethereum testnet remains the only allowed execution target until explicitly changed.
- mainnet remains disabled.
- SCP operations stay locked until a wallet-signed testnet deployment and operation-specific authorization/evidence tracks exist.
- contract address and transaction hash appear only after real wallet-signed testnet execution.
- Track 14B deployment status is local-session-only; Track 14C owns durable evidence/status linkage.
- local compile/test status must not be presented as runtime app-triggered compilation, audit approval, deployment readiness, or production readiness.

## Next Milestone

Track 13A defined the wallet connection and Sepolia signing design. Track 13B adds frontend-only provider detection, user-initiated account request, Sepolia/wrong-chain status, and safe provider error states through a minimal EIP-1193 browser-provider boundary.

Track 14A defines an unsigned deployment intent for review. Track 14B consumes it for a frontend-only, wallet-signed Sepolia deployment path. The next milestone is Track 14C: link real provider-returned transaction hash, receipt-confirmed contract address, chain, artifact, and status into MILA26 evidence/readiness without adding SCP operations yet.
