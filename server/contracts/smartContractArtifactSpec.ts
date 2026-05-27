import { z } from 'zod';
import { EngineeringBriefRequirementBriefSchema, EngineeringBriefSchema } from './engineeringBrief';

export const SmartContractArtifactSpecClosureReadinessSchema = z.object({
  status: z.enum(['not_started', 'open', 'blocked', 'ready']),
  readinessLabel: z.string().min(1),
  blockedReasons: z.array(z.string().min(1)).default([]),
  closureLedgerId: z.string().min(1).optional(),
  openItemCount: z.number().int().nonnegative().optional(),
  blockingOpenItemCount: z.number().int().nonnegative().optional(),
  blockedCheckCount: z.number().int().nonnegative().optional(),
});

export const SmartContractArtifactSpecRequestSchema = z.object({
  requirementBrief: EngineeringBriefRequirementBriefSchema.optional(),
  engineeringBrief: EngineeringBriefSchema,
  closureReadiness: SmartContractArtifactSpecClosureReadinessSchema,
}).strict();

export const TokenStandardProfileSchema = z.object({
  baseStandardCompatibility: z.literal('erc20'),
  mila26RestrictionProfile: z.literal('restricted_erc20'),
  recommendedProfile: z.literal('restricted_erc20'),
  rationale: z.string().min(1),
  minimumRequiredFunctions: z.array(z.string().min(1)).min(1),
  minimumRequiredEvents: z.array(z.string().min(1)).min(1),
  openZeppelinAssumptions: z.object({
    useOpenZeppelinContracts: z.literal(true),
    baseContracts: z.array(z.string().min(1)).min(1),
    extensions: z.array(z.string().min(1)),
    exactPackageVersionDeferredTo: z.literal('track_9b_or_9b_2'),
  }),
  customEvents: z
    .array(
      z.object({
        name: z.string().min(1),
        purpose: z.string().min(1),
        required: z.boolean(),
        suggestedParameters: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
  compatibilityNotes: z.array(z.string().min(1)).min(1),
});

export const SmartContractArtifactSpecSchema = z.object({
  specId: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  status: z.enum(['draft', 'ready', 'blocked']),
  generatedFrom: z.object({
    requirementBriefId: z.string().min(1).optional(),
    engineeringBriefId: z.string().min(1).optional(),
    closureLedgerId: z.string().min(1).optional(),
  }),
  tokenStandardProfile: TokenStandardProfileSchema,
  contractModel: z.object({
    projectLabel: z.string().min(1),
    fundName: z.string().min(1),
    tokenName: z.string().min(1),
    tokenSymbol: z.string().min(1),
    decimalsAssumption: z.number().int().min(0).max(18),
    supplyModel: z.string().min(1),
    mintingModel: z.string().min(1),
    issuerControlledAllocations: z.boolean(),
    transferRestrictionsEnabled: z.boolean(),
    valuationUpdateModel: z.enum(['event_only', 'stateful', 'deferred']),
    distributionModel: z.enum(['event_only', 'stateful', 'deferred']),
  }),
  accessControl: z.object({
    ownerRole: z.string().min(1),
    adminRole: z.string().min(1),
    issuerRole: z.string().min(1),
    mintingRole: z.string().min(1),
    whitelistRole: z.string().min(1),
    valuationUpdaterRole: z.string().min(1),
    distributionRecorderRole: z.string().min(1),
    pauserRole: z.string().min(1),
    backendPrivateKeyCustody: z.literal(false),
  }),
  walletPolicy: z.object({
    whitelistRequired: z.boolean(),
    expectedWhitelistedWalletCount: z.number().int().positive().optional(),
    transferPolicy: z.string().min(1),
    investorWalletCustody: z.literal('user_or_investor_wallets_only'),
    deploymentSigning: z.literal('user-wallet-signs'),
  }),
  valuationPolicy: z.object({
    cadence: z.string().min(1),
    updateModel: z.enum(['manual_upload', 'api_upload_deferred', 'deferred']),
    eventRequirements: z.array(z.string().min(1)).min(1),
    evidenceRequirements: z.array(z.string().min(1)).min(1),
  }),
  distributionPolicy: z.object({
    movementScope: z.literal('event_and_evidence_only'),
    eventRequirements: z.array(z.string().min(1)).min(1),
    evidenceRequirements: z.array(z.string().min(1)).min(1),
  }),
  eventModel: z.object({
    standardEvents: z.array(z.string().min(1)).min(1),
    customEvents: z.array(z.string().min(1)).min(1),
    eventToEvidenceMapping: z
      .array(
        z.object({
          eventName: z.string().min(1),
          evidenceUse: z.string().min(1),
          scpSurface: z.string().min(1),
        }),
      )
      .min(1),
    signatureNotes: z.string().min(1),
  }),
  safetyBoundary: z.object({
    network: z.literal('ethereum-testnet-only'),
    mainnetDisabled: z.literal(true),
    backendCustody: z.literal('backend-holds-no-private-keys'),
    deploymentSigning: z.literal('user-wallet-signs'),
    deploymentRequiresChecksEvidenceAndGate: z.literal(true),
    productionLegalComplianceAdvice: z.literal(false),
    realInvestorOnboardingInMvp: z.literal(false),
  }),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  blockedReasons: z.array(z.string().min(1)),
  metadata: z.object({
    generatedAt: z.string().min(1),
    generator: z.literal('deterministic_9a_spec_generator'),
    version: z.string().min(1),
  }),
});

export type SmartContractArtifactSpecClosureReadiness = z.infer<typeof SmartContractArtifactSpecClosureReadinessSchema>;
export type SmartContractArtifactSpecRequest = z.infer<typeof SmartContractArtifactSpecRequestSchema>;
export type TokenStandardProfile = z.infer<typeof TokenStandardProfileSchema>;
export type SmartContractArtifactSpec = z.infer<typeof SmartContractArtifactSpecSchema>;
