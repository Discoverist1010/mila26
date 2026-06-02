import { encodeAbiParameters, encodeEventTopics } from 'viem';
import { describe, expect, it } from 'vitest';
import { mila26RestrictedFundTokenDeploymentArtifact } from '../src/contracts/mila26RestrictedFundTokenDeploymentArtifact';
import type { DeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import { initialWalletWhitelistOperationState } from '../src/domain/walletWhitelistOperationReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../src/domain/walletConnectionReadModel';
import {
  createWalletWhitelistOperationData,
  hasSetWalletAllowedFunction,
  requestWalletSignedWhitelistOperation,
  type SepoliaWalletWhitelistOperationProvider,
  type SepoliaWalletWhitelistOperationRequestArguments,
} from '../src/wallet/sepoliaWalletWhitelistOperationAdapter';

const connectedWallet = '0x1111111111111111111111111111111111111111';
const changedWallet = '0x2222222222222222222222222222222222222222';
const targetWalletAddress = '0x3333333333333333333333333333333333333333';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const operationTransactionHash = '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';

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

function walletWhitelistedLog(wallet = targetWalletAddress) {
  const topics = encodeEventTopics({
    abi: mila26RestrictedFundTokenDeploymentArtifact.abi,
    eventName: 'WalletWhitelisted',
    args: {
      wallet: wallet as `0x${string}`,
      operator: connectedWallet as `0x${string}`,
    },
  });
  const data = encodeAbiParameters([{ name: 'allowed', type: 'bool' }], [true]);

  return {
    address: contractAddress,
    topics,
    data,
  };
}

function createMockWhitelistProvider(options: {
  accounts?: string[];
  chainId?: string;
  rejectSend?: boolean;
  sendError?: unknown;
  receipts?: Array<unknown>;
} = {}) {
  const calls: SepoliaWalletWhitelistOperationRequestArguments[] = [];
  const receipts = [...(options.receipts ?? [{ status: '0x1', logs: [walletWhitelistedLog()] }])];

  const provider: SepoliaWalletWhitelistOperationProvider = {
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

function baseInput(overrides: Partial<Parameters<typeof requestWalletSignedWhitelistOperation>[0]> = {}) {
  return {
    provider: createMockWhitelistProvider().provider,
    connectedWalletAddress: connectedWallet,
    deploymentEvidence: confirmedDeploymentEvidence(),
    contractAbi: mila26RestrictedFundTokenDeploymentArtifact.abi,
    targetWalletAddress,
    currentOperationState: initialWalletWhitelistOperationState,
    attemptId: 'wallet-whitelist-attempt-1',
    pollOptions: {
      maxAttempts: 2,
      intervalMs: 0,
      wait: () => Promise.resolve(),
    },
    ...overrides,
  };
}

describe('Sepolia Wallet Whitelist operation adapter', () => {
  it('confirms the deployment artifact ABI exposes setWalletAllowed(address,bool)', () => {
    expect(hasSetWalletAllowedFunction(mila26RestrictedFundTokenDeploymentArtifact.abi)).toBe(true);
  });

  it('blocks before provider, wallet, deployment evidence, contract address, ABI, and target wallet requirements are met', async () => {
    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'provider_unavailable',
    });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ connectedWalletAddress: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'wallet_not_connected',
    });
    await expect(
      requestWalletSignedWhitelistOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ status: 'submitted' }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'deployment_evidence_missing',
    });
    await expect(
      requestWalletSignedWhitelistOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ contractAddress: undefined }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'contract_address_missing',
    });
    await expect(
      requestWalletSignedWhitelistOperation(baseInput({ deploymentEvidence: confirmedDeploymentEvidence({ contractAddress: '0x0000000000000000000000000000000000000000' }) })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'contract_address_invalid',
    });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ contractAbi: [] }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'abi_function_missing',
    });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ targetWalletAddress: undefined }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'target_wallet_missing',
    });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ targetWalletAddress: '0x1234' }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'target_wallet_invalid',
    });
    await expect(
      requestWalletSignedWhitelistOperation(baseInput({ targetWalletAddress: '0x0000000000000000000000000000000000000000' })),
    ).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'target_wallet_invalid',
    });
  });

  it('re-checks account and chain immediately before sending', async () => {
    const changedAccount = createMockWhitelistProvider({ accounts: [changedWallet] });
    const wrongChain = createMockWhitelistProvider({ chainId: '0x1' });

    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: changedAccount.provider }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'account_changed',
    });
    expect(changedAccount.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);

    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: wrongChain.provider }))).resolves.toMatchObject({
      operationStatus: 'blocked',
      errorCode: 'wrong_chain',
    });
    expect(wrongChain.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);
  });

  it('blocks duplicate in-flight whitelist attempts', async () => {
    await expect(
      requestWalletSignedWhitelistOperation(
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
      requestWalletSignedWhitelistOperation(
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

  it('sends setWalletAllowed(targetWalletAddress, true) to the receipt-returned contract and captures provider hash, receipt, and decoded event evidence', async () => {
    const { provider, calls } = createMockWhitelistProvider();
    const states: unknown[] = [];
    const result = await requestWalletSignedWhitelistOperation(
      baseInput({
        provider,
        onStateChange: (state) => states.push(state),
      }),
    );
    const sendCall = calls.find((call) => call.method === 'eth_sendTransaction');
    const transaction = sendCall?.method === 'eth_sendTransaction' ? sendCall.params[0] : undefined;
    const data = createWalletWhitelistOperationData(mila26RestrictedFundTokenDeploymentArtifact.abi, targetWalletAddress);

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
            eventName: 'WalletWhitelisted',
            wallet: targetWalletAddress,
            allowed: true,
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

  it('handles rejection, successful receipt without decoded logs, failed authorization receipts, bounded polling, and stale attempts without fake evidence', async () => {
    const rejected = createMockWhitelistProvider({ rejectSend: true });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: rejected.provider }))).resolves.toMatchObject({
      operationStatus: 'rejected',
      errorCode: 'provider_rejected',
    });

    const noLogs = createMockWhitelistProvider({ receipts: [{ status: '0x1', logs: [] }] });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: noLogs.provider }))).resolves.toMatchObject({
      operationStatus: 'confirmed',
      decodedEvent: undefined,
      operationTransactionHash,
    });

    const mismatchedEvent = createMockWhitelistProvider({
      receipts: [{ status: '0x1', logs: [walletWhitelistedLog(changedWallet)] }],
    });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: mismatchedEvent.provider }))).resolves.toMatchObject({
      operationStatus: 'confirmed',
      decodedEvent: undefined,
      operationTransactionHash,
    });

    const failed = createMockWhitelistProvider({ receipts: [{ status: '0x0', logs: [] }] });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: failed.provider }))).resolves.toMatchObject({
      operationStatus: 'failed',
      errorCode: 'receipt_failed',
      operationTransactionHash,
      errorMessage: expect.stringMatching(/Contract authorization is enforced on-chain/),
    });

    const pending = createMockWhitelistProvider({ receipts: [null, null] });
    await expect(requestWalletSignedWhitelistOperation(baseInput({ provider: pending.provider }))).resolves.toMatchObject({
      operationStatus: 'submitted',
      operationTransactionHash,
      operationReceiptStatus: 'pending',
    });

    const stale = createMockWhitelistProvider();
    await expect(
      requestWalletSignedWhitelistOperation(
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
