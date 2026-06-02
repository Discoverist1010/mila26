# MILA26 Alpha Demo Boundary

MILA26 is moving from planning-demo readiness toward a blockchain-functional alpha. The current app supports artifact generation, readiness gates, frontend wallet connection, a narrow wallet-signed Sepolia deployment path, and local-session deployment evidence/readiness surfaces.

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
- local-session deployment evidence/readiness derived from provider transaction hash and receipt-confirmed contract address.
- first wallet-signed SCP operation: Record NAV Event.
- second wallet-signed SCP operation: Whitelist Wallet.
- other Smart Contract Operations locked state.

This baseline keeps lifecycle status, evidence, and boundaries visible while allowing the first real testnet deployment step plus two narrow post-deployment operations: Record NAV Event and Whitelist Wallet. It still does not store deployment or operation evidence durably, and it does not unlock the broader contract-operation suite.

## Not Implemented Yet

The current alpha-demo boundary does not include:

- backend wallet signing.
- backend deployment execution.
- durable deployment evidence/status storage.
- broad wallet-signed SCP operation suite.
- durable operation evidence/status storage.
- backend private-key custody.
- mainnet configuration.
- audit/security approval or production legal/compliance approval.

## Required Boundary For Future Tracks

Future blockchain-functional alpha tracks must preserve these rules:

- backend never holds user private keys.
- user wallet signs any deployment transaction in the browser.
- Ethereum testnet remains the only allowed execution target until explicitly changed.
- mainnet remains disabled.
- only operation-specific SCP controls may unlock; Tracks 15A and 15B unlock Record NAV Event and Whitelist Wallet only after confirmed deployment evidence and operation-specific gates.
- Mint/allocation, burn, pause, transfer, role administration, and distribution controls remain locked until their own tracks exist.
- contract address and transaction hash appear only after real wallet-signed testnet execution.
- Track 14C deployment evidence is local-session-only; a later persistence/evidence track owns durable storage.
- local compile/test status must not be presented as runtime app-triggered compilation, audit approval, deployment readiness, or production readiness.

## Next Milestone

Track 13A defined the wallet connection and Sepolia signing design. Track 13B adds frontend-only provider detection, user-initiated account request, Sepolia/wrong-chain status, and safe provider error states through a minimal EIP-1193 browser-provider boundary.

Track 14A defines an unsigned deployment intent for review. Track 14B consumes it for a frontend-only, wallet-signed Sepolia deployment path. Track 14C links real provider-returned transaction hash, receipt-confirmed contract address, chain, artifact, and status into local-session MILA26 evidence/readiness surfaces. Track 15A adds Record NAV Event. Track 15B adds Whitelist Wallet. Both operation evidence surfaces are local-session-only, backend private keys remain impossible, and Allocation/Mint remains deferred to Track 15C.
