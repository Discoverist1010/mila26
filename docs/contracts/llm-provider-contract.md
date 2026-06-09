# LLM Provider Adapter Contract

## Purpose

The LLM provider adapter isolates backend agents from direct provider SDKs. It keeps secrets backend-only, allows mock providers in tests, and supports future provider swapping without changing frontend contracts.

Track 6A implements the backend-only deterministic mock boundary. Track 6B adds an opt-in backend-only OpenAI provider behind the same interface. Existing product routes remain deterministic until a later route-integration track explicitly wires them to the provider.

## Initial Interface

Implemented Track 6A method:

- `complete(request)`.

Streaming and tool-calling helper methods remain later-track options only if they are justified by a concrete route. Structured text output is supported through the existing `complete(request)` method for routes that need schema-safe model output.

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
- `reasoningEffort` optional.
- `textVerbosity` optional.
- `textFormat` optional for Responses API structured outputs.
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
- OpenAI provider integration is opt-in via backend env config.
- OpenAI provider calls the Responses API with `store: false`.
- Product Setup chat can start with `gpt-5.4-mini` for lower-latency live testing; `gpt-5.5` is the latest main model option for heavier workflows. Runtime OpenAI model selection remains explicit through `MILA26_LLM_MODEL`.
- Provider-specific fields must not leak into stable frontend route contracts unless deliberately mapped.
- Environment variables must use `MILA26_LLM_PROVIDER`, `MILA26_LLM_MODEL`, `MILA26_LLM_TIMEOUT_MS`, and `MILA26_LLM_MAX_OUTPUT_TOKENS`.
- `OPENAI_API_KEY` is required only when `MILA26_LLM_PROVIDER=openai`.
- `MILA26_LLM_MODEL` is required when `MILA26_LLM_PROVIDER=openai`; OpenAI model choice is operator-configured and examples are not runtime defaults.
- `npm run test:live-openai` is opt-in through `LIVE_OPENAI=1`, defaults to five calls, caps at ten calls, and must not run inside normal deterministic checks.
- Do not introduce `VITE_` LLM variables.

## Latency Rules

- Keep prompts compact.
- Avoid repeatedly sending full project context.
- Use mock provider in tests.
- Defer streaming unless it is simple and improves the user experience.
- Avoid multi-agent or multi-model calls for normal chat unless a concrete requirement justifies them.

## What Not To Implement Yet

- No provider routing.
- No vector memory.
- No tool calling.
- No multi-agent orchestration.
- No persistence requirement.
- No product-route replacement until Track 6C explicitly scopes it.
