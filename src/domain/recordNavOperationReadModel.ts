import type { DeploymentEvidenceReadModel } from './deploymentEvidenceReadModel';

export type RecordNavOperationStatus =
  | 'not_started'
  | 'blocked'
  | 'awaiting_wallet_confirmation'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'failed';

export type RecordNavOperationErrorCode =
  | 'provider_unavailable'
  | 'wallet_not_connected'
  | 'wrong_chain'
  | 'account_changed'
  | 'deployment_evidence_missing'
  | 'contract_address_missing'
  | 'contract_address_invalid'
  | 'abi_function_missing'
  | 'operation_payload_missing'
  | 'duplicate_attempt'
  | 'provider_rejected'
  | 'provider_error'
  | 'receipt_failed';

export type RecordNavOperationReceiptStatus = 'pending' | 'success' | 'failed';
export type OperationTransactionHashSource = 'provider_returned' | 'absent';
export type OperationReceiptSource = 'provider_receipt' | 'absent';
export type EventEvidenceSource = 'decoded_from_receipt' | 'receipt_confirmed' | 'absent';
export type OperationEvidencePersistence = 'local_session_only';

export type RecordNavDecodedEvent = {
  eventName: 'ValuationUpdated';
  valuation: string;
  valuationReference: string;
  operator?: string;
};

export type RecordNavOperationPayload = {
  valuation: bigint;
  valuationReference: string;
};

export type RecordNavOperationState = {
  operationStatus: RecordNavOperationStatus;
  attemptId?: string;
  operationTransactionHash?: string;
  contractAddress?: string;
  operationReceiptStatus?: RecordNavOperationReceiptStatus;
  valuation?: bigint;
  valuationReference?: string;
  decodedEvent?: RecordNavDecodedEvent;
  errorCode?: RecordNavOperationErrorCode;
  errorMessage?: string;
  localSessionOnly: true;
};

export type RecordNavOperationEvidenceItem = {
  id: string;
  label: string;
  status: 'available' | 'not_available' | 'pending' | 'confirmed' | 'blocked';
  detail: string;
};

export type RecordNavOperationReadModel = {
  operationStatus: RecordNavOperationStatus;
  statusLabel: string;
  statusDetail: string;
  networkName: 'Sepolia';
  chainId: 11155111;
  operationTransactionHashSource: OperationTransactionHashSource;
  operationTransactionHashSourceLabel: string;
  operationReceiptSource: OperationReceiptSource;
  operationReceiptSourceLabel: string;
  eventEvidenceSource: EventEvidenceSource;
  eventEvidenceSourceLabel: string;
  operationEvidencePersistence: OperationEvidencePersistence;
  operationEvidencePersistenceLabel: string;
  operationTransactionHash?: string;
  contractAddress?: string;
  operationReceiptStatus?: RecordNavOperationReceiptStatus;
  valuation?: string;
  valuationReference?: string;
  decodedEvent?: RecordNavDecodedEvent;
  sourceAttemptId?: string;
  evidenceItems: RecordNavOperationEvidenceItem[];
  boundaryItems: RecordNavOperationEvidenceItem[];
  blockingReasons: string[];
  otherOperationsLocked: true;
};

export const defaultRecordNavOperationPayload: RecordNavOperationPayload = {
  valuation: 1_050_000n,
  valuationReference: 'MILA26-ALPHA-NAV-001',
};

export const initialRecordNavOperationState: RecordNavOperationState = {
  operationStatus: 'not_started',
  localSessionOnly: true,
};

export function isRecordNavOperationInFlight(state: RecordNavOperationState): boolean {
  return state.operationStatus === 'awaiting_wallet_confirmation' || state.operationStatus === 'submitted';
}

export function isValidNonZeroEvmAddress(address?: string): address is string {
  return Boolean(address && /^0x[0-9a-fA-F]{40}$/.test(address) && !/^0x0{40}$/i.test(address));
}

export function formatRecordNavOperationStatus(status: RecordNavOperationStatus): string {
  switch (status) {
    case 'awaiting_wallet_confirmation':
      return 'Awaiting wallet confirmation';
    case 'submitted':
      return 'Record NAV submitted to Sepolia';
    case 'confirmed':
      return 'Record NAV confirmed on Sepolia';
    case 'rejected':
      return 'Record NAV rejected in wallet';
    case 'failed':
      return 'Record NAV failed';
    case 'blocked':
      return 'Record NAV blocked';
    case 'not_started':
      return 'Record NAV operation not started';
  }
}

function transactionHashSourceLabel(source: OperationTransactionHashSource): string {
  return source === 'provider_returned' ? 'Provider returned' : 'Absent';
}

function receiptSourceLabel(source: OperationReceiptSource): string {
  return source === 'provider_receipt' ? 'Provider receipt' : 'Absent';
}

function eventSourceLabel(source: EventEvidenceSource): string {
  if (source === 'decoded_from_receipt') return 'Decoded from receipt';
  if (source === 'receipt_confirmed') return 'Receipt confirmed';
  return 'Absent';
}

function statusDetail(state: RecordNavOperationState, eventEvidenceSource: EventEvidenceSource): string {
  if (state.operationStatus === 'awaiting_wallet_confirmation') {
    return 'Wallet confirmation was requested for the Sepolia Record NAV operation. No operation transaction hash exists yet.';
  }
  if (state.operationStatus === 'submitted') {
    return 'The provider returned a Sepolia operation transaction hash. Operation receipt confirmation is pending.';
  }
  if (state.operationStatus === 'confirmed') {
    return eventEvidenceSource === 'decoded_from_receipt'
      ? 'Record NAV was confirmed on Sepolia and the ValuationUpdated event was decoded from the receipt.'
      : 'Record NAV was confirmed on Sepolia from the provider receipt. ValuationUpdated event evidence was not decoded.';
  }
  if (state.operationStatus === 'rejected') return 'Record NAV was rejected in the wallet. No operation was submitted.';
  if (state.operationStatus === 'failed') return 'Record NAV failed or the operation receipt reported failure.';
  if (state.operationStatus === 'blocked') return state.errorMessage ?? 'Record NAV is blocked by a precondition.';
  return 'No wallet-signed Record NAV operation evidence is available yet.';
}

function evidenceItems(input: {
  state: RecordNavOperationState;
  operationTransactionHash?: string;
  contractAddress?: string;
  eventEvidenceSource: EventEvidenceSource;
}): RecordNavOperationEvidenceItem[] {
  const { state, operationTransactionHash, contractAddress, eventEvidenceSource } = input;

  return [
    {
      id: 'record-nav-operation',
      label: 'Record NAV operation',
      status:
        state.operationStatus === 'confirmed'
          ? 'confirmed'
          : state.operationStatus === 'submitted' || state.operationStatus === 'awaiting_wallet_confirmation'
            ? 'pending'
            : state.operationStatus === 'failed' || state.operationStatus === 'rejected' || state.operationStatus === 'blocked'
              ? 'blocked'
              : 'not_available',
      detail: formatRecordNavOperationStatus(state.operationStatus),
    },
    {
      id: 'operation-transaction-hash',
      label: 'Operation transaction hash',
      status: operationTransactionHash ? 'available' : state.operationStatus === 'awaiting_wallet_confirmation' ? 'pending' : 'not_available',
      detail: operationTransactionHash ? `Operation transaction hash: ${operationTransactionHash}` : 'No operation transaction hash.',
    },
    {
      id: 'operation-receipt',
      label: 'Operation receipt',
      status: state.operationReceiptStatus === 'success' ? 'confirmed' : state.operationReceiptStatus === 'pending' ? 'pending' : 'not_available',
      detail:
        state.operationReceiptStatus === 'success'
          ? 'Operation receipt: Provider receipt confirmed.'
          : state.operationReceiptStatus === 'pending'
            ? 'Operation receipt: Pending.'
            : 'Operation receipt: Absent.',
    },
    {
      id: 'valuation-updated-event',
      label: 'ValuationUpdated event',
      status: eventEvidenceSource === 'decoded_from_receipt' ? 'confirmed' : eventEvidenceSource === 'receipt_confirmed' ? 'available' : 'not_available',
      detail:
        eventEvidenceSource === 'decoded_from_receipt'
          ? 'ValuationUpdated event: Decoded from receipt.'
          : eventEvidenceSource === 'receipt_confirmed'
            ? 'ValuationUpdated event: Not decoded. Operation receipt confirmed.'
            : 'ValuationUpdated event: Not decoded.',
    },
    {
      id: 'operation-contract-address',
      label: 'Operation contract address',
      status: contractAddress ? 'available' : 'not_available',
      detail: contractAddress ? `Contract address: ${contractAddress}` : 'No operation contract address.',
    },
  ];
}

function boundaryItems(): RecordNavOperationEvidenceItem[] {
  return [
    {
      id: 'operation-local-session-only',
      label: 'Operation evidence',
      status: 'available',
      detail: 'Operation evidence: Local session only.',
    },
    {
      id: 'operation-sepolia-only',
      label: 'Network',
      status: 'available',
      detail: 'Network: Sepolia. Mainnet disabled.',
    },
    {
      id: 'operation-backend-private-keys',
      label: 'Backend private keys',
      status: 'available',
      detail: 'Backend never holds private keys.',
    },
    {
      id: 'other-operations-locked',
      label: 'Other Smart Contract Operations',
      status: 'blocked',
      detail: 'Other Smart Contract Operations: Locked.',
    },
  ];
}

export function toRecordNavOperationReadModel(input: {
  operationState: RecordNavOperationState;
  deploymentEvidence: DeploymentEvidenceReadModel;
}): RecordNavOperationReadModel {
  const state = input.operationState;
  const hasProviderTransactionHash = Boolean(state.operationTransactionHash);
  const hasProviderReceipt = Boolean(state.operationReceiptStatus);
  const hasConfirmedReceipt = state.operationStatus === 'confirmed' && state.operationReceiptStatus === 'success';
  const hasDecodedEvent = hasConfirmedReceipt && Boolean(state.decodedEvent);
  const operationTransactionHash = hasProviderTransactionHash ? state.operationTransactionHash : undefined;
  const contractAddress =
    hasConfirmedReceipt && isValidNonZeroEvmAddress(state.contractAddress) ? state.contractAddress : undefined;
  const eventEvidenceSource: EventEvidenceSource = hasDecodedEvent
    ? 'decoded_from_receipt'
    : hasConfirmedReceipt
      ? 'receipt_confirmed'
      : 'absent';

  return {
    operationStatus: state.operationStatus,
    statusLabel: formatRecordNavOperationStatus(state.operationStatus),
    statusDetail: statusDetail(state, eventEvidenceSource),
    networkName: 'Sepolia',
    chainId: 11155111,
    operationTransactionHashSource: operationTransactionHash ? 'provider_returned' : 'absent',
    operationTransactionHashSourceLabel: transactionHashSourceLabel(operationTransactionHash ? 'provider_returned' : 'absent'),
    operationReceiptSource: hasProviderReceipt ? 'provider_receipt' : 'absent',
    operationReceiptSourceLabel: receiptSourceLabel(hasProviderReceipt ? 'provider_receipt' : 'absent'),
    eventEvidenceSource,
    eventEvidenceSourceLabel: eventSourceLabel(eventEvidenceSource),
    operationEvidencePersistence: 'local_session_only',
    operationEvidencePersistenceLabel: 'Local session only',
    operationTransactionHash,
    contractAddress,
    operationReceiptStatus: state.operationReceiptStatus,
    valuation: state.valuation?.toString(),
    valuationReference: state.valuationReference,
    decodedEvent: hasDecodedEvent ? state.decodedEvent : undefined,
    sourceAttemptId: state.attemptId,
    evidenceItems: evidenceItems({ state, operationTransactionHash, contractAddress, eventEvidenceSource }),
    boundaryItems: boundaryItems(),
    blockingReasons: state.operationStatus === 'blocked' ? [state.errorMessage ?? 'Record NAV is blocked by a precondition.'] : [],
    otherOperationsLocked: true,
  };
}
