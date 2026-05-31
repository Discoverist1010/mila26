import { describe, expect, it } from 'vitest';
import {
  initialRecordNavOperationState,
  isValidNonZeroEvmAddress,
  toRecordNavOperationReadModel,
  type RecordNavOperationState,
} from '../src/domain/recordNavOperationReadModel';
import type { DeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';

const operationTransactionHash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const deploymentEvidence = {
  status: 'confirmed',
  statusLabel: 'Deployment Evidence: Confirmed from receipt',
  statusDetail: 'Confirmed.',
  networkName: 'Sepolia',
  chainId: 11155111,
  evidenceStrength: 'confirmed_receipt',
  evidenceStrengthLabel: 'Confirmed receipt',
  transactionHashSource: 'provider_returned',
  transactionHashSourceLabel: 'Provider returned',
  contractAddressSource: 'receipt_returned',
  contractAddressSourceLabel: 'Receipt returned',
  evidencePersistence: 'local_session_only',
  evidencePersistenceLabel: 'Local session only',
  transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  contractAddress,
  receiptStatus: 'success',
  sourceDeploymentStatus: 'confirmed',
  evidenceItems: [],
  boundaryItems: [],
  blockingReasons: [],
  nextStep: 'track_15a_record_nav_event_later',
  operationsLocked: true,
} satisfies DeploymentEvidenceReadModel;

function buildOperation(operationState: RecordNavOperationState) {
  return toRecordNavOperationReadModel({
    operationState,
    deploymentEvidence,
  });
}

describe('RecordNavOperationReadModel', () => {
  it('represents not-started operation without transaction hash or event evidence', () => {
    const operation = buildOperation(initialRecordNavOperationState);

    expect(operation.operationStatus).toBe('not_started');
    expect(operation.operationTransactionHashSource).toBe('absent');
    expect(operation.operationReceiptSource).toBe('absent');
    expect(operation.eventEvidenceSource).toBe('absent');
    expect(operation.operationTransactionHash).toBeUndefined();
    expect(operation.decodedEvent).toBeUndefined();
    expect(operation.otherOperationsLocked).toBe(true);
  });

  it('represents submitted operation with exact provider-returned hash only', () => {
    const operation = buildOperation({
      operationStatus: 'submitted',
      attemptId: 'attempt-1',
      operationTransactionHash,
      contractAddress,
      operationReceiptStatus: 'pending',
      valuation: 1_050_000n,
      valuationReference: 'MILA26-ALPHA-NAV-001',
      localSessionOnly: true,
    });

    expect(operation.operationStatus).toBe('submitted');
    expect(operation.operationTransactionHashSource).toBe('provider_returned');
    expect(operation.operationReceiptSource).toBe('provider_receipt');
    expect(operation.eventEvidenceSource).toBe('absent');
    expect(operation.operationTransactionHash).toBe(operationTransactionHash);
  });

  it('represents confirmed receipt evidence without inventing decoded event evidence', () => {
    const operation = buildOperation({
      operationStatus: 'confirmed',
      attemptId: 'attempt-2',
      operationTransactionHash,
      contractAddress,
      operationReceiptStatus: 'success',
      valuation: 1_050_000n,
      valuationReference: 'MILA26-ALPHA-NAV-001',
      localSessionOnly: true,
    });

    expect(operation.operationReceiptSource).toBe('provider_receipt');
    expect(operation.eventEvidenceSource).toBe('receipt_confirmed');
    expect(operation.decodedEvent).toBeUndefined();
    expect(operation.contractAddress).toBe(contractAddress);
  });

  it('shows decoded event evidence only when supplied by the adapter', () => {
    const operation = buildOperation({
      operationStatus: 'confirmed',
      attemptId: 'attempt-3',
      operationTransactionHash,
      contractAddress,
      operationReceiptStatus: 'success',
      valuation: 1_050_000n,
      valuationReference: 'MILA26-ALPHA-NAV-001',
      decodedEvent: {
        eventName: 'ValuationUpdated',
        valuation: '1050000',
        valuationReference: 'MILA26-ALPHA-NAV-001',
        operator: '0x1111111111111111111111111111111111111111',
      },
      localSessionOnly: true,
    });

    expect(operation.eventEvidenceSource).toBe('decoded_from_receipt');
    expect(operation.decodedEvent?.valuation).toBe('1050000');
  });

  it('keeps rejected and failed states from inventing evidence', () => {
    const rejected = buildOperation({
      operationStatus: 'rejected',
      attemptId: 'attempt-4',
      errorCode: 'provider_rejected',
      errorMessage: 'Record NAV rejected in wallet.',
      localSessionOnly: true,
    });
    const failed = buildOperation({
      operationStatus: 'failed',
      attemptId: 'attempt-5',
      operationTransactionHash,
      contractAddress,
      operationReceiptStatus: 'failed',
      errorCode: 'receipt_failed',
      localSessionOnly: true,
    });

    expect(rejected.operationTransactionHash).toBeUndefined();
    expect(rejected.eventEvidenceSource).toBe('absent');
    expect(failed.operationTransactionHash).toBe(operationTransactionHash);
    expect(failed.contractAddress).toBeUndefined();
    expect(failed.eventEvidenceSource).toBe('absent');
  });

  it('keeps local-session and Sepolia boundaries explicit', () => {
    const operation = buildOperation(initialRecordNavOperationState);
    const serialized = JSON.stringify(operation);

    expect(operation.operationEvidencePersistence).toBe('local_session_only');
    expect(operation.networkName).toBe('Sepolia');
    expect(operation.chainId).toBe(11155111);
    expect(serialized).not.toMatch(/mainnet ready|mainnet allowed|audited|verified|production ready/i);
  });

  it('validates only non-zero 20-byte EVM addresses', () => {
    expect(isValidNonZeroEvmAddress(contractAddress)).toBe(true);
    expect(isValidNonZeroEvmAddress('0x0000000000000000000000000000000000000000')).toBe(false);
    expect(isValidNonZeroEvmAddress('0x1234')).toBe(false);
    expect(isValidNonZeroEvmAddress(undefined)).toBe(false);
  });
});
