import type { FundFacts } from './schemas';
import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';
import {
  deploymentProductSetupFieldKeys,
  essentialProductSetupFieldKeys,
  type ProductSetupDeploymentWarning,
  type ProductSetupDeploymentWarningAcknowledgement,
  type ProductSetupField,
  type ProductSetupFieldKey,
  type ProductSetupFieldSourceType,
  type ProductSetupFieldStatus,
  type ProductSetupFieldValue,
  type ProductSetupHandoffNote,
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

  return {
    ...record,
    fields,
    downstreamHandoffNotes: record.downstreamHandoffNotes ?? [],
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
  const completedEssentialCount = essentialProductSetupFieldKeys.filter((key) =>
    ['user_confirmed', 'system_default', 'locked'].includes(record.fields[key].status),
  ).length;
  const missingEssentials = essentialProductSetupFieldKeys
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
    readinessLabel: `${completedEssentialCount}/${essentialProductSetupFieldKeys.length} essentials confirmed, defaulted, or deliberately deferred`,
    completedEssentialCount,
    requiredEssentialCount: essentialProductSetupFieldKeys.length,
    understandingSummary: createUnderstandingSummary(record, protocolRecommendation.recommendedProtocol),
    protocolRecommendation,
    missingEssentials,
    deploymentBlockers,
    deploymentWarnings,
    hasUnacknowledgedDeploymentWarnings,
    latestDeploymentWarningAcknowledgement,
    profileRows: toProductSetupProfileRows(record, protocolRecommendation),
    downstreamHandoffs: toProductSetupDownstreamHandoffs(record),
    requirementSections: [
      {
        title: 'Product snapshot',
        fields: (['product_name', 'token_symbol', 'issuer_owner', 'product_type', 'base_currency', 'income_treatment'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
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
        fields: (['nav_cadence', 'nav_source', 'income_treatment', 'income_payout_cadence', 'investor_update_rule', 'initial_distribution_date', 'initial_investor_register_rule', 'maturity_date', 'maturity_closeout_rule'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
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
  const profileValue = (fieldKey: ProductSetupFieldKey) => fieldDisplayValueWithPending(record, fieldKey);
  const hasProtocolRecommendationBasis = [
    'product_type',
    'subscription_stablecoins',
    'investor_wallet_rule',
    'whitelisted_wallets_required',
    'burn_lock_rule',
  ].some((fieldKey) => Boolean(profileValue(fieldKey as ProductSetupFieldKey)));

  return [
    profileRow(record, {
      id: 'instrument',
      label: 'Instrument / structure',
      fieldKeys: ['product_type', 'product_name'],
      fallback: 'To be filled',
      whyItMatters: 'This anchors the PRD and helps later tabs decide which workflows are in scope.',
    }),
    profileRow(record, {
      id: 'asset_class',
      label: 'Asset class',
      fieldKeys: ['product_type'],
      fallback: 'To be filled',
      whyItMatters: 'Asset class informs valuation, servicing, and disclosure assumptions.',
    }),
    profileRow(record, {
      id: 'base_currency',
      label: 'Base currency',
      fieldKeys: ['base_currency'],
      fallback: 'To be filled',
    }),
    {
      id: 'income_treatment',
      label: 'Income treatment',
      value: incomeTreatmentProfileValue(profileValue('income_treatment'), profileValue('income_payout_cadence')),
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['income_treatment', 'income_payout_cadence']),
      fieldKeys: ['income_treatment', 'income_payout_cadence'],
      whyItMatters: 'Income treatment determines whether Asset Servicing needs distribution workflows.',
    },
    {
      id: 'term',
      label: 'Term',
      value: profileValue('maturity_date') || 'To be filled',
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['maturity_date']),
      fieldKeys: ['maturity_date'],
      whyItMatters: 'A maturity or wind-down date activates closeout planning later.',
    },
    {
      id: 'settlement_transfer',
      label: 'Settlement & transfer',
      value: compactText([
        profileValue('subscription_stablecoins'),
        profileValue('investor_wallet_rule'),
      ]) || 'To be filled',
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['subscription_stablecoins', 'investor_wallet_rule']),
      fieldKeys: ['subscription_stablecoins', 'investor_wallet_rule'],
      whyItMatters: 'Settlement and transfer assumptions determine which Subscription, Investor Wallets, and Contract Ops workflows are needed.',
    },
    {
      id: 'protocol_target',
      label: 'Protocol target',
      value:
        fieldDisplayValue(record.fields.protocol_base) ||
        (hasProtocolRecommendationBasis ? `${protocolRecommendation.recommendedProtocol} recommended; not selected` : 'To be filled'),
      provenanceLabel: fieldDisplayValue(record.fields.protocol_base)
        ? provenanceLabelForFields([record.fields.protocol_base])
        : hasProtocolRecommendationBasis
          ? 'Needs review'
          : 'Missing',
      fieldKeys: ['protocol_base'],
      whyItMatters: 'Protocol target guides later questions, while executable prototype capability remains separate.',
    },
    {
      id: 'subscription_switch',
      label: 'Subscription',
      value: profileValue('subscription_cadence')
        ? `Enabled: ${profileValue('subscription_cadence')}`
        : 'To be filled',
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['subscription_cadence']),
      fieldKeys: ['subscription_cadence'],
    },
    {
      id: 'redemption_switch',
      label: 'Redemption',
      value: profileValue('redemption_cadence') || profileValue('redemption_schedule')
        ? `Enabled: ${profileValue('redemption_cadence') || profileValue('redemption_schedule')}`
        : 'To be filled',
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['redemption_cadence', 'redemption_schedule']),
      fieldKeys: ['redemption_cadence', 'redemption_schedule'],
    },
    {
      id: 'servicing_switch',
      label: 'Servicing required',
      value: compactText([
        profileValue('nav_cadence') && `NAV: ${profileValue('nav_cadence')}`,
        profileValue('nav_source') && `Source: ${profileValue('nav_source')}`,
      ]) || 'To be filled',
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['nav_cadence', 'nav_source']),
      fieldKeys: ['nav_cadence', 'nav_source'],
    },
    {
      id: 'wind_down_switch',
      label: 'Maturity / wind-down',
      value: profileValue('maturity_closeout_rule') || profileValue('maturity_date') || 'To be filled',
      provenanceLabel: provenanceLabelForFieldsWithPending(record, ['maturity_closeout_rule', 'maturity_date']),
      fieldKeys: ['maturity_closeout_rule', 'maturity_date'],
    },
  ];
}

function profileRow(
  record: ProductSetupRecord,
  input: {
    id: string;
    label: string;
    fieldKeys: ProductSetupFieldKey[];
    fallback: string;
    whyItMatters?: string;
  },
): ProductSetupReadModel['profileRows'][number] {
  return {
    id: input.id,
    label: input.label,
    value: compactText(input.fieldKeys.map((fieldKey) => fieldDisplayValueWithPending(record, fieldKey))) || input.fallback,
    provenanceLabel: provenanceLabelForFieldsWithPending(record, input.fieldKeys),
    fieldKeys: input.fieldKeys,
    whyItMatters: input.whyItMatters,
  };
}

function incomeTreatmentProfileValue(treatment: string, payoutCadence: string): string {
  if (treatment && payoutCadence && !/^no\b|no income|no distribution|accumulat/i.test(treatment)) {
    return `${treatment}; payout cadence: ${payoutCadence}`;
  }
  if (treatment) return treatment;
  if (payoutCadence) return `Payout cadence: ${payoutCadence}`;
  return 'To be filled';
}

function fieldDisplayValueWithPending(record: ProductSetupRecord, fieldKey: ProductSetupFieldKey): string {
  const directValue = fieldDisplayValue(record.fields[fieldKey]);
  if (directValue) return directValue;
  const pendingUpdate = findPendingUpdateForField(record, fieldKey);
  if (!pendingUpdate) return '';
  if (Array.isArray(pendingUpdate.proposedValue)) return pendingUpdate.proposedValue.join(', ');
  if (typeof pendingUpdate.proposedValue === 'boolean') return pendingUpdate.proposedValue ? 'Yes' : 'No';
  return String(pendingUpdate.proposedValue);
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
  if (populated.some((field) => field.status === 'system_default')) return 'Assumed';
  return 'Needs review';
}

function compactText(parts: Array<string | undefined | false>): string {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(' · ');
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
  const detailParts = input.fieldKeys
    .map((fieldKey) => {
      const field = record.fields[fieldKey];
      const value = fieldDisplayValue(field) || field.rolePlaceholder;
      if (!value || field.status === 'missing' || !isProductSetupHandoffEligibleField(field)) return undefined;
      return { fieldKey, detail: `${field.label}: ${value}` };
    })
    .filter((part): part is { fieldKey: ProductSetupFieldKey; detail: string } => Boolean(part));
  const detail = detailParts.map((part) => part.detail).join('; ');

  return {
    id: input.id,
    target: input.target,
    title: input.title,
    detail,
    sourceFieldKeys: detailParts.length > 0 ? detailParts.map((part) => part.fieldKey) : input.fieldKeys,
    sourceRef: input.sourceRef,
    status: detail ? 'draft_note_ready' : 'needs_clarification',
    createdAtIso: input.createdAtIso,
  };
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
    profileRows: readModel.profileRows,
    downstreamHandoffs: readModel.downstreamHandoffs,
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
  const profileRows = payload.profileRows
    .map((row) => `| ${row.label} | ${row.value} | ${row.provenanceLabel} |`)
    .join('\n');
  const handoffRows = payload.downstreamHandoffs.length > 0
    ? payload.downstreamHandoffs.map((handoff) => `| ${handoff.title} | ${productSetupHandoffTargetLabel(handoff.target)} | ${handoff.status.replaceAll('_', ' ')} | ${handoff.detail} |`).join('\n')
    : '| None | - | - | No downstream handoffs recorded. |';

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
    '## What Is This Product?',
    '',
    '| Attribute | Value | Provenance |',
    '| --- | --- | --- |',
    profileRows,
    '',
    '## Downstream Handoff Register',
    '',
    '| Detail | Destination tab | Status | Draft note |',
    '| --- | --- | --- | --- |',
    handoffRows,
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
    '<html><head><meta charset="utf-8"><title>ZiLi-OS Product Setup Pack</title>',
    '<style>body{font-family:Inter,Arial,sans-serif;color:#111827;line-height:1.45;margin:32px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #d1d5db;padding:8px;text-align:left;vertical-align:top}h1,h2{margin-bottom:8px}.warning{background:#fff7ed;border:1px solid #fdba74;padding:12px}</style>',
    '</head><body>',
    '<h1>ZiLi-OS Product Setup Pack</h1>',
    `<p>Generated at: ${escapeHtml(payload.generatedAtIso)}</p>`,
    `<p class="warning">${escapeHtml(payload.warning)}</p>`,
    '<h2>Protocol Fit</h2>',
    `<p><strong>Recommended architecture target:</strong> ${escapeHtml(payload.recommendedArchitectureTarget)}</p>`,
    `<p><strong>Current executable prototype:</strong> ${escapeHtml(payload.currentExecutablePrototype)}</p>`,
    '<h2>What Is This Product?</h2>',
    '<table><thead><tr><th>Attribute</th><th>Value</th><th>Provenance</th></tr></thead><tbody>',
    profileRows,
    '</tbody></table>',
    '<h2>Downstream Handoff Register</h2>',
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
