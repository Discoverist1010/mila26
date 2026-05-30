# Current MILA26 Agent And Artifact Contracts

## Contract Pattern

MILA26 protects workflow progress with typed artifacts, pure read models, deterministic mappers, and focused tests.

Do not replace this with a monolithic lifecycle context. New tracks should either add a separate artifact contract or a thin read model derived from existing artifacts.

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

## Backend Routes And Contracts

Current product routes:

- `POST /api/chat/blockchain-engineer`
- `POST /api/prd/engineering-brief`
- `POST /api/smart-contract/artifact-spec`
- `POST /api/smart-contract/artifact`

The backend does not expose routes for wallet connection, signing, deployment, or runtime Hardhat execution.

## Engineering Bot

The Engineering Bot is the visible workflow decision orchestrator. It surfaces the primary lifecycle action and structured guidance. It should remain the only active workflow-decision surface.

Right rail remains passive. SCP remains status/evidence/boundary/health before deployment.

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

- `WalletConnectionReadModel` defines provider/account/chain readiness for the future MetaMask/Sepolia implementation.
- It does not access `window.ethereum`.
- It does not connect a wallet.
- It does not request signatures.
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

Those belong only in later explicitly approved wallet/deployment tracks, and only after real execution exists.

## Next Contract Boundary

Track 13B should add runtime wallet connection adapter behavior while continuing to feed `WalletConnectionReadModel`.

It should not mutate the signing intent or deployment gate semantics.
