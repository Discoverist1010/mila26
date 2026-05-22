/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createOpenAiMila26LlmProvider, Mila26LlmProviderRuntimeError } from '../server/llm/openaiProvider';
import type { Mila26OpenAiResponsesClient } from '../server/llm/openaiProvider';
import type { Mila26LlmConfig, Mila26LlmRequest } from '../server/llm/types';

const config: Mila26LlmConfig = {
  provider: 'openai',
  model: 'gpt-5-mini',
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
            output_text: 'User wallet signs Ethereum testnet deployment; backend holds no private keys.',
            usage: {
              input_tokens: 10,
              output_tokens: 12,
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
      model: 'gpt-5-mini',
      usage: {
        inputTokens: 10,
        outputTokens: 12,
        totalTokens: 22,
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
          model: 'gpt-5-mini',
          input: [
            {
              role: 'user',
              content: 'Explain the wallet-signed testnet deployment boundary.',
            },
          ],
          instructions: 'Keep MILA26 backend-only LLM boundaries intact.',
          max_output_tokens: 321,
          temperature: 0.2,
          reasoning: {
            effort: 'minimal',
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
