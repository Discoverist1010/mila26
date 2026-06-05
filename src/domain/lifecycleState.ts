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

export type Mila26LifecycleReadModel = {
  investorRegistry: InvestorRegistryReadModel;
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

  return {
    investorRegistry,
    subscriptionStatus: state.subscriptionParameters.permittedStablecoins.length > 0 ? 'draft' : 'needs_parameters',
    redemptionStatus:
      state.redemptionParameters.redemptionDelayUnit && state.redemptionParameters.redemptionDelayValue
        ? 'draft'
        : 'needs_parameters',
    maturityStatus: state.maturityParameters.maturityDate ? 'draft' : 'locked_for_later',
  };
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
