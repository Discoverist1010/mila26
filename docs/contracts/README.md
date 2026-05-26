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
- [`deployment-gate-contract.md`](deployment-gate-contract.md): testnet deployment readiness gate.

The existing fixtures protect current beta contracts. Planned MVP contracts need fixtures and contract tests before or alongside implementation.

Track 3B.1 adds chat fixtures for the mock backend chat route. Update these deliberately when frontend chat integration, persistence, or a real LLM provider changes the contract.

## Anti-Overengineering Reminder

Do not add schemas, abstractions, frameworks, or infrastructure merely because they may be useful later. Add them when they solve a concrete current problem or unblock a near-term track.
