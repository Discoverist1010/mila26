export const supportedProtocolBases = [
  'ERC-20',
  'Customised ERC-20',
  'ERC-3643',
  'ERC-4626',
] as const;

export type ProductSetupProtocolBase = (typeof supportedProtocolBases)[number];

export type ProductSetupFieldStatus =
  | 'missing'
  | 'inferred'
  | 'user_stated'
  | 'user_confirmed'
  | 'system_default'
  | 'conflicting'
  | 'deferred'
  | 'locked';

export type ProductSetupFieldSourceType =
  | 'user_message'
  | 'pasted_text'
  | 'uploaded_document'
  | 'assistant_inference'
  | 'system_default'
  | 'user_confirmation'
  | 'direct_form_input'
  | 'counsel_compliance_pending'
  | 'blockchain_transaction'
  | 'app_event';

export type ProductSetupFieldKey =
  | 'product_name'
  | 'token_symbol'
  | 'product_launch_date'
  | 'product_wrapper'
  | 'underlying_asset_class'
  | 'product_structure'
  | 'offering_type'
  | 'eligible_investor_type'
  | 'maximum_investor_count'
  | 'distribution_jurisdiction'
  | 'issuer_owner'
  | 'product_type'
  | 'base_currency'
  | 'income_treatment'
  | 'protocol_base'
  | 'expected_investor_count'
  | 'investor_wallet_rule'
  | 'whitelisted_wallets_required'
  | 'subscription_cadence'
  | 'subscription_payment_method'
  | 'subscription_stablecoins'
  | 'minimum_subscription_amount'
  | 'subscription_receiving_wallet'
  | 'redemption_cadence'
  | 'redemption_payment_method'
  | 'redemption_stablecoin_type'
  | 'redemption_schedule'
  | 'redemption_payout_delay'
  | 'income_payout_cadence'
  | 'redemption_payout_cadence'
  | 'minimum_redemption_amount'
  | 'p2p_transfer_allowed'
  | 'compliance_model'
  | 'evidence_model'
  | 'duration_months'
  | 'derived_maturity_date'
  | 'maturity_description'
  | 'redemption_wallet'
  | 'admin_wallet'
  | 'burn_lock_rule'
  | 'nav_cadence'
  | 'nav_upload_method'
  | 'nav_source'
  | 'investor_update_rule'
  | 'initial_distribution_date'
  | 'initial_investor_register_rule'
  | 'maturity_date'
  | 'maturity_closeout_rule'
  | 'prototype_network';

export type ProductSetupFieldValue = string | number | boolean | string[];

export type ProductSetupField = {
  key: ProductSetupFieldKey;
  label: string;
  value?: ProductSetupFieldValue;
  status: ProductSetupFieldStatus;
  sourceType?: ProductSetupFieldSourceType;
  sourceRef?: string;
  confidence?: number;
  confirmedByUser: boolean;
  needsCounselComplianceConfirmation?: boolean;
  usedByTabs: string[];
  smartContractRelevance: 'contract_parameter' | 'operational_metadata' | 'evidence_metadata';
  deferralReason?: string;
  rolePlaceholder?: string;
};

export type TermExplanationState = {
  termKey: string;
  explainedAt: string;
  explanationVersion: string;
  userAcknowledged?: boolean;
  timesShown: number;
};

export type ProductSetupSuggestedUpdate = {
  id: string;
  fieldKey: ProductSetupFieldKey;
  proposedValue: ProductSetupFieldValue;
  rationale: string;
  sourceType: ProductSetupFieldSourceType;
  sourceRef: string;
  confidence: number;
};

export type ProductSetupStructuredSuggestionInput = {
  field: string;
  proposedValue?: unknown;
  rationale: string;
  confidence: number;
};

export type UnsupportedRequirementDecision = {
  id: string;
  requirement: string;
  mismatchReason: string;
  nearestEquivalent?: string;
  decision: 'pending' | 'accepted_equivalent' | 'rejected_equivalent' | 'excluded_from_mvp';
  sourceRef: string;
};

export type ProductSetupDeploymentWarningAcknowledgement = {
  id: string;
  acknowledgedAtIso: string;
  warningFieldKeys: ProductSetupFieldKey[];
  likelyErrors: string[];
  decision: 'proceed_with_warnings';
  sourceRef: string;
};

export type ProductSetupHandoffTarget =
  | 'investor_wallets'
  | 'subscription'
  | 'contract_ops'
  | 'asset_servicing'
  | 'redemption'
  | 'maturity';

export type ProductSetupHandoffStatus =
  | 'draft_note_ready'
  | 'needs_clarification'
  | 'sent_as_draft_note'
  | 'reviewed_in_target_tab';

export type ProductSetupHandoffSuggestionStatus =
  | 'pending'
  | 'applied_in_target_tab'
  | 'dismissed_in_target_tab';

export type ProductSetupHandoffSuggestion = {
  id: string;
  sourceFieldKey: ProductSetupFieldKey;
  targetFieldKey?: string;
  label: string;
  value: ProductSetupFieldValue;
  valueLabel: string;
  provenanceLabel: 'Stated' | 'Assumed' | 'Inferred' | 'Needs review';
  status: ProductSetupHandoffSuggestionStatus;
  appliedAtIso?: string;
  dismissedAtIso?: string;
};

export type ProductSetupHandoffNote = {
  id: string;
  target: ProductSetupHandoffTarget;
  title: string;
  detail: string;
  sourceFieldKeys: ProductSetupFieldKey[];
  suggestions: ProductSetupHandoffSuggestion[];
  sourceRef: string;
  status: ProductSetupHandoffStatus;
  createdAtIso: string;
  sentAtIso?: string;
};

export type ProductSetupRecord = {
  id: string;
  status: 'draft' | 'ready_for_engineering' | 'locked';
  fields: Record<ProductSetupFieldKey, ProductSetupField>;
  pendingSuggestedUpdates: ProductSetupSuggestedUpdate[];
  termExplanations: Record<string, TermExplanationState>;
  unsupportedRequirementDecisions: UnsupportedRequirementDecision[];
  deploymentWarningAcknowledgements: ProductSetupDeploymentWarningAcknowledgement[];
  downstreamHandoffNotes: ProductSetupHandoffNote[];
  updatedAtIso: string;
};

export type ProductSetupDeploymentWarning = {
  fieldKey: ProductSetupFieldKey;
  label: string;
  message: string;
  likelyError: string;
  status: ProductSetupFieldStatus;
};

export type ProductSetupReadModel = {
  statusLabel: string;
  readinessLabel: string;
  completedEssentialCount: number;
  requiredEssentialCount: number;
  understandingSummary: string;
  protocolRecommendation: {
    recommendedProtocol: ProductSetupProtocolBase;
    confidence: number;
    reasons: string[];
    alternatives: string[];
    executablePrototypeLabel: string;
  };
  missingEssentials: ProductSetupField[];
  deploymentBlockers: string[];
  deploymentWarnings: ProductSetupDeploymentWarning[];
  hasUnacknowledgedDeploymentWarnings: boolean;
  latestDeploymentWarningAcknowledgement?: ProductSetupDeploymentWarningAcknowledgement;
  profileRows: Array<{
    id: string;
    label: string;
    value: string;
    provenanceLabel: 'Stated' | 'Assumed' | 'Inferred' | 'Needs review' | 'Missing';
    fieldKeys: ProductSetupFieldKey[];
    whyItMatters?: string;
  }>;
  downstreamHandoffs: ProductSetupHandoffNote[];
  requirementSections: Array<{
    title: string;
    fields: ProductSetupField[];
  }>;
  unsupportedRequirementDecisions: UnsupportedRequirementDecision[];
  firstTimePrompts: Array<{
    termKey: string;
    fieldKey: ProductSetupFieldKey;
    prompt: string;
  }>;
  packPreview: {
    status: 'Draft' | 'Ready for review' | 'Finalised' | 'PRD generated';
    versionLabel: string;
    lastGeneratedAtIso?: string;
    evidenceVaultStatus: string;
    canDownloadArtifacts: boolean;
    warning: string;
    includedDocuments: string[];
  };
};

export const essentialProductSetupFieldKeys = [
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
  'nav_cadence',
  'nav_upload_method',
  'subscription_cadence',
  'redemption_cadence',
  'duration_months',
  'derived_maturity_date',
  'maturity_description',
  'base_currency',
  'subscription_payment_method',
  'redemption_payment_method',
  'minimum_redemption_amount',
  'whitelisted_wallets_required',
  'p2p_transfer_allowed',
  'protocol_base',
  'prototype_network',
  'compliance_model',
  'evidence_model',
] satisfies ProductSetupFieldKey[];

export const productSetupPrdFieldKeys = [
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
  'nav_cadence',
  'nav_upload_method',
  'subscription_cadence',
  'redemption_cadence',
  'duration_months',
  'derived_maturity_date',
  'maturity_description',
  'base_currency',
  'subscription_payment_method',
  'subscription_stablecoins',
  'redemption_payment_method',
  'redemption_stablecoin_type',
  'minimum_redemption_amount',
  'whitelisted_wallets_required',
  'p2p_transfer_allowed',
  'prototype_network',
  'protocol_base',
  'compliance_model',
  'evidence_model',
] satisfies ProductSetupFieldKey[];

export const deploymentProductSetupFieldKeys = [
  'admin_wallet',
  'subscription_receiving_wallet',
  'redemption_wallet',
  'protocol_base',
  'investor_wallet_rule',
  'subscription_cadence',
  'redemption_cadence',
  'subscription_stablecoins',
  'burn_lock_rule',
  'expected_investor_count',
  'prototype_network',
] satisfies ProductSetupFieldKey[];

export const allProductSetupFieldKeys = [
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
  'minimum_subscription_amount',
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
] satisfies ProductSetupFieldKey[];
