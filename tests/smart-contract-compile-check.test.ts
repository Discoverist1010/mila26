/* @vitest-environment node */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createPassedSmartContractCompileTestResult,
  createSmartContractCompileTestResult,
  toSmartContractCompileCheckRows,
  toSmartContractCompileEvidenceItems,
  toSmartContractCompileSafetyEvidenceRefs,
  toSmartContractCompileScpStatus,
} from '../server/agents/smartContractCompileCheckMapper';
import { SmartContractCompileTestResultSchema } from '../server/contracts/smartContractCompileCheck';

const repoRoot = process.cwd();
const artifactId = 'contract-artifact-spec-mila-income-fund';
const specId = 'spec-mila-income-fund';
const generatedAt = '2026-05-27T00:00:00.000Z';
const forbiddenKeys = [
  'deployStatus',
  'walletSigned',
  'privateKeySafe',
  'mainnetBlocked',
  'auditPassed',
  'securityApproved',
  'contractAddress',
  'txHash',
  'deployedAddress',
];

function readText(path: string) {
  return readFileSync(join(repoRoot, path), 'utf8');
}

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, nested] of Object.entries(value)) {
      keys.add(key);
      collectKeys(nested, keys);
    }
  }

  return keys;
}

function walkFiles(relativeDirectory: string): string[] {
  const directory = join(repoRoot, relativeDirectory);

  return readdirSync(directory).flatMap((entry) => {
    const relativePath = join(relativeDirectory, entry);
    const absolutePath = join(repoRoot, relativePath);
    const stats = statSync(absolutePath);

    return stats.isDirectory() ? walkFiles(relativePath) : [relativePath];
  });
}

describe('Smart Contract compile/test result adapter', () => {
  it('creates a deterministic passed local Hardhat compile/test result', () => {
    const result = createPassedSmartContractCompileTestResult({ artifactId, specId, generatedAt });

    expect(SmartContractCompileTestResultSchema.parse(result)).toEqual(result);
    expect(result).toMatchObject({
      compileCheckId: `compile-check-${artifactId}`,
      artifactId,
      specId,
      contractName: 'Mila26RestrictedFundToken',
      toolchain: 'hardhat',
      status: 'passed',
      metadata: {
        generatedAt,
        generator: 'deterministic_10b_compile_test_result_adapter',
        source: 'local_hardhat_test_foundation',
        version: '10b.1',
      },
    });
    expect(result.compiler).toMatchObject({
      configured: true,
      toolchainStatus: 'configured',
      solidityVersion: '0.8.28',
      command: 'npm run contracts:build -- --force',
      status: 'passed',
    });
    expect(result.testRun).toMatchObject({
      command: 'npm run test:contracts',
      status: 'passed',
      testCount: 7,
    });
    expect(result.testedCapabilities).toEqual({
      erc20Basics: 'passed',
      whitelistRestrictions: 'passed',
      issuerMintAllocation: 'passed',
      valuationEvent: 'passed',
      distributionEvent: 'passed',
      pauseUnpause: 'passed',
      accessControl: 'passed',
    });
    expect(result.evidenceRefs).toEqual([
      'compile-test-local-compile',
      'compile-test-contract-tests',
      'compile-test-erc20-basics',
      'compile-test-whitelist-restrictions',
      'compile-test-issuer-mint-allocation',
      'compile-test-valuation-event',
      'compile-test-distribution-event',
      'compile-test-pause-unpause',
      'compile-test-access-control',
    ]);
  });

  it('uses canonical field names and avoids conflicting deployment or security terminology', () => {
    const result = createPassedSmartContractCompileTestResult({ artifactId, specId, generatedAt });
    const keys = collectKeys(result);

    expect([...keys]).toEqual(
      expect.arrayContaining([
        'artifactId',
        'specId',
        'status',
        'metadata',
        'generatedAt',
        'generator',
        'version',
        'boundaryChecks',
        'deploymentNotExecuted',
        'walletSigningNotPerformed',
        'privateKeysNotUsed',
        'mainnetDisabled',
        'noFakeAddressOrTxHash',
        'auditNotPerformed',
      ]),
    );

    for (const key of forbiddenKeys) {
      expect(keys.has(key)).toBe(false);
    }
  });

  it('maps local compile/test results into existing check and evidence terminology', () => {
    const result = createPassedSmartContractCompileTestResult({ artifactId, specId, generatedAt });
    const checks = toSmartContractCompileCheckRows(result);
    const evidenceItems = toSmartContractCompileEvidenceItems(result);
    const safetyEvidenceRefs = toSmartContractCompileSafetyEvidenceRefs(result);

    expect(checks.every((check) => check.status === 'passed')).toBe(true);
    expect(checks.map((check) => check.evidenceRef)).toEqual(result.evidenceRefs);
    expect(evidenceItems.map((item) => item.source)).toEqual(evidenceItems.map(() => 'artifact_check_result'));
    expect(evidenceItems.map((item) => item.id)).toEqual(result.evidenceRefs);
    expect(safetyEvidenceRefs.map((ref) => ref.boundary)).toEqual([
      'deploymentNotExecuted',
      'walletSigningNotPerformed',
      'privateKeysNotUsed',
      'mainnetDisabled',
      'noFakeAddressOrTxHash',
      'auditNotPerformed',
    ]);
  });

  it('maps failed compile results without claiming deployment or audit readiness', () => {
    const result = createSmartContractCompileTestResult({
      artifactId,
      specId,
      generatedAt,
      compilerStatus: 'failed',
    });
    const checks = toSmartContractCompileCheckRows(result);
    const scpStatus = toSmartContractCompileScpStatus(result);

    expect(result.status).toBe('failed');
    expect(result.boundaryChecks).toEqual({
      deploymentNotExecuted: true,
      walletSigningNotPerformed: true,
      privateKeysNotUsed: true,
      mainnetDisabled: true,
      noFakeAddressOrTxHash: true,
      auditNotPerformed: true,
    });
    expect(checks.find((check) => check.id === 'check-local-hardhat-compile')?.status).toBe('failed');
    expect(scpStatus.localCompileTestStatus).toBe('failed');
    expect(JSON.stringify(result)).not.toMatch(/deployedAddress|contractAddress|txHash|auditPassed|securityApproved/);
  });

  it('maps failed contract tests without replacing Track 9B preview-only honesty', () => {
    const result = createSmartContractCompileTestResult({
      artifactId,
      specId,
      generatedAt,
      testRunStatus: 'failed',
      testedCapabilities: {
        whitelistRestrictions: 'failed',
      },
    });
    const checks = toSmartContractCompileCheckRows(result);

    expect(result.status).toBe('failed');
    expect(checks.find((check) => check.id === 'check-local-contract-tests')?.status).toBe('failed');
    expect(checks.find((check) => check.id === 'check-local-whitelist-restrictions')?.status).toBe('failed');
    expect(result.compiler.summary).toMatch(/Local Hardhat compile foundation/i);
    expect(result.testRun.summary).toMatch(/does not produce deployment readiness/i);
  });

  it('keeps blocked and not-run states explicit and safe', () => {
    const blocked = createSmartContractCompileTestResult({
      artifactId,
      specId,
      generatedAt,
      compilerStatus: 'blocked',
      testRunStatus: 'blocked',
      testedCapabilities: {
        erc20Basics: 'not_run',
        whitelistRestrictions: 'not_run',
        issuerMintAllocation: 'not_run',
        valuationEvent: 'not_run',
        distributionEvent: 'not_run',
        pauseUnpause: 'not_run',
        accessControl: 'not_run',
      },
      blockedReasons: ['Local Hardhat result is unavailable.'],
    });
    const notRun = createSmartContractCompileTestResult({
      artifactId,
      specId,
      generatedAt,
      compilerStatus: 'not_run',
      testRunStatus: 'not_run',
      testedCapabilities: {
        erc20Basics: 'not_run',
        whitelistRestrictions: 'not_run',
        issuerMintAllocation: 'not_run',
        valuationEvent: 'not_run',
        distributionEvent: 'not_run',
        pauseUnpause: 'not_run',
        accessControl: 'not_run',
      },
    });

    expect(blocked.status).toBe('blocked');
    expect(blocked.blockedReasons).toEqual(['Local Hardhat result is unavailable.']);
    expect(toSmartContractCompileCheckRows(blocked).every((check) => check.status === 'blocked')).toBe(true);
    expect(notRun.status).toBe('not_run');
    expect(toSmartContractCompileScpStatus(notRun).localCompileTestDetail).toMatch(/No compile\/test readiness is claimed/i);
  });

  it('keeps backend routes free of Hardhat command execution', () => {
    const routeTexts = walkFiles('server/routes')
      .filter((file) => file.endsWith('.ts'))
      .map((file) => readText(file))
      .join('\n');

    expect(routeTexts).not.toMatch(/hardhat|contracts:build|test:contracts|child_process|exec\(|spawn\(/i);
  });
});
