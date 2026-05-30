import { describe, expect, it } from 'vitest';
import {
  getActionsByPlacement,
  getCockpitAction,
  isActionEnabled,
  toCockpitActionViewModel,
} from '../src/domain/cockpitActionRegistry';
import { createDemoProjectClosureLedger, type ProjectClosureLedger } from '../src/domain/projectClosureLedger';
import { toProjectClosureReadModel } from '../src/domain/projectClosureReadModel';
import { toProjectLifecycleReadModel } from '../src/domain/projectLifecycleReadModel';

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

describe('Cockpit action registry', () => {
  it('returns Create Requirement Doc as the enabled primary action before a Requirement Brief exists', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: false,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toCockpitActionViewModel(lifecycleReadModel);

    expect(viewModel.primaryEngineeringBotAction).toMatchObject({
      id: 'create_requirement_brief',
      label: 'Create Requirement Doc',
      placement: 'engineering_bot',
      enabled: true,
      kind: 'workflow',
      variant: 'primary',
    });
    expect(isActionEnabled(viewModel.actions, 'generate_engineering_brief')).toBe(false);
    expect(getCockpitAction(viewModel.actions, 'generate_engineering_brief')?.disabledReason).toBe(
      'Create the Requirement Brief first.',
    );
  });

  it('returns Generate Engineering Brief as the enabled primary action after a Requirement Brief exists', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toCockpitActionViewModel(lifecycleReadModel);

    expect(viewModel.primaryEngineeringBotAction).toMatchObject({
      id: 'generate_engineering_brief',
      label: 'Generate Engineering Brief',
      enabled: true,
    });
  });

  it('returns review closure items when Engineering Brief exists but closure is blocked', () => {
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
    const viewModel = toCockpitActionViewModel(lifecycleReadModel);

    expect(viewModel.primaryEngineeringBotAction).toMatchObject({
      id: 'review_closure_items',
      label: 'Review closure items',
      enabled: true,
    });
  });

  it('returns enabled Prepare Smart Contract Spec when closure is ready', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toCockpitActionViewModel(lifecycleReadModel);

    expect(viewModel.primaryEngineeringBotAction).toMatchObject({
      id: 'prepare_smart_contract_spec',
      label: 'Prepare Smart Contract Spec',
      enabled: true,
      kind: 'workflow',
    });
  });

  it('keeps future check, evidence, and deployment actions as disabled placeholders', () => {
    const readyForChecks = toCockpitActionViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
      }),
    );
    expect(readyForChecks.primaryEngineeringBotAction).toMatchObject({
      id: 'run_contract_checks',
      label: 'Toolchain Decision Pending',
      enabled: false,
    });
    expect(readyForChecks.primaryEngineeringBotAction.disabledReason).toMatch(/compile\/test toolchain decision/i);

    const readyForEvidence = toCockpitActionViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
        checkStatus: 'passed',
      }),
    );
    expect(readyForEvidence.primaryEngineeringBotAction).toMatchObject({
      id: 'prepare_evidence_pack',
      label: 'Prepare Evidence',
      enabled: false,
    });

    const readyForDeploymentGate = toCockpitActionViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
        checkStatus: 'passed',
        evidenceStatus: 'ready',
      }),
    );
    expect(readyForDeploymentGate.primaryEngineeringBotAction).toMatchObject({
      id: 'review_deployment_gate',
      label: 'Review Deployment Gate',
      enabled: false,
    });
  });

  it('returns Connect Wallet for Sepolia Check after deployment gate review is ready', () => {
    const viewModel = toCockpitActionViewModel(
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

    expect(viewModel.primaryEngineeringBotAction).toMatchObject({
      id: 'connect_wallet',
      label: 'Connect Wallet for Sepolia Check',
      placement: 'engineering_bot',
      enabled: true,
      kind: 'workflow',
    });
    expect(getActionsByPlacement(viewModel.actions, 'scp').every((action) => action.kind !== 'workflow')).toBe(true);
  });

  it('keeps panel toggle actions available and avoids right-rail workflow placement', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: false,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toCockpitActionViewModel(lifecycleReadModel);

    expect(viewModel.panelToggleActions.map((action) => action.id)).toEqual([
      'toggle_brief_panel',
      'toggle_left_rail',
      'toggle_right_rail',
    ]);
    expect(getActionsByPlacement(viewModel.actions, 'panel_toggle')).toHaveLength(3);
    expect(viewModel.primaryEngineeringBotAction.placement).toBe('engineering_bot');
    expect(viewModel.actions.every((action) => action.placement !== 'scp' || action.kind !== 'workflow')).toBe(true);
    expect(getCockpitAction(viewModel.actions, 'toggle_left_rail')?.enabled).toBe(true);
  });
});
