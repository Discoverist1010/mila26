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
- only operation-specific SCP controls may unlock; Record NAV Event and Whitelist Wallet unlock only after confirmed deployment evidence and operation-specific gates.
- Mint/allocation, burn, pause, transfer, role administration, and distribution controls remain locked until their own capability work exists.
- contract address and transaction hash appear only after real wallet-signed testnet execution.
- Deployment and operation evidence are local-session-only; a later persistence/evidence capability owns durable storage.
- local compile/test status must not be presented as runtime app-triggered compilation, audit approval, deployment readiness, or production readiness.

## Next Milestone

The wallet connection, unsigned deployment intent, wallet-signed Sepolia deployment, local-session deployment evidence, Record NAV Event, and Whitelist Wallet foundations are implemented.

The next milestone is tab-aligned lifecycle functionality:

1. shared lifecycle state;
2. Investor Registry;
3. Subscription parameters;
4. Redemption parameters;
5. subscription-redemption template handoff;
6. Allocation/Mint only after registry and subscription parameters are coherent.
