# Frontend Chat Integration Plan

Status: historical. The frontend-to-backend chat path has already been implemented. Do not treat this file as the current next prompt; use `docs/handover/04-mila26-next-prompts.md` for the active Track 13B wallet/Sepolia prompt.

This plan defines the smallest safe path for connecting the current frontend Blockchain Engineering Bot panel to the backend mock chat route. It does not implement the integration.

## Purpose

- Connect the existing frontend Blockchain Engineering Bot panel to the backend mock route.
- Prove the frontend-to-backend chat path before real LLM integration.
- Preserve the current UI and beta product behavior as much as possible.
- Keep chat integration separate from the future dark dashboard shell, requirement cards, wallet flows, PRD generation, and orchestration.

## Current Frontend Behavior

`src/App.tsx` currently keeps chat-like state local:

- `question`: current text in the Blockchain Engineer Bot textarea.
- `engineerAnswer`: computed with `useMemo(() => answerAsBlockchainEngineer(question, brief), [question, brief])`.
- `brief`: optional current `RequirementBrief`, used to add context to deterministic answers.

Current deterministic logic:

- `answerAsBlockchainEngineer(question, brief?)` lives in `src/agents/agentRuntime.ts`.
- It handles broad topics such as deployment, audit/security, NAV/valuation, and default Requirement Brief guidance.
- It runs entirely in the browser bundle today.

Future Track 3C should replace or wrap the `engineerAnswer` path with backend response state. Keep the old deterministic helper as a fallback only if useful for local/offline development; do not remove it as part of the first integration unless tests prove parity.

## Backend Route To Call

Route:

```http
POST /api/chat/blockchain-engineer
```

Success envelope:

```json
{
  "ok": true,
  "data": {
    "messageId": "chat-id",
    "agentId": "blockchain-engineer",
    "content": "Assistant response",
    "createdAt": "ISO timestamp"
  }
}
```

Error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Safe human-readable message"
  }
}
```

Contracts:

- `ChatMessage`.
- `BlockchainEngineerChatRequest`.
- `BlockchainEngineerChatResponse`.
- `SuggestedRequirementUpdate`.

Source contract: `server/contracts/chat.ts`.

## Frontend API Client Plan

Add a small client later:

```text
src/api/client.ts
src/api/blockchainEngineerChat.ts
```

The client should:

- Use a configurable API base URL.
- Default to `http://127.0.0.1:5174` for local dev.
- Allow override through `VITE_MILA26_API_BASE_URL`.
- Send `BlockchainEngineerChatRequest`.
- Parse the API success/error envelope.
- Return `BlockchainEngineerChatResponse` or a safe UI error object.
- Avoid exposing raw stack traces, provider details, or backend internals.

Do not scatter `fetch` calls through React components.

## Vite / Local Dev API Base URL

Recommended approach: explicit `VITE_MILA26_API_BASE_URL`.

Why:

- Frontend runs on `http://127.0.0.1:5173`.
- Backend runs on `http://127.0.0.1:5174`.
- The backend already has minimal local CORS handling.
- An explicit URL avoids adding proxy complexity while the app has only one product route.
- It keeps local dev behavior obvious in `.env.example`.

Recommended future value:

```text
VITE_MILA26_API_BASE_URL=http://127.0.0.1:5174
```

Vite proxy can be reconsidered if multiple frontend routes need backend access and local development becomes noisy.

## UI State Plan

Track 3C implementation should keep state local in `App.tsx` or a small chat feature module:

- `isBotReplyLoading`.
- `botChatError`.
- `conversationHistory` or minimal message history.
- `latestBotReply` or equivalent replacement for `engineerAnswer`.

Add a client-side blank input guard before calling the backend. Keep the existing textarea and response area initially.

Do not introduce React Context, Zustand, Redux, XState, or a global store for this step.

## Response Rendering

For Track 3C:

- Display `response.content` as the assistant answer.
- Keep rendering as plain text.
- Defer rich rendering of `suggestedRequirementUpdates`, `openQuestions`, `protocolComparison`, and `riskNotes` unless it is trivial and tested.
- Do not implement requirement cards yet.
- Do not implement the new dark dashboard shell yet.

Structured response fields should be saved in local state only if the current UI needs them.

## Error Handling

Handle:

- Client-side blank input guard.
- Backend `VALIDATION_ERROR`.
- Network failure when the API server is not running.
- Unexpected API envelope shape.

Display safe messages only:

- No raw stack traces.
- No raw provider errors.
- No backend internals.
- No secrets.

## Testing Plan For Track 3C

Recommended tests:

- API client success with mocked `fetch`.
- API client error envelope handling with mocked `fetch`.
- Network failure mapping to a safe UI error.
- `App` still renders.
- Optional UI test: submitting a chat question displays a backend mock response.

Avoid brittle long-copy assertions. Prefer structural checks such as:

- loading state appears/disappears.
- assistant response is non-empty.
- ERC query shows `ERC-20` and `ERC-721`.
- validation/network errors show a safe message.

## What Track 3C Must Not Do

- No real LLM.
- No persistence or memory.
- No streaming.
- No PRD generation.
- No orchestration.
- No wallet/blockchain tooling.
- No full UI redesign.
- No global state library.
- No requirement cards or drawer implementation.
