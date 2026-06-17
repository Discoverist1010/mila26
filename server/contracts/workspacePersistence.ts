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
    subscriptionCadence: z.string().trim().min(1).max(80).optional(),
    subscriptionWindow: z.string().trim().min(1).max(240).optional(),
    minimumSubscriptionAmount: z.string().trim().min(1).max(80).optional(),
    paymentAddress: z.string().trim().min(1).max(80).optional(),
    paymentPerToken: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const RedemptionParametersPersistenceSchema = z
  .object({
    redemptionCadence: z.string().trim().min(1).max(80).optional(),
    redemptionWindow: z.string().trim().min(1).max(240).optional(),
    redemptionPayoutCadence: z.string().trim().min(1).max(80).optional(),
    redemptionDelayUnit: z.enum(['minutes', 'hours', 'days']).optional(),
    redemptionDelayValue: z.number().finite().positive().optional(),
    redemptionWalletAddress: z.string().trim().min(1).max(80).optional(),
    payoutStablecoin: z.string().trim().min(1).max(24).optional(),
    payoutPerToken: z.string().trim().min(1).max(80).optional(),
    redemptionHandlingRule: z.string().trim().min(1).max(240).optional(),
  })
  .strict();

export const AssetServicingParametersPersistenceSchema = z
  .object({
    navCadence: z.string().trim().min(1).max(120).optional(),
    navSource: z.string().trim().min(1).max(240).optional(),
    incomePayoutCadence: z.string().trim().min(1).max(80).optional(),
    investorUpdateRule: z.string().trim().min(1).max(240).optional(),
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

const ProductSetupFieldKeyPersistenceSchema = z.enum([
  'product_name',
  'token_symbol',
  'product_launch_date',
  'product_wrapper',
  'underlying_asset_class',
  'product_structure',
  'offering_type',
  'eligible_investor_type',
  'maximum_investor_count',
  'distribution_jurisdiction',
  'issuer_owner',
  'product_type',
  'base_currency',
  'income_treatment',
  'protocol_base',
  'expected_investor_count',
  'investor_wallet_rule',
  'whitelisted_wallets_required',
  'subscription_cadence',
  'subscription_payment_method',
  'subscription_stablecoins',
  'subscription_receiving_wallet',
  'redemption_cadence',
  'redemption_payment_method',
  'redemption_stablecoin_type',
  'redemption_schedule',
  'redemption_payout_delay',
  'income_payout_cadence',
  'redemption_payout_cadence',
  'minimum_redemption_amount',
  'p2p_transfer_allowed',
  'compliance_model',
  'evidence_model',
  'duration_months',
  'derived_maturity_date',
  'maturity_description',
  'redemption_wallet',
  'admin_wallet',
  'burn_lock_rule',
  'nav_cadence',
  'nav_upload_method',
  'nav_source',
  'investor_update_rule',
  'initial_distribution_date',
  'initial_investor_register_rule',
  'maturity_date',
  'maturity_closeout_rule',
  'prototype_network',
]);

const ProductSetupFieldStatusPersistenceSchema = z.enum([
  'missing',
  'inferred',
  'user_stated',
  'user_confirmed',
  'system_default',
  'conflicting',
  'deferred',
  'locked',
]);

const ProductSetupFieldSourceTypePersistenceSchema = z.enum([
  'user_message',
  'pasted_text',
  'uploaded_document',
  'assistant_inference',
  'system_default',
  'user_confirmation',
  'direct_form_input',
  'counsel_compliance_pending',
  'blockchain_transaction',
  'app_event',
]);

const ProductSetupFieldValuePersistenceSchema = z.union([
  z.string().max(600),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().min(1).max(120)).max(20),
]);

const ProductSetupFieldPersistenceSchema = z
  .object({
    key: ProductSetupFieldKeyPersistenceSchema,
    label: z.string().trim().min(1).max(120),
    value: ProductSetupFieldValuePersistenceSchema.optional(),
    status: ProductSetupFieldStatusPersistenceSchema,
    sourceType: ProductSetupFieldSourceTypePersistenceSchema.optional(),
    sourceRef: z.string().trim().min(1).max(180).optional(),
    confidence: z.number().finite().min(0).max(1).optional(),
    confirmedByUser: z.boolean(),
    needsCounselComplianceConfirmation: z.boolean().optional(),
    usedByTabs: z.array(z.string().trim().min(1).max(80)).max(12),
    smartContractRelevance: z.enum(['contract_parameter', 'operational_metadata', 'evidence_metadata']),
    deferralReason: z.string().trim().min(1).max(240).optional(),
    rolePlaceholder: z.string().trim().min(1).max(160).optional(),
  })
  .strict();

function defaultProductSetupField(input: {
  key: z.infer<typeof ProductSetupFieldKeyPersistenceSchema>;
  label: string;
  value?: z.infer<typeof ProductSetupFieldValuePersistenceSchema>;
  status?: z.infer<typeof ProductSetupFieldStatusPersistenceSchema>;
  sourceType?: z.infer<typeof ProductSetupFieldSourceTypePersistenceSchema>;
  sourceRef?: string;
  confidence?: number;
  usedByTabs: string[];
  smartContractRelevance: 'contract_parameter' | 'operational_metadata' | 'evidence_metadata';
}) {
  return {
    key: input.key,
    label: input.label,
    value: input.value,
    status: input.status ?? 'missing',
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    confidence: input.confidence,
    confirmedByUser: false,
    usedByTabs: input.usedByTabs,
    smartContractRelevance: input.smartContractRelevance,
  };
}

const ProductSetupFieldsPersistenceSchema = z
  .object({
    product_name: ProductSetupFieldPersistenceSchema,
    token_symbol: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'token_symbol',
        label: 'Product short name',
        usedByTabs: ['Overview', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
    ),
    product_launch_date: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'product_launch_date',
        label: 'Product launch date',
        usedByTabs: ['Product Setup', 'Subscription', 'Investor Wallets', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    product_wrapper: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'product_wrapper',
        label: 'Product wrapper',
        usedByTabs: ['Product Setup', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    underlying_asset_class: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'underlying_asset_class',
        label: 'Underlying asset class',
        usedByTabs: ['Product Setup', 'Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    product_structure: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'product_structure',
        label: 'Product structure',
        usedByTabs: ['Product Setup', 'Subscription', 'Redemption', 'Maturity'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    offering_type: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'offering_type',
        label: 'Offering type',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    eligible_investor_type: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'eligible_investor_type',
        label: 'Eligible investor type',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    maximum_investor_count: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'maximum_investor_count',
        label: 'Maximum number of investors',
        value: 50,
        status: 'system_default',
        sourceType: 'system_default',
        sourceRef: 'mvp_investor_cap',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
    ),
    distribution_jurisdiction: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'distribution_jurisdiction',
        label: 'Distribution jurisdiction',
        value: 'Singapore',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_singapore_only',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
    ),
    issuer_owner: ProductSetupFieldPersistenceSchema,
    product_type: ProductSetupFieldPersistenceSchema,
    base_currency: ProductSetupFieldPersistenceSchema,
    income_treatment: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'income_treatment',
        label: 'Income treatment',
        usedByTabs: ['Product Setup', 'Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    protocol_base: ProductSetupFieldPersistenceSchema,
    expected_investor_count: ProductSetupFieldPersistenceSchema,
    investor_wallet_rule: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'investor_wallet_rule',
        label: 'Investor wallet rule',
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Redemption'],
        smartContractRelevance: 'contract_parameter',
      }),
    ),
    whitelisted_wallets_required: ProductSetupFieldPersistenceSchema,
    subscription_cadence: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'subscription_cadence',
        label: 'Subscription / mint cadence',
        usedByTabs: ['Subscription', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    subscription_payment_method: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'subscription_payment_method',
        label: 'Subscription payment method',
        usedByTabs: ['Subscription', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    subscription_stablecoins: ProductSetupFieldPersistenceSchema,
    subscription_receiving_wallet: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'subscription_receiving_wallet',
        label: 'Subscription receiving wallet',
        usedByTabs: ['Subscription', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
    ),
    redemption_cadence: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'redemption_cadence',
        label: 'Redemption / burn cadence',
        usedByTabs: ['Redemption', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    redemption_payment_method: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'redemption_payment_method',
        label: 'Redemption payment method',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    redemption_stablecoin_type: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'redemption_stablecoin_type',
        label: 'Redemption stablecoin type',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    redemption_schedule: ProductSetupFieldPersistenceSchema,
    redemption_payout_delay: ProductSetupFieldPersistenceSchema,
    income_payout_cadence: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'income_payout_cadence',
        label: 'Income payout cadence',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    redemption_payout_cadence: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'redemption_payout_cadence',
        label: 'Redemption payout cadence',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    minimum_redemption_amount: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'minimum_redemption_amount',
        label: 'Minimum redemption amount',
        value: '1 token',
        status: 'system_default',
        sourceType: 'system_default',
        sourceRef: 'mvp_default_minimum_redemption',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    p2p_transfer_allowed: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'p2p_transfer_allowed',
        label: 'P2P transfer allowed',
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
    ),
    compliance_model: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'compliance_model',
        label: 'Compliance model',
        value: 'Whitelist-based transfer restrictions',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_compliance_model',
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
    ),
    evidence_model: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'evidence_model',
        label: 'Evidence model',
        value: 'Store PRD, approvals, transaction hashes, generated artefacts, and version history',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_evidence_model',
        usedByTabs: ['Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
    ),
    duration_months: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'duration_months',
        label: 'Duration of product in months',
        usedByTabs: ['Product Setup', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    derived_maturity_date: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'derived_maturity_date',
        label: 'Derived maturity date',
        usedByTabs: ['Product Setup', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    maturity_description: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'maturity_description',
        label: 'Maturity description',
        value:
          'Maturity date is the product termination / final redemption date. On maturity, transfers are paused for the token, outstanding tokens move through the approved maturity redemption process, and fiat payout is processed offchain unless another approved payout method is selected.',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_maturity_description',
        usedByTabs: ['Product Setup', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    redemption_wallet: ProductSetupFieldPersistenceSchema,
    admin_wallet: ProductSetupFieldPersistenceSchema,
    burn_lock_rule: ProductSetupFieldPersistenceSchema,
    nav_cadence: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'nav_cadence',
        label: 'NAV cadence',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    nav_upload_method: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'nav_upload_method',
        label: 'NAV upload method',
        value: 'CSV',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_csv_only_nav_upload',
        usedByTabs: ['Product Setup', 'Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
    ),
    nav_source: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'nav_source',
        label: 'NAV source',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
    ),
    investor_update_rule: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'investor_update_rule',
        label: 'Investor update rule',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    initial_distribution_date: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'initial_distribution_date',
        label: 'Initial distribution date',
        usedByTabs: ['Product Setup', 'Subscription', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    initial_investor_register_rule: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'initial_investor_register_rule',
        label: 'Initial investor register',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    maturity_date: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'maturity_date',
        label: 'Maturity / term',
        usedByTabs: ['Maturity', 'Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    maturity_closeout_rule: ProductSetupFieldPersistenceSchema.default(() =>
      defaultProductSetupField({
        key: 'maturity_closeout_rule',
        label: 'Maturity closeout rule',
        usedByTabs: ['Maturity', 'Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
    ),
    prototype_network: ProductSetupFieldPersistenceSchema,
  })
  .strict();

const ProductSetupSuggestedUpdatePersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(220),
    fieldKey: ProductSetupFieldKeyPersistenceSchema,
    proposedValue: ProductSetupFieldValuePersistenceSchema,
    rationale: z.string().trim().min(1).max(500),
    sourceType: ProductSetupFieldSourceTypePersistenceSchema,
    sourceRef: z.string().trim().min(1).max(180),
    confidence: z.number().finite().min(0).max(1),
  })
  .strict();

const TermExplanationPersistenceSchema = z
  .object({
    termKey: z.string().trim().min(1).max(120),
    explainedAt: z.string().trim().min(1).max(80),
    explanationVersion: z.string().trim().min(1).max(80),
    userAcknowledged: z.boolean().optional(),
    timesShown: z.number().int().nonnegative(),
  })
  .strict();

const UnsupportedRequirementDecisionPersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(180),
    requirement: z.string().trim().min(1).max(600),
    mismatchReason: z.string().trim().min(1).max(600),
    nearestEquivalent: z.string().trim().min(1).max(600).optional(),
    decision: z.enum(['pending', 'accepted_equivalent', 'rejected_equivalent', 'excluded_from_mvp']),
    sourceRef: z.string().trim().min(1).max(180),
  })
  .strict();

const ProductSetupDeploymentWarningAcknowledgementPersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(180),
    acknowledgedAtIso: z.string().trim().min(1).max(80),
    warningFieldKeys: z.array(ProductSetupFieldKeyPersistenceSchema).max(20),
    likelyErrors: z.array(z.string().trim().min(1).max(400)).max(20),
    decision: z.literal('proceed_with_warnings'),
    sourceRef: z.string().trim().min(1).max(180),
  })
  .strict();

const ProductSetupHandoffSuggestionPersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(220),
    sourceFieldKey: ProductSetupFieldKeyPersistenceSchema,
    targetFieldKey: z.string().trim().min(1).max(120).optional(),
    label: z.string().trim().min(1).max(160),
    value: ProductSetupFieldValuePersistenceSchema,
    valueLabel: z.string().trim().min(1).max(800),
    provenanceLabel: z.enum(['Stated', 'Assumed', 'Inferred', 'Needs review']),
    status: z.enum(['pending', 'applied_in_target_tab', 'dismissed_in_target_tab']),
    appliedAtIso: z.string().trim().min(1).max(80).optional(),
    dismissedAtIso: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

const ProductSetupHandoffNotePersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(180),
    target: z.enum(['investor_wallets', 'subscription', 'contract_ops', 'asset_servicing', 'redemption', 'maturity']),
    title: z.string().trim().min(1).max(180),
    detail: z.string().trim().min(1).max(1000),
    sourceFieldKeys: z.array(ProductSetupFieldKeyPersistenceSchema).min(1).max(12),
    suggestions: z.array(ProductSetupHandoffSuggestionPersistenceSchema).max(12).default([]),
    sourceRef: z.string().trim().min(1).max(180),
    status: z.enum(['draft_note_ready', 'needs_clarification', 'sent_as_draft_note', 'reviewed_in_target_tab']),
    createdAtIso: z.string().trim().min(1).max(80),
    sentAtIso: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const ProductSetupRecordPersistenceSchema = z
  .object({
    id: z.string().trim().min(1).max(160),
    status: z.enum(['draft', 'ready_for_engineering', 'locked']),
    fields: ProductSetupFieldsPersistenceSchema,
    pendingSuggestedUpdates: z.array(ProductSetupSuggestedUpdatePersistenceSchema).max(40),
    termExplanations: z.record(z.string().trim().min(1).max(120), TermExplanationPersistenceSchema),
    unsupportedRequirementDecisions: z.array(UnsupportedRequirementDecisionPersistenceSchema).max(40),
    deploymentWarningAcknowledgements: z.array(ProductSetupDeploymentWarningAcknowledgementPersistenceSchema).max(40).default([]),
    downstreamHandoffNotes: z.array(ProductSetupHandoffNotePersistenceSchema).max(40).default([]),
    updatedAtIso: z.string().trim().min(1).max(80),
  })
  .strict();

export const Mila26LifecycleStatePersistenceSchema = z
  .object({
    investorRegistryEntries: z.array(InvestorRegistryEntryPersistenceSchema).max(50),
    subscriptionParameters: SubscriptionParametersPersistenceSchema,
    redemptionParameters: RedemptionParametersPersistenceSchema,
    assetServicingParameters: AssetServicingParametersPersistenceSchema.default({}),
    maturityParameters: MaturityParametersPersistenceSchema,
    allocationMintParameters: AllocationMintParametersPersistenceSchema,
  })
  .strict();

export const WorkspacePersistenceSaveRequestSchema = z
  .object({
    projectId: WorkspaceProjectIdSchema,
    projectName: z.string().trim().min(1).max(160),
    lifecycleState: Mila26LifecycleStatePersistenceSchema,
    productSetupRecord: ProductSetupRecordPersistenceSchema.optional(),
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

const ProductSetupPackArtifactRecordSchema = z
  .object({
    artifactType: z.literal('product_setup_pack'),
    artifactPayload: z
      .object({
        recordId: z.string().trim().min(1).max(160),
        artifactId: z.string().trim().min(1).max(220).optional(),
        versionLabel: z.string().trim().min(1).max(40).optional(),
        displayVersion: z.string().trim().min(1).max(80).optional(),
        generatedAtIso: z.string().trim().min(1).max(80),
        packStatus: z.string().trim().min(1).max(80).optional(),
        warning: z.string().trim().min(1).max(800),
        statusLabel: z.string().trim().min(1).max(160),
        readinessLabel: z.string().trim().min(1).max(160),
        recommendedArchitectureTarget: z.enum(['ERC-20', 'Customised ERC-20', 'ERC-3643']),
        currentExecutablePrototype: z.string().trim().min(1).max(420),
        definitions: z.array(z.string().trim().min(1).max(420)).min(1).max(20),
        profileRows: z
          .array(
            z
              .object({
                id: z.string().trim().min(1).max(120),
                label: z.string().trim().min(1).max(160),
                value: z.string().trim().min(1).max(800),
                provenanceLabel: z.enum(['Stated', 'Assumed', 'Inferred', 'Needs review', 'Missing']),
                fieldKeys: z.array(ProductSetupFieldKeyPersistenceSchema).min(1).max(12),
                whyItMatters: z.string().trim().min(1).max(500).optional(),
              })
              .strict(),
          )
          .max(80),
        downstreamHandoffs: z.array(ProductSetupHandoffNotePersistenceSchema).max(40),
        fields: z
          .array(
            z
              .object({
                requirement: z.string().trim().min(1).max(160),
                userInput: z.string().trim().min(1).max(800),
                interpretation: z.string().trim().min(1).max(800),
                source: z.string().trim().min(1).max(120),
                status: ProductSetupFieldStatusPersistenceSchema,
                usedByTabs: z.array(z.string().trim().min(1).max(80)).max(12),
              })
              .strict(),
          )
          .min(1)
          .max(80),
        deploymentWarnings: z
          .array(
            z
              .object({
                fieldKey: ProductSetupFieldKeyPersistenceSchema,
                label: z.string().trim().min(1).max(120),
                message: z.string().trim().min(1).max(360),
                likelyError: z.string().trim().min(1).max(420),
                status: ProductSetupFieldStatusPersistenceSchema,
              })
              .strict(),
          )
          .max(20),
        deploymentWarningAcknowledgements: z.array(ProductSetupDeploymentWarningAcknowledgementPersistenceSchema).max(40),
        unsupportedRequirementDecisions: z.array(UnsupportedRequirementDecisionPersistenceSchema).max(40),
      })
      .strict(),
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
  ProductSetupPackArtifactRecordSchema,
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
export type ProductSetupRecordPersistence = z.infer<typeof ProductSetupRecordPersistenceSchema>;
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
  productSetupRecord?: ProductSetupRecordPersistence;
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
