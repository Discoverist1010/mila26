# MILA26 Next Prompts

## Next Codex Prompt: Track 3C Minimal Frontend Chat Integration

```text
You are working inside the MILA26 repository.

Task:
Implement Track 3C minimal frontend chat integration.

Before editing, read:
- README.md
- package.json
- docs/handover/
- docs/architecture/frontend-chat-integration.md
- docs/architecture/api-response-conventions.md
- docs/contracts/chat-contract.md
- server/contracts/chat.ts
- server/routes/blockchainEngineerChat.ts
- src/App.tsx
- tests/

Scope:
- Implement `src/api/client.ts`.
- Implement `src/api/blockchainEngineerChat.ts`.
- Use `VITE_MILA26_API_BASE_URL`, defaulting to `http://127.0.0.1:5174`.
- Integrate the existing Blockchain Engineering Bot panel in `src/App.tsx` with `POST /api/chat/blockchain-engineer`.
- Keep state local in `App.tsx` or a very small chat module.
- Add local loading state.
- Add safe local error state.
- Add a client-side blank input guard.
- Render backend `content` as plain text.
- Add mocked-fetch tests for success, API error envelope handling, network failure, and blank input/client behavior where appropriate.
- Add light README/doc updates only if needed to explain the new local API base URL or dev flow.
- Run `npm run check`.

Acceptance criteria:
- Existing beta journey still works.
- Frontend does not call LLM providers directly.
- Backend errors map to safe UI messages.
- Chat integration uses the backend mock route.
- `npm run check` passes.

Do not do:
- No full UI redesign.
- No real LLM.
- No persistence or memory.
- No wallet/blockchain/Solidity tooling.
- No PRD/orchestration implementation.
- No payments.
- No auth.
- No global state library.
- No streaming.
- No requirement cards or drawer implementation.
- No broad refactor.
- No new dependency unless absolutely required and justified.

Report:
- Files created.
- Files modified.
- Tests run.
- `npm run check` result.
- Whether app behavior changed beyond the requested chat integration.
- Deliberate non-goals.
```

## Later Prompt Placeholder: UX Track C App Shell Layout

```text
Implement UX Track C app shell layout only.

Read the UX vision, screen flow, frontend UX architecture, and component plan first. Add the enhanced ChatGPT-style shell with left sidebar, top project bar, central workspace, and right project/status panel while preserving current product behavior. Do not implement wallet, payments, auth, PRD/orchestration, persistence, or real LLM work. Add focused tests if behavior changes. Run `npm run check`.
```

## Later Prompt Placeholder: Track 3D Real LLM Provider Planning

```text
Plan Track 3D real LLM provider integration only.

Read the chat MVP docs, LLM provider contract, API conventions, current backend route, and tests. Produce or update planning docs for backend-only provider integration, provider-disabled local behavior, safe error mapping, environment variables, test strategy, and non-goals. Do not add SDKs or real provider code yet. Run `npm run check`.
```

## Later Prompt Placeholder: Track 3E Backend-Only Real Provider Integration

```text
Implement Track 3E backend-only real provider integration after Track 3D planning is approved.

Keep provider secrets server-side. Retain the mock provider for tests. Map provider output into `BlockchainEngineerChatResponse`; never pass raw provider output to the frontend. Add provider-error safe envelopes and tests using mocked provider behavior. Do not add persistence, memory, wallet/blockchain tooling, Solidity tooling, PRD/orchestration, payments, auth, or UI redesign. Run `npm run check`.
```

## Later Prompt Placeholder: Track 3F Lightweight Turn/Project Memory

```text
Plan or implement Track 3F lightweight turn/project memory only after real provider integration is stable.

Keep the MVP local-laptop first. Prefer the smallest persistence design that supports recent chat turns and project context. Do not introduce vector DB, Redis, queues, microservices, enterprise auth, wallet private keys, or broad orchestration. Update contracts, docs, fixtures, and tests together if persisted shapes become route contracts. Run `npm run check`.
```
