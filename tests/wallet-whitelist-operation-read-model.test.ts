import { describe, expect, it } from 'vitest';
import type { DeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import {
  initialWalletWhitelistOperationState,
  toWalletWhitelistOperationReadModel,
  type WalletWhitelistOperationState,
} from '../src/domain/walletWhitelistOperationReadModel';

const operationTransactionHash = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const targetWalletAddress = '0x1111111111111111111111111111111111111111';

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

function buildOperation(
  operationState: WalletWhitelistOperationState,
  overrides: Partial<Parameters<typeof toWalletWhitelistOperationReadModel>[0]> = {},
) {
  return toWalletWhitelistOperationReadModel({
    operationState,
    deploymentEvidence,
    walletConnectedOnSepolia: true,
    targetWalletAddress,
    whitelistFunctionAvailable: true,
    ...overrides,
  });
}

describe('WalletWhitelistOperationReadModel', () => {
  it('represents not-started operation without transaction hash or event evidence when prerequisites are missing', () => {
    const operation = buildOperation(initialWalletWhitelistOperationState, {
      walletConnectedOnSepolia: false,
      targetWalletAddress: undefined,
      deploymentEvidence: { ...deploymentEvidence, status: 'not_started', evidenceStrength: 'none', contractAddressSource: 'absent', contractAddress: undefined },
    });

    expect(operation.operationStatus).toBe('not_started');
    expect(operation.operationTransactionHashSource).toBe('absent');
    expect(operation.operationReceiptSource).toBe('absent');
    expect(operation.eventEvidenceStatus).toBe('not_available');
    expect(operation.operationTransactionHash).toBeUndefined();
    expect(operation.decodedEvent).toBeUndefined();
    expect(operation.allocationMintLocked).toBe(true);
    expect(operation.otherOperationsLocked).toBe(true);
  });

  it('becomes ready after confirmed deployment evidence, Sepolia wallet readiness, ABI availability, and valid target wallet', () => {
    const operation = buildOperation(initialWalletWhitelistOperationState);

    expect(operation.operationStatus).toBe('ready');
    expect(operation.statusLabel).toBe('Wallet whitelist status: Ready');
    expect(operation.targetWalletAddress).toBe(targetWalletAddress);
    expect(operation.blockingReasons).toEqual([]);
  });

  it('blocked state includes clear reasons', () => {
    const operation = buildOperation(initialWalletWhitelistOperationState, {
      walletConnectedOnSepolia: false,
      targetWalletAddress: '0x1234',
      whitelistFunctionAvailable: false,
    });

    expect(operation.operationStatus).toBe('blocked');
    expect(operation.blockingReasons).toEqual(
      expect.arrayContaining([
        'Connect a Sepolia wallet before whitelisting a wallet.',
        'setWalletAllowed(address,bool) is missing from the deployment artifact ABI.',
        'Target wallet address must be a valid non-zero EVM address.',
      ]),
    );
  });

  it('represents awaiting wallet confirmation and submitted provider hash states', () => {
    const awaiting = buildOperation({
      operationStatus: 'awaiting_wallet_confirmation',
      attemptId: 'attempt-1',
      contractAddress,
      targetWalletAddress,
      allowed: true,
      operationReceiptStatus: 'pending',
      localSessionOnly: true,
    });
    const submitted = buildOperation({
      operationStatus: 'submitted',
      attemptId: 'attempt-2',
      contractAddress,
      targetWalletAddress,
      allowed: true,
      operationTransactionHash,
      operationReceiptStatus: 'pending',
      localSessionOnly: true,
    });

    expect(awaiting.operationStatus).toBe('awaiting_wallet_confirmation');
    expect(awaiting.operationTransactionHashSource).toBe('absent');
    expect(submitted.operationStatus).toBe('submitted');
    expect(submitted.operationTransactionHashSource).toBe('provider_returned');
    expect(submitted.operationTransactionHash).toBe(operationTransactionHash);
  });

  it('represents confirmed receipt evidence and decoded event evidence only when supplied by the adapter', () => {
    const receiptOnly = buildOperation({
      operationStatus: 'confirmed',
      attemptId: 'attempt-3',
      contractAddress,
      targetWalletAddress,
      allowed: true,
      operationTransactionHash,
      operationReceiptStatus: 'success',
      localSessionOnly: true,
    });
    const decoded = buildOperation({
      operationStatus: 'confirmed',
      attemptId: 'attempt-4',
      contractAddress,
      targetWalletAddress,
      allowed: true,
      operationTransactionHash,
      operationReceiptStatus: 'success',
      decodedEvent: {
        eventName: 'WalletWhitelisted',
        wallet: targetWalletAddress,
        allowed: true,
        operator: '0x2222222222222222222222222222222222222222',
      },
      localSessionOnly: true,
    });

    expect(receiptOnly.eventEvidenceStatus).toBe('receipt_confirmed');
    expect(receiptOnly.decodedEvent).toBeUndefined();
    expect(decoded.eventEvidenceStatus).toBe('decoded_from_receipt');
    expect(decoded.decodedEvent?.wallet).toBe(targetWalletAddress);
  });

  it('keeps rejected and failed states from inventing evidence', () => {
    const rejected = buildOperation({
      operationStatus: 'rejected',
      attemptId: 'attempt-5',
      targetWalletAddress,
      allowed: true,
      errorCode: 'provider_rejected',
      errorMessage: 'Wallet Whitelist rejected in wallet.',
      localSessionOnly: true,
    });
    const failed = buildOperation({
      operationStatus: 'failed',
      attemptId: 'attempt-6',
      contractAddress,
      targetWalletAddress,
      allowed: true,
      operationTransactionHash,
      operationReceiptStatus: 'failed',
      errorCode: 'receipt_failed',
      localSessionOnly: true,
    });

    expect(rejected.operationTransactionHash).toBeUndefined();
    expect(rejected.eventEvidenceStatus).toBe('not_available');
    expect(failed.operationTransactionHash).toBe(operationTransactionHash);
    expect(failed.contractAddress).toBeUndefined();
    expect(failed.eventEvidenceStatus).toBe('not_available');
  });

  it('is pure, local-session-only, Sepolia-only, and makes no authorization, KYC, audit, or production claims', () => {
    const input = {
      operationState: initialWalletWhitelistOperationState,
      deploymentEvidence,
      walletConnectedOnSepolia: true,
      targetWalletAddress,
      whitelistFunctionAvailable: true,
    } as const;
    const before = JSON.stringify(input);
    const first = toWalletWhitelistOperationReadModel(input);
    const second = toWalletWhitelistOperationReadModel(input);
    const serialized = JSON.stringify(first);

    expect(first).toEqual(second);
    expect(JSON.stringify(input)).toBe(before);
    expect(first.operationEvidencePersistence).toBe('local_session_only');
    expect(first.networkName).toBe('Sepolia');
    expect(first.chainId).toBe(11155111);
    expect(serialized).not.toMatch(/mainnet ready|mainnet allowed|audited|verified|production ready|KYC approved|issuer authorized|wallet authorized/i);
  });
});
