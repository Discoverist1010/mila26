import type { WorkspaceEvidenceRecordInput } from '../../server/contracts/workspacePersistence';
import type { LiveSepoliaEvidenceType } from './liveSepoliaConfig';

export type LiveSepoliaTransactionReceipt = {
  transactionHash?: string;
  status?: string;
  contractAddress?: string | null;
  to?: string | null;
};

export type LiveSepoliaEvidenceRecordInput = {
  evidenceType: LiveSepoliaEvidenceType;
  transactionHash: string;
  receipt?: LiveSepoliaTransactionReceipt | null;
  sourceAttemptId?: string;
  lifecycleSnapshotVersion?: number;
  deployedContractAddress?: string;
  eventEvidenceSource?: WorkspaceEvidenceRecordInput['eventEvidenceSource'];
  eventName?: WorkspaceEvidenceRecordInput['eventName'];
  targetWalletAddress?: string;
  valuation?: string;
  valuationReference?: string;
  tokenAmount?: string;
  tokenAmountUnits?: string;
};

function receiptStatus(status: string | undefined): WorkspaceEvidenceRecordInput['receiptStatus'] | undefined {
  if (!status) return undefined;
  if (status.toLowerCase() === '0x1') return 'success';
  if (status.toLowerCase() === '0x0') return 'failed';
  return undefined;
}

function evidenceStatus(receipt: LiveSepoliaTransactionReceipt | null | undefined): WorkspaceEvidenceRecordInput['status'] {
  const status = receiptStatus(receipt?.status);
  if (status === 'success') return 'confirmed';
  if (status === 'failed') return 'failed';
  return 'submitted';
}

function defaultEventEvidenceSource(
  evidenceType: LiveSepoliaEvidenceType,
  status: WorkspaceEvidenceRecordInput['status'],
): WorkspaceEvidenceRecordInput['eventEvidenceSource'] {
  if (evidenceType === 'deployment') return 'absent';
  return status === 'confirmed' ? 'receipt_confirmed' : 'absent';
}

function eventNameForEvidenceType(evidenceType: LiveSepoliaEvidenceType): WorkspaceEvidenceRecordInput['eventName'] | undefined {
  if (evidenceType === 'record_nav') return 'ValuationUpdated';
  if (evidenceType === 'wallet_whitelist') return 'WalletWhitelisted';
  if (evidenceType === 'allocation_mint') return 'AllocationMinted';
  return undefined;
}

export function toWorkspaceEvidenceRecordFromLiveSepoliaReceipt(
  input: LiveSepoliaEvidenceRecordInput,
): WorkspaceEvidenceRecordInput {
  if (input.receipt?.transactionHash && input.receipt.transactionHash.toLowerCase() !== input.transactionHash.toLowerCase()) {
    throw new Error('Provider receipt transaction hash does not match the configured transaction hash.');
  }

  const status = evidenceStatus(input.receipt);
  const hasReceipt = Boolean(input.receipt);
  const parsedReceiptStatus = receiptStatus(input.receipt?.status);
  const deploymentContractAddress = input.receipt?.contractAddress ?? undefined;
  const operationContractAddress = input.deployedContractAddress ?? input.receipt?.to ?? undefined;
  const contractAddress = input.evidenceType === 'deployment' ? deploymentContractAddress : operationContractAddress;

  return {
    evidenceType: input.evidenceType,
    sourcePersistence: 'local_session_only',
    sourceAttemptId: input.sourceAttemptId,
    lifecycleSnapshotVersion: input.lifecycleSnapshotVersion,
    status,
    chainId: 11155111,
    networkName: 'Sepolia',
    transactionHash: input.receipt?.transactionHash ?? input.transactionHash,
    transactionHashSource: 'provider_returned',
    receiptSource: hasReceipt ? 'provider_receipt' : 'absent',
    receiptStatus: parsedReceiptStatus,
    contractAddress,
    contractAddressSource: contractAddress
      ? input.evidenceType === 'deployment'
        ? 'receipt_returned'
        : 'confirmed_deployment_evidence'
      : 'absent',
    eventEvidenceSource: input.eventEvidenceSource ?? defaultEventEvidenceSource(input.evidenceType, status),
    eventName: input.eventName ?? eventNameForEvidenceType(input.evidenceType),
    targetWalletAddress: input.targetWalletAddress,
    valuation: input.valuation,
    valuationReference: input.valuationReference,
    tokenAmount: input.tokenAmount,
    tokenAmountUnits: input.tokenAmountUnits,
  };
}
