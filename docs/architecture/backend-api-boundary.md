# Backend/API Boundary

This document defines the backend/API boundary. Track 2C adds only a minimal local backend skeleton with `GET /api/health`; product routes remain planned and are not implemented here.

## Purpose

The backend/API boundary exists to:

- Protect secrets.
- Support real LLM calls behind a provider adapter.
- Support chat memory.
- Support project/run state.
- Support agent orchestration.
- Support wallet-signed deployment preparation.
- Support future persistence.

The boundary should preserve the current frontend beta and contract-tested spine while enabling the next MVP stages.

Future product routes should follow `docs/architecture/api-response-conventions.md` for lightweight success and error envelopes. `/api/health` remains a simple operational endpoint.

## What Frontend Owns

- UI state and rendering.
- Wallet connection.
- User wallet signing.
- Display of bot progress and status.
- Chat input/output rendering.
- PRD approval action.
- Deployment, mint, whitelist, allocation, distribute, and valuation-upload button interactions.

## What Backend Owns

- LLM provider adapter.
- Agent orchestration coordination.
- PRD generation service.
- Run/project/chat memory persistence later.
- Security/QA benchmark execution or coordination.
- Deployment request preparation.
- Transaction status tracking support.
- Evidence pack generation or co-generation.

## What Backend Must Not Own In MVP

- User private keys.
- Mainnet deployment authority.
- Formal custodian role.
- Production KYC/AML workflow.
- Enterprise multi-tenant auth.

## Candidate API Route Groups

| Route group | Purpose | Likely request/response contract | Producer/consumer | MVP priority | Persistence | LLM | Wallet/blockchain | Latency considerations |
|---|---|---|---|---|---|---|---|---|
| `/api/health` | Local backend readiness check. | Request: none. Response: status, version, timestamp. | Frontend/dev tooling consumes backend. | High for Track 2C. | No. | No. | No. | Must be fast and deterministic. |
| `/api/projects` | Create/read local project context. | Request: project facts and optional wallet list. Response: project ID and project summary. | Frontend produces, backend stores later. | Medium. | Later SQLite. | No. | Indirect wallet metadata only. | Keep small; avoid broad project-management scope. |
| `/api/chat/blockchain-engineer` | Turn-based Blockchain Engineering Bot chat. | Request: project ID, chat turn, recent context. Response: validated assistant turn, extracted facts, suggested next action. See `docs/contracts/chat-contract.md`. | Frontend sends turns; backend mock provider produces validated output now; real LLM adapter later. | Implemented for Track 3B. | Later chat memory. | No now; yes later. | No. | Non-streaming now; stream later only if useful. |
| `/api/prd` | Generate, revise, and approve PRD/enhanced Requirement Brief. | Request: project ID, chat turn IDs, selected protocol/features, approval action. Response: PRD draft/approved state. | Engineering Bot/backend produces; user approves from frontend. | High for Track 4. | Later run/project memory. | Yes for generation. | No. | Draft generation may be slower; approval should be fast. |
| `/api/orchestration/runs` | Start and inspect bot runs from approved PRD. | Request: approved PRD ID and run options. Response: run ID, task statuses, result summaries. | Backend orchestrator produces; frontend displays. | High for Track 5. | Later run memory. | Maybe. | No. | Use in-process async first; avoid queues until needed. |
| `/api/artifacts` | List/read generated artifacts. | Request: run ID, artifact ID. Response: artifact metadata and content reference/content. | Worker bots produce; frontend/evidence consume. | High for Track 5. | Later run memory. | Maybe for generation upstream. | Solidity artifacts later inform deployment. | Avoid loading large artifact bodies in every list view. |
| `/api/security` | Run/read QA and security benchmark status. | Request: artifact/run ID. Response: benchmark status, findings, blocking status, waivers. | QA/Security bots produce; deployment gate consumes. | High for Track 5. | Later run memory. | Maybe. | Indirect; blocks deployment. | Benchmark runs may be slow; expose progress/status. |
| `/api/deployment` | Prepare wallet-signed testnet deployment and track status. | Request: deployment gate ID, artifact ID, target testnet. Response: unsigned transaction intent, chain metadata, status. | Backend prepares; frontend wallet signs. | High for Track 6. | Later run/project memory. | No. | Yes. | Preparing intent should be fast; status polling may be async. |
| `/api/valuation` | Upload/validate valuation and performance data. | Request: project ID, valuation file/summary. Response: validated summary and performance update intent. | Frontend uploads; backend validates. | Medium for Track 8. | Later project/run memory. | Maybe for summarization. | Possibly event emission later. | File validation should give fast errors. |
| `/api/evidence` | Generate/read evidence packs. | Request: run ID or evidence pack ID. Response: evidence pack status/content/export metadata. | Evidence Pack Bot/backend produces; frontend displays/downloads. | High for Track 5. | Later run memory. | Maybe for narrative. | Indirect; records deployment gate and waivers. | Cache stable completed packs. |

## Boundary Rules

- No raw LLM responses are consumed directly by UI without schema validation.
- Product route responses should use the documented API response convention.
- `POST /api/chat/blockchain-engineer` uses the API response convention and mock provider output until real LLM integration is approved.
- No browser secrets.
- No backend private-key deployment in MVP.
- All route outputs should map to documented contracts.
- Route contracts should align with `tests/fixtures/contracts/` where possible.
- Future implementation should add tests before behavior changes.
- PRD approval gates orchestration.
- Critical unresolved QA/security findings block deployment readiness unless explicitly waived for demo and recorded in the Evidence Pack.

## Local Laptop MVP Implications

- Single backend process.
- Frontend dev server plus backend dev server.
- Track 2C uses the backend only for `GET /api/health`; no product route stubs are added.
- SQLite later for local run/project/chat memory.
- In-process orchestration first.
- No Redis, queue, microservices, Kubernetes, vector DB, heavy agent framework, or enterprise auth yet.
