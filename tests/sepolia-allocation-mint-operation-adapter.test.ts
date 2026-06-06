import { encodeAbiParameters, encodeEventTopics, parseUnits } from 'viem';
import { describe, expect, it } from 'vitest';
import { mila26RestrictedFundTokenDeploymentArtifact } from '../src/contracts/mila26RestrictedFundTokenDeploymentArtifact';
import type { DeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import type { AllocationMintReadModel } from '../src/domain/lifecycleState';
import { SEPOLIA_CHAIN_ID_HEX } from '../src/domain/walletConnectionReadModel';
import { initialWalletAllocationMintOperationState } from '../src/domain/walletAllocationMintOperationReadModel';
import {
  createAllocationMintOperationData,
  hasMintAllocationFunction,
  requestWalletSignedAllocationMintOperation,
  type SepoliaAllocationMintOperationProvider,
  type SepoliaAllocationMintOperationRequestArguments,
} from '../src/wallet/sepoliaAllocationMintOperationAdapter';

const connectedWallet = '0x1111111111111111111111111111111111111111';
const changedWallet = '0x2222222222222222222222222222222222222222';
const targetWalletAddress = '0x3333333333333333333333333333333333333333';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const operationTransactionHash = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
const tokenAmount = '1000';
const tokenAmountUnits = parseUnits(tokenAmount, 18);

function confirmedDeploymentEvidence(overrides: Partial<DeploymentEvidenceReadModel> = {}): DeploymentEvidenceReadModel {
  return {
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
    ...overrides,
  };
}

function readyAllocationMint(overrides: Partial<AllocationMintReadModel> = {}): AllocationMintReadModel {
  return {
    status: 'ready',
    statusLabel: 'Allocation / Mint: Ready for review',
    statusDetail: `Allocation ready for ${tokenAmount} token(s) to ${targetWalletAddress}.`,
    targetWalletAddress,
    tokenAmount,
    selectedInvestorStatus: 'whitelisted_local_session_only',
    validationMessages: [],
    blockingReasons: [],
    canReviewAllocationMint: true,
    ...overrides,
  };
}

function allocationMintedLog(wallet = targetWalletAddress, amount = tokenAmountUnits) {
  const topics = encodeEventTopics({
    abi: mila26RestrictedFundTokenDeploymentArtifact.abi,
    eventName: 'AllocationMinted',
    args: {
      wallet: wallet as `0x${string}`,
      operator: connectedWallet as `0x${string}`,
    },
  });
  const data = encodeAbiParameters([{ name: 'amount', type: 'uint256' }], [amount]);

  return { address: contractAddress, topics, data };
}

function createMockAllocationMintProvider(options: {
  accounts?: string[];
  chainId?: string;
  rejectSend?: boolean;
  sendError?: unknown;
  receipts?: Array<unknown>;
} = {}) {
  const calls: SepoliaAllocationMintOperationRequestArguments[] = [];
  const receipts = [...(options.receipts ?? [{ status: '0x1', logs: [allocationMintedLog()] }])];

  const provider: SepoliaAllocationMintOperationProvider = {
    async request(args) {
      calls.push(args);

      if (args.method === 'eth_accounts') return options.accounts ?? [connectedWallet];
      if (args.method === 'eth_chainId') return options.chainId ?? SEPOLIA_CHAIN_ID_HEX;
      if (args.method === 'eth_sendTransaction') {
        if (options.rejectSend) throw Object.assign(new Error('User rejected'), { code: 4001 });
        if (options.sendError) throw options.sendError;
        return operationTransactionHash;
      }
      if (args.method === 'eth_getTransactionReceipt') return receipts.length ? receipts.shift() : null;

      throw new Error('Unexpected provider method');
    },
  };

  return { provider, calls };
}

function baseInput(overrides: Partial<Parameters<typeof requestWalletSignedAllocationMintOperation>[0]> = {}) {
  return {
    provider: createMockAllocationMintProvider().provider,
    connectedWalletAddress: connectedWallet,
    deploymentEvidence: confirmedDeploymentEvidence(),
    contractAbi: mila26RestrictedFundTokenDeploymentArtifact.abi,
    allocationMint: readyAllocationMint(),
    selectedInvestorWhitelisted: true,
    currentOperationState: initialWalletAllocationMintOperationState,
    attemptId: 'allocation-mint-attempt-1',
    pollOptions: {
      maxAttempts: 2,
      intervalMs: 0,
      wait: () => Promise.resolve(),
    },
    ...overrides,
  };
}

describe('Sepolia Allocation / Mint operation adapter', () => {
  it('confirms the deployment artifact ABI exposes mintAllocation(address,uint256)', () => {
    expect(hasMintAllocationFunction(mila26RestrictedFundTokenDeploymentArtifact.abi)).toBe(true);
  });

  it('blocks before provider, deployment, allocation, whitelist, ABI, and amount requirements are met', async () => {
    await expect(requestWalletSignedAllocationMintOperation(baseInput({ provider: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'provider_unavailable',
    });
    await expect(requestWalletSignedAllocationMintOperation(baseInput({ connectedWalletAddress: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'wallet_not_connected',
    });
    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ status: 'submitted' }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'deployment_evidence_missing',
    });
    await expect(requestWalletSignedAllocationMintOperation(baseInput({ contractAbi: [] }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'abi_function_missing',
    });
    await expect(requestWalletSignedAllocationMintOperation(baseInput({ selectedInvestorWhitelisted: false }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'target_wallet_not_whitelisted',
    });
    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ allocationMint: readyAllocationMint({ canReviewAllocationMint: false }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'allocation_not_ready',
    });
    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ allocationMint: readyAllocationMint({ tokenAmount: '0' }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'token_amount_invalid',
    });
  });

  it('re-checks account and chain immediately before sending', async () => {
    const changedAccount = createMockAllocationMintProvider({ accounts: [changedWallet] });
    const wrongChain = createMockAllocationMintProvider({ chainId: '0x1' });

    await expect(requestWalletSignedAllocationMintOperation(baseInput({ provider: changedAccount.provider }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'account_changed',
    });
    expect(changedAccount.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);

    await expect(requestWalletSignedAllocationMintOperation(baseInput({ provider: wrongChain.provider }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'wrong_chain',
    });
    expect(wrongChain.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);
  });

  it('sends mintAllocation(targetWalletAddress, amount) to the receipt-returned contract and captures event evidence', async () => {
    const { provider, calls } = createMockAllocationMintProvider();
    const states: unknown[] = [];
    const result = await requestWalletSignedAllocationMintOperation(
      baseInput({
        provider,
        onStateChange: (state) => states.push(state),
      }),
    );
    const sendCall = calls.find((call) => call.method === 'eth_sendTransaction');
    const transaction = sendCall?.method === 'eth_sendTransaction' ? sendCall.params[0] : undefined;
    const { data } = createAllocationMintOperationData(mila26RestrictedFundTokenDeploymentArtifact.abi, targetWalletAddress, tokenAmount);

    expect(calls.map((call) => call.method)).toEqual([
      'eth_accounts',
      'eth_chainId',
      'eth_sendTransaction',
      'eth_getTransactionReceipt',
    ]);
    expect(transaction?.from).toBe(connectedWallet);
    expect(transaction?.to).toBe(contractAddress);
    expect(transaction?.value).toBe('0x0');
    expect(transaction?.data).toBe(data);
    expect(calls.map((call) => call.method)).not.toEqual(
      expect.arrayContaining(['personal_sign', 'eth_sign', 'eth_signTypedData', 'wallet_switchEthereumChain', 'wallet_addEthereumChain']),
    );
    expect(states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ operationStatus: 'awaiting_wallet_confirmation', tokenAmountUnits: tokenAmountUnits.toString() }),
        expect.objectContaining({ operationStatus: 'submitted', operationTransactionHash }),
        expect.objectContaining({
          operationStatus: 'confirmed',
          operationTransactionHash,
          decodedEvent: expect.objectContaining({
            eventName: 'AllocationMinted',
            wallet: targetWalletAddress,
            amount: tokenAmountUnits.toString(),
          }),
        }),
      ]),
    );
    expect(result).toMatchObject({
      operationStatus: 'confirmed',
      operationTransactionHash,
      operationReceiptStatus: 'success',
      localSessionOnly: true,
    });
  });

  it('handles rejection, no decoded event, failed receipts, pending receipts, and stale attempts without fake evidence', async () => {
    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ provider: createMockAllocationMintProvider({ rejectSend: true }).provider })),
    ).resolves.toMatchObject({
      operationStatus: 'rejected',
      errorCode: 'provider_rejected',
    });

    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ provider: createMockAllocationMintProvider({ receipts: [{ status: '0x1', logs: [] }] }).provider })),
    ).resolves.toMatchObject({
      operationStatus: 'confirmed',
      decodedEvent: undefined,
      operationTransactionHash,
    });

    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ provider: createMockAllocationMintProvider({ receipts: [{ status: '0x0', logs: [] }] }).provider })),
    ).resolves.toMatchObject({
      operationStatus: 'failed',
      errorCode: 'receipt_failed',
      operationTransactionHash,
    });

    await expect(
      requestWalletSignedAllocationMintOperation(baseInput({ provider: createMockAllocationMintProvider({ receipts: [null, null] }).provider })),
    ).resolves.toMatchObject({
      operationStatus: 'submitted',
      operationTransactionHash,
      operationReceiptStatus: 'pending',
    });

    await expect(
      requestWalletSignedAllocationMintOperation(
        baseInput({
          provider: createMockAllocationMintProvider().provider,
          shouldContinue: () => false,
        }),
      ),
    ).resolves.toMatchObject({
      operationStatus: 'awaiting_wallet_confirmation',
    });
  });
});
