import { describe, expect, it, vi } from 'vitest';
import {
  toDeploymentEvidenceReadModel,
  type BuildDeploymentEvidenceReadModelInput,
} from '../src/domain/deploymentEvidenceReadModel';
import {
  initialWalletSignedDeploymentState,
  type WalletSignedDeploymentState,
} from '../src/domain/walletSignedDeploymentReadModel';

const providerTransactionHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const receiptContractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function buildEvidence(deploymentState: WalletSignedDeploymentState, overrides: Partial<BuildDeploymentEvidenceReadModelInput> = {}) {
  return toDeploymentEvidenceReadModel({
    deploymentState,
    artifactReference: {
      artifactPackageId: 'artifact_mila26_restricted_fund_token',
      contractName: 'Mila26RestrictedFundToken',
      bytecodeHash: 'sha256-demo',
      compileCheckId: 'compile_check_mila26_restricted_fund_token',
    },
    ...overrides,
  });
}

describe('DeploymentEvidenceReadModel', () => {
  it('represents not-started deployment without identifiers or evidence strength', () => {
    const evidence = buildEvidence(initialWalletSignedDeploymentState);

    expect(evidence.status).toBe('not_started');
    expect(evidence.networkName).toBe('Sepolia');
    expect(evidence.chainId).toBe(11155111);
    expect(evidence.evidenceStrength).toBe('none');
    expect(evidence.transactionHashSource).toBe('absent');
    expect(evidence.contractAddressSource).toBe('absent');
    expect(evidence.transactionHash).toBeUndefined();
    expect(evidence.contractAddress).toBeUndefined();
    expect(evidence.operationsLocked).toBe(true);
  });

  it('represents awaiting wallet confirmation without transaction or contract evidence', () => {
    const evidence = buildEvidence({
      deploymentStatus: 'awaiting_wallet_confirmation',
      attemptId: 'attempt-1',
      receiptStatus: 'pending',
      localSessionOnly: true,
    });

    expect(evidence.status).toBe('awaiting_wallet_confirmation');
    expect(evidence.evidenceStrength).toBe('none');
    expect(evidence.transactionHash).toBeUndefined();
    expect(evidence.contractAddress).toBeUndefined();
    expect(evidence.statusDetail).toMatch(/No provider transaction hash/i);
  });

  it('represents submitted deployment with exact provider-returned transaction hash only', () => {
    const evidence = buildEvidence({
      deploymentStatus: 'submitted',
      attemptId: 'attempt-2',
      transactionHash: providerTransactionHash,
      receiptStatus: 'pending',
      localSessionOnly: true,
    });

    expect(evidence.status).toBe('submitted');
    expect(evidence.evidenceStrength).toBe('provider_transaction_hash');
    expect(evidence.transactionHashSource).toBe('provider_returned');
    expect(evidence.transactionHash).toBe(providerTransactionHash);
    expect(evidence.contractAddressSource).toBe('absent');
    expect(evidence.contractAddress).toBeUndefined();
  });

  it('represents confirmed deployment with exact provider transaction hash and receipt contract address', () => {
    const evidence = buildEvidence({
      deploymentStatus: 'confirmed',
      attemptId: 'attempt-3',
      transactionHash: providerTransactionHash,
      contractAddress: receiptContractAddress,
      receiptStatus: 'success',
      localSessionOnly: true,
    });

    expect(evidence.status).toBe('confirmed');
    expect(evidence.evidenceStrength).toBe('confirmed_receipt');
    expect(evidence.transactionHashSource).toBe('provider_returned');
    expect(evidence.contractAddressSource).toBe('receipt_returned');
    expect(evidence.transactionHash).toBe(providerTransactionHash);
    expect(evidence.contractAddress).toBe(receiptContractAddress);
    expect(evidence.nextStep).toBe('track_15a_record_nav_event_later');
  });

  it('keeps rejected deployment without identifiers when the provider returned none', () => {
    const evidence = buildEvidence({
      deploymentStatus: 'rejected',
      attemptId: 'attempt-4',
      errorCode: 'provider_rejected',
      errorMessage: 'Deployment rejected in wallet',
      localSessionOnly: true,
    });

    expect(evidence.evidenceStrength).toBe('none');
    expect(evidence.transactionHash).toBeUndefined();
    expect(evidence.contractAddress).toBeUndefined();
    expect(evidence.evidenceItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'wallet-rejection', detail: 'Deployment rejected in wallet.' }),
      ]),
    );
  });

  it('keeps failed provider hash but does not expose a fake or malformed contract address', () => {
    const evidence = buildEvidence({
      deploymentStatus: 'failed',
      attemptId: 'attempt-5',
      transactionHash: providerTransactionHash,
      contractAddress: receiptContractAddress,
      receiptStatus: 'failed',
      errorCode: 'receipt_failed',
      localSessionOnly: true,
    });

    expect(evidence.evidenceStrength).toBe('provider_transaction_hash');
    expect(evidence.transactionHash).toBe(providerTransactionHash);
    expect(evidence.contractAddressSource).toBe('absent');
    expect(evidence.contractAddress).toBeUndefined();
  });

  it('includes blocked reasons without transaction or contract identifiers', () => {
    const evidence = buildEvidence({
      deploymentStatus: 'blocked',
      attemptId: 'attempt-6',
      errorCode: 'wrong_chain',
      errorMessage: 'Wrong chain: switch to Sepolia in your wallet.',
      localSessionOnly: true,
    });

    expect(evidence.evidenceStrength).toBe('none');
    expect(evidence.blockingReasons).toEqual(['Wrong chain: switch to Sepolia in your wallet.']);
    expect(evidence.transactionHash).toBeUndefined();
    expect(evidence.contractAddress).toBeUndefined();
  });

  it('uses provenance sources only when matching provider and receipt evidence exists', () => {
    const submitted = buildEvidence({
      deploymentStatus: 'submitted',
      transactionHash: providerTransactionHash,
      receiptStatus: 'pending',
      localSessionOnly: true,
    });
    const confirmedWithoutSuccessfulReceipt = buildEvidence({
      deploymentStatus: 'confirmed',
      transactionHash: providerTransactionHash,
      contractAddress: receiptContractAddress,
      receiptStatus: 'pending',
      localSessionOnly: true,
    });

    expect(submitted.transactionHashSource).toBe('provider_returned');
    expect(submitted.contractAddressSource).toBe('absent');
    expect(confirmedWithoutSuccessfulReceipt.contractAddressSource).toBe('absent');
    expect(confirmedWithoutSuccessfulReceipt.contractAddress).toBeUndefined();
  });

  it('keeps evidence persistence local-session-only and mainnet absent', () => {
    const evidence = buildEvidence(initialWalletSignedDeploymentState);
    const serialized = JSON.stringify(evidence);

    expect(evidence.evidencePersistence).toBe('local_session_only');
    expect(evidence.evidencePersistenceLabel).toBe('Local session only');
    expect(evidence.boundaryItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'local-session-only', detail: 'Evidence persistence: Local session only.' }),
        expect.objectContaining({ id: 'sepolia-only', detail: 'Network: Sepolia. Mainnet disabled.' }),
      ]),
    );
    expect(serialized).not.toMatch(/mainnet ready|mainnet allowed/i);
  });

  it('is deterministic, side-effect free, and does not mutate input', () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const deploymentState: WalletSignedDeploymentState = {
      deploymentStatus: 'confirmed',
      transactionHash: providerTransactionHash,
      contractAddress: receiptContractAddress,
      receiptStatus: 'success',
      localSessionOnly: true,
    };
    const before = structuredClone(deploymentState);

    const first = buildEvidence(deploymentState);
    const second = buildEvidence(deploymentState);

    expect(first).toEqual(second);
    expect(deploymentState).toEqual(before);
    expect(storageSpy).not.toHaveBeenCalled();
    storageSpy.mockRestore();
  });

  it('does not create identifiers or imply durable storage, API persistence, audit, security, legal, or production approval', () => {
    const evidence = buildEvidence(initialWalletSignedDeploymentState);
    const serialized = JSON.stringify(evidence);

    expect(serialized).not.toMatch(/0x[a-fA-F0-9]{6,}/);
    expect(serialized).not.toMatch(/database|localStorage|sessionStorage|backendRoute|apiEndpoint|durable evidence|persistent evidence/i);
    expect(serialized).not.toMatch(/audited|verified|certified|production ready|legal\/compliance approved|security approved/i);
    expect(evidence.operationsLocked).toBe(true);
  });
});
