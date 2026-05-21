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

  it('accepts explicit OpenAI config only when OPENAI_API_KEY is present', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'openai',
      MILA26_LLM_MODEL: 'gpt-track-6b-test',
      MILA26_LLM_TIMEOUT_MS: '25000',
      MILA26_LLM_MAX_OUTPUT_TOKENS: '1500',
      OPENAI_API_KEY: 'sk-test-secret',
    });

    expect(parsed).toEqual({
      ok: true,
      config: {
        provider: 'openai',
        model: 'gpt-track-6b-test',
        timeoutMs: 25000,
        maxOutputTokens: 1500,
      },
    });
    expect(JSON.stringify(parsed)).not.toContain('sk-test-secret');
  });

  it('rejects OpenAI config without explicit MILA26_LLM_MODEL', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test-secret',
    });

    expect(parsed).toEqual({
      ok: false,
      error: {
        code: 'MISSING_MILA26_LLM_MODEL',
        message: 'MILA26_LLM_MODEL is required when MILA26_LLM_PROVIDER=openai.',
        details: {
          provider: 'openai',
        },
      },
    });
    expect(JSON.stringify(parsed)).not.toContain('sk-test-secret');
  });

  it('rejects OpenAI config with blank MILA26_LLM_MODEL', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'openai',
      MILA26_LLM_MODEL: '   ',
      OPENAI_API_KEY: 'sk-test-secret',
    });

    expect(parsed).toEqual({
      ok: false,
      error: {
        code: 'MISSING_MILA26_LLM_MODEL',
        message: 'MILA26_LLM_MODEL is required when MILA26_LLM_PROVIDER=openai.',
        details: {
          provider: 'openai',
        },
      },
    });
    expect(JSON.stringify(parsed)).not.toContain('sk-test-secret');
  });

  it('rejects OpenAI config without OPENAI_API_KEY', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'openai',
    });

    expect(parsed).toEqual({
      ok: false,
      error: {
        code: 'MISSING_OPENAI_API_KEY',
        message: 'OPENAI_API_KEY is required when MILA26_LLM_PROVIDER=openai.',
        details: {
          provider: 'openai',
        },
      },
    });
  });

  it('handles unknown providers safely', () => {
    const parsed = parseMila26LlmConfig({
      MILA26_LLM_PROVIDER: 'unsupported',
    });

    expect(parsed).toEqual({
      ok: false,
      error: {
        code: 'UNSUPPORTED_PROVIDER',
        message: 'Unsupported MILA26 LLM provider.',
        details: {
          provider: 'unsupported',
          allowedProviders: 'mock,openai',
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
