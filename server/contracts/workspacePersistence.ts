import { z } from 'zod';
import { EngineeringBriefRequirementBriefSchema, EngineeringBriefSchema } from './engineeringBrief';
import {
  SmartContractArtifactCheckResultSchema,
  SmartContractArtifactPackageSchema,
  SmartContractEvidenceLiteSchema,
} from './smartContractArtifact';
import { SmartContractArtifactSpecSchema } from './smartContractArtifactSpec';

export const WorkspaceProjectIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Project id must use only letters, numbers, underscores, or hyphens.');

export const InvestorRegistryEntryPersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(120),
    label: z.string().trim().min(1).max(120).optional(),
    walletAddress: z.string().trim().min(1).max(80),
    status: z.enum(['draft', 'ready_to_whitelist', 'whitelisted_local_session_only']),
    source: z.enum(['manual', 'generated_test_wallet']).optional(),
  })
  .strict();

export const SubscriptionParametersPersistenceSchema = z
  .object({
    permittedStablecoins: z.array(z.string().trim().min(1).max(24)).max(10),
    subscriptionWindow: z.string().trim().min(1).max(240).optional(),
    minimumSubscriptionAmount: z.string().trim().min(1).max(80).optional(),
    paymentAddress: z.string().trim().min(1).max(80).optional(),
    paymentPerToken: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const RedemptionParametersPersistenceSchema = z
  .object({
    redemptionWindow: z.string().trim().min(1).max(240).optional(),
    redemptionDelayUnit: z.enum(['minutes', 'hours', 'days']).optional(),
    redemptionDelayValue: z.number().finite().positive().optional(),
    redemptionWalletAddress: z.string().trim().min(1).max(80).optional(),
    payoutStablecoin: z.string().trim().min(1).max(24).optional(),
    payoutPerToken: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const MaturityParametersPersistenceSchema = z
  .object({
    maturityDate: z.string().trim().min(1).max(80).optional(),
    closeoutMethod: z.string().trim().min(1).max(240).optional(),
  })
  .strict();

export const AllocationMintParametersPersistenceSchema = z
  .object({
    targetWalletAddress: z.string().trim().min(1).max(80).optional(),
    tokenAmount: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const Mila26LifecycleStatePersistenceSchema = z
  .object({
    investorRegistryEntries: z.array(InvestorRegistryEntryPersistenceSchema).max(50),
    subscriptionParameters: SubscriptionParametersPersistenceSchema,
    redemptionParameters: RedemptionParametersPersistenceSchema,
    maturityParameters: MaturityParametersPersistenceSchema,
    allocationMintParameters: AllocationMintParametersPersistenceSchema,
  })
  .strict();

export const WorkspacePersistenceSaveRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
    projectName: z.string().trim().min(1).max(160),
    lifecycleState: Mila26LifecycleStatePersistenceSchema,
    source: z.enum(['user_action', 'autosave', 'import']).default('user_action'),
  })
  .strict();

export const WorkspacePersistenceLoadRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
  })
  .strict();

const EvmTransactionHashSchema = z.string().trim().regex(/^0x[0-9a-fA-F]{64}$/, 'Transaction hash must be a 32-byte hex string.');
const EvmAddressSchema = z.string().trim().regex(/^0x[0-9a-fA-F]{40}$/, 'Wallet or contract address must be a 20-byte hex string.');

export const WorkspaceEvidenceRecordInputSchema = z
  .object({
    evidenceType: z.enum(['deployment', 'record_nav', 'wallet_whitelist', 'allocation_mint']),
    sourcePersistence: z.literal('local_session_only'),
    sourceAttemptId: z.string().trim().min(1).max(160).optional(),
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
    status: z.enum(['submitted', 'confirmed', 'failed']),
    chainId: z.literal(11155111),
    networkName: z.literal('Sepolia'),
    transactionHash: EvmTransactionHashSchema,
    transactionHashSource: z.literal('provider_returned'),
    receiptSource: z.enum(['provider_receipt', 'absent']),
    receiptStatus: z.enum(['pending', 'success', 'failed']).optional(),
    contractAddress: EvmAddressSchema.optional(),
    contractAddressSource: z.enum(['receipt_returned', 'confirmed_deployment_evidence', 'absent']),
    eventEvidenceSource: z.enum(['decoded_from_receipt', 'receipt_confirmed', 'absent']).default('absent'),
    eventName: z.enum(['ValuationUpdated', 'WalletWhitelisted', 'AllocationMinted']).optional(),
    targetWalletAddress: EvmAddressSchema.optional(),
    valuation: z.string().trim().min(1).max(80).optional(),
    valuationReference: z.string().trim().min(1).max(160).optional(),
    tokenAmount: z.string().trim().min(1).max(80).optional(),
    tokenAmountUnits: z.string().trim().min(1).max(120).optional(),
    artifactPackageId: z.string().trim().min(1).max(160).optional(),
    compileCheckId: z.string().trim().min(1).max(160).optional(),
  })
  .strict()
  .superRefine((record, ctx) => {
    if (record.status === 'confirmed' && record.receiptStatus !== 'success') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receiptStatus'],
        message: 'Confirmed evidence requires a successful provider receipt.',
      });
    }

    if (record.contractAddress && record.contractAddressSource === 'absent') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contractAddressSource'],
        message: 'Contract address requires an explicit source.',
      });
    }

    if (record.receiptSource === 'provider_receipt' && !record.receiptStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receiptStatus'],
        message: 'Provider receipt evidence requires a receipt status.',
      });
    }

    if (record.receiptSource === 'absent' && record.receiptStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['receiptStatus'],
        message: 'Receipt status cannot be stored when provider receipt is absent.',
      });
    }

    if (record.evidenceType === 'deployment' && record.status === 'confirmed') {
      if (!record.contractAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contractAddress'],
          message: 'Confirmed deployment evidence requires the receipt-returned contract address.',
        });
      }

      if (record.contractAddressSource !== 'receipt_returned') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['contractAddressSource'],
          message: 'Confirmed deployment contract address must be receipt-returned.',
        });
      }
    }

    if (record.evidenceType !== 'deployment' && record.contractAddress && record.contractAddressSource !== 'confirmed_deployment_evidence') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contractAddressSource'],
        message: 'Operation evidence contract address must come from confirmed deployment evidence.',
      });
    }

    if (record.evidenceType !== 'deployment' && record.status === 'confirmed' && !record.contractAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['contractAddress'],
        message: 'Confirmed operation evidence requires the deployed contract address from confirmed deployment evidence.',
      });
    }
  });

export const WorkspaceEvidenceSaveRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
    records: z.array(WorkspaceEvidenceRecordInputSchema).min(1).max(20),
  })
  .strict();

export const WorkspaceEvidenceListRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
  })
  .strict();

const RequirementBriefArtifactRecordSchema = z
  .object({
    artifactType: z.literal('requirement_brief'),
    artifactPayload: EngineeringBriefRequirementBriefSchema,
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
  })
  .strict();

const EngineeringBriefArtifactRecordSchema = z
  .object({
    artifactType: z.literal('engineering_brief'),
    artifactPayload: EngineeringBriefSchema,
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
  })
  .strict();

const SmartContractSpecArtifactRecordSchema = z
  .object({
    artifactType: z.literal('smart_contract_spec'),
    artifactPayload: SmartContractArtifactSpecSchema,
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
  })
  .strict();

const ArtifactPreviewRecordSchema = z
  .object({
    artifactType: z.literal('artifact_preview'),
    artifactPayload: SmartContractArtifactPackageSchema,
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
  })
  .strict();

const CheckResultArtifactRecordSchema = z
  .object({
    artifactType: z.literal('check_result'),
    artifactPayload: SmartContractArtifactCheckResultSchema,
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
  })
  .strict();

const EvidenceLiteArtifactRecordSchema = z
  .object({
    artifactType: z.literal('evidence_lite'),
    artifactPayload: SmartContractEvidenceLiteSchema,
    lifecycleSnapshotVersion: z.number().int().positive().optional(),
  })
  .strict();

export const WorkspaceArtifactRecordInputSchema = z.discriminatedUnion('artifactType', [
  RequirementBriefArtifactRecordSchema,
  EngineeringBriefArtifactRecordSchema,
  SmartContractSpecArtifactRecordSchema,
  ArtifactPreviewRecordSchema,
  CheckResultArtifactRecordSchema,
  EvidenceLiteArtifactRecordSchema,
]);

export const WorkspaceArtifactsSaveRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
    records: z.array(WorkspaceArtifactRecordInputSchema).min(1).max(10),
  })
  .strict();

export const WorkspaceArtifactsListRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
  })
  .strict();

export type Mila26LifecycleStatePersistence = z.infer<typeof Mila26LifecycleStatePersistenceSchema>;
export type WorkspacePersistenceSaveRequest = z.infer<typeof WorkspacePersistenceSaveRequestSchema>;
export type WorkspacePersistenceLoadRequest = z.infer<typeof WorkspacePersistenceLoadRequestSchema>;
export type WorkspaceEvidenceRecordInput = z.infer<typeof WorkspaceEvidenceRecordInputSchema>;
export type WorkspaceEvidenceSaveRequest = z.infer<typeof WorkspaceEvidenceSaveRequestSchema>;
export type WorkspaceEvidenceListRequest = z.infer<typeof WorkspaceEvidenceListRequestSchema>;
export type WorkspaceArtifactRecordInput = z.infer<typeof WorkspaceArtifactRecordInputSchema>;
export type WorkspaceArtifactsSaveRequest = z.infer<typeof WorkspaceArtifactsSaveRequestSchema>;
export type WorkspaceArtifactsListRequest = z.infer<typeof WorkspaceArtifactsListRequestSchema>;

export type WorkspacePersistenceProject = {
  id: string;
  name: string;
  investorCap: number;
  createdAtIso: string;
  updatedAtIso: string;
};

export type WorkspacePersistenceSnapshot = {
  id: string;
  projectId: string;
  version: number;
  source: WorkspacePersistenceSaveRequest['source'];
  lifecycleState: Mila26LifecycleStatePersistence;
  investorWalletCount: number;
  createdAtIso: string;
};

export type WorkspacePersistenceInvestorWallet = {
  id: string;
  projectId: string;
  label?: string;
  walletAddress: string;
  normalizedWalletAddress: string;
  validationStatus: 'valid' | 'invalid';
  status: WorkspacePersistenceSaveRequest['lifecycleState']['investorRegistryEntries'][number]['status'];
  source: NonNullable<WorkspacePersistenceSaveRequest['lifecycleState']['investorRegistryEntries'][number]['source']>;
  createdAtIso: string;
  updatedAtIso: string;
};

export type WorkspacePersistenceRecord = {
  project: WorkspacePersistenceProject;
  snapshot: WorkspacePersistenceSnapshot;
  investorWallets: WorkspacePersistenceInvestorWallet[];
};

export type WorkspaceEvidenceRecord = WorkspaceEvidenceRecordInput & {
  id: string;
  projectId: string;
  persistence: 'durable';
  lifecycleSnapshotVersion: number;
  lifecycleContextStatus: 'current_context' | 'historical_context';
  createdAtIso: string;
  updatedAtIso: string;
};

export type WorkspaceArtifactRecord = {
  id: string;
  projectId: string;
  artifactType: WorkspaceArtifactRecordInput['artifactType'];
  artifactId: string;
  artifactStatus: string;
  lifecycleSnapshotVersion: number;
  lifecycleContextStatus: 'current_context' | 'stale_context';
  contentHash: string;
  artifactPayload: WorkspaceArtifactRecordInput['artifactPayload'];
  createdAtIso: string;
  updatedAtIso: string;
};

export type WorkspaceEvidencePersistenceRecord = {
  projectId: string;
  latestSnapshotVersion: number;
  evidenceRecords: WorkspaceEvidenceRecord[];
};

export type WorkspaceArtifactPersistenceRecord = {
  projectId: string;
  latestSnapshotVersion: number;
  artifactRecords: WorkspaceArtifactRecord[];
};
