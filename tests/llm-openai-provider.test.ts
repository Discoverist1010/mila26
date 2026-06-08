/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createOpenAiMila26LlmProvider, Mila26LlmProviderRuntimeError } from '../server/llm/openaiProvider';
import type { Mila26OpenAiResponsesClient } from '../server/llm/openaiProvider';
import type { Mila26LlmConfig, Mila26LlmRequest } from '../server/llm/types';

const config: Mila26LlmConfig = {
  provider: 'openai',
  model: 'gpt-5.5',
  timeoutMs: 12345,
  maxOutputTokens: 777,
};

const request: Mila26LlmRequest = {
  purpose: 'blockchain_engineer_chat',
  messages: [
    {
      role: 'system',
      content: 'Keep MILA26 backend-only LLM boundaries intact.',
    },
    {
      role: 'user',
      content: 'Explain the wallet-signed testnet deployment boundary.',
    },
  ],
  temperature: 0.2,
  maxOutputTokens: 321,
  reasoningEffort: 'minimal',
  textVerbosity: 'low',
  metadata: {
    source: 'unit-test',
  },
};

describe('OpenAI MILA26 LLM provider', () => {
  it('maps a mocked SDK success response into Mila26LlmResponse', async () => {
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create() {
          return {
            status: 'completed',
            output_text: 'User wallet signs Ethereum testnet deployment; backend holds no private keys.',
            usage: {
              input_tokens: 10,
              input_tokens_details: {
                cached_tokens: 4,
              },
              output_tokens: 12,
              output_tokens_details: {
                reasoning_tokens: 3,
              },
              total_tokens: 22,
            },
          };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    const response = await provider.complete(request);

    expect(response).toEqual({
      content: 'User wallet signs Ethereum testnet deployment; backend holds no private keys.',
      provider: 'openai',
      model: 'gpt-5.5',
      usage: {
        inputTokens: 10,
        outputTokens: 12,
        totalTokens: 22,
        cachedInputTokens: 4,
        reasoningOutputTokens: 3,
      },
      metadata: {
        purpose: 'blockchain_engineer_chat',
      },
    });
    expect(JSON.stringify(response)).not.toContain('sk-secret-not-returned');
  });

  it('passes model, max output token, temperature, metadata, and timeout settings to the SDK client', async () => {
    const calls: Array<{ body: unknown; options: unknown }> = [];
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create(body, options) {
          calls.push({ body, options });
          return { output_text: 'ok' };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await provider.complete(request);

    expect(calls).toEqual([
      {
        body: {
          model: 'gpt-5.5',
          input: [
            {
              role: 'user',
              content: 'Explain the wallet-signed testnet deployment boundary.',
            },
          ],
          instructions: 'Keep MILA26 backend-only LLM boundaries intact.',
          max_output_tokens: 321,
          store: false,
          temperature: 0.2,
          reasoning: {
            effort: 'minimal',
          },
          text: {
            verbosity: 'low',
          },
          metadata: {
            source: 'unit-test',
          },
        },
        options: {
          timeout: 12345,
        },
      },
    ]);
  });

  it('passes Responses structured output format through text.format', async () => {
    const calls: Array<{ body: { text?: unknown } }> = [];
    const textFormat = {
      type: 'json_schema' as const,
      name: 'mila26_test_overlay',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
        },
        required: ['summary'],
        additionalProperties: false,
      },
    };
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create(body) {
          calls.push({ body });
          return { status: 'completed', output_text: '{"summary":"ok"}' };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await provider.complete({
      ...request,
      textFormat,
    });

    expect(calls[0].body.text).toEqual({
      verbosity: 'low',
      format: textFormat,
    });
  });

  it('uses configured max output tokens when the request does not override them', async () => {
    const calls: Array<{ body: { max_output_tokens: number } }> = [];
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create(body) {
          calls.push({ body });
          return { output_text: 'ok' };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await provider.complete({
      ...request,
      maxOutputTokens: undefined,
    });

    expect(calls[0].body.max_output_tokens).toBe(777);
  });

  it('omits reasoning settings for models that do not support reasoning options', async () => {
    const calls: Array<{ body: { reasoning?: unknown } }> = [];
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create(body) {
          calls.push({ body });
          return { output_text: 'ok' };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config: {
        ...config,
        model: 'gpt-4o-mini',
      },
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await provider.complete(request);

    expect(calls[0].body.reasoning).toBeUndefined();
  });

  it('maps incomplete Responses API results into a safe provider error', async () => {
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create() {
          return {
            status: 'incomplete',
            incomplete_details: {
              reason: 'max_output_tokens',
            },
            output_text: '',
          };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await expect(provider.complete(request)).rejects.toMatchObject({
      name: 'Mila26LlmProviderRuntimeError',
      code: 'OPENAI_PROVIDER_ERROR',
      message: 'OpenAI provider response was incomplete because max output tokens were reached.',
    });
  });

  it('maps structured-output refusals into a safe provider error', async () => {
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create() {
          return {
            status: 'completed',
            output_text: '',
            output: [
              {
                type: 'message',
                content: [
                  {
                    type: 'refusal',
                    refusal: 'Cannot assist with that request.',
                  },
                ],
              },
            ],
          };
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await expect(provider.complete(request)).rejects.toMatchObject({
      name: 'Mila26LlmProviderRuntimeError',
      code: 'OPENAI_PROVIDER_ERROR',
      message: 'OpenAI provider returned a refusal.',
    });
  });

  it('maps mocked SDK failure into a safe error without secrets', async () => {
    const fakeClient: Mila26OpenAiResponsesClient = {
      responses: {
        async create() {
          throw new Error('raw sdk failure with sk-secret-not-returned');
        },
      },
    };
    const provider = createOpenAiMila26LlmProvider({
      config,
      apiKey: 'sk-secret-not-returned',
      client: fakeClient,
    });

    await expect(provider.complete(request)).rejects.toMatchObject({
      name: 'Mila26LlmProviderRuntimeError',
      code: 'OPENAI_PROVIDER_ERROR',
      message: 'OpenAI provider request failed.',
    });

    try {
      await provider.complete(request);
    } catch (error) {
      expect(error).toBeInstanceOf(Mila26LlmProviderRuntimeError);
      expect(JSON.stringify(error)).not.toContain('sk-secret-not-returned');
      expect(error instanceof Error ? error.message : String(error)).not.toContain('sk-secret-not-returned');
    }
  });
});
