# Backend LLM Boundary

## Purpose

Track 6A adds the backend-only LLM adapter boundary for MILA26. Track 6B adds the first real backend-only OpenAI provider behind that boundary. Track 6C wires the Blockchain Engineering Bot route to this boundary behind backend config.

The boundary introduces typed request/response interfaces, backend environment parsing, a provider factory, a deterministic mock provider, an opt-in OpenAI provider, and a narrow route adapter for `POST /api/chat/blockchain-engineer`.

Default mock mode does not make real LLM calls and does not require API keys. OpenAI mode requires `OPENAI_API_KEY` on the backend only. Provider config and secrets are not exposed to the frontend.

## Environment Variables

Backend LLM configuration uses these exact names:

| Variable | Default | Behavior |
|---|---:|---|
| `MILA26_LLM_PROVIDER` | `mock` | `mock` is deterministic/default. `openai` enables backend-only OpenAI provider construction. |
| `MILA26_LLM_MODEL` | `mila26-mock-model` for mock; required for OpenAI | Model label used by the selected provider. OpenAI mode has no runtime default; set an operator-selected model explicitly, for example `gpt-5-mini` if the account supports it. |
| `MILA26_LLM_TIMEOUT_MS` | `30000` | Parsed as a positive integer; invalid values fall back to the default. |
| `MILA26_LLM_MAX_OUTPUT_TOKENS` | `2000` | Parsed as a positive integer; invalid values fall back to the default. |
| `OPENAI_API_KEY` | none | Required only when `MILA26_LLM_PROVIDER=openai`; not required for mock mode. |

Do not create `VITE_` LLM variables. Vite environment variables are public to the browser bundle and must not be used for backend LLM secrets.

## Boundary Files

- `server/llm/types.ts`: typed `Mila26Llm*` provider, config, request, response, usage, and safe config-error contracts.
- `server/llm/config.ts`: backend-only config parser for the `MILA26_LLM_*` variables.
- `server/llm/mockProvider.ts`: deterministic provider used for local tests and fallback.
- `server/llm/openaiProvider.ts`: backend-only OpenAI provider wrapper.
- `server/llm/providerFactory.ts`: provider construction boundary.
- `server/agents/blockchainEngineerLlm.ts`: route adapter that calls non-mock providers and falls back to deterministic chat behavior.

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
  provider: 'mock' | 'openai',
  model: 'mila26-mock-model' | 'operator-configured OpenAI model',
  usage?: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
  metadata?: { purpose: 'engineering_brief_generation', mock: true }
}
```

The boundary does not return secrets or raw provider configuration to frontend API responses.

## Track 6A / 6B Behavior

- Default provider is deterministic `mock`.
- The mock provider never calls external services and never needs API keys.
- Same request produces the same mock response content.
- `openai` is opt-in and requires `OPENAI_API_KEY`.
- `openai` requires `MILA26_LLM_MODEL`; model choice is operator-configured and example model names are not runtime defaults.
- Automated tests mock the OpenAI client and do not make live OpenAI calls.
- Engineering Brief routes remain behaviorally unchanged.
- `POST /api/chat/blockchain-engineer` remains deterministic in mock/default mode and may use a real provider only when configured.

## Track 6C Path

Track 6C wires `POST /api/chat/blockchain-engineer` to `Mila26LlmProvider` behind config.

Route integration should:

- read `OPENAI_API_KEY` only on the backend
- map raw provider output into existing MILA26 response contracts
- retain deterministic mock behavior for tests, default mode, invalid provider output, and provider failures
- avoid exposing secrets, provider config, or raw stack traces to the frontend
- preserve deterministic product-route behavior unless explicitly configured otherwise

## Out Of Scope

- API keys in frontend code
- `VITE_` LLM environment variables
- route contract changes
- PRD generation changes
- orchestration
- wallet integration
- blockchain deployment
- persistence
- auth or payments
