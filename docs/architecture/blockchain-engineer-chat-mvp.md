# Blockchain Engineering Bot Chat MVP

## Purpose

Turn-based chat with the Blockchain Engineering Bot is the first backend product capability after the health-only API skeleton.

The chat helps an asset manager clarify tokenized-portfolio requirements before Requirement Brief and Engineering Brief generation. Track 3B implemented this route with a mock/deterministic backend provider, and later tracks added backend-only LLM provider support. Real LLM calls and provider secrets must stay backend-only. Frontend code must never call LLM providers directly.

## User Journey Support

The Blockchain Engineering Bot should help the user discuss:

- ERC-20 vs ERC-721 suitability for tokenizing a portfolio.
- Whitelisting up to 20 wallet addresses.
- Investor allocation concepts and the later 100% allocation validation requirement.
- Daily valuation/performance upload.
- Performance update visibility to token holders.
- Wallet-signed Ethereum testnet deployment implications.
- OpenZeppelin Contracts as the default ERC-20/ERC-721 library policy at a high level.
- QA, security, evidence, and deployment-gate implications.

The bot should explain trade-offs in plain language, ask clarifying questions, and capture requirement candidates that the user can review before PRD generation.

## Route Plan

Implemented route:

```http
POST /api/chat/blockchain-engineer
```

The current implementation is non-streaming and deterministic. It does not persist chat turns.

## Frontend Responsibilities

- Collect user message.
- Display conversation turns.
- Show pending/loading state.
- Pass `projectId` and `runId` when available.
- Pass recent conversation context until persistence exists.
- Do not call LLM providers directly.
- Do not store or submit secrets, private keys, seed phrases, or API keys.
- Initial frontend integration should follow `docs/architecture/frontend-chat-integration.md` and keep state local.

## Backend Responsibilities

- Validate request shape and non-empty `userMessage`.
- Load or accept current project context.
- Call an LLM provider adapter or mock provider.
- Map provider output into the documented chat response contract.
- Return responses using the API response convention.
- Later persist turn memory when persistence is approved.
- Avoid leaking raw provider errors, stack traces, prompts, credentials, or sensitive traces.

## Current Track 3B Implementation

Track 3B uses:

- Mock/deterministic backend provider.
- Non-streaming response.
- Simple chat route.
- No persistence.
- Request-carried conversation context only.
- Tests for request validation, response shape, safe errors, and mock provider behavior.

This keeps the first product route testable without adding SDKs, database state, streaming, or a heavy agent framework.

## Future Strategy

Later tracks can add:

- Real LLM provider integration behind the adapter contract.
- Streaming responses if it is simple and useful.
- SQLite turn memory.
- Project memory.
- PRD generation from chat summary.
- Chat continuation while orchestration runs are active.

## Latency Considerations

- Show fast acknowledgement/loading state in the UI.
- Avoid unnecessary multi-agent calls inside normal chat.
- Keep project context compact.
- Start non-streaming unless streaming is simple.
- Use stronger/slower models only when the chat needs higher-value reasoning.
- Reuse deterministic validation and static explanations where model calls are unnecessary.

## What Not To Overengineer

- No vector memory yet.
- No multi-agent debate in chat yet.
- No heavy agent framework.
- No complex auth.
- No long-term personalization memory.
- No provider-routing framework before there is more than one real provider need.
