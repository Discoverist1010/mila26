/* @vitest-environment node */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadBackendEnv } from '../server/env';

const envKeys = [
  'MILA26_LLM_PROVIDER',
  'MILA26_LLM_MODEL',
  'MILA26_LLM_TIMEOUT_MS',
  'MILA26_LLM_MAX_OUTPUT_TOKENS',
  'OPENAI_API_KEY',
] as const;

function clearEnvKeys() {
  for (const key of envKeys) {
    delete process.env[key];
  }
}

function makeTempEnvFile(content: string): { dir: string; path: string } {
  const dir = mkdtempSync(join(tmpdir(), 'mila26-env-'));
  const path = join(dir, '.env');
  writeFileSync(path, content);
  return { dir, path };
}

afterEach(() => {
  clearEnvKeys();
});

describe('backend env loading', () => {
  it('loads MILA26 backend LLM variables from an env file', () => {
    clearEnvKeys();
    const { dir, path } = makeTempEnvFile([
      'MILA26_LLM_PROVIDER=openai',
      'MILA26_LLM_MODEL=test-model',
      'MILA26_LLM_TIMEOUT_MS=1234',
      'MILA26_LLM_MAX_OUTPUT_TOKENS=321',
      'OPENAI_API_KEY=sk-test-secret',
      '',
    ].join('\n'));

    try {
      expect(loadBackendEnv({ envFilePath: path })).toBe(true);
      expect(process.env.MILA26_LLM_PROVIDER).toBe('openai');
      expect(process.env.MILA26_LLM_MODEL).toBe('test-model');
      expect(process.env.MILA26_LLM_TIMEOUT_MS).toBe('1234');
      expect(process.env.MILA26_LLM_MAX_OUTPUT_TOKENS).toBe('321');
      expect(process.env.OPENAI_API_KEY).toBe('sk-test-secret');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('does not override shell-provided environment variables', () => {
    clearEnvKeys();
    process.env.MILA26_LLM_PROVIDER = 'mock';
    process.env.OPENAI_API_KEY = 'shell-secret';
    const { dir, path } = makeTempEnvFile([
      'MILA26_LLM_PROVIDER=openai',
      'OPENAI_API_KEY=env-file-secret',
      '',
    ].join('\n'));

    try {
      expect(loadBackendEnv({ envFilePath: path })).toBe(true);
      expect(process.env.MILA26_LLM_PROVIDER).toBe('mock');
      expect(process.env.OPENAI_API_KEY).toBe('shell-secret');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('treats a missing env file as safe and non-fatal', () => {
    clearEnvKeys();
    const dir = mkdtempSync(join(tmpdir(), 'mila26-env-missing-'));

    try {
      expect(loadBackendEnv({ envFilePath: join(dir, '.env') })).toBe(false);
      expect(process.env.MILA26_LLM_PROVIDER).toBeUndefined();
      expect(process.env.OPENAI_API_KEY).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
