/* @vitest-environment node */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  defaultMila26LlmMaxOutputTokens,
  defaultMila26LlmModel,
  defaultMila26LlmProvider,
  defaultMila26LlmTimeoutMs,
  parseMila26LlmConfig,
} from '../server/llm/config';

describe('MILA26 LLM config', () => {
  it('uses backend-only mock defaults', () => {
    const parsed = parseMila26LlmConfig({});

    expect(parsed).toEqual({
      ok: true,
      config: {
        provider: defaultMila26LlmProvider,
        model: defaultMila26LlmModel,
        timeoutMs: defaultMila26LlmTimeoutMs,
        maxOutputTokens: defaultMila26LlmMaxOutputTokens,
      },
    });
  });

  it('accepts explicit valid mock config', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'mock',
      MILA26_LLM_MODEL: 'local-track-6a-mock',
      MILA26_LLM_TIMEOUT_MS: '15000',
      MILA26_LLM_MAX_OUTPUT_TOKENS: '1200',
    });

    expect(parsed).toEqual({
      ok: true,
      config: {
        provider: 'mock',
        model: 'local-track-6a-mock',
        timeoutMs: 15000,
        maxOutputTokens: 1200,
      },
    });
  });

  it('falls back safely for invalid numeric config values', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_TIMEOUT_MS: 'not-a-number',
      MILA26_LLM_MAX_OUTPUT_TOKENS: '-10',
    });

    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.config.timeoutMs).toBe(defaultMila26LlmTimeoutMs);
      expect(parsed.config.maxOutputTokens).toBe(defaultMila26LlmMaxOutputTokens);
    }
  });

  it('handles unsupported providers safely without requiring OpenAI secrets', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'openai',
      MILA26_LLM_MODEL: 'future-real-model',
      OPENAI_API_KEY: 'not-read-in-track-6a',
    });

    expect(parsed).toEqual({
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

  it('does not introduce frontend Vite LLM environment variables', () => {
    const checkedFiles = ['.env.example', ...listFiles('src')];
    const viteLlmVariablePattern = /VITE_[A-Z0-9_]*LLM[A-Z0-9_]*/;

    for (const filePath of checkedFiles) {
      expect(readFileSync(filePath, 'utf8')).not.toMatch(viteLlmVariablePattern);
    }
  });
});

function listFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = join(directory, entry);
    return statSync(entryPath).isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}
