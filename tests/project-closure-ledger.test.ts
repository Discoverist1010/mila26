import { describe, expect, it } from 'vitest';
import {
  ProjectClosureLedgerSchema,
  createDemoProjectClosureLedger,
  summarizeProjectClosureReadiness,
  type ProjectClosureLedger,
} from '../src/domain/projectClosureLedger';

function createLedger(overrides: Partial<ProjectClosureLedger> = {}) {
  return ProjectClosureLedgerSchema.parse({
    ...createDemoProjectClosureLedger(),
    ...overrides,
  });
}

describe('Project Closure Ledger contract', () => {
  it('creates a deterministic demo ledger and ready summary', () => {
    const ledger = createDemoProjectClosureLedger();
    const summary = summarizeProjectClosureReadiness(ledger);

    expect(ledger.id).toBe('project-closure-ledger-demo');
    expect(ledger.projectId).toBe('mila-income-fund-demo');
    expect(ledger.checks).toHaveLength(10);
    expect(ledger.evidenceRefs.map((ref) => ref.kind)).toEqual(['requirement_brief', 'engineering_brief']);
    expect(summary.totalChecks).toBe(10);
    expect(summary.passedChecks).toBe(10);
    expect(summary.blockedChecks).toBe(0);
    expect(summary.openItems).toBe(0);
    expect(summary.deferredItems).toBe(1);
    expect(summary.isReadyForNextStage).toBe(true);
  });

  it('marks a ledger blocked when a required closure check is blocked', () => {
    const base = createDemoProjectClosureLedger();
    const ledger = createLedger({
      decisionStatus: 'blocked',
      checks: base.checks.map((check) =>
        check.category === 'security_review' ? { ...check, status: 'blocked' } : check,
      ),
    });
    const summary = summarizeProjectClosureReadiness(ledger);

    expect(summary.totalChecks).toBe(10);
    expect(summary.passedChecks).toBe(9);
    expect(summary.blockedChecks).toBe(1);
    expect(summary.isReadyForNextStage).toBe(false);
  });

  it('keeps unresolved blocking open items from passing readiness', () => {
    const base = createDemoProjectClosureLedger();
    const ledger = createLedger({
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
    });
    const summary = summarizeProjectClosureReadiness(ledger);

    expect(summary.openItems).toBe(1);
    expect(summary.deferredItems).toBe(1);
    expect(summary.isReadyForNextStage).toBe(false);
  });

  it('allows non-blocking deferred items without hiding them from the summary', () => {
    const ledger = createDemoProjectClosureLedger();
    const summary = summarizeProjectClosureReadiness(ledger);

    expect(ledger.openItems[0].status).toBe('deferred');
    expect(ledger.openItems[0].blocking).toBe(false);
    expect(summary.deferredItems).toBe(1);
    expect(summary.isReadyForNextStage).toBe(true);
  });

  it('rejects boundary failures such as mainnet deployment or backend key custody', () => {
    const ledger = createDemoProjectClosureLedger();

    expect(() =>
      ProjectClosureLedgerSchema.parse({
        ...ledger,
        safetyBoundaries: {
          ...ledger.safetyBoundaries,
          mainnetDeploymentAllowed: true,
        },
      }),
    ).toThrow();

    expect(() =>
      ProjectClosureLedgerSchema.parse({
        ...ledger,
        safetyBoundaries: {
          ...ledger.safetyBoundaries,
          backendCustodyBoundary: 'backend-holds-private-keys',
        },
      }),
    ).toThrow();
  });
});
