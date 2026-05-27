/* @vitest-environment node */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const excludedDirectories = new Set(['.git', 'artifacts', 'cache', 'dist', 'node_modules']);
const forbiddenDirectDependencies = [
  '@foundry-rs/foundry',
  '@nomicfoundation/hardhat-toolbox',
  '@nomicfoundation/hardhat-toolbox-viem',
  '@nomicfoundation/hardhat-ignition',
  '@nomicfoundation/hardhat-ignition-viem',
  '@nomicfoundation/hardhat-keystore',
  '@nomicfoundation/hardhat-verify',
  'forge',
  'foundry',
  'solc',
];

function readText(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

function walkRepo(relativeDirectory = ''): string[] {
  const directory = join(repoRoot, relativeDirectory);

  return readdirSync(directory).flatMap((entry) => {
    const relativePath = join(relativeDirectory, entry);
    const absolutePath = join(repoRoot, relativePath);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      return excludedDirectories.has(entry) ? [] : walkRepo(relativePath);
    }

    return relativePath;
  });
}

describe('Solidity toolchain guardrails', () => {
  it('keeps Track 10A dependencies narrow and avoids deployment-oriented tooling', () => {
    const packageJson = JSON.parse(readText('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const rootLockfile = JSON.parse(readText('package-lock.json')) as {
      packages?: Record<string, { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }>;
    };
    const directDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...rootLockfile.packages?.['']?.dependencies,
      ...rootLockfile.packages?.['']?.devDependencies,
    };

    for (const packageName of forbiddenDirectDependencies) {
      expect(directDependencies).not.toHaveProperty(packageName);
    }

    expect(directDependencies).toHaveProperty('hardhat');
    expect(directDependencies).toHaveProperty('@nomicfoundation/hardhat-viem');
    expect(directDependencies).toHaveProperty('@openzeppelin/contracts');
  });

  it('adds only local compile/test Solidity files without deployment scaffolding', () => {
    const repoFiles = walkRepo();

    expect(repoFiles.filter((file) => file.endsWith('.sol'))).toEqual(['contracts/Mila26RestrictedFundToken.sol']);
    expect(repoFiles.filter((file) => /^hardhat\.config\./.test(file))).toEqual(['hardhat.config.ts']);
    expect(repoFiles).not.toContain('foundry.toml');
    expect(repoFiles).not.toContain('remappings.txt');
    expect(repoFiles.some((file) => /^scripts\/deploy/i.test(file))).toBe(false);
    expect(repoFiles.some((file) => /^ignition\//i.test(file))).toBe(false);
  });

  it('keeps Hardhat config local-only with no mainnet, private-key, mnemonic, or RPC config', () => {
    const config = readText('hardhat.config.ts');

    expect(config).not.toMatch(/mainnet|sepolia|rpc|url|privateKey|accounts|mnemonic|configVariable/i);
    expect(config).toMatch(/hardhatViem/);
    expect(config).toMatch(/hardhatNetworkHelpers/);
  });

  it('documents the Track 10A adoption and future artifact/check/evidence/SCP/deployment-gate mapping', () => {
    const adrPath = 'docs/architecture/solidity-toolchain-decision.md';
    const foundationPath = 'docs/architecture/hardhat-compile-test-foundation.md';
    expect(existsSync(join(repoRoot, adrPath))).toBe(true);
    expect(existsSync(join(repoRoot, foundationPath))).toBe(true);

    const adr = readText(adrPath);
    const foundation = readText(foundationPath);

    expect(adr).toMatch(/Hardhat as the recommended first implementation path/i);
    expect(foundation).toMatch(/contracts:build/);
    expect(foundation).toMatch(/test:contracts/);
    expect(foundation).toMatch(/artifactPackage\.sourceModel\.compilerToolchainStatus/);
    expect(foundation).toMatch(/checkResult\.checkMode/);
    expect(foundation).toMatch(/Evidence-Lite/i);
    expect(foundation).toMatch(/SCP readiness\/status/i);
    expect(foundation).toMatch(/Deployment Gate/i);
    expect(foundation).toMatch(/wallet signing/i);
    expect(foundation).toMatch(/mainnet/i);
    expect(foundation).toMatch(/contract address|transaction hash/i);
  });
});
