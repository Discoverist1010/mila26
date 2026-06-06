import type { DeploymentEvidenceReadModel } from './deploymentEvidenceReadModel';
import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';

export type WalletWhitelistOperationStatus =
  | 'not_started'
  | 'blocked'
  | 'ready'
  | 'awaiting_wallet_confirmation'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'failed';

export type WalletWhitelistOperationErrorCode =
  | 'provider_unavailable'
  | 'wallet_not_connected'
  | 'wrong_chain'
  | 'account_changed'
  | 'deployment_evidence_missing'
  | 'contract_address_missing'
  | 'contract_address_invalid'
  | 'target_wallet_missing'
  | 'target_wallet_invalid'
  | 'abi_function_missing'
  | 'duplicate_attempt'
  | 'provider_rejected'
  | 'provider_error'
  | 'receipt_failed';

export type WalletWhitelistOperationReceiptStatus = 'pending' | 'success' | 'failed';
export type WalletWhitelistEvidenceStatus = 'not_available' | 'receipt_confirmed' | 'decoded_from_receipt';
export type WalletWhitelistTransactionHashSource = 'provider_returned' | 'absent';
export type WalletWhitelistReceiptSource = 'provider_receipt' | 'absent';
export type WalletWhitelistEvidencePersistence = 'local_session_only';

export type WalletWhitelistDecodedEvent = {
  eventName: 'WalletWhitelisted';
  wallet: string;
  allowed: true;
  operator?: string;
};

export type WalletWhitelistOperationState = {
  operationStatus: Exclude<WalletWhitelistOperationStatus, 'ready'>;
  attemptId?: string;
  operationTransactionHash?: string;
  contractAddress?: string;
  targetWalletAddress?: string;
  allowed?: true;
  operationReceiptStatus?: WalletWhitelistOperationReceiptStatus;
  decodedEvent?: WalletWhitelistDecodedEvent;
  errorCode?: WalletWhitelistOperationErrorCode;
  errorMessage?: string;
  localSessionOnly: true;
};

export type WalletWhitelistOperationEvidenceItem = {
  id: string;
  label: string;
  status: 'available' | 'not_available' | 'pending' | 'confirmed' | 'blocked';
  detail: string;
};

export type WalletWhitelistOperationReadModel = {
  operationStatus: WalletWhitelistOperationStatus;
  statusLabel: string;
  statusDetail: string;
  networkName: 'Sepolia';
  chainId: 11155111;
  operationTransactionHashSource: WalletWhitelistTransactionHashSource;
  operationTransactionHashSourceLabel: string;
  operationReceiptSource: WalletWhitelistReceiptSource;
  operationReceiptSourceLabel: string;
  eventEvidenceStatus: WalletWhitelistEvidenceStatus;
  eventEvidenceStatusLabel: string;
  operationEvidencePersistence: WalletWhitelistEvidencePersistence;
  operationEvidencePersistenceLabel: string;
  operationTransactionHash?: string;
  contractAddress?: string;
  targetWalletAddress?: string;
  allowed: true;
  operationReceiptStatus?: WalletWhitelistOperationReceiptStatus;
  decodedEvent?: WalletWhitelistDecodedEvent;
  sourceAttemptId?: string;
  evidenceItems: WalletWhitelistOperationEvidenceItem[];
  boundaryItems: WalletWhitelistOperationEvidenceItem[];
  blockingReasons: string[];
  allocationMintLocked: true;
  otherOperationsLocked: true;
};

export type WalletWhitelistOperationReadModelInput = {
  operationState: WalletWhitelistOperationState;
  deploymentEvidence: DeploymentEvidenceReadModel;
  walletConnectedOnSepolia: boolean;
  targetWalletAddress?: string;
  whitelistFunctionAvailable: boolean;
};

export const initialWalletWhitelistOperationState: WalletWhitelistOperationState = {
  operationStatus: 'not_started',
  localSessionOnly: true,
};

export function isWalletWhitelistOperationInFlight(state: WalletWhitelistOperationState): boolean {
  return state.operationStatus === 'awaiting_wallet_confirmation' || state.operationStatus === 'submitted';
}

export function normalizeWalletWhitelistTargetAddress(address?: string): string | undefined {
  const trimmed = address?.trim();
  return trimmed ? trimmed : undefined;
}

export function formatWalletWhitelistOperationStatus(status: WalletWhitelistOperationStatus): string {
  switch (status) {
    case 'ready':
      return 'Wallet whitelist status: Ready';
    case 'awaiting_wallet_confirmation':
      return 'Wallet whitelist status: Awaiting wallet confirmation';
    case 'submitted':
      return 'Wallet whitelist submitted to Sepolia';
    case 'confirmed':
      return 'Wallet whitelist confirmed on Sepolia';
    case 'rejected':
      return 'Wallet whitelist rejected in wallet';
    case 'failed':
      return 'Wallet whitelist failed';
    case 'blocked':
      return 'Wallet whitelist blocked';
    case 'not_started':
      return 'Wallet whitelist not started';
  }
}

function transactionHashSourceLabel(source: WalletWhitelistTransactionHashSource): string {
  return source === 'provider_returned' ? 'Provider returned' : 'Absent';
}

function receiptSourceLabel(source: WalletWhitelistReceiptSource): string {
  return source === 'provider_receipt' ? 'Provider receipt' : 'Absent';
}

function eventEvidenceStatusLabel(source: WalletWhitelistEvidenceStatus): string {
  if (source === 'decoded_from_receipt') return 'Decoded from receipt';
  return 'Not decoded';
}

function readinessBlockingReasons(input: WalletWhitelistOperationReadModelInput): string[] {
  const reasons: string[] = [];
  const targetWalletAddress = normalizeWalletWhitelistTargetAddress(input.targetWalletAddress ?? input.operationState.targetWalletAddress);

  if (!input.walletConnectedOnSepolia) reasons.push('Connect a Sepolia wallet before whitelisting a wallet.');
  if (
    input.deploymentEvidence.status !== 'confirmed' ||
    input.deploymentEvidence.evidenceStrength !== 'confirmed_receipt' ||
    input.deploymentEvidence.contractAddressSource !== 'receipt_returned'
  ) {
    reasons.push('Confirmed receipt-derived deployment evidence is required before wallet whitelist.');
  }
  if (!input.deploymentEvidence.contractAddress) reasons.push('Receipt-returned contract address is required before wallet whitelist.');
  if (input.deploymentEvidence.contractAddress && !isValidNonZeroEvmAddress(input.deploymentEvidence.contractAddress)) {
    reasons.push('Receipt-returned contract address must be a valid non-zero EVM address.');
  }
  if (!input.whitelistFunctionAvailable) reasons.push('setWalletAllowed(address,bool) is missing from the deployment artifact ABI.');
  if (!targetWalletAddress) reasons.push('Target wallet address is required.');
  if (targetWalletAddress && !isValidNonZeroEvmAddress(targetWalletAddress)) {
    reasons.push('Target wallet address must be a valid non-zero EVM address.');
  }
  if (isWalletWhitelistOperationInFlight(input.operationState)) reasons.push('A Wallet Whitelist operation is already awaiting confirmation or receipt.');

  return reasons;
}

function effectiveStatus(input: WalletWhitelistOperationReadModelInput, blockingReasons: string[]): WalletWhitelistOperationStatus {
  if (input.operationState.operationStatus !== 'not_started') return input.operationState.operationStatus;
  if (blockingReasons.length === 0) return 'ready';
  if (input.targetWalletAddress || input.deploymentEvidence.status === 'confirmed') return 'blocked';
  return 'not_started';
}

function statusDetail(status: WalletWhitelistOperationStatus, state: WalletWhitelistOperationState, eventEvidenceStatus: WalletWhitelistEvidenceStatus): string {
  if (status === 'ready') return 'Wallet Whitelist is ready for explicit user action. Contract authorization is enforced on-chain.';
  if (status === 'awaiting_wallet_confirmation') {
    return 'Wallet confirmation was requested for the Sepolia Wallet Whitelist operation. No whitelist transaction hash exists yet.';
  }
  if (status === 'submitted') {
    return 'The provider returned a Sepolia whitelist transaction hash. Operation receipt confirmation is pending.';
  }
  if (status === 'confirmed') {
    return eventEvidenceStatus === 'decoded_from_receipt'
      ? 'Wallet whitelist was confirmed on Sepolia and the WalletWhitelisted event was decoded from the receipt.'
      : 'Wallet whitelist was confirmed on Sepolia from the provider receipt. WalletWhitelisted event evidence was not decoded.';
  }
  if (status === 'rejected') return 'Wallet whitelist was rejected in the wallet. No whitelist transaction was submitted.';
  if (status === 'failed') return state.errorMessage ?? 'Wallet whitelist failed or the operation receipt reported failure.';
  if (status === 'blocked') return state.errorMessage ?? 'Wallet whitelist is blocked by a precondition.';
  return 'No wallet-signed Wallet Whitelist operation evidence is available yet.';
}

function evidenceItems(input: {
  status: WalletWhitelistOperationStatus;
  state: WalletWhitelistOperationState;
  operationTransactionHash?: string;
  contractAddress?: string;
  targetWalletAddress?: string;
  eventEvidenceStatus: WalletWhitelistEvidenceStatus;
}): WalletWhitelistOperationEvidenceItem[] {
  const { status, state, operationTransactionHash, contractAddress, targetWalletAddress, eventEvidenceStatus } = input;

  return [
    {
      id: 'wallet-whitelist-operation',
      label: 'Wallet Whitelist Operation',
      status:
        status === 'confirmed'
          ? 'confirmed'
          : status === 'submitted' || status === 'awaiting_wallet_confirmation'
            ? 'pending'
            : status === 'failed' || status === 'rejected' || status === 'blocked'
              ? 'blocked'
              : status === 'ready'
                ? 'available'
                : 'not_available',
      detail: formatWalletWhitelistOperationStatus(status),
    },
    {
      id: 'whitelist-target-wallet',
      label: 'Target wallet',
      status: targetWalletAddress ? 'available' : 'not_available',
      detail: targetWalletAddress ? `Target wallet: ${targetWalletAddress}` : 'Target wallet address is required.',
    },
    {
      id: 'whitelist-allowed-flag',
      label: 'Allowed flag',
      status: 'available',
      detail: 'allowed: true',
    },
    {
      id: 'whitelist-transaction-hash',
      label: 'Whitelist transaction hash',
      status: operationTransactionHash ? 'available' : state.operationStatus === 'awaiting_wallet_confirmation' ? 'pending' : 'not_available',
      detail: operationTransactionHash ? `Whitelist transaction hash: ${operationTransactionHash}` : 'No whitelist transaction hash.',
    },
    {
      id: 'whitelist-receipt',
      label: 'Whitelist receipt',
      status: state.operationReceiptStatus === 'success' ? 'confirmed' : state.operationReceiptStatus === 'pending' ? 'pending' : 'not_available',
      detail:
        state.operationReceiptStatus === 'success'
          ? 'Whitelist receipt: Provider receipt confirmed.'
          : state.operationReceiptStatus === 'pending'
            ? 'Whitelist receipt: Pending.'
            : 'Whitelist receipt: Absent.',
    },
    {
      id: 'wallet-whitelisted-event',
      label: 'WalletWhitelisted event',
      status: eventEvidenceStatus === 'decoded_from_receipt' ? 'confirmed' : eventEvidenceStatus === 'receipt_confirmed' ? 'available' : 'not_available',
      detail:
        eventEvidenceStatus === 'decoded_from_receipt'
          ? 'WalletWhitelisted event: Decoded from receipt.'
          : eventEvidenceStatus === 'receipt_confirmed'
            ? 'WalletWhitelisted event: Not decoded. Operation receipt confirmed.'
            : 'WalletWhitelisted event: Not decoded.',
    },
    {
      id: 'whitelist-contract-address',
      label: 'Operation contract address',
      status: contractAddress ? 'available' : 'not_available',
      detail: contractAddress ? `Contract address: ${contractAddress}` : 'No operation contract address.',
    },
  ];
}

function boundaryItems(): WalletWhitelistOperationEvidenceItem[] {
  return [
    {
      id: 'whitelist-local-session-only',
      label: 'Wallet whitelist evidence',
      status: 'available',
      detail: 'Wallet whitelist evidence: Local session only.',
    },
    {
      id: 'whitelist-sepolia-only',
      label: 'Network',
      status: 'available',
      detail: 'Network: Sepolia. Mainnet disabled.',
    },
    {
      id: 'whitelist-backend-private-keys',
      label: 'Backend private keys',
      status: 'available',
      detail: 'Backend never holds private keys.',
    },
    {
      id: 'whitelist-authorization',
      label: 'Contract authorization',
      status: 'available',
      detail: 'Contract authorization is enforced on-chain.',
    },
    {
      id: 'allocation-mint-locked',
      label: 'Allocation/Mint',
      status: 'available',
      detail: 'Allocation/Mint: Available after investor whitelist and allocation parameters.',
    },
    {
      id: 'other-operations-locked',
      label: 'Other Smart Contract Operations',
      status: 'blocked',
      detail: 'Other Smart Contract Operations require explicit adapters and evidence paths before release.',
    },
  ];
}

export function toWalletWhitelistOperationReadModel(input: WalletWhitelistOperationReadModelInput): WalletWhitelistOperationReadModel {
  const state = input.operationState;
  const blockingReasons =
    state.operationStatus === 'blocked' ? [state.errorMessage ?? 'Wallet whitelist is blocked by a precondition.'] : readinessBlockingReasons(input);
  const status = effectiveStatus(input, blockingReasons);
  const hasProviderTransactionHash = Boolean(state.operationTransactionHash);
  const hasProviderReceipt = Boolean(state.operationReceiptStatus);
  const hasConfirmedReceipt = state.operationStatus === 'confirmed' && state.operationReceiptStatus === 'success';
  const hasDecodedEvent = hasConfirmedReceipt && Boolean(state.decodedEvent);
  const operationTransactionHash = hasProviderTransactionHash ? state.operationTransactionHash : undefined;
  const contractAddress =
    hasConfirmedReceipt && isValidNonZeroEvmAddress(state.contractAddress) ? state.contractAddress : undefined;
  const targetWalletAddress = normalizeWalletWhitelistTargetAddress(state.targetWalletAddress ?? input.targetWalletAddress);
  const eventEvidenceStatus: WalletWhitelistEvidenceStatus = hasDecodedEvent
    ? 'decoded_from_receipt'
    : hasConfirmedReceipt
      ? 'receipt_confirmed'
      : 'not_available';

  return {
    operationStatus: status,
    statusLabel: formatWalletWhitelistOperationStatus(status),
    statusDetail: statusDetail(status, state, eventEvidenceStatus),
    networkName: 'Sepolia',
    chainId: 11155111,
    operationTransactionHashSource: operationTransactionHash ? 'provider_returned' : 'absent',
    operationTransactionHashSourceLabel: transactionHashSourceLabel(operationTransactionHash ? 'provider_returned' : 'absent'),
    operationReceiptSource: hasProviderReceipt ? 'provider_receipt' : 'absent',
    operationReceiptSourceLabel: receiptSourceLabel(hasProviderReceipt ? 'provider_receipt' : 'absent'),
    eventEvidenceStatus,
    eventEvidenceStatusLabel: eventEvidenceStatusLabel(eventEvidenceStatus),
    operationEvidencePersistence: 'local_session_only',
    operationEvidencePersistenceLabel: 'Local session only',
    operationTransactionHash,
    contractAddress,
    targetWalletAddress,
    allowed: true,
    operationReceiptStatus: state.operationReceiptStatus,
    decodedEvent: hasDecodedEvent ? state.decodedEvent : undefined,
    sourceAttemptId: state.attemptId,
    evidenceItems: evidenceItems({ status, state, operationTransactionHash, contractAddress, targetWalletAddress, eventEvidenceStatus }),
    boundaryItems: boundaryItems(),
    blockingReasons: status === 'blocked' ? blockingReasons : [],
    allocationMintLocked: true,
    otherOperationsLocked: true,
  };
}
