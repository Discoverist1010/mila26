import type { SmartContractCompileTestResult } from '../../server/contracts/smartContractCompileCheck';

export type SmartContractCompileTestPresentation = {
  scpStatus: {
    localCompileTestStatus: SmartContractCompileTestResult['status'];
    localCompileTestLabel: string;
    localCompileTestDetail: string;
  };
  artifactCard: {
    label: string;
    status: string;
    detail: string;
    source: string;
  };
  testedCapabilitiesSummary: string;
};

const testedCapabilitiesSummary =
  'ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, and access control.';

export function createKnownLocalCompileTestResult(input: {
  artifactId: string;
  specId: string;
  generatedAt?: string;
}): SmartContractCompileTestResult {
  return {
    compileCheckId: `compile-check-${input.artifactId}`,
    artifactId: input.artifactId,
    specId: input.specId,
    contractName: 'Mila26RestrictedFundToken',
    toolchain: 'hardhat',
    status: 'passed',
    compiler: {
      configured: true,
      toolchainStatus: 'configured',
      solidityVersion: '0.8.28',
      command: 'npm run contracts:build -- --force',
      status: 'passed',
      summary: 'Local Hardhat compile foundation completed for the MILA26 restricted ERC-20-compatible fixture.',
    },
    testRun: {
      command: 'npm run test:contracts',
      status: 'passed',
      testCount: 7,
      summary:
        'Local contract tests passed for ERC-20 basics, wallet restrictions, issuer actions, events, and pause controls.',
    },
    testedCapabilities: {
      erc20Basics: 'passed',
      whitelistRestrictions: 'passed',
      issuerMintAllocation: 'passed',
      valuationEvent: 'passed',
      distributionEvent: 'passed',
      pauseUnpause: 'passed',
      accessControl: 'passed',
    },
    boundaryChecks: {
      deploymentNotExecuted: true,
      walletSigningNotPerformed: true,
      privateKeysNotUsed: true,
      mainnetDisabled: true,
      noFakeAddressOrTxHash: true,
      auditNotPerformed: true,
    },
    evidenceRefs: [
      'compile-test-local-compile',
      'compile-test-contract-tests',
      'compile-test-erc20-basics',
      'compile-test-whitelist-restrictions',
      'compile-test-issuer-mint-allocation',
      'compile-test-valuation-event',
      'compile-test-distribution-event',
      'compile-test-pause-unpause',
      'compile-test-access-control',
    ],
    blockedReasons: [],
    metadata: {
      generatedAt: input.generatedAt ?? new Date(0).toISOString(),
      generator: 'deterministic_10b_compile_test_result_adapter',
      source: 'local_hardhat_test_foundation',
      version: '10b.1',
    },
  };
}

export function toSmartContractCompileTestPresentation(
  result: SmartContractCompileTestResult,
): SmartContractCompileTestPresentation {
  const passed = result.status === 'passed';

  return {
    scpStatus: {
      localCompileTestStatus: result.status,
      localCompileTestLabel: 'Local compile/test foundation',
      localCompileTestDetail: passed
        ? 'Passed locally. Known local foundation result; not run by this UI action, not deployed, not signed, not audited, no address, no transaction hash.'
        : 'Local compile/test result is not passed. No deployment or audit readiness is claimed.',
    },
    artifactCard: {
      label: 'Local Compile/Test',
      status: passed ? 'Passed' : result.status,
      detail: passed
        ? `Hardhat fixture compiles and local contract tests pass. Tested capabilities: ${testedCapabilitiesSummary}`
        : 'Local compile/test foundation is not passed. No deployment readiness is claimed.',
      source: 'Known local foundation result',
    },
    testedCapabilitiesSummary,
  };
}
