import type { FundFacts } from './schemas';
import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';

export const supportedProtocolBases = [
  'ERC-20',
  'ERC-4626',
  'ERC-3643',
  'Custom ERC-20 with rebasing',
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
  | 'issuer_owner'
  | 'product_type'
  | 'base_currency'
  | 'protocol_base'
  | 'expected_investor_count'
  | 'investor_wallet_rule'
  | 'whitelisted_wallets_required'
  | 'subscription_cadence'
  | 'subscription_stablecoins'
  | 'subscription_receiving_wallet'
  | 'redemption_cadence'
  | 'redemption_schedule'
  | 'redemption_payout_delay'
  | 'income_payout_cadence'
  | 'redemption_payout_cadence'
  | 'redemption_wallet'
  | 'admin_wallet'
  | 'burn_lock_rule'
  | 'nav_cadence'
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

export type ProductSetupRecord = {
  id: string;
  status: 'draft' | 'ready_for_engineering' | 'locked';
  fields: Record<ProductSetupFieldKey, ProductSetupField>;
  pendingSuggestedUpdates: ProductSetupSuggestedUpdate[];
  termExplanations: Record<string, TermExplanationState>;
  unsupportedRequirementDecisions: UnsupportedRequirementDecision[];
  deploymentWarningAcknowledgements: ProductSetupDeploymentWarningAcknowledgement[];
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
    canDownloadDraft: boolean;
    canConfirmAndLock: boolean;
    warning: string;
    includedDocuments: string[];
  };
};

const essentialFieldKeys: ProductSetupFieldKey[] = [
  'product_name',
  'token_symbol',
  'product_type',
  'base_currency',
  'protocol_base',
  'expected_investor_count',
  'investor_wallet_rule',
  'subscription_cadence',
  'redemption_cadence',
  'subscription_stablecoins',
  'burn_lock_rule',
  'prototype_network',
];

const deploymentFieldKeys: ProductSetupFieldKey[] = [
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
];

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
        label: 'Token symbol',
        status: 'missing',
        usedByTabs: ['Overview', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'contract_parameter',
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
        value: 'fund-like / portfolio-like',
        status: 'inferred',
        sourceType: 'assistant_inference',
        sourceRef: 'starter_context',
        confidence: 0.7,
        usedByTabs: ['Overview', 'Contract Ops', 'Asset Servicing', 'Maturity'],
        smartContractRelevance: 'operational_metadata',
      }),
      base_currency: createField({
        key: 'base_currency',
        label: 'Base currency',
        value: 'USD',
        status: 'inferred',
        sourceType: 'assistant_inference',
        sourceRef: 'starter_context',
        confidence: 0.72,
        usedByTabs: ['Subscription', 'Redemption', 'Asset Servicing'],
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
        value: 'Approved wallets only; transfers should stay between approved wallets.',
        status: 'inferred',
        sourceType: 'assistant_inference',
        sourceRef: 'starter_context',
        confidence: 0.78,
        usedByTabs: ['Investor Wallets', 'Contract Ops', 'Redemption'],
        smartContractRelevance: 'contract_parameter',
      }),
      whitelisted_wallets_required: createField({
        key: 'whitelisted_wallets_required',
        label: 'Whitelisted wallets required',
        value: true,
        status: 'inferred',
        sourceType: 'assistant_inference',
        sourceRef: 'starter_context',
        confidence: 0.84,
        usedByTabs: ['Investor Wallets', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
      }),
      subscription_cadence: createField({
        key: 'subscription_cadence',
        label: 'Subscription cadence',
        status: 'missing',
        usedByTabs: ['Subscription', 'Contract Ops', 'Evidence Vault'],
        smartContractRelevance: 'operational_metadata',
      }),
      subscription_stablecoins: createField({
        key: 'subscription_stablecoins',
        label: 'Subscription stablecoins',
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
        label: 'Redemption cadence',
        status: 'missing',
        usedByTabs: ['Redemption', 'Contract Ops', 'Evidence Vault'],
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
        label: 'Maturity date',
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
        label: 'Prototype network',
        value: 'Sepolia testnet',
        status: 'system_default',
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
    updatedAtIso: new Date().toISOString(),
  };
}

export function normalizeProductSetupRecord(record: ProductSetupRecord): ProductSetupRecord {
  const baselineFields = createInitialProductSetupRecord({} as FundFacts).fields;
  const fields = { ...baselineFields, ...record.fields };
  const starterDefaultIdentityFields = ['product_name', 'token_symbol'] satisfies ProductSetupFieldKey[];

  for (const fieldKey of starterDefaultIdentityFields) {
    const field = fields[fieldKey];
    if (field.status === 'system_default' && field.sourceRef === 'starter_facts') {
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

  return {
    ...record,
    fields,
  };
}

export function recommendProductSetupProtocol(record: ProductSetupRecord): ProductSetupReadModel['protocolRecommendation'] {
  const whitelistRequired = record.fields.whitelisted_wallets_required.value === true;
  const stablecoins = record.fields.subscription_stablecoins.value;
  const schedule = String(record.fields.redemption_schedule.value ?? '').toLowerCase();
  const burnLockRule = String(record.fields.burn_lock_rule.value ?? '').toLowerCase();
  const productType = String(record.fields.product_type.value ?? '').toLowerCase();

  if (burnLockRule.includes('rebase') || burnLockRule.includes('balance')) {
    return {
      recommendedProtocol: 'Custom ERC-20 with rebasing',
      confidence: 0.78,
      reasons: ['Investor balances appear to need automatic NAV or yield-driven adjustment.'],
      alternatives: ['ERC-3643 if permissioning matters more than balance adjustment.', 'ERC-20 if balances stay fixed between subscription and redemption.'],
      executablePrototypeLabel: 'Architecture target; current Contract Ops execution remains the Sepolia restricted ERC-20-compatible prototype.',
    };
  }

  if (productType.includes('vault') && Array.isArray(stablecoins) && stablecoins.length === 1 && !schedule.includes('delay')) {
    return {
      recommendedProtocol: 'ERC-4626',
      confidence: 0.76,
      reasons: ['The product behaves like a single-asset vault where investors deposit one ERC-20 asset and receive shares.'],
      alternatives: ['ERC-3643 if approved-wallet holding and transfer checks are central.', 'ERC-20 for a simpler prototype token.'],
      executablePrototypeLabel: 'Architecture target; current Contract Ops execution remains the Sepolia restricted ERC-20-compatible prototype.',
    };
  }

  if (whitelistRequired) {
    return {
      recommendedProtocol: 'ERC-3643',
      confidence: 0.88,
      reasons: ['Whitelisted wallets and restricted token holding are central to the product setup.'],
      alternatives: ['ERC-20 if whitelist enforcement can stay at the application/workflow layer.', 'ERC-4626 only for clean vault-share behaviour.', 'Custom rebasing ERC-20 only if balances must auto-adjust.'],
      executablePrototypeLabel: 'Recommended architecture target; current executable prototype is Sepolia restricted ERC-20-compatible.',
    };
  }

  return {
    recommendedProtocol: 'ERC-20',
    confidence: 0.74,
    reasons: ['The product appears to need a simple fungible token model without native vault or rebasing mechanics.'],
    alternatives: ['ERC-3643 if transfer restrictions become essential.', 'ERC-4626 for a clean single-asset vault.', 'Custom rebasing ERC-20 for automatic balance changes.'],
    executablePrototypeLabel: 'Closest current Contract Ops execution path on Sepolia.',
  };
}

export function toProductSetupReadModel(record: ProductSetupRecord): ProductSetupReadModel {
  const protocolRecommendation = recommendProductSetupProtocol(record);
  const completedEssentialCount = essentialFieldKeys.filter((key) =>
    ['user_confirmed', 'system_default', 'locked'].includes(record.fields[key].status),
  ).length;
  const missingEssentials = essentialFieldKeys
    .map((key) => record.fields[key])
    .filter((field) => !isDeploymentReadyField(field));
  const deploymentWarnings = toProductSetupDeploymentWarnings(record);
  const deploymentBlockers = deploymentWarnings.map((warning) => warning.message);
  const latestDeploymentWarningAcknowledgement = record.deploymentWarningAcknowledgements.at(-1);
  const hasUnacknowledgedDeploymentWarnings =
    deploymentWarnings.length > 0 &&
    !latestDeploymentWarningAcknowledgementCovers(latestDeploymentWarningAcknowledgement, deploymentWarnings);

  return {
    statusLabel: record.status === 'locked' ? 'Locked Product Setup snapshot' : 'Draft Product Setup',
    readinessLabel: `${completedEssentialCount}/${essentialFieldKeys.length} essentials confirmed, defaulted, or deliberately deferred`,
    completedEssentialCount,
    requiredEssentialCount: essentialFieldKeys.length,
    understandingSummary: createUnderstandingSummary(record, protocolRecommendation.recommendedProtocol),
    protocolRecommendation,
    missingEssentials,
    deploymentBlockers,
    deploymentWarnings,
    hasUnacknowledgedDeploymentWarnings,
    latestDeploymentWarningAcknowledgement,
    requirementSections: [
      {
        title: 'Product snapshot',
        fields: (['product_name', 'token_symbol', 'issuer_owner', 'product_type', 'base_currency'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Protocol and token model',
        fields: (['protocol_base', 'expected_investor_count', 'investor_wallet_rule', 'whitelisted_wallets_required'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Subscription and redemption',
        fields: (['subscription_cadence', 'subscription_stablecoins', 'subscription_receiving_wallet', 'redemption_cadence', 'redemption_schedule', 'redemption_payout_delay', 'redemption_payout_cadence', 'redemption_wallet', 'burn_lock_rule'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Asset servicing and maturity',
        fields: (['nav_cadence', 'nav_source', 'income_payout_cadence', 'investor_update_rule', 'initial_distribution_date', 'initial_investor_register_rule', 'maturity_date', 'maturity_closeout_rule'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Contract operations',
        fields: (['prototype_network', 'admin_wallet'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
    ],
    unsupportedRequirementDecisions: record.unsupportedRequirementDecisions,
    firstTimePrompts: [
      { termKey: 'admin_wallet', fieldKey: 'admin_wallet', prompt: productSetupPromptForTerm('admin_wallet') },
      { termKey: 'subscription_receiving_wallet', fieldKey: 'subscription_receiving_wallet', prompt: productSetupPromptForTerm('subscription_receiving_wallet') },
      { termKey: 'redemption_wallet', fieldKey: 'redemption_wallet', prompt: productSetupPromptForTerm('redemption_wallet') },
      { termKey: 'investor_wallet_rule', fieldKey: 'investor_wallet_rule', prompt: productSetupPromptForTerm('investor_wallet_rule') },
      { termKey: 'burn_lock_rule', fieldKey: 'burn_lock_rule', prompt: productSetupPromptForTerm('burn_lock_rule') },
    ],
    packPreview: {
      canDownloadDraft: true,
      canConfirmAndLock: missingEssentials.length === 0 && deploymentBlockers.length === 0,
      warning:
        'This document reflects ZiLi-OS’s operational interpretation of user-provided Product Setup information. Legal/compliance-sensitive items should be confirmed with counsel/compliance.',
      includedDocuments: [
        'Product Requirements Document',
        'Engineering smart-contract and Sepolia testnet details',
        'PRD-to-contract translation',
        'Asset-servicing setup covering distribution, investor wallets, NAV, subscription, and redemption',
      ],
    },
  };
}

export function isDeploymentReadyField(field: ProductSetupField): boolean {
  if (field.rolePlaceholder) return false;
  if (field.value === undefined || field.value === null) return false;
  if (Array.isArray(field.value)) return field.value.length > 0;
  if (typeof field.value === 'string' && field.value.trim().length === 0) return false;
  return ['user_confirmed', 'system_default', 'locked'].includes(field.status);
}

export function toProductSetupDeploymentWarnings(record: ProductSetupRecord): ProductSetupDeploymentWarning[] {
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

export function createProductSetupSuggestionsFromText(
  text: string,
  sourceRef: string,
): ProductSetupSuggestedUpdate[] {
  const normalized = text.toLowerCase();
  const updates: ProductSetupSuggestedUpdate[] = [];
  const original = text.trim();
  const productNameMatch = original.match(/\bproduct\s+name\s+is\s+([A-Za-z][A-Za-z0-9 .&-]{1,60}?)(?=\s+(?:and|with|as|it\s+is|symbol\s+is)|[.?!,]|$)/i);
  const tokenSymbolMatch = original.match(/\b(?:token\s+)?symbol\s+is\s+([A-Z][A-Z0-9]{1,11})\b/i);
  const baseCurrencyMatch = normalized.match(/\b(?:with\s+)?([a-z]{3,6})\s+as\s+(?:a\s+)?base\s+currency\b/);
  const productTypeMatch = normalized.match(/\b(?:it\s+is\s+)?(?:a\s+)?(pooled\s+fund|private\s+credit\s+fund|credit\s+fund|investment\s+fund|fund|note|bond|portfolio)\b/);
  const investorMatch = normalized.match(/(?:about\s*)?(\d{1,3})(?:\s*-\s*\d{1,3})?\s+(?:investors|wallets)|(\d{1,3})\s*-\s*(\d{1,3})\s+investors/);
  const delayMatch = normalized.match(/(\d{1,3})\s*(?:business\s*)?(?:day|days|hour|hours|week|weeks)/);
  const ipoDateMatch = original.match(/\b(?:ipo|launch|initial\s+distribution)\s+date(?:\s+\w+){0,3}\s+(?:on\s+)?(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/i);
  const initialRegisterMatch = original.match(/\binitial\s+register\s+of\s+(\d{1,3})\s+investors?\s+will\s+be\s+([^.,;]+)/i);
  const valuationCadence = extractCadenceNear(normalized, '(?:valuation|nav)');
  const subscriptionCadence = extractCadenceNear(
    normalized,
    '(?:subscrib\\w*|subscription\\w*|buy|new\\s+investors?\\s+(?:can\\s+)?(?:come\\s+in|enter|join|buy)|investors?\\s+(?:can\\s+)?(?:come\\s+in|enter|join|buy)|accept\\s+new\\s+investors?|new\\s+money\\s+comes?\\s+in)',
  );
  const redemptionCadence = extractCadenceNear(
    normalized,
    '(?:redeem\\w*|redemption\\w*|existing\\s+investors?\\s+(?:can\\s+)?(?:sell\\s+out|exit|cash\\s+out|withdraw)|investors?\\s+(?:can\\s+)?(?:sell\\s+out|exit|cash\\s+out|withdraw)|sell\\s+out|cash\\s+out|withdraw)',
  );
  const incomePayoutCadence = extractCadenceNear(normalized, '(?:distribution\\w*|dividend\\w*|coupon\\w*|income payout|cash distribution)');
  const redemptionPayoutCadence = extractCadenceNear(normalized, '(?:redemption payout|settle\\w*|settlement\\w*)');

  if (productNameMatch?.[1]) {
    updates.push(createSuggestedUpdate('product_name', productNameMatch[1].trim(), 'User stated the product name.', sourceRef, 0.9));
  }
  if (tokenSymbolMatch?.[1]) {
    updates.push(createSuggestedUpdate('token_symbol', tokenSymbolMatch[1].trim(), 'User stated the token symbol.', sourceRef, 0.9));
  }
  if (productTypeMatch?.[1]) {
    updates.push(createSuggestedUpdate('product_type', titleCaseProductSetupValue(productTypeMatch[1]), 'User described the product type.', sourceRef, 0.84));
  }
  if (baseCurrencyMatch?.[1]) {
    updates.push(createSuggestedUpdate('base_currency', baseCurrencyMatch[1].toUpperCase(), 'User stated the base currency.', sourceRef, 0.88));
  }
  if (investorMatch?.[1] || investorMatch?.[3]) {
    updates.push(createSuggestedUpdate('expected_investor_count', Number(investorMatch[1] ?? investorMatch[3]), 'User described expected investor scale.', sourceRef, 0.88));
  }
  if (ipoDateMatch?.[1]) {
    updates.push(createSuggestedUpdate('initial_distribution_date', normalizeProductSetupDate(ipoDateMatch[1]), 'User described the tentative initial distribution or IPO date.', sourceRef, 0.8));
  }
  if (initialRegisterMatch?.[1] && initialRegisterMatch[2]) {
    updates.push(createSuggestedUpdate('initial_investor_register_rule', `Initial register of ${initialRegisterMatch[1]} investors will be ${initialRegisterMatch[2].trim()}.`, 'User described the initial investor register process.', sourceRef, 0.78));
  }
  if (normalized.includes('usdc')) {
    updates.push(createSuggestedUpdate('subscription_stablecoins', ['USDC'], 'User mentioned USDC subscription or payout rails.', sourceRef, 0.9));
  }
  if (normalized.includes('whitelist') || normalized.includes('approved wallet') || normalized.includes('approved wallets')) {
    updates.push(createSuggestedUpdate('whitelisted_wallets_required', true, 'User described approved or whitelisted wallet access.', sourceRef, 0.9));
    updates.push(createSuggestedUpdate('investor_wallet_rule', 'Approved wallets only; transfers should stay between approved wallets.', 'User described approved or whitelisted wallet access.', sourceRef, 0.86));
  }
  if (/peer\s*to\s*peer|p2p|buy-sell|buy sell|transfer.+each other/.test(normalized)) {
    updates.push(createSuggestedUpdate('investor_wallet_rule', 'Approved investors may transfer peer-to-peer only to other approved wallets.', 'User described investor peer-to-peer transfers.', sourceRef, 0.82));
  }
  if (normalized.includes('quarter')) {
    updates.push(createSuggestedUpdate('redemption_schedule', 'Quarterly', 'User described quarterly redemption timing.', sourceRef, 0.82));
  }
  if (normalized.includes('weekly')) {
    updates.push(createSuggestedUpdate('redemption_schedule', 'Weekly', 'User described weekly redemption timing.', sourceRef, 0.8));
  }
  if (delayMatch?.[0]) {
    updates.push(createSuggestedUpdate('redemption_payout_delay', delayMatch[0], 'User described a redemption payout delay.', sourceRef, 0.84));
  }
  if (valuationCadence) {
    updates.push(createSuggestedUpdate('nav_cadence', valuationCadence, `User described ${valuationCadence.toLowerCase()} valuation or NAV updates.`, sourceRef, 0.84));
  }
  if (subscriptionCadence) {
    updates.push(createSuggestedUpdate('subscription_cadence', subscriptionCadence, `User described ${subscriptionCadence.toLowerCase()} subscription timing.`, sourceRef, 0.83));
  }
  if (redemptionCadence) {
    updates.push(createSuggestedUpdate('redemption_cadence', redemptionCadence, `User described ${redemptionCadence.toLowerCase()} redemption timing.`, sourceRef, 0.83));
  }
  if (incomePayoutCadence) {
    updates.push(createSuggestedUpdate('income_payout_cadence', incomePayoutCadence, `User described ${incomePayoutCadence.toLowerCase()} income or distribution payout timing.`, sourceRef, 0.78));
  }
  if (redemptionPayoutCadence) {
    updates.push(createSuggestedUpdate('redemption_payout_cadence', redemptionPayoutCadence, `User described ${redemptionPayoutCadence.toLowerCase()} redemption payout settlement timing.`, sourceRef, 0.78));
  }
  if (/uploaded file|upload file|file upload|uploaded via a file|ingested from uploaded file/.test(normalized)) {
    updates.push(createSuggestedUpdate('nav_source', 'Uploaded file', 'User described NAV or valuation coming from an uploaded file.', sourceRef, 0.84));
  }
  if (/push|send|distribute/.test(normalized) && /wallet|investor/.test(normalized) && /information|update|notice/.test(normalized)) {
    updates.push(createSuggestedUpdate('investor_update_rule', 'ZiLi-OS should prepare investor update records; wallet-pushed notices remain a custom requirement for review.', 'User described pushing investment information to investors.', sourceRef, 0.72));
  }
  if (normalized.includes('erc-3643') || normalized.includes('erc3643')) {
    updates.push(createSuggestedUpdate('protocol_base', 'ERC-3643', 'User asked for or accepted a permissioned token protocol base.', sourceRef, 0.86));
  }

  return updates;
}

function titleCaseProductSetupValue(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function normalizeProductSetupDate(value: string): string {
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (match?.[1] && match[2] && match[3]) {
    const monthIndex = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ].indexOf(match[2].slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
    }
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value.trim();
  return new Date(parsed).toISOString().slice(0, 10);
}

function extractCadenceNear(value: string, contextPattern: string): string | undefined {
  const cadenceTerms: Array<[RegExp, string]> = [
    [/\bintraday\b/, 'Intraday'],
    [/\bdaily\b|\beach day\b/, 'Daily'],
    [/\bweekly\b|\beach week\b/, 'Weekly'],
    [/\bmonthly\b|\beach month\b/, 'Monthly'],
    [/\bquarterly\b|\beach quarter\b|\bquarter\b/, 'Quarterly'],
    [/\bhalf[-\s]?yearly\b|\bsemi[-\s]?annual(?:ly)?\b/, 'Half-yearly'],
    [/\byearly\b|\bannually\b|\bannual\b/, 'Yearly'],
  ];

  for (const [termPattern, label] of cadenceTerms) {
    const termSource = `(?:${termPattern.source})`;
    const cadenceBeforeContext = new RegExp(`${termSource}(?:\\s+\\w+){0,4}\\s+${contextPattern}`, 'i');
    const contextBeforeCadence = new RegExp(`${contextPattern}(?:\\s+\\w+){0,4}\\s+${termSource}`, 'i');
    if (cadenceBeforeContext.test(value) || contextBeforeCadence.test(value)) return label;
  }

  return undefined;
}

function createSuggestedUpdate(
  fieldKey: ProductSetupFieldKey,
  proposedValue: ProductSetupFieldValue,
  rationale: string,
  sourceRef: string,
  confidence: number,
): ProductSetupSuggestedUpdate {
  return {
    id: `${fieldKey}-${sourceRef}`,
    fieldKey,
    proposedValue,
    rationale,
    sourceType: 'user_message',
    sourceRef,
    confidence,
  };
}

export function setProductSetupSuggestedUpdates(
  record: ProductSetupRecord,
  updates: ProductSetupSuggestedUpdate[],
): ProductSetupRecord {
  if (updates.length === 0) return record;
  const byId = new Map(record.pendingSuggestedUpdates.map((update) => [update.id, update]));
  updates.forEach((update) => byId.set(update.id, update));

  return {
    ...record,
    pendingSuggestedUpdates: [...byId.values()],
    updatedAtIso: new Date().toISOString(),
  };
}

export function confirmProductSetupUpdate(
  record: ProductSetupRecord,
  updateId: string,
): ProductSetupRecord {
  const update = record.pendingSuggestedUpdates.find((candidate) => candidate.id === updateId);
  if (!update) return record;

  return {
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
  };
}

export function deferProductSetupField(
  record: ProductSetupRecord,
  fieldKey: ProductSetupFieldKey,
  reason = 'User chose to add this before deployment.',
): ProductSetupRecord {
  return {
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
  };
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

  return {
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
  };
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

export function createUnsupportedRequirementDecisionsFromText(
  text: string,
  sourceRef: string,
): UnsupportedRequirementDecision[] {
  const normalized = text.toLowerCase();
  const decisions: UnsupportedRequirementDecision[] = [];

  if (/clawback|claw back|conditional transfer/.test(normalized)) {
    decisions.push({
      id: `unsupported-clawback-${sourceRef}`,
      requirement: 'Conditional transfers with clawback',
      mismatchReason: 'The current four protocol bases do not release an executable clawback adapter in the Sepolia prototype.',
      nearestEquivalent: 'Use approved-wallet transfer restrictions and document manual exception handling for MVP.',
      decision: 'pending',
      sourceRef,
    });
  }

  if (/peer\s*to\s*peer|p2p|buy-sell|buy sell|transfer.+each other/.test(normalized)) {
    decisions.push({
      id: `unsupported-p2p-settlement-${sourceRef}`,
      requirement: 'Investor peer-to-peer transfer and settlement workflow',
      mismatchReason: 'Approved-wallet transfers can be represented as a rule, but ZiLi-OS does not yet execute a marketplace, matching, liquidity, or settlement workflow.',
      nearestEquivalent: 'Allow only approved-wallet transfers and record P2P settlement/liquidity as excluded from MVP execution.',
      decision: 'pending',
      sourceRef,
    });
  }

  if (/push.+wallet|wallet.+push|send.+wallet/.test(normalized) && /information|update|notice/.test(normalized)) {
    decisions.push({
      id: `unsupported-wallet-push-${sourceRef}`,
      requirement: 'Push investment information directly to investor wallets',
      mismatchReason: 'The current prototype can record asset-servicing events, but it does not push arbitrary notices into wallets.',
      nearestEquivalent: 'Generate investor update records in Evidence Vault and keep wallet-push delivery outside MVP execution.',
      decision: 'pending',
      sourceRef,
    });
  }

  return decisions;
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

export function createProductSetupPackPayload(record: ProductSetupRecord, readModel = toProductSetupReadModel(record)) {
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
    generatedAtIso: new Date().toISOString(),
    warning: readModel.packPreview.warning,
    statusLabel: readModel.statusLabel,
    readinessLabel: readModel.readinessLabel,
    recommendedArchitectureTarget: readModel.protocolRecommendation.recommendedProtocol,
    currentExecutablePrototype: readModel.protocolRecommendation.executablePrototypeLabel,
    definitions,
    fields,
    deploymentWarnings: readModel.deploymentWarnings,
    deploymentWarningAcknowledgements: record.deploymentWarningAcknowledgements,
    unsupportedRequirementDecisions: record.unsupportedRequirementDecisions,
  };
}

export function createProductSetupPackMarkdown(record: ProductSetupRecord): string {
  const payload = createProductSetupPackPayload(record);
  const fieldRows = payload.fields
    .map((field) => `| ${field.requirement} | ${field.userInput} | ${field.interpretation} | ${field.source} | ${field.status} |`)
    .join('\n');
  const warningRows = payload.deploymentWarnings.length > 0
    ? payload.deploymentWarnings.map((warning) => `- ${warning.label}: ${warning.likelyError}`).join('\n')
    : '- No current Product Setup deployment warnings.';
  const unsupportedRows = payload.unsupportedRequirementDecisions.length > 0
    ? payload.unsupportedRequirementDecisions.map((decision) => `- ${decision.requirement}: ${decision.decision}. ${decision.nearestEquivalent ?? decision.mismatchReason}`).join('\n')
    : '- No unsupported/custom requirements recorded.';

  return [
    '# ZiLi-OS Product Setup Pack',
    '',
    `Generated at: ${payload.generatedAtIso}`,
    '',
    `> ${payload.warning}`,
    '',
    '## Protocol Fit',
    '',
    `- Recommended architecture target: ${payload.recommendedArchitectureTarget}`,
    `- Current executable prototype: ${payload.currentExecutablePrototype}`,
    '',
    '## Definitions Used In This Product Setup',
    '',
    ...payload.definitions.map((definition) => `- ${definition}`),
    '',
    '## Product Requirements And Provenance',
    '',
    '| Requirement | User input | ZiLi-OS interpretation | Source | Status |',
    '| --- | --- | --- | --- | --- |',
    fieldRows,
    '',
    '## Deployment Warnings',
    '',
    warningRows,
    '',
    '## Unsupported Or Custom Requirements',
    '',
    unsupportedRows,
    '',
    '## Included Documents',
    '',
    '- Product Requirements Document',
    '- Engineering smart-contract and Sepolia testnet details',
    '- PRD-to-contract translation',
    '- Asset servicing setup for distribution, wallet addresses, NAV, subscription, and redemption',
  ].join('\n');
}

export function createProductSetupPackPrintableHtml(record: ProductSetupRecord): string {
  const payload = createProductSetupPackPayload(record);
  const rows = payload.fields
    .map((field) => `<tr><td>${escapeHtml(field.requirement)}</td><td>${escapeHtml(field.userInput)}</td><td>${escapeHtml(field.interpretation)}</td><td>${escapeHtml(field.source)}</td><td>${escapeHtml(field.status)}</td></tr>`)
    .join('');

  return [
    '<!doctype html>',
    '<html><head><meta charset="utf-8"><title>ZiLi-OS Product Setup Pack</title>',
    '<style>body{font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.45;margin:32px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #d1d5db;padding:8px;text-align:left;vertical-align:top}h1,h2{margin-bottom:8px}.warning{background:#fff7ed;border:1px solid #fdba74;padding:12px}</style>',
    '</head><body>',
    '<h1>ZiLi-OS Product Setup Pack</h1>',
    `<p>Generated at: ${escapeHtml(payload.generatedAtIso)}</p>`,
    `<p class="warning">${escapeHtml(payload.warning)}</p>`,
    '<h2>Protocol Fit</h2>',
    `<p><strong>Recommended architecture target:</strong> ${escapeHtml(payload.recommendedArchitectureTarget)}</p>`,
    `<p><strong>Current executable prototype:</strong> ${escapeHtml(payload.currentExecutablePrototype)}</p>`,
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
