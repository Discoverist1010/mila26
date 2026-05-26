import {
  ProjectClosureLedgerSchema,
  summarizeProjectClosureReadiness,
  type ProjectClosureDecisionStatus,
  type ProjectClosureLedger,
} from './projectClosureLedger';

export type ProjectClosureCockpitStatus = 'not_started' | 'open' | 'blocked' | 'ready';
export type ProjectClosureChecklistStatus = 'done' | 'open' | 'blocked' | 'deferred';

export type ProjectClosureReadModelInput = {
  ledger: ProjectClosureLedger;
  hasRequirementBrief: boolean;
  hasEngineeringBrief: boolean;
};

export type ProjectClosureChecklistItem = {
  label: string;
  status: ProjectClosureChecklistStatus;
};

export type ProjectClosureReadModel = {
  status: ProjectClosureCockpitStatus;
  readinessLabel: string;
  readinessDescription: string;
  openItemCount: number;
  blockingOpenItemCount: number;
  deferredItemCount: number;
  blockedCheckCount: number;
  passedCheckCount: number;
  blockedReasons: string[];
  rightRailChecklistItems: ProjectClosureChecklistItem[];
  briefPreviewOpenItemSummary: {
    label: string;
    detail: string;
  };
  scpReadinessPreview: {
    label: string;
    detail: string;
    healthItems: string[];
  };
};

function isUnresolved(status: ProjectClosureDecisionStatus) {
  return status === 'open' || status === 'in_review' || status === 'blocked';
}

function humanizeCheckId(value: string) {
  return value
    .replace(/^check-/, '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function toProjectClosureReadModel(input: ProjectClosureReadModelInput): ProjectClosureReadModel {
  const ledger = ProjectClosureLedgerSchema.parse(input.ledger);
  const summary = summarizeProjectClosureReadiness(ledger);
  const blockingOpenItems = ledger.openItems.filter((item) => item.blocking && isUnresolved(item.status));
  const blockedChecks = ledger.checks.filter((check) => check.status === 'blocked');
  const blockedReasons = [
    ...blockedChecks.slice(0, 3).map((check) => `${humanizeCheckId(check.id)} is blocked.`),
    ...blockingOpenItems.slice(0, 3).map((item) => item.title),
  ];

  if (!input.hasRequirementBrief) {
    return {
      status: 'not_started',
      readinessLabel: 'Requirement Brief pending',
      readinessDescription: 'Closure readiness starts after the Requirement Brief is created.',
      openItemCount: 1,
      blockingOpenItemCount: 0,
      deferredItemCount: summary.deferredItems,
      blockedCheckCount: 0,
      passedCheckCount: 0,
      blockedReasons: [],
      rightRailChecklistItems: [
        { label: 'Create Requirement Brief', status: 'open' },
        { label: 'Generate Engineering Brief', status: 'open' },
        { label: 'Review closure readiness', status: 'open' },
      ],
      briefPreviewOpenItemSummary: {
        label: 'Requirement Brief pending',
        detail: 'Create the brief before closure checks can be reviewed.',
      },
      scpReadinessPreview: {
        label: 'Closure readiness pending',
        detail: 'Smart Contract Control stays preview-only until requirements and closure checks are ready.',
        healthItems: ['Closure: Pending', 'Deployment: Locked', 'Mainnet: Disabled'],
      },
    };
  }

  if (!input.hasEngineeringBrief) {
    return {
      status: 'open',
      readinessLabel: 'Engineering Brief pending',
      readinessDescription: 'Closure readiness is open until the Engineering Brief is generated.',
      openItemCount: 1,
      blockingOpenItemCount: 0,
      deferredItemCount: summary.deferredItems,
      blockedCheckCount: 0,
      passedCheckCount: 1,
      blockedReasons: [],
      rightRailChecklistItems: [
        { label: 'Requirement Brief created', status: 'done' },
        { label: 'Generate Engineering Brief', status: 'open' },
        { label: 'Review closure readiness', status: 'open' },
      ],
      briefPreviewOpenItemSummary: {
        label: 'Engineering Brief pending',
        detail: 'Generate the Engineering Brief before closure readiness can be confirmed.',
      },
      scpReadinessPreview: {
        label: 'Closure readiness open',
        detail: 'Smart Contract Control remains a preview while engineering details are incomplete.',
        healthItems: ['Closure: Open', 'Deployment: Locked', 'Mainnet: Disabled'],
      },
    };
  }

  if (!summary.isReadyForNextStage) {
    return {
      status: 'blocked',
      readinessLabel: 'Closure review blocked',
      readinessDescription: 'Resolve blocking open items or blocked checks before artifact specification.',
      openItemCount: summary.openItems,
      blockingOpenItemCount: blockingOpenItems.length,
      deferredItemCount: summary.deferredItems,
      blockedCheckCount: summary.blockedChecks,
      passedCheckCount: summary.passedChecks,
      blockedReasons,
      rightRailChecklistItems: [
        { label: 'Requirement Brief created', status: 'done' },
        { label: 'Engineering Brief generated', status: 'done' },
        { label: 'Resolve blocking closure items', status: 'blocked' },
      ],
      briefPreviewOpenItemSummary: {
        label: `${summary.openItems} unresolved item(s)`,
        detail: blockedReasons[0] ?? 'Closure review needs attention before the next stage.',
      },
      scpReadinessPreview: {
        label: 'Closure review blocked',
        detail: 'Smart Contract Control remains preview-only because closure checks are not ready.',
        healthItems: ['Closure: Blocked', 'Deployment: Locked', 'Mainnet: Disabled'],
      },
    };
  }

  return {
    status: 'ready',
    readinessLabel: 'Ready for artifact specification',
    readinessDescription: 'Required closure checks are complete; deferred non-blocking items remain visible.',
    openItemCount: summary.openItems,
    blockingOpenItemCount: 0,
    deferredItemCount: summary.deferredItems,
    blockedCheckCount: summary.blockedChecks,
    passedCheckCount: summary.passedChecks,
    blockedReasons: [],
    rightRailChecklistItems: [
      { label: 'Requirement Brief created', status: 'done' },
      { label: 'Engineering Brief generated', status: 'done' },
      { label: 'Closure readiness reviewed', status: 'done' },
      { label: 'Deferred non-blocking items tracked', status: summary.deferredItems > 0 ? 'deferred' : 'done' },
    ],
    briefPreviewOpenItemSummary: {
      label: summary.deferredItems > 0 ? `${summary.deferredItems} deferred item(s)` : 'No blocking open items',
      detail:
        summary.deferredItems > 0
          ? 'Deferred items stay visible but do not block artifact specification.'
          : 'No unresolved closure items block the next stage.',
    },
    scpReadinessPreview: {
      label: 'Closure ready for artifact specification',
      detail: 'Smart Contract Control remains preview-only until a contract artifact and checks exist.',
      healthItems: ['Closure: Ready', 'Deployment: Locked', 'Mainnet: Disabled'],
    },
  };
}
