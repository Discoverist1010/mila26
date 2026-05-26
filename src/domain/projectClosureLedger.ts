import { z } from 'zod';

export const projectClosureDecisionStatuses = ['open', 'in_review', 'resolved', 'blocked', 'deferred'] as const;

export const projectClosureCheckCategories = [
  'requirement_brief',
  'engineering_brief',
  'token_design',
  'wallet_access',
  'valuation_updates',
  'compliance_assumptions',
  'security_review',
  'evidence_pack',
  'deployment_boundary',
  'user_approval',
] as const;

export const ProjectClosureDecisionStatusSchema = z.enum(projectClosureDecisionStatuses);
export const ProjectClosureCheckCategorySchema = z.enum(projectClosureCheckCategories);

export const ProjectClosureEvidenceReferenceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    'requirement_brief',
    'engineering_brief',
    'security_review',
    'evidence_pack',
    'deployment_gate',
    'decision_note',
  ]),
  title: z.string().min(1).max(140),
  sourceId: z.string().min(1).optional(),
});

export const ProjectOpenItemSchema = z.object({
  id: z.string().min(1),
  category: ProjectClosureCheckCategorySchema,
  title: z.string().min(1).max(140),
  description: z.string().min(1).max(500),
  status: ProjectClosureDecisionStatusSchema,
  blocking: z.boolean().default(false),
  evidenceRefs: z.array(ProjectClosureEvidenceReferenceSchema).default([]),
});

export const ProjectClosureCheckSchema = z.object({
  id: z.string().min(1),
  category: ProjectClosureCheckCategorySchema,
  title: z.string().min(1).max(140),
  status: ProjectClosureDecisionStatusSchema,
  required: z.boolean().default(true),
  evidenceRefs: z.array(ProjectClosureEvidenceReferenceSchema).default([]),
});

export const ProjectClosureSafetyBoundariesSchema = z.object({
  networkBoundary: z.literal('ethereum-testnet-only'),
  backendCustodyBoundary: z.literal('backend-holds-no-private-keys'),
  deploymentSigningBoundary: z.literal('user-wallet-signs'),
  mainnetDeploymentAllowed: z.literal(false),
});

export const ProjectClosureLedgerSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  decisionStatus: ProjectClosureDecisionStatusSchema,
  safetyBoundaries: ProjectClosureSafetyBoundariesSchema,
  checks: z.array(ProjectClosureCheckSchema).min(1),
  openItems: z.array(ProjectOpenItemSchema).default([]),
  evidenceRefs: z.array(ProjectClosureEvidenceReferenceSchema).default([]),
});

export const ProjectClosureReadinessSummarySchema = z.object({
  totalChecks: z.number().int().nonnegative(),
  passedChecks: z.number().int().nonnegative(),
  blockedChecks: z.number().int().nonnegative(),
  openItems: z.number().int().nonnegative(),
  deferredItems: z.number().int().nonnegative(),
  boundaryStatus: z.object({
    ethereumTestnetOnly: z.boolean(),
    backendHoldsNoPrivateKeys: z.boolean(),
    userWalletSignsDeployment: z.boolean(),
    mainnetDeploymentDisabled: z.boolean(),
  }),
  isReadyForNextStage: z.boolean(),
});

export type ProjectClosureDecisionStatus = z.infer<typeof ProjectClosureDecisionStatusSchema>;
export type ProjectClosureCheckCategory = z.infer<typeof ProjectClosureCheckCategorySchema>;
export type ProjectClosureEvidenceReference = z.infer<typeof ProjectClosureEvidenceReferenceSchema>;
export type ProjectOpenItem = z.infer<typeof ProjectOpenItemSchema>;
export type ProjectClosureCheck = z.infer<typeof ProjectClosureCheckSchema>;
export type ProjectClosureLedger = z.infer<typeof ProjectClosureLedgerSchema>;
export type ProjectClosureReadinessSummary = z.infer<typeof ProjectClosureReadinessSummarySchema>;

function isUnresolved(status: ProjectClosureDecisionStatus) {
  return status === 'open' || status === 'in_review' || status === 'blocked';
}

export function summarizeProjectClosureReadiness(ledger: ProjectClosureLedger): ProjectClosureReadinessSummary {
  const parsedLedger = ProjectClosureLedgerSchema.parse(ledger);
  const boundaryStatus = {
    ethereumTestnetOnly: parsedLedger.safetyBoundaries.networkBoundary === 'ethereum-testnet-only',
    backendHoldsNoPrivateKeys: parsedLedger.safetyBoundaries.backendCustodyBoundary === 'backend-holds-no-private-keys',
    userWalletSignsDeployment: parsedLedger.safetyBoundaries.deploymentSigningBoundary === 'user-wallet-signs',
    mainnetDeploymentDisabled: parsedLedger.safetyBoundaries.mainnetDeploymentAllowed === false,
  };
  const totalChecks = parsedLedger.checks.length;
  const passedChecks = parsedLedger.checks.filter((check) => check.status === 'resolved').length;
  const blockedChecks = parsedLedger.checks.filter((check) => check.status === 'blocked').length;
  const openItems = parsedLedger.openItems.filter((item) => isUnresolved(item.status)).length;
  const deferredItems = parsedLedger.openItems.filter((item) => item.status === 'deferred').length;
  const requiredChecksReady = parsedLedger.checks
    .filter((check) => check.required)
    .every((check) => check.status === 'resolved');
  const blockingOpenItems = parsedLedger.openItems.some((item) => item.blocking && isUnresolved(item.status));
  const boundariesReady = Object.values(boundaryStatus).every(Boolean);

  return ProjectClosureReadinessSummarySchema.parse({
    totalChecks,
    passedChecks,
    blockedChecks,
    openItems,
    deferredItems,
    boundaryStatus,
    isReadyForNextStage: boundariesReady && requiredChecksReady && blockedChecks === 0 && !blockingOpenItems,
  });
}

export function createDemoProjectClosureLedger(): ProjectClosureLedger {
  const evidenceRefs: ProjectClosureEvidenceReference[] = [
    {
      id: 'evidence-requirement-brief-demo',
      kind: 'requirement_brief',
      title: 'Requirement Brief draft',
      sourceId: 'requirement-contract-demo',
    },
    {
      id: 'evidence-engineering-brief-demo',
      kind: 'engineering_brief',
      title: 'Engineering Brief artifact',
      sourceId: 'engineering-brief-demo',
    },
  ];

  return ProjectClosureLedgerSchema.parse({
    id: 'project-closure-ledger-demo',
    projectId: 'mila-income-fund-demo',
    createdAt: '2026-05-26T00:00:00.000Z',
    updatedAt: '2026-05-26T00:00:00.000Z',
    decisionStatus: 'resolved',
    safetyBoundaries: {
      networkBoundary: 'ethereum-testnet-only',
      backendCustodyBoundary: 'backend-holds-no-private-keys',
      deploymentSigningBoundary: 'user-wallet-signs',
      mainnetDeploymentAllowed: false,
    },
    checks: projectClosureCheckCategories.map((category) => ({
      id: `check-${category}`,
      category,
      title: `${category.replaceAll('_', ' ')} readiness`,
      status: 'resolved',
      required: true,
      evidenceRefs,
    })),
    openItems: [
      {
        id: 'open-item-legal-review-demo',
        category: 'compliance_assumptions',
        title: 'Legal review before launch',
        description: 'Qualified legal review remains deferred and outside MVP execution.',
        status: 'deferred',
        blocking: false,
        evidenceRefs: [],
      },
    ],
    evidenceRefs,
  });
}
