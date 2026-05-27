/* @vitest-environment node */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const excludedDirectories = new Set(['.git', 'dist', 'node_modules']);
const forbiddenDirectDependencies = [
  '@foundry-rs/foundry',
  '@nomicfoundation/hardhat-toolbox',
  '@openzeppelin/contracts',
  'forge',
  'foundry',
  'hardhat',
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

describe('Solidity toolchain decision guardrails', () => {
  it('does not install direct smart-contract tooling dependencies in Track 9B.2', () => {
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
  });

  it('does not add Solidity or compile-tool config files in Track 9B.2', () => {
    const repoFiles = walkRepo();

    expect(repoFiles.filter((file) => file.endsWith('.sol'))).toEqual([]);
    expect(repoFiles.some((file) => /^hardhat\.config\./.test(file))).toBe(false);
    expect(repoFiles).not.toContain('foundry.toml');
    expect(repoFiles).not.toContain('remappings.txt');
  });

  it('documents the docs-only decision and future artifact/check/evidence/SCP/deployment-gate mapping', () => {
    const adrPath = 'docs/architecture/solidity-toolchain-decision.md';
    expect(existsSync(join(repoRoot, adrPath))).toBe(true);

    const adr = readText(adrPath);

    expect(adr).toMatch(/Hardhat as the recommended first implementation path/i);
    expect(adr).toMatch(/does not approve running either workflow yet/i);
    expect(adr).toMatch(/No compile\/test toolchain is installed/i);
    expect(adr).toMatch(/SmartContractArtifactPackage|artifactPackage\.sourceModel\.compilerToolchainStatus/);
    expect(adr).toMatch(/SmartContractArtifactCheckResult|checkResult\.checkMode/);
    expect(adr).toMatch(/Evidence-Lite/i);
    expect(adr).toMatch(/SCP readiness\/status/i);
    expect(adr).toMatch(/Deployment Gate/i);
    expect(adr).toMatch(/wallet signing/i);
    expect(adr).toMatch(/mainnet support/i);
    expect(adr).toMatch(/fake contract addresses or transaction hashes/i);
  });
});
