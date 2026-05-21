import { parseMila26LlmConfig } from './config';
import { createMockMila26LlmProvider } from './mockProvider';
import type { Mila26LlmConfig, Mila26LlmProvider, Mila26LlmProviderResult } from './types';

type EnvSource = Partial<Record<string, string | undefined>>;

export function createMila26LlmProvider(config: Mila26LlmConfig): Mila26LlmProvider {
  return createMockMila26LlmProvider(config);
}

export function createMila26LlmProviderFromEnv(env: EnvSource = process.env): Mila26LlmProviderResult {
  const parsed = parseMila26LlmConfig(env);

  if (!parsed.ok) {
    return parsed;
  }

  return {
    ok: true,
    provider: createMila26LlmProvider(parsed.config),
  };
}
