# LLM Provider Adapter Contract

## Purpose

The LLM provider adapter isolates backend agents from direct provider SDKs. It keeps secrets backend-only, allows mock providers in tests, and supports future provider swapping without changing frontend contracts.

The adapter is planned only. Do not add SDK dependencies, real provider calls, or provider routing until the relevant implementation track.

## Initial Interface

Documented methods:

- `generateText(input)`.
- `generateStructured(input, schemaName)`.
- `streamText(input)` later, not in the first implementation.

Track 3B should use a mock or deterministic provider that implements the same shape.

## `LLMProviderInput`

Likely fields:

- `systemInstruction`.
- `userMessage`.
- `conversationHistory`.
- `projectContext`.
- `temperature` optional.
- `maxTokens` optional.
- `responseFormat` optional.

## `LLMProviderOutput`

Likely fields:

- `text`.
- `model`.
- `usage` optional.
- `latencyMs` optional.
- `providerTraceId` optional and safe only.
- `finishReason` optional.

## Provider Rules

- No raw provider errors returned to frontend.
- No secrets in logs.
- Provider output must be mapped into the chat response contract.
- Mock provider is required for tests.
- Real provider integration comes later.
- Provider-specific fields must not leak into stable frontend route contracts unless deliberately mapped.

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
