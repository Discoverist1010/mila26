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
  | 'issuer_owner'
  | 'product_type'
  | 'base_currency'
  | 'protocol_base'
  | 'expected_investor_count'
  | 'whitelisted_wallets_required'
  | 'subscription_stablecoins'
  | 'redemption_schedule'
  | 'redemption_payout_delay'
  | 'redemption_wallet'
  | 'admin_wallet'
  | 'burn_lock_rule'
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

export type ProductSetupRecord = {
  id: string;
  status: 'draft' | 'ready_for_engineering' | 'locked';
  fields: Record<ProductSetupFieldKey, ProductSetupField>;
  pendingSuggestedUpdates: ProductSetupSuggestedUpdate[];
  termExplanations: Record<string, TermExplanationState>;
  unsupportedRequirementDecisions: UnsupportedRequirementDecision[];
  updatedAtIso: string;
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
  requirementSections: Array<{
    title: string;
    fields: ProductSetupField[];
  }>;
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
  'product_type',
  'base_currency',
  'protocol_base',
  'expected_investor_count',
  'whitelisted_wallets_required',
  'subscription_stablecoins',
  'prototype_network',
];

const deploymentFieldKeys: ProductSetupFieldKey[] = ['admin_wallet', 'redemption_wallet'];

function createField(input: Omit<ProductSetupField, 'confirmedByUser'> & { confirmedByUser?: boolean }): ProductSetupField {
  return {
    ...input,
    confirmedByUser: input.confirmedByUser ?? false,
  };
}

export function createInitialProductSetupRecord(facts: FundFacts): ProductSetupRecord {
  return {
    id: 'product-setup-alpha-income-fund-i',
    status: 'draft',
    fields: {
      product_name: createField({
        key: 'product_name',
        label: 'Product name',
        value: facts.fundName,
        status: 'system_default',
        sourceType: 'system_default',
        sourceRef: 'starter_facts',
        usedByTabs: ['Overview', 'Evidence Vault', 'Contract Ops'],
        smartContractRelevance: 'operational_metadata',
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
        value: 'ERC-3643',
        status: 'inferred',
        sourceType: 'assistant_inference',
        sourceRef: 'default_permissioned_workflow',
        confidence: 0.82,
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
      subscription_stablecoins: createField({
        key: 'subscription_stablecoins',
        label: 'Subscription stablecoins',
        status: 'missing',
        usedByTabs: ['Subscription', 'Contract Ops'],
        smartContractRelevance: 'contract_parameter',
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
    updatedAtIso: new Date().toISOString(),
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
    ['user_confirmed', 'system_default', 'deferred'].includes(record.fields[key].status),
  ).length;
  const missingEssentials = essentialFieldKeys
    .map((key) => record.fields[key])
    .filter((field) => field.status === 'missing' || field.status === 'inferred' || field.status === 'user_stated');
  const deploymentBlockers = deploymentFieldKeys
    .map((key) => record.fields[key])
    .filter((field) => field.status !== 'user_confirmed' && field.status !== 'locked')
    .map((field) => `${field.label} is needed before wallet-signed Sepolia deployment can proceed.`);

  return {
    statusLabel: record.status === 'locked' ? 'Locked Product Setup snapshot' : 'Draft Product Setup',
    readinessLabel: `${completedEssentialCount}/${essentialFieldKeys.length} essentials confirmed, defaulted, or deliberately deferred`,
    completedEssentialCount,
    requiredEssentialCount: essentialFieldKeys.length,
    understandingSummary: createUnderstandingSummary(record, protocolRecommendation.recommendedProtocol),
    protocolRecommendation,
    missingEssentials,
    deploymentBlockers,
    requirementSections: [
      {
        title: 'Product snapshot',
        fields: (['product_name', 'issuer_owner', 'product_type', 'base_currency'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Protocol and token model',
        fields: (['protocol_base', 'expected_investor_count', 'whitelisted_wallets_required'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Subscription and redemption',
        fields: (['subscription_stablecoins', 'redemption_schedule', 'redemption_payout_delay', 'redemption_wallet', 'burn_lock_rule'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
      {
        title: 'Contract operations',
        fields: (['prototype_network', 'admin_wallet'] satisfies ProductSetupFieldKey[]).map((key) => record.fields[key]),
      },
    ],
    firstTimePrompts: [
      { termKey: 'admin_wallet', fieldKey: 'admin_wallet', prompt: productSetupPromptForTerm('admin_wallet') },
      { termKey: 'redemption_wallet', fieldKey: 'redemption_wallet', prompt: productSetupPromptForTerm('redemption_wallet') },
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

function createUnderstandingSummary(record: ProductSetupRecord, recommendedProtocol: ProductSetupProtocolBase): string {
  const investors = fieldDisplayValue(record.fields.expected_investor_count) || 'an investor count still to confirm';
  const stablecoins = fieldDisplayValue(record.fields.subscription_stablecoins) || 'stablecoins still to confirm';
  const redemption = fieldDisplayValue(record.fields.redemption_schedule) || 'redemption timing still to confirm';
  const delay = fieldDisplayValue(record.fields.redemption_payout_delay) || 'payout delay still to confirm';

  return `ZiLi-OS currently understands this as a ${fieldDisplayValue(record.fields.base_currency) || 'base-currency'} ${fieldDisplayValue(record.fields.product_type) || 'tokenised product'} for ${investors}. Investors subscribe using ${stablecoins}, wallet access is ${record.fields.whitelisted_wallets_required.value === true ? 'restricted to approved wallets' : 'not yet restricted'}, redemption is ${redemption}, and payout delay is ${delay}. Recommended protocol base: ${recommendedProtocol}.`;
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
  const investorMatch = normalized.match(/(?:about\s*)?(\d{1,3})\s+(?:investors|wallets)/);
  const delayMatch = normalized.match(/(\d{1,3})\s*(?:business\s*)?(?:day|days|hour|hours|week|weeks)/);

  if (investorMatch?.[1]) {
    updates.push(createSuggestedUpdate('expected_investor_count', Number(investorMatch[1]), 'User described expected investor scale.', sourceRef, 0.88));
  }
  if (normalized.includes('usdc')) {
    updates.push(createSuggestedUpdate('subscription_stablecoins', ['USDC'], 'User mentioned USDC subscription or payout rails.', sourceRef, 0.9));
  }
  if (normalized.includes('whitelist') || normalized.includes('approved wallet')) {
    updates.push(createSuggestedUpdate('whitelisted_wallets_required', true, 'User described approved or whitelisted wallet access.', sourceRef, 0.9));
  }
  if (normalized.includes('quarter')) {
    updates.push(createSuggestedUpdate('redemption_schedule', 'Quarterly', 'User described quarterly redemption timing.', sourceRef, 0.82));
  }
  if (delayMatch?.[0]) {
    updates.push(createSuggestedUpdate('redemption_payout_delay', delayMatch[0], 'User described a redemption payout delay.', sourceRef, 0.84));
  }
  if (normalized.includes('erc-3643') || normalized.includes('erc3643')) {
    updates.push(createSuggestedUpdate('protocol_base', 'ERC-3643', 'User asked for or accepted a permissioned token protocol base.', sourceRef, 0.86));
  }

  return updates;
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

export function classifyWalletSetupResponse(value: string): 'address' | 'role_placeholder' | 'not_sure' | 'invalid' {
  const trimmed = value.trim();
  if (!trimmed) return 'invalid';
  if (/not sure|later|before deployment|to be added/i.test(trimmed)) return 'not_sure';
  if (isValidNonZeroEvmAddress(trimmed)) return 'address';
  if (/wallet|operations|issuer|admin|treasury|team|role/i.test(trimmed)) return 'role_placeholder';
  return 'invalid';
}
