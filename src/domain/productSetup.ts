import type { FundFacts } from './schemas';
import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';
import { createDocxArchive, escapeDocxXml } from './docxExport';
import {
  createProductSetupSuggestionsFromText,
  createUnsupportedRequirementDecisionsFromText,
} from './productSetupExtraction';
import {
  allProductSetupFieldKeys,
  deploymentProductSetupFieldKeys,
  productSetupPrdFieldKeys,
  type ProductSetupDeploymentWarning,
  type ProductSetupDeploymentWarningAcknowledgement,
  type ProductSetupField,
  type ProductSetupFieldKey,
  type ProductSetupFieldSourceType,
  type ProductSetupFieldStatus,
  type ProductSetupFieldValue,
  type ProductSetupHandoffNote,
  type ProductSetupHandoffSuggestion,
  type ProductSetupHandoffTarget,
  type ProductSetupProtocolBase,
  type ProductSetupReadModel,
  type ProductSetupRecord,
  type ProductSetupSuggestedUpdate,
  type UnsupportedRequirementDecision,
} from './productSetupSchema';

export {
  allProductSetupFieldKeys,
  deploymentProductSetupFieldKeys,
  essentialProductSetupFieldKeys,
  productSetupPrdFieldKeys,
  supportedProtocolBases,
} from './productSetupSchema';
export type {
  ProductSetupDeploymentWarning,
  ProductSetupDeploymentWarningAcknowledgement,
  ProductSetupField,
  ProductSetupFieldKey,
  ProductSetupFieldSourceType,
  ProductSetupFieldStatus,
  ProductSetupFieldValue,
  ProductSetupHandoffNote,
  ProductSetupHandoffSuggestion,
  ProductSetupHandoffSuggestionStatus,
  ProductSetupHandoffStatus,
  ProductSetupHandoffTarget,
  ProductSetupProtocolBase,
  ProductSetupReadModel,
  ProductSetupRecord,
  ProductSetupStructuredSuggestionInput,
  ProductSetupSuggestedUpdate,
  TermExplanationState,
  UnsupportedRequirementDecision,
} from './productSetupSchema';
export {
  createProductSetupSuggestionsFromStructuredUpdates,
  createProductSetupSuggestionsFromText,
  createUnsupportedRequirementDecisionsFromText,
} from './productSetupExtraction';

export type ProductSetupSuggestionReconciliationResult = {
  record: ProductSetupRecord;
  acceptedUpdates: ProductSetupSuggestedUpdate[];
  appliedUpdates: ProductSetupSuggestedUpdate[];
  pendingUpdates: ProductSetupSuggestedUpdate[];
  rejectedUpdates: ProductSetupRejectedFact[];
};

export type ProductSetupCommittedFact = {
  fieldKey: ProductSetupFieldKey;
  value: ProductSetupFieldValue;
  sourceType: ProductSetupFieldSourceType;
  sourceRef: string;
  confidence?: number;
  disposition: 'applied' | 'pending_review' | 'derived';
  previousValue?: ProductSetupFieldValue;
  reviewReason?: string;
  uncertaintyMarkers?: string[];
};

export type ProductSetupRejectedFact = {
  fieldKey?: ProductSetupFieldKey;
  value?: ProductSetupFieldValue;
  sourceRef: string;
  reason: string;
};

export type ProductSetupIntakeMode =
  | 'commit_candidate'
  | 'correction'
  | 'confirmation'
  | 'rejection'
  | 'question';

export type ProductSetupClarifyingQuestion = {
  id: string;
  fieldKeys: ProductSetupFieldKey[];
  prompt: string;
  priority: 'high' | 'medium' | 'low';
  reviewBatchId?: string;
};

export type ProductSetupRecordFieldDiff = {
  fieldKey: ProductSetupFieldKey;
  before?: ProductSetupFieldValue;
  after?: ProductSetupFieldValue;
  beforeStatus?: ProductSetupFieldStatus;
  afterStatus?: ProductSetupFieldStatus;
};

export type ProductSetupBotClaimSummary = {
  recorded: string[];
  updated: string[];
  needsReview: string[];
  notApplied: string[];
  derived: string[];
  stillNeeded: string[];
};

export type ProductSetupIntakeTransaction = {
  id: string;
  idempotencyKey: string;
  sourceRef: string;
  sourceTurnId: string;
  intakeMode: ProductSetupIntakeMode;
  previousRecordRevision: number;
  nextRecordRevision: number;
  rebasedFromRevision?: number;
  reviewBatchId: string;
  appliedFacts: ProductSetupCommittedFact[];
  reviewFacts: ProductSetupCommittedFact[];
  rejectedFacts: ProductSetupRejectedFact[];
  derivedFacts: ProductSetupCommittedFact[];
  handoffCandidates: ProductSetupHandoffNote[];
  clarifyingQuestions: ProductSetupClarifyingQuestion[];
  recordPatch: Partial<Record<ProductSetupFieldKey, ProductSetupFieldValue | undefined>>;
  recordDiff: ProductSetupRecordFieldDiff[];
  botClaimSummary: ProductSetupBotClaimSummary;
};

export type ProductSetupIntakeReconciliationResult = ProductSetupSuggestionReconciliationResult & {
  mergedSuggestions: ProductSetupSuggestedUpdate[];
  unsupportedRequirementDecisions: UnsupportedRequirementDecision[];
  committedFacts: ProductSetupCommittedFact[];
  appliedFacts: ProductSetupCommittedFact[];
  reviewFacts: ProductSetupCommittedFact[];
  derivedFacts: ProductSetupCommittedFact[];
  transaction: ProductSetupIntakeTransaction;
};

function createField(input: Omit<ProductSetupField, 'confirmedByUser'> & { confirmedByUser?: boolean }): ProductSetupField {
  return {
    ...input,
    confirmedByUser: input.confirmedByUser ?? false,
  };
}

type ProductSetupFieldCommitPolicy =
  | 'safe_auto_commit'
  | 'review_if_changed'
  | 'always_review'
  | 'reject_if_invalid'
  | 'handoff_only';

type ProductSetupFieldPolicy = {
  commitPolicy: ProductSetupFieldCommitPolicy;
  deploymentMaterial?: boolean;
  derived?: boolean;
};

export const PRODUCT_SETUP_PRD_GENERATOR_VERSION = 'product-setup-prd-renderer-v2';

const productSetupFieldPolicies: Partial<Record<ProductSetupFieldKey, ProductSetupFieldPolicy>> = {
  derived_maturity_date: { commitPolicy: 'reject_if_invalid', derived: true },
  protocol_base: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  maximum_investor_count: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  whitelisted_wallets_required: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  p2p_transfer_allowed: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  investor_wallet_rule: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  eligible_investor_type: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  offering_type: { commitPolicy: 'review_if_changed', deploymentMaterial: true },
  admin_wallet: { commitPolicy: 'always_review', deploymentMaterial: true },
  redemption_wallet: { commitPolicy: 'always_review', deploymentMaterial: true },
  subscription_receiving_wallet: { commitPolicy: 'always_review', deploymentMaterial: true },
  distribution_jurisdiction: { commitPolicy: 'reject_if_invalid', deploymentMaterial: true },
  prototype_network: { commitPolicy: 'reject_if_invalid', deploymentMaterial: true },
};

function productSetupFieldPolicy(fieldKey: ProductSetupFieldKey): ProductSetupFieldPolicy {
  return productSetupFieldPolicies[fieldKey] ?? { commitPolicy: 'safe_auto_commit' };
}

const criticalProductSetupPrdFieldKeys = new Set<ProductSetupFieldKey>([
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
  'base_currency',
  'subscription_cadence',
  'subscription_payment_method',
  'redemption_cadence',
  'redemption_payment_method',
  'duration_months',
  'derived_maturity_date',
  'whitelisted_wallets_required',
  'p2p_transfer_allowed',
  'protocol_base',
  'prototype_network',
  'compliance_model',
  'evidence_model',
]);

function isCriticalProductSetupPrdField(fieldKey: ProductSetupFieldKey): boolean {
  return criticalProductSetupPrdFieldKeys.has(fieldKey) || productSetupFieldPolicy(fieldKey).deploymentMaterial === true;
}

function productSetupRevision(record: ProductSetupRecord): number {
  return Number.isFinite(record.revision) ? record.revision : 0;
}

function nextProductSetupRevision(record: ProductSetupRecord): number {
  return productSetupRevision(record) + 1;
}

export function createInitialProductSetupRecord(facts: FundFacts): ProductSetupRecord {
  void facts;

  return {
    id: 'product-setup-alpha-income-fund-i',
    revision: 0,
    status: 'draft',
    fields: {
      product_name: createField({
        key: 'product_name',
        label: 'Product name',
        status: 'missing',
        usedByTabs: ['Overview', 'Evidence Vault', 'Contract Ops'],
        smartContractRelevance: 'operational_metadata',
      }),
      token_symbol: createField({
        key: 'token_symbol',
        label: 'Product short name',
        status: 'missing',
        usedByTabs: ['Overview', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
      product_launch_date: createField({
        key: 'product_launch_date',
        label: 'Product launch date',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Subscription', 'Investor Wallets', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      product_wrapper: createField({
        key: 'product_wrapper',
        label: 'Product wrapper',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      underlying_asset_class: createField({
        key: 'underlying_asset_class',
        label: 'Underlying asset class',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      product_structure: createField({
        key: 'product_structure',
        label: 'Product term type',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Subscription', 'Redemption', 'Maturity'],
        smartContractRelevance: 'operational_metadata',
      }),
      offering_type: createField({
        key: 'offering_type',
        label: 'Offering type',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      eligible_investor_type: createField({
        key: 'eligible_investor_type',
        label: 'Eligible investor type',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      maximum_investor_count: createField({
        key: 'maximum_investor_count',
        label: 'Maximum number of investors',
        value: 50,
        status: 'system_default',
        sourceType: 'system_default',
        sourceRef: 'mvp_investor_cap',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
      distribution_jurisdiction: createField({
        key: 'distribution_jurisdiction',
        label: 'Distribution jurisdiction',
        value: 'Singapore',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_singapore_only',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
      issuer_owner: createField({
        key: 'issuer_owner',
        label: 'Issuer / product owner',
        status: 'missing',
        usedByTabs: ['Overview', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
      product_type: createField({
        key: 'product_type',
        label: 'Product type',
        status: 'missing',
        usedByTabs: ['Overview', 'Contract Ops', 'Asset Servicing', 'Maturity'],
        smartContractRelevance: 'operational_metadata',
      }),
      base_currency: createField({
        key: 'base_currency',
        label: 'Base currency',
        status: 'missing',
        usedByTabs: ['Subscription', 'Redemption', 'Asset Servicing'],
        smartContractRelevance: 'operational_metadata',
      }),
      income_treatment: createField({
        key: 'income_treatment',
        label: 'Income treatment',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Evidence Vault', 'Maturity'],
        smartContractRelevance: 'operational_metadata',
      }),
      protocol_base: createField({
        key: 'protocol_base',
        label: 'Protocol base',
        status: 'missing',
        usedByTabs: ['Contract Ops', 'Investor Wallets', 'Subscription', 'Redemption'],
        smartContractRelevance: 'contract_parameter',
      }),
      expected_investor_count: createField({
        key: 'expected_investor_count',
        label: 'Expected investors',
        status: 'missing',
        usedByTabs: ['Investor Wallets', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
      investor_wallet_rule: createField({
        key: 'investor_wallet_rule',
        label: 'Investor wallet rule',
        status: 'missing',
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Redemption'],
        smartContractRelevance: 'contract_parameter',
      }),
      whitelisted_wallets_required: createField({
        key: 'whitelisted_wallets_required',
        label: 'Whitelisted wallets required',
        status: 'missing',
        usedByTabs: ['Investor Wallets', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
      subscription_cadence: createField({
        key: 'subscription_cadence',
        label: 'Subscription / mint cadence',
        status: 'missing',
        usedByTabs: ['Subscription', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      subscription_payment_method: createField({
        key: 'subscription_payment_method',
        label: 'Subscription payment method',
        status: 'missing',
        usedByTabs: ['Subscription', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      subscription_stablecoins: createField({
        key: 'subscription_stablecoins',
        label: 'Subscription stablecoin type',
        status: 'missing',
        usedByTabs: ['Subscription', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
      minimum_subscription_amount: createField({
        key: 'minimum_subscription_amount',
        label: 'Minimum subscription amount',
        status: 'missing',
        usedByTabs: ['Subscription', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      subscription_receiving_wallet: createField({
        key: 'subscription_receiving_wallet',
        label: 'Subscription receiving wallet',
        status: 'missing',
        usedByTabs: ['Subscription', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
      redemption_cadence: createField({
        key: 'redemption_cadence',
        label: 'Redemption / burn cadence',
        status: 'missing',
        usedByTabs: ['Redemption', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      redemption_payment_method: createField({
        key: 'redemption_payment_method',
        label: 'Redemption payment method',
        status: 'missing',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      redemption_stablecoin_type: createField({
        key: 'redemption_stablecoin_type',
        label: 'Redemption stablecoin type',
        status: 'missing',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      redemption_schedule: createField({
        key: 'redemption_schedule',
        label: 'Redemption schedule',
        status: 'missing',
        usedByTabs: ['Redemption', 'Maturity', 'Asset Servicing'],
        smartContractRelevance: 'operational_metadata',
      }),
      redemption_payout_delay: createField({
        key: 'redemption_payout_delay',
        label: 'Redemption payout delay',
        status: 'missing',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      income_payout_cadence: createField({
        key: 'income_payout_cadence',
        label: 'Income payout cadence',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      redemption_payout_cadence: createField({
        key: 'redemption_payout_cadence',
        label: 'Redemption payout cadence',
        status: 'missing',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      minimum_redemption_amount: createField({
        key: 'minimum_redemption_amount',
        label: 'Minimum redemption amount',
        value: '1 token',
        status: 'system_default',
        sourceType: 'system_default',
        sourceRef: 'mvp_default_minimum_redemption',
        usedByTabs: ['Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      p2p_transfer_allowed: createField({
        key: 'p2p_transfer_allowed',
        label: 'P2P transfer allowed',
        status: 'missing',
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
      compliance_model: createField({
        key: 'compliance_model',
        label: 'Compliance model',
        value: 'Whitelist-based transfer restrictions',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_compliance_model',
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
      evidence_model: createField({
        key: 'evidence_model',
        label: 'Evidence model',
        value: 'Store PRD, approvals, transaction hashes, generated artefacts, and version history',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_evidence_model',
        usedByTabs: ['Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
      duration_months: createField({
        key: 'duration_months',
        label: 'Duration of product in months',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      derived_maturity_date: createField({
        key: 'derived_maturity_date',
        label: 'Derived maturity date',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Maturity', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      maturity_description: createField({
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
      redemption_wallet: createField({
        key: 'redemption_wallet',
        label: 'Redemption wallet',
        status: 'missing',
        usedByTabs: ['Redemption', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
      admin_wallet: createField({
        key: 'admin_wallet',
        label: 'Admin wallet',
        status: 'missing',
        usedByTabs: ['Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
      burn_lock_rule: createField({
        key: 'burn_lock_rule',
        label: 'Burn / lock rule',
        status: 'missing',
        usedByTabs: ['Redemption', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
      nav_cadence: createField({
        key: 'nav_cadence',
        label: 'NAV cadence',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      nav_upload_method: createField({
        key: 'nav_upload_method',
        label: 'NAV upload method',
        value: 'CSV',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mvp_csv_only_nav_upload',
        usedByTabs: ['Product Setup', 'Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
      nav_price_assumption: createField({
        key: 'nav_price_assumption',
        label: 'NAV price assumption',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Subscription', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      nav_upload_timing: createField({
        key: 'nav_upload_timing',
        label: 'NAV upload timing',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Subscription', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      nav_source: createField({
        key: 'nav_source',
        label: 'NAV source',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'evidence_metadata',
      }),
      investor_update_rule: createField({
        key: 'investor_update_rule',
        label: 'Investor update rule',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      subscription_window: createField({
        key: 'subscription_window',
        label: 'Subscription window',
        status: 'missing',
        usedByTabs: ['Subscription', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      income_payout_timing: createField({
        key: 'income_payout_timing',
        label: 'Income payout timing',
        status: 'missing',
        usedByTabs: ['Asset Servicing', 'Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      initial_distribution_date: createField({
        key: 'initial_distribution_date',
        label: 'Initial distribution date',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Subscription', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      initial_investor_register_rule: createField({
        key: 'initial_investor_register_rule',
        label: 'Initial investor register',
        status: 'missing',
        usedByTabs: ['Product Setup', 'Investor Wallets', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      maturity_date: createField({
        key: 'maturity_date',
        label: 'Maturity / term',
        status: 'missing',
        usedByTabs: ['Maturity', 'Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      maturity_closeout_rule: createField({
        key: 'maturity_closeout_rule',
        label: 'Maturity closeout rule',
        status: 'missing',
        usedByTabs: ['Maturity', 'Redemption', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      prototype_network: createField({
        key: 'prototype_network',
        label: 'Blockchain network',
        value: 'Sepolia testnet',
        status: 'locked',
        sourceType: 'system_default',
        sourceRef: 'mila26_testnet_boundary',
        usedByTabs: ['Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
      }),
    },
    pendingSuggestedUpdates: [],
    termExplanations: {},
    unsupportedRequirementDecisions: [],
    deploymentWarningAcknowledgements: [],
    downstreamHandoffNotes: [],
    updatedAtIso: new Date().toISOString(),
  };
}

export function normalizeProductSetupRecord(record: ProductSetupRecord): ProductSetupRecord {
  const baselineFields = createInitialProductSetupRecord({} as FundFacts).fields;
  const fields = { ...baselineFields, ...record.fields };
  const starterDefaultIdentityFields = [
    'product_name',
    'token_symbol',
    'product_type',
    'base_currency',
    'income_treatment',
    'investor_wallet_rule',
    'whitelisted_wallets_required',
  ] satisfies ProductSetupFieldKey[];

  for (const fieldKey of starterDefaultIdentityFields) {
    const field = fields[fieldKey];
    if (
      (field.status === 'system_default' && field.sourceRef === 'starter_facts') ||
      (field.status === 'inferred' && (field.sourceRef === 'starter_context' || field.sourceRef === 'migration_default'))
    ) {
      fields[fieldKey] = {
        ...field,
        value: undefined,
        status: 'missing',
        sourceType: undefined,
        sourceRef: undefined,
        confidence: undefined,
        confirmedByUser: false,
      };
    }
  }

  return deriveProductSetupFields({
    ...record,
    revision: productSetupRevision(record),
    fields,
    downstreamHandoffNotes: (record.downstreamHandoffNotes ?? []).map((note) => ({
      ...note,
      suggestions: note.suggestions ?? [],
    })),
  });
}

function deriveProductSetupFields(record: ProductSetupRecord): ProductSetupRecord {
  const launchDate = fieldDisplayValue(record.fields.product_launch_date);
  const durationMonths = Number(record.fields.duration_months.value);
  const existingDerived = record.fields.derived_maturity_date;
  const derivedMaturityDate =
    launchDate && Number.isFinite(durationMonths) && durationMonths > 0
      ? deriveMaturityDateFromLaunchAndDuration(launchDate, durationMonths)
      : undefined;

  if (!derivedMaturityDate) return record;
  if (existingDerived.value === derivedMaturityDate && existingDerived.status !== 'missing') return record;

  return {
    ...record,
    fields: {
      ...record.fields,
      derived_maturity_date: {
        ...existingDerived,
        value: derivedMaturityDate,
        status: 'system_default',
        sourceType: 'system_default',
        sourceRef: 'derived_from_launch_date_and_duration',
        confidence: 1,
        confirmedByUser: false,
      },
    },
  };
}

export function deriveMaturityDateFromLaunchAndDuration(launchDate: string, durationMonths: number): string | undefined {
  const parsed = parseProductSetupIsoDate(launchDate);
  if (!parsed || !Number.isFinite(durationMonths) || durationMonths <= 0) return undefined;
  const candidate = new Date(Date.UTC(parsed.year, parsed.monthIndex + durationMonths, parsed.day));
  while (candidate.getUTCDay() === 0 || candidate.getUTCDay() === 6) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate.toISOString().slice(0, 10);
}

function parseProductSetupIsoDate(value: string): { year: number; monthIndex: number; day: number } | undefined {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match?.[1] || !match[2] || !match[3]) return undefined;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) return undefined;
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return undefined;
  return { year, monthIndex, day };
}

export function recommendProductSetupProtocol(record: ProductSetupRecord): ProductSetupReadModel['protocolRecommendation'] {
  const whitelistRequired = record.fields.whitelisted_wallets_required.value === true;
  const p2pAllowed = record.fields.p2p_transfer_allowed.value === true;
  const productStructure = String(record.fields.product_structure.value ?? '').toLowerCase();

  if (whitelistRequired) {
    return {
      recommendedProtocol: 'ERC-3643',
      confidence: 0.88,
      reasons: ['Whitelisted wallets and restricted token holding are central to the product setup.'],
      alternatives: ['Customised ERC-20 if the MVP should keep the current executable prototype while adding whitelist-style controls.', 'ERC-20 if transfer restrictions can stay offchain or at the workflow layer.'],
      executablePrototypeLabel: 'Recommended architecture target; current executable prototype is Sepolia restricted ERC-20-compatible.',
    };
  }

  if (p2pAllowed || productStructure.includes('open')) {
    return {
      recommendedProtocol: 'Customised ERC-20',
      confidence: 0.82,
      reasons: ['The product needs a fungible token with product-specific controls for mint, burn, pause, and evidence events.'],
      alternatives: ['ERC-3643 if whitelisted-transfer restrictions become the core architecture.', 'ERC-20 if the product only needs simple transferable units.'],
      executablePrototypeLabel: 'Default architecture target; current Contract Ops execution remains Sepolia restricted ERC-20-compatible.',
    };
  }

  return {
    recommendedProtocol: 'Customised ERC-20',
    confidence: 0.76,
    reasons: ['Customised ERC-20 is the default MVP recommendation for a tokenised product needing mint, burn, pause, role, and evidence controls.'],
    alternatives: ['ERC-20 for the simplest fungible-token prototype.', 'ERC-3643 when whitelisted-transfer restrictions are central to the architecture.'],
    executablePrototypeLabel: 'Default architecture target; current executable prototype is Sepolia restricted ERC-20-compatible.',
  };
}

export function toProductSetupReadModel(record: ProductSetupRecord): ProductSetupReadModel {
  record = deriveProductSetupFields(record);
  const protocolRecommendation = recommendProductSetupProtocol(record);
  const requiredProductSetupFieldKeys = toRequiredProductSetupFieldKeys(record);
  const completedEssentialCount = requiredProductSetupFieldKeys.filter((key) => isProductSetupRequiredFieldDrafted(record.fields[key])).length;
  const deferredEssentials = requiredProductSetupFieldKeys
    .map((key) => record.fields[key])
    .filter((field) => field.status === 'deferred');
  const criticalDeferredEssentials = deferredEssentials.filter((field) => isCriticalProductSetupPrdField(field.key));
  const nonCriticalDeferredEssentials = deferredEssentials.filter((field) => !isCriticalProductSetupPrdField(field.key));
  const missingEssentials = requiredProductSetupFieldKeys
    .map((key) => record.fields[key])
    .filter((field) => !isProductSetupRequiredFieldDrafted(field));
  const deploymentWarnings = toProductSetupDeploymentWarnings(record);
  const deploymentBlockers = deploymentWarnings.map((warning) => warning.message);
  const latestDeploymentWarningAcknowledgement = record.deploymentWarningAcknowledgements.at(-1);
  const hasUnacknowledgedDeploymentWarnings =
    deploymentWarnings.length > 0 &&
    !latestDeploymentWarningAcknowledgementCovers(latestDeploymentWarningAcknowledgement, deploymentWarnings);

  return {
    statusLabel: record.status === 'locked' ? 'Locked Product Setup snapshot' : 'Draft Product Setup',
    readinessLabel:
      `${completedEssentialCount}/${requiredProductSetupFieldKeys.length} Product Setup fields drafted, defaulted, locked, or explicitly deferred` +
      (criticalDeferredEssentials.length > 0 ? ` · ${criticalDeferredEssentials.length} critical deferral(s)` : ''),
    completedEssentialCount,
    requiredEssentialCount: requiredProductSetupFieldKeys.length,
    criticalDeferredEssentials,
    nonCriticalDeferredEssentials,
    understandingSummary: createUnderstandingSummary(record, protocolRecommendation.recommendedProtocol),
    protocolRecommendation,
    missingEssentials,
    deploymentBlockers,
    deploymentWarnings,
    hasUnacknowledgedDeploymentWarnings,
    latestDeploymentWarningAcknowledgement,
    profileRows: toProductSetupProfileRows(record, protocolRecommendation),
    downstreamHandoffs: toProductSetupDownstreamHandoffs(record),
    requirementSections: toProductSetupRequirementSections(record),
    unsupportedRequirementDecisions: record.unsupportedRequirementDecisions,
    firstTimePrompts: [
      { termKey: 'admin_wallet', fieldKey: 'admin_wallet', prompt: productSetupPromptForTerm('admin_wallet') },
      { termKey: 'subscription_receiving_wallet', fieldKey: 'subscription_receiving_wallet', prompt: productSetupPromptForTerm('subscription_receiving_wallet') },
      { termKey: 'redemption_wallet', fieldKey: 'redemption_wallet', prompt: productSetupPromptForTerm('redemption_wallet') },
      { termKey: 'investor_wallet_rule', fieldKey: 'investor_wallet_rule', prompt: productSetupPromptForTerm('investor_wallet_rule') },
      { termKey: 'burn_lock_rule', fieldKey: 'burn_lock_rule', prompt: productSetupPromptForTerm('burn_lock_rule') },
    ],
    packPreview: {
      status:
        missingEssentials.length > 0
          ? 'Draft'
          : criticalDeferredEssentials.length > 0
            ? 'Ready with critical deferrals'
            : 'Ready for review',
      versionLabel: 'Not generated',
      evidenceVaultStatus: 'Not stored yet',
      canDownloadArtifacts: false,
      warning:
        criticalDeferredEssentials.length > 0
          ? 'ZiliOS can draft the Product Setup Pack, but critical deferred Product Setup fields must be reviewed before the PRD is treated as ready for downstream workflow use.'
          : 'ZiliOS generates this pack after the product profile is reviewed and finalised. It captures the product PRD, product assumptions, compliance rules, and staged operational notes for the lifecycle tabs. Legal and compliance-sensitive items should be confirmed with counsel or compliance.',
      includedDocuments: [
        'Product Requirements Document',
        'Product terms and lifecycle summary',
        'Investor eligibility and distribution rules',
        'NAV, subscription, redemption, and maturity assumptions',
        'Tokenisation and compliance assumptions',
        'Staged notes for Investor Wallets, Subscription, Contract Ops, Asset Servicing, Redemption, and Maturity',
        'Open questions, if any',
      ],
    },
  };
}

function toRequiredProductSetupFieldKeys(record: ProductSetupRecord): ProductSetupFieldKey[] {
  const keys: ProductSetupFieldKey[] = productSetupPrdFieldKeys.filter(
    (fieldKey) => fieldKey !== 'subscription_stablecoins' && fieldKey !== 'redemption_stablecoin_type',
  );
  if (String(record.fields.subscription_payment_method.value ?? '').toLowerCase() === 'stablecoin') {
    keys.push('subscription_stablecoins');
  }
  if (String(record.fields.redemption_payment_method.value ?? '').toLowerCase() === 'stablecoin') {
    keys.push('redemption_stablecoin_type');
  }
  return [...new Set(keys)];
}

function isProductSetupRequiredFieldDrafted(field: ProductSetupField): boolean {
  if (field.rolePlaceholder) return false;
  if (field.status === 'deferred') return true;
  if (field.value === undefined || field.value === null) return false;
  if (Array.isArray(field.value)) return field.value.length > 0;
  if (typeof field.value === 'string' && field.value.trim().length === 0) return false;
  if (field.status === 'missing' || field.status === 'conflicting') return false;
  if (field.key === 'maximum_investor_count') {
    const count = Number(field.value);
    return Number.isFinite(count) && count > 0 && count <= 50;
  }
  if (field.key === 'duration_months') {
    const duration = Number(field.value);
    return Number.isFinite(duration) && duration > 0;
  }
  if (field.key === 'base_currency') {
    return !Array.isArray(field.value);
  }
  return true;
}

export function isDeploymentReadyField(field: ProductSetupField): boolean {
  if (field.rolePlaceholder) return false;
  if (field.value === undefined || field.value === null) return false;
  if (Array.isArray(field.value)) return field.value.length > 0;
  if (typeof field.value === 'string' && field.value.trim().length === 0) return false;
  return ['user_confirmed', 'system_default', 'locked'].includes(field.status);
}

export function toProductSetupDeploymentWarnings(record: ProductSetupRecord): ProductSetupDeploymentWarning[] {
  const deploymentFieldKeys = deploymentProductSetupFieldKeys.filter((fieldKey) => {
    if (fieldKey === 'subscription_stablecoins') {
      return String(record.fields.subscription_payment_method.value ?? '').toLowerCase() === 'stablecoin';
    }
    return true;
  });

  return deploymentFieldKeys
    .map((fieldKey) => record.fields[fieldKey])
    .filter((field) => !isDeploymentReadyField(field))
    .map((field) => ({
      fieldKey: field.key,
      label: field.label,
      status: field.status,
      message: `${field.label} is needed before wallet-signed Sepolia deployment can proceed.`,
      likelyError: likelyDeploymentErrorForField(field.key),
    }));
}

function latestDeploymentWarningAcknowledgementCovers(
  acknowledgement: ProductSetupDeploymentWarningAcknowledgement | undefined,
  warnings: ProductSetupDeploymentWarning[],
): boolean {
  if (!acknowledgement) return false;
  const acknowledged = new Set(acknowledgement.warningFieldKeys);
  return warnings.every((warning) => acknowledged.has(warning.fieldKey));
}

export function likelyDeploymentErrorForField(fieldKey: ProductSetupFieldKey): string {
  switch (fieldKey) {
    case 'admin_wallet':
      return 'Token roles cannot be reviewed or assigned to an operator wallet.';
    case 'subscription_receiving_wallet':
      return 'Subscription setup cannot identify where investor stablecoins should be received.';
    case 'redemption_wallet':
      return 'Redemption setup cannot identify where investors should send tokens for redemption.';
    case 'protocol_base':
      return 'Smart contract architecture may be generated against the wrong token pattern.';
    case 'investor_wallet_rule':
      return 'Transfer restrictions may not match how investors are meant to hold or transfer tokens.';
    case 'subscription_cadence':
      return 'Subscription workflows may not know how often investors can enter the product.';
    case 'redemption_cadence':
      return 'Redemption workflows may not know how often investors can exit the product.';
    case 'subscription_stablecoins':
      return 'Subscription parameters cannot identify the accepted payment token.';
    case 'burn_lock_rule':
      return 'Redemption token handling may be inconsistent with payout timing and evidence.';
    case 'expected_investor_count':
      return 'Investor Wallets capacity and distribution assumptions may be wrong.';
    case 'prototype_network':
      return 'Deployment must remain on Sepolia/testnet for the current prototype.';
    default:
      return 'The deployment setup may be incomplete or inconsistent.';
  }
}

function createUnderstandingSummary(record: ProductSetupRecord, recommendedProtocol: ProductSetupProtocolBase): string {
  const investors = fieldDisplayValue(record.fields.expected_investor_count) || 'an investor count still to confirm';
  const stablecoins = fieldDisplayValue(record.fields.subscription_stablecoins) || 'stablecoins still to confirm';
  const subscriptionCadence = fieldDisplayValue(record.fields.subscription_cadence) || 'subscription cadence still to confirm';
  const redemption = fieldDisplayValue(record.fields.redemption_cadence) || fieldDisplayValue(record.fields.redemption_schedule) || 'redemption timing still to confirm';
  const delay = fieldDisplayValue(record.fields.redemption_payout_delay) || 'payout delay still to confirm';
  const investorWalletRule = fieldDisplayValue(record.fields.investor_wallet_rule) || 'wallet transfer rules still to confirm';

  return `ZiLi-OS currently understands this as a ${fieldDisplayValue(record.fields.base_currency) || 'base-currency'} ${fieldDisplayValue(record.fields.product_type) || 'tokenised product'} for ${investors}. Investors subscribe ${subscriptionCadence} using ${stablecoins}, wallet rule is ${investorWalletRule}, redemption is ${redemption}, and payout delay is ${delay}. Recommended protocol base: ${recommendedProtocol}.`;
}

export function fieldDisplayValue(field: ProductSetupField): string {
  if (Array.isArray(field.value)) return field.value.join(', ');
  if (typeof field.value === 'boolean') return field.value ? 'Yes' : 'No';
  if (field.value === undefined || field.value === null || field.value === '') return '';
  return String(field.value);
}

function toProductSetupProfileRows(
  record: ProductSetupRecord,
  protocolRecommendation: ProductSetupReadModel['protocolRecommendation'],
): ProductSetupReadModel['profileRows'] {
  const rows = toProductSetupRequirementSections(record).flatMap((section) =>
    section.fields.map((field) => productSetupFieldProfileRow(record, field.key)),
  );
  const protocolRow = rows.find((row) => row.id === 'protocol_base');
  if (protocolRow && protocolRow.value === 'To be filled') {
    protocolRow.value = `${protocolRecommendation.recommendedProtocol} recommended; not selected`;
    protocolRow.provenanceLabel = 'Needs review';
  }
  return rows;
}

function productSetupFieldProfileRow(
  record: ProductSetupRecord,
  fieldKey: ProductSetupFieldKey,
): ProductSetupReadModel['profileRows'][number] {
  const field = record.fields[fieldKey];
  return {
    id: fieldKey,
    label: field.label,
    value: fieldDisplayValueWithPending(record, fieldKey) || 'To be filled',
    provenanceLabel: provenanceLabelForFieldsWithPending(record, [fieldKey]),
    fieldKeys: [fieldKey],
    whyItMatters: productSetupFieldHelperText(fieldKey),
  };
}

function toProductSetupRequirementSections(record: ProductSetupRecord): ProductSetupReadModel['requirementSections'] {
  const paymentFields = [
    'subscription_payment_method',
    ...(String(record.fields.subscription_payment_method.value ?? '').toLowerCase() === 'stablecoin'
      ? (['subscription_stablecoins'] as const)
      : []),
    'minimum_subscription_amount',
    'redemption_payment_method',
    ...(String(record.fields.redemption_payment_method.value ?? '').toLowerCase() === 'stablecoin'
      ? (['redemption_stablecoin_type'] as const)
      : []),
    'minimum_redemption_amount',
  ] satisfies ProductSetupFieldKey[];

  const sections: Array<{ title: string; fieldKeys: ProductSetupFieldKey[] }> = [
    {
      title: 'Product identity',
      fieldKeys: ['product_name', 'token_symbol', 'product_launch_date', 'base_currency'],
    },
    {
      title: 'Product classification',
      fieldKeys: ['product_wrapper', 'underlying_asset_class', 'product_structure', 'income_treatment'],
    },
    {
      title: 'Investor and distribution rules',
      fieldKeys: ['offering_type', 'eligible_investor_type', 'maximum_investor_count', 'distribution_jurisdiction'],
    },
    {
      title: 'Lifecycle cadence',
      fieldKeys: ['nav_cadence', 'nav_upload_method', 'subscription_cadence', 'redemption_cadence', 'duration_months', 'derived_maturity_date'],
    },
    {
      title: 'Payment and currency assumptions',
      fieldKeys: paymentFields,
    },
    {
      title: 'Tokenisation and compliance model',
      fieldKeys: ['whitelisted_wallets_required', 'p2p_transfer_allowed', 'prototype_network', 'protocol_base', 'compliance_model'],
    },
    {
      title: 'Evidence assumptions',
      fieldKeys: ['evidence_model'],
    },
  ];

  return sections.map((section) => ({
    title: section.title,
    fields: section.fieldKeys.map((fieldKey) => record.fields[fieldKey]),
  }));
}

function productSetupFieldHelperText(fieldKey: ProductSetupFieldKey): string | undefined {
  const helpers: Partial<Record<ProductSetupFieldKey, string>> = {
    product_name: 'The PRD uses this as the user-facing product name.',
    token_symbol: 'A short product code used in documents and later Contract Ops setup.',
    product_launch_date: 'Launch date anchors subscription start and maturity calculation.',
    product_wrapper: 'Wrapper identifies whether the product behaves like a fund, bond, equity, private asset, or other structure.',
    underlying_asset_class: 'Asset class informs valuation, servicing, and disclosure assumptions.',
    product_structure: 'Choose open-ended, closed-ended, or fixed maturity. This decides which subscription, redemption, and maturity workflows are needed.',
    offering_type: 'Choose how the product will be offered: Restricted, Private, Institutional-only, Retail, or All. Example: Private placement to approved investors.',
    eligible_investor_type: 'Choose who can invest: Retail, High net worth, Accredited investor, Institutional, or All. Eligibility is verified offchain before wallet whitelisting.',
    maximum_investor_count: 'MVP investor cap cannot exceed 50.',
    distribution_jurisdiction: 'Locked MVP default: Singapore only for now.',
    nav_cadence: 'NAV cadence tells Asset Servicing how often valuation updates are expected.',
    nav_upload_method: 'Locked MVP default: CSV upload only for now.',
    subscription_cadence: 'Subscription normally results in minting, which means creating new tokens for approved investors after subscription is accepted.',
    redemption_cadence: 'Redemption normally results in burning, which means cancelling tokens after a redemption is approved.',
    duration_months: 'Duration is required before ZiliOS can derive the maturity date.',
    derived_maturity_date: 'Calculated from launch date plus duration, moved to the next weekday if it lands on a weekend.',
    maturity_description: 'Maturity normally results in final redemption and token transfer controls before offchain payout.',
    base_currency: 'Only one base currency is allowed.',
    subscription_payment_method: 'Subscription payment method determines whether stablecoin details are needed.',
    subscription_stablecoins: 'Shown only when subscription payment method is stablecoin.',
    minimum_subscription_amount: 'Minimum subscription amount is staged for the Subscription tab and PRD assumptions.',
    redemption_payment_method: 'Redemption payment method determines whether stablecoin payout details are needed.',
    redemption_stablecoin_type: 'Shown only when redemption payment method is stablecoin.',
    minimum_redemption_amount: 'Default MVP assumption: 1 token.',
    whitelisted_wallets_required: 'Whitelisted wallets can receive or hold tokens only after approval.',
    p2p_transfer_allowed: 'If P2P is enabled, transfers are still limited to eligible whitelisted wallets.',
    prototype_network: 'Locked MVP default: Sepolia testnet only.',
    protocol_base: 'Protocol preference guides Contract Ops but can be changed before deployment finalisation.',
    compliance_model: 'MVP compliance control is whitelist-based transfer restrictions.',
    evidence_model: 'Evidence Vault stores PRD versions, approvals, transaction hashes, generated artefacts, and version history.',
  };
  return helpers[fieldKey];
}

function fieldDisplayValueWithPending(record: ProductSetupRecord, fieldKey: ProductSetupFieldKey): string {
  const directValue = formatProductSetupFieldValue(fieldKey, record.fields[fieldKey].value);
  if (directValue) return directValue;
  const pendingUpdate = findPendingUpdateForField(record, fieldKey);
  if (!pendingUpdate) return '';
  return formatProductSetupFieldValue(fieldKey, pendingUpdate.proposedValue);
}

function formatProductSetupFieldValue(fieldKey: ProductSetupFieldKey, value: ProductSetupFieldValue | undefined): string {
  if (value === undefined || value === null || value === '') return '';
  if (fieldKey === 'duration_months' && typeof value === 'number') return `${value} month${value === 1 ? '' : 's'}`;
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function findPendingUpdateForField(record: ProductSetupRecord, fieldKey: ProductSetupFieldKey): ProductSetupSuggestedUpdate | undefined {
  return [...record.pendingSuggestedUpdates].reverse().find((update) => update.fieldKey === fieldKey);
}

function provenanceLabelForFieldsWithPending(
  record: ProductSetupRecord,
  fieldKeys: ProductSetupFieldKey[],
): ProductSetupReadModel['profileRows'][number]['provenanceLabel'] {
  if (fieldKeys.some((fieldKey) => !fieldDisplayValue(record.fields[fieldKey]) && findPendingUpdateForField(record, fieldKey))) {
    return 'Needs review';
  }
  return provenanceLabelForFields(fieldKeys.map((fieldKey) => record.fields[fieldKey]));
}

function provenanceLabelForFields(fields: ProductSetupField[]): ProductSetupReadModel['profileRows'][number]['provenanceLabel'] {
  const populated = fields.filter((field) => fieldDisplayValue(field) || field.rolePlaceholder);
  if (populated.length === 0) return 'Missing';
  if (populated.some((field) => field.status === 'conflicting' || field.status === 'deferred')) return 'Needs review';
  if (populated.some((field) => field.status === 'user_confirmed' || field.status === 'user_stated')) return 'Stated';
  if (populated.some((field) => field.status === 'inferred')) return 'Inferred';
  if (populated.some((field) => field.status === 'system_default' || field.status === 'locked')) return 'Assumed';
  return 'Needs review';
}

function toProductSetupDownstreamHandoffs(record: ProductSetupRecord): ProductSetupHandoffNote[] {
  const existingById = new Map(record.downstreamHandoffNotes.map((note) => [note.id, note]));
  return createProductSetupHandoffCandidates(record).map((candidate) => existingById.get(candidate.id) ?? candidate);
}

function createProductSetupHandoffCandidates(record: ProductSetupRecord): ProductSetupHandoffNote[] {
  const createdAtIso = record.updatedAtIso;
  return [
    handoffCandidate(record, {
      id: 'investor-wallets-rules',
      target: 'investor_wallets',
      title: 'Investor eligibility and wallet rules',
      fieldKeys: ['expected_investor_count', 'investor_wallet_rule', 'whitelisted_wallets_required', 'initial_investor_register_rule'],
      sourceRef: 'product_setup_investor_rules',
      createdAtIso,
    }),
    handoffCandidate(record, {
      id: 'subscription-mechanics',
      target: 'subscription',
      title: 'Subscription mechanics',
      fieldKeys: ['subscription_cadence', 'subscription_window', 'subscription_stablecoins', 'initial_distribution_date'],
      sourceRef: 'product_setup_subscription_mechanics',
      createdAtIso,
    }),
    handoffCandidate(record, {
      id: 'contract-roles-protocol',
      target: 'contract_ops',
      title: 'Protocol and contract role assumptions',
      fieldKeys: ['protocol_base', 'admin_wallet', 'investor_wallet_rule', 'burn_lock_rule', 'prototype_network'],
      sourceRef: 'product_setup_contract_ops',
      createdAtIso,
    }),
    handoffCandidate(record, {
      id: 'asset-servicing-schedule',
      target: 'asset_servicing',
      title: 'Distribution, NAV, and corporate-action servicing',
      fieldKeys: [
        'nav_cadence',
        'nav_price_assumption',
        'nav_upload_timing',
        'nav_source',
        'income_treatment',
        'income_payout_cadence',
        'income_payout_timing',
        'investor_update_rule',
      ],
      sourceRef: 'product_setup_asset_servicing',
      createdAtIso,
    }),
    handoffCandidate(record, {
      id: 'redemption-windows',
      target: 'redemption',
      title: 'Redemption windows and payout handling',
      fieldKeys: ['redemption_cadence', 'redemption_schedule', 'redemption_payout_delay', 'redemption_payout_cadence', 'burn_lock_rule'],
      sourceRef: 'product_setup_redemption_windows',
      createdAtIso,
    }),
    handoffCandidate(record, {
      id: 'maturity-wind-down',
      target: 'maturity',
      title: 'Maturity and wind-down',
      fieldKeys: ['maturity_date', 'maturity_closeout_rule'],
      sourceRef: 'product_setup_maturity_wind_down',
      createdAtIso,
    }),
  ].filter((candidate) => candidate.detail.length > 0);
}

function handoffCandidate(
  record: ProductSetupRecord,
  input: {
    id: string;
    target: ProductSetupHandoffTarget;
    title: string;
    fieldKeys: ProductSetupFieldKey[];
    sourceRef: string;
    createdAtIso: string;
  },
): ProductSetupHandoffNote {
  const suggestionParts = input.fieldKeys
    .map((fieldKey) => {
      const field = record.fields[fieldKey];
      const value = fieldDisplayValue(field) || field.rolePlaceholder;
      if (!value || field.status === 'missing' || !isProductSetupHandoffEligibleField(field)) return undefined;
      return {
        fieldKey,
        detail: `${field.label}: ${value}`,
        suggestion: createHandoffSuggestion(input.target, field, value),
      };
    })
    .filter((part): part is { fieldKey: ProductSetupFieldKey; detail: string; suggestion: ProductSetupHandoffSuggestion } => Boolean(part));
  const detail = suggestionParts.map((part) => part.detail).join('; ');

  return {
    id: input.id,
    target: input.target,
    title: input.title,
    detail,
    sourceFieldKeys: suggestionParts.length > 0 ? suggestionParts.map((part) => part.fieldKey) : input.fieldKeys,
    suggestions: suggestionParts.map((part) => part.suggestion),
    sourceRef: input.sourceRef,
    status: detail ? 'draft_note_ready' : 'needs_clarification',
    createdAtIso: input.createdAtIso,
  };
}

function createHandoffSuggestion(
  target: ProductSetupHandoffTarget,
  field: ProductSetupField,
  valueLabel: string,
): ProductSetupHandoffSuggestion {
  return {
    id: `${target}-${field.key}`,
    sourceFieldKey: field.key,
    targetFieldKey: productSetupHandoffTargetFieldKey(target, field.key),
    label: field.label,
    value: field.value ?? field.rolePlaceholder ?? valueLabel,
    valueLabel,
    provenanceLabel: handoffSuggestionProvenanceLabel(field),
    status: 'pending',
  };
}

function handoffSuggestionProvenanceLabel(field: ProductSetupField): ProductSetupHandoffSuggestion['provenanceLabel'] {
  if (field.status === 'user_confirmed' || field.status === 'user_stated') return 'Stated';
  if (field.status === 'system_default') return 'Assumed';
  if (field.status === 'inferred') return 'Inferred';
  return 'Needs review';
}

function productSetupHandoffTargetFieldKey(
  target: ProductSetupHandoffTarget,
  fieldKey: ProductSetupFieldKey,
): string | undefined {
  const mappings: Record<ProductSetupHandoffTarget, Partial<Record<ProductSetupFieldKey, string>>> = {
    investor_wallets: {},
    subscription: {
      subscription_cadence: 'subscriptionCadence',
      subscription_window: 'subscriptionWindow',
      subscription_stablecoins: 'permittedStablecoins',
      minimum_subscription_amount: 'minimumSubscriptionAmount',
      subscription_receiving_wallet: 'paymentAddress',
      initial_distribution_date: 'subscriptionWindow',
    },
    contract_ops: {},
    asset_servicing: {
      nav_cadence: 'navCadence',
      nav_price_assumption: 'navPriceAssumption',
      nav_upload_timing: 'navUploadTiming',
      nav_source: 'navSource',
      income_payout_cadence: 'incomePayoutCadence',
      income_payout_timing: 'incomePayoutTiming',
      investor_update_rule: 'investorUpdateRule',
    },
    redemption: {
      redemption_cadence: 'redemptionCadence',
      redemption_schedule: 'redemptionWindow',
      redemption_payout_delay: 'redemptionDelay',
      redemption_payout_cadence: 'redemptionPayoutCadence',
      redemption_wallet: 'redemptionWalletAddress',
      burn_lock_rule: 'redemptionHandlingRule',
    },
    maturity: {
      maturity_date: 'maturityDate',
      maturity_closeout_rule: 'closeoutMethod',
    },
  };
  return mappings[target][fieldKey];
}

function isProductSetupHandoffEligibleField(field: ProductSetupField): boolean {
  if (field.status === 'user_confirmed' || field.status === 'user_stated' || field.status === 'deferred' || field.status === 'conflicting') {
    return true;
  }
  if (field.sourceType === 'direct_form_input' || field.sourceType === 'user_message' || field.sourceType === 'user_confirmation') {
    return true;
  }
  return field.status === 'inferred' && field.sourceRef !== 'starter_context';
}

export function sendProductSetupHandoffNote(record: ProductSetupRecord, handoffId: string): ProductSetupRecord {
  const candidate = toProductSetupDownstreamHandoffs(record).find((note) => note.id === handoffId);
  if (!candidate || candidate.status === 'sent_as_draft_note' || candidate.status === 'reviewed_in_target_tab') return record;
  const sentNote: ProductSetupHandoffNote = {
    ...candidate,
    status: 'sent_as_draft_note',
    sentAtIso: new Date().toISOString(),
  };
  const notesById = new Map(record.downstreamHandoffNotes.map((note) => [note.id, note]));
  notesById.set(sentNote.id, sentNote);

  return {
    ...record,
    downstreamHandoffNotes: [...notesById.values()],
    updatedAtIso: new Date().toISOString(),
  };
}

export function reviewProductSetupHandoffNote(record: ProductSetupRecord, handoffId: string): ProductSetupRecord {
  const existingNote = record.downstreamHandoffNotes.find((note) => note.id === handoffId);
  if (!existingNote || existingNote.status !== 'sent_as_draft_note') return record;

  return {
    ...record,
    downstreamHandoffNotes: record.downstreamHandoffNotes.map((note) =>
      note.id === handoffId ? { ...note, status: 'reviewed_in_target_tab' } : note,
    ),
    updatedAtIso: new Date().toISOString(),
  };
}

export function applyProductSetupHandoffSuggestion(
  record: ProductSetupRecord,
  handoffId: string,
  suggestionId: string,
): ProductSetupRecord {
  return updateProductSetupHandoffSuggestionStatus(record, handoffId, suggestionId, 'applied_in_target_tab');
}

export function dismissProductSetupHandoffSuggestion(
  record: ProductSetupRecord,
  handoffId: string,
  suggestionId: string,
): ProductSetupRecord {
  return updateProductSetupHandoffSuggestionStatus(record, handoffId, suggestionId, 'dismissed_in_target_tab');
}

function updateProductSetupHandoffSuggestionStatus(
  record: ProductSetupRecord,
  handoffId: string,
  suggestionId: string,
  status: 'applied_in_target_tab' | 'dismissed_in_target_tab',
): ProductSetupRecord {
  const updatedAtIso = new Date().toISOString();
  let changed = false;
  const downstreamHandoffNotes = record.downstreamHandoffNotes.map((note) => {
    if (note.id !== handoffId) return note;
    const suggestions = note.suggestions.map((suggestion) => {
      if (suggestion.id !== suggestionId || suggestion.status !== 'pending') return suggestion;
      changed = true;
      return {
        ...suggestion,
        status,
        appliedAtIso: status === 'applied_in_target_tab' ? updatedAtIso : suggestion.appliedAtIso,
        dismissedAtIso: status === 'dismissed_in_target_tab' ? updatedAtIso : suggestion.dismissedAtIso,
      };
    });
    const allReviewed = suggestions.length > 0 && suggestions.every((suggestion) => suggestion.status !== 'pending');
    return {
      ...note,
      suggestions,
      status: allReviewed ? 'reviewed_in_target_tab' : note.status,
    };
  });

  if (!changed) return record;
  return {
    ...record,
    downstreamHandoffNotes,
    updatedAtIso,
  };
}

export function productSetupHandoffTargetLabel(target: ProductSetupHandoffTarget): string {
  switch (target) {
    case 'investor_wallets':
      return 'Investor Wallets';
    case 'subscription':
      return 'Subscription';
    case 'contract_ops':
      return 'Contract Ops';
    case 'asset_servicing':
      return 'Asset Servicing';
    case 'redemption':
      return 'Redemption';
    case 'maturity':
      return 'Maturity';
  }
}

export function productSetupPromptForTerm(termKey: string): string {
  if (termKey === 'admin_wallet') {
    return [
      'I need the admin wallet.',
      'Why this is needed: this public wallet address can manage important token settings, such as assigning roles or approving configuration changes.',
      'What to provide: paste the public wallet address on the selected blockchain network.',
      'Example: 0x1234...abcd.',
      'Safety note: do not provide a private key, seed phrase, or recovery phrase.',
    ].join('\n');
  }

  if (termKey === 'redemption_wallet') {
    return [
      'I need the redemption wallet.',
      'Why this is needed: investors send tokens to this public wallet when they want to redeem.',
      'What to provide: paste the public wallet address on the selected blockchain network.',
      'Example: 0x1234...abcd.',
      'Safety note: do not provide a private key, seed phrase, or recovery phrase.',
    ].join('\n');
  }

  if (termKey === 'subscription_receiving_wallet') {
    return [
      'I need the subscription receiving wallet.',
      'Why this is needed: this public wallet address or payment contract is where investors send stablecoins when subscribing.',
      'What to provide: paste the public wallet address on the selected blockchain network.',
      'Example: 0x1234...abcd.',
      'Safety note: do not provide a private key, seed phrase, or recovery phrase.',
    ].join('\n');
  }

  if (termKey === 'investor_wallet_rule') {
    return [
      'I need the investor wallet rule.',
      'Why this is needed: ZiLi-OS must know who can hold, receive, or transfer the product token.',
      'What to provide: choose approved wallets only, approved investor peer-to-peer transfers, issuer-only transfers, open transfers, or not sure yet.',
      'Example: approved investors may transfer peer-to-peer only to other approved wallets.',
    ].join('\n');
  }

  if (termKey === 'burn_lock_rule') {
    return [
      'I need one redemption handling rule.',
      'Why this is needed: ZiLi-OS must know what happens to tokens after investors send them back for redemption.',
      'What to provide: choose burn on receipt, lock until payout then burn, burn after payout, do not automate for MVP, or not sure yet.',
      'Example: lock until stablecoin payout is complete, then burn.',
    ].join('\n');
  }

  return 'I need this Product Setup field so ZiLi-OS can keep the tokenisation requirements clear and reviewable.';
}

export function markTermExplained(record: ProductSetupRecord, termKey: string): ProductSetupRecord {
  const existing = record.termExplanations[termKey];

  return {
    ...record,
    termExplanations: {
      ...record.termExplanations,
      [termKey]: {
        termKey,
        explainedAt: new Date().toISOString(),
        explanationVersion: 'product-setup-v1',
        userAcknowledged: existing?.userAcknowledged,
        timesShown: (existing?.timesShown ?? 0) + 1,
      },
    },
    updatedAtIso: new Date().toISOString(),
  };
}

export function setProductSetupSuggestedUpdates(
  record: ProductSetupRecord,
  updates: ProductSetupSuggestedUpdate[],
): ProductSetupRecord {
  const acceptedUpdates = filterProductSetupSuggestedUpdates(record, updates);
  if (acceptedUpdates.length === 0) return record;

  const fieldsWithUserUpdates = new Set(
    acceptedUpdates.filter((update) => update.sourceType === 'user_message').map((update) => update.fieldKey),
  );
  const byId = new Map(
    record.pendingSuggestedUpdates
      .filter((update) => !(fieldsWithUserUpdates.has(update.fieldKey) && update.sourceType === 'assistant_inference'))
      .map((update) => [update.id, update]),
  );
  acceptedUpdates.forEach((update) => byId.set(update.id, update));

  return {
    ...record,
    revision: nextProductSetupRevision(record),
    pendingSuggestedUpdates: [...byId.values()],
    updatedAtIso: new Date().toISOString(),
  };
}

export function mergeProductSetupSuggestedUpdates(
  ...updateGroups: ProductSetupSuggestedUpdate[][]
): ProductSetupSuggestedUpdate[] {
  const byField = new Map<ProductSetupFieldKey, ProductSetupSuggestedUpdate>();

  updateGroups.flat().forEach((update) => {
    const existing = byField.get(update.fieldKey);
    if (!existing) {
      byField.set(update.fieldKey, update);
      return;
    }

    if (productSetupValuesEqual(existing.proposedValue, update.proposedValue)) {
      if (existing.sourceType !== update.sourceType) {
        byField.set(update.fieldKey, existing.sourceType === 'user_message' ? existing : update);
        return;
      }
      byField.set(update.fieldKey, update.confidence > existing.confidence ? update : existing);
      return;
    }

    if (existing.fieldKey === 'protocol_base' && existing.sourceType === 'user_message') return;
    if (existing.sourceType === 'assistant_inference' && update.sourceType === 'user_message') {
      byField.set(update.fieldKey, update);
      return;
    }
    if (existing.sourceType === update.sourceType && update.confidence >= existing.confidence + 0.08) {
      byField.set(update.fieldKey, update);
    }
  });

  return [...byField.values()];
}

export function reconcileProductSetupSuggestedUpdates(
  record: ProductSetupRecord,
  updates: ProductSetupSuggestedUpdate[],
  context: {
    userMessage?: string;
    intakeMode?: ProductSetupIntakeMode;
  } = {},
): ProductSetupSuggestionReconciliationResult {
  const acceptedUpdates = filterProductSetupSuggestedUpdates(record, updates, context);
  const dispositionById = new Map(
    acceptedUpdates.map((update) => [update.id, classifyProductSetupSuggestedUpdate(record, update, context)]),
  );
  const appliedUpdates = acceptedUpdates.filter((update) => dispositionById.get(update.id)?.disposition === 'apply');
  const pendingUpdates = acceptedUpdates.filter((update) => dispositionById.get(update.id)?.disposition === 'review');
  const rejectedUpdates = acceptedUpdates
    .filter((update) => dispositionById.get(update.id)?.disposition === 'reject')
    .map((update) => ({
      fieldKey: update.fieldKey,
      value: update.proposedValue,
      sourceRef: update.sourceRef,
      reason: dispositionById.get(update.id)?.reason ?? 'Not applied by Product Setup reducer policy.',
    }));
  const appliedFieldKeys = new Set(appliedUpdates.map((update) => update.fieldKey));

  const recordAfterAppliedUpdates = appliedUpdates.reduce((currentRecord, update) => {
    const updatedRecord = updateProductSetupField(currentRecord, {
      fieldKey: update.fieldKey,
      value: update.proposedValue,
      sourceType: update.sourceType,
      sourceRef: update.sourceRef,
      status: 'user_stated',
      confidence: update.confidence,
    });

    return {
      ...updatedRecord,
      pendingSuggestedUpdates: updatedRecord.pendingSuggestedUpdates.filter(
        (pendingUpdate) => pendingUpdate.fieldKey !== update.fieldKey,
      ),
    };
  }, record);

  const recordAfterPendingUpdates = pendingUpdates.length > 0
    ? setProductSetupSuggestedUpdates(recordAfterAppliedUpdates, pendingUpdates)
    : recordAfterAppliedUpdates;

  return {
    record: {
      ...recordAfterPendingUpdates,
      pendingSuggestedUpdates: recordAfterPendingUpdates.pendingSuggestedUpdates.filter(
        (pendingUpdate) => !appliedFieldKeys.has(pendingUpdate.fieldKey),
      ),
    },
    acceptedUpdates,
    appliedUpdates,
    pendingUpdates,
    rejectedUpdates,
  };
}

export function reconcileProductSetupIntake(
  record: ProductSetupRecord,
  input: {
    userMessage: string;
    sourceRef: string;
    structuredSuggestions?: ProductSetupSuggestedUpdate[];
    unsupportedRequirementDecisions?: UnsupportedRequirementDecision[];
    previousRecordRevision?: number;
    idempotencyKey?: string;
    committedIdempotencyKeys?: Iterable<string>;
  },
): ProductSetupIntakeReconciliationResult {
  const intakeMode = classifyProductSetupIntakeMode(input.userMessage);
  const idempotencyKey = input.idempotencyKey ?? createProductSetupIntakeIdempotencyKey(input.sourceRef, input.userMessage);
  const previousRecordRevision = input.previousRecordRevision ?? productSetupRevision(record);
  const reviewBatchId = `review_${input.sourceRef}`;
  const committedIdempotencyKeys = Array.from(input.committedIdempotencyKeys ?? []);

  if (committedIdempotencyKeys.includes(idempotencyKey)) {
    const transaction = createProductSetupIntakeTransaction({
      sourceRef: input.sourceRef,
      sourceTurnId: input.sourceRef,
      idempotencyKey,
      intakeMode,
      previousRecordRevision,
      nextRecordRevision: productSetupRevision(record),
      reviewBatchId,
      beforeRecord: record,
      afterRecord: record,
      appliedFacts: [],
      reviewFacts: [],
      rejectedFacts: [
        {
          sourceRef: input.sourceRef,
          reason: 'Duplicate Product Setup intake ignored by idempotency key.',
        },
      ],
      derivedFacts: [],
      handoffCandidates: [],
      clarifyingQuestions: createProductSetupClarifyingQuestions(record, reviewBatchId),
    });

    return {
      record,
      acceptedUpdates: [],
      appliedUpdates: [],
      pendingUpdates: [],
      rejectedUpdates: transaction.rejectedFacts,
      mergedSuggestions: [],
      unsupportedRequirementDecisions: [],
      committedFacts: [],
      appliedFacts: [],
      reviewFacts: [],
      derivedFacts: [],
      transaction,
    };
  }

  const canMutateFromTurn = intakeMode === 'commit_candidate' || intakeMode === 'correction';
  const localSuggestions = canMutateFromTurn ? createProductSetupSuggestionsFromText(input.userMessage, input.sourceRef) : [];
  const structuredSuggestions = canMutateFromTurn ? (input.structuredSuggestions ?? []) : [];
  const mergedSuggestions = mergeProductSetupSuggestedUpdates(localSuggestions, structuredSuggestions);
  const beforeDerivedMaturityDate = fieldDisplayValue(record.fields.derived_maturity_date);
  const reconciled = reconcileProductSetupSuggestedUpdates(record, mergedSuggestions, {
    userMessage: input.userMessage,
    intakeMode,
  });
  const unsupportedRequirementDecisions = canMutateFromTurn
    ? (input.unsupportedRequirementDecisions ?? createUnsupportedRequirementDecisionsFromText(input.userMessage, input.sourceRef))
    : [];
  const recordWithUnsupportedDecisions =
    unsupportedRequirementDecisions.length > 0
      ? setUnsupportedRequirementDecisions(reconciled.record, unsupportedRequirementDecisions)
      : reconciled.record;
  const afterDerivedMaturityDate = fieldDisplayValue(recordWithUnsupportedDecisions.fields.derived_maturity_date);
  const committedFacts: ProductSetupCommittedFact[] = [
    ...reconciled.appliedUpdates.map((update) => ({
      fieldKey: update.fieldKey,
      value: update.proposedValue,
      sourceType: update.sourceType,
      sourceRef: update.sourceRef,
      confidence: update.confidence,
      disposition: 'applied' as const,
      previousValue: record.fields[update.fieldKey].value,
      uncertaintyMarkers: update.uncertaintyMarkers,
    })),
    ...reconciled.pendingUpdates.map((update) => ({
      fieldKey: update.fieldKey,
      value: update.proposedValue,
      sourceType: update.sourceType,
      sourceRef: update.sourceRef,
      confidence: update.confidence,
      disposition: 'pending_review' as const,
      previousValue: record.fields[update.fieldKey].value,
      reviewReason: classifyProductSetupSuggestedUpdate(record, update, {
        userMessage: input.userMessage,
        intakeMode,
      }).reason,
      uncertaintyMarkers:
        update.uncertaintyMarkers ?? findProductSetupUncertaintyMarkersForUpdate(update, input.userMessage),
    })),
  ];

  if (afterDerivedMaturityDate && afterDerivedMaturityDate !== beforeDerivedMaturityDate) {
    committedFacts.push({
      fieldKey: 'derived_maturity_date',
      value: afterDerivedMaturityDate,
      sourceType: 'system_default',
      sourceRef: 'derived_from_launch_date_and_duration',
      confidence: 1,
      disposition: 'derived',
    });
  }
  const appliedFacts = committedFacts.filter((fact) => fact.disposition === 'applied');
  const reviewFacts = committedFacts.filter((fact) => fact.disposition === 'pending_review');
  const derivedFacts = committedFacts.filter((fact) => fact.disposition === 'derived');
  const transaction = createProductSetupIntakeTransaction({
    sourceRef: input.sourceRef,
    sourceTurnId: input.sourceRef,
    idempotencyKey,
    intakeMode,
    previousRecordRevision,
    nextRecordRevision: productSetupRevision(recordWithUnsupportedDecisions),
    rebasedFromRevision: previousRecordRevision < productSetupRevision(record) ? previousRecordRevision : undefined,
    reviewBatchId,
    beforeRecord: record,
    afterRecord: recordWithUnsupportedDecisions,
    appliedFacts,
    reviewFacts,
    rejectedFacts: reconciled.rejectedUpdates,
    derivedFacts,
    handoffCandidates: toProductSetupDownstreamHandoffs(recordWithUnsupportedDecisions).filter(
      (note) => note.status === 'draft_note_ready',
    ),
    clarifyingQuestions: createProductSetupClarifyingQuestions(recordWithUnsupportedDecisions, reviewBatchId),
  });

  return {
    ...reconciled,
    record: recordWithUnsupportedDecisions,
    mergedSuggestions,
    unsupportedRequirementDecisions,
    committedFacts,
    appliedFacts,
    reviewFacts,
    derivedFacts,
    transaction,
  };
}

function classifyProductSetupIntakeMode(userMessage: string): ProductSetupIntakeMode {
  const normalized = userMessage.trim().toLowerCase();
  if (/^(what|why|how|can you|could you|please explain)\b/.test(normalized)) return 'question';
  if (/\b(what if|compare|would it|should we)\b/.test(normalized)) return 'question';
  if (/^(yes|confirm|confirmed|correct|that is correct|looks right)\b/.test(normalized)) return 'confirmation';
  if (/^(no|reject|exclude|remove|dismiss)\b/.test(normalized)) return 'rejection';
  if (/\b(actually|instead|change (?:it|this|that)?\s*to|make (?:it|this|that)?\s*|not .+ but|this time not|should be)\b/.test(normalized)) {
    return 'correction';
  }
  return 'commit_candidate';
}

function createProductSetupIntakeIdempotencyKey(sourceRef: string, userMessage: string): string {
  let hash = 0;
  const input = `${sourceRef}:${userMessage}`;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return `product_setup_intake_${sourceRef}_${hash.toString(16)}`;
}

function createProductSetupIntakeTransaction(input: {
  sourceRef: string;
  sourceTurnId: string;
  idempotencyKey: string;
  intakeMode: ProductSetupIntakeMode;
  previousRecordRevision: number;
  nextRecordRevision: number;
  rebasedFromRevision?: number;
  reviewBatchId: string;
  beforeRecord: ProductSetupRecord;
  afterRecord: ProductSetupRecord;
  appliedFacts: ProductSetupCommittedFact[];
  reviewFacts: ProductSetupCommittedFact[];
  rejectedFacts: ProductSetupRejectedFact[];
  derivedFacts: ProductSetupCommittedFact[];
  handoffCandidates: ProductSetupHandoffNote[];
  clarifyingQuestions: ProductSetupClarifyingQuestion[];
}): ProductSetupIntakeTransaction {
  const recordDiff = createProductSetupRecordDiff(input.beforeRecord, input.afterRecord);
  const recordPatch = Object.fromEntries(recordDiff.map((diff) => [diff.fieldKey, diff.after])) as Partial<
    Record<ProductSetupFieldKey, ProductSetupFieldValue | undefined>
  >;

  return {
    id: `product_setup_intake_${input.sourceRef}`,
    idempotencyKey: input.idempotencyKey,
    sourceRef: input.sourceRef,
    sourceTurnId: input.sourceTurnId,
    intakeMode: input.intakeMode,
    previousRecordRevision: input.previousRecordRevision,
    nextRecordRevision: input.nextRecordRevision,
    rebasedFromRevision: input.rebasedFromRevision,
    reviewBatchId: input.reviewBatchId,
    appliedFacts: input.appliedFacts,
    reviewFacts: input.reviewFacts,
    rejectedFacts: input.rejectedFacts,
    derivedFacts: input.derivedFacts,
    handoffCandidates: input.handoffCandidates,
    clarifyingQuestions: input.clarifyingQuestions,
    recordPatch,
    recordDiff,
    botClaimSummary: createProductSetupBotClaimSummary(
      input.afterRecord,
      input.appliedFacts,
      input.reviewFacts,
      input.rejectedFacts,
      input.derivedFacts,
    ),
  };
}

function createProductSetupRecordDiff(
  beforeRecord: ProductSetupRecord,
  afterRecord: ProductSetupRecord,
): ProductSetupRecordFieldDiff[] {
  const diffs: ProductSetupRecordFieldDiff[] = [];

  allProductSetupFieldKeys.forEach((fieldKey) => {
    const before = beforeRecord.fields[fieldKey];
    const after = afterRecord.fields[fieldKey];
    if (
      productSetupValuesEqual(before.value, after.value) &&
      before.status === after.status &&
      before.sourceRef === after.sourceRef
    ) {
      return;
    }
    diffs.push({
      fieldKey,
      before: before.value,
      after: after.value,
      beforeStatus: before.status,
      afterStatus: after.status,
    });
  });

  return diffs;
}

function createProductSetupBotClaimSummary(
  record: ProductSetupRecord,
  appliedFacts: ProductSetupCommittedFact[],
  reviewFacts: ProductSetupCommittedFact[],
  rejectedFacts: ProductSetupRejectedFact[],
  derivedFacts: ProductSetupCommittedFact[],
): ProductSetupBotClaimSummary {
  const factLabel = (fact: ProductSetupCommittedFact) => {
    const label = record.fields[fact.fieldKey].label;
    const value = formatProductSetupFieldValue(fact.fieldKey, fact.value);
    return value ? `${label}: ${value}` : label;
  };
  return {
    recorded: appliedFacts.filter((fact) => fact.previousValue === undefined).map(factLabel),
    updated: appliedFacts.filter((fact) => fact.previousValue !== undefined).map((fact) => {
      const label = record.fields[fact.fieldKey].label;
      return `${label}: ${formatProductSetupFieldValue(fact.fieldKey, fact.value)} (was ${formatProductSetupFieldValue(
        fact.fieldKey,
        fact.previousValue,
      )})`;
    }),
    needsReview: reviewFacts.map(factLabel),
    notApplied: rejectedFacts.map((fact) =>
      fact.fieldKey ? `${record.fields[fact.fieldKey].label}: ${fact.reason}` : fact.reason,
    ),
    derived: derivedFacts.map(factLabel),
    stillNeeded: createProductSetupClarifyingQuestions(record).map((question) => question.prompt),
  };
}

const productSetupClarifyingQuestionFields: ProductSetupFieldKey[] = [
  'product_name',
  'product_launch_date',
  'product_wrapper',
  'underlying_asset_class',
  'product_structure',
  'base_currency',
  'eligible_investor_type',
  'offering_type',
  'nav_cadence',
  'subscription_cadence',
  'redemption_cadence',
  'subscription_payment_method',
  'redemption_payment_method',
  'whitelisted_wallets_required',
  'p2p_transfer_allowed',
  'duration_months',
  'protocol_base',
];

function createProductSetupClarifyingQuestions(
  record: ProductSetupRecord,
  reviewBatchId?: string,
): ProductSetupClarifyingQuestion[] {
  return productSetupClarifyingQuestionFields
    .filter((fieldKey) => !fieldDisplayValue(record.fields[fieldKey]) && record.fields[fieldKey].status === 'missing')
    .slice(0, 3)
    .map((fieldKey, index) => ({
      id: `clarify_${fieldKey}`,
      fieldKeys: [fieldKey],
      prompt: `Please provide ${record.fields[fieldKey].label.toLowerCase()}.`,
      priority: index === 0 ? 'high' : 'medium',
      reviewBatchId,
    }));
}

const directUserStatedProductSetupFields = new Set<ProductSetupFieldKey>([
  'product_name',
  'token_symbol',
  'product_launch_date',
  'product_wrapper',
  'underlying_asset_class',
  'product_structure',
  'offering_type',
  'eligible_investor_type',
  'maximum_investor_count',
  'product_type',
  'base_currency',
  'income_treatment',
  'protocol_base',
  'expected_investor_count',
  'investor_wallet_rule',
  'whitelisted_wallets_required',
  'p2p_transfer_allowed',
  'subscription_cadence',
  'subscription_payment_method',
  'subscription_stablecoins',
  'minimum_subscription_amount',
  'redemption_payment_method',
  'redemption_stablecoin_type',
  'redemption_cadence',
  'redemption_schedule',
  'income_payout_cadence',
  'income_payout_timing',
  'redemption_payout_cadence',
  'minimum_redemption_amount',
  'burn_lock_rule',
  'nav_cadence',
  'nav_price_assumption',
  'nav_upload_timing',
  'nav_source',
  'investor_update_rule',
  'subscription_window',
  'duration_months',
  'initial_distribution_date',
  'initial_investor_register_rule',
  'maturity_date',
  'maturity_closeout_rule',
]);

type ProductSetupSuggestedUpdateDisposition = {
  disposition: 'apply' | 'review' | 'reject';
  reason?: string;
};

function classifyProductSetupSuggestedUpdate(
  record: ProductSetupRecord,
  update: ProductSetupSuggestedUpdate,
  context: { userMessage?: string; intakeMode?: ProductSetupIntakeMode } = {},
): ProductSetupSuggestedUpdateDisposition {
  const policy = productSetupFieldPolicy(update.fieldKey);
  const currentField = record.fields[update.fieldKey];
  const currentValue = currentField.value;
  const hasCurrentValue = currentValue !== undefined && currentValue !== null && currentValue !== '';
  const hasConfirmedValue = hasCurrentValue && currentField.status === 'user_confirmed';
  const hasUserValue = hasCurrentValue && (currentField.status === 'user_stated' || currentField.status === 'user_confirmed');
  const uncertaintyMarkers =
    update.uncertaintyMarkers ?? findProductSetupUncertaintyMarkersForUpdate(update, context.userMessage ?? '');

  if (policy.derived) {
    return { disposition: 'reject', reason: `${record.fields[update.fieldKey].label} is derived by ZiLi-OS from canonical inputs.` };
  }

  if (policy.commitPolicy === 'handoff_only') {
    return { disposition: 'review', reason: `${record.fields[update.fieldKey].label} is routed as a downstream handoff, not a Product Profile field.` };
  }

  if (policy.commitPolicy === 'reject_if_invalid' && !isValidProductSetupPolicyValue(update)) {
    return { disposition: 'reject', reason: invalidProductSetupPolicyReason(update) };
  }

  if (update.fieldKey === 'maximum_investor_count') {
    const investorCap = Number(update.proposedValue);
    if (Number.isFinite(investorCap) && investorCap > 50) {
      return { disposition: 'review', reason: 'Investor count exceeds the current 50-investor MVP cap.' };
    }
  }

  if (update.sourceType !== 'user_message') {
    return { disposition: 'review', reason: 'Assistant or system suggestions require user review before becoming Product Setup facts.' };
  }

  if (!directUserStatedProductSetupFields.has(update.fieldKey)) {
    return { disposition: 'review', reason: `${record.fields[update.fieldKey].label} is not auto-committed from chat.` };
  }

  if (uncertaintyMarkers.length > 0) {
    return { disposition: 'review', reason: `User wording includes uncertainty: ${uncertaintyMarkers.join(', ')}.` };
  }

  if (hasConfirmedValue && !productSetupValuesEqual(currentValue, update.proposedValue)) {
    const correctionAllowed =
      context.intakeMode === 'correction' &&
      update.sourceType === 'user_message' &&
      (!update.observedIntent || update.observedIntent === 'negate_prior' || update.observedIntent === 'assert');
    if (!correctionAllowed) {
      return {
        disposition: 'review',
        reason: `${record.fields[update.fieldKey].label} is already confirmed; a clear correction is required before replacing it.`,
      };
    }
  }

  if (
    hasUserValue &&
    !productSetupValuesEqual(currentValue, update.proposedValue) &&
    policy.commitPolicy === 'review_if_changed' &&
    context.intakeMode !== 'correction'
  ) {
    return {
      disposition: 'review',
      reason: `${record.fields[update.fieldKey].label} changes an existing Product Setup value and needs review.`,
    };
  }

  if (policy.commitPolicy === 'always_review') {
    return { disposition: 'review', reason: `${record.fields[update.fieldKey].label} requires explicit confirmation.` };
  }

  const minimumConfidence = update.fieldKey === 'income_treatment' ? 0.72 : 0.78;
  if (update.confidence < minimumConfidence) {
    return { disposition: 'review', reason: `${record.fields[update.fieldKey].label} confidence is below the auto-commit threshold.` };
  }

  return { disposition: 'apply' };
}

function isValidProductSetupPolicyValue(update: ProductSetupSuggestedUpdate): boolean {
  if (update.fieldKey === 'prototype_network') return update.proposedValue === 'Sepolia testnet';
  if (update.fieldKey === 'distribution_jurisdiction') return update.proposedValue === 'Singapore';
  return update.proposedValue !== undefined && update.proposedValue !== '';
}

function invalidProductSetupPolicyReason(update: ProductSetupSuggestedUpdate): string {
  if (update.fieldKey === 'prototype_network') return 'Only Sepolia testnet is supported for the current MVP.';
  if (update.fieldKey === 'distribution_jurisdiction') return 'Distribution jurisdiction is locked to Singapore for the current MVP.';
  return 'Value is not valid for this Product Setup field.';
}

function findProductSetupUncertaintyMarkers(value: string): string[] {
  const normalized = value.toLowerCase();
  const markers = ['about', 'around', 'approximately', 'approx', 'roughly', 'maybe', 'not sure', 'circa', '~'];
  return markers.filter((marker) => normalized.includes(marker));
}

function findProductSetupUncertaintyMarkersForUpdate(
  update: ProductSetupSuggestedUpdate,
  userMessage: string,
): string[] {
  const valueText = String(update.proposedValue).toLowerCase();
  const normalized = userMessage.toLowerCase();
  if (update.fieldKey === 'income_treatment' || update.fieldKey === 'income_payout_cadence') {
    const fieldSpecificWindow = relevantUncertaintyWindowForField(update.fieldKey, normalized);
    if (fieldSpecificWindow) return findProductSetupUncertaintyMarkers(fieldSpecificWindow);
  }
  const valueIndex = valueText ? normalized.indexOf(valueText) : -1;
  const candidateWindow =
    valueIndex >= 0
      ? normalized.slice(Math.max(0, valueIndex - 24), Math.min(normalized.length, valueIndex + valueText.length + 24))
      : relevantUncertaintyWindowForField(update.fieldKey, normalized);
  return findProductSetupUncertaintyMarkers(candidateWindow);
}

function relevantUncertaintyWindowForField(fieldKey: ProductSetupFieldKey, normalizedMessage: string): string {
  const fieldPatterns: Partial<Record<ProductSetupFieldKey, RegExp>> = {
    expected_investor_count: /[^.!?;]*(?:investors?|wallets?)[^.!?;]*/i,
    maximum_investor_count: /[^.!?;]*(?:investors?|wallets?|max|cap)[^.!?;]*/i,
    income_treatment: /[^.!?;]*(?:income|dividend|distribution)[^.!?;]*/i,
    income_payout_cadence: /[^.!?;]*(?:income|dividend|distribution)[^.!?;]*/i,
    minimum_subscription_amount: /[^.!?;]*(?:minimum|minimum sub|minimum subscription)[^.!?;]*/i,
  };
  const match = normalizedMessage.match(fieldPatterns[fieldKey] ?? /$a/);
  return match?.[0] ?? '';
}

export function filterProductSetupSuggestedUpdates(
  record: ProductSetupRecord,
  updates: ProductSetupSuggestedUpdate[],
  context: {
    userMessage?: string;
    intakeMode?: ProductSetupIntakeMode;
  } = {},
): ProductSetupSuggestedUpdate[] {
  void context;
  return updates.filter((update) => shouldKeepProductSetupSuggestedUpdate(record, update));
}

function shouldKeepProductSetupSuggestedUpdate(
  record: ProductSetupRecord,
  update: ProductSetupSuggestedUpdate,
): boolean {
  const currentField = record.fields[update.fieldKey];
  const currentValue = currentField.value;
  const hasExplicitCurrentValue =
    currentValue !== undefined &&
    currentValue !== null &&
    ['user_stated', 'user_confirmed'].includes(currentField.status);

  if (!hasExplicitCurrentValue) return true;

  if (productSetupValuesEqual(currentValue, update.proposedValue)) {
    return false;
  }

  if (currentField.status === 'user_confirmed' && update.sourceType === 'user_message') {
    return true;
  }

  return update.sourceType !== 'assistant_inference';
}

function productSetupValuesEqual(
  left: ProductSetupFieldValue | undefined,
  right: ProductSetupFieldValue | undefined,
): boolean {
  if (left === undefined || right === undefined) return left === right;
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
  }

  return left === right;
}

export function confirmProductSetupUpdate(
  record: ProductSetupRecord,
  updateId: string,
): ProductSetupRecord {
  const update = record.pendingSuggestedUpdates.find((candidate) => candidate.id === updateId);
  if (!update) return record;

  return deriveProductSetupFields({
    ...record,
    revision: nextProductSetupRevision(record),
    fields: {
      ...record.fields,
      [update.fieldKey]: {
        ...record.fields[update.fieldKey],
        value: update.proposedValue,
        status: 'user_confirmed',
        sourceType: 'user_confirmation',
        sourceRef: update.sourceRef,
        confidence: update.confidence,
        confirmedByUser: true,
      },
    },
    pendingSuggestedUpdates: record.pendingSuggestedUpdates.filter((candidate) => candidate.id !== updateId),
    updatedAtIso: new Date().toISOString(),
  });
}

export function dismissProductSetupSuggestedUpdate(
  record: ProductSetupRecord,
  updateId: string,
): ProductSetupRecord {
  if (!record.pendingSuggestedUpdates.some((candidate) => candidate.id === updateId)) return record;

  return {
    ...record,
    revision: nextProductSetupRevision(record),
    pendingSuggestedUpdates: record.pendingSuggestedUpdates.filter((candidate) => candidate.id !== updateId),
    updatedAtIso: new Date().toISOString(),
  };
}

export function rejectProductSetupSuggestedUpdate(
  record: ProductSetupRecord,
  updateId: string,
): ProductSetupRecord {
  return dismissProductSetupSuggestedUpdate(record, updateId);
}

export function deferProductSetupField(
  record: ProductSetupRecord,
  fieldKey: ProductSetupFieldKey,
  reason = 'User chose to add this before deployment.',
): ProductSetupRecord {
  return deriveProductSetupFields({
    ...record,
    revision: nextProductSetupRevision(record),
    fields: {
      ...record.fields,
      [fieldKey]: {
        ...record.fields[fieldKey],
        status: 'deferred',
        sourceType: 'user_confirmation',
        sourceRef: 'user_deferred_in_product_setup',
        confirmedByUser: false,
        deferralReason: reason,
      },
    },
    updatedAtIso: new Date().toISOString(),
  });
}

export function updateProductSetupField(
  record: ProductSetupRecord,
  input: {
    fieldKey: ProductSetupFieldKey;
    value?: ProductSetupFieldValue;
    sourceType: ProductSetupFieldSourceType;
    sourceRef: string;
    status?: ProductSetupFieldStatus;
    confidence?: number;
    rolePlaceholder?: string;
    deferralReason?: string;
  },
): ProductSetupRecord {
  const nextStatus =
    input.status ??
    (input.value === undefined || input.value === '' || (Array.isArray(input.value) && input.value.length === 0)
      ? 'missing'
      : 'user_confirmed');
  const confirmedByUser = nextStatus === 'user_confirmed';

  return deriveProductSetupFields({
    ...record,
    revision: nextProductSetupRevision(record),
    fields: {
      ...record.fields,
      [input.fieldKey]: {
        ...record.fields[input.fieldKey],
        value: input.value,
        status: nextStatus,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
        confidence: input.confidence,
        confirmedByUser,
        rolePlaceholder: input.rolePlaceholder,
        deferralReason: input.deferralReason,
      },
    },
    updatedAtIso: new Date().toISOString(),
  });
}

export function handleProductSetupWalletInput(
  record: ProductSetupRecord,
  fieldKey: Extract<ProductSetupFieldKey, 'admin_wallet' | 'redemption_wallet' | 'subscription_receiving_wallet'>,
  value: string,
  sourceRef = 'direct_product_setup_wallet_input',
): { record: ProductSetupRecord; classification: ReturnType<typeof classifyWalletSetupResponse>; message: string } {
  const trimmed = value.trim();
  const classification = classifyWalletSetupResponse(trimmed);

  if (classification === 'unsafe_secret') {
    return {
      record,
      classification,
      message: 'Do not paste private keys, seed phrases, or recovery phrases. ZiLi-OS only needs public wallet addresses.',
    };
  }

  if (classification === 'address') {
    return {
      record: updateProductSetupField(record, {
        fieldKey,
        value: trimmed,
        sourceType: 'direct_form_input',
        sourceRef,
      }),
      classification,
      message: `${record.fields[fieldKey].label} saved as a public wallet address.`,
    };
  }

  if (classification === 'role_placeholder') {
    return {
      record: updateProductSetupField(record, {
        fieldKey,
        sourceType: 'direct_form_input',
        sourceRef,
        status: 'deferred',
        rolePlaceholder: trimmed,
        deferralReason: 'Role placeholder saved; public wallet address still needed before deployment.',
      }),
      classification,
      message: 'Role placeholder saved. Add the public wallet address before deployment.',
    };
  }

  if (classification === 'not_sure') {
    return {
      record: deferProductSetupField(record, fieldKey, 'User marked this wallet as to be added before deployment.'),
      classification,
      message: 'Marked as to be added before deployment.',
    };
  }

  return {
    record,
    classification,
    message: 'Enter a public EVM wallet address, a role placeholder, or "not sure yet".',
  };
}

export function acknowledgeProductSetupDeploymentWarnings(
  record: ProductSetupRecord,
  sourceRef = 'contract_ops_deployment_warning_acknowledgement',
): ProductSetupRecord {
  const warnings = toProductSetupDeploymentWarnings(record);
  if (warnings.length === 0) return record;
  const acknowledgedAtIso = new Date().toISOString();

  return {
    ...record,
    revision: nextProductSetupRevision(record),
    deploymentWarningAcknowledgements: [
      ...record.deploymentWarningAcknowledgements,
      {
        id: `deployment-warning-${acknowledgedAtIso}`,
        acknowledgedAtIso,
        warningFieldKeys: warnings.map((warning) => warning.fieldKey),
        likelyErrors: warnings.map((warning) => warning.likelyError),
        decision: 'proceed_with_warnings',
        sourceRef,
      },
    ],
    updatedAtIso: acknowledgedAtIso,
  };
}

export function setUnsupportedRequirementDecisions(
  record: ProductSetupRecord,
  decisions: UnsupportedRequirementDecision[],
): ProductSetupRecord {
  if (decisions.length === 0) return record;
  const byId = new Map(record.unsupportedRequirementDecisions.map((decision) => [decision.id, decision]));
  decisions.forEach((decision) => byId.set(decision.id, decision));

  return {
    ...record,
    revision: nextProductSetupRevision(record),
    unsupportedRequirementDecisions: [...byId.values()],
    updatedAtIso: new Date().toISOString(),
  };
}

export function decideUnsupportedRequirement(
  record: ProductSetupRecord,
  decisionId: string,
  decision: UnsupportedRequirementDecision['decision'],
): ProductSetupRecord {
  const updatedAtIso = new Date().toISOString();
  const targetDecision = record.unsupportedRequirementDecisions.find((item) => item.id === decisionId);
  const recordWithDecision: ProductSetupRecord = {
    ...record,
    revision: nextProductSetupRevision(record),
    unsupportedRequirementDecisions: record.unsupportedRequirementDecisions.map((item) =>
      item.id === decisionId ? { ...item, decision } : item,
    ),
    updatedAtIso,
  };

  if (!targetDecision || decision !== 'accepted_equivalent') {
    return recordWithDecision;
  }

  return applyAcceptedUnsupportedRequirementEquivalent(recordWithDecision, targetDecision);
}

type AcceptedEquivalentFieldUpdate = {
  fieldKey: ProductSetupFieldKey;
  value: ProductSetupFieldValue;
  confidence: number;
};

function applyAcceptedUnsupportedRequirementEquivalent(
  record: ProductSetupRecord,
  decision: UnsupportedRequirementDecision,
): ProductSetupRecord {
  const updates = acceptedEquivalentFieldUpdates(decision);
  if (updates.length === 0) return record;

  return updates.reduce(
    (currentRecord, update) =>
      updateProductSetupField(currentRecord, {
        fieldKey: update.fieldKey,
        value: update.value,
        sourceType: 'user_confirmation',
        sourceRef: decision.id,
        status: 'user_confirmed',
        confidence: update.confidence,
      }),
    record,
  );
}

function acceptedEquivalentFieldUpdates(decision: UnsupportedRequirementDecision): AcceptedEquivalentFieldUpdate[] {
  const normalized = `${decision.id} ${decision.requirement}`.toLowerCase();

  if (normalized.includes('p2p') || normalized.includes('peer-to-peer')) {
    return [
      {
        fieldKey: 'whitelisted_wallets_required',
        value: true,
        confidence: 0.94,
      },
      {
        fieldKey: 'p2p_transfer_allowed',
        value: true,
        confidence: 0.9,
      },
      {
        fieldKey: 'investor_wallet_rule',
        value:
          'Approved investors may transfer peer-to-peer only to other approved wallets; matching, liquidity, and settlement workflow are excluded from MVP execution.',
        confidence: 0.9,
      },
    ];
  }

  if (normalized.includes('clawback') || normalized.includes('conditional transfers')) {
    return [
      {
        fieldKey: 'whitelisted_wallets_required',
        value: true,
        confidence: 0.9,
      },
      {
        fieldKey: 'investor_wallet_rule',
        value:
          'Approved wallets only; transfers stay between approved wallets. Clawback remains manual exception handling outside MVP execution.',
        confidence: 0.86,
      },
    ];
  }

  if (normalized.includes('wallet-push') || normalized.includes('push investment information')) {
    return [
      {
        fieldKey: 'investor_update_rule',
        value:
          'ZiLi-OS should prepare investor update records; wallet-pushed notices remain outside MVP execution.',
        confidence: 0.84,
      },
    ];
  }

  if (normalized.includes('auto-oracle') || normalized.includes('oracle-driven')) {
    return [
      {
        fieldKey: 'nav_source',
        value: 'Reviewed uploaded or source-checked valuation input; automatic oracle ingestion is outside MVP execution.',
        confidence: 0.82,
      },
    ];
  }

  if (normalized.includes('legal-compliance') || normalized.includes('legal or regulatory compliance')) {
    return [
      {
        fieldKey: 'compliance_model',
        value:
          'Whitelist-based transfer restrictions; legal and compliance determinations remain counsel/compliance confirmation items.',
        confidence: 0.82,
      },
    ];
  }

  return [];
}

export type ProductSetupPackGenerationOptions = {
  generatedAtIso?: string;
  versionLabel?: string;
  mode?: 'standard' | 'deterministic_fallback';
};

export function createProductSetupPrdArtifactKey(
  record: ProductSetupRecord,
  options: Pick<ProductSetupPackGenerationOptions, 'mode'> = {},
): string {
  return [
    'product-setup-prd',
    record.id,
    `r${productSetupRevision(record)}`,
    PRODUCT_SETUP_PRD_GENERATOR_VERSION,
    options.mode ?? 'standard',
  ].join(':');
}

export function createProductSetupPackPayload(
  record: ProductSetupRecord,
  readModel = toProductSetupReadModel(record),
  options: ProductSetupPackGenerationOptions = {},
) {
  const generatedAtIso = options.generatedAtIso ?? new Date().toISOString();
  const versionLabel = options.versionLabel ?? 'v1.0';
  const definitions = [
    'Admin wallet: public blockchain address allowed to manage important token settings. Never provide private keys or seed phrases.',
    'Subscription receiving wallet: public wallet address or payment contract where investors send stablecoins when subscribing.',
    'Redemption wallet: public wallet address where investors send tokens when requesting redemption.',
    'Mint: create new tokens, usually after subscription approval.',
    'Burn: permanently remove tokens from circulation, usually after redemption or maturity.',
    'Whitelisted wallet: wallet address approved to receive or hold the product token.',
    'Protocol base: token contract pattern used to represent the product on-chain.',
    'Subscription cadence: how often investors can subscribe into the product.',
    'Redemption cadence: how often investors can request redemption.',
    'Income payout cadence: how often distributions, dividends, coupons, or income-like payouts are expected.',
    'Redemption payout cadence: how often redemption cash or stablecoin payouts are settled.',
  ];
  const fields = Object.values(record.fields).map((field) => ({
    requirement: field.label,
    userInput: formatProductSetupFieldValue(field.key, field.value) || field.rolePlaceholder || 'Not provided',
    interpretation:
      field.deferralReason ||
      field.rolePlaceholder ||
      formatProductSetupFieldValue(field.key, field.value) ||
      'Needed before relevant workflow activation',
    source: field.sourceType ?? 'missing',
    status: field.status,
    usedByTabs: field.usedByTabs,
  }));

  return {
    recordId: record.id,
    recordRevision: productSetupRevision(record),
    generatorVersion: PRODUCT_SETUP_PRD_GENERATOR_VERSION,
    artifactKey: createProductSetupPrdArtifactKey(record, options),
    artifactId: `product-setup-prd-${record.id}-${versionLabel.replaceAll('.', '-')}`,
    versionLabel,
    displayVersion: `Product PRD ${versionLabel}`,
    generatedAtIso,
    packStatus: 'PRD generated',
    warning: readModel.packPreview.warning,
    statusLabel: readModel.statusLabel,
    readinessLabel: readModel.readinessLabel,
    readinessState: readModel.packPreview.status,
    criticalDeferredFields: readModel.criticalDeferredEssentials.map((field) => field.label),
    nonCriticalDeferredFields: readModel.nonCriticalDeferredEssentials.map((field) => field.label),
    missingEssentialFields: readModel.missingEssentials.map((field) => field.label),
    recommendedArchitectureTarget: readModel.protocolRecommendation.recommendedProtocol,
    currentExecutablePrototype: readModel.protocolRecommendation.executablePrototypeLabel,
    definitions,
    profileRows: readModel.profileRows,
    downstreamHandoffs: readModel.downstreamHandoffs,
    fields,
    deploymentWarnings: readModel.deploymentWarnings,
    deploymentWarningAcknowledgements: record.deploymentWarningAcknowledgements,
    unsupportedRequirementDecisions: record.unsupportedRequirementDecisions,
  };
}

export function createProductSetupPrdMarkdown(
  record: ProductSetupRecord,
  readModel = toProductSetupReadModel(record),
  options: ProductSetupPackGenerationOptions = {},
): string {
  const payload = createProductSetupPackPayload(record, readModel, options);
  const productName = productSetupProseField(record, 'product_name', 'the tokenised product');
  const tokenSymbol = productSetupProseField(record, 'token_symbol', 'the token symbol');
  const productWrapper = productSetupProseField(record, 'product_wrapper', 'product wrapper not yet specified');
  const productStructure = productSetupProseField(record, 'product_structure', 'term type not yet specified');
  const underlyingAssetClass = productSetupAssetClassProse(record);
  const launchDate = productSetupProseField(record, 'product_launch_date', 'launch date not yet specified');
  const durationMonths = productSetupProseField(record, 'duration_months', 'duration not yet specified');
  const maturityDate = productSetupProseField(record, 'derived_maturity_date', 'maturity date not yet derived');
  const baseCurrency = productSetupProseField(record, 'base_currency', 'base currency not yet specified');
  const offeringType = productSetupOfferingTypeProse(record);
  const eligibleInvestorType = productSetupProseField(record, 'eligible_investor_type', 'eligible investor type not yet specified');
  const maxInvestors = productSetupProseField(record, 'maximum_investor_count', 'maximum investor count not yet specified');
  const jurisdiction = productSetupProseField(record, 'distribution_jurisdiction', 'distribution jurisdiction not yet specified');
  const transferRule = productSetupTransferRuleProse(record);
  const navCadence = productSetupProseField(record, 'nav_cadence', 'NAV cadence not yet specified');
  const navUploadMethod = productSetupProseField(record, 'nav_upload_method', 'NAV upload method not yet specified');
  const navPriceAssumption = productSetupProseField(record, 'nav_price_assumption', 'NAV price assumption not yet specified');
  const navUploadTiming = productSetupProseField(record, 'nav_upload_timing', 'NAV upload timing not yet specified');
  const navSource = productSetupProseField(record, 'nav_source', 'NAV source not yet specified');
  const subscriptionCadence = productSetupProseField(record, 'subscription_cadence', 'subscription cadence not yet specified');
  const subscriptionWindow = productSetupProseField(record, 'subscription_window', 'subscription window not yet specified');
  const subscriptionPayment = productSetupProseField(record, 'subscription_payment_method', 'subscription payment method not yet specified');
  const minimumSubscription = productSetupProseField(record, 'minimum_subscription_amount', 'minimum subscription amount not yet specified');
  const redemptionCadence = productSetupProseField(record, 'redemption_cadence', 'redemption cadence not yet specified');
  const redemptionPayment = productSetupProseField(record, 'redemption_payment_method', 'redemption payment method not yet specified');
  const minimumRedemption = productSetupProseField(record, 'minimum_redemption_amount', 'minimum redemption amount not yet specified');
  const incomeTreatment = productSetupProseField(record, 'income_treatment', 'income treatment not yet specified');
  const incomePayoutCadence = productSetupProseField(record, 'income_payout_cadence', 'income payout cadence not yet specified');
  const incomePayoutTiming = productSetupProseField(record, 'income_payout_timing', 'income payout timing not yet specified');
  const burnLockRule = productSetupProseField(record, 'burn_lock_rule', 'burn or lock rule not yet specified');
  const protocolBase = productSetupProseField(record, 'protocol_base', 'protocol base not yet selected');
  const prototypeNetwork = productSetupProseField(record, 'prototype_network', 'prototype network not yet specified');
  const complianceModel = productSetupProseField(record, 'compliance_model', 'compliance model not yet specified');
  const evidenceModel = productSetupProseField(record, 'evidence_model', 'evidence model not yet specified');
  const fieldRows = payload.fields
    .map((field) => productSetupMarkdownTableRow([field.requirement, field.userInput, field.interpretation, field.source, field.status]))
    .join('\n');
  const unsupportedRows = payload.unsupportedRequirementDecisions.length > 0
    ? payload.unsupportedRequirementDecisions.map((decision) => `- ${markdownInlineText(`${decision.requirement}: ${decision.decision}. ${decision.nearestEquivalent ?? decision.mismatchReason}`)}`).join('\n')
    : '- No unsupported/custom requirements recorded.';
  const profileRows = payload.profileRows
    .map((row) => productSetupMarkdownTableRow([row.label, row.value, row.provenanceLabel]))
    .join('\n');
  const handoffRows = payload.downstreamHandoffs.length > 0
    ? payload.downstreamHandoffs.map((handoff) => productSetupMarkdownTableRow([handoff.title, productSetupHandoffTargetLabel(handoff.target), handoff.status.replaceAll('_', ' '), handoff.detail])).join('\n')
    : '| None | - | - | No downstream handoffs recorded. |';
  const criticalDeferrals =
    payload.criticalDeferredFields.length > 0
      ? payload.criticalDeferredFields.map((label) => `- ${markdownInlineText(label)}: explicitly deferred and requires review before clean PRD readiness.`).join('\n')
      : '- No critical deferred Product Setup fields.';
  const missingEssentials =
    payload.missingEssentialFields.length > 0
      ? payload.missingEssentialFields.map((label) => `- ${markdownInlineText(label)}: not yet provided.`).join('\n')
      : '- No missing essential Product Setup fields.';
  const openDecisionItems = productSetupOpenDecisionItems(record, readModel);
  const openDecisions =
    openDecisionItems.length > 0
      ? openDecisionItems.map((item) => `- ${markdownInlineText(item)}`).join('\n')
      : '- No open Product Setup decisions recorded for this PRD draft.';

  return [
    `# ZiLi-OS Product Requirements Document ${payload.versionLabel}`,
    '',
    `Generated at: ${payload.generatedAtIso}`,
    `Record revision: ${payload.recordRevision}`,
    `Generator: ${payload.generatorVersion}`,
    '',
    `> ${payload.warning}`,
    '',
    '## 1. Executive Summary',
    '',
    `- Product Setup status: ${payload.statusLabel}`,
    `- Readiness: ${payload.readinessLabel}`,
    `- PRD readiness state: ${payload.readinessState}`,
    '',
    `${productName} is a ${productStructure.toLowerCase()} ${productWrapper.toLowerCase()} represented in the Product Setup by token symbol ${tokenSymbol}. The product references ${underlyingAssetClass.toLowerCase()} and uses ${baseCurrency} as the base currency for valuation, subscription, redemption, and evidence assumptions.`,
    '',
    `The current Product Setup states that the product will launch on ${launchDate}, run for ${durationMonths}, and mature on ${maturityDate}. Investor participation is limited to ${eligibleInvestorType.toLowerCase()} under a ${offeringType.toLowerCase()} model in ${jurisdiction}.`,
    '',
    '## 2. Product Terms',
    '',
    `This PRD records the product as ${productStructure.toLowerCase()} with a maximum of ${maxInvestors} investors. These product terms are the canonical inputs used by Product Setup and passed downstream only after they are recorded or confirmed in the Product Setup record.`,
    '',
    '### Canonical Terms',
    '',
    '| Attribute | Value | Provenance |',
    '| --- | --- | --- |',
    profileRows,
    '',
    '## 3. Investor Eligibility And Transfer Rules',
    '',
    `Investor eligibility is handled offchain before wallet whitelisting. ${transferRule} This means Investor Wallets owns wallet registration and whitelist evidence, while Contract Ops consumes the resulting whitelist rule as a smart-contract transfer-control input.`,
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Offering type', 'Eligible investor type', 'Maximum number of investors', 'Distribution jurisdiction', 'Whitelisted wallets required', 'P2P transfer allowed']),
    '',
    '## 4. NAV, Subscription, Redemption, And Income Timetable',
    '',
    `NAV servicing is configured as ${navCadence}. The current NAV price assumption is ${navPriceAssumption}. NAV is expected to be handled through ${navUploadMethod}, with timing recorded as: ${navUploadTiming}. The stated NAV source is ${navSource}.`,
    '',
    `Subscriptions follow ${subscriptionCadence}. The subscription window is recorded as: ${subscriptionWindow}. Subscription payments are recorded as ${subscriptionPayment}, with a minimum subscription amount of ${minimumSubscription}.`,
    '',
    `Redemptions follow ${redemptionCadence}. Redemption payments are recorded as ${redemptionPayment}, with a minimum redemption amount of ${minimumRedemption}. Income treatment is ${incomeTreatment}; income payout cadence is ${incomePayoutCadence}, with timing recorded as: ${incomePayoutTiming}.`,
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, [
      'NAV cadence',
      'NAV price assumption',
      'NAV upload method',
      'NAV upload timing',
      'NAV source',
      'Subscription / mint cadence',
      'Subscription window',
      'Subscription payment method',
      'Subscription stablecoin type',
      'Minimum subscription amount',
      'Redemption / burn cadence',
      'Redemption payment method',
      'Redemption stablecoin type',
      'Minimum redemption amount',
      'Income treatment',
      'Income payout cadence',
      'Income payout timing',
    ]),
    '',
    '## 5. Smart Contract And Contract Ops Inputs',
    '',
    `- Recommended architecture target: ${payload.recommendedArchitectureTarget}`,
    `- Current executable prototype: ${payload.currentExecutablePrototype}`,
    `- Selected protocol base: ${protocolBase}`,
    `- Prototype network: ${prototypeNetwork}`,
    `- Compliance model: ${complianceModel}`,
    '',
    `Contract Ops should consume these values from the Product Setup snapshot instead of reconstructing them from chat. The currently recorded token handling rule is ${burnLockRule}; this remains an open Contract Ops/Redemption decision when not yet specified.`,
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Blockchain network', 'Protocol base', 'Compliance model', 'Burn / lock rule', 'Admin wallet', 'Redemption wallet']),
    '',
    '## 6. Downstream Tab Handoff Summary',
    '',
    '| Detail | Destination tab | Status | Draft note |',
    '| --- | --- | --- | --- |',
    handoffRows,
    '',
    '## 7. Open Decisions And Review Items',
    '',
    '### Missing Essential Fields',
    '',
    missingEssentials,
    '',
    '### Critical Deferred Fields',
    '',
    criticalDeferrals,
    '',
    '### Open Operational Decisions',
    '',
    openDecisions,
    '',
    '## 8. Evidence And Versioning',
    '',
    `Evidence model: ${evidenceModel}. PRD generation is local-session evidence until stored in Evidence Vault. Versioning uses record revision ${payload.recordRevision}, generator ${payload.generatorVersion}, and artifact key ${payload.artifactKey}.`,
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Evidence model']),
    '',
    '## 9. Definitions Used In This Product Setup',
    '',
    ...payload.definitions.map((definition) => `- ${definition}`),
    '',
    '## Appendix A. Full Product Requirements And Provenance',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRows,
    '',
    '## Appendix B. Unsupported Or Custom Requirements',
    '',
    unsupportedRows,
  ].join('\n');
}

function fieldRowsForLabels(
  fields: ReturnType<typeof createProductSetupPackPayload>['fields'],
  labels: string[],
): string {
  const wanted = new Set(labels);
  const rows = fields
    .filter((field) => wanted.has(field.requirement))
    .map((field) => productSetupMarkdownTableRow([field.requirement, field.userInput, field.interpretation, field.source, field.status]));
  return rows.length > 0 ? rows.join('\n') : '| None | - | - | - | - |';
}

function productSetupMarkdownTableRow(cells: Array<string | number | boolean>): string {
  return `| ${cells.map((cell) => markdownTableCell(String(cell))).join(' | ')} |`;
}

function markdownTableCell(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|');
}

function markdownInlineText(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function productSetupProseField(record: ProductSetupRecord, fieldKey: ProductSetupFieldKey, fallback: string): string {
  const field = record.fields[fieldKey];
  const value = formatProductSetupFieldValue(fieldKey, field.value) || field.rolePlaceholder;
  if (!value) return fallback;
  return markdownInlineText(value);
}

function productSetupAssetClassProse(record: ProductSetupRecord): string {
  const value = productSetupProseField(record, 'underlying_asset_class', 'underlying asset class not yet specified');
  if (/^bonds$/i.test(value)) return 'Fixed income (bonds)';
  return value;
}

function productSetupOfferingTypeProse(record: ProductSetupRecord): string {
  const value = productSetupProseField(record, 'offering_type', 'offering type not yet specified');
  if (/^private$/i.test(value)) return 'Private placement';
  return value;
}

function productSetupTransferRuleProse(record: ProductSetupRecord): string {
  const whitelistRequired = record.fields.whitelisted_wallets_required.value === true;
  const p2pAllowed = record.fields.p2p_transfer_allowed.value === true;
  if (whitelistRequired && p2pAllowed) {
    return 'Wallets must be whitelisted, and peer-to-peer transfers are permitted only when both the sender and recipient are whitelisted.';
  }
  if (whitelistRequired) {
    return 'Wallets must be whitelisted before they can receive or hold tokens.';
  }
  if (p2pAllowed) {
    return 'Peer-to-peer transfers are allowed under the recorded Product Setup transfer rule.';
  }
  return 'Wallet whitelist and peer-to-peer transfer rules have not yet been fully specified.';
}

function productSetupOpenDecisionItems(record: ProductSetupRecord, readModel: ProductSetupReadModel): string[] {
  const items = new Set<string>();
  readModel.missingEssentials.forEach((field) => {
    items.add(`${field.label}: required before Product Setup can be treated as cleanly ready for downstream workflow use.`);
  });
  readModel.criticalDeferredEssentials.forEach((field) => {
    items.add(`${field.label}: explicitly deferred and requires review before clean PRD readiness.`);
  });

  const addIfMissing = (fieldKey: ProductSetupFieldKey, note: string) => {
    const field = record.fields[fieldKey];
    if (fieldDisplayValue(field) || field.rolePlaceholder || field.status === 'deferred') return;
    items.add(`${field.label}: ${note}`);
  };

  addIfMissing('admin_wallet', 'needed before wallet-signed Sepolia deployment can assign operational roles.');
  addIfMissing('burn_lock_rule', 'needed before Redemption and Contract Ops can encode burn versus lock handling.');
  addIfMissing('redemption_wallet', 'needed later if redemption operations require a public settlement wallet.');
  addIfMissing('nav_source', 'needed before Asset Servicing can evidence who uploads NAV.');

  return [...items];
}

export function createProductSetupPackMarkdown(record: ProductSetupRecord): string {
  return createProductSetupPrdMarkdown(record);
}

export function createProductSetupPrdDocxContent(
  record: ProductSetupRecord,
  readModel = toProductSetupReadModel(record),
  options: ProductSetupPackGenerationOptions = {},
): Uint8Array {
  const payload = createProductSetupPackPayload(record, readModel, options);
  return createStyledProductSetupPrdDocx(record, readModel, payload);
}

type ProductSetupPrdPayload = ReturnType<typeof createProductSetupPackPayload>;

type ProductSetupPrdTableRow = readonly string[];

const PRODUCT_SETUP_PRD_THEME = {
  primaryText: '2F3E46',
  primaryAccent: '007E8A',
  secondaryAccent: '8D99AE',
  backgroundNeutral: 'F8F9FA',
  white: 'FFFFFF',
  border: 'D9E2E8',
};

const PRODUCT_SETUP_PRD_CONTENT_WIDTH_DXA = 10080;

function createStyledProductSetupPrdDocx(
  record: ProductSetupRecord,
  readModel: ProductSetupReadModel,
  payload: ProductSetupPrdPayload,
): Uint8Array {
  const productName = productSetupProseField(record, 'product_name', 'Tokenised Product');
  const tokenSymbol = productSetupProseField(record, 'token_symbol', 'Symbol pending');
  const generatedAt = formatPrdGeneratedAt(payload.generatedAtIso);
  const title = 'ZiLi-OS Product Requirements Document';
  const headerLabel = `${productName} (${tokenSymbol})`;

  const documentBody = [
    docxTitleBlock(record, readModel, payload, generatedAt, title),
    docxHeading('1. Executive Summary', 1),
    docxParagraph(
      `${productName} is a ${productSetupProseField(record, 'product_structure', 'term type not yet specified').toLowerCase()} ${productSetupProseField(record, 'product_wrapper', 'product wrapper not yet specified').toLowerCase()} represented by token symbol ${tokenSymbol}. The product references ${productSetupAssetClassProse(record).toLowerCase()} and uses ${productSetupProseField(record, 'base_currency', 'base currency not yet specified')} as the base currency for valuation, subscription, redemption, and evidence assumptions.`,
    ),
    docxParagraph(
      `The current Product Setup records launch on ${productSetupProseField(record, 'product_launch_date', 'launch date not yet specified')}, a term of ${productSetupProseField(record, 'duration_months', 'duration not yet specified')}, and maturity on ${productSetupProseField(record, 'derived_maturity_date', 'maturity date not yet derived')}. Investor participation is captured as ${productSetupProseField(record, 'eligible_investor_type', 'eligible investor type not yet specified')} under a ${productSetupOfferingTypeProse(record).toLowerCase()} model in ${productSetupProseField(record, 'distribution_jurisdiction', 'distribution jurisdiction not yet specified')}.`,
    ),
    docxCallout([
      `Readiness: ${payload.readinessLabel}`,
      `PRD state: ${humanizeProductSetupStatus(payload.readinessState)}`,
      `Generated: ${generatedAt}`,
    ]),
    docxHeading('2. Product Profile', 1),
    docxParagraph('These are the canonical product terms used by Product Setup and staged for downstream lifecycle tabs after confirmation.'),
    docxTable(
      ['Attribute', 'Value', 'Provenance'],
      payload.profileRows.map((row) => [row.label, row.value, row.provenanceLabel]),
      [2900, 5200, 1980],
    ),
    docxHeading('3. Investor Eligibility And Transfer Rules', 1),
    docxParagraph(
      `Investor eligibility is handled offchain before wallet whitelisting. ${productSetupTransferRuleProse(record)} Investor Wallets owns wallet registration and whitelist evidence; Contract Ops consumes the confirmed rule as a smart-contract transfer-control input.`,
    ),
    docxTable(
      ['Requirement', 'User input', 'ZiLi-OS interpretation', 'Status'],
      productSetupDocxRowsForLabels(payload.fields, [
        'Offering type',
        'Eligible investor type',
        'Maximum number of investors',
        'Distribution jurisdiction',
        'Whitelisted wallets required',
        'P2P transfer allowed',
      ], record),
      [2600, 2500, 3400, 1580],
    ),
    docxHeading('4. NAV, Subscription, Redemption And Income', 1),
    docxParagraph(
      `NAV servicing is configured as ${productSetupProseField(record, 'nav_cadence', 'NAV cadence not yet specified')}. The NAV price assumption is ${productSetupProseField(record, 'nav_price_assumption', 'NAV price assumption not yet specified')}, handled through ${productSetupProseField(record, 'nav_upload_method', 'NAV upload method not yet specified')} with timing recorded as ${productSetupProseField(record, 'nav_upload_timing', 'NAV upload timing not yet specified')}.`,
    ),
    docxParagraph(
      `Subscriptions follow ${productSetupProseField(record, 'subscription_cadence', 'subscription cadence not yet specified')}; the subscription window is ${productSetupProseField(record, 'subscription_window', 'subscription window not yet specified')}. Redemptions follow ${productSetupProseField(record, 'redemption_cadence', 'redemption cadence not yet specified')}. Income is recorded as ${productSetupProseField(record, 'income_treatment', 'income treatment not yet specified')} with payout timing ${productSetupProseField(record, 'income_payout_timing', 'income payout timing not yet specified')}.`,
    ),
    docxTable(
      ['Requirement', 'User input', 'ZiLi-OS interpretation', 'Status'],
      productSetupDocxRowsForLabels(payload.fields, [
        'NAV cadence',
        'NAV price assumption',
        'NAV upload method',
        'NAV upload timing',
        'NAV source',
        'Subscription / mint cadence',
        'Subscription window',
        'Subscription payment method',
        'Subscription stablecoin type',
        'Minimum subscription amount',
        'Redemption / burn cadence',
        'Redemption payment method',
        'Redemption stablecoin type',
        'Minimum redemption amount',
        'Income treatment',
        'Income payout cadence',
        'Income payout timing',
      ], record),
      [2600, 2500, 3400, 1580],
    ),
    docxHeading('5. Smart Contract And Contract Ops Inputs', 1),
    docxParagraph(
      `The recommended architecture target is ${payload.recommendedArchitectureTarget}. The selected protocol base is ${productSetupProseField(record, 'protocol_base', 'protocol base not yet selected')} on ${productSetupProseField(record, 'prototype_network', 'prototype network not yet specified')}. Contract Ops should consume this Product Setup snapshot rather than reconstructing parameters from chat.`,
    ),
    docxBullets([
      `Current executable prototype: ${productSetupExecutablePrototypeText(payload.currentExecutablePrototype)}`,
      `Compliance model: ${productSetupProseField(record, 'compliance_model', 'compliance model not yet specified')}`,
      `Token handling decision: ${productSetupProseField(record, 'burn_lock_rule', 'burn or lock rule not yet specified')}`,
    ]),
    docxTable(
      ['Requirement', 'User input', 'ZiLi-OS interpretation', 'Status'],
      productSetupDocxRowsForLabels(payload.fields, ['Blockchain network', 'Protocol base', 'Compliance model', 'Burn / lock rule', 'Admin wallet', 'Redemption wallet'], record),
      [2600, 2500, 3400, 1580],
    ),
    docxHeading('6. Downstream Handoff Summary', 1),
    docxTable(
      ['Detail', 'Destination tab', 'Status', 'Draft note'],
      payload.downstreamHandoffs.length > 0
        ? payload.downstreamHandoffs.map((handoff) => [
            handoff.title,
            productSetupHandoffTargetLabel(handoff.target),
            humanizeProductSetupStatus(handoff.status),
            handoff.detail,
          ])
        : [['No downstream handoffs recorded', '-', '-', '-']],
      [2500, 1800, 1600, 4180],
    ),
    docxHeading('7. Open Decisions', 1),
    docxHeading('Missing Essential Fields', 2),
    docxBullets(
      payload.missingEssentialFields.length > 0
        ? payload.missingEssentialFields.map((label) => `${label}: not yet provided.`)
        : ['No missing essential Product Setup fields.'],
    ),
    docxHeading('Critical Deferred Fields', 2),
    docxBullets(
      payload.criticalDeferredFields.length > 0
        ? payload.criticalDeferredFields.map((label) => `${label}: explicitly deferred and requires review before clean PRD readiness.`)
        : ['No critical deferred Product Setup fields.'],
    ),
    docxHeading('Operational Decisions', 2),
    docxBullets(productSetupOpenDecisionItems(record, readModel)),
    docxHeading('8. Evidence And Versioning', 1),
    docxParagraph(
      `Evidence model: ${productSetupProseField(record, 'evidence_model', 'evidence model not yet specified')}. PRD generation remains local-session evidence until stored in Evidence Vault. This document was generated from record revision ${payload.recordRevision} using ${payload.generatorVersion}.`,
    ),
    docxTable(
      ['Requirement', 'User input', 'ZiLi-OS interpretation', 'Status'],
      productSetupDocxRowsForLabels(payload.fields, ['Evidence model'], record),
      [2600, 2500, 3400, 1580],
    ),
    docxHeading('Appendix A. Definitions Used In This Product Setup', 1),
    docxBullets(payload.definitions),
    docxHeading('Appendix B. Full Product Requirements And Provenance', 1),
    docxTable(
      ['Requirement', 'User input', 'ZiLi-OS interpretation', 'Source', 'Status'],
      payload.fields.map((field) => [
        field.requirement,
        field.userInput,
        productSetupDocxInterpretation(field.requirement, field.interpretation, record),
        humanizeProductSetupStatus(field.source),
        humanizeProductSetupStatus(field.status),
      ]),
      [2200, 2200, 3000, 1300, 1380],
    ),
    docxHeading('Appendix C. Unsupported Or Custom Requirements', 1),
    docxBullets(
      payload.unsupportedRequirementDecisions.length > 0
        ? payload.unsupportedRequirementDecisions.map((decision) => `${decision.requirement}: ${humanizeProductSetupStatus(decision.decision)}. ${decision.nearestEquivalent ?? decision.mismatchReason}`)
        : ['No unsupported or custom requirements recorded.'],
    ),
  ].join('');

  const documentXml = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<w:background w:color="${PRODUCT_SETUP_PRD_THEME.backgroundNeutral}"/>`,
    '<w:body>',
    documentBody,
    '<w:sectPr>',
    '<w:headerReference w:type="default" r:id="rIdHeader1"/>',
    '<w:footerReference w:type="default" r:id="rIdFooter1"/>',
    '<w:pgSz w:w="12240" w:h="15840"/>',
    '<w:pgMar w:top="1152" w:right="1080" w:bottom="1008" w:left="1080" w:header="540" w:footer="540" w:gutter="0"/>',
    '</w:sectPr>',
    '</w:body>',
    '</w:document>',
  ].join('');

  return createDocxArchive({
    '[Content_Types].xml': productSetupDocxContentTypes(),
    '_rels/.rels': productSetupDocxRootRels(),
    'docProps/core.xml': productSetupDocxCoreProperties(title, payload.generatedAtIso),
    'docProps/app.xml': productSetupDocxAppProperties(),
    'word/document.xml': documentXml,
    'word/_rels/document.xml.rels': productSetupDocxDocumentRels(),
    'word/styles.xml': productSetupDocxStyles(),
    'word/settings.xml': productSetupDocxSettings(),
    'word/fontTable.xml': productSetupDocxFontTable(),
    'word/numbering.xml': productSetupDocxNumbering(),
    'word/header1.xml': productSetupDocxHeader(headerLabel),
    'word/footer1.xml': productSetupDocxFooter(generatedAt),
  });
}

function docxTitleBlock(
  record: ProductSetupRecord,
  readModel: ProductSetupReadModel,
  payload: ProductSetupPrdPayload,
  generatedAt: string,
  title: string,
): string {
  const productName = productSetupProseField(record, 'product_name', 'Tokenised Product');
  const tokenSymbol = productSetupProseField(record, 'token_symbol', 'Symbol pending');
  return [
    docxParagraph(title, { style: 'Title', color: PRODUCT_SETUP_PRD_THEME.primaryText }),
    docxParagraph(`${productName} (${tokenSymbol})`, { style: 'Subtitle', color: PRODUCT_SETUP_PRD_THEME.primaryAccent }),
    docxTable(
      ['Version', 'Generated', 'Readiness', 'Record revision'],
      [[payload.versionLabel, generatedAt, readModel.readinessLabel, String(payload.recordRevision)]],
      [1600, 3200, 3680, 1600],
      { compact: true },
    ),
    docxTable(
      ['Key data point', 'Current Product Setup value'],
      [
        ['Fund name', productName],
        ['Token symbol', tokenSymbol],
        ['Launch date', productSetupProseField(record, 'product_launch_date', 'Launch date pending')],
        ['Maturity date', productSetupProseField(record, 'derived_maturity_date', 'Maturity date pending')],
        ['Base currency', productSetupProseField(record, 'base_currency', 'Base currency pending')],
        ['Maximum investors', productSetupProseField(record, 'maximum_investor_count', 'Investor count pending')],
      ],
      [2800, 7280],
      { accentFirstColumn: true },
    ),
  ].join('');
}

function productSetupDocxRowsForLabels(
  fields: ProductSetupPrdPayload['fields'],
  labels: string[],
  record?: ProductSetupRecord,
): string[][] {
  const wanted = new Set(labels);
  const rows = fields
    .filter((field) => wanted.has(field.requirement))
    .map((field) => [
      field.requirement,
      productSetupDocxValue(field.userInput),
      productSetupDocxInterpretation(field.requirement, field.interpretation, record),
      humanizeProductSetupStatus(field.status),
    ]);
  return rows.length > 0 ? rows : [['None', '-', '-', '-']];
}

function productSetupDocxValue(value: string): string {
  if (/^Not provided$/i.test(value)) return 'Pending';
  return value;
}

function productSetupDocxInterpretation(requirement: string, value: string, record?: ProductSetupRecord): string {
  const subscriptionIsOffchain = record ? /off\s*chain|offchain|fiat/i.test(formatProductSetupFieldValue('subscription_payment_method', record.fields.subscription_payment_method.value)) : false;
  const redemptionIsOffchain = record ? /off\s*chain|offchain|fiat/i.test(formatProductSetupFieldValue('redemption_payment_method', record.fields.redemption_payment_method.value)) : false;
  if (requirement === 'Subscription stablecoin type' && subscriptionIsOffchain) return 'Not applicable for fiat off-chain settlement';
  if (requirement === 'Redemption stablecoin type' && redemptionIsOffchain) return 'Not applicable for fiat off-chain settlement';
  if (/^Needed before relevant workflow activation$/i.test(value)) return 'Pending before relevant workflow activation';
  return value;
}

function productSetupExecutablePrototypeText(value: string): string {
  if (/restricted ERC-20-compatible/i.test(value)) return 'Sepolia restricted ERC-20-compatible prototype';
  return value;
}

function humanizeProductSetupStatus(value: string): string {
  const known: Record<string, string> = {
    user_message: 'User stated',
    user_confirmation: 'Confirmed by user',
    user_confirmed: 'Confirmed',
    user_stated: 'User stated',
    system_default: 'Default',
    locked: 'Locked default',
    missing: 'Pending',
    deferred: 'Deferred',
    ready: 'Ready',
    draft: 'Draft',
    sent_as_draft_note: 'Sent as draft note',
    accepted_equivalent: 'Accepted equivalent',
    excluded_from_mvp: 'Excluded from MVP',
  };
  return known[value] ?? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatPrdGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function docxHeading(text: string, level: 1 | 2 | 3): string {
  const style = level === 1 ? 'Heading1' : level === 2 ? 'Heading2' : 'Heading3';
  return docxParagraph(text, { style, color: level === 1 ? PRODUCT_SETUP_PRD_THEME.primaryAccent : PRODUCT_SETUP_PRD_THEME.primaryText, bold: true });
}

function docxCallout(items: string[]): string {
  return [
    '<w:tbl>',
    '<w:tblPr>',
    `<w:tblW w:w="${PRODUCT_SETUP_PRD_CONTENT_WIDTH_DXA}" w:type="dxa"/>`,
    '<w:tblLayout w:type="fixed"/>',
    docxTableBorders(PRODUCT_SETUP_PRD_THEME.primaryAccent, '12'),
    docxCellMargins(180, 180, 220, 220),
    '</w:tblPr>',
    `<w:tblGrid><w:gridCol w:w="${PRODUCT_SETUP_PRD_CONTENT_WIDTH_DXA}"/></w:tblGrid>`,
    '<w:tr>',
    `<w:tc><w:tcPr><w:tcW w:w="${PRODUCT_SETUP_PRD_CONTENT_WIDTH_DXA}" w:type="dxa"/><w:shd w:fill="${PRODUCT_SETUP_PRD_THEME.backgroundNeutral}"/></w:tcPr>`,
    ...items.map((item) => docxParagraph(item, { bold: true, color: PRODUCT_SETUP_PRD_THEME.primaryText, insideCell: true })),
    '</w:tc>',
    '</w:tr>',
    '</w:tbl>',
  ].join('');
}

function docxBullets(items: string[]): string {
  const safeItems = items.length > 0 ? items : ['No open Product Setup decisions recorded for this PRD draft.'];
  return safeItems.map((item) => docxParagraph(item, { list: true })).join('');
}

type DocxParagraphOptions = {
  style?: 'Title' | 'Subtitle' | 'Heading1' | 'Heading2' | 'Heading3';
  color?: string;
  bold?: boolean;
  sizeHalfPoints?: number;
  insideCell?: boolean;
  list?: boolean;
};

function docxParagraph(text: string, options: DocxParagraphOptions = {}): string {
  const styleXml = options.style ? `<w:pStyle w:val="${options.style}"/>` : '';
  const spacingXml = options.insideCell ? '<w:spacing w:after="60"/>' : '<w:spacing w:after="140" w:line="276" w:lineRule="auto"/>';
  const listXml = options.list ? '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' : '';
  const indentXml = options.list ? '<w:ind w:left="720" w:hanging="360"/>' : '';
  const pPr = `<w:pPr>${styleXml}${listXml}${indentXml}${spacingXml}</w:pPr>`;
  return `<w:p>${pPr}${docxRun(text, options)}</w:p>`;
}

function docxRun(text: string, options: Pick<DocxParagraphOptions, 'bold' | 'color' | 'sizeHalfPoints'> = {}): string {
  const rPr = [
    '<w:rPr>',
    '<w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>',
    options.bold ? '<w:b/>' : '',
    `<w:color w:val="${options.color ?? PRODUCT_SETUP_PRD_THEME.primaryText}"/>`,
    `<w:sz w:val="${options.sizeHalfPoints ?? 22}"/>`,
    '</w:rPr>',
  ].join('');
  return `<w:r>${rPr}<w:t xml:space="preserve">${escapeDocxXml(text)}</w:t></w:r>`;
}

function docxTable(
  headers: ProductSetupPrdTableRow,
  rows: ProductSetupPrdTableRow[],
  widths: number[],
  options: { compact?: boolean; accentFirstColumn?: boolean } = {},
): string {
  const tableWidth = widths.reduce((sum, width) => sum + width, 0);
  return [
    '<w:tbl>',
    '<w:tblPr>',
    `<w:tblW w:w="${tableWidth}" w:type="dxa"/>`,
    '<w:tblLayout w:type="fixed"/>',
    docxTableBorders(PRODUCT_SETUP_PRD_THEME.border, '6'),
    docxCellMargins(options.compact ? 100 : 140, options.compact ? 100 : 140, 140, 140),
    '</w:tblPr>',
    `<w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>`,
    docxTableRow(headers, widths, { header: true }),
    ...rows.map((row) => docxTableRow(row, widths, { accentFirstColumn: options.accentFirstColumn })),
    '</w:tbl>',
    docxParagraph(''),
  ].join('');
}

function docxTableRow(
  cells: ProductSetupPrdTableRow,
  widths: number[],
  options: { header?: boolean; accentFirstColumn?: boolean } = {},
): string {
  return [
    '<w:tr>',
    options.header ? '<w:trPr><w:tblHeader/></w:trPr>' : '',
    ...widths.map((width, index) =>
      docxTableCell(cells[index] ?? '', width, {
        header: options.header,
        accent: Boolean(options.accentFirstColumn && index === 0),
      }),
    ),
    '</w:tr>',
  ].join('');
}

function docxTableCell(text: string, width: number, options: { header?: boolean; accent?: boolean } = {}): string {
  const fill = options.header ? PRODUCT_SETUP_PRD_THEME.secondaryAccent : options.accent ? PRODUCT_SETUP_PRD_THEME.backgroundNeutral : PRODUCT_SETUP_PRD_THEME.white;
  const color = options.header ? PRODUCT_SETUP_PRD_THEME.white : options.accent ? PRODUCT_SETUP_PRD_THEME.primaryAccent : PRODUCT_SETUP_PRD_THEME.primaryText;
  return [
    '<w:tc>',
    `<w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:shd w:fill="${fill}"/><w:vAlign w:val="center"/></w:tcPr>`,
    docxParagraph(text, { insideCell: true, bold: options.header || options.accent, color, sizeHalfPoints: options.header ? 20 : 19 }),
    '</w:tc>',
  ].join('');
}

function docxTableBorders(color: string, size: string): string {
  return [
    '<w:tblBorders>',
    `<w:top w:val="single" w:sz="${size}" w:space="0" w:color="${color}"/>`,
    `<w:left w:val="single" w:sz="${size}" w:space="0" w:color="${color}"/>`,
    `<w:bottom w:val="single" w:sz="${size}" w:space="0" w:color="${color}"/>`,
    `<w:right w:val="single" w:sz="${size}" w:space="0" w:color="${color}"/>`,
    `<w:insideH w:val="single" w:sz="${size}" w:space="0" w:color="${color}"/>`,
    `<w:insideV w:val="single" w:sz="${size}" w:space="0" w:color="${color}"/>`,
    '</w:tblBorders>',
  ].join('');
}

function docxCellMargins(top: number, bottom: number, left: number, right: number): string {
  return [
    '<w:tblCellMar>',
    `<w:top w:w="${top}" w:type="dxa"/>`,
    `<w:bottom w:w="${bottom}" w:type="dxa"/>`,
    `<w:left w:w="${left}" w:type="dxa"/>`,
    `<w:right w:w="${right}" w:type="dxa"/>`,
    '</w:tblCellMar>',
  ].join('');
}

function productSetupDocxContentTypes(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>',
    '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>',
    '<Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/>',
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>',
    '<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>',
    '<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>',
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>',
    '<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>',
    '</Types>',
  ].join('');
}

function productSetupDocxRootRels(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>',
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>',
    '</Relationships>',
  ].join('');
}

function productSetupDocxDocumentRels(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
    '<Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>',
    '<Relationship Id="rIdFontTable" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable" Target="fontTable.xml"/>',
    '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>',
    '<Relationship Id="rIdHeader1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>',
    '<Relationship Id="rIdFooter1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>',
    '</Relationships>',
  ].join('');
}

function productSetupDocxStyles(): string {
  const theme = PRODUCT_SETUP_PRD_THEME;
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="2F3E46"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>',
    `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:color w:val="${theme.primaryText}"/><w:sz w:val="22"/></w:rPr></w:style>`,
    `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr><w:rPr><w:b/><w:color w:val="${theme.primaryText}"/><w:sz w:val="38"/></w:rPr></w:style>`,
    `<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:color w:val="${theme.primaryAccent}"/><w:sz w:val="26"/></w:rPr></w:style>`,
    `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="140"/></w:pPr><w:rPr><w:b/><w:color w:val="${theme.primaryAccent}"/><w:sz w:val="28"/></w:rPr></w:style>`,
    `<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="100"/></w:pPr><w:rPr><w:b/><w:color w:val="${theme.primaryText}"/><w:sz w:val="24"/></w:rPr></w:style>`,
    `<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:color w:val="${theme.primaryText}"/><w:sz w:val="22"/></w:rPr></w:style>`,
    '</w:styles>',
  ].join('');
}

function productSetupDocxSettings(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:updateFields w:val="true"/>',
    '</w:settings>',
  ].join('');
}

function productSetupDocxFontTable(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:fonts xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:font w:name="Arial"><w:family w:val="swiss"/></w:font>',
    '</w:fonts>',
  ].join('');
}

function productSetupDocxNumbering(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:abstractNum w:abstractNumId="1">',
    '<w:multiLevelType w:val="singleLevel"/>',
    '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:hint="default"/></w:rPr></w:lvl>',
    '</w:abstractNum>',
    '<w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>',
    '</w:numbering>',
  ].join('');
}

function productSetupDocxHeader(label: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:p>',
    `<w:pPr><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${PRODUCT_SETUP_PRD_THEME.secondaryAccent}"/></w:pBdr><w:spacing w:after="80"/></w:pPr>`,
    docxRun(label, { bold: true, color: PRODUCT_SETUP_PRD_THEME.primaryText, sizeHalfPoints: 20 }),
    '</w:p>',
    '</w:hdr>',
  ].join('');
}

function productSetupDocxFooter(generatedAt: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:p>',
    `<w:pPr><w:jc w:val="right"/><w:pBdr><w:top w:val="single" w:sz="6" w:space="4" w:color="${PRODUCT_SETUP_PRD_THEME.secondaryAccent}"/></w:pBdr></w:pPr>`,
    docxRun(`${generatedAt} · Page `, { color: PRODUCT_SETUP_PRD_THEME.secondaryAccent, sizeHalfPoints: 18 }),
    '<w:r><w:rPr><w:color w:val="8D99AE"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>',
    '<w:r><w:rPr><w:color w:val="8D99AE"/><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>',
    '<w:r><w:rPr><w:color w:val="8D99AE"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>',
    docxRun('1', { color: PRODUCT_SETUP_PRD_THEME.secondaryAccent, sizeHalfPoints: 18 }),
    '<w:r><w:rPr><w:color w:val="8D99AE"/><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>',
    '</w:p>',
    '</w:ftr>',
  ].join('');
}

function productSetupDocxCoreProperties(title: string, generatedAt: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">',
    `<dc:title>${escapeDocxXml(title)}</dc:title>`,
    '<dc:creator>ZiLi-OS</dc:creator>',
    `<cp:lastModifiedBy>ZiLi-OS</cp:lastModifiedBy>`,
    `<dcterms:created xsi:type="dcterms:W3CDTF">${escapeDocxXml(generatedAt)}</dcterms:created>`,
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${escapeDocxXml(generatedAt)}</dcterms:modified>`,
    '</cp:coreProperties>',
  ].join('');
}

function productSetupDocxAppProperties(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">',
    '<Application>ZiLi-OS</Application>',
    '</Properties>',
  ].join('');
}

export function createProductSetupPackPrintableHtml(
  record: ProductSetupRecord,
  readModel = toProductSetupReadModel(record),
  options: ProductSetupPackGenerationOptions = {},
): string {
  const payload = createProductSetupPackPayload(record, readModel, options);
  const rows = payload.fields
    .map((field) => `<tr><td>${escapeHtml(field.requirement)}</td><td>${escapeHtml(field.userInput)}</td><td>${escapeHtml(field.interpretation)}</td><td>${escapeHtml(field.source)}</td><td>${escapeHtml(field.status)}</td></tr>`)
    .join('');
  const profileRows = payload.profileRows
    .map((row) => `<tr><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td><td>${escapeHtml(row.provenanceLabel)}</td></tr>`)
    .join('');
  const handoffRows =
    payload.downstreamHandoffs.length > 0
      ? payload.downstreamHandoffs
          .map((handoff) => `<tr><td>${escapeHtml(handoff.title)}</td><td>${escapeHtml(productSetupHandoffTargetLabel(handoff.target))}</td><td>${escapeHtml(handoff.status.replaceAll('_', ' '))}</td><td>${escapeHtml(handoff.detail)}</td></tr>`)
          .join('')
      : '<tr><td>None</td><td>-</td><td>-</td><td>No downstream handoffs recorded.</td></tr>';

  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>ZiLi-OS Product Requirements Document</title>',
    '<style>body{font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.45;margin:32px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #d1d5db;padding:8px;text-align:left;vertical-align:top}h1,h2{margin-bottom:8px}.warning{background:#fff7ed;border:1px solid #fdba74;padding:12px}</style>',
    '</head><body>',
    `<h1>ZiLi-OS Product Requirements Document ${escapeHtml(payload.versionLabel)}</h1>`,
    `<p>Generated at: ${escapeHtml(payload.generatedAtIso)}</p>`,
    `<p class="warning">${escapeHtml(payload.warning)}</p>`,
    '<h2>Product Overview</h2>',
    `<p><strong>Status:</strong> ${escapeHtml(payload.statusLabel)}. <strong>Readiness:</strong> ${escapeHtml(payload.readinessLabel)}.</p>`,
    '<h2>Blockchain And Token Protocol Assumptions</h2>',
    `<p><strong>Recommended architecture target:</strong> ${escapeHtml(payload.recommendedArchitectureTarget)}</p>`,
    `<p><strong>Current executable prototype:</strong> ${escapeHtml(payload.currentExecutablePrototype)}</p>`,
    '<h2>Product Terms Summary</h2>',
    '<table><thead><tr><th>Attribute</th><th>Value</th><th>Provenance</th></tr></thead><tbody>',
    profileRows,
    '</tbody></table>',
    '<h2>Staged Notes For Lifecycle Tabs</h2>',
    '<table><thead><tr><th>Detail</th><th>Destination tab</th><th>Status</th><th>Draft note</th></tr></thead><tbody>',
    handoffRows,
    '</tbody></table>',
    '<h2>Definitions</h2>',
    `<ul>${payload.definitions.map((definition) => `<li>${escapeHtml(definition)}</li>`).join('')}</ul>`,
    '<h2>Requirements And Provenance</h2>',
    '<table><thead><tr><th>Requirement</th><th>User input</th><th>ZiLi-OS interpretation</th><th>Source</th><th>Status</th></tr></thead><tbody>',
    rows,
    '</tbody></table>',
    '</body></html>',
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function classifyWalletSetupResponse(value: string): 'address' | 'role_placeholder' | 'not_sure' | 'unsafe_secret' | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return 'invalid';
  if (looksLikePrivateKeyOrSeedPhrase(trimmed)) return 'unsafe_secret';
  if (/not sure|later|before deployment|to be added/i.test(trimmed)) return 'not_sure';
  if (isValidNonZeroEvmAddress(trimmed)) return 'address';
  if (/wallet|operations|issuer|admin|treasury|team|role/i.test(trimmed)) return 'role_placeholder';
  return 'invalid';
}

function looksLikePrivateKeyOrSeedPhrase(value: string): boolean {
  if (/^0x[0-9a-fA-F]{64}$/.test(value)) return true;
  if (/\b(private key|seed phrase|recovery phrase|mnemonic)\b/i.test(value)) return true;
  const words = value.trim().split(/\s+/);
  return words.length >= 12 && words.every((word) => /^[a-z]+$/i.test(word));
}
