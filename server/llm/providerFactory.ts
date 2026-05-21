import { parseMila26LlmConfig } from './config';
import { createMockMila26LlmProvider } from './mockProvider';
import { createOpenAiMila26LlmProvider, type Mila26OpenAiResponsesClient } from './openaiProvider';
import type { Mila26LlmConfig, Mila26LlmProvider, Mila26LlmProviderResult } from './types';

type EnvSource = Partial<Record<string, string | undefined>>;

export type CreateMila26LlmProviderOptions = {
  openAiApiKey?: string;
  openAiClient?: Mila26OpenAiResponsesClient;
};

export function createMila26LlmProvider(
  config: Mila26LlmConfig,
  options: CreateMila26LlmProviderOptions = {},
): Mila26LlmProvider {
  if (config.provider === 'openai') {
    if (!options.openAiApiKey && !options.openAiClient) {
      throw new Error('OPENAI_API_KEY is required for the OpenAI provider.');
    }

    return createOpenAiMila26LlmProvider({
      config,
      apiKey: options.openAiApiKey || 'test-openai-client-injected',
      client: options.openAiClient,
    });
  }

  return createMockMila26LlmProvider(config);
}

export function createMila26LlmProviderFromEnv(env: EnvSource = process.env): Mila26LlmProviderResult {
  const parsed = parseMila26LlmConfig(env);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    provider: createMila26LlmProvider(parsed.config, {
      openAiApiKey: env.OPENAI_API_KEY?.trim(),
    }),
  };
}
