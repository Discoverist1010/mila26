import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';

export const MAX_INVESTOR_REGISTRY_ENTRIES = 50;

export type InvestorRegistryEntryStatus = 'draft' | 'ready_to_whitelist' | 'whitelisted_local_session_only';

export type InvestorRegistryEntry = {
  id: string;
  walletAddress: string;
  status: InvestorRegistryEntryStatus;
};

export type SubscriptionParameters = {
  permittedStablecoins: string[];
  subscriptionWindow?: string;
  minimumSubscriptionAmount?: string;
  paymentAddress?: string;
  paymentPerToken?: string;
};

export type RedemptionParameters = {
  redemptionWindow?: string;
  redemptionDelayUnit?: 'minutes' | 'hours' | 'days';
  redemptionDelayValue?: number;
  redemptionWalletAddress?: string;
  payoutStablecoin?: string;
  payoutPerToken?: string;
};

export type MaturityParameters = {
  maturityDate?: string;
  closeoutMethod?: string;
};

export type Mila26LifecycleState = {
  investorRegistryEntries: InvestorRegistryEntry[];
  subscriptionParameters: SubscriptionParameters;
  redemptionParameters: RedemptionParameters;
  maturityParameters: MaturityParameters;
};

export type InvestorRegistryReadModelEntry = InvestorRegistryEntry & {
  normalizedWalletAddress?: string;
  statusLabel: string;
  validationStatus: 'valid' | 'invalid' | 'duplicate';
  validationMessages: string[];
  canUseForWhitelist: boolean;
};

export type InvestorRegistryReadModel = {
  status: 'empty' | 'needs_attention' | 'ready' | 'active';
  statusLabel: string;
  statusDetail: string;
  entries: InvestorRegistryReadModelEntry[];
  entryCount: number;
  readyToWhitelistCount: number;
  whitelistedCount: number;
  invalidCount: number;
  duplicateCount: number;
  remainingSlots: number;
  isAtCapacity: boolean;
  canAddEntry: boolean;
  blockingReasons: string[];
};

export type LifecycleParameterStatus = 'needs_parameters' | 'draft' | 'ready' | 'locked_for_later';

export type SubscriptionParametersReadModel = {
  status: LifecycleParameterStatus;
  statusLabel: string;
  statusDetail: string;
  normalizedPermittedStablecoins: string[];
  validationMessages: string[];
  isReadyForTemplate: boolean;
};

export type RedemptionParametersReadModel = {
  status: LifecycleParameterStatus;
  statusLabel: string;
  statusDetail: string;
  validationMessages: string[];
  isReadyForTemplate: boolean;
};

export type SubscriptionRedemptionTemplateReadModel = {
  status: LifecycleParameterStatus;
  statusLabel: string;
  statusDetail: string;
  validationMessages: string[];
  canGenerateTemplateParameters: boolean;
  parameterSummary: {
    permittedStablecoins: string[];
    subscriptionWindow?: string;
    minimumSubscriptionAmount?: string;
    paymentAddress?: string;
    paymentPerToken?: string;
    redemptionWindow?: string;
    redemptionDelay?: string;
    redemptionWalletAddress?: string;
    payoutStablecoin?: string;
    payoutPerToken?: string;
  };
};

export type Mila26LifecycleReadModel = {
  investorRegistry: InvestorRegistryReadModel;
  subscription: SubscriptionParametersReadModel;
  redemption: RedemptionParametersReadModel;
  subscriptionRedemptionTemplate: SubscriptionRedemptionTemplateReadModel;
  subscriptionStatus: LifecycleParameterStatus;
  redemptionStatus: LifecycleParameterStatus;
  maturityStatus: LifecycleParameterStatus;
};

export function createInitialMila26LifecycleState(): Mila26LifecycleState {
  return {
    investorRegistryEntries: [],
    subscriptionParameters: {
      permittedStablecoins: [],
    },
    redemptionParameters: {},
    maturityParameters: {},
  };
}

export function normalizeInvestorWalletAddress(walletAddress: string): string {
  return walletAddress.trim();
}

export function createInvestorRegistryEntry(input: {
  id: string;
  walletAddress: string;
  existingEntries?: InvestorRegistryEntry[];
}): InvestorRegistryEntry {
  const walletAddress = normalizeInvestorWalletAddress(input.walletAddress);
  const isDuplicate = hasInvestorWalletDuplicate(walletAddress, input.existingEntries ?? []);

  return {
    id: input.id,
    walletAddress,
    status: isValidNonZeroEvmAddress(walletAddress) && !isDuplicate ? 'ready_to_whitelist' : 'draft',
  };
}

export function hasInvestorWalletDuplicate(walletAddress: string, entries: InvestorRegistryEntry[]): boolean {
  const normalized = normalizeInvestorWalletAddress(walletAddress).toLowerCase();
  if (!normalized) return false;
  return entries.some((entry) => normalizeInvestorWalletAddress(entry.walletAddress).toLowerCase() === normalized);
}

export function markInvestorWalletWhitelisted(
  state: Mila26LifecycleState,
  walletAddress: string | undefined,
): Mila26LifecycleState {
  const normalized = normalizeInvestorWalletAddress(walletAddress ?? '').toLowerCase();
  if (!normalized) return state;

  let changed = false;
  const nextEntries = state.investorRegistryEntries.map((entry) => {
    if (normalizeInvestorWalletAddress(entry.walletAddress).toLowerCase() !== normalized) return entry;
    if (entry.status === 'whitelisted_local_session_only') return entry;

    changed = true;
    return { ...entry, status: 'whitelisted_local_session_only' as const };
  });

  if (!changed) return state;

  return {
    ...state,
    investorRegistryEntries: nextEntries,
  };
}

export function toMila26LifecycleReadModel(state: Mila26LifecycleState): Mila26LifecycleReadModel {
  const investorRegistry = toInvestorRegistryReadModel(state.investorRegistryEntries);
  const subscription = toSubscriptionParametersReadModel(state.subscriptionParameters);
  const redemption = toRedemptionParametersReadModel(state.redemptionParameters);
  const subscriptionRedemptionTemplate = toSubscriptionRedemptionTemplateReadModel(
    state.subscriptionParameters,
    state.redemptionParameters,
    subscription,
    redemption,
  );

  return {
    investorRegistry,
    subscription,
    redemption,
    subscriptionRedemptionTemplate,
    subscriptionStatus: subscription.status,
    redemptionStatus: redemption.status,
    maturityStatus: state.maturityParameters.maturityDate ? 'draft' : 'locked_for_later',
  };
}

export function parsePermittedStablecoins(value: string): string[] {
  return value
    .split(',')
    .map((stablecoin) => stablecoin.trim().toUpperCase())
    .filter(Boolean)
    .filter((stablecoin, index, stablecoins) => stablecoins.indexOf(stablecoin) === index);
}

function toSubscriptionParametersReadModel(parameters: SubscriptionParameters): SubscriptionParametersReadModel {
  const normalizedPermittedStablecoins = parameters.permittedStablecoins
    .map((stablecoin) => stablecoin.trim().toUpperCase())
    .filter(Boolean)
    .filter((stablecoin, index, stablecoins) => stablecoins.indexOf(stablecoin) === index);
  const validationMessages: string[] = [];
  const hasAnyInput =
    normalizedPermittedStablecoins.length > 0 ||
    Boolean(parameters.subscriptionWindow?.trim()) ||
    Boolean(parameters.minimumSubscriptionAmount?.trim()) ||
    Boolean(parameters.paymentAddress?.trim()) ||
    Boolean(parameters.paymentPerToken?.trim());

  if (normalizedPermittedStablecoins.length === 0) validationMessages.push('Add at least one permitted stablecoin.');
  if (!parameters.subscriptionWindow?.trim()) validationMessages.push('Add a subscription window.');
  if (!isPositiveNumericString(parameters.minimumSubscriptionAmount)) validationMessages.push('Minimum subscription amount must be greater than zero.');
  if (!isValidNonZeroEvmAddress(parameters.paymentAddress?.trim() ?? '')) validationMessages.push('Payment wallet or contract address must be a valid non-zero EVM address.');
  if (!isPositiveNumericString(parameters.paymentPerToken)) validationMessages.push('Payment per token must be greater than zero.');

  const status: LifecycleParameterStatus = validationMessages.length === 0 ? 'ready' : hasAnyInput ? 'draft' : 'needs_parameters';

  return {
    status,
    statusLabel: subscriptionStatusLabel(status),
    statusDetail: subscriptionStatusDetail(status, normalizedPermittedStablecoins.length, validationMessages.length),
    normalizedPermittedStablecoins,
    validationMessages,
    isReadyForTemplate: status === 'ready',
  };
}

function toRedemptionParametersReadModel(parameters: RedemptionParameters): RedemptionParametersReadModel {
  const validationMessages: string[] = [];
  const hasAnyInput =
    Boolean(parameters.redemptionWindow?.trim()) ||
    Boolean(parameters.redemptionDelayUnit) ||
    Boolean(parameters.redemptionDelayValue) ||
    Boolean(parameters.redemptionWalletAddress?.trim()) ||
    Boolean(parameters.payoutStablecoin?.trim()) ||
    Boolean(parameters.payoutPerToken?.trim());

  if (!parameters.redemptionWindow?.trim()) validationMessages.push('Add a redemption window or date.');
  if (!parameters.redemptionDelayUnit) validationMessages.push('Choose a redemption delay unit.');
  if (!Number.isFinite(parameters.redemptionDelayValue) || (parameters.redemptionDelayValue ?? 0) <= 0) {
    validationMessages.push('Redemption delay duration must be greater than zero.');
  }
  if (!isValidNonZeroEvmAddress(parameters.redemptionWalletAddress?.trim() ?? '')) {
    validationMessages.push('Redemption wallet address must be a valid non-zero EVM address.');
  }
  if (!parameters.payoutStablecoin?.trim()) validationMessages.push('Add a stablecoin payout asset.');
  if (!isPositiveNumericString(parameters.payoutPerToken)) validationMessages.push('Payout per token must be greater than zero.');

  const status: LifecycleParameterStatus = validationMessages.length === 0 ? 'ready' : hasAnyInput ? 'draft' : 'needs_parameters';

  return {
    status,
    statusLabel: redemptionStatusLabel(status),
    statusDetail: redemptionStatusDetail(status, parameters.redemptionDelayValue, parameters.redemptionDelayUnit, validationMessages.length),
    validationMessages,
    isReadyForTemplate: status === 'ready',
  };
}

function toSubscriptionRedemptionTemplateReadModel(
  subscriptionParameters: SubscriptionParameters,
  redemptionParameters: RedemptionParameters,
  subscription: SubscriptionParametersReadModel,
  redemption: RedemptionParametersReadModel,
): SubscriptionRedemptionTemplateReadModel {
  const validationMessages = [
    ...subscription.validationMessages.map((message) => `Subscription: ${message}`),
    ...redemption.validationMessages.map((message) => `Redemption: ${message}`),
  ];
  const status: LifecycleParameterStatus =
    subscription.status === 'ready' && redemption.status === 'ready'
      ? 'ready'
      : subscription.status === 'needs_parameters' && redemption.status === 'needs_parameters'
        ? 'needs_parameters'
        : 'draft';

  return {
    status,
    statusLabel: templateStatusLabel(status),
    statusDetail:
      status === 'ready'
        ? 'Subscription-redemption template parameters are ready for smart contract handoff.'
        : status === 'draft'
          ? 'Complete remaining subscription and redemption parameters before template handoff.'
          : 'Add subscription and redemption parameters to prepare the template handoff.',
    validationMessages,
    canGenerateTemplateParameters: status === 'ready',
    parameterSummary: {
      permittedStablecoins: subscription.normalizedPermittedStablecoins,
      subscriptionWindow: normalizedOptional(subscriptionParameters.subscriptionWindow),
      minimumSubscriptionAmount: normalizedOptional(subscriptionParameters.minimumSubscriptionAmount),
      paymentAddress: normalizedOptional(subscriptionParameters.paymentAddress),
      paymentPerToken: normalizedOptional(subscriptionParameters.paymentPerToken),
      redemptionWindow: normalizedOptional(redemptionParameters.redemptionWindow),
      redemptionDelay:
        redemptionParameters.redemptionDelayValue && redemptionParameters.redemptionDelayUnit
          ? `${redemptionParameters.redemptionDelayValue} ${redemptionParameters.redemptionDelayUnit}`
          : undefined,
      redemptionWalletAddress: normalizedOptional(redemptionParameters.redemptionWalletAddress),
      payoutStablecoin: normalizedOptional(redemptionParameters.payoutStablecoin)?.toUpperCase(),
      payoutPerToken: normalizedOptional(redemptionParameters.payoutPerToken),
    },
  };
}

function normalizedOptional(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

function isPositiveNumericString(value: string | undefined): boolean {
  if (!value?.trim()) return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0;
}

function subscriptionStatusLabel(status: LifecycleParameterStatus): string {
  if (status === 'ready') return 'Subscription: Ready for template';
  if (status === 'draft') return 'Subscription: Needs review';
  return 'Subscription: Parameters needed';
}

function subscriptionStatusDetail(status: LifecycleParameterStatus, stablecoinCount: number, validationCount: number): string {
  if (status === 'ready') return `${stablecoinCount} permitted stablecoin(s) configured for subscription.`;
  if (status === 'draft') return `${validationCount} subscription parameter item(s) still need attention.`;
  return 'Define stablecoins, subscription window, payment address, and payment per token.';
}

function redemptionStatusLabel(status: LifecycleParameterStatus): string {
  if (status === 'ready') return 'Redemption: Ready for template';
  if (status === 'draft') return 'Redemption: Needs review';
  return 'Redemption: Parameters needed';
}

function redemptionStatusDetail(
  status: LifecycleParameterStatus,
  delayValue: number | undefined,
  delayUnit: RedemptionParameters['redemptionDelayUnit'],
  validationCount: number,
): string {
  if (status === 'ready') return `Redemption delay configured: ${delayValue} ${delayUnit}.`;
  if (status === 'draft') return `${validationCount} redemption parameter item(s) still need attention.`;
  return 'Define redemption window, wallet, payout stablecoin, payout per token, and delay.';
}

function templateStatusLabel(status: LifecycleParameterStatus): string {
  if (status === 'ready') return 'Template handoff ready';
  if (status === 'draft') return 'Template handoff needs parameters';
  return 'Template handoff not started';
}

function toInvestorRegistryReadModel(entries: InvestorRegistryEntry[]): InvestorRegistryReadModel {
  const normalizedCounts = entries.reduce<Record<string, number>>((counts, entry) => {
    const normalized = normalizeInvestorWalletAddress(entry.walletAddress).toLowerCase();
    if (normalized) counts[normalized] = (counts[normalized] ?? 0) + 1;
    return counts;
  }, {});

  const readModelEntries = entries.map<InvestorRegistryReadModelEntry>((entry) => {
    const normalizedWalletAddress = normalizeInvestorWalletAddress(entry.walletAddress);
    const validationMessages: string[] = [];
    const isValidWallet = isValidNonZeroEvmAddress(normalizedWalletAddress);
    const isDuplicate = normalizedWalletAddress
      ? (normalizedCounts[normalizedWalletAddress.toLowerCase()] ?? 0) > 1
      : false;

    if (!normalizedWalletAddress) validationMessages.push('Wallet address is required.');
    if (normalizedWalletAddress && !isValidWallet) validationMessages.push('Wallet address must be a valid non-zero EVM address.');
    if (isDuplicate) validationMessages.push('Wallet address is already in the registry.');

    const validationStatus = isDuplicate ? 'duplicate' : isValidWallet ? 'valid' : 'invalid';
    const canUseForWhitelist = validationStatus === 'valid' && entry.status !== 'whitelisted_local_session_only';

    return {
      ...entry,
      normalizedWalletAddress: normalizedWalletAddress || undefined,
      statusLabel: investorRegistryEntryStatusLabel(entry.status, validationStatus),
      validationStatus,
      validationMessages,
      canUseForWhitelist,
    };
  });

  const entryCount = readModelEntries.length;
  const readyToWhitelistCount = readModelEntries.filter((entry) => entry.canUseForWhitelist).length;
  const whitelistedCount = readModelEntries.filter((entry) => entry.status === 'whitelisted_local_session_only').length;
  const invalidCount = readModelEntries.filter((entry) => entry.validationStatus === 'invalid').length;
  const duplicateCount = readModelEntries.filter((entry) => entry.validationStatus === 'duplicate').length;
  const remainingSlots = Math.max(0, MAX_INVESTOR_REGISTRY_ENTRIES - entryCount);
  const isAtCapacity = remainingSlots === 0;
  const canAddEntry = !isAtCapacity;
  const blockingReasons: string[] = [];

  if (invalidCount > 0) blockingReasons.push('Resolve invalid wallet addresses.');
  if (duplicateCount > 0) blockingReasons.push('Remove duplicate wallet addresses.');
  if (!canAddEntry) blockingReasons.push('Investor registry is at the 50 wallet limit.');

  const status = investorRegistryStatus({
    entryCount,
    readyToWhitelistCount,
    whitelistedCount,
    invalidCount,
    duplicateCount,
  });

  return {
    status,
    statusLabel: investorRegistryStatusLabel(status),
    statusDetail: investorRegistryStatusDetail(status, entryCount, readyToWhitelistCount, whitelistedCount),
    entries: readModelEntries,
    entryCount,
    readyToWhitelistCount,
    whitelistedCount,
    invalidCount,
    duplicateCount,
    remainingSlots,
    isAtCapacity,
    canAddEntry,
    blockingReasons,
  };
}

function investorRegistryStatus(input: {
  entryCount: number;
  readyToWhitelistCount: number;
  whitelistedCount: number;
  invalidCount: number;
  duplicateCount: number;
}): InvestorRegistryReadModel['status'] {
  if (input.invalidCount > 0 || input.duplicateCount > 0) return 'needs_attention';
  if (input.whitelistedCount > 0) return 'active';
  if (input.readyToWhitelistCount > 0) return 'ready';
  return 'empty';
}

function investorRegistryEntryStatusLabel(
  status: InvestorRegistryEntryStatus,
  validationStatus: InvestorRegistryReadModelEntry['validationStatus'],
): string {
  if (validationStatus === 'duplicate') return 'Duplicate wallet';
  if (validationStatus === 'invalid') return 'Needs valid wallet';
  if (status === 'ready_to_whitelist') return 'Ready to whitelist';
  if (status === 'whitelisted_local_session_only') return 'Whitelisted locally';
  return 'Draft';
}

function investorRegistryStatusLabel(status: InvestorRegistryReadModel['status']): string {
  if (status === 'needs_attention') return 'Investor Registry: Needs attention';
  if (status === 'ready') return 'Investor Registry: Ready to whitelist';
  if (status === 'active') return 'Investor Registry: Active';
  return 'Investor Registry: Wallets needed';
}

function investorRegistryStatusDetail(
  status: InvestorRegistryReadModel['status'],
  entryCount: number,
  readyToWhitelistCount: number,
  whitelistedCount: number,
): string {
  if (status === 'needs_attention') return 'Resolve invalid or duplicate wallets before contract operations.';
  if (status === 'active') return `${whitelistedCount} wallet(s) whitelisted in this local session.`;
  if (status === 'ready') return `${readyToWhitelistCount} wallet(s) ready for the SCP Whitelist Wallet operation.`;
  return `Add up to ${MAX_INVESTOR_REGISTRY_ENTRIES} whitelisted investor wallet addresses.`;
}
