import type { AllocationMintReadModel } from './lifecycleState';
import type { DeploymentEvidenceReadModel } from './deploymentEvidenceReadModel';
import { isValidNonZeroEvmAddress } from './recordNavOperationReadModel';

export type WalletAllocationMintOperationStatus =
  | 'not_started'
  | 'blocked'
  | 'ready'
  | 'awaiting_wallet_confirmation'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'failed';

export type WalletAllocationMintOperationErrorCode =
  | 'provider_unavailable'
  | 'wallet_not_connected'
  | 'wrong_chain'
  | 'account_changed'
  | 'deployment_evidence_missing'
  | 'contract_address_missing'
  | 'contract_address_invalid'
  | 'allocation_not_ready'
  | 'target_wallet_missing'
  | 'target_wallet_invalid'
  | 'target_wallet_not_whitelisted'
  | 'token_amount_invalid'
  | 'abi_function_missing'
  | 'duplicate_attempt'
  | 'provider_rejected'
  | 'provider_error'
  | 'receipt_failed';

export type WalletAllocationMintOperationReceiptStatus = 'pending' | 'success' | 'failed';
export type WalletAllocationMintEvidenceStatus = 'not_available' | 'receipt_confirmed' | 'decoded_from_receipt';
export type WalletAllocationMintTransactionHashSource = 'provider_returned' | 'absent';
export type WalletAllocationMintReceiptSource = 'provider_receipt' | 'absent';
export type WalletAllocationMintEvidencePersistence = 'local_session_only';

export type WalletAllocationMintDecodedEvent = {
  eventName: 'AllocationMinted';
  wallet: string;
  amount: string;
  operator?: string;
};

export type WalletAllocationMintOperationState = {
  operationStatus: Exclude<WalletAllocationMintOperationStatus, 'ready'>;
  attemptId?: string;
  operationTransactionHash?: string;
  contractAddress?: string;
  targetWalletAddress?: string;
  tokenAmount?: string;
  tokenAmountUnits?: string;
  operationReceiptStatus?: WalletAllocationMintOperationReceiptStatus;
  decodedEvent?: WalletAllocationMintDecodedEvent;
  errorCode?: WalletAllocationMintOperationErrorCode;
  errorMessage?: string;
  localSessionOnly: true;
};

export type WalletAllocationMintOperationEvidenceItem = {
  id: string;
  label: string;
  status: 'available' | 'not_available' | 'pending' | 'confirmed' | 'blocked';
  detail: string;
};

export type WalletAllocationMintOperationReadModel = {
  operationStatus: WalletAllocationMintOperationStatus;
  statusLabel: string;
  statusDetail: string;
  networkName: 'Sepolia';
  chainId: 11155111;
  operationTransactionHashSource: WalletAllocationMintTransactionHashSource;
  operationTransactionHashSourceLabel: string;
  operationReceiptSource: WalletAllocationMintReceiptSource;
  operationReceiptSourceLabel: string;
  eventEvidenceStatus: WalletAllocationMintEvidenceStatus;
  eventEvidenceStatusLabel: string;
  operationEvidencePersistence: WalletAllocationMintEvidencePersistence;
  operationEvidencePersistenceLabel: string;
  operationTransactionHash?: string;
  contractAddress?: string;
  targetWalletAddress?: string;
  tokenAmount?: string;
  tokenAmountUnits?: string;
  operationReceiptStatus?: WalletAllocationMintOperationReceiptStatus;
  decodedEvent?: WalletAllocationMintDecodedEvent;
  sourceAttemptId?: string;
  evidenceItems: WalletAllocationMintOperationEvidenceItem[];
  blockingReasons: string[];
  otherOperationsLocked: true;
};

export type WalletAllocationMintOperationReadModelInput = {
  operationState: WalletAllocationMintOperationState;
  deploymentEvidence: DeploymentEvidenceReadModel;
  walletConnectedOnSepolia: boolean;
  allocationMint: AllocationMintReadModel;
  selectedInvestorWhitelisted: boolean;
  mintFunctionAvailable: boolean;
};

export const initialWalletAllocationMintOperationState: WalletAllocationMintOperationState = {
  operationStatus: 'not_started',
  localSessionOnly: true,
};

export function isWalletAllocationMintOperationInFlight(state: WalletAllocationMintOperationState): boolean {
  return state.operationStatus === 'awaiting_wallet_confirmation' || state.operationStatus === 'submitted';
}

export function formatWalletAllocationMintOperationStatus(status: WalletAllocationMintOperationStatus): string {
  switch (status) {
    case 'ready':
      return 'Allocation / Mint status: Ready';
    case 'awaiting_wallet_confirmation':
      return 'Allocation / Mint awaiting wallet confirmation';
    case 'submitted':
      return 'Allocation / Mint submitted to Sepolia';
    case 'confirmed':
      return 'Allocation / Mint confirmed on Sepolia';
    case 'rejected':
      return 'Allocation / Mint rejected in wallet';
    case 'failed':
      return 'Allocation / Mint failed';
    case 'blocked':
      return 'Allocation / Mint blocked';
    case 'not_started':
      return 'Allocation / Mint not started';
  }
}

function transactionHashSourceLabel(source: WalletAllocationMintTransactionHashSource): string {
  return source === 'provider_returned' ? 'Provider returned' : 'Absent';
}

function receiptSourceLabel(source: WalletAllocationMintReceiptSource): string {
  return source === 'provider_receipt' ? 'Provider receipt' : 'Absent';
}

function eventEvidenceStatusLabel(source: WalletAllocationMintEvidenceStatus): string {
  if (source === 'decoded_from_receipt') return 'Decoded from receipt';
  if (source === 'receipt_confirmed') return 'Receipt confirmed';
  return 'Not decoded';
}

function readinessBlockingReasons(input: WalletAllocationMintOperationReadModelInput): string[] {
  const reasons: string[] = [];

  if (!input.walletConnectedOnSepolia) reasons.push('Connect a Sepolia wallet before Allocation / Mint.');
  if (
    input.deploymentEvidence.status !== 'confirmed' ||
    input.deploymentEvidence.evidenceStrength !== 'confirmed_receipt' ||
    input.deploymentEvidence.contractAddressSource !== 'receipt_returned'
  ) {
    reasons.push('Confirmed receipt-derived deployment evidence is required before Allocation / Mint.');
  }
  if (!input.deploymentEvidence.contractAddress) reasons.push('Receipt-returned contract address is required before Allocation / Mint.');
  if (input.deploymentEvidence.contractAddress && !isValidNonZeroEvmAddress(input.deploymentEvidence.contractAddress)) {
    reasons.push('Receipt-returned contract address must be a valid non-zero EVM address.');
  }
  if (!input.mintFunctionAvailable) reasons.push('mintAllocation(address,uint256) is missing from the deployment artifact ABI.');
  if (!input.allocationMint.canReviewAllocationMint) reasons.push(input.allocationMint.statusDetail);
  if (!input.allocationMint.targetWalletAddress) reasons.push('Select a registered investor wallet before Allocation / Mint.');
  if (input.allocationMint.targetWalletAddress && !isValidNonZeroEvmAddress(input.allocationMint.targetWalletAddress)) {
    reasons.push('Allocation target wallet must be a valid non-zero EVM address.');
  }
  if (!input.selectedInvestorWhitelisted) reasons.push('Whitelist the selected investor wallet before Allocation / Mint.');
  if (isWalletAllocationMintOperationInFlight(input.operationState)) reasons.push('An Allocation / Mint operation is already awaiting confirmation or receipt.');

  return Array.from(new Set(reasons));
}

function effectiveStatus(
  input: WalletAllocationMintOperationReadModelInput,
  blockingReasons: string[],
): WalletAllocationMintOperationStatus {
  if (input.operationState.operationStatus !== 'not_started') return input.operationState.operationStatus;
  if (blockingReasons.length === 0) return 'ready';
  if (input.allocationMint.targetWalletAddress || input.deploymentEvidence.status === 'confirmed') return 'blocked';
  return 'not_started';
}

function statusDetail(
  status: WalletAllocationMintOperationStatus,
  state: WalletAllocationMintOperationState,
  eventEvidenceStatus: WalletAllocationMintEvidenceStatus,
): string {
  if (status === 'ready') return 'Allocation / Mint is ready for explicit wallet-signed Sepolia action.';
  if (status === 'awaiting_wallet_confirmation') return 'Wallet confirmation was requested. No Allocation / Mint transaction hash exists yet.';
  if (status === 'submitted') return 'The provider returned a Sepolia Allocation / Mint transaction hash. Receipt confirmation is pending.';
  if (status === 'confirmed') {
    return eventEvidenceStatus === 'decoded_from_receipt'
      ? 'Allocation / Mint was confirmed on Sepolia and the AllocationMinted event was decoded from the receipt.'
      : 'Allocation / Mint was confirmed on Sepolia from the provider receipt. AllocationMinted event evidence was not decoded.';
  }
  if (status === 'rejected') return 'Allocation / Mint was rejected in the wallet. No mint transaction was submitted.';
  if (status === 'failed') return state.errorMessage ?? 'Allocation / Mint failed or the operation receipt reported failure.';
  if (status === 'blocked') return state.errorMessage ?? 'Allocation / Mint is blocked by a precondition.';
  return 'No wallet-signed Allocation / Mint operation evidence is available yet.';
}

function evidenceItems(input: {
  status: WalletAllocationMintOperationStatus;
  state: WalletAllocationMintOperationState;
  operationTransactionHash?: string;
  contractAddress?: string;
  targetWalletAddress?: string;
  tokenAmount?: string;
  eventEvidenceStatus: WalletAllocationMintEvidenceStatus;
}): WalletAllocationMintOperationEvidenceItem[] {
  const { status, state, operationTransactionHash, contractAddress, targetWalletAddress, tokenAmount, eventEvidenceStatus } = input;

  return [
    {
      id: 'allocation-mint-operation',
      label: 'Allocation / Mint Operation',
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
      detail: formatWalletAllocationMintOperationStatus(status),
    },
    {
      id: 'allocation-target-wallet',
      label: 'Target wallet',
      status: targetWalletAddress ? 'available' : 'not_available',
      detail: targetWalletAddress ? `Target wallet: ${targetWalletAddress}` : 'Target wallet address is required.',
    },
    {
      id: 'allocation-token-amount',
      label: 'Token amount',
      status: tokenAmount ? 'available' : 'not_available',
      detail: tokenAmount ? `Token amount: ${tokenAmount}` : 'Token amount is required.',
    },
    {
      id: 'allocation-transaction-hash',
      label: 'Allocation / Mint transaction hash',
      status: operationTransactionHash ? 'available' : state.operationStatus === 'awaiting_wallet_confirmation' ? 'pending' : 'not_available',
      detail: operationTransactionHash ? `Allocation / Mint transaction hash: ${operationTransactionHash}` : 'No Allocation / Mint transaction hash.',
    },
    {
      id: 'allocation-mint-receipt',
      label: 'Allocation / Mint receipt',
      status: state.operationReceiptStatus === 'success' ? 'confirmed' : state.operationReceiptStatus === 'pending' ? 'pending' : 'not_available',
      detail:
        state.operationReceiptStatus === 'success'
          ? 'Allocation / Mint receipt: Provider receipt confirmed.'
          : state.operationReceiptStatus === 'pending'
            ? 'Allocation / Mint receipt: Pending.'
            : 'Allocation / Mint receipt: Absent.',
    },
    {
      id: 'allocation-minted-event',
      label: 'AllocationMinted event',
      status: eventEvidenceStatus === 'decoded_from_receipt' ? 'confirmed' : eventEvidenceStatus === 'receipt_confirmed' ? 'available' : 'not_available',
      detail:
        eventEvidenceStatus === 'decoded_from_receipt'
          ? 'AllocationMinted event: Decoded from receipt.'
          : eventEvidenceStatus === 'receipt_confirmed'
            ? 'AllocationMinted event: Not decoded. Operation receipt confirmed.'
            : 'AllocationMinted event: Not decoded.',
    },
    {
      id: 'allocation-contract-address',
      label: 'Operation contract address',
      status: contractAddress ? 'available' : 'not_available',
      detail: contractAddress ? `Contract address: ${contractAddress}` : 'No operation contract address.',
    },
  ];
}

export function toWalletAllocationMintOperationReadModel(
  input: WalletAllocationMintOperationReadModelInput,
): WalletAllocationMintOperationReadModel {
  const state = input.operationState;
  const blockingReasons =
    state.operationStatus === 'blocked' ? [state.errorMessage ?? 'Allocation / Mint is blocked by a precondition.'] : readinessBlockingReasons(input);
  const status = effectiveStatus(input, blockingReasons);
  const hasProviderTransactionHash = Boolean(state.operationTransactionHash);
  const hasProviderReceipt = Boolean(state.operationReceiptStatus);
  const hasConfirmedReceipt = state.operationStatus === 'confirmed' && state.operationReceiptStatus === 'success';
  const hasDecodedEvent = hasConfirmedReceipt && Boolean(state.decodedEvent);
  const operationTransactionHash = hasProviderTransactionHash ? state.operationTransactionHash : undefined;
  const contractAddress = hasConfirmedReceipt && isValidNonZeroEvmAddress(state.contractAddress) ? state.contractAddress : undefined;
  const targetWalletAddress = state.targetWalletAddress ?? input.allocationMint.targetWalletAddress;
  const tokenAmount = state.tokenAmount ?? input.allocationMint.tokenAmount;
  const eventEvidenceStatus: WalletAllocationMintEvidenceStatus = hasDecodedEvent
    ? 'decoded_from_receipt'
    : hasConfirmedReceipt
      ? 'receipt_confirmed'
      : 'not_available';

  return {
    operationStatus: status,
    statusLabel: formatWalletAllocationMintOperationStatus(status),
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
    tokenAmount,
    tokenAmountUnits: state.tokenAmountUnits,
    operationReceiptStatus: state.operationReceiptStatus,
    decodedEvent: hasDecodedEvent ? state.decodedEvent : undefined,
    sourceAttemptId: state.attemptId,
    evidenceItems: evidenceItems({ status, state, operationTransactionHash, contractAddress, targetWalletAddress, tokenAmount, eventEvidenceStatus }),
    blockingReasons: status === 'blocked' ? blockingReasons : [],
    otherOperationsLocked: true,
  };
}
