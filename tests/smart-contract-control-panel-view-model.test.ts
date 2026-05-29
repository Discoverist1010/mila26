import { describe, expect, it } from 'vitest';
import { createDemoProjectClosureLedger, type ProjectClosureLedger } from '../src/domain/projectClosureLedger';
import { toProjectClosureReadModel } from '../src/domain/projectClosureReadModel';
import { toProjectLifecycleReadModel } from '../src/domain/projectLifecycleReadModel';
import { toSmartContractControlPanelViewModel } from '../src/domain/smartContractControlPanelViewModel';

function closureReadiness(overrides: Partial<ProjectClosureLedger> = {}) {
  const base = createDemoProjectClosureLedger();
  return toProjectClosureReadModel({
    ledger: {
      ...base,
      ...overrides,
    },
    hasRequirementBrief: true,
    hasEngineeringBrief: true,
  });
}

describe('Smart Contract Control Panel view model', () => {
  it('derives preview state before Requirement Brief creation', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: false,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel);

    expect(viewModel.status).toBe('preview');
    expect(viewModel.statusLabel).toBe('Preview only');
    expect(viewModel.overview.contractStatus).toBe('Not deployed');
    expect(viewModel.overview.contractAddress).toBe('No contract address - not deployed');
    expect(viewModel.overview.network).toBe('Ethereum testnet only');
    expect(viewModel.overview.deployedBy).toBe('User Wallet');
    expect(viewModel.healthItems).toContainEqual({
      label: 'Deployment',
      value: 'Locked',
      status: 'disabled',
    });
  });

  it('derives blocked state without claiming contract execution', () => {
    const base = createDemoProjectClosureLedger();
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness({
        decisionStatus: 'blocked',
        checks: base.checks.map((check) =>
          check.category === 'security_review' ? { ...check, status: 'blocked' } : check,
        ),
      }),
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel);

    expect(viewModel.status).toBe('blocked');
    expect(viewModel.statusLabel).toBe('Blocked before contract specification');
    expect(viewModel.statusDetail).toMatch(/Security Review/i);
    expect(viewModel.overview.contractStatus).toBe('Not deployed');
    expect(viewModel.recentEvents).toContain('Deployment remains disabled for MVP');
  });

  it('derives ready-for-spec state after closure is ready', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel);

    expect(viewModel.status).toBe('ready_for_spec');
    expect(viewModel.statusLabel).toBe('Ready for Smart Contract Spec');
    expect(viewModel.healthItems).toContainEqual({
      label: 'Lifecycle',
      value: 'Ready for artifact specification',
      status: 'ready',
    });
    expect(viewModel.healthItems).toContainEqual({
      label: 'Contract artifact',
      value: 'Spec pending',
      status: 'pending',
    });
  });

  it('derives future check and deployment gate placeholder states', () => {
    const readyForChecks = toSmartContractControlPanelViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
      }),
    );
    expect(readyForChecks.status).toBe('ready_for_checks');
    expect(readyForChecks.statusLabel).toBe('Ready for deterministic checks');

    const readyForGate = toSmartContractControlPanelViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
        checkStatus: 'passed',
        evidenceStatus: 'ready',
        deploymentGateStatus: 'ready',
      }),
    );
    expect(readyForGate.status).toBe('ready_for_gate');
    expect(readyForGate.statusLabel).toBe('Ready for deployment gate review');
    expect(readyForGate.statusDetail).toMatch(/non-executing/i);
  });

  it('reflects generated spec, artifact preview, check result, and evidence-lite without execution claims', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      customEvents: [
        'WalletWhitelisted',
        'AllocationMinted',
        'ValuationUpdated',
        'DistributionRecorded',
        'TransferRestrictionUpdated',
        'ContractPaused',
        'ContractUnpaused',
      ],
    });

    expect(viewModel.status).toBe('artifact_preview_ready');
    expect(viewModel.statusLabel).toBe('Artifact preview generated');
    expect(viewModel.overview.contractStatus).toBe('Artifact preview generated - not deployed');
    expect(viewModel.overview.contractAddress).toBe('No contract address - not deployed');
    expect(viewModel.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Smart Contract Spec', value: 'Generated', status: 'ready' },
        { label: 'Artifact preview', value: 'Generated, not compiled', status: 'ready' },
        { label: 'Check result', value: 'Spec-consistency result available', status: 'ready' },
        { label: 'Evidence-lite', value: 'Available for later evidence pack wiring', status: 'ready' },
        { label: 'Compiler/toolchain', value: 'Not configured', status: 'disabled' },
        { label: 'Deployment', value: 'Not executed', status: 'disabled' },
        { label: 'Wallet signing', value: 'Not started', status: 'disabled' },
        { label: 'Audit', value: 'Not audited', status: 'disabled' },
      ]),
    );
    expect(viewModel.statusDetail).toMatch(/not compiled, deployed, audited, signed/i);
    expect(viewModel.boundaryItems).toEqual(
      expect.arrayContaining([
        { label: 'Ethereum testnet', value: 'Only', status: 'ready' },
        { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
        { label: 'Backend private keys', value: 'None held', status: 'disabled' },
        { label: 'Future deployment signer', value: 'User wallet', status: 'pending' },
        { label: 'Contract deployment', value: 'Not executed', status: 'disabled' },
        { label: 'Transaction hash', value: 'None exists', status: 'disabled' },
        { label: 'Audit', value: 'Not performed', status: 'disabled' },
      ]),
    );
    expect(viewModel.customFeatures).toEqual(
      expect.arrayContaining([
        {
          name: 'ValuationUpdated',
          initiation: 'Not user initiated',
          actionLabel: 'View only',
          enabled: false,
          disabledReason: 'Preview only. No wallet signing or blockchain transaction is wired in this MVP stage.',
        },
        {
          name: 'ContractPaused',
          initiation: 'User initiated',
          actionLabel: 'Trigger Event',
          enabled: false,
          disabledReason: 'Preview only. No wallet signing or blockchain transaction is wired in this MVP stage.',
        },
        {
          name: 'ContractUnpaused',
          initiation: 'User initiated',
          actionLabel: 'Trigger Event',
          enabled: false,
          disabledReason: 'Preview only. No wallet signing or blockchain transaction is wired in this MVP stage.',
        },
      ]),
    );
  });

  it('reflects local compile/test status as lightweight SCP readiness without execution claims', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      localCompileTestStatus: 'passed',
      localCompileTestLabel: 'Local compile/test foundation',
      localCompileTestDetail:
        'Passed locally. This is not deployed, wallet signed, audited, connected to a wallet, or represented by a contract address or transaction hash.',
      deploymentGateStatus: 'review_ready',
      preDeploymentReadiness: 'complete',
      deploymentExecutionStatus: 'blocked',
      walletSigningIntentStatus: 'review_ready',
      walletExecutionStatus: 'not_implemented',
    });

    expect(viewModel.status).toBe('artifact_preview_ready');
    expect(viewModel.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Local compile/test foundation', value: 'Passed', status: 'ready' },
        { label: 'Solidity fixture', value: 'Compiles locally', status: 'ready' },
        { label: 'Contract tests', value: 'Passed locally', status: 'ready' },
        {
          label: 'Tested capabilities',
          value: 'ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, access control',
          status: 'ready',
        },
        { label: 'Deployment Gate Review', value: 'Review-ready', status: 'ready' },
        { label: 'Pre-deployment readiness', value: 'Complete', status: 'ready' },
        { label: 'Deployment execution', value: 'Blocked', status: 'disabled' },
        { label: 'Wallet Signing Intent', value: 'Review-ready', status: 'ready' },
        { label: 'Wallet execution', value: 'Not implemented', status: 'disabled' },
        { label: 'Wallet connection', value: 'Not implemented', status: 'disabled' },
        { label: 'Smart Contract Operations', value: 'Locked', status: 'disabled' },
        {
          label: 'Operations reason',
          value: 'Wallet signing and testnet deployment are not implemented',
          status: 'disabled',
        },
        {
          label: 'Required before operations',
          value:
            'wallet connection, user-signed deployment, deployed testnet contract address, transaction hash, operation authorization model, evidence logging',
          status: 'pending',
        },
        { label: 'Deployment', value: 'Not executed', status: 'disabled' },
        { label: 'Wallet signing', value: 'Not started', status: 'disabled' },
        { label: 'Audit', value: 'Not audited', status: 'disabled' },
      ]),
    );
    expect(viewModel.statusDetail).toMatch(/local compile\/test representation/i);
    expect(viewModel.overview.contractAddress).toBe('No contract address - not deployed');
    expect(viewModel.boundaryItems).toEqual(
      expect.arrayContaining([
        { label: 'Transaction hash', value: 'None exists', status: 'disabled' },
        { label: 'Backend never holds private keys', value: 'Enforced', status: 'disabled' },
        { label: 'User wallet signing required later', value: 'Required', status: 'pending' },
        { label: 'Wallet signing not implemented', value: 'Not implemented', status: 'disabled' },
        { label: 'Wallet connection not implemented', value: 'Not implemented', status: 'disabled' },
        { label: 'No wallet address', value: 'Absent', status: 'disabled' },
        { label: 'No signed payload', value: 'Absent', status: 'disabled' },
        { label: 'No submitted transaction', value: 'Absent', status: 'disabled' },
        { label: 'No confirmed transaction', value: 'Absent', status: 'disabled' },
        { label: 'Contract address absent', value: 'No contract address', status: 'disabled' },
        { label: 'Transaction hash absent', value: 'No transaction hash', status: 'disabled' },
        { label: 'Audit', value: 'Not performed', status: 'disabled' },
      ]),
    );
    expect(JSON.stringify(viewModel)).not.toMatch(/wallet address: 0x|signed payload:|submitted transaction:|confirmed transaction:/i);
    expect(JSON.stringify(viewModel)).not.toMatch(/ready to sign|wallet connected|sign now|live|verified|production ready|mainnet ready/i);
  });

  it('keeps all SCP actions disabled until later wallet and transaction tracks', () => {
    const viewModel = toSmartContractControlPanelViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
      }),
    );

    expect(viewModel.coreActions.every((action) => action.enabled === false)).toBe(true);
    expect(viewModel.coreActions.map((action) => action.label)).toEqual(['Mint', 'Distribute', 'Burn', 'Pause/Unpause']);
    expect(viewModel.customFeatures.every((feature) => feature.enabled === false)).toBe(true);
    expect(viewModel.customFeatures).toContainEqual({
      name: 'Distribution Recorded',
      initiation: 'User initiated',
      actionLabel: 'Trigger Event',
      enabled: false,
      disabledReason: 'Preview only. No wallet signing or blockchain transaction is wired in this MVP stage.',
    });
  });
});
