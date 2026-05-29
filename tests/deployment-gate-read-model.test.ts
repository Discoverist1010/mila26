import { describe, expect, it } from 'vitest';
import { toDeploymentGateReadModel, type DeploymentGateReadModelInput } from '../src/domain/deploymentGateReadModel';

const completeInput: DeploymentGateReadModelInput = {
  hasRequirementBrief: true,
  hasEngineeringBrief: true,
  closureReadinessStatus: 'ready',
  artifactSpecStatus: 'ready',
  artifactPreviewStatus: 'generated',
  checkResultStatus: 'passed',
  evidenceLiteStatus: 'ready',
  localCompileTestStatus: 'passed',
};

function model(overrides: Partial<DeploymentGateReadModelInput> = {}) {
  return toDeploymentGateReadModel({
    ...completeInput,
    ...overrides,
  });
}

function prerequisiteStatus(input: Partial<DeploymentGateReadModelInput>, checkId: string) {
  return model(input).prerequisiteChecks.find((check) => check.id === checkId)?.status;
}

describe('Deployment Gate Read Model', () => {
  it('blocks the gate when the Requirement Brief is missing', () => {
    const readModel = model({ hasRequirementBrief: false });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ hasRequirementBrief: false }, 'requirement-brief')).toBe('missing');
    expect(readModel.blockedReasons.join(' ')).toMatch(/Requirement Brief/i);
  });

  it('blocks the gate when the Engineering Brief is missing', () => {
    const readModel = model({ hasEngineeringBrief: false });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ hasEngineeringBrief: false }, 'engineering-brief')).toBe('missing');
  });

  it('blocks the gate when closure readiness is blocked', () => {
    const readModel = model({ closureReadinessStatus: 'blocked' });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('blocked');
    expect(prerequisiteStatus({ closureReadinessStatus: 'blocked' }, 'closure-readiness')).toBe('blocked');
  });

  it('blocks the gate when Smart Contract Artifact Spec is missing', () => {
    const readModel = model({ artifactSpecStatus: 'not_started' });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ artifactSpecStatus: 'not_started' }, 'smart-contract-artifact-spec')).toBe('missing');
  });

  it('blocks the gate when Artifact Preview is missing', () => {
    const readModel = model({ artifactPreviewStatus: 'not_started' });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ artifactPreviewStatus: 'not_started' }, 'artifact-preview')).toBe('missing');
  });

  it('blocks the gate when Check Result is missing', () => {
    const readModel = model({ checkResultStatus: 'not_started' });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ checkResultStatus: 'not_started' }, 'check-result')).toBe('missing');
  });

  it('blocks the gate when Evidence-Lite is missing', () => {
    const readModel = model({ evidenceLiteStatus: 'not_started' });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ evidenceLiteStatus: 'not_started' }, 'evidence-lite')).toBe('missing');
  });

  it('blocks the gate when local compile/test is missing or failed', () => {
    const missing = model({ localCompileTestStatus: 'not_run' });
    const failed = model({ localCompileTestStatus: 'failed' });

    expect(missing.gateStatus).toBe('blocked');
    expect(missing.preDeploymentReadiness).toBe('incomplete');
    expect(prerequisiteStatus({ localCompileTestStatus: 'not_run' }, 'local-compile-test')).toBe('missing');
    expect(failed.gateStatus).toBe('blocked');
    expect(failed.preDeploymentReadiness).toBe('blocked');
    expect(prerequisiteStatus({ localCompileTestStatus: 'failed' }, 'local-compile-test')).toBe('failed');
  });

  it('marks pre-deployment readiness complete when all planning and check artifacts are present', () => {
    const readModel = model();

    expect(readModel.gateStatus).toBe('review_ready');
    expect(readModel.preDeploymentReadiness).toBe('complete');
    expect(readModel.readyForDeploymentGateReview).toBe(true);
    expect(readModel.readyForWalletSigningDesign).toBe(true);
    expect(readModel.prerequisiteChecks.every((check) => check.status === 'passed')).toBe(true);
  });

  it('keeps deployment execution blocked even when pre-deployment readiness is complete', () => {
    const readModel = model();

    expect(readModel.deploymentExecutionStatus).toBe('blocked');
    expect(readModel.blockedReasons).toContain(
      'Deployment execution remains blocked because wallet signing is not implemented.',
    );
    expect(readModel.remainingGateItems).toContain('Design wallet signing before any future Ethereum testnet deployment.');
  });

  it('exposes explicit MVP boundary checks', () => {
    const readModel = model();

    expect(readModel.boundaryChecks).toEqual(
      expect.arrayContaining([
        {
          id: 'ethereum-testnet-only',
          label: 'Ethereum testnet only',
          status: 'enforced',
          detail: 'Future deployment remains limited to Ethereum testnet planning.',
        },
        {
          id: 'mainnet-disabled',
          label: 'Mainnet disabled',
          status: 'enforced',
          detail: 'Mainnet is disabled in the MVP.',
        },
        {
          id: 'backend-private-keys',
          label: 'Backend holds no private keys',
          status: 'enforced',
          detail: 'Backend private-key custody remains out of scope.',
        },
        {
          id: 'user-wallet-signing-required',
          label: 'User wallet signing required',
          status: 'enforced',
          detail: 'Future deployment requires user wallet signing.',
        },
        {
          id: 'wallet-signing-not-implemented',
          label: 'Wallet signing not implemented',
          status: 'enforced',
          detail: 'Wallet signing remains a later implementation track.',
        },
        {
          id: 'deployment-not-executed',
          label: 'Deployment not executed',
          status: 'enforced',
          detail: 'No deployment has been executed.',
        },
        {
          id: 'contract-address-absent',
          label: 'Contract address absent',
          status: 'enforced',
          detail: 'No contract address exists.',
        },
        {
          id: 'transaction-hash-absent',
          label: 'Transaction hash absent',
          status: 'enforced',
          detail: 'No transaction hash exists.',
        },
        {
          id: 'audit-not-performed',
          label: 'Audit not performed',
          status: 'enforced',
          detail: 'No audit has been performed.',
        },
      ]),
    );
  });

  it('blocks gate review when safety boundaries are violated', () => {
    const readModel = model({
      safetyBoundary: {
        network: 'mainnet',
        mainnetDisabled: false,
        backendPrivateKeysHeld: true,
        walletSigningImplemented: true,
        deploymentExecuted: true,
        contractAddressPresent: true,
        transactionHashPresent: true,
        auditPerformed: true,
      },
    });

    expect(readModel.gateStatus).toBe('blocked');
    expect(readModel.preDeploymentReadiness).toBe('complete');
    expect(readModel.readyForDeploymentGateReview).toBe(false);
    expect(readModel.boundaryChecks.some((check) => check.status === 'execution_blocked')).toBe(true);
  });

  it('does not output fake addresses, hashes, transaction lifecycle states, or execution claims', () => {
    const readModel = model();
    const serialized = JSON.stringify(readModel);

    expect(serialized).not.toMatch(/0x[a-fA-F0-9]{6,}/);
    expect(serialized).not.toMatch(/ready_for_signature|submitted|confirmed|transactionStatus|readyToDeploy/i);
    expect(serialized).not.toMatch(/deployedAddress|txHash|contractAddress/);
    expect(serialized).not.toMatch(/live|signed|audited|verified|production ready|mainnet ready/i);
  });
});
