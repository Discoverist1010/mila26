import { z } from 'zod';
import {
  RequirementBriefSchema,
  ServicingModuleSchema,
  type RequirementBrief,
  type ServicingModule,
} from './schemas';

export const RequirementBriefApprovalStatusSchema = z.enum(['draft', 'ready_for_approval', 'approved']);
export const TokenStandardPreferenceSchema = z.enum(['ERC-20', 'ERC-721', 'undecided']);
export const TargetNetworkBoundarySchema = z.literal('ethereum-testnet-only');
export const DeploymentSigningBoundarySchema = z.literal('user-wallet-signs');
export const BackendCustodyBoundarySchema = z.literal('backend-holds-no-private-keys');

export const RequirementBriefContractSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  sourceBriefId: z.string().min(1),
  projectName: z.string().min(2).max(80),
  assetProfile: z.object({
    fundName: z.string().min(2).max(80),
    tokenSymbol: z.string().min(2).max(12).regex(/^[A-Z0-9]+$/),
    jurisdiction: z.string().min(2).max(80),
    targetInvestors: z.string().min(2).max(120),
    totalSupply: z.number().positive(),
    initialNav: z.number().nonnegative(),
  }),
  tokenModel: z.object({
    standardPreference: TokenStandardPreferenceSchema,
    assumption: z.string().min(1),
  }),
  investorAccess: z.object({
    walletWhitelistRequired: z.boolean(),
    assumptions: z.array(z.string()).min(1),
  }),
  valuationPolicy: z.object({
    cadence: z.string().min(1),
    assumptions: z.array(z.string()).min(1),
  }),
  selectedServicingModules: z.array(ServicingModuleSchema).min(1),
  networkBoundary: TargetNetworkBoundarySchema,
  deploymentBoundary: z.object({
    currentTarget: RequirementBriefSchema.shape.deploymentTarget,
    signing: DeploymentSigningBoundarySchema,
  }),
  backendCustodyBoundary: BackendCustodyBoundarySchema,
  complianceSecurityAssumptions: z.array(z.string()).min(1),
  approvalStatus: RequirementBriefApprovalStatusSchema,
  unresolvedQuestions: z.array(z.string()),
});

export type RequirementBriefApprovalStatus = z.infer<typeof RequirementBriefApprovalStatusSchema>;
export type RequirementBriefContract = z.infer<typeof RequirementBriefContractSchema>;
export type TokenStandardPreference = z.infer<typeof TokenStandardPreferenceSchema>;

function enabledModules(modules: ServicingModule[]) {
  return modules.filter((module) => module.enabled);
}

function inferTokenStandardPreference(modules: ServicingModule[]): TokenStandardPreference {
  return modules.some((module) => module.id === 'erc20-base' && module.enabled) ? 'ERC-20' : 'undecided';
}

function inferValuationCadence(modules: ServicingModule[]) {
  return modules.some((module) => module.id === 'nav-oracle' && module.enabled)
    ? 'NAV/performance update cadence to be confirmed before testnet deployment.'
    : 'Valuation and performance update cadence to be confirmed in a later track.';
}

export function toRequirementBriefContract(
  brief: RequirementBrief,
  approvalStatus: RequirementBriefApprovalStatus = 'ready_for_approval',
): RequirementBriefContract {
  const parsedBrief = RequirementBriefSchema.parse(brief);
  const selectedServicingModules = enabledModules(parsedBrief.modules);
  const walletWhitelistRequired = selectedServicingModules.some((module) => module.id === 'whitelist');
  const tokenStandardPreference = inferTokenStandardPreference(parsedBrief.modules);
  const complianceSecurityAssumptions = [
    ...parsedBrief.complianceAssumptions,
    ...parsedBrief.securityConstraints,
  ];

  return RequirementBriefContractSchema.parse({
    id: `requirement-contract-${parsedBrief.id}`,
    createdAt: parsedBrief.createdAt,
    sourceBriefId: parsedBrief.id,
    projectName: parsedBrief.fundFacts.fundName,
    assetProfile: parsedBrief.fundFacts,
    tokenModel: {
      standardPreference: tokenStandardPreference,
      assumption:
        tokenStandardPreference === 'ERC-20'
          ? 'ERC-20 fund token base selected for the current beta scaffold.'
          : 'Token standard remains undecided until a future requirement track selects it.',
    },
    investorAccess: {
      walletWhitelistRequired,
      assumptions: walletWhitelistRequired
        ? ['Wallet whitelist / investor access module is selected for the current MVP brief.']
        : ['Investor access rules must be confirmed before any future deployment path.'],
    },
    valuationPolicy: {
      cadence: inferValuationCadence(parsedBrief.modules),
      assumptions: ['Valuation and performance inputs remain deterministic MVP assumptions until a later data track.'],
    },
    selectedServicingModules,
    networkBoundary: 'ethereum-testnet-only',
    deploymentBoundary: {
      currentTarget: parsedBrief.deploymentTarget,
      signing: 'user-wallet-signs',
    },
    backendCustodyBoundary: 'backend-holds-no-private-keys',
    complianceSecurityAssumptions,
    approvalStatus,
    unresolvedQuestions: parsedBrief.unresolvedQuestions,
  });
}
