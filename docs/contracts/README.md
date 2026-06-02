# MILA26 Contract Reference

## Purpose

The contract fixtures and tests protect the current MILA26 beta/MVP journey as a regression safety net before backend, LLM, memory, blockchain, persistence, or UI expansion.

They document the contract spine that currently connects user inputs, requirement generation, mini-bot orchestration, generated artifacts, security review, and evidence output. They do not freeze every implementation detail or incidental prose string.

## Protected Journey

Fund setup -> Requirement Brief / PRD -> module/protocol selection -> bot orchestration -> generated artifacts -> Security Review -> Evidence Pack -> later testnet deployment/mint/distribution.

## Contract Fixtures

Fixtures live in `tests/fixtures/contracts/`:

- `fund-facts.json`: canonical fund setup input for the current beta journey.
- `requirement-brief.json`: a stable Requirement Brief shape with selected servicing modules, assumptions, security constraints, and unresolved questions.
- `agent-task.json`: one mini-bot/worker task shape using a current valid worker role.
- `generated-artifact.json`: one generated artifact shape with kind, filename, content, and source task traceability.
- `agent-result.json`: one worker result shape containing summary, artifacts, risks, and tests.
- `security-review.json`: current Security Review decision shape with findings and blocked artifact IDs.
- `evidence-pack.json`: current Evidence Pack object with Markdown output and stable section coverage.
- `implementation-bundle.json`: aggregate run-output example containing brief, tasks, results, security review, and evidence pack.
- `blockchain-engineer-chat-request.json`: valid backend chat request for the mock Blockchain Engineering Bot route.
- `blockchain-engineer-chat-response.json`: successful backend chat response shape.
- `blockchain-engineer-chat-validation-error.json`: safe validation error envelope for blank `userMessage`.

## Stable Requirement Brief Boundary

Track 5A adds a stable typed Requirement Brief contract boundary for future PRD, backend-only LLM, Solidity generation, QA/security, evidence, deployment gate, and wallet-signed testnet deployment tracks:

- [`requirement-brief-contract.md`](requirement-brief-contract.md): source-of-truth Requirement Brief contract and adapter rules.

Track 5B adds a deterministic backend Engineering Brief contract and route:

- [`engineering-brief-contract.md`](engineering-brief-contract.md): `POST /api/prd/engineering-brief` request/response contract, validation boundaries, and deterministic/mock status.

Track 7A adds a typed Project Closure Ledger / Open Items contract foundation:

- [`project-closure-ledger-contract.md`](project-closure-ledger-contract.md): closure checks, open items, evidence references, fixed MVP deployment boundaries, and derived readiness summary.

Track 8A adds a thin Project Lifecycle Read Model for cockpit coordination:

- [`project-lifecycle-read-model-contract.md`](project-lifecycle-read-model-contract.md): derived stage, readiness, action availability, and fixed MVP safety boundaries without creating a monolithic lifecycle context.

Track 9A adds a deterministic Smart Contract Artifact Spec contract and route:

- [`smart-contract-artifact-spec-contract.md`](smart-contract-artifact-spec-contract.md): ERC-20-compatible restricted token profile, event-to-evidence mapping, OpenZeppelin assumptions, and MVP safety boundaries before any Solidity artifact work.

Track 9B adds deterministic artifact/check/evidence-lite linkage:

- [`smart-contract-artifact-contract.md`](smart-contract-artifact-contract.md): preview-only contract artifact package, spec-consistency check result, and evidence-lite references without compile, deployment, wallet signing, or audit claims.

Track 9B.2 adds the compile/test toolchain decision:

- [`../architecture/solidity-toolchain-decision.md`](../architecture/solidity-toolchain-decision.md): docs-only ADR recommending Hardhat as the first future compile/test path while keeping toolchain installation, Solidity files, OpenZeppelin imports, wallet signing, deployment, and mainnet out of scope.

Track 10A adds the local Hardhat compile/test foundation:

- [`../architecture/hardhat-compile-test-foundation.md`](../architecture/hardhat-compile-test-foundation.md): local-only Hardhat/OpenZeppelin fixture, contract test command, guardrails, and future output mapping without deployment, wallet signing, mainnet, fake addresses, transaction hashes, or audit claims.

Track 10B adds the compile/test result adapter:

- [`smart-contract-compile-check-contract.md`](smart-contract-compile-check-contract.md): typed representation of the local Hardhat compile/test result plus pure mapping into existing check, evidence-lite, and SCP readiness terminology without backend command execution.

Track 11A adds the deployment gate read model foundation:

- [`deployment-gate-contract.md`](deployment-gate-contract.md): pre-deployment readiness and execution-blocked boundary semantics without UI wiring, wallet signing, transaction lifecycle states, contract addresses, transaction hashes, or deployment execution.

Track 12A adds the wallet-signing intent read model foundation:

- [`wallet-signing-intent-contract.md`](wallet-signing-intent-contract.md): review-ready wallet-signing intent semantics derived from the deployment gate, with wallet execution still not implemented and no wallet addresses, private keys, signed payloads, transaction hashes, contract addresses, or transaction lifecycle states.

Track 13A adds the wallet connection design/read-model foundation:

- [`../architecture/wallet-adapter-sepolia-design.md`](../architecture/wallet-adapter-sepolia-design.md): MetaMask-first EIP-1193 wallet boundary, Sepolia-only guardrails, and pure wallet connection readiness terminology without wallet runtime, signing, deployment, transaction hashes, contract addresses, or mainnet configuration.

Track 14A adds the unsigned deployment intent read-model foundation:

- [`deployment-transaction-intent-contract.md`](deployment-transaction-intent-contract.md): review-only unsigned Sepolia deployment intent semantics that consume deployment gate, wallet signing intent, wallet connection, compiled artifact reference, and local compile/test readiness without signing, deployment, transaction submission, transaction hashes, contract addresses, receipts, or backend private-key custody.
- [`../architecture/wallet-signed-deployment.md`](../architecture/wallet-signed-deployment.md): frontend-only wallet-signed Sepolia deployment boundary, real provider-returned transaction hash and receipt-confirmed contract address rules, and local-session-only deployment evidence/readiness boundaries.

Track 14C adds the deployment evidence/readiness surface:

- [`deployment-evidence-contract.md`](deployment-evidence-contract.md): pure local-session deployment evidence read model with explicit transaction-hash source, contract-address source, evidence strength, and local-session-only persistence boundary.

Track 15A adds the first wallet-signed SCP operation:

- [`record-nav-operation-contract.md`](record-nav-operation-contract.md): narrow Sepolia `recordValuation(uint256,string)` operation contract, provider-returned operation transaction hash rules, receipt/event evidence provenance, and local-session-only operation evidence boundary.

Track 15B adds targeted wallet-operation hardening and the second wallet-signed SCP operation:

- [`wallet-whitelist-operation-contract.md`](wallet-whitelist-operation-contract.md): narrow Sepolia `setWalletAllowed(address,bool)` operation contract with `allowed = true`, explicit target-wallet validation, provider-returned transaction hash rules, receipt/event evidence provenance, on-chain authorization honesty, and local-session-only operation evidence boundary.

## Contract Test Coverage

`tests/contracts.test.ts` validates:

- Fixture parsing through existing Zod schemas where schemas exist.
- Schema compatibility for `FundFacts`, `RequirementBrief`, `AgentTask`, `GeneratedArtifact`, `AgentResult`, `SecurityReview`, and `EvidencePack`.
- Current `ImplementationBundle`-like structure through constituent schemas.
- Module catalog uniqueness, required fields, naming convention, and default-module validity.
- Runtime contract behavior for `createRequirementBrief`, `decomposeForMiniBots`, `runCodingBotOrchestration`, `runSecurityReview`, and `generateEvidencePack`.
- Evidence Pack structure through stable headings and key content, not long exact prose.
- Security Review behavior for unsafe generated content.
- Blockchain Engineering Bot chat request/response/error fixtures and route behavior.

`tests/requirement-brief-contract.test.ts` validates the Track 5A Requirement Brief contract adapter and fixed MVP boundaries.

`tests/engineering-brief-contract.test.ts` and `tests/api-prd-engineering-brief.test.ts` validate the Track 5B Engineering Brief contract, deterministic generator, route envelope, and safe validation failures.

## Known Schema Gaps

- There is currently no aggregate Zod schema for `ImplementationBundle`.
- There is currently no dedicated Zod schema for module catalog entries.
- Current tests validate these through constituent schemas and direct structure checks.

These gaps should be revisited during backend/API boundary design, not fixed through premature broad refactoring.

The current backend chat route has local Zod schemas in `server/contracts/chat.ts`; those fixtures are validated directly by `tests/chat-contracts.test.ts`.

## Future Migration Rule

Future backend, LLM, memory, persistence, or UI work may evolve these contracts, but changes must be deliberate and test-protected.

Any contract migration must update:

- Runtime producer/consumer if affected.
- Source schema/type.
- Fixture.
- Contract test.
- Relevant docs.

## MVP Expansion Warning

When future tracks add PRD, wallet-signed deployment, mint/distribute, valuation upload, and performance-update contracts, add fixtures and tests before or alongside implementation.

## Planned MVP API Contracts

Track 2B documents planned backend/API contracts without implementing routes or schemas:

- [`mvp-api-contracts.md`](mvp-api-contracts.md): index of existing and planned MVP API contracts.
- [`prd-approval-contract.md`](prd-approval-contract.md): PRD approval state and orchestration gate.
- [`solidity-artifact-contract.md`](solidity-artifact-contract.md): Solidity artifact metadata and readiness.
- [`security-benchmark-contract.md`](security-benchmark-contract.md): QA/security benchmark status and findings.
- [`deployment-gate-contract.md`](deployment-gate-contract.md): current Track 11A deployment gate read model and future wallet/deployment boundary.

The existing fixtures protect current beta contracts. Planned MVP contracts need fixtures and contract tests before or alongside implementation.

Track 3B.1 adds chat fixtures for the mock backend chat route. Update these deliberately when frontend chat integration, persistence, or a real LLM provider changes the contract.

## Code Reviewer Quality Contract

Structured code reviews use three coordinated docs (scan lessons → run checklist → emit skill report):

- [`code-reviewer-checklist.md`](code-reviewer-checklist.md) — executable phases and severities (v1.0.2)
- [`../handover/05-code-reviewer-skill.md`](../handover/05-code-reviewer-skill.md) — reviewer principles and report format
- [`../handover/06-code-reviewer-lessons.md`](../handover/06-code-reviewer-lessons.md) — recurring patterns (`MILA26-XXX`)
- [`../handover/07-code-review-activation-rules.md`](../handover/07-code-review-activation-rules.md) — pre-commit review-level classifier

## Anti-Overengineering Reminder

Do not add schemas, abstractions, frameworks, or infrastructure merely because they may be useful later. Add them when they solve a concrete current problem or unblock a near-term track.
