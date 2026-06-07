import { z } from 'zod';

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

export type Mila26LifecycleStatePersistence = z.infer<typeof Mila26LifecycleStatePersistenceSchema>;
export type WorkspacePersistenceSaveRequest = z.infer<typeof WorkspacePersistenceSaveRequestSchema>;
export type WorkspacePersistenceLoadRequest = z.infer<typeof WorkspacePersistenceLoadRequestSchema>;

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
