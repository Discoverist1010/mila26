# Current MILA26 Preservation Baseline

| Area | Existing file/function | Why it matters | Preserve / Rewrite / Replace later | Notes |
|---|---|---|---|---|
| UI journey | `src/App.tsx` `App`, `createBrief`, `runAgents` (`src/App.tsx:30-188`) | Encodes the current beta flow from fund setup to brief approval to agent run to evidence pack. | Preserve now; rewrite later with same milestones. | Keep approval gate before generation. |
| UI journey | `tests/e2e/mila26.spec.ts` (`tests/e2e/mila26.spec.ts:3-15`) | Captures the user-visible journey as a smoke baseline. | Preserve. | Extend before UI rewrite. |
| Schemas | `src/domain/schemas.ts` (`src/domain/schemas.ts:3-85`) | Current contracts for facts, briefs, tasks, artifacts, results, review, and evidence. | Preserve; make more explicit in Track 1. | Use migrations if changing shape. |
| Module catalog | `moduleCatalog`, `defaultModules`, `labelForModule` (`src/domain/moduleCatalog.ts:10-67`) | Defines product vocabulary for tokenized fund servicing modules. | Preserve; improve configurability later. | `cash-registry` and `dividend` exist but are not default-enabled. |
| Templates | `generateSolidityArtifact` (`src/domain/templates.ts:14-104`) | Produces the most concrete generated implementation artifact. | Preserve now; replace later with compile-tested generation. | Current Solidity is audit-preparation scaffold only. |
| Templates | `generateDeploymentManifest` (`src/domain/templates.ts:106-127`) | Keeps deployment simulation explicit and non-live. | Preserve. | Do not turn on real deployment without backend gating. |
| Agent runtime | `createRequirementBrief` (`src/agents/agentRuntime.ts:33-53`) | Converts fund facts and goal into the core Requirement Brief. | Preserve; move server-side later. | Current IDs are timestamp-based. |
| Agent runtime | `answerAsBlockchainEngineer` (`src/agents/agentRuntime.ts:55-71`) | Defines plain-language guidance and current bot personality. | Preserve behavior; replace implementation later. | Good candidate for LLM adapter. |
| Agent runtime | `decomposeForMiniBots` (`src/agents/agentRuntime.ts:73-106`) | Defines worker roles and acceptance criteria. | Preserve roles; make configurable later. | Currently fixed four-task decomposition. |
| Agent runtime | `runCodingBotOrchestration` (`src/agents/agentRuntime.ts:180-194`) | Top-level orchestration contract returning `ImplementationBundle`. | Preserve contract; move orchestration backend later. | Good API boundary candidate. |
| Security review | `runSecurityReview` (`src/agents/security.ts:3-36`) | Current release gate before evidence pack. | Preserve; strengthen later. | Regex-only today. |
| Evidence pack | `generateEvidencePack` (`src/agents/evidence.ts:4-60`) | Produces the asset-manager-facing handoff artifact. | Preserve format; enrich later. | Markdown-only, browser-side today. |
| Tests | `tests/agent-runtime.test.ts` (`tests/agent-runtime.test.ts:13-38`) | Protects core deterministic runtime behavior. | Preserve and expand. | Add schema snapshots before rewrite. |
| Tests | `tests/security.test.ts` (`tests/security.test.ts:5-28`) | Verifies blocking behavior for unsafe content. | Preserve and expand. | Add more forbidden-pattern cases later. |
| E2E journey | `tests/e2e/mila26.spec.ts` (`tests/e2e/mila26.spec.ts:3-15`) | Confirms the beta works end to end in browser. | Preserve. | Use as rewrite parity check. |
| Environment config | `.env.example` (`.env.example:1-4`) | Documents intended future secrets/origin/deploy config. | Preserve; wire up later. | Currently unused by source. |
| Build scripts | `package.json` scripts (`package.json:6-14`) | Defines dev, build, lint, unit, e2e, and check commands. | Preserve. | `check` does not include e2e. |
| Frontend runtime | `src/main.tsx` (`src/main.tsx:1-10`) | Minimal React entrypoint. | Preserve. | No router or providers today. |
| Styling | `src/styles.css` (`src/styles.css:1-168`) | Establishes current dense dashboard layout. | Safe to improve now. | Avoid changing user journey while documenting. |
| Legacy policy | `README.md` (`README.md:35-37`) | Prevents copying risky legacy dashboard patterns into this repo. | Preserve. | Important rewrite guardrail. |

## Do Not Delete Before Replacement

- `src/domain/schemas.ts`.
- `src/domain/moduleCatalog.ts`.
- `src/agents/agentRuntime.ts`.
- `src/agents/security.ts`.
- `src/agents/evidence.ts`.
- `src/domain/templates.ts`.
- `tests/agent-runtime.test.ts`.
- `tests/security.test.ts`.
- `tests/e2e/mila26.spec.ts`.
- `.env.example`.
- README security defaults and legacy policy.

## Safe To Improve Now

- Add documentation around current schemas and generated artifact examples.
- Add more tests for schema validation, security blocker patterns, and evidence pack content.
- Add UI labels/help text only where it clarifies current behavior without changing flow.
- Add snapshot or golden-output tests for deterministic artifacts.
- Add stricter lint/typecheck settings if they do not force application refactors.
- Improve responsive CSS polish while preserving the same visible workflow.

## Should Become Backend/LLM Later

- Blockchain Engineer Bot responses.
- Requirement Brief creation and validation.
- Coding Bot orchestration.
- Mini-bot execution.
- Security review and audit-agent integration.
- Evidence pack export and run history.
- Solidity compilation/test/audit pipeline.
- Environment variable enforcement.
- Auth, database, persistence, observability, and deployment controls.
