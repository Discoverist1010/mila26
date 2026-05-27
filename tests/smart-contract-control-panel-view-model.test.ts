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
