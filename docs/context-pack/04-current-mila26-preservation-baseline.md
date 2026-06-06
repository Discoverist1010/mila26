# Current MILA26 Preservation Baseline

Preserve these boundaries while moving toward blockchain-functional alpha.

| Area | Preserve | Why it matters |
|---|---|---|
| Engineering Bot workflow surface | Central action/recommendation surface in `src/App.tsx` and `src/domain/cockpitActionRegistry.ts` | Prevents workflow buttons from spreading into passive panels. |
| Right rail | Passive status/safety only | Keeps the UI understandable and avoids accidental workflow bypasses. |
| SCP | Status/evidence/boundary/health plus operation controls only after operation-specific wallet gates | Prevents fake live operations while allowing approved wallet-signed controls. |
| Separate artifacts/read models | Files in `src/domain/` and `server/contracts/` | Avoids a brittle monolithic lifecycle context. |
| API envelopes | `server/http/responses.ts` | Keeps backend errors safe and consistent. |
| Backend-only LLM boundary | `server/llm/` and route integration | Prevents frontend secrets and raw provider output leaks. |
| Smart-contract preview honesty | Track 9A/9B contracts and docs | Keeps artifact preview distinct from compiled/deployed code. |
| Local Hardhat foundation | `hardhat.config.ts`, `contracts/Mila26RestrictedFundToken.sol`, `test/Mila26RestrictedFundToken.ts` | Provides real local compile/test without deployment. |
| Compile/test representation | `server/contracts/smartContractCompileCheck.ts` and mapper | Avoids runtime backend command execution. |
| Deployment Gate | `src/domain/deploymentGateReadModel.ts` | Separates pre-deployment readiness from execution. |
| Wallet Signing Intent | `src/domain/walletSigningIntentReadModel.ts` | Separates signing review from wallet connection/runtime execution. |
| Wallet Connection Read Model | `src/domain/walletConnectionReadModel.ts` | Provides wallet/provider/chain status vocabulary for the browser wallet path. |
| Deployment Transaction Intent | `src/domain/deploymentTransactionIntentReadModel.ts` | Keeps transaction review separate from signing/submission. |
| Deployment Evidence | `src/domain/deploymentEvidenceReadModel.ts` | Derives local-session evidence from provider transaction hash and receipt-confirmed contract address. |
| Record NAV Operation | `src/domain/recordNavOperationReadModel.ts` | Keeps NAV recording operation-specific and gated. |
| Wallet Whitelist Operation | `src/domain/walletWhitelistOperationReadModel.ts` | Keeps wallet whitelisting operation-specific and gated. |
| Workspace Presentation Model | `src/domain/workspacePresentation.ts` | Keeps visual tab/status surfaces aligned without per-tab state silos. |
| Golden-flow guardrails | `tests/golden-flow-assertions.ts` and cockpit/e2e tests | Blocks fake deployment/signing/address/hash claims. |

## Do Not Delete Before Replacement

- `src/domain/projectLifecycleReadModel.ts`
- `src/domain/cockpitActionRegistry.ts`
- `src/domain/smartContractControlPanelViewModel.ts`
- `src/domain/deploymentGateReadModel.ts`
- `src/domain/walletSigningIntentReadModel.ts`
- `src/domain/walletConnectionReadModel.ts`
- `src/domain/deploymentTransactionIntentReadModel.ts`
- `src/domain/deploymentEvidenceReadModel.ts`
- `src/domain/recordNavOperationReadModel.ts`
- `src/domain/walletWhitelistOperationReadModel.ts`
- `src/domain/workspacePresentation.ts`
- `server/contracts/smartContractArtifactSpec.ts`
- `server/contracts/smartContractArtifact.ts`
- `server/contracts/smartContractCompileCheck.ts`
- `server/routes/smartContractArtifactSpec.ts`
- `server/routes/smartContractArtifact.ts`
- `contracts/Mila26RestrictedFundToken.sol`
- `tests/golden-flow-assertions.ts`
- `tests/e2e/mila26.spec.ts`

## Safe To Improve Now

- Harden shared lifecycle state for visual tabs with e2e coverage.
- Improve Investor Registry data and UI for up to 50 whitelisted wallets without implying KYC or eligibility approval.
- Refine subscription and redemption parameter capture where tests or browser review show friction.
- Map subscription-redemption template handoff into the next smart-contract template design.
- Update docs when track status changes.
- Keep wallet and operation copy clear about provider-returned hashes, receipt-confirmed addresses, and local-session evidence.

## Still Deferred

- Persistence/database.
- Auth/payments.
- Stablecoin subscription execution.
- Redemption execution and delayed payout.
- Allocation/Mint.
- Maturity closeout.
- Broad SCP operation controls beyond the approved deployment, Record NAV, and Whitelist Wallet paths.
- Mainnet.
- Formal audit or production legal/compliance claims.
