import { encodeAbiParameters, encodeEventTopics } from 'viem';
import { describe, expect, it } from 'vitest';
import { mila26RestrictedFundTokenDeploymentArtifact } from '../src/contracts/mila26RestrictedFundTokenDeploymentArtifact';
import type { DeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import { initialRecordNavOperationState } from '../src/domain/recordNavOperationReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../src/domain/walletConnectionReadModel';
import {
  createRecordNavOperationData,
  hasRecordValuationFunction,
  requestWalletSignedRecordNavOperation,
  type SepoliaRecordNavOperationProvider,
  type SepoliaRecordNavOperationRequestArguments,
} from '../src/wallet/sepoliaRecordNavOperationAdapter';

const connectedWallet = '0x1111111111111111111111111111111111111111';
const changedWallet = '0x2222222222222222222222222222222222222222';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const operationTransactionHash = '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
const payload = {
  valuation: 1_050_000n,
  valuationReference: 'MILA26-ALPHA-NAV-001',
};

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

function valuationUpdatedLog() {
  const topics = encodeEventTopics({
    abi: mila26RestrictedFundTokenDeploymentArtifact.abi,
    eventName: 'ValuationUpdated',
    args: {
      operator: connectedWallet,
    },
  });
  const data = encodeAbiParameters(
    [
      { name: 'valuation', type: 'uint256' },
      { name: 'valuationReference', type: 'string' },
    ],
    [payload.valuation, payload.valuationReference],
  );

  return {
    address: contractAddress,
    topics,
    data,
  };
}

function createMockRecordNavProvider(options: {
  accounts?: string[];
  chainId?: string;
  rejectSend?: boolean;
  receipts?: Array<unknown>;
} = {}) {
  const calls: SepoliaRecordNavOperationRequestArguments[] = [];
  const receipts = [...(options.receipts ?? [{ status: '0x1', logs: [valuationUpdatedLog()] }])];

  const provider: SepoliaRecordNavOperationProvider = {
    async request(args) {
      calls.push(args);

      if (args.method === 'eth_accounts') return options.accounts ?? [connectedWallet];
      if (args.method === 'eth_chainId') return options.chainId ?? SEPOLIA_CHAIN_ID_HEX;
      if (args.method === 'eth_sendTransaction') {
        if (options.rejectSend) throw Object.assign(new Error('User rejected'), { code: 4001 });
        return operationTransactionHash;
      }
      if (args.method === 'eth_getTransactionReceipt') return receipts.length ? receipts.shift() : null;

      throw new Error('Unexpected provider method');
    },
  };

  return { provider, calls };
}

function baseInput(overrides: Partial<Parameters<typeof requestWalletSignedRecordNavOperation>[0]> = {}) {
  return {
    provider: createMockRecordNavProvider().provider,
    connectedWalletAddress: connectedWallet,
    deploymentEvidence: confirmedDeploymentEvidence(),
    contractAbi: mila26RestrictedFundTokenDeploymentArtifact.abi,
    payload,
    currentOperationState: initialRecordNavOperationState,
    attemptId: 'record-nav-attempt-1',
    pollOptions: {
      maxAttempts: 2,
      intervalMs: 0,
      wait: () => Promise.resolve(),
    },
    ...overrides,
  };
}

describe('Sepolia Record NAV operation adapter', () => {
  it('confirms the deployment artifact ABI exposes recordValuation(uint256,string)', () => {
    expect(hasRecordValuationFunction(mila26RestrictedFundTokenDeploymentArtifact.abi)).toBe(true);
  });

  it('blocks before provider, wallet, deployment evidence, contract address, ABI, and payload requirements are met', async () => {
    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'provider_unavailable',
    });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ connectedWalletAddress: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'wallet_not_connected',
    });
    await expect(
      requestWalletSignedRecordNavOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ status: 'submitted' }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'deployment_evidence_missing',
    });
    await expect(
      requestWalletSignedRecordNavOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ contractAddress: undefined }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'contract_address_missing',
    });
    await expect(
      requestWalletSignedRecordNavOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ contractAddress: '0x0000000000000000000000000000000000000000' }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'contract_address_invalid',
    });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ contractAbi: [] }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'abi_function_missing',
    });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ payload: { valuation: 0n, valuationReference: '' } }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'operation_payload_missing',
    });
  });

  it('re-checks account and chain immediately before sending', async () => {
    const changedAccount = createMockRecordNavProvider({ accounts: [changedWallet] });
    const wrongChain = createMockRecordNavProvider({ chainId: '0x1' });

    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: changedAccount.provider }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'account_changed',
    });
    expect(changedAccount.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);

    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: wrongChain.provider }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'wrong_chain',
    });
    expect(wrongChain.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);
  });

  it('blocks duplicate in-flight Record NAV attempts', async () => {
    await expect(
      requestWalletSignedRecordNavOperation(
        baseInput({
          currentOperationState: {
            operationStatus: 'awaiting_wallet_confirmation',
            attemptId: 'old',
            localSessionOnly: true,
          },
        }),
      ),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'duplicate_attempt',
    });
    await expect(
      requestWalletSignedRecordNavOperation(
        baseInput({
          currentOperationState: {
            operationStatus: 'submitted',
            attemptId: 'old',
            operationTransactionHash,
            localSessionOnly: true,
          },
        }),
      ),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'duplicate_attempt',
    });
  });

  it('sends recordValuation to the receipt-returned contract and captures provider hash, receipt, and decoded event evidence', async () => {
    const { provider, calls } = createMockRecordNavProvider();
    const states: unknown[] = [];
    const result = await requestWalletSignedRecordNavOperation(
      baseInput({
        provider,
        onStateChange: (state) => states.push(state),
      }),
    );
    const sendCall = calls.find((call) => call.method === 'eth_sendTransaction');
    const transaction = sendCall?.method === 'eth_sendTransaction' ? sendCall.params[0] : undefined;
    const data = createRecordNavOperationData(mila26RestrictedFundTokenDeploymentArtifact.abi, payload);

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
        expect.objectContaining({ operationStatus: 'awaiting_wallet_confirmation' }),
        expect.objectContaining({ operationStatus: 'submitted', operationTransactionHash }),
        expect.objectContaining({
          operationStatus: 'confirmed',
          operationTransactionHash,
          decodedEvent: expect.objectContaining({
            eventName: 'ValuationUpdated',
            valuation: '1050000',
            valuationReference: payload.valuationReference,
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

  it('handles rejection, successful receipt without decoded logs, failed receipts, bounded polling, and stale attempts without fake evidence', async () => {
    const rejected = createMockRecordNavProvider({ rejectSend: true });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: rejected.provider }))).resolves.toMatchObject({
      operationStatus: 'rejected',
      errorCode: 'provider_rejected',
    });

    const noLogs = createMockRecordNavProvider({ receipts: [{ status: '0x1', logs: [] }] });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: noLogs.provider }))).resolves.toMatchObject({
      operationStatus: 'confirmed',
      decodedEvent: undefined,
      operationTransactionHash,
    });

    const failed = createMockRecordNavProvider({ receipts: [{ status: '0x0', logs: [] }] });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: failed.provider }))).resolves.toMatchObject({
      operationStatus: 'failed',
      errorCode: 'receipt_failed',
      operationTransactionHash,
    });

    const pending = createMockRecordNavProvider({ receipts: [null, null] });
    await expect(requestWalletSignedRecordNavOperation(baseInput({ provider: pending.provider }))).resolves.toMatchObject({
      operationStatus: 'submitted',
      operationTransactionHash,
      operationReceiptStatus: 'pending',
    });

    const stale = createMockRecordNavProvider();
    await expect(
      requestWalletSignedRecordNavOperation(
        baseInput({
          provider: stale.provider,
          shouldContinue: () => false,
        }),
      ),
    ).resolves.toMatchObject({
      operationStatus: 'awaiting_wallet_confirmation',
    });
  });
});
