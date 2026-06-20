import type { FundFacts } from './schemas';
import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';
import { createDocxContentFromMarkdown } from './docxExport';
import {
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
};

function createField(input: Omit<ProductSetupField, 'confirmedByUser'> & { confirmedByUser?: boolean }): ProductSetupField {
  return {
    ...input,
    confirmedByUser: input.confirmedByUser ?? false,
  };
}

export function createInitialProductSetupRecord(facts: FundFacts): ProductSetupRecord {
  void facts;

  return {
    id: 'product-setup-alpha-income-fund-i',
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
    readinessLabel: `${completedEssentialCount}/${requiredProductSetupFieldKeys.length} Product Setup fields drafted, defaulted, or locked`,
    completedEssentialCount,
    requiredEssentialCount: requiredProductSetupFieldKeys.length,
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
      status: missingEssentials.length === 0 ? 'Ready for review' : 'Draft',
      versionLabel: 'Not generated',
      evidenceVaultStatus: 'Not stored yet',
      canDownloadArtifacts: false,
      warning:
        'ZiliOS generates this pack after the product profile is reviewed and finalised. It captures the product PRD, product assumptions, compliance rules, and staged operational notes for the lifecycle tabs. Legal and compliance-sensitive items should be confirmed with counsel or compliance.',
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
  const keys = [...productSetupPrdFieldKeys];
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
  return deploymentProductSetupFieldKeys
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
    offering_type: 'Offering type helps Investor Wallets check the distribution model before whitelisting.',
    eligible_investor_type: 'Investor type is verified offchain before wallet whitelisting; the contract does not independently verify investor status.',
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
      fieldKeys: ['subscription_cadence', 'subscription_stablecoins', 'initial_distribution_date'],
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
      fieldKeys: ['nav_cadence', 'nav_source', 'income_treatment', 'income_payout_cadence', 'investor_update_rule'],
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
      subscription_stablecoins: 'permittedStablecoins',
      subscription_receiving_wallet: 'paymentAddress',
      initial_distribution_date: 'subscriptionWindow',
    },
    contract_ops: {},
    asset_servicing: {
      nav_cadence: 'navCadence',
      nav_source: 'navSource',
      income_payout_cadence: 'incomePayoutCadence',
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
): ProductSetupSuggestionReconciliationResult {
  const acceptedUpdates = filterProductSetupSuggestedUpdates(record, updates);
  const appliedUpdates = acceptedUpdates.filter(shouldApplyProductSetupUpdateDirectly);
  const pendingUpdates = acceptedUpdates.filter((update) => !shouldApplyProductSetupUpdateDirectly(update));
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
  };
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
  'redemption_payment_method',
  'redemption_stablecoin_type',
  'redemption_cadence',
  'redemption_schedule',
  'income_payout_cadence',
  'redemption_payout_cadence',
  'minimum_redemption_amount',
  'burn_lock_rule',
  'nav_cadence',
  'nav_source',
  'duration_months',
  'initial_distribution_date',
  'initial_investor_register_rule',
  'maturity_date',
  'maturity_closeout_rule',
]);

function shouldApplyProductSetupUpdateDirectly(update: ProductSetupSuggestedUpdate): boolean {
  if (update.sourceType !== 'user_message') return false;

  if (!directUserStatedProductSetupFields.has(update.fieldKey)) return false;
  if (update.fieldKey === 'income_treatment') return update.confidence >= 0.72;
  return update.confidence >= 0.78;
}

export function filterProductSetupSuggestedUpdates(
  record: ProductSetupRecord,
  updates: ProductSetupSuggestedUpdate[],
): ProductSetupSuggestedUpdate[] {
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

  return update.sourceType !== 'assistant_inference';
}

function productSetupValuesEqual(left: ProductSetupFieldValue, right: ProductSetupFieldValue): boolean {
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
    pendingSuggestedUpdates: record.pendingSuggestedUpdates.filter((candidate) => candidate.id !== updateId),
    updatedAtIso: new Date().toISOString(),
  };
}

export function deferProductSetupField(
  record: ProductSetupRecord,
  fieldKey: ProductSetupFieldKey,
  reason = 'User chose to add this before deployment.',
): ProductSetupRecord {
  return deriveProductSetupFields({
    ...record,
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
    unsupportedRequirementDecisions: [...byId.values()],
    updatedAtIso: new Date().toISOString(),
  };
}

export function decideUnsupportedRequirement(
  record: ProductSetupRecord,
  decisionId: string,
  decision: UnsupportedRequirementDecision['decision'],
): ProductSetupRecord {
  return {
    ...record,
    unsupportedRequirementDecisions: record.unsupportedRequirementDecisions.map((item) =>
      item.id === decisionId ? { ...item, decision } : item,
    ),
    updatedAtIso: new Date().toISOString(),
  };
}

export type ProductSetupPackGenerationOptions = {
  generatedAtIso?: string;
  versionLabel?: string;
};

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
    userInput: fieldDisplayValue(field) || field.rolePlaceholder || 'Not provided',
    interpretation: field.deferralReason || field.rolePlaceholder || fieldDisplayValue(field) || 'Needed before relevant workflow activation',
    source: field.sourceType ?? 'missing',
    status: field.status,
    usedByTabs: field.usedByTabs,
  }));

  return {
    recordId: record.id,
    artifactId: `product-setup-prd-${record.id}-${versionLabel.replaceAll('.', '-')}`,
    versionLabel,
    displayVersion: `Product PRD ${versionLabel}`,
    generatedAtIso,
    packStatus: 'PRD generated',
    warning: readModel.packPreview.warning,
    statusLabel: readModel.statusLabel,
    readinessLabel: readModel.readinessLabel,
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

  return [
    `# ZiLi-OS Product Requirements Document ${payload.versionLabel}`,
    '',
    `Generated at: ${payload.generatedAtIso}`,
    '',
    `> ${payload.warning}`,
    '',
    '## 1. Product Overview',
    '',
    `- Product Setup status: ${payload.statusLabel}`,
    `- Readiness: ${payload.readinessLabel}`,
    '',
    '## 2. Product Terms Summary',
    '',
    '| Attribute | Value | Provenance |',
    '| --- | --- | --- |',
    profileRows,
    '',
    '## 3. Investor Eligibility And Distribution Rules',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Offering type', 'Eligible investor type', 'Maximum number of investors', 'Distribution jurisdiction', 'Whitelisted wallets required', 'P2P transfer allowed']),
    '',
    '## 4. NAV And Valuation Assumptions',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['NAV cadence', 'NAV upload method', 'NAV source']),
    '',
    '## 5. Subscription And Mint Assumptions',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Subscription / mint cadence', 'Subscription payment method', 'Subscription stablecoin type', 'Minimum redemption amount']),
    '',
    '## 6. Redemption And Burn Assumptions',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Redemption / burn cadence', 'Redemption payment method', 'Redemption stablecoin type', 'Burn / lock rule']),
    '',
    '## 7. Maturity And Final Redemption Assumptions',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Duration of product in months', 'Derived maturity date', 'Maturity description', 'Maturity date', 'Maturity closeout rule']),
    '',
    '## 8. Blockchain And Token Protocol Assumptions',
    '',
    `- Recommended architecture target: ${payload.recommendedArchitectureTarget}`,
    `- Current executable prototype: ${payload.currentExecutablePrototype}`,
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Blockchain network', 'Protocol base']),
    '',
    '## 9. Compliance Rules Summary',
    '',
    '- Whitelisted wallets only: tokens can only be minted or transferred to approved wallet addresses.',
    '- Maximum investor count: active investors must not exceed the configured cap.',
    '- P2P transfer restriction: if enabled, transfers remain limited to whitelisted eligible wallets.',
    '- Maturity / redemption control: on maturity or termination, transfers can be paused and tokens move through the approved process.',
    '',
    'Investor type is verified offchain before wallet whitelisting. Onchain enforcement uses wallet whitelist status and configured controls; the contract does not independently verify investor type.',
    '',
    '## 10. Operational Assumptions',
    '',
    '| Detail | Destination tab | Status | Draft note |',
    '| --- | --- | --- | --- |',
    handoffRows,
    '',
    '## 11. Evidence And Audit Requirements',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRowsForLabels(payload.fields, ['Evidence model']),
    '',
    '## 12. Open Questions / Missing Information',
    '',
    payload.deploymentWarnings.length > 0
      ? payload.deploymentWarnings.map((warning) => `- ${warning.label}: ${warning.likelyError}`).join('\n')
      : '- No open Product Setup deployment warnings recorded.',
    '',
    '## 13. Staged Notes For Lifecycle Tabs',
    '',
    '| Detail | Destination tab | Status | Draft note |',
    '| --- | --- | --- | --- |',
    handoffRows,
    '',
    '## Definitions Used In This Product Setup',
    '',
    ...payload.definitions.map((definition) => `- ${definition}`),
    '',
    '## Appendix A. Product Requirements And Provenance',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRows,
    '',
    '## Unsupported Or Custom Requirements',
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

export function createProductSetupPackMarkdown(record: ProductSetupRecord): string {
  return createProductSetupPrdMarkdown(record);
}

export function createProductSetupPrdDocxContent(
  record: ProductSetupRecord,
  readModel = toProductSetupReadModel(record),
  options: ProductSetupPackGenerationOptions = {},
): Uint8Array {
  const markdown = createProductSetupPrdMarkdown(record, readModel, options);
  const payload = createProductSetupPackPayload(record, readModel, options);
  return createDocxContentFromMarkdown(markdown, `ZiLi-OS Product Requirements Document ${payload.versionLabel}`);
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
