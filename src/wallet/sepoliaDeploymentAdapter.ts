import { encodeDeployData, type Abi, type Hex } from 'viem';
import type { UnsignedDeploymentIntentReadModel } from '../domain/unsignedDeploymentIntentReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../domain/walletConnectionReadModel';
import {
  isDeploymentAttemptInFlight,
  type WalletSignedDeploymentState,
  type WalletSignedDeploymentStatus,
} from '../domain/walletSignedDeploymentReadModel';

export type SepoliaDeploymentRequestArguments =
  | { method: 'eth_accounts'; params?: readonly unknown[] | Record<string, unknown> }
  | { method: 'eth_chainId'; params?: readonly unknown[] | Record<string, unknown> }
  | {
      method: 'eth_sendTransaction';
      params: [
        {
          from: string;
          data: Hex;
          value: '0x0';
          to?: never;
        },
      ];
    }
  | { method: 'eth_getTransactionReceipt'; params: [string] };

export type SepoliaDeploymentProvider = {
  request(args: SepoliaDeploymentRequestArguments): Promise<unknown>;
};

export type DeploymentArtifactForSepolia = {
  contractName: 'Mila26RestrictedFundToken';
  abi: Abi;
  bytecode: Hex;
  bytecodeHash: string;
};

export type Mila26DeploymentConstructorArgs = readonly [string, string, string];

export type SepoliaDeploymentReceipt = {
  status?: string;
  contractAddress?: string | null;
};

export type SepoliaDeploymentPollOptions = {
  maxAttempts?: number;
  intervalMs?: number;
  wait?: (ms: number) => Promise<void>;
};

export type SepoliaDeploymentInput = {
  provider?: SepoliaDeploymentProvider;
  connectedWalletAddress?: string;
  unsignedDeploymentIntent: UnsignedDeploymentIntentReadModel;
  deploymentArtifact: DeploymentArtifactForSepolia;
  constructorArgs?: Mila26DeploymentConstructorArgs;
  currentDeploymentState: WalletSignedDeploymentState;
  attemptId: string;
  pollOptions?: SepoliaDeploymentPollOptions;
  shouldContinue?: (attemptId: string) => boolean;
  onStateChange?: (state: WalletSignedDeploymentState) => void;
};

function normalizeAddress(address?: string): string | undefined {
  return address?.toLowerCase();
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function toChainId(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value.toString().toLowerCase() : undefined;
}

function isHexValue(value: unknown): value is Hex {
  return typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value);
}

function safeMessage(message: string): string {
  return message;
}

function providerRejected(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string | number }).code === 4001;
}

function state(
  deploymentStatus: WalletSignedDeploymentStatus,
  attemptId: string,
  overrides: Omit<Partial<WalletSignedDeploymentState>, 'deploymentStatus' | 'attemptId' | 'localSessionOnly'> = {},
): WalletSignedDeploymentState {
  return {
    deploymentStatus,
    attemptId,
    localSessionOnly: true,
    ...overrides,
  };
}

function blocked(
  attemptId: string,
  errorCode: WalletSignedDeploymentState['errorCode'],
  errorMessage: string,
): WalletSignedDeploymentState {
  return state('blocked', attemptId, {
    errorCode,
    errorMessage: safeMessage(errorMessage),
  });
}

function emit(
  input: Pick<SepoliaDeploymentInput, 'attemptId' | 'shouldContinue' | 'onStateChange'>,
  nextState: WalletSignedDeploymentState,
) {
  if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return false;
  input.onStateChange?.(nextState);
  return true;
}

async function waitForReceipt(
  provider: SepoliaDeploymentProvider,
  transactionHash: string,
  input: Pick<SepoliaDeploymentInput, 'attemptId' | 'shouldContinue' | 'pollOptions'>,
): Promise<SepoliaDeploymentReceipt | null> {
  const maxAttempts = input.pollOptions?.maxAttempts ?? 8;
  const intervalMs = input.pollOptions?.intervalMs ?? 1_500;
  const wait = input.pollOptions?.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return null;

    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [transactionHash],
    });

    if (receipt && typeof receipt === 'object') {
      return receipt as SepoliaDeploymentReceipt;
    }

    if (attempt < maxAttempts - 1) {
      await wait(intervalMs);
    }
  }

  return null;
}

function validateBeforeProviderRead(input: SepoliaDeploymentInput): WalletSignedDeploymentState | undefined {
  if (!input.provider) {
    return blocked(input.attemptId, 'provider_unavailable', 'No EIP-1193 wallet provider is available.');
  }

  if (isDeploymentAttemptInFlight(input.currentDeploymentState)) {
    return blocked(input.attemptId, 'duplicate_attempt', 'A wallet deployment request is already awaiting confirmation or receipt.');
  }

  if (!input.connectedWalletAddress) {
    return blocked(input.attemptId, 'wallet_not_connected', 'Connect a user wallet before deployment.');
  }

  if (input.unsignedDeploymentIntent.intentStatus !== 'review_ready') {
    return blocked(input.attemptId, 'intent_blocked', 'Unsigned deployment intent is not review-ready.');
  }

  if (
    !input.deploymentArtifact.abi?.length ||
    !input.deploymentArtifact.bytecode ||
    input.deploymentArtifact.bytecode === '0x'
  ) {
    return blocked(input.attemptId, 'artifact_missing', 'Compiled deployment artifact ABI or bytecode is missing.');
  }

  if (!input.constructorArgs || input.constructorArgs.length !== 3) {
    return blocked(input.attemptId, 'constructor_args_missing', 'Deployment constructor arguments are incomplete.');
  }

  return undefined;
}

export function createMila26DeploymentData(
  artifact: DeploymentArtifactForSepolia,
  constructorArgs: Mila26DeploymentConstructorArgs,
): Hex {
  return encodeDeployData({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args: [...constructorArgs],
  });
}

export async function requestWalletSignedSepoliaDeployment(
  input: SepoliaDeploymentInput,
): Promise<WalletSignedDeploymentState> {
  const earlyBlock = validateBeforeProviderRead(input);
  if (earlyBlock) {
    emit(input, earlyBlock);
    return earlyBlock;
  }

  const provider = input.provider;
  if (!provider) {
    const nextState = blocked(input.attemptId, 'provider_unavailable', 'No EIP-1193 wallet provider is available.');
    emit(input, nextState);
    return nextState;
  }
  const accounts = toStringArray(await provider.request({ method: 'eth_accounts' }));
  const selectedAccount = accounts[0];
  const chainId = toChainId(await provider.request({ method: 'eth_chainId' }));
  const connectedWallet = normalizeAddress(input.connectedWalletAddress);
  const intentDeployer = normalizeAddress(input.unsignedDeploymentIntent.deployer.connectedWalletAddress);
  const selectedWallet = normalizeAddress(selectedAccount);

  if (!selectedAccount) {
    const nextState = blocked(input.attemptId, 'wallet_not_connected', 'No selected wallet account is available.');
    emit(input, nextState);
    return nextState;
  }

  if (selectedWallet !== connectedWallet || selectedWallet !== intentDeployer) {
    const nextState = blocked(input.attemptId, 'account_changed', 'Selected wallet account changed before deployment.');
    emit(input, nextState);
    return nextState;
  }

  if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
    const nextState = blocked(input.attemptId, 'wrong_chain', 'Wrong chain: switch to Sepolia in your wallet.');
    emit(input, nextState);
    return nextState;
  }

  const data = createMila26DeploymentData(input.deploymentArtifact, input.constructorArgs as Mila26DeploymentConstructorArgs);
  const awaitingState = state('awaiting_wallet_confirmation', input.attemptId, {
    receiptStatus: 'pending',
  });
  if (!emit(input, awaitingState)) return awaitingState;

  let transactionHash: unknown;

  try {
    transactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: selectedAccount,
          data,
          value: '0x0',
        },
      ],
    });
  } catch (error) {
    const nextState = state(providerRejected(error) ? 'rejected' : 'failed', input.attemptId, {
      errorCode: providerRejected(error) ? 'provider_rejected' : 'provider_error',
      errorMessage: providerRejected(error) ? 'Deployment rejected in wallet.' : 'Wallet provider could not submit deployment.',
    });
    emit(input, nextState);
    return nextState;
  }

  if (!isHexValue(transactionHash)) {
    const nextState = state('failed', input.attemptId, {
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider did not return a transaction hash.',
    });
    emit(input, nextState);
    return nextState;
  }

  const submittedState = state('submitted', input.attemptId, {
    transactionHash,
    receiptStatus: 'pending',
  });
  if (!emit(input, submittedState)) return submittedState;

  try {
    const receipt = await waitForReceipt(provider, transactionHash, input);

    if (!receipt) {
      return submittedState;
    }

    if (receipt.status === '0x0') {
      const nextState = state('failed', input.attemptId, {
        transactionHash,
        receiptStatus: 'failed',
        errorCode: 'receipt_failed',
        errorMessage: 'Sepolia deployment receipt reported failure.',
      });
      emit(input, nextState);
      return nextState;
    }

    if (receipt.status === '0x1' && receipt.contractAddress) {
      const nextState = state('confirmed', input.attemptId, {
        transactionHash,
        contractAddress: receipt.contractAddress,
        receiptStatus: 'success',
      });
      emit(input, nextState);
      return nextState;
    }

    return submittedState;
  } catch {
    const nextState = state('failed', input.attemptId, {
      transactionHash,
      receiptStatus: 'pending',
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider could not read the deployment receipt.',
    });
    emit(input, nextState);
    return nextState;
  }
}
