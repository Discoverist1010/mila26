import { describe, expect, it } from 'vitest';
import { createInitialMila26LifecycleState, createInvestorRegistryEntry, markInvestorWalletWhitelisted, toMila26LifecycleReadModel } from '../src/domain/lifecycleState';
import { toDeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import { initialWalletSignedDeploymentState } from '../src/domain/walletSignedDeploymentReadModel';
import {
  initialWalletAllocationMintOperationState,
  toWalletAllocationMintOperationReadModel,
} from '../src/domain/walletAllocationMintOperationReadModel';

const investorWallet = '0x3333333333333333333333333333333333333333';
const paymentWallet = '0x4444444444444444444444444444444444444444';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function confirmedDeploymentEvidence() {
  return toDeploymentEvidenceReadModel({
    deploymentState: {
      ...initialWalletSignedDeploymentState,
      deploymentStatus: 'confirmed',
      transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      contractAddress,
      receiptStatus: 'success',
      localSessionOnly: true,
    },
    artifactReference: {
      contractName: 'Mila26RestrictedFundToken',
      bytecodeHash: '0xhash',
    },
  });
}

function readyAllocationMint(whitelisted: boolean) {
  const entry = createInvestorRegistryEntry({
    id: 'investor-1',
    walletAddress: investorWallet,
    existingEntries: [],
  });
  const state = {
    ...createInitialMila26LifecycleState(),
    investorRegistryEntries: [entry],
    subscriptionParameters: {
      permittedStablecoins: ['USDC'],
      subscriptionWindow: 'Monthly',
      minimumSubscriptionAmount: '25000',
      paymentAddress: paymentWallet,
      paymentPerToken: '1.025',
    },
    allocationMintParameters: {
      targetWalletAddress: investorWallet,
      tokenAmount: '1000',
    },
  };

  return toMila26LifecycleReadModel(whitelisted ? markInvestorWalletWhitelisted(state, investorWallet) : state).allocationMint;
}

describe('Wallet Allocation / Mint operation read model', () => {
  it('requires deployment, Sepolia wallet, whitelisted investor, ABI support, and allocation parameters', () => {
    const operation = toWalletAllocationMintOperationReadModel({
      operationState: initialWalletAllocationMintOperationState,
      deploymentEvidence: confirmedDeploymentEvidence(),
      walletConnectedOnSepolia: true,
      allocationMint: readyAllocationMint(false),
      selectedInvestorWhitelisted: false,
      mintFunctionAvailable: true,
    });

    expect(operation.operationStatus).toBe('blocked');
    expect(operation.blockingReasons).toContain('Whitelist the selected investor wallet before Allocation / Mint.');
    expect(operation.statusDetail).toBe('Allocation / Mint is blocked by a precondition.');
  });

  it('becomes ready only when every gate is satisfied and surfaces confirmed evidence', () => {
    const ready = toWalletAllocationMintOperationReadModel({
      operationState: initialWalletAllocationMintOperationState,
      deploymentEvidence: confirmedDeploymentEvidence(),
      walletConnectedOnSepolia: true,
      allocationMint: readyAllocationMint(true),
      selectedInvestorWhitelisted: true,
      mintFunctionAvailable: true,
    });

    expect(ready.operationStatus).toBe('ready');
    expect(ready.statusLabel).toBe('Allocation / Mint status: Ready');

    const confirmed = toWalletAllocationMintOperationReadModel({
      operationState: {
        operationStatus: 'confirmed',
        attemptId: 'allocation-mint-operation-1',
        operationTransactionHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        contractAddress,
        targetWalletAddress: investorWallet,
        tokenAmount: '1000',
        tokenAmountUnits: '1000000000000000000000',
        operationReceiptStatus: 'success',
        decodedEvent: {
          eventName: 'AllocationMinted',
          wallet: investorWallet,
          amount: '1000000000000000000000',
        },
        localSessionOnly: true,
      },
      deploymentEvidence: confirmedDeploymentEvidence(),
      walletConnectedOnSepolia: true,
      allocationMint: readyAllocationMint(true),
      selectedInvestorWhitelisted: true,
      mintFunctionAvailable: true,
    });

    expect(confirmed.operationStatus).toBe('confirmed');
    expect(confirmed.eventEvidenceStatus).toBe('decoded_from_receipt');
    expect(confirmed.operationTransactionHashSource).toBe('provider_returned');
  });
});
