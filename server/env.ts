import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

export type LoadBackendEnvOptions = {
  cwd?: string;
  envFilePath?: string;
};

export function loadBackendEnv(options: LoadBackendEnvOptions = {}): boolean {
  const envFilePath = options.envFilePath ?? resolve(options.cwd ?? process.cwd(), '.env');

  if (!existsSync(envFilePath)) {
    return false;
  }

  loadEnvFile(envFilePath);
  return true;
}
