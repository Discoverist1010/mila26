# Chat Contract

This contract defines the first backend product route for the Blockchain Engineering Bot. Track 3B implements it with lightweight server-side Zod validation and a mock/deterministic provider.

## `ChatMessage`

Likely fields:

- `messageId`.
- `role`: `user`, `assistant`, or `system`.
- `content`.
- `createdAt`.
- `agentId` optional.
- `projectId` optional.
- `runId` optional.

## `BlockchainEngineerChatRequest`

Likely fields:

- `projectId` optional.
- `runId` optional.
- `userMessage`.
- `conversationHistory` optional.
- `projectContext` optional.
- `assistantMode` optional: `engineering` or `advisor`; defaults to `engineering`.
- `requestedFocus` optional: `protocol_choice`, `whitelist`, `valuation_update`, `deployment`, or `security`.

## `BlockchainEngineerChatResponse`

Likely fields:

- `messageId`.
- `agentId`: `blockchain-engineer`.
- `content`.
- `suggestedRequirementUpdates` optional.
- `openQuestions` optional.
- `protocolComparison` optional.
- `riskNotes` optional.
- `nextRecommendedAction` optional.
- `createdAt`.

## `SuggestedRequirementUpdate`

Likely fields:

- `field`.
- `proposedValue`.
- `rationale`.
- `confidence`.

## Invariants

- `userMessage` is required and non-empty.
- Response must not be raw provider output.
- Response must be safe for frontend rendering.
- No secrets, private keys, seed phrases, or API keys.
- No claim of formal legal, regulatory, investment, tax, or audit advice.
- ERC recommendation should explain trade-offs, not force a choice.
- Advisor mode is explanatory Q&A inside the same AI panel and shared project context; it must not create a second workflow state store or generate artifacts.
- Any suggested requirement update must be reviewable by the user before PRD generation.
- Chat output must follow the API response convention when returned from backend routes.

## Current Route Test Coverage

Track 3B route tests cover:

- Valid chat request returns `ok: true`.
- Response includes `agentId: blockchain-engineer`.
- Protocol query returns the active Product Setup protocol bases: `ERC-20`, `ERC-4626`, `ERC-3643`, and `Custom ERC-20 with rebasing`; ERC-721 may be explained as out of scope, but must not be presented as an active ZiLi-OS choice.
- Whitelist, valuation/performance, deployment, and security/OpenZeppelin topics return relevant content.
- Blank `userMessage` returns `VALIDATION_ERROR`.
- Invalid `conversationHistory` returns `VALIDATION_ERROR`.

Track 3B.1 fixture tests cover:

- `blockchain-engineer-chat-request.json`.
- `blockchain-engineer-chat-response.json`.
- `blockchain-engineer-chat-validation-error.json`.
- Live route acceptance of the request fixture.
- Live route rejection of blank `userMessage`.

## Future Fixture/Test Expectations

When a real provider or persistence is introduced:

- Update the existing chat fixtures deliberately if the contract changes.
- Keep validating request and response shape.
- Keep testing safe error responses.
- Test real provider output mapping through a mock adapter.
- Test that raw provider output is not passed directly to the frontend contract.
