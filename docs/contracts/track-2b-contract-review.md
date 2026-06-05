# Track 2B Contract Review

This checkpoint reviews whether the planned backend/API contracts are stable enough for minimal fixture coverage before Track 2C backend skeleton work. It does not add backend routes, runtime schemas, persistence, wallet integration, LLM calls, or application behavior.

## Summary Of Planned Contracts

- `PRDApproval`: records user approval of a PRD/enhanced Requirement Brief before worker orchestration starts.
- `SolidityArtifactMetadata`: records Solidity-specific metadata, library policy, compile/test/security status, and deployment eligibility for a generated artifact.
- `SecurityBenchmarkStatus`: records QA/Security Reviewer Bot benchmark status, checked categories, findings, blocking issues, and waivers.
- `DeploymentGateReadiness`: records whether an artifact is ready for user wallet-signed Ethereum testnet deployment.
- `WalletSignedDeploymentRequest`: planned unsigned transaction intent prepared by backend and signed by the user's wallet.
- `DeploymentTransactionStatus`: planned status record for submitted testnet deployment transactions.
- `InvestorWalletRecord`: planned off-chain investor name and wallet mapping.
- `AllocationPlan`: planned allocation/mint inputs derived from approved investor registry and subscription state for up to 50 wallets.
- `ValuationUploadSummary`: planned validated summary of uploaded valuation/performance data.
- `PortfolioPerformanceUpdate`: planned token-holder-visible performance update, likely through dashboard display and/or on-chain event emission later.

## Stability Assessment

| Contract | Stable enough for fixture now? | Why / why not | Recommended timing |
|---|---|---|---|
| `PRDApproval` | Yes, minimal fixture only. | Core lifecycle, protocol choice, approval status, and orchestration gate are clear. Exact PRD body shape can remain separate. | Add before Track 2C or with the first `/api/prd` stub. |
| `SolidityArtifactMetadata` | Yes, minimal fixture only. | Metadata fields and invariants are clear enough: protocol, OpenZeppelin policy, compile/test/security status, and deployment eligibility. Tool-specific fields should stay generic until Solidity tooling is chosen. | Add before Track 2C if artifact route stubs are planned; otherwise add before Track 5. |
| `SecurityBenchmarkStatus` | Yes, minimal fixture only. | Benchmark sources, categories, pass/fail status, blocking findings, and waiver behavior are clear. Detailed static-analysis output should wait. | Add before Track 2C if security route stubs are planned; otherwise add before Track 5. |
| `DeploymentGateReadiness` | Yes, minimal fixture only. | Gate booleans, blocking reasons, testnet-only rule, wallet-signing requirement, and private-key boundary are stable. Transaction details should stay out of this fixture. | Add before Track 2C if deployment route stubs are planned; otherwise add before Track 6. |
| `WalletSignedDeploymentRequest` | No. | Requires wallet/testnet transaction preparation details that are intentionally deferred. Premature fixture could overfit chain tooling before `viem`/tooling decisions. | Track 6, before wallet-signed deployment implementation. |
| `DeploymentTransactionStatus` | No. | Status shape depends on wallet submission flow, network metadata, transaction hash handling, and polling/subscription model. | Track 6, alongside deployment status design. |
| `InvestorWalletRecord` | No. | Needs off-chain storage and privacy decisions for real-world names. No persistence model exists yet. | Track 7, before whitelist/mint/distribution implementation. |
| `AllocationPlan` | No. | Core 100% invariant is clear, but wallet operation shape and UI/API flow are not designed yet. | Track 7, before allocation validation implementation. |
| `ValuationUploadSummary` | No. | Depends on accepted file format, valuation fields, parsing rules, and performance-display decision. | Track 8, before valuation upload implementation. |
| `PortfolioPerformanceUpdate` | No. | Depends on whether MVP uses dashboard display, on-chain events, or both. | Track 8, after valuation upload shape is clarified. |

## Recommended Minimal Fixture Set Before Track 2C

If Track 2C includes more than `/api/health`, add narrow planned-contract fixtures before or alongside the skeleton:

- `prd-approval.json`: approved PRD gate with `selectedProtocol`, feature list, approval metadata, and lifecycle status.
- `solidity-artifact-metadata.json`: OpenZeppelin-default ERC-20 or ERC-721 Solidity artifact metadata with generic compile/test/security statuses.
- `security-benchmark-status.json`: benchmark result with checked categories, no critical unresolved findings, and explicit non-formal-audit disclaimer field or note if that becomes part of the contract.
- `deployment-gate-readiness.json`: `ready_for_signature` or `not_ready` state showing PRD, compile, tests, QA, security, evidence, wallet, and testnet checks.

Keep these fixtures structural. Do not add TypeScript schemas until a route, producer, or consumer needs them. Direct structure tests are enough while the backend boundary is still being introduced.

## Contracts To Defer

Defer fixtures for:

- `wallet-signed-deployment-request`.
- `deployment-transaction-status`.
- `investor-wallet-record`.
- `allocation-plan`.
- `valuation-upload-summary`.
- `portfolio-performance-update`.

These contracts should be fixture-protected before or during their implementation tracks, not during Track 2C unless their route stubs are explicitly added. Deferring them avoids locking in wallet tooling, storage shape, valuation parsing, or performance-delivery decisions before the product flow needs them.

## Ambiguity And Overengineering Risks

- The four core gate/readiness contracts are stable enough for fixtures, but not stable enough for full Zod schemas without an implementation consumer.
- `QABenchmarkStatus` may share structure with `SecurityBenchmarkStatus`, but it should not be merged until real QA fields prove the overlap.
- Deployment transaction shapes should not be designed before wallet/testnet tooling decisions.
- Persistence IDs such as `projectId`, `runId`, and `artifactId` can appear in fixtures, but should not force SQLite or a storage model in Track 2C.
- A health-only backend skeleton does not need these new fixtures yet. Add them when mock/stub route boundaries begin returning planned contracts.

## Track 2C Readiness Checklist

- Backend skeleton can be added only after boundary docs are reviewed.
- No real LLM yet.
- No wallet integration yet.
- No SQLite yet unless explicitly approved.
- Health route only plus mock/stubbed route boundaries if needed.
- Backend must not hold private keys.
- Frontend wallet signing remains the deployment model.
- Planned API outputs must map to documented contracts before UI consumption.
- New planned contract fixtures/tests should be added before or alongside any route stub that returns them.
- `npm run check` must pass.

## Recommendation

Proceed to Track 2C only if the first implementation step is a minimal local backend skeleton with `/api/health` and no product-route behavior. If Track 2C will include mock/stubbed PRD, artifact, security, or deployment route responses, first add the four minimal fixtures listed above with light direct-structure tests.
