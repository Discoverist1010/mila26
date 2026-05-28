import {
  SmartContractCompileTestResultSchema,
  type SmartContractCompileTestResult,
  type SmartContractCompileTestStatus,
  type SmartContractTestedCapabilities,
} from '../contracts/smartContractCompileCheck';
import type { SmartContractArtifactCheckResult, SmartContractEvidenceLite } from '../contracts/smartContractArtifact';

export type SmartContractCompileTestResultInput = {
  artifactId: string;
  specId: string;
  generatedAt?: string;
  compilerStatus?: SmartContractCompileTestStatus;
  testRunStatus?: SmartContractCompileTestStatus;
  testedCapabilities?: Partial<SmartContractTestedCapabilities>;
  blockedReasons?: string[];
};

export type SmartContractCompileScpStatus = {
  localCompileTestStatus: SmartContractCompileTestStatus;
  localCompileTestLabel: string;
  localCompileTestDetail: string;
};

const generator = 'deterministic_10b_compile_test_result_adapter' as const;
const defaultGeneratedAt = '1970-01-01T00:00:00.000Z';
const fixtureContractName = 'Mila26RestrictedFundToken' as const;
const defaultSolidityVersion = '0.8.28';
const defaultContractTestCount = 7;

const evidenceRefs = [
  'compile-test-local-compile',
  'compile-test-contract-tests',
  'compile-test-erc20-basics',
  'compile-test-whitelist-restrictions',
  'compile-test-issuer-mint-allocation',
  'compile-test-valuation-event',
  'compile-test-distribution-event',
  'compile-test-pause-unpause',
  'compile-test-access-control',
];

const passedCapabilities: SmartContractTestedCapabilities = {
  erc20Basics: 'passed',
  whitelistRestrictions: 'passed',
  issuerMintAllocation: 'passed',
  valuationEvent: 'passed',
  distributionEvent: 'passed',
  pauseUnpause: 'passed',
  accessControl: 'passed',
};

function deriveStatus(
  compilerStatus: SmartContractCompileTestStatus,
  testRunStatus: SmartContractCompileTestStatus,
  testedCapabilities: SmartContractTestedCapabilities,
): SmartContractCompileTestStatus {
  if (compilerStatus === 'blocked' || testRunStatus === 'blocked') return 'blocked';
  if (compilerStatus === 'failed' || testRunStatus === 'failed') return 'failed';

  const capabilityStatuses = Object.values(testedCapabilities);

  if (capabilityStatuses.includes('failed')) return 'failed';
  if (compilerStatus === 'not_run' || testRunStatus === 'not_run' || capabilityStatuses.includes('not_run')) {
    return 'not_run';
  }

  return 'passed';
}

function compilerSummary(status: SmartContractCompileTestStatus): string {
  switch (status) {
    case 'passed':
      return 'Local Hardhat compile foundation completed for the MILA26 restricted ERC-20-compatible fixture.';
    case 'failed':
      return 'Local Hardhat compile foundation failed. This does not produce deployment readiness.';
    case 'blocked':
      return 'Local Hardhat compile foundation is blocked and has not produced a usable result.';
    case 'not_run':
      return 'Local Hardhat compile foundation has not been run for this result.';
  }
}

function testRunSummary(status: SmartContractCompileTestStatus): string {
  switch (status) {
    case 'passed':
      return 'Local contract tests passed for ERC-20 basics, wallet restrictions, issuer actions, events, and pause controls.';
    case 'failed':
      return 'Local contract tests failed. This does not produce deployment readiness.';
    case 'blocked':
      return 'Local contract tests are blocked and have not produced a usable result.';
    case 'not_run':
      return 'Local contract tests have not been run for this result.';
  }
}

function checkStatus(status: SmartContractCompileTestStatus): SmartContractArtifactCheckResult['checks'][number]['status'] {
  if (status === 'passed') return 'passed';
  if (status === 'failed') return 'failed';
  return 'blocked';
}

function capabilityDetail(label: string, status: SmartContractCompileTestStatus): string {
  if (status === 'passed') return `${label} passed in the local Hardhat fixture tests.`;
  if (status === 'failed') return `${label} failed in the local Hardhat fixture tests.`;
  return `${label} has not been proven by local fixture tests.`;
}

export function createSmartContractCompileTestResult(
  input: SmartContractCompileTestResultInput,
): SmartContractCompileTestResult {
  const compilerStatus = input.compilerStatus ?? 'passed';
  const testRunStatus = input.testRunStatus ?? 'passed';
  const testedCapabilities = {
    ...passedCapabilities,
    ...input.testedCapabilities,
  };
  const status = deriveStatus(compilerStatus, testRunStatus, testedCapabilities);

  return SmartContractCompileTestResultSchema.parse({
    compileCheckId: `compile-check-${input.artifactId}`,
    artifactId: input.artifactId,
    specId: input.specId,
    contractName: fixtureContractName,
    toolchain: 'hardhat',
    status,
    compiler: {
      configured: compilerStatus !== 'not_run' && compilerStatus !== 'blocked',
      toolchainStatus: compilerStatus === 'not_run' || compilerStatus === 'blocked' ? 'not_configured' : 'configured',
      solidityVersion: compilerStatus === 'not_run' || compilerStatus === 'blocked' ? undefined : defaultSolidityVersion,
      command: 'npm run contracts:build -- --force',
      status: compilerStatus,
      summary: compilerSummary(compilerStatus),
    },
    testRun: {
      command: 'npm run test:contracts',
      status: testRunStatus,
      testCount: testRunStatus === 'passed' || testRunStatus === 'failed' ? defaultContractTestCount : undefined,
      summary: testRunSummary(testRunStatus),
    },
    testedCapabilities,
    boundaryChecks: {
      deploymentNotExecuted: true,
      walletSigningNotPerformed: true,
      privateKeysNotUsed: true,
      mainnetDisabled: true,
      noFakeAddressOrTxHash: true,
      auditNotPerformed: true,
    },
    evidenceRefs,
    blockedReasons: status === 'blocked' || status === 'not_run' ? (input.blockedReasons ?? []) : [],
    metadata: {
      generatedAt: input.generatedAt ?? defaultGeneratedAt,
      generator,
      source: 'local_hardhat_test_foundation',
      version: '10b.1',
    },
  });
}

export function createPassedSmartContractCompileTestResult(input: {
  artifactId: string;
  specId: string;
  generatedAt?: string;
}): SmartContractCompileTestResult {
  return createSmartContractCompileTestResult(input);
}

export function toSmartContractCompileCheckRows(
  result: SmartContractCompileTestResult,
): SmartContractArtifactCheckResult['checks'] {
  return [
    {
      id: 'check-local-hardhat-compile',
      label: 'Local Hardhat compile',
      status: checkStatus(result.compiler.status),
      detail: result.compiler.summary,
      evidenceRef: 'compile-test-local-compile',
    },
    {
      id: 'check-local-contract-tests',
      label: 'Local contract tests',
      status: checkStatus(result.testRun.status),
      detail: result.testRun.summary,
      evidenceRef: 'compile-test-contract-tests',
    },
    {
      id: 'check-local-erc20-basics',
      label: 'ERC-20 basics tested locally',
      status: checkStatus(result.testedCapabilities.erc20Basics),
      detail: capabilityDetail('ERC-20 basics', result.testedCapabilities.erc20Basics),
      evidenceRef: 'compile-test-erc20-basics',
    },
    {
      id: 'check-local-whitelist-restrictions',
      label: 'Whitelist restrictions tested locally',
      status: checkStatus(result.testedCapabilities.whitelistRestrictions),
      detail: capabilityDetail('Whitelist restrictions', result.testedCapabilities.whitelistRestrictions),
      evidenceRef: 'compile-test-whitelist-restrictions',
    },
    {
      id: 'check-local-issuer-mint-allocation',
      label: 'Issuer mint/allocation tested locally',
      status: checkStatus(result.testedCapabilities.issuerMintAllocation),
      detail: capabilityDetail('Issuer mint/allocation', result.testedCapabilities.issuerMintAllocation),
      evidenceRef: 'compile-test-issuer-mint-allocation',
    },
    {
      id: 'check-local-valuation-event',
      label: 'Valuation event tested locally',
      status: checkStatus(result.testedCapabilities.valuationEvent),
      detail: capabilityDetail('Valuation event', result.testedCapabilities.valuationEvent),
      evidenceRef: 'compile-test-valuation-event',
    },
    {
      id: 'check-local-distribution-event',
      label: 'Distribution event tested locally',
      status: checkStatus(result.testedCapabilities.distributionEvent),
      detail: capabilityDetail('Distribution event', result.testedCapabilities.distributionEvent),
      evidenceRef: 'compile-test-distribution-event',
    },
    {
      id: 'check-local-pause-unpause',
      label: 'Pause/unpause tested locally',
      status: checkStatus(result.testedCapabilities.pauseUnpause),
      detail: capabilityDetail('Pause/unpause', result.testedCapabilities.pauseUnpause),
      evidenceRef: 'compile-test-pause-unpause',
    },
    {
      id: 'check-local-access-control',
      label: 'Access control tested locally',
      status: checkStatus(result.testedCapabilities.accessControl),
      detail: capabilityDetail('Access control', result.testedCapabilities.accessControl),
      evidenceRef: 'compile-test-access-control',
    },
  ];
}

export function toSmartContractCompileEvidenceItems(
  result: SmartContractCompileTestResult,
): SmartContractEvidenceLite['evidenceItems'] {
  return [
    {
      id: 'compile-test-local-compile',
      label: 'Local compile result',
      source: 'artifact_check_result',
      detail: result.compiler.summary,
    },
    {
      id: 'compile-test-contract-tests',
      label: 'Local contract test result',
      source: 'artifact_check_result',
      detail: result.testRun.summary,
    },
    {
      id: 'compile-test-erc20-basics',
      label: 'ERC-20 basics tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('ERC-20 basics', result.testedCapabilities.erc20Basics),
    },
    {
      id: 'compile-test-whitelist-restrictions',
      label: 'Whitelist restrictions tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('Whitelist restrictions', result.testedCapabilities.whitelistRestrictions),
    },
    {
      id: 'compile-test-issuer-mint-allocation',
      label: 'Issuer mint/allocation tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('Issuer mint/allocation', result.testedCapabilities.issuerMintAllocation),
    },
    {
      id: 'compile-test-valuation-event',
      label: 'Valuation event tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('Valuation event', result.testedCapabilities.valuationEvent),
    },
    {
      id: 'compile-test-distribution-event',
      label: 'Distribution event tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('Distribution event', result.testedCapabilities.distributionEvent),
    },
    {
      id: 'compile-test-pause-unpause',
      label: 'Pause/unpause tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('Pause/unpause', result.testedCapabilities.pauseUnpause),
    },
    {
      id: 'compile-test-access-control',
      label: 'Access control tested',
      source: 'artifact_check_result',
      detail: capabilityDetail('Access control', result.testedCapabilities.accessControl),
    },
  ];
}

export function toSmartContractCompileSafetyEvidenceRefs(
  result: SmartContractCompileTestResult,
): SmartContractEvidenceLite['safetyEvidenceRefs'] {
  return [
    {
      boundary: 'deploymentNotExecuted',
      detail: result.boundaryChecks.deploymentNotExecuted
        ? 'Local compile/test result does not execute deployment.'
        : 'Deployment boundary failed.',
    },
    {
      boundary: 'walletSigningNotPerformed',
      detail: result.boundaryChecks.walletSigningNotPerformed
        ? 'Local compile/test result does not perform wallet signing.'
        : 'Wallet signing boundary failed.',
    },
    {
      boundary: 'privateKeysNotUsed',
      detail: result.boundaryChecks.privateKeysNotUsed
        ? 'Local compile/test result does not use private keys.'
        : 'Private-key boundary failed.',
    },
    {
      boundary: 'mainnetDisabled',
      detail: result.boundaryChecks.mainnetDisabled
        ? 'Local compile/test result does not configure mainnet.'
        : 'Mainnet boundary failed.',
    },
    {
      boundary: 'noFakeAddressOrTxHash',
      detail: result.boundaryChecks.noFakeAddressOrTxHash
        ? 'Local compile/test result does not create fake addresses or transaction hashes.'
        : 'Address/hash boundary failed.',
    },
    {
      boundary: 'auditNotPerformed',
      detail: result.boundaryChecks.auditNotPerformed
        ? 'Local compile/test result is not an audit result.'
        : 'Audit boundary failed.',
    },
  ];
}

export function toSmartContractCompileScpStatus(result: SmartContractCompileTestResult): SmartContractCompileScpStatus {
  if (result.status === 'passed') {
    return {
      localCompileTestStatus: 'passed',
      localCompileTestLabel: 'Local compile/test foundation',
      localCompileTestDetail:
        'Passed locally. This is not deployed, wallet signed, audited, connected to a wallet, or represented by a contract address or transaction hash.',
    };
  }

  if (result.status === 'failed') {
    return {
      localCompileTestStatus: 'failed',
      localCompileTestLabel: 'Local compile/test foundation',
      localCompileTestDetail:
        'Failed locally. Resolve the compile/test result before using it for evidence or deployment-gate readiness.',
    };
  }

  if (result.status === 'blocked') {
    return {
      localCompileTestStatus: 'blocked',
      localCompileTestLabel: 'Local compile/test foundation',
      localCompileTestDetail: result.blockedReasons[0] ?? 'Blocked before a usable local compile/test result was produced.',
    };
  }

  return {
    localCompileTestStatus: 'not_run',
    localCompileTestLabel: 'Local compile/test foundation',
    localCompileTestDetail: 'Not run. No compile/test readiness is claimed.',
  };
}
