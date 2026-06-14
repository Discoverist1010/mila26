# Current MILA26 Agent And Artifact Contracts

## Contract Pattern

MILA26 protects workflow progress with typed artifacts, pure read models, deterministic mappers, and focused tests.

Do not replace this with a monolithic opaque lifecycle object. New tracks should either add a typed artifact contract, a focused read model, or an explicit shared lifecycle state model when multiple visual tabs need the same data.

## Active Artifact And Read-Model Spine

Current spine:

1. Requirement Brief.
2. Engineering Brief.
3. Project Closure Ledger.
4. Project Closure Read Model.
5. Project Lifecycle Read Model.
6. Cockpit Action Registry.
7. Smart Contract Artifact Spec.
8. Smart Contract Artifact Package.
9. Smart Contract Artifact Check Result.
10. Smart Contract Evidence-Lite.
11. Smart Contract Compile/Test Result.
12. Smart Contract Control Panel View Model.
13. Deployment Gate Read Model.
14. Wallet Signing Intent Read Model.
15. Wallet Connection Read Model.
16. Deployment Transaction Intent Read Model.
17. Deployment Transaction Adapter Result.
18. Deployment Evidence Read Model.
19. Record NAV Operation Read Model.
20. Wallet Whitelist Operation Read Model.
21. Workspace Presentation Model.

## Backend Routes And Contracts

Current product routes:

- `POST /api/chat/blockchain-engineer`
- `POST /api/prd/engineering-brief`
- `POST /api/smart-contract/artifact-spec`
- `POST /api/smart-contract/artifact`

The backend does not expose routes for wallet connection, signing, deployment, operation execution, or runtime Hardhat execution.

## Engineering Bot

The Engineering Bot is the visible workflow decision orchestrator. It surfaces the primary lifecycle action and structured guidance. It should remain the only active workflow-decision surface.

Right rail remains the persistent ZiLi-OS console for chat, captured-fact review, and draft handoff staging. SCP remains status/evidence/boundary/health plus operation controls only after operation-specific wallet gates are satisfied.

## Smart Contract Artifacts

Track 9A/9B created the spec-to-artifact/check/evidence bridge:

- `SmartContractArtifactSpec`: what should be built.
- `SmartContractArtifactPackage`: deterministic preview package, not compiled/deployed.
- `SmartContractArtifactCheckResult`: spec-consistency/static-preview check result.
- `SmartContractEvidenceLite`: traceability for later evidence pack work.

Track 10A/10B/10C added local compile/test foundation and representation:

- `Mila26RestrictedFundToken.sol`: local restricted ERC-20-compatible fixture.
- `SmartContractCompileTestResult`: typed representation of known local compile/test status.
- local compile/test status is surfaced in SCP without runtime command execution.

## Deployment And Wallet Artifacts

Track 11A/11B:

- `DeploymentGateReadModel` separates `preDeploymentReadiness` from `deploymentExecutionStatus`.
- Pre-deployment readiness may become complete.
- Deployment execution remains blocked.

Track 12A/12B:

- `WalletSigningIntentReadModel` describes signing review readiness.
- Wallet execution remains not implemented.
- No wallet address, signed payload, tx hash, contract address, submitted transaction, or confirmed transaction exists.

Track 13A:

- `WalletConnectionReadModel` defines provider/account/chain readiness for the MetaMask/Sepolia implementation.
- It does not access `window.ethereum`.
- It does not connect a wallet.
- It does not request signatures.

Tracks 13B through Sprint Track 5:

- The frontend-only EIP-1193 wallet adapter connects to the browser wallet and verifies Sepolia.
- The deployment adapter requests a real wallet-signed Sepolia deployment and displays transaction hash/contract address only from provider/receipt responses.
- Deployment evidence is local-session-only and derived from provider-returned transaction/receipt data.
- Record NAV Event, Whitelist Wallet, and Allocation / Mint are the implemented wallet-signed SCP operations.
- Burn, pause, distribution, transfer, role-admin, subscription execution, redemption execution, batch allocation/mint, and maturity closeout remain unavailable until each has its own adapter, authorization gate, ABI gate, and evidence path.
- It does not model transactions.

## Naming And Status Rules

Reuse existing status language:

- `blocked`
- `review_ready`
- `not_implemented`
- `not_connected`
- `connecting`
- `connected`
- `wrong_chain`
- `rejected`
- `unsupported`
- `error`
- `passed`
- `failed`
- `not_run`

Avoid introducing duplicate or misleading names:

- `ready_to_sign`
- `ready_to_deploy`
- `deployment_ready`
- `signed`
- `submitted`
- `confirmed`
- `deployed`
- `live`
- `verified`
- `audited`
- `production_ready`
- `mainnet_ready`

Those labels are allowed only where backed by explicit provider/receipt provenance or an explicitly approved future implementation track.

## Next Contract Boundary

Next contract work should define shared lifecycle state and Investor Registry semantics without mutating existing deployment, wallet, Record NAV, or Whitelist Wallet evidence contracts.
