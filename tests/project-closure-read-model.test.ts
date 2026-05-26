import { describe, expect, it } from 'vitest';
import {
  createDemoProjectClosureLedger,
  type ProjectClosureLedger,
} from '../src/domain/projectClosureLedger';
import { toProjectClosureReadModel } from '../src/domain/projectClosureReadModel';

function createLedger(overrides: Partial<ProjectClosureLedger> = {}) {
  return {
    ...createDemoProjectClosureLedger(),
    ...overrides,
  };
}

describe('Project Closure Read Model', () => {
  it('derives a ready cockpit summary for a closed ledger', () => {
    const model = toProjectClosureReadModel({
      ledger: createDemoProjectClosureLedger(),
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
    });

    expect(model.status).toBe('ready');
    expect(model.readinessLabel).toBe('Ready for artifact specification');
    expect(model.passedCheckCount).toBe(10);
    expect(model.blockedCheckCount).toBe(0);
    expect(model.openItemCount).toBe(0);
    expect(model.deferredItemCount).toBe(1);
    expect(model.briefPreviewOpenItemSummary.label).toBe('1 deferred item(s)');
    expect(model.scpReadinessPreview.label).toBe('Closure ready for artifact specification');
  });

  it('derives a blocked cockpit summary when a closure check is blocked', () => {
    const base = createDemoProjectClosureLedger();
    const model = toProjectClosureReadModel({
      ledger: createLedger({
        decisionStatus: 'blocked',
        checks: base.checks.map((check) =>
          check.category === 'security_review' ? { ...check, status: 'blocked' } : check,
        ),
      }),
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
    });

    expect(model.status).toBe('blocked');
    expect(model.readinessLabel).toBe('Closure review blocked');
    expect(model.blockedCheckCount).toBe(1);
    expect(model.blockedReasons[0]).toContain('Security Review');
    expect(model.scpReadinessPreview.healthItems).toContain('Closure: Blocked');
  });

  it('keeps unresolved blocking open items from passing readiness', () => {
    const base = createDemoProjectClosureLedger();
    const model = toProjectClosureReadModel({
      ledger: createLedger({
        decisionStatus: 'in_review',
        openItems: [
          ...base.openItems,
          {
            id: 'open-item-wallet-policy',
            category: 'wallet_access',
            title: 'Confirm wallet whitelist policy',
            description: 'Investor wallet access assumptions must be reviewed before build readiness.',
            status: 'open',
            blocking: true,
            evidenceRefs: [],
          },
        ],
      }),
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
    });

    expect(model.status).toBe('blocked');
    expect(model.openItemCount).toBe(1);
    expect(model.blockingOpenItemCount).toBe(1);
    expect(model.blockedReasons).toContain('Confirm wallet whitelist policy');
    expect(model.briefPreviewOpenItemSummary.label).toBe('1 unresolved item(s)');
  });

  it('tracks deferred non-blocking items without blocking readiness', () => {
    const model = toProjectClosureReadModel({
      ledger: createDemoProjectClosureLedger(),
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
    });

    expect(model.status).toBe('ready');
    expect(model.deferredItemCount).toBe(1);
    expect(model.rightRailChecklistItems).toContainEqual({
      label: 'Deferred non-blocking items tracked',
      status: 'deferred',
    });
  });

  it('derives pending states before Requirement Brief and Engineering Brief exist', () => {
    const ledger = createDemoProjectClosureLedger();

    expect(
      toProjectClosureReadModel({
        ledger,
        hasRequirementBrief: false,
        hasEngineeringBrief: false,
      }).readinessLabel,
    ).toBe('Requirement Brief pending');

    expect(
      toProjectClosureReadModel({
        ledger,
        hasRequirementBrief: true,
        hasEngineeringBrief: false,
      }).readinessLabel,
    ).toBe('Engineering Brief pending');
  });
});
