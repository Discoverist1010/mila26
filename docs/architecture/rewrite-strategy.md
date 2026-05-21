# MILA26 Rewrite Strategy

This is not a blank rewrite. The current skeleton is useful and should not be wiped blindly.

The goal is to preserve product behavior while improving the technical skeleton. MILA26 already has a coherent beta journey, stable domain concepts, deterministic agent simulation, generated artifacts, security review, evidence pack generation, and tests. Future work should replace pieces deliberately, behind contracts, with parity tests.

For the confirmed local-laptop MVP path, use `docs/architecture/mvp-track-plan.md` as the near-term delivery plan. The sequence below remains useful as historical architecture guidance, but the MVP track plan is the current planning reference for Track 2A onward.

Track 2B backend/API boundary planning lives in `docs/architecture/backend-api-boundary.md`, with planned API contract references in `docs/contracts/mvp-api-contracts.md` and the adjacent contract notes. Backend implementation should wait until those boundary docs are reviewed and the affected fixtures/tests are planned.

## Rewrite Philosophy

- Preserve the main workflow: Fund setup -> Requirement Brief -> module selection -> Coding Bot orchestration -> generated artifacts -> Security Review -> Evidence Pack.
- Keep MILA26 runnable after every stage.
- Add contracts and tests before changing behavior.
- Move sensitive/intelligent/durable work behind backend boundaries incrementally.
- Do not introduce real LLM calls, persistence, auth, deployment integrations, or UI refactors until the relevant track calls for them.
- Do not overbuild production architecture before funding-demo MVP needs are clear.
- Prefer incremental migration over platform rewrites.
- Add abstractions only when they solve a concrete current problem and are protected by tests.

## Preferred Track Sequence

### Track 0: Context Capture And Preservation Baseline

Goal: Capture what exists and what must not be lost.

Acceptance criteria:

- Context pack exists.
- Preservation baseline identifies files, contracts, tests, and current gaps.
- No application code is changed.

Do not overbuild:

- No backend, LLMs, persistence, auth, or UI rewrite.

### Track 1: Contract Docs And Golden Tests

Goal: Make current contracts explicit and test-protected.

Acceptance criteria:

- Canonical contracts are documented.
- Golden fixtures cover a known run shape.
- Tests protect Requirement Brief, Agent Task, Agent Result, Generated Artifact, Security Review, Evidence Pack, and Implementation Bundle shapes.
- `npm run check` passes.

Do not overbuild:

- No provider adapters, databases, queues, or new product flows.
- No generic agent framework unless the current deterministic worker contract can no longer support the track.

### Track 2: Backend/API Boundary

Goal: Move future-secret-dependent and durable operations behind a server boundary.

Acceptance criteria:

- API validates request/response bodies with existing schemas.
- Frontend no longer needs direct ownership of future LLM/audit/deploy secrets.
- Deterministic runtime can run server-side or through a server-compatible service layer.
- Current beta journey still works.
- Planned API contracts are documented before backend route implementation starts.

Do not overbuild:

- Avoid full auth, multi-tenant permissions, production queues, or real deployment.
- Do not add a database, queue, or service mesh as part of the first API boundary unless the workflow explicitly needs it.

### Track 3: LLM Adapter Behind Existing Agent Contracts

Goal: Add real model intelligence without breaking stable contracts.

Acceptance criteria:

- LLM outputs are schema-validated.
- Deterministic fallback remains available.
- Provider-specific logic is isolated.
- Browser never receives live API secrets.
- Security review still gates release/export.

Do not overbuild:

- Do not let free-form model output become the contract.

### Track 4: Persistence And Run History

Goal: Save briefs, runs, tasks, artifacts, reviews, and evidence packs.

Acceptance criteria:

- Users can retrieve prior runs.
- Artifacts and evidence packs trace back to Requirement Brief IDs and task IDs.
- Security blocks are persisted.
- Old deterministic runs remain readable after schema additions.

Do not overbuild:

- Avoid analytics dashboards or collaboration features before basic run history is stable.

### Track 5: Memory Design For Agent Orchestration

Goal: Define what memory means before building it.

Acceptance criteria:

- Short-term run memory, long-term user memory, project memory, and agent working memory are distinguished.
- Retention, privacy, and user-control rules are documented.
- Memory usage is tied to latency, traceability, and safety.
- No sensitive memory is stored without an explicit policy.

Do not overbuild:

- Do not add vector stores or embeddings before persistence and memory scope are clear.
- Do not call retrieval "memory" until retention, privacy, traceability, and latency tradeoffs are defined.

### Track 6: Evidence/Security/Audit Pack Upgrade

Goal: Make evidence and security outputs more credible for CTO, compliance, and audit-preparation review.

Acceptance criteria:

- Evidence pack includes stable run IDs, artifact inventory, hashes or integrity metadata where appropriate, review metadata, and disclaimers.
- Security review is stronger than regex-only.
- Generated Solidity is compiled/tested or explicitly marked uncompiled.
- Blocked artifacts cannot be exported as approved.

Do not overbuild:

- Do not claim formal legal, regulatory, tax, investment, or audit certification.

### Track 7: UI Module Configurability And Demo Polish

Goal: Improve the user-facing configuration and funding-demo flow without breaking contracts.

Acceptance criteria:

- Users can configure modules safely.
- Requirement Brief reflects selected modules.
- Generated artifacts and evidence pack trace to selected modules.
- UI remains responsive and demoable.
- Playwright journey is updated and passing.

Do not overbuild:

- Avoid a full enterprise product configurator before backend/run history is solid.

### Track 8: Production Hardening

Goal: Prepare for controlled real-world use.

Acceptance criteria:

- Auth and access control exist.
- Secrets are server-only.
- Rate limits, body limits, origin checks, and audit logs exist.
- Observability covers run failures and security blocks.
- Deployment remains gated and non-live unless deliberately designed, reviewed, and approved.

Do not overbuild:

- Do not add live mainnet paths until legal, custody, audit, and operational controls are ready.

## Rewrite Readiness Rule

Before a rewrite step starts, state:

- What behavior is being preserved.
- What contract is being touched.
- What tests will prove parity.
- What rollback path exists.
