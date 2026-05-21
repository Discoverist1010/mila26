# MILA26 Architecture Guardrails

These guardrails exist to keep MILA26 a durable MVP foundation while it evolves from deterministic beta skeleton to live product.

## What Must Not Be Broken

- Fund setup to Requirement Brief creation.
- Requirement Brief approval before code/artifact generation.
- Servicing module catalog vocabulary and module IDs.
- Coding Bot orchestration shape.
- Mini-bot/worker task and result contracts.
- Generated artifact display as escaped text.
- Security Review gate before approved artifact/evidence release.
- Evidence Pack generation and export.
- Real deployment disabled by default.
- No browser-side live secrets.
- MVP deployment is Ethereum testnet only.
- User wallet signs deployment and token-operation transactions.
- Backend must never hold deployment private keys.
- Existing unit tests and Playwright guided journey.

## Current Beta Journey To Preserve

Fund setup -> Requirement Brief -> module selection -> Coding Bot orchestration -> generated artifacts -> Security Review -> Evidence Pack.

Some pieces are currently deterministic or lightly simulated, but the journey is product-significant and should remain intact through rewrites.

## Anti-Overengineering Guardrail

Do not add infrastructure or abstraction merely because it may be useful later. Avoid databases, queues, vector stores, agent frameworks, plugin systems, microservice boundaries, or generic orchestration platforms until a current track has a concrete need for them.

Prefer small replaceable modules, explicit contracts, direct tests, and incremental migration. If a design makes the demo slower, harder to debug, or harder to explain to investors/CTOs, reconsider it.

## Files Not To Delete Before Replacement

Do not delete these before a tested replacement exists:

- `src/domain/schemas.ts`.
- `src/domain/moduleCatalog.ts`.
- `src/domain/templates.ts`.
- `src/agents/agentRuntime.ts`.
- `src/agents/security.ts`.
- `src/agents/evidence.ts`.
- `src/App.tsx`.
- `tests/agent-runtime.test.ts`.
- `tests/security.test.ts`.
- `tests/e2e/mila26.spec.ts`.
- `.env.example`.
- `README.md` security defaults and legacy policy.
- `docs/context-pack/`.
- `docs/architecture/`.
- `docs/contracts/`.

## Contracts That Must Remain Stable Unless Deliberately Migrated

Canonical contracts:

- `FundFacts`.
- `RequirementBrief`.
- `AgentTask`.
- `AgentResult`.
- `GeneratedArtifact`.
- `SecurityReview`.
- `EvidencePack`.
- `ImplementationBundle`.
- Servicing module IDs.
- Agent role names.
- Artifact kinds.
- Deployment target states.

If a contract changes, the change must include migration notes or compatibility handling, updated tests, and updated documentation.

## Frontend/Backend Boundary Guidance

Current MILA26 is frontend-only. Future backend/API work should move sensitive, durable, and long-running work server-side:

- LLM calls.
- API keys and audit-agent keys.
- Run history and persistence.
- Evidence pack exports beyond plain browser text download.
- Solidity compilation/testing.
- Deployment simulation and any future testnet controls.
- Rate limits, origin checks, body limits, and auth.

Frontend code may own presentation, local form state, immediate validation feedback, and rendering of already-approved outputs. It must not own live secrets or production authorization decisions.

## LLM Integration Boundary Guidance

Future LLM integration should sit behind typed adapters and existing contracts:

- Do not wire UI directly to raw LLM responses.
- Parse and validate model outputs against schemas.
- Preserve deterministic fallback where practical.
- Keep prompts compact and provider-agnostic.
- Treat LLM output as untrusted until validated and security-reviewed.
- Record model/provider metadata in future run history when applicable.

## Security And Secrets Warning

Never expose live LLM, audit, wallet, custody, or deployment secrets in browser code. Vite-exposed environment variables are public to the client bundle. `OPENAI_API_KEY` and `AUDIT_AGENT_API_KEY` belong behind a backend/API boundary.

Generated Solidity remains scaffold/demo code unless compiled, tested, and externally reviewed. Do not market or label generated artifacts as production-ready, audited, or compliant.

For MVP deployment, only prepare Ethereum testnet transactions for user wallet signing. Mainnet and backend-held signing must fail closed until a later production design explicitly approves them.

Solidity generation should default to OpenZeppelin Contracts for ERC-20/ERC-721 and common access-control/security primitives unless the approved PRD explicitly justifies otherwise. Any deviation must be captured in the PRD, QA review, Security Review, and Evidence Pack. Do not install or pin Solidity/OpenZeppelin tooling until the relevant implementation track.

## Major Change Checklist

Every major change must state:

- What changed.
- Why it changed.
- What contract it touches.
- What tests protect it.
- Rollback considerations.

Use this checklist in PR notes, implementation summaries, or future Codex prompts. If a change touches security, secrets, deployment, auth, persistence, schemas, or generated artifacts, treat it as major even if the diff is small.
