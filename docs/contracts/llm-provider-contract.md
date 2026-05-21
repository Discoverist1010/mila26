# LLM Provider Adapter Contract

## Purpose

The LLM provider adapter isolates backend agents from direct provider SDKs. It keeps secrets backend-only, allows mock providers in tests, and supports future provider swapping without changing frontend contracts.

Track 6A implements the backend-only deterministic mock boundary. Do not add SDK dependencies, real provider calls, or provider routing until the relevant implementation track.

## Initial Interface

Implemented Track 6A method:

- `complete(request)`.

Streaming or structured helper methods remain later-track options only if they are justified by a concrete route.

## `Mila26LlmProvider`

Implemented fields:

- `provider`.
- `model`.
- `complete(request)`.

## `Mila26LlmRequest`

Implemented fields:

- `purpose`.
- `messages`.
- `temperature` optional.
- `maxOutputTokens` optional.
- `metadata` optional and safe only.

## `Mila26LlmResponse`

Implemented fields:

- `content`.
- `provider`.
- `model`.
- `usage` optional.
- `metadata` optional and safe only.

## Provider Rules

- No raw provider errors returned to frontend.
- No secrets in logs.
- Provider output must be mapped into the chat response contract.
- Mock provider is required for tests.
- Real provider integration comes later.
- Provider-specific fields must not leak into stable frontend route contracts unless deliberately mapped.
- Environment variables must use `MILA26_LLM_PROVIDER`, `MILA26_LLM_MODEL`, `MILA26_LLM_TIMEOUT_MS`, and `MILA26_LLM_MAX_OUTPUT_TOKENS`.
- `OPENAI_API_KEY` is reserved for a future backend-only Track 6B provider and is not required by Track 6A.
- Do not introduce `VITE_` LLM variables.

## Latency Rules

- Keep prompts compact.
- Avoid repeatedly sending full project context.
- Use mock provider in tests.
- Defer streaming unless it is simple and improves the user experience.
- Avoid multi-agent or multi-model calls for normal chat unless a concrete requirement justifies them.

## What Not To Implement Yet

- No SDK dependency.
- No provider routing.
- No vector memory.
- No tool calling.
- No multi-agent orchestration.
- No persistence requirement.
