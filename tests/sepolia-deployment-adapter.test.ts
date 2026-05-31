import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mila26RestrictedFundTokenDeploymentArtifact } from '../src/contracts/mila26RestrictedFundTokenDeploymentArtifact';
import type { UnsignedDeploymentIntentReadModel } from '../src/domain/unsignedDeploymentIntentReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../src/domain/walletConnectionReadModel';
import { initialWalletSignedDeploymentState } from '../src/domain/walletSignedDeploymentReadModel';
import {
  createMila26DeploymentData,
  requestWalletSignedSepoliaDeployment,
  type SepoliaDeploymentProvider,
  type SepoliaDeploymentRequestArguments,
} from '../src/wallet/sepoliaDeploymentAdapter';

const connectedWallet = '0x1111111111111111111111111111111111111111';
const changedWallet = '0x2222222222222222222222222222222222222222';
const providerTransactionHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const receiptContractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

function reviewReadyIntent(overrides: Partial<UnsignedDeploymentIntentReadModel> = {}): UnsignedDeploymentIntentReadModel {
  return {
    intentStatus: 'review_ready',
    deploymentExecutionStatus: 'not_implemented',
    targetNetwork: {
      networkName: 'Ethereum Sepolia',
      chainIdDecimal: 11155111,
      chainIdHex: SEPOLIA_CHAIN_ID_HEX,
      mainnetDisabled: true,
    },
    deployer: {
      connectedWalletAddress: connectedWallet,
      source: 'user_wallet',
      backendPrivateKeyCustody: 'never',
    },
    compiledArtifactReference: {
      contractName: 'Mila26RestrictedFundToken',
      artifactSource: 'local_compiled_artifact',
      artifactStatus: 'available',
      abiStatus: 'available',
      bytecodeStatus: 'available',
      bytecodeHash: mila26RestrictedFundTokenDeploymentArtifact.bytecodeHash,
      compileTestStatus: 'passed',
    },
    constructorParameters: {
      status: 'complete',
      fields: [
        { name: 'tokenName', type: 'string', valuePreview: 'MILA Income Fund', source: 'test' },
        { name: 'tokenSymbol', type: 'string', valuePreview: 'MILA', source: 'test' },
        { name: 'initialAdmin', type: 'address', valuePreview: connectedWallet, source: 'test' },
      ],
    },
    requiredReviewItems: [],
    blockedReasons: [],
    signingBoundaries: [],
    absentExecutionArtifacts: [],
    nextStep: 'wallet_signed_deployment_track_14b',
    ...overrides,
  };
}

function createMockDeploymentProvider(options: {
  accounts?: string[];
  chainId?: string;
  rejectSend?: boolean;
  throwOnReceipt?: boolean;
  receipts?: Array<unknown>;
} = {}) {
  const calls: SepoliaDeploymentRequestArguments[] = [];
  const receipts = [...(options.receipts ?? [{ status: '0x1', contractAddress: receiptContractAddress }])];

  const provider: SepoliaDeploymentProvider = {
    async request(args) {
      calls.push(args);

      if (args.method === 'eth_accounts') return options.accounts ?? [connectedWallet];
      if (args.method === 'eth_chainId') return options.chainId ?? SEPOLIA_CHAIN_ID_HEX;
      if (args.method === 'eth_sendTransaction') {
        if (options.rejectSend) {
          throw Object.assign(new Error('User rejected'), { code: 4001 });
        }
        return providerTransactionHash;
      }
      if (args.method === 'eth_getTransactionReceipt') {
        if (options.throwOnReceipt) throw new Error('receipt unavailable');
        return receipts.length ? receipts.shift() : null;
      }

      throw new Error('Unexpected provider method');
    },
  } as SepoliaDeploymentProvider;

  return { provider, calls };
}

function baseInput(overrides: Partial<Parameters<typeof requestWalletSignedSepoliaDeployment>[0]> = {}) {
  return {
    provider: createMockDeploymentProvider().provider,
    connectedWalletAddress: connectedWallet,
    unsignedDeploymentIntent: reviewReadyIntent(),
    deploymentArtifact: mila26RestrictedFundTokenDeploymentArtifact,
    constructorArgs: ['MILA Income Fund', 'MILA', connectedWallet] as const,
    currentDeploymentState: initialWalletSignedDeploymentState,
    attemptId: 'attempt-1',
    pollOptions: {
      maxAttempts: 2,
      intervalMs: 0,
      wait: () => Promise.resolve(),
    },
    ...overrides,
  };
}

describe('Sepolia deployment adapter', () => {
  it('exports a deterministic frontend artifact derived from the compiled Hardhat artifact', () => {
    const hardhatArtifact = JSON.parse(
      readFileSync('artifacts/contracts/Mila26RestrictedFundToken.sol/Mila26RestrictedFundToken.json', 'utf8'),
    );
    const bytecodeHash = `sha256-${createHash('sha256').update(hardhatArtifact.bytecode).digest('hex')}`;

    expect(mila26RestrictedFundTokenDeploymentArtifact.contractName).toBe('Mila26RestrictedFundToken');
    expect(mila26RestrictedFundTokenDeploymentArtifact.bytecode).toBe(hardhatArtifact.bytecode);
    expect(mila26RestrictedFundTokenDeploymentArtifact.bytecodeHash).toBe(bytecodeHash);
  });

  it('blocks deployment before provider, wallet, Sepolia, intent, artifact, and constructor requirements are met', async () => {
    await expect(requestWalletSignedSepoliaDeployment(baseInput({ provider: undefined }))).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'provider_unavailable',
    });
    await expect(requestWalletSignedSepoliaDeployment(baseInput({ connectedWalletAddress: undefined }))).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'wallet_not_connected',
    });
    await expect(
      requestWalletSignedSepoliaDeployment(baseInput({ unsignedDeploymentIntent: reviewReadyIntent({ intentStatus: 'blocked' }) })),
    ).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'intent_blocked',
    });
    await expect(
      requestWalletSignedSepoliaDeployment(
        baseInput({ deploymentArtifact: { ...mila26RestrictedFundTokenDeploymentArtifact, bytecode: '0x' } }),
      ),
    ).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'artifact_missing',
    });
    await expect(requestWalletSignedSepoliaDeployment(baseInput({ constructorArgs: undefined }))).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'constructor_args_missing',
    });
  });

  it('re-checks account and chain immediately before sending and blocks changed or wrong-chain state', async () => {
    const changedAccount = createMockDeploymentProvider({ accounts: [changedWallet] });
    const wrongChain = createMockDeploymentProvider({ chainId: '0x1' });

    await expect(requestWalletSignedSepoliaDeployment(baseInput({ provider: changedAccount.provider }))).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'account_changed',
    });
    expect(changedAccount.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);

    await expect(requestWalletSignedSepoliaDeployment(baseInput({ provider: wrongChain.provider }))).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'wrong_chain',
    });
    expect(wrongChain.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId']);
  });

  it('blocks duplicate deployment attempts while awaiting wallet confirmation or submitted', async () => {
    await expect(
      requestWalletSignedSepoliaDeployment(
        baseInput({
          currentDeploymentState: { deploymentStatus: 'awaiting_wallet_confirmation', attemptId: 'old', localSessionOnly: true },
        }),
      ),
    ).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'duplicate_attempt',
    });
    await expect(
      requestWalletSignedSepoliaDeployment(
        baseInput({
          currentDeploymentState: { deploymentStatus: 'submitted', attemptId: 'old', localSessionOnly: true },
        }),
      ),
    ).resolves.toMatchObject({
      deploymentStatus: 'blocked',
      errorCode: 'duplicate_attempt',
    });
  });

  it('sends a contract-creation transaction and captures provider-returned hash and receipt contract address', async () => {
    const { provider, calls } = createMockDeploymentProvider();
    const states: unknown[] = [];
    const result = await requestWalletSignedSepoliaDeployment(
      baseInput({
        provider,
        onStateChange: (state) => states.push(state),
      }),
    );
    const sendCall = calls.find((call) => call.method === 'eth_sendTransaction');
    const transaction = sendCall?.method === 'eth_sendTransaction' ? sendCall.params[0] : undefined;
    const data = createMila26DeploymentData(mila26RestrictedFundTokenDeploymentArtifact, [
      'MILA Income Fund',
      'MILA',
      connectedWallet,
    ]);

    expect(calls.map((call) => call.method)).toEqual([
      'eth_accounts',
      'eth_chainId',
      'eth_sendTransaction',
      'eth_getTransactionReceipt',
    ]);
    expect(transaction?.from).toBe(connectedWallet);
    expect(transaction?.to).toBeUndefined();
    expect(transaction?.value).toBe('0x0');
    expect(transaction?.data).toBe(data);
    expect(transaction?.data.startsWith(mila26RestrictedFundTokenDeploymentArtifact.bytecode)).toBe(true);
    expect(transaction).not.toHaveProperty('gas');
    expect(transaction).not.toHaveProperty('nonce');
    expect(transaction).not.toHaveProperty('maxFeePerGas');
    expect(transaction).not.toHaveProperty('maxPriorityFeePerGas');
    expect(calls.map((call) => call.method)).not.toEqual(
      expect.arrayContaining(['personal_sign', 'eth_sign', 'eth_signTypedData', 'wallet_switchEthereumChain', 'wallet_addEthereumChain']),
    );
    expect(states).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ deploymentStatus: 'awaiting_wallet_confirmation' }),
        expect.objectContaining({ deploymentStatus: 'submitted', transactionHash: providerTransactionHash }),
        expect.objectContaining({
          deploymentStatus: 'confirmed',
          transactionHash: providerTransactionHash,
          contractAddress: receiptContractAddress,
        }),
      ]),
    );
    expect(result).toMatchObject({
      deploymentStatus: 'confirmed',
      transactionHash: providerTransactionHash,
      contractAddress: receiptContractAddress,
      localSessionOnly: true,
    });
  });

  it('normalizes rejection, bounded polling, stale polling, and failed receipts without fake identifiers', async () => {
    const rejected = createMockDeploymentProvider({ rejectSend: true });
    await expect(requestWalletSignedSepoliaDeployment(baseInput({ provider: rejected.provider }))).resolves.toMatchObject({
      deploymentStatus: 'rejected',
      errorCode: 'provider_rejected',
    });

    const pending = createMockDeploymentProvider({ receipts: [null, null] });
    await expect(requestWalletSignedSepoliaDeployment(baseInput({ provider: pending.provider }))).resolves.toMatchObject({
      deploymentStatus: 'submitted',
      transactionHash: providerTransactionHash,
      receiptStatus: 'pending',
    });
    expect(pending.calls.filter((call) => call.method === 'eth_getTransactionReceipt')).toHaveLength(2);

    const staleStates: unknown[] = [];
    const stale = createMockDeploymentProvider({ receipts: [{ status: '0x1', contractAddress: receiptContractAddress }] });
    await expect(
      requestWalletSignedSepoliaDeployment(
        baseInput({
          provider: stale.provider,
          shouldContinue: (attemptId) => attemptId !== 'attempt-1',
          onStateChange: (state) => staleStates.push(state),
        }),
      ),
    ).resolves.toMatchObject({ deploymentStatus: 'awaiting_wallet_confirmation' });
    expect(staleStates).toEqual([]);

    const failedReceipt = createMockDeploymentProvider({ receipts: [{ status: '0x0', contractAddress: null }] });
    await expect(requestWalletSignedSepoliaDeployment(baseInput({ provider: failedReceipt.provider }))).resolves.toMatchObject({
      deploymentStatus: 'failed',
      errorCode: 'receipt_failed',
      transactionHash: providerTransactionHash,
    });
  });
});
