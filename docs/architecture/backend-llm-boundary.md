# Backend LLM Boundary

## Purpose

Track 6A adds the backend-only LLM adapter boundary for MILA26.

This is infrastructure only. It introduces typed request/response interfaces, backend environment parsing, a provider factory, and a deterministic mock provider so Track 6B can add the first real provider behind the same interface.

Track 6A does not make real LLM calls, does not install an OpenAI SDK, does not require API keys, and does not expose provider config or secrets to the frontend.

## Environment Variables

Backend LLM configuration uses these exact names:

| Variable | Track 6A default | Track 6A behavior |
|---|---:|---|
| `MILA26_LLM_PROVIDER` | `mock` | Only `mock` is accepted. `openai` is reserved for Track 6B and returns a safe unsupported-provider error in Track 6A. |
| `MILA26_LLM_MODEL` | `mila26-mock-model` | Model label used by the mock provider. Do not hard-code a real model in Track 6A. |
| `MILA26_LLM_TIMEOUT_MS` | `30000` | Parsed as a positive integer; invalid values fall back to the default. |
| `MILA26_LLM_MAX_OUTPUT_TOKENS` | `2000` | Parsed as a positive integer; invalid values fall back to the default. |
| `OPENAI_API_KEY` | none | Reserved for future Track 6B backend-only OpenAI integration. Not required or read by Track 6A. |

Do not create `VITE_` LLM variables. Vite environment variables are public to the browser bundle and must not be used for backend LLM secrets.

## Boundary Files

- `server/llm/types.ts`: typed `Mila26Llm*` provider, config, request, response, usage, and safe config-error contracts.
- `server/llm/config.ts`: backend-only config parser for the `MILA26_LLM_*` variables.
- `server/llm/mockProvider.ts`: deterministic provider used for local tests and fallback.
- `server/llm/providerFactory.ts`: provider construction boundary.

## Request Shape

The LLM boundary accepts typed messages and a narrow purpose:

```ts
{
  purpose: 'blockchain_engineer_chat' | 'engineering_brief_generation',
  messages: [{ role: 'system' | 'user' | 'assistant', content: '...' }],
  temperature?: number,
  maxOutputTokens?: number,
  metadata?: { source: 'safe non-secret metadata only' }
}
```

## Response Shape

The provider returns:

```ts
{
  content: 'plain text provider output',
  provider: 'mock',
  model: 'mila26-mock-model',
  usage?: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
  metadata?: { purpose: 'engineering_brief_generation', mock: true }
}
```

The boundary does not return secrets or raw provider configuration to frontend API responses.

## Track 6A Behavior

- Default provider is deterministic `mock`.
- The mock provider never calls external services and never needs API keys.
- Same request produces the same mock response content.
- Unsupported providers, including `openai`, are rejected safely in Track 6A.
- Existing chat and Engineering Brief routes remain behaviorally unchanged.

## Track 6B Path

Track 6B can add a real backend-only provider implementation behind the same `Mila26LlmProvider` interface.

The real provider should:

- read `OPENAI_API_KEY` only on the backend
- map raw provider output into existing MILA26 response contracts
- retain the deterministic mock provider for tests and local fallback
- avoid exposing secrets, provider config, or raw stack traces to the frontend

## Out Of Scope

- real LLM calls
- OpenAI SDK installation
- API keys in frontend code
- `VITE_` LLM environment variables
- route behavior changes
- PRD generation changes
- orchestration
- wallet integration
- blockchain deployment
- persistence
- auth or payments
