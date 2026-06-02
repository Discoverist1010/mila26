import { decodeEventLog, encodeFunctionData, type Abi, type Hex } from 'viem';
import type { DeploymentEvidenceReadModel } from '../domain/deploymentEvidenceReadModel';
import { isValidNonZeroEvmAddress } from '../domain/recordNavOperationReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../domain/walletConnectionReadModel';
import {
  isWalletWhitelistOperationInFlight,
  normalizeWalletWhitelistTargetAddress,
  type WalletWhitelistDecodedEvent,
  type WalletWhitelistOperationState,
  type WalletWhitelistOperationStatus,
} from '../domain/walletWhitelistOperationReadModel';

export type SepoliaWalletWhitelistOperationRequestArguments =
  | { method: 'eth_accounts'; params?: readonly unknown[] | Record<string, unknown> }
  | { method: 'eth_chainId'; params?: readonly unknown[] | Record<string, unknown> }
  | {
      method: 'eth_sendTransaction';
      params: [
        {
          from: string;
          to: string;
          data: Hex;
          value: '0x0';
        },
      ];
    }
  | { method: 'eth_getTransactionReceipt'; params: [string] };

export type SepoliaWalletWhitelistOperationProvider = {
  request(args: SepoliaWalletWhitelistOperationRequestArguments): Promise<unknown>;
};

export type WalletWhitelistOperationReceipt = {
  status?: string;
  logs?: Array<{
    address?: string;
    data?: string;
    topics?: string[];
  }>;
};

export type WalletWhitelistOperationPollOptions = {
  maxAttempts?: number;
  intervalMs?: number;
  wait?: (ms: number) => Promise<void>;
};

export type SepoliaWalletWhitelistOperationInput = {
  provider?: SepoliaWalletWhitelistOperationProvider;
  connectedWalletAddress?: string;
  deploymentEvidence: DeploymentEvidenceReadModel;
  contractAbi: Abi;
  targetWalletAddress?: string;
  currentOperationState: WalletWhitelistOperationState;
  attemptId: string;
  pollOptions?: WalletWhitelistOperationPollOptions;
  shouldContinue?: (attemptId: string) => boolean;
  onStateChange?: (state: WalletWhitelistOperationState) => void;
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

function providerRejected(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string | number }).code === 4001;
}

function state(
  operationStatus: Exclude<WalletWhitelistOperationStatus, 'ready'>,
  attemptId: string,
  overrides: Omit<Partial<WalletWhitelistOperationState>, 'operationStatus' | 'attemptId' | 'localSessionOnly'> = {},
): WalletWhitelistOperationState {
  return {
    operationStatus,
    attemptId,
    localSessionOnly: true,
    ...overrides,
  };
}

function blocked(
  attemptId: string,
  errorCode: WalletWhitelistOperationState['errorCode'],
  errorMessage: string,
): WalletWhitelistOperationState {
  return state('blocked', attemptId, {
    errorCode,
    errorMessage,
  });
}

function emit(
  input: Pick<SepoliaWalletWhitelistOperationInput, 'attemptId' | 'shouldContinue' | 'onStateChange'>,
  nextState: WalletWhitelistOperationState,
) {
  if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return false;
  input.onStateChange?.(nextState);
  return true;
}

async function waitForReceipt(
  provider: SepoliaWalletWhitelistOperationProvider,
  transactionHash: string,
  input: Pick<SepoliaWalletWhitelistOperationInput, 'attemptId' | 'shouldContinue' | 'pollOptions'>,
): Promise<WalletWhitelistOperationReceipt | null> {
  const maxAttempts = input.pollOptions?.maxAttempts ?? 8;
  const intervalMs = input.pollOptions?.intervalMs ?? 1_500;
  const wait = input.pollOptions?.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return null;

    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [transactionHash],
    });

    if (receipt && typeof receipt === 'object') return receipt as WalletWhitelistOperationReceipt;

    if (attempt < maxAttempts - 1) await wait(intervalMs);
  }

  return null;
}

export function hasSetWalletAllowedFunction(abi: Abi): boolean {
  return abi.some(
    (entry) =>
      entry.type === 'function' &&
      entry.name === 'setWalletAllowed' &&
      entry.stateMutability === 'nonpayable' &&
      entry.inputs?.length === 2 &&
      entry.inputs[0]?.type === 'address' &&
      entry.inputs[1]?.type === 'bool',
  );
}

export function createWalletWhitelistOperationData(abi: Abi, targetWalletAddress: string): Hex {
  if (!hasSetWalletAllowedFunction(abi)) {
    throw new Error('setWalletAllowed(address,bool) is missing from the deployment artifact ABI.');
  }

  if (!isValidNonZeroEvmAddress(targetWalletAddress)) {
    throw new Error('Target wallet address must be a valid non-zero EVM address.');
  }

  return encodeFunctionData({
    abi,
    functionName: 'setWalletAllowed',
    args: [targetWalletAddress, true],
  });
}

function validateBeforeProviderRead(input: SepoliaWalletWhitelistOperationInput): WalletWhitelistOperationState | undefined {
  if (!input.provider) {
    return blocked(input.attemptId, 'provider_unavailable', 'No EIP-1193 wallet provider is available.');
  }

  if (isWalletWhitelistOperationInFlight(input.currentOperationState)) {
    return blocked(input.attemptId, 'duplicate_attempt', 'A Wallet Whitelist operation is already awaiting confirmation or receipt.');
  }

  if (!input.connectedWalletAddress) {
    return blocked(input.attemptId, 'wallet_not_connected', 'Connect a user wallet before whitelisting a wallet.');
  }

  if (
    input.deploymentEvidence.status !== 'confirmed' ||
    input.deploymentEvidence.evidenceStrength !== 'confirmed_receipt' ||
    input.deploymentEvidence.contractAddressSource !== 'receipt_returned'
  ) {
    return blocked(input.attemptId, 'deployment_evidence_missing', 'Confirmed receipt-derived deployment evidence is required before wallet whitelist.');
  }

  if (!input.deploymentEvidence.contractAddress) {
    return blocked(input.attemptId, 'contract_address_missing', 'Receipt-returned contract address is required before wallet whitelist.');
  }

  if (!isValidNonZeroEvmAddress(input.deploymentEvidence.contractAddress)) {
    return blocked(input.attemptId, 'contract_address_invalid', 'Receipt-returned contract address must be a valid non-zero EVM address.');
  }

  if (!hasSetWalletAllowedFunction(input.contractAbi)) {
    return blocked(input.attemptId, 'abi_function_missing', 'setWalletAllowed(address,bool) is missing from the deployment artifact ABI.');
  }

  const targetWalletAddress = normalizeWalletWhitelistTargetAddress(input.targetWalletAddress);
  if (!targetWalletAddress) {
    return blocked(input.attemptId, 'target_wallet_missing', 'Target wallet address is required.');
  }

  if (!isValidNonZeroEvmAddress(targetWalletAddress)) {
    return blocked(input.attemptId, 'target_wallet_invalid', 'Target wallet address must be a valid non-zero EVM address.');
  }

  return undefined;
}

function decodeWalletWhitelistedEvent(
  abi: Abi,
  receipt: WalletWhitelistOperationReceipt,
  contractAddress: string,
  targetWalletAddress: string,
): WalletWhitelistDecodedEvent | undefined {
  const logs = receipt.logs ?? [];

  for (const log of logs) {
    if (!log.data || !log.topics?.length) continue;
    if (log.address && normalizeAddress(log.address) !== normalizeAddress(contractAddress)) continue;

    try {
      const decoded = decodeEventLog({
        abi,
        eventName: 'WalletWhitelisted',
        data: log.data as Hex,
        topics: log.topics as [Hex, ...Hex[]],
      });

      const args = decoded.args as {
        wallet?: string;
        allowed?: boolean;
        operator?: string;
      };

      if (args.wallet && normalizeAddress(args.wallet) === normalizeAddress(targetWalletAddress) && args.allowed === true) {
        return {
          eventName: 'WalletWhitelisted',
          wallet: args.wallet,
          allowed: true,
          operator: args.operator,
        };
      }
    } catch {
      // Other logs in the receipt may not be WalletWhitelisted.
    }
  }

  return undefined;
}

export async function requestWalletSignedWhitelistOperation(
  input: SepoliaWalletWhitelistOperationInput,
): Promise<WalletWhitelistOperationState> {
  const earlyBlock = validateBeforeProviderRead(input);
  if (earlyBlock) {
    emit(input, earlyBlock);
    return earlyBlock;
  }

  const provider = input.provider;
  const targetWalletAddress = normalizeWalletWhitelistTargetAddress(input.targetWalletAddress);
  if (!provider) {
    const nextState = blocked(input.attemptId, 'provider_unavailable', 'No EIP-1193 wallet provider is available.');
    emit(input, nextState);
    return nextState;
  }
  if (!targetWalletAddress) {
    const nextState = blocked(input.attemptId, 'target_wallet_missing', 'Target wallet address is required.');
    emit(input, nextState);
    return nextState;
  }

  const accounts = toStringArray(await provider.request({ method: 'eth_accounts' }));
  const selectedAccount = accounts[0];
  const chainId = toChainId(await provider.request({ method: 'eth_chainId' }));
  const selectedWallet = normalizeAddress(selectedAccount);
  const connectedWallet = normalizeAddress(input.connectedWalletAddress);
  const contractAddress = input.deploymentEvidence.contractAddress;

  if (!selectedAccount) {
    const nextState = blocked(input.attemptId, 'wallet_not_connected', 'No selected wallet account is available.');
    emit(input, nextState);
    return nextState;
  }

  if (selectedWallet !== connectedWallet) {
    const nextState = blocked(input.attemptId, 'account_changed', 'Selected wallet account changed before Wallet Whitelist.');
    emit(input, nextState);
    return nextState;
  }

  if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
    const nextState = blocked(input.attemptId, 'wrong_chain', 'Wrong chain: switch to Sepolia in your wallet.');
    emit(input, nextState);
    return nextState;
  }

  if (!isValidNonZeroEvmAddress(contractAddress)) {
    const nextState = blocked(input.attemptId, 'contract_address_invalid', 'Receipt-returned contract address must be a valid non-zero EVM address.');
    emit(input, nextState);
    return nextState;
  }

  if (!isValidNonZeroEvmAddress(targetWalletAddress)) {
    const nextState = blocked(input.attemptId, 'target_wallet_invalid', 'Target wallet address must be a valid non-zero EVM address.');
    emit(input, nextState);
    return nextState;
  }

  const data = createWalletWhitelistOperationData(input.contractAbi, targetWalletAddress);
  const awaitingState = state('awaiting_wallet_confirmation', input.attemptId, {
    contractAddress,
    targetWalletAddress,
    allowed: true,
    operationReceiptStatus: 'pending',
  });
  if (!emit(input, awaitingState)) return awaitingState;

  let operationTransactionHash: unknown;

  try {
    operationTransactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: selectedAccount,
          to: contractAddress,
          data,
          value: '0x0',
        },
      ],
    });
  } catch (error) {
    const nextState = state(providerRejected(error) ? 'rejected' : 'failed', input.attemptId, {
      contractAddress,
      targetWalletAddress,
      allowed: true,
      errorCode: providerRejected(error) ? 'provider_rejected' : 'provider_error',
      errorMessage: providerRejected(error)
        ? 'Wallet Whitelist rejected in wallet.'
        : 'Wallet provider could not submit Wallet Whitelist. Contract authorization is enforced on-chain.',
    });
    emit(input, nextState);
    return nextState;
  }

  if (!isHexValue(operationTransactionHash)) {
    const nextState = state('failed', input.attemptId, {
      contractAddress,
      targetWalletAddress,
      allowed: true,
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider did not return a whitelist transaction hash.',
    });
    emit(input, nextState);
    return nextState;
  }

  const submittedState = state('submitted', input.attemptId, {
    contractAddress,
    targetWalletAddress,
    allowed: true,
    operationTransactionHash,
    operationReceiptStatus: 'pending',
  });
  if (!emit(input, submittedState)) return submittedState;

  try {
    const receipt = await waitForReceipt(provider, operationTransactionHash, input);

    if (!receipt) return submittedState;

    if (receipt.status === '0x0') {
      const nextState = state('failed', input.attemptId, {
        contractAddress,
        targetWalletAddress,
        allowed: true,
        operationTransactionHash,
        operationReceiptStatus: 'failed',
        errorCode: 'receipt_failed',
        errorMessage: 'Sepolia Wallet Whitelist receipt reported failure. Contract authorization is enforced on-chain.',
      });
      emit(input, nextState);
      return nextState;
    }

    if (receipt.status === '0x1') {
      const decodedEvent = decodeWalletWhitelistedEvent(input.contractAbi, receipt, contractAddress, targetWalletAddress);
      const nextState = state('confirmed', input.attemptId, {
        contractAddress,
        targetWalletAddress,
        allowed: true,
        operationTransactionHash,
        operationReceiptStatus: 'success',
        decodedEvent,
      });
      emit(input, nextState);
      return nextState;
    }

    return submittedState;
  } catch {
    const nextState = state('failed', input.attemptId, {
      contractAddress,
      targetWalletAddress,
      allowed: true,
      operationTransactionHash,
      operationReceiptStatus: 'pending',
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider could not read the Wallet Whitelist receipt.',
    });
    emit(input, nextState);
    return nextState;
  }
}
