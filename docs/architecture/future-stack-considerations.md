# MILA26 Future Stack Considerations

This document prepares future stack discussions. It does not make final stack decisions.

MILA26 should choose tools that preserve the current contract spine, support funding-demo readiness, keep latency under control, and avoid exposing secrets in browser code.

Stack choices should avoid overengineering. Do not add infrastructure before the product workflow needs it. Prefer small replaceable modules over large generic frameworks, and prefer explicit code over clever meta-frameworks. Each future stack addition should explain the concrete current problem it solves, the extension it enables, the complexity it adds, and the test that protects it.

The MVP path is now local Mac laptop first, with a lightweight TypeScript backend later, SQLite later for local run/project/chat memory, and wallet-signed Ethereum testnet deployment. See `mvp-stack-decisions.md` and `wallet-signed-deployment.md` for the current preferred direction.

## Frontend

Current state: Vite + React + TypeScript.

Considerations:

- Keep the current app runnable while backend boundaries are introduced.
- Preserve the guided journey and evidence visibility.
- Add UI state for async runs without forcing a full app rewrite.
- Avoid heavy UI dependencies unless they improve demo quality or maintainability.
- Do not adopt a large UI framework only to solve a small layout or form-state problem.

Latency implications:

- Immediate local validation and progress feedback keep the app responsive.
- Avoid blocking the UI on long-running model/audit/compile work.

## Backend/API

Open options:

- Vercel serverless functions.
- Express or Fastify.
- Next.js API routes.
- Another runtime chosen for deployment and maintainability.

Considerations:

- Server-side secrets.
- Request/response schema validation.
- Rate limits and body limits.
- Run orchestration endpoints.
- Evidence export endpoints.
- Future auth and persistence.
- Start with the smallest backend boundary that protects secrets and contracts.

Latency implications:

- Serverless cold starts may affect demo responsiveness.
- Long-running agent/audit work may need background jobs rather than request/response blocking.

## LLM Provider Adapter

Considerations:

- Provider-specific SDKs should stay behind adapters.
- Outputs must be parsed and schema-validated.
- Deterministic fallback should remain possible.
- Model choice should match task difficulty.

Latency implications:

- Use smaller/faster models for classification, formatting, and simple rewrites.
- Reserve stronger/slower models for high-value reasoning.
- Avoid sequential provider calls unless dependency is explicit.

## Memory Design

Memory types to distinguish:

- Short-term run memory: state within one artifact-generation run.
- Long-term user memory: preferences or facts across sessions.
- Project memory: stable project facts, module choices, prior decisions.
- Agent working memory: temporary reasoning/context for an agent task.

Considerations:

- Retention and deletion rules.
- Privacy and sensitivity of fund/product data.
- Whether memory is user-visible and editable.
- How memory affects evidence traceability.

Latency implications:

- Retrieval adds latency; use only when it improves output quality.
- Cache or summarize stable memory rather than retrieving large histories repeatedly.

## Run History

Considerations:

- Persist Requirement Briefs, tasks, results, artifacts, security reviews, and evidence packs.
- Store run status and timestamps.
- Preserve traceability from inputs to outputs.
- Support replay or comparison between runs.

Latency implications:

- Writes should not block UI updates unnecessarily.
- Read paths for recent runs should be fast for demos.

## Database

Considerations:

- Relational storage fits typed contracts and traceable run history.
- JSON columns may help preserve evolving contract payloads.
- Migrations must be deliberate and test-protected.

Latency implications:

- Keep common read/write paths simple.
- Avoid joining large logs or artifact bodies into every list view.

## Vector Store Or Retrieval Layer

Considerations:

- Do not add before memory scope is clear.
- Useful later for project memory, prior runs, policy docs, or audit references.
- Must not become an untraceable source of hidden decisions.
- Do not add a vector store merely because future retrieval might be useful.

Latency implications:

- Retrieval adds network and ranking time.
- Use targeted retrieval and compact summaries.

## Queue/Background Jobs

Considerations:

- Needed for long-running LLM, audit, compile, export, or deployment simulation work.
- Should expose run/task status to UI.
- Must support retries and failure reasons.
- Do not add a queue before a real operation outgrows request/response or local async handling.

Latency implications:

- Improves UI responsiveness for slow work.
- Adds operational complexity and eventual consistency.

## Observability/Logging

Considerations:

- Log run IDs, task IDs, artifact IDs, error types, and timing.
- Avoid logging secrets or sensitive raw content unnecessarily.
- Security blocks should be auditable.

Latency implications:

- Structured logs should be lightweight.
- Deep tracing is useful for backend stages but should not slow the happy path excessively.

## Auth

Considerations:

- Required before persistent sensitive fund data is exposed across sessions.
- Must establish user/account ownership of runs and artifacts.
- Funding-demo MVP may use simpler controlled access than production.

Latency implications:

- Auth checks should be fast and cached where safe.
- Avoid complex permission models before product roles are known.

## Deployment

Considerations:

- Keep real deployment disabled by default.
- Separate app deployment from smart contract deployment.
- Testnet or mainnet controls require legal, custody, audit, and operational review.
- MVP deployment direction is Ethereum testnet only with user wallet signing.
- Backend must not hold deployment private keys.

Latency implications:

- App deployment choice affects cold starts and static asset delivery.
- Contract deployment flows are slow and should be async/status-driven.

## Evidence Pack Export

Considerations:

- Markdown is current baseline.
- Future exports may include PDF, DOCX, ZIP, artifact hashes, manifests, and signatures.
- Export should consume persisted run data rather than scrape UI state.

Latency implications:

- Rich exports can be generated asynchronously.
- Cache completed exports by run/version.

## Smart Contract Compilation/Testing

Considerations:

- Generated Solidity is scaffold code today.
- Future compile/test should happen backend-side or in controlled CI-like jobs.
- Compiler output should be linked to artifact IDs.

Latency implications:

- Compilation and static analysis can be slow.
- Run asynchronously and show status/progress.

## Open Questions

- Should backend be Vercel serverless, Express/Fastify, Next.js API, or another runtime?
- Should memory be short-term run memory, long-term user memory, project memory, or agent working memory?
- What should be persisted?
- What should be cached?
- What should stay local/deterministic?
- What requires LLM calls?
- What is needed for funding-demo MVP vs later production?
- Which evidence export format matters first for investor/CTO/compliance review?
- How much auth is enough for a controlled funding demo?
- When does generated Solidity need compilation versus clear scaffold labeling?
