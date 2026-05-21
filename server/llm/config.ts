import type { Mila26KnownLlmProviderName, Mila26LlmConfigResult } from './types';

export const defaultMila26LlmProvider = 'mock';
export const defaultMila26LlmModel = 'mila26-mock-model';
export const defaultMila26LlmTimeoutMs = 30000;
export const defaultMila26LlmMaxOutputTokens = 2000;

type EnvSource = Partial<Record<string, string | undefined>>;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseProvider(value: string | undefined): Mila26KnownLlmProviderName | string {
  return value?.trim().toLowerCase() || defaultMila26LlmProvider;
}

export function parseMila26LlmConfig(env: EnvSource = process.env): Mila26LlmConfigResult {
  const provider = parseProvider(env.MILA26_LLM_PROVIDER);

  if (provider !== 'mock' && provider !== 'openai') {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_PROVIDER',
        message: 'Unsupported MILA26 LLM provider.',
        details: {
          provider,
          allowedProviders: 'mock,openai',
        },
      },
    };
  }

  if (provider === 'openai' && !env.OPENAI_API_KEY?.trim()) {
    return {
      ok: false,
      error: {
        code: 'MISSING_OPENAI_API_KEY',
        message: 'OPENAI_API_KEY is required when MILA26_LLM_PROVIDER=openai.',
        details: {
          provider,
        },
      },
    };
  }

  if (provider === 'openai' && !env.MILA26_LLM_MODEL?.trim()) {
    return {
      ok: false,
      error: {
        code: 'MISSING_MILA26_LLM_MODEL',
        message: 'MILA26_LLM_MODEL is required when MILA26_LLM_PROVIDER=openai.',
        details: {
          provider,
        },
      },
    };
  }

  return {
    ok: true,
    config: {
      provider,
      model: env.MILA26_LLM_MODEL?.trim() || defaultMila26LlmModel,
      timeoutMs: parsePositiveInteger(env.MILA26_LLM_TIMEOUT_MS, defaultMila26LlmTimeoutMs),
      maxOutputTokens: parsePositiveInteger(
        env.MILA26_LLM_MAX_OUTPUT_TOKENS,
        defaultMila26LlmMaxOutputTokens,
      ),
    },
  };
}
