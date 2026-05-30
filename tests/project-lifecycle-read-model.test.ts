import { describe, expect, it } from 'vitest';
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

describe('Project Lifecycle Read Model', () => {
  it('derives setup state before the Requirement Brief exists', () => {
    const model = toProjectLifecycleReadModel({
      hasRequirementBrief: false,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });

    expect(model.currentStage).toBe('setup');
    expect(model.readinessStatus).toBe('ready_for_requirement_brief');
    expect(model.nextRecommendedActionId).toBe('create_requirement_brief');
    expect(model.enabledActionIds).toContain('create_requirement_brief');
    expect(model.disabledActionReasons.generate_engineering_brief).toBe('Create the Requirement Brief first.');
  });

  it('derives Engineering Brief readiness after Requirement Brief creation', () => {
    const model = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });

    expect(model.currentStage).toBe('requirement_brief');
    expect(model.readinessStatus).toBe('ready_for_engineering_brief');
    expect(model.nextRecommendedActionId).toBe('generate_engineering_brief');
    expect(model.enabledActionIds).toEqual(
      expect.arrayContaining(['generate_engineering_brief', 'review_assumptions', 'ask_question', 'open_brief']),
    );
  });

  it('derives blocked closure state from closure readiness', () => {
    const base = createDemoProjectClosureLedger();
    const model = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness({
        decisionStatus: 'blocked',
        checks: base.checks.map((check) =>
          check.category === 'security_review' ? { ...check, status: 'blocked' } : check,
        ),
      }),
    });

    expect(model.currentStage).toBe('closure_review');
    expect(model.readinessStatus).toBe('blocked');
    expect(model.nextRecommendedActionId).toBe('review_closure_items');
    expect(model.enabledActionIds).toContain('review_closure_items');
    expect(model.disabledActionReasons.prepare_smart_contract_spec).toBe('Resolve closure readiness before continuing.');
    expect(model.blockedReasons.join(' ')).toMatch(/Security Review/i);
  });

  it('derives artifact spec readiness once closure is ready', () => {
    const model = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
    });

    expect(model.currentStage).toBe('smart_contract_artifact_spec');
    expect(model.readinessStatus).toBe('ready_for_artifact_spec');
    expect(model.nextRecommendedActionId).toBe('prepare_smart_contract_spec');
    expect(model.enabledActionIds).toContain('prepare_smart_contract_spec');
  });

  it('uses lightweight future placeholders for check and evidence progression', () => {
    const readyForChecks = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
    });

    expect(readyForChecks.currentStage).toBe('checks');
    expect(readyForChecks.readinessStatus).toBe('ready_for_checks');
    expect(readyForChecks.nextRecommendedActionId).toBe('run_contract_checks');

    const readyForEvidence = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
      checkStatus: 'passed',
    });

    expect(readyForEvidence.currentStage).toBe('evidence_pack');
    expect(readyForEvidence.readinessStatus).toBe('ready_for_evidence_pack');
    expect(readyForEvidence.nextRecommendedActionId).toBe('prepare_evidence_pack');
  });

  it('moves from deployment gate review into wallet connection check without modeling signing completion', () => {
    const model = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      deploymentGateStatus: 'ready',
    });

    expect(model.currentStage).toBe('scp_preview');
    expect(model.readinessStatus).toBe('deployment_gate_ready');
    expect(model.nextRecommendedActionId).toBe('connect_wallet');
    expect(model.enabledActionIds).toContain('scroll_to_scp');
    expect(model.enabledActionIds).toContain('connect_wallet');
    expect(model.disabledActionReasons.prepare_smart_contract_spec).toBe(
      'Deployment remains a gated, user-wallet-signed testnet-only future step.',
    );
    expect('walletSigningStatus' in model).toBe(false);
  });

  it('exposes fixed MVP safety boundaries', () => {
    const model = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
    });

    expect(model.safetyBoundary).toEqual({
      network: 'ethereum-testnet-only',
      backendCustody: 'backend-holds-no-private-keys',
      signing: 'user-wallet-signs',
      mainnetAllowed: false,
    });
  });
});
