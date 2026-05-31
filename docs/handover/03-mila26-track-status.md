# MILA26 Track Status

This file is the current handover index. Older planning docs may still describe early Track 3 work; use this file and the current codebase as the starting point.

| Track | Status | What was done | Key files | Next dependency |
|---|---|---|---|---|
| Tracks 0-3B.1 | Complete | Established the repo, contract fixtures, backend skeleton, API envelopes, and deterministic Blockchain Engineer chat route. | `README.md`, `server/app.ts`, `server/routes/blockchainEngineerChat.ts`, `tests/chat-contracts.test.ts` | Keep backend routes contract-tested. |
| UX / Cockpit foundation | Complete | Built the Cockpit2 shell with central Engineering Bot workflow surface, passive rails, Brief Preview, and SCP preview. | `src/App.tsx`, `src/styles.css`, `tests/app-chat-panel.test.tsx` | Preserve role boundaries: center active, right rail passive, SCP status/evidence/boundary. |
| Tracks 5A-6E | Complete | Added Requirement Brief, Engineering Brief, backend-only LLM boundary, OpenAI provider option, and LLM-assisted Engineering Brief support. | `server/contracts/engineeringBrief.ts`, `server/routes/prdEngineeringBrief.ts`, `server/llm/`, `docs/architecture/backend-llm-boundary.md` | No frontend LLM secrets; OpenAI mode requires explicit backend model config. |
| Track 7A | Complete | Added Project Closure Ledger contract foundation. | `src/domain/projectClosureLedger.ts`, `tests/project-closure-ledger.test.ts` | Use closure readiness before downstream artifacts. |
| Track 7B | Complete | Added Project Closure read model and passive Cockpit2 wiring. | `src/domain/projectClosureReadModel.ts`, `src/App.tsx` | Keep closure surfaces passive except central action recommendations. |
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

## Current Validation Baseline

Recent Track 14A validation:

- `npm run test -- tests/unsigned-deployment-intent-read-model.test.ts`
- `npm run test -- tests/eip1193-wallet-adapter.test.ts`
- `npm run test -- tests/wallet-connection-read-model.test.ts`
- `npm run test -- tests/smart-contract-control-panel-view-model.test.ts`
- `npm run test -- tests/app-chat-panel.test.tsx`
- `npm run check`
- `npm run test:e2e`

All passed before Track 14A was committed.
