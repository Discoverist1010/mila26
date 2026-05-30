# Current MILA26 Preservation Baseline

Preserve these boundaries while moving toward blockchain-functional alpha.

| Area | Preserve | Why it matters |
|---|---|---|
| Engineering Bot workflow surface | Central action/recommendation surface in `src/App.tsx` and `src/domain/cockpitActionRegistry.ts` | Prevents workflow buttons from spreading into passive panels. |
| Right rail | Passive status/safety only | Keeps the UI understandable and avoids accidental workflow bypasses. |
| SCP | Status/evidence/boundary/health plus locked operations before deployment | Prevents fake live operations before a real wallet-signed deployment. |
| Separate artifacts/read models | Files in `src/domain/` and `server/contracts/` | Avoids a brittle monolithic lifecycle context. |
| API envelopes | `server/http/responses.ts` | Keeps backend errors safe and consistent. |
| Backend-only LLM boundary | `server/llm/` and route integration | Prevents frontend secrets and raw provider output leaks. |
| Smart-contract preview honesty | Track 9A/9B contracts and docs | Keeps artifact preview distinct from compiled/deployed code. |
| Local Hardhat foundation | `hardhat.config.ts`, `contracts/Mila26RestrictedFundToken.sol`, `test/Mila26RestrictedFundToken.ts` | Provides real local compile/test without deployment. |
| Compile/test representation | `server/contracts/smartContractCompileCheck.ts` and mapper | Avoids runtime backend command execution. |
| Deployment Gate | `src/domain/deploymentGateReadModel.ts` | Separates pre-deployment readiness from execution. |
| Wallet Signing Intent | `src/domain/walletSigningIntentReadModel.ts` | Separates signing review from wallet connection/runtime execution. |
| Wallet Connection Read Model | `src/domain/walletConnectionReadModel.ts` | Provides Track 13B status vocabulary without wallet runtime. |
| Golden-flow guardrails | `tests/golden-flow-assertions.ts` and cockpit/e2e tests | Blocks fake deployment/signing/address/hash claims. |

## Do Not Delete Before Replacement

- `src/domain/projectLifecycleReadModel.ts`
- `src/domain/cockpitActionRegistry.ts`
- `src/domain/smartContractControlPanelViewModel.ts`
- `src/domain/deploymentGateReadModel.ts`
- `src/domain/walletSigningIntentReadModel.ts`
- `src/domain/walletConnectionReadModel.ts`
- `server/contracts/smartContractArtifactSpec.ts`
- `server/contracts/smartContractArtifact.ts`
- `server/contracts/smartContractCompileCheck.ts`
- `server/routes/smartContractArtifactSpec.ts`
- `server/routes/smartContractArtifact.ts`
- `contracts/Mila26RestrictedFundToken.sol`
- `tests/golden-flow-assertions.ts`
- `tests/e2e/mila26.spec.ts`

## Safe To Improve Now

- Add wallet adapter tests using mocked EIP-1193 providers.
- Add small frontend-safe wallet adapter modules for Track 13B.
- Update docs when track status changes.
- Add copy clarifying that wallet connection is not signing.
- Add tests for account/chain change handling.

## Still Deferred

- Persistence/database.
- Auth/payments.
- Wallet signing.
- Deployment transaction preparation/submission.
- Transaction receipt tracking.
- Contract address display.
- Transaction hash display.
- SCP operation controls.
- Mainnet.
- Formal audit or production legal/compliance claims.
