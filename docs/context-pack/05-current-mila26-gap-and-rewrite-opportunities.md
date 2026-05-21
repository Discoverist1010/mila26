# Current MILA26 Gap And Rewrite Opportunities

Architecture principles and rewrite guardrails now live in `docs/architecture/`. Use those docs as the controlling guidance for future implementation prompts, especially `engineering-principles.md`, `architecture-guardrails.md`, `rewrite-strategy.md`, and `future-stack-considerations.md`.

Note: this context-pack captured the initial beta skeleton and an early staged rewrite map. The updated preferred sequence in `docs/architecture/rewrite-strategy.md` inserts explicit memory design before evidence/security/audit pack upgrades. Treat this file as context and the architecture docs as the current planning guardrail.

## Gap Table

| Area | Current state | Gap | Rewrite opportunity | Priority | Risk |
|---|---|---|---|---|---|
| backend/API | No backend source; all logic runs in React/browser. | No secure server boundary for secrets, runs, validation, or exports. | Introduce API routes around existing schemas and `ImplementationBundle`. | High | High if LLM/deploy features are added frontend-side. |
| real LLM integration | `.env.example` has `OPENAI_API_KEY`, but no source reads it (`.env.example:1`). | Bots are deterministic intent/template functions. | Add server-side LLM adapter behind `answerAsBlockchainEngineer` and mini-bot interfaces. | High | High if secrets leak into browser. |
| agent orchestration | `runCodingBotOrchestration` uses `Promise.all` over local functions (`src/agents/agentRuntime.ts:180-185`). | No durable run state, retries, cancellation, streaming, or audit trail. | Create orchestration service with typed task/result contracts. | High | Medium; preserve deterministic fallback. |
| persistence/run history | State is local React state only (`src/App.tsx:31-36`). | Refresh loses briefs, artifacts, findings, and evidence packs. | Add database tables for briefs, runs, tasks, artifacts, reviews, exports. | High | Medium; schema drift can break old runs. |
| auth | No auth model. | No user ownership, tenant boundary, or access control. | Add account/session model before persistence contains sensitive fund data. | High | High for production. |
| database | No database. | No durable storage or queryable history. | Add a minimal relational schema aligned to Zod contracts. | High | Medium. |
| generated Solidity compilation | Solidity is a string template (`src/domain/templates.ts:28-95`). | No compiler, tests, static analysis, or generated-code safety checks. | Add compile/test/audit pipeline behind generated artifact contract. | High | High if users mistake scaffold for production code. |
| audit/security | Regex security review only (`src/agents/security.ts:3-36`). | No AST scanning, dependency audit, Solidity analysis, or human review workflow. | Layer deterministic checks, Solidity tools, LLM/audit-agent review, and manual signoff. | High | High if release gate is treated as real audit. |
| evidence pack export | Browser downloads Markdown text (`src/App.tsx:20-28`, `src/App.tsx:167-174`). | No PDF/docx export, signatures, attachments, versioning, or immutable record. | Server-side export with run IDs, artifact hashes, and review metadata. | Medium | Medium. |
| module configurability | Catalog exists, but UI only displays modules; defaults are fixed (`src/domain/moduleCatalog.ts:10-63`, `src/App.tsx:106-116`). | User cannot enable/disable modules or edit rationales. | Add module selection UI backed by `ServicingModuleSchema`. | Medium | Medium; affects generated outputs. |
| deployment | Deployment manifest is simulation-only (`src/domain/templates.ts:113-121`). | No chain config, wallet integration, deploy service, or safety controls. | Keep disabled; later add staged testnet simulation behind backend gates. | Low now | Very high if overbuilt early. |
| observability/logging | No logging or telemetry beyond UI state. | No run trace, error capture, timing, or audit log. | Add structured server logs and run-event records once API exists. | Medium | Medium. |
| tests | Unit tests cover core runtime and one security block; e2e covers happy path (`tests/agent-runtime.test.ts:13-38`, `tests/security.test.ts:5-28`, `tests/e2e/mila26.spec.ts:3-15`). | Missing negative schema tests, golden artifacts, export tests, UI edge cases, compile tests. | Add contract/golden tests before large rewrite. | High | Low; tests reduce rewrite risk. |

## Staged Tracks

### Track 0: Preserve And Document Existing Beta Skeleton

Goal: Lock in what exists before rewriting or extending it.

Files involved:

- `docs/context-pack/*`.
- `README.md`.
- Existing tests under `tests/`.

Acceptance criteria:

- Context pack exists and cites source files.
- No application code is changed.
- Current git diff is documentation-only.

Tests/smoke tests:

- Optional: `npm run check`.
- Optional: `npm run test:e2e`.

What not to overbuild:

- Do not introduce backend, agents, schema changes, or UI refactors in this track.

### Track 1: Make Current Contracts Explicit

Goal: Turn implicit contracts into durable developer-facing specs and tests.

Files involved:

- `src/domain/schemas.ts`.
- `src/agents/agentRuntime.ts`.
- `src/domain/templates.ts`.
- `src/agents/security.ts`.
- `src/agents/evidence.ts`.
- `tests/agent-runtime.test.ts`.
- `tests/security.test.ts`.
- New contract/golden tests if needed.

Acceptance criteria:

- Requirement Brief, Agent Task, Agent Result, Generated Artifact, Security Review, Evidence Pack, and Implementation Bundle contracts are documented or tested.
- Golden examples exist for a known fund input.
- Current UI journey still passes.

Tests/smoke tests:

- `npm run test`.
- `npm run check`.
- `npm run test:e2e` if UI text or flow changes.

What not to overbuild:

- Do not add LLMs, persistence, queues, or auth yet.

### Track 2: Introduce Backend/API Boundary

Goal: Move sensitive and future-agent operations behind a server/API boundary while preserving frontend behavior.

Files involved:

- New backend/API entrypoint and routes.
- Existing schemas in `src/domain/schemas.ts` or a shared package/module.
- `src/App.tsx` only as needed to call API endpoints.
- `.env.example`.

Acceptance criteria:

- Frontend no longer directly owns future-secret-dependent operations.
- API validates request/response bodies with existing schemas.
- `ENABLE_REAL_DEPLOY=false` remains enforced by default.
- Existing deterministic runtime can still run as server-side fallback.

Tests/smoke tests:

- API route unit tests.
- Existing unit tests.
- Existing e2e journey.
- Negative validation tests.

What not to overbuild:

- Avoid multi-tenant enterprise auth, job queues, or real deployment in the first API pass.

### Track 3: Introduce Real LLM Agent Adapter Behind Existing Deterministic Functions

Goal: Add LLM capability without breaking current deterministic contracts.

Files involved:

- `src/agents/agentRuntime.ts` or new adapter modules.
- Backend/API routes from Track 2.
- `.env.example`.
- Tests for adapter fallback and schema validation.

Acceptance criteria:

- LLM output is parsed/validated against existing schemas.
- Deterministic fallback remains available.
- Secrets never enter browser bundle.
- Unsafe model output is still reviewed before release.

Tests/smoke tests:

- Mocked LLM adapter tests.
- Schema rejection tests.
- Security review tests.
- E2E happy path using deterministic/mock mode.

What not to overbuild:

- Do not let free-form model output replace typed contracts.
- Do not add provider-specific logic throughout the app.

### Track 4: Add Persistence/Run History

Goal: Save briefs, runs, tasks, artifacts, reviews, and evidence packs.

Files involved:

- New database schema/migrations.
- Backend/API run endpoints.
- Shared schemas.
- UI history surface in `src/App.tsx` or new components.

Acceptance criteria:

- Users can retrieve prior runs.
- Artifacts and evidence packs are tied to requirement brief IDs.
- Security findings and blocked artifacts are persisted.
- Old deterministic runs remain readable after schema additions.

Tests/smoke tests:

- Database migration tests.
- API create/read tests.
- E2E create run then reload/read history.

What not to overbuild:

- Avoid complex analytics or collaboration workflows until basic run history is solid.

### Track 5: Upgrade Evidence/Security/Audit Pack

Goal: Make evidence and security outputs more credible for audit-preparation use.

Files involved:

- `src/agents/security.ts`.
- `src/agents/evidence.ts`.
- Solidity template/generator files.
- Backend export routes.
- New tests and fixtures.

Acceptance criteria:

- Evidence pack includes stable run ID, artifact inventory, hashes, review metadata, and disclaimer.
- Security review has more than regex checks.
- Solidity artifacts can be compiled or explicitly marked uncompiled.
- Blocked artifacts cannot be exported as approved.

Tests/smoke tests:

- Security positive/negative tests.
- Evidence pack golden tests.
- Solidity compile smoke test once compiler is introduced.

What not to overbuild:

- Do not claim legal, regulatory, tax, investment, or formal audit certification.

### Track 6: Improve UI Module Configurability

Goal: Let users configure servicing modules without breaking default-safe behavior.

Files involved:

- `src/App.tsx` or new UI components.
- `src/domain/moduleCatalog.ts`.
- `src/domain/schemas.ts`.
- `tests/e2e/mila26.spec.ts`.

Acceptance criteria:

- Users can enable/disable modules.
- Users can inspect or edit rationale where appropriate.
- Generated brief reflects selected modules.
- Solidity/evidence outputs remain traceable to selected modules.

Tests/smoke tests:

- Unit tests for module selection to brief mapping.
- E2E selecting modules and running agents.
- Golden artifact tests for module-dependent output.

What not to overbuild:

- Avoid full product configurator complexity before backend contracts are stable.

### Track 7: Production Hardening

Goal: Prepare MILA26 for controlled production use.

Files involved:

- Backend/API.
- Auth/session modules.
- Database.
- Observability/logging.
- Deployment configuration.
- Security review and evidence export paths.

Acceptance criteria:

- Auth and access control exist.
- Secrets are server-only.
- Rate limits, body limits, and origin checks are enforced.
- Run history is auditable.
- Errors are observable.
- Real deployment remains disabled unless explicitly designed, reviewed, and gated.

Tests/smoke tests:

- Full `npm run check`.
- E2E journeys for create/read/export.
- Auth/access-control tests.
- Security regression tests.
- Deployment smoke tests for non-live environments only.

What not to overbuild:

- Do not add live mainnet deployment until product, legal, custody, audit, and operational controls are designed outside this beta skeleton.
