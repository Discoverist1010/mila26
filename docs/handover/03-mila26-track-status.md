# MILA26 Track Status

This file is the current handover index. Older planning docs may still describe early Track 3 work; use this file and the current codebase as the starting point.

| Track | Status | What was done | Key files | Next dependency |
|---|---|---|---|---|
| Tracks 0-3B.1 | Complete | Established the repo, contract fixtures, backend skeleton, API envelopes, and deterministic Blockchain Engineer chat route. | `README.md`, `server/app.ts`, `server/routes/blockchainEngineerChat.ts`, `tests/chat-contracts.test.ts` | Keep backend routes contract-tested. |
| UX / Lifecycle workspace foundation | Complete | Replaced the previous dense workspace with the MILA26 lifecycle workspace: dark left rail, top project bar, visual tabs, large Engineering Bot answer area, next best actions, passive right rail, Product Vault, lifecycle snapshot, and SCP below the AI surface. | `src/App.tsx`, `src/styles.css`, `src/domain/workspacePresentation.ts`, `tests/app-chat-panel.test.tsx`, `tests/e2e/mila26.spec.ts` | Preserve role boundaries: tabs are visual only, center is AI-first, right rail passive, SCP owns wallet-signed operations. |
| Tracks 5A-6E | Complete | Added Requirement Brief, Engineering Brief, backend-only LLM boundary, OpenAI provider option, and LLM-assisted Engineering Brief support. | `server/contracts/engineeringBrief.ts`, `server/routes/prdEngineeringBrief.ts`, `server/llm/`, `docs/architecture/backend-llm-boundary.md` | No frontend LLM secrets; OpenAI mode requires explicit backend model config. |
| Track 7A | Complete | Added Project Closure Ledger contract foundation. | `src/domain/projectClosureLedger.ts`, `tests/project-closure-ledger.test.ts` | Use closure readiness before downstream artifacts. |
| Track 7B | Complete | Added Project Closure read model and passive lifecycle workspace wiring. | `src/domain/projectClosureReadModel.ts`, `src/App.tsx` | Keep closure surfaces passive except central action recommendations. |
| Track 7C | Complete | Rendered structured Engineering Bot response sections. | `src/domain/blockchainEngineerResponseViewModel.ts`, `src/App.tsx` | Preserve backward-compatible content-only responses. |
| Track 8A | Complete | Added thin Project Lifecycle Read Model. | `src/domain/projectLifecycleReadModel.ts` | Do not turn this into a monolithic lifecycle context. |
| Track 8B | Complete | Added Cockpit Action Registry and lifecycle-aware primary action wiring. | `src/domain/cockpitActionRegistry.ts`, `src/App.tsx` | Engineering Bot remains the workflow decision surface. |
| Track 8C | Complete | Added deterministic Smart Contract Control Panel view model. | `src/domain/smartContractControlPanelViewModel.ts` | SCP remains honest: status/evidence/boundary, no fake execution. |
| Track 9A | Complete | Added Smart Contract Artifact Spec contract and backend route. | `server/contracts/smartContractArtifactSpec.ts`, `server/routes/smartContractArtifactSpec.ts`, `src/domain/smartContractArtifactSpec.ts` | Spec is the handoff before artifact/check work. |
| Track 9B | Complete | Added deterministic artifact package, spec-consistency check result, and evidence-lite linkage. | `server/contracts/smartContractArtifact.ts`, `server/routes/smartContractArtifact.ts`, `src/api/smartContractArtifact.ts` | No compiled/deployed/audited claim from preview artifacts. |
| Track 9C | Complete | Wired Prepare Smart Contract Spec flow into cockpit/SCP. | `src/App.tsx`, `src/api/smartContractArtifactSpec.ts`, `src/api/smartContractArtifact.ts` | Outputs stay in local React state. |
| Track 9D | Complete | Polished generated artifact/check/evidence readiness and safety language. | `src/App.tsx`, `src/domain/smartContractControlPanelViewModel.ts` | Keep demo credible and honest. |
| Track 9B.2 | Complete | Documented Hardhat vs Foundry vs defer decision. | `docs/architecture/solidity-toolchain-decision.md` | Hardhat selected as first local compile/test path. |
| Track 10A | Complete | Added minimal Hardhat/OpenZeppelin compile/test foundation for restricted ERC-20-compatible fixture. | `hardhat.config.ts`, `contracts/Mila26RestrictedFundToken.sol`, `test/Mila26RestrictedFundToken.ts` | Compile/test local only; no deployment scripts. |
| Track 10B | Complete | Added typed compile/test result adapter and evidence/check mapping helpers. | `server/contracts/smartContractCompileCheck.ts`, `server/agents/smartContractCompileCheckMapper.ts` | Do not execute Hardhat from backend routes. |
| Track 10C | Complete | Surfaced known local compile/test status in cockpit/SCP. | `src/App.tsx`, `src/domain/smartContractControlPanelViewModel.ts` | Status only; no runtime compile execution. |
| Track 11A | Complete | Added Deployment Gate read model. | `src/domain/deploymentGateReadModel.ts` | Separates pre-deployment readiness from blocked execution. |
| Track 11B | Complete | Wired Deployment Gate into cockpit/SCP as view-only readiness. | `src/App.tsx`, `src/domain/smartContractControlPanelViewModel.ts` | No wallet/deployment route or execution. |
| Track 12A | Complete | Added Wallet Signing Intent read model derived from Deployment Gate. | `src/domain/walletSigningIntentReadModel.ts` | Signing intent is not wallet connection. |
| Track 12B | Complete | Surfaced Wallet Signing Intent and operations locked state. | `src/App.tsx`, `src/domain/smartContractControlPanelViewModel.ts` | No wallet buttons or transaction lifecycle. |
| Track 12C | Complete | Added golden-flow hardening and alpha boundary doc. | `tests/golden-flow-assertions.ts`, `tests/app-chat-panel.test.tsx`, `docs/architecture/alpha-demo-boundary.md` | Preserve no-fake-deployment guardrails. |
| Track 13A | Complete | Added MetaMask-first wallet adapter/Sepolia design and pure wallet connection read model. | `docs/architecture/wallet-adapter-sepolia-design.md`, `src/domain/walletConnectionReadModel.ts`, `tests/wallet-connection-read-model.test.ts` | Track 13B can implement provider detection and Sepolia verification. |
| Track 13B | Complete | Added frontend-only MetaMask/EIP-1193 wallet connection and Sepolia verification foundation. | `src/wallet/eip1193WalletAdapter.ts`, `src/wallet/browserEthereumProvider.ts`, `src/App.tsx`, `tests/eip1193-wallet-adapter.test.ts` | No signing, deployment transaction, tx hash, contract address, SCP operations, persistence, or mainnet. |
| Track 14A | Complete | Added unsigned deployment intent read model for review-only Sepolia deployment intent. | `src/domain/unsignedDeploymentIntentReadModel.ts`, `tests/unsigned-deployment-intent-read-model.test.ts`, `docs/contracts/deployment-transaction-intent-contract.md` | No signing, executable transaction payload, tx hash, contract address, receipt, backend route, persistence, or mainnet. |
| Track 14B | Complete | Added frontend-only wallet-signed Sepolia deployment with pre-send account/chain re-check, duplicate-submit protection, bounded receipt polling, and local-session tx/address display from real provider responses. | `src/wallet/sepoliaDeploymentAdapter.ts`, `src/domain/walletSignedDeploymentReadModel.ts`, `src/contracts/mila26RestrictedFundTokenDeploymentArtifact.ts`, `src/App.tsx`, `tests/sepolia-deployment-adapter.test.ts` | Deployment evidence/status linkage, persistence, and SCP operations remain deferred. |
| Track 14C | Complete | Added pure deployment evidence/readiness read model and passive generated-artifact/right-rail/SCP surfaces for provider transaction-hash and receipt-confirmed contract-address evidence. | `src/domain/deploymentEvidenceReadModel.ts`, `tests/deployment-evidence-read-model.test.ts`, `docs/contracts/deployment-evidence-contract.md` | Record NAV and Whitelist Wallet now consume this evidence. |
| Track 15A | Complete | Added the first wallet-signed SCP operation, Record NAV Event, gated by confirmed deployment evidence, Sepolia wallet readiness, valid receipt-returned contract address, and local-session operation evidence. | `src/wallet/sepoliaRecordNavOperationAdapter.ts`, `src/domain/recordNavOperationReadModel.ts`, `tests/sepolia-record-nav-operation-adapter.test.ts`, `tests/record-nav-operation-read-model.test.ts`, `docs/contracts/record-nav-operation-contract.md` | Preserve operation-specific gates for future asset-servicing actions. |
| Track 15B | Complete | Added targeted wallet-operation hardening and the Wallet Whitelist operation, gated by confirmed deployment evidence, Sepolia wallet readiness, valid receipt-returned contract address, explicit target wallet input, ABI inspection, and local-session operation evidence. | `src/wallet/sepoliaWalletWhitelistOperationAdapter.ts`, `src/domain/walletWhitelistOperationReadModel.ts`, `tests/sepolia-wallet-whitelist-operation-adapter.test.ts`, `tests/wallet-whitelist-operation-read-model.test.ts`, `docs/contracts/wallet-whitelist-operation-contract.md` | Sprint Track 1 completed the shared lifecycle state and Investor Registry dependency before allocation/mint. |
| Lifecycle UX update | Complete | Implemented the post-15B UX update requested from the mockup review. Removed internal track labels from user-facing UI, renamed the product surface around Alpha Income Fund I, and created shared presentation state for the visual lifecycle tabs. | `src/domain/workspacePresentation.ts`, `src/App.tsx`, `src/styles.css`, `tests/app-chat-panel.test.tsx`, `tests/e2e/mila26.spec.ts` | Sprint Track 1 completed shared lifecycle data and Investor Registry functionality. |
| Sprint Track 1 | Complete | Added typed shared lifecycle state for investor registry, subscription, redemption, and maturity placeholders; implemented the Investor Registry tab for up to 50 wallet addresses with validation, duplicate detection, status rows, lifecycle snapshot/vault wiring, and SCP whitelist handoff. | `src/domain/lifecycleState.ts`, `src/domain/workspacePresentation.ts`, `src/App.tsx`, `src/styles.css`, `tests/lifecycle-state.test.ts`, `tests/app-chat-panel.test.tsx` | Follow-on sprint implemented Subscription/Redemption parameter capture and template handoff readiness. |
| Sprint Track 2 | Complete | Implemented Subscription and Redemption parameter capture as working local-session prototype functionality, including validation, Product Vault/lifecycle snapshot/status updates, Engineering Bot next actions, and subscription-redemption template handoff readiness/draft status. | `src/domain/lifecycleState.ts`, `src/domain/workspacePresentation.ts`, `src/App.tsx`, `src/styles.css`, `tests/lifecycle-state.test.ts`, `tests/app-chat-panel.test.tsx` | Follow-on sprint added Allocation/Mint readiness, not execution. |
| Sprint Track 3 | Complete | Implemented Allocation/Mint readiness as shared lifecycle state. Investor Registry can hand off a wallet to the Smart Contract tab; the Smart Contract tab validates target wallet, token amount, and Subscription readiness; right rail/vault/snapshot update from the same read model while live Mint remains locked. | `src/domain/lifecycleState.ts`, `src/domain/workspacePresentation.ts`, `src/App.tsx`, `src/styles.css`, `tests/lifecycle-state.test.ts`, `tests/app-chat-panel.test.tsx`, `tests/e2e/mila26.spec.ts` | Next: browser screenshot polish and a wallet-signed Allocation/Mint operation contract before execution. |

## Current Validation Baseline

Recent validation after Sprint Track 3:

- `npm run test -- tests/lifecycle-state.test.ts tests/app-chat-panel.test.tsx`
- `npm run test:e2e`
- `npm run check`
- `npm run test -- tests/deployment-evidence-read-model.test.ts`
- `npm run test -- tests/sepolia-deployment-adapter.test.ts`
- `npm run test -- tests/sepolia-wallet-whitelist-operation-adapter.test.ts`
- `npm run test -- tests/wallet-whitelist-operation-read-model.test.ts`
- `npm run test -- tests/sepolia-record-nav-operation-adapter.test.ts`
- `npm run test -- tests/record-nav-operation-read-model.test.ts`
- `npm run test -- tests/unsigned-deployment-intent-read-model.test.ts`
- `npm run test -- tests/eip1193-wallet-adapter.test.ts`
- `npm run test -- tests/wallet-connection-read-model.test.ts`
- `npm run test -- tests/smart-contract-control-panel-view-model.test.ts`
- `npm run test -- tests/app-chat-panel.test.tsx`
- `npm run test`
- `npm run check`
- `npm run test:e2e`
- `npm run contracts:build -- --force`
- `npm run contracts:export-artifact`
- `npm run test:contracts`

All should pass before the next lifecycle/tab functionality commit.
