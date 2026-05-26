import { z } from 'zod';
import { SmartContractArtifactSpecSchema, TokenStandardProfileSchema } from './smartContractArtifactSpec';

export const SmartContractArtifactRequestSchema = z
  .object({
    smartContractArtifactSpec: SmartContractArtifactSpecSchema,
  })
  .strict();

export const SmartContractArtifactPackageSchema = z.object({
  artifactId: z.string().min(1),
  specId: z.string().min(1),
  projectId: z.string().min(1),
  projectName: z.string().min(1),
  status: z.enum(['generated', 'blocked']),
  generatedFrom: z.object({
    specId: z.string().min(1),
    tokenStandardProfile: TokenStandardProfileSchema.pick({
      baseStandardCompatibility: true,
      mila26RestrictionProfile: true,
      recommendedProfile: true,
    }),
  }),
  sourceModel: z.object({
    language: z.literal('solidity'),
    compilerToolchainStatus: z.literal('not_configured'),
    openZeppelinPackageStatus: z.literal('not_installed'),
    sourceKind: z.enum(['deterministic_preview', 'template_backed_preview']),
    sourceFiles: z
      .array(
        z.object({
          path: z.string().min(1),
          role: z.enum(['primary_contract', 'interface', 'library_placeholder']),
          contentPreview: z.string().min(1).optional(),
          contentHash: z.string().min(1).optional(),
        }),
      )
      .min(1),
  }),
  implementedSpecSummary: z.object({
    standardFunctions: z.array(z.string().min(1)),
    standardEvents: z.array(z.string().min(1)),
    customEvents: z.array(z.string().min(1)),
    accessControlFeatures: z.array(z.string().min(1)),
    walletRestrictionFeatures: z.array(z.string().min(1)),
    valuationFeatures: z.array(z.string().min(1)),
    distributionFeatures: z.array(z.string().min(1)),
    pauseFeatures: z.array(z.string().min(1)),
  }),
  implementationNotes: z.array(z.string().min(1)),
  blockedReasons: z.array(z.string().min(1)),
  metadata: z.object({
    generatedAt: z.string().min(1),
    generator: z.literal('deterministic_9b_artifact_generator'),
    version: z.string().min(1),
  }),
});

const CheckItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(['passed', 'failed', 'blocked', 'not_applicable']),
  detail: z.string().min(1),
  evidenceRef: z.string().min(1).optional(),
});

export const SmartContractArtifactCheckResultSchema = z.object({
  checkId: z.string().min(1),
  artifactId: z.string().min(1),
  specId: z.string().min(1),
  status: z.enum(['passed', 'failed', 'blocked']),
  checkMode: z.enum(['spec_consistency', 'deterministic_static_review', 'compiler_not_configured']),
  summary: z.string().min(1),
  checks: z.array(CheckItemSchema).min(1),
  boundaryChecks: z.object({
    testnetOnly: z.boolean(),
    mainnetDisabled: z.boolean(),
    backendPrivateKeyCustodyDisabled: z.boolean(),
    userWalletSignsFutureDeployment: z.boolean(),
    deploymentNotExecuted: z.boolean(),
    compilerNotConfigured: z.boolean(),
  }),
  blockedReasons: z.array(z.string().min(1)),
  metadata: z.object({
    generatedAt: z.string().min(1),
    generator: z.literal('deterministic_9b_check_generator'),
    version: z.string().min(1),
  }),
});

export const SmartContractEvidenceLiteSchema = z.object({
  evidenceId: z.string().min(1),
  artifactId: z.string().min(1),
  specId: z.string().min(1),
  checkId: z.string().min(1),
  status: z.enum(['ready', 'blocked']),
  evidenceItems: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        source: z.enum([
          'smart_contract_artifact_spec',
          'contract_artifact_package',
          'artifact_check_result',
          'event_to_evidence_mapping',
        ]),
        detail: z.string().min(1),
      }),
    )
    .min(1),
  eventEvidenceRefs: z
    .array(
      z.object({
        eventName: z.string().min(1),
        evidencePurpose: z.string().min(1),
        sourceSpecRef: z.string().min(1),
      }),
    )
    .min(1),
  safetyEvidenceRefs: z
    .array(
      z.object({
        boundary: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(1),
  metadata: z.object({
    generatedAt: z.string().min(1),
    generator: z.literal('deterministic_9b_evidence_lite_generator'),
    version: z.string().min(1),
  }),
});

export const SmartContractArtifactResponseSchema = z.object({
  artifactPackage: SmartContractArtifactPackageSchema,
  checkResult: SmartContractArtifactCheckResultSchema,
  evidenceLite: SmartContractEvidenceLiteSchema,
});

export type SmartContractArtifactRequest = z.infer<typeof SmartContractArtifactRequestSchema>;
export type SmartContractArtifactPackage = z.infer<typeof SmartContractArtifactPackageSchema>;
export type SmartContractArtifactCheckResult = z.infer<typeof SmartContractArtifactCheckResultSchema>;
export type SmartContractEvidenceLite = z.infer<typeof SmartContractEvidenceLiteSchema>;
export type SmartContractArtifactResponse = z.infer<typeof SmartContractArtifactResponseSchema>;
