/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { parseMila26LlmConfig } from '../server/llm/config';
import { createMila26LlmProvider, createMila26LlmProviderFromEnv } from '../server/llm/providerFactory';
import type { Mila26LlmRequest } from '../server/llm/types';

const mockRequest: Mila26LlmRequest = {
  purpose: 'engineering_brief_generation',
  messages: [
    {
      role: 'system',
      content: 'Preserve MILA26 MVP boundaries.',
    },
    {
      role: 'user',
      content: 'Generate a PRD-shaped engineering brief from the approved Requirement Brief.',
    },
  ],
  maxOutputTokens: 2000,
  metadata: {
    source: 'test',
  },
};

describe('MILA26 LLM provider factory', () => {
  it('returns the mock provider for mock config', () => {
    const parsed = parseMila26LlmConfig({ MILA26_LLM_PROVIDER: 'mock' });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      throw new Error('Expected mock config to parse.');
    }

    const provider = createMila26LlmProvider(parsed.config);

    expect(provider.provider).toBe('mock');
    expect(provider.model).toBe('mila26-mock-model');
  });

  it('creates a provider from backend environment config', () => {
    const result = createMila26LlmProviderFromEnv({
      MILA26_LLM_PROVIDER: 'mock',
      MILA26_LLM_MODEL: 'track-6a-test-model',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.provider.provider).toBe('mock');
      expect(result.provider.model).toBe('track-6a-test-model');
    }
  });

  it('returns deterministic mock content', async () => {
    const result = createMila26LlmProviderFromEnv({});

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error('Expected mock provider.');
    }

    const first = await result.provider.complete(mockRequest);
    const second = await result.provider.complete(mockRequest);

    expect(first).toEqual(second);
    expect(first.provider).toBe('mock');
    expect(first.model).toBe('mila26-mock-model');
    expect(first.content).toContain('No external provider was called.');
    expect(first.metadata).toEqual({
      purpose: 'engineering_brief_generation',
      messageCount: 2,
      mock: true,
    });
    expect(first.usage?.totalTokens).toBeGreaterThan(0);
  });

  it('handles unsupported openai mode safely without network calls', () => {
    const result = createMila26LlmProviderFromEnv({
      MILA26_LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'not-used',
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'UNSUPPORTED_LLM_PROVIDER',
        message: 'Unsupported MILA26 LLM provider for Track 6A.',
        details: {
          provider: 'openai',
          allowedProvider: 'mock',
          futureProvider: 'openai',
        },
      },
    });
  });
});
