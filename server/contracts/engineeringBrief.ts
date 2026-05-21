import { z } from 'zod';

const ModuleIdSchema = z.enum([
  'erc20-base',
  'whitelist',
  'blacklist',
  'nav-oracle',
  'investor-registry',
  'cash-registry',
  'dividend',
]);

export const EngineeringBriefRequirementBriefSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  sourceBriefId: z.string().min(1),
  projectName: z.string().trim().min(2).max(80),
  assetProfile: z.object({
    fundName: z.string().trim().min(2).max(80),
    tokenSymbol: z.string().min(2).max(12).regex(/^[A-Z0-9]+$/),
    jurisdiction: z.string().trim().min(2).max(80),
    targetInvestors: z.string().trim().min(2).max(120),
    totalSupply: z.number().positive(),
    initialNav: z.number().nonnegative(),
  }),
  tokenModel: z.object({
    standardPreference: z.enum(['ERC-20', 'ERC-721', 'undecided']),
    assumption: z.string().trim().min(1),
  }),
  investorAccess: z.object({
    walletWhitelistRequired: z.boolean(),
    assumptions: z.array(z.string().trim().min(1)).min(1),
  }),
  valuationPolicy: z.object({
    cadence: z.string().trim().min(1),
    assumptions: z.array(z.string().trim().min(1)).min(1),
  }),
  selectedServicingModules: z
    .array(
      z.object({
        id: ModuleIdSchema,
        enabled: z.boolean(),
        rationale: z.string().trim().min(1).max(280),
      }),
    )
    .min(1),
  networkBoundary: z.literal('ethereum-testnet-only'),
  deploymentBoundary: z.object({
    currentTarget: z.enum(['simulation-only', 'testnet-disabled', 'testnet-enabled']),
    signing: z.literal('user-wallet-signs'),
  }),
  backendCustodyBoundary: z.literal('backend-holds-no-private-keys'),
  complianceSecurityAssumptions: z.array(z.string().trim().min(1)).min(1),
  approvalStatus: z.enum(['draft', 'ready_for_approval', 'approved']),
  unresolvedQuestions: z.array(z.string()),
});

export const EngineeringBriefRequestSchema = z.object({
  requirementBrief: EngineeringBriefRequirementBriefSchema,
});

export const EngineeringBriefSchema = z.object({
  id: z.string().min(1),
  generatedAtIso: z.string().min(1),
  sourceRequirementBriefId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  projectContext: z.object({
    projectName: z.string().min(1),
    fundName: z.string().min(1),
    tokenSymbol: z.string().min(1),
    jurisdiction: z.string().min(1),
    targetInvestors: z.string().min(1),
  }),
  functionalRequirements: z.array(z.string().min(1)).min(1),
  nonFunctionalRequirements: z.array(z.string().min(1)).min(1),
  tokenDesign: z.object({
    standardPreference: z.enum(['ERC-20', 'ERC-721', 'undecided']),
    assumptions: z.array(z.string().min(1)).min(1),
    servicingModules: z.array(z.string().min(1)).min(1),
  }),
  walletAndAccessModel: z.object({
    whitelistRequired: z.boolean(),
    assumptions: z.array(z.string().min(1)).min(1),
  }),
  valuationAndPerformanceUpdates: z.object({
    cadence: z.string().min(1),
    assumptions: z.array(z.string().min(1)).min(1),
  }),
  complianceAndSecurityAssumptions: z.array(z.string().min(1)).min(1),
  deploymentBoundary: z.object({
    network: z.literal('ethereum-testnet-only'),
    noMainnetInMvp: z.literal(true),
    signing: z.literal('user-wallet-signs'),
    backendCustody: z.literal('backend-holds-no-private-keys'),
    currentTarget: z.enum(['simulation-only', 'testnet-disabled', 'testnet-enabled']),
    status: z.string().min(1),
  }),
  implementationPlan: z.array(z.string().min(1)).min(1),
  testingAndQaPlan: z.array(z.string().min(1)).min(1),
  evidencePackPlan: z.array(z.string().min(1)).min(1),
  openQuestions: z.array(z.string()),
  risksAndControls: z
    .array(
      z.object({
        risk: z.string().min(1),
        control: z.string().min(1),
      }),
    )
    .min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  metadata: z.object({
    generator: z.literal('deterministic-track-5b'),
    mode: z.literal('mock'),
    llmUsed: z.literal(false),
    productionAdvice: z.literal(false),
  }),
});

export type EngineeringBriefRequirementBrief = z.infer<typeof EngineeringBriefRequirementBriefSchema>;
export type EngineeringBriefRequest = z.infer<typeof EngineeringBriefRequestSchema>;
export type EngineeringBrief = z.infer<typeof EngineeringBriefSchema>;
