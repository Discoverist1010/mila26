import { decodeEventLog, encodeFunctionData, type Abi, type Hex } from 'viem';
import type { DeploymentEvidenceReadModel } from '../domain/deploymentEvidenceReadModel';
import {
  defaultRecordNavOperationPayload,
  isRecordNavOperationInFlight,
  isValidNonZeroEvmAddress,
  type RecordNavDecodedEvent,
  type RecordNavOperationPayload,
  type RecordNavOperationState,
  type RecordNavOperationStatus,
} from '../domain/recordNavOperationReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../domain/walletConnectionReadModel';

export type SepoliaRecordNavOperationRequestArguments =
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

export type SepoliaRecordNavOperationProvider = {
  request(args: SepoliaRecordNavOperationRequestArguments): Promise<unknown>;
};

export type RecordNavOperationReceipt = {
  status?: string;
  logs?: Array<{
    address?: string;
    data?: string;
    topics?: string[];
  }>;
};

export type RecordNavOperationPollOptions = {
  maxAttempts?: number;
  intervalMs?: number;
  wait?: (ms: number) => Promise<void>;
};

export type SepoliaRecordNavOperationInput = {
  provider?: SepoliaRecordNavOperationProvider;
  connectedWalletAddress?: string;
  deploymentEvidence: DeploymentEvidenceReadModel;
  contractAbi: Abi;
  payload?: RecordNavOperationPayload;
  currentOperationState: RecordNavOperationState;
  attemptId: string;
  pollOptions?: RecordNavOperationPollOptions;
  shouldContinue?: (attemptId: string) => boolean;
  onStateChange?: (state: RecordNavOperationState) => void;
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
  operationStatus: RecordNavOperationStatus,
  attemptId: string,
  overrides: Omit<Partial<RecordNavOperationState>, 'operationStatus' | 'attemptId' | 'localSessionOnly'> = {},
): RecordNavOperationState {
  return {
    operationStatus,
    attemptId,
    localSessionOnly: true,
    ...overrides,
  };
}

function blocked(
  attemptId: string,
  errorCode: RecordNavOperationState['errorCode'],
  errorMessage: string,
): RecordNavOperationState {
  return state('blocked', attemptId, {
    errorCode,
    errorMessage,
  });
}

function emit(
  input: Pick<SepoliaRecordNavOperationInput, 'attemptId' | 'shouldContinue' | 'onStateChange'>,
  nextState: RecordNavOperationState,
) {
  if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return false;
  input.onStateChange?.(nextState);
  return true;
}

async function waitForReceipt(
  provider: SepoliaRecordNavOperationProvider,
  transactionHash: string,
  input: Pick<SepoliaRecordNavOperationInput, 'attemptId' | 'shouldContinue' | 'pollOptions'>,
): Promise<RecordNavOperationReceipt | null> {
  const maxAttempts = input.pollOptions?.maxAttempts ?? 8;
  const intervalMs = input.pollOptions?.intervalMs ?? 1_500;
  const wait = input.pollOptions?.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return null;

    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [transactionHash],
    });

    if (receipt && typeof receipt === 'object') return receipt as RecordNavOperationReceipt;

    if (attempt < maxAttempts - 1) await wait(intervalMs);
  }

  return null;
}

export function hasRecordValuationFunction(abi: Abi): boolean {
  return abi.some(
    (entry) =>
      entry.type === 'function' &&
      entry.name === 'recordValuation' &&
      entry.stateMutability === 'nonpayable' &&
      entry.inputs?.length === 2 &&
      entry.inputs[0]?.type === 'uint256' &&
      entry.inputs[1]?.type === 'string',
  );
}

export function createRecordNavOperationData(
  abi: Abi,
  payload: RecordNavOperationPayload = defaultRecordNavOperationPayload,
): Hex {
  if (!hasRecordValuationFunction(abi)) {
    throw new Error('recordValuation(uint256,string) is missing from the deployment artifact ABI.');
  }

  return encodeFunctionData({
    abi,
    functionName: 'recordValuation',
    args: [payload.valuation, payload.valuationReference],
  });
}

function validateBeforeProviderRead(input: SepoliaRecordNavOperationInput): RecordNavOperationState | undefined {
  if (!input.provider) {
    return blocked(input.attemptId, 'provider_unavailable', 'No EIP-1193 wallet provider is available.');
  }

  if (isRecordNavOperationInFlight(input.currentOperationState)) {
    return blocked(input.attemptId, 'duplicate_attempt', 'A Record NAV operation is already awaiting confirmation or receipt.');
  }

  if (!input.connectedWalletAddress) {
    return blocked(input.attemptId, 'wallet_not_connected', 'Connect a user wallet before recording NAV.');
  }

  if (
    input.deploymentEvidence.status !== 'confirmed' ||
    input.deploymentEvidence.evidenceStrength !== 'confirmed_receipt' ||
    input.deploymentEvidence.contractAddressSource !== 'receipt_returned'
  ) {
    return blocked(input.attemptId, 'deployment_evidence_missing', 'Confirmed receipt-derived deployment evidence is required before recording NAV.');
  }

  if (!input.deploymentEvidence.contractAddress) {
    return blocked(input.attemptId, 'contract_address_missing', 'Receipt-returned contract address is required before recording NAV.');
  }

  if (!isValidNonZeroEvmAddress(input.deploymentEvidence.contractAddress)) {
    return blocked(input.attemptId, 'contract_address_invalid', 'Receipt-returned contract address must be a valid non-zero EVM address.');
  }

  if (!hasRecordValuationFunction(input.contractAbi)) {
    return blocked(input.attemptId, 'abi_function_missing', 'recordValuation(uint256,string) is missing from the deployment artifact ABI.');
  }

  const payload = input.payload ?? defaultRecordNavOperationPayload;
  if (payload.valuation <= 0n || !payload.valuationReference.trim()) {
    return blocked(input.attemptId, 'operation_payload_missing', 'Record NAV operation payload is incomplete.');
  }

  return undefined;
}

function decodeValuationUpdatedEvent(
  abi: Abi,
  receipt: RecordNavOperationReceipt,
  contractAddress: string,
): RecordNavDecodedEvent | undefined {
  const logs = receipt.logs ?? [];

  for (const log of logs) {
    if (!log.data || !log.topics?.length) continue;
    if (log.address && normalizeAddress(log.address) !== normalizeAddress(contractAddress)) continue;

    try {
      const decoded = decodeEventLog({
        abi,
        eventName: 'ValuationUpdated',
        data: log.data as Hex,
        topics: log.topics as [Hex, ...Hex[]],
      });

      const args = decoded.args as {
        valuation?: bigint;
        valuationReference?: string;
        operator?: string;
      };

      if (args.valuation !== undefined && args.valuationReference) {
        return {
          eventName: 'ValuationUpdated',
          valuation: args.valuation.toString(),
          valuationReference: args.valuationReference,
          operator: args.operator,
        };
      }
    } catch {
      // Other logs in the receipt may not be ValuationUpdated.
    }
  }

  return undefined;
}

export async function requestWalletSignedRecordNavOperation(
  input: SepoliaRecordNavOperationInput,
): Promise<RecordNavOperationState> {
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
  const selectedWallet = normalizeAddress(selectedAccount);
  const connectedWallet = normalizeAddress(input.connectedWalletAddress);
  const contractAddress = input.deploymentEvidence.contractAddress;

  if (!selectedAccount) {
    const nextState = blocked(input.attemptId, 'wallet_not_connected', 'No selected wallet account is available.');
    emit(input, nextState);
    return nextState;
  }

  if (selectedWallet !== connectedWallet) {
    const nextState = blocked(input.attemptId, 'account_changed', 'Selected wallet account changed before Record NAV.');
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

  const payload = input.payload ?? defaultRecordNavOperationPayload;
  const data = createRecordNavOperationData(input.contractAbi, payload);
  const awaitingState = state('awaiting_wallet_confirmation', input.attemptId, {
    contractAddress,
    operationReceiptStatus: 'pending',
    valuation: payload.valuation,
    valuationReference: payload.valuationReference,
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
      valuation: payload.valuation,
      valuationReference: payload.valuationReference,
      errorCode: providerRejected(error) ? 'provider_rejected' : 'provider_error',
      errorMessage: providerRejected(error) ? 'Record NAV rejected in wallet.' : 'Wallet provider could not submit Record NAV.',
    });
    emit(input, nextState);
    return nextState;
  }

  if (!isHexValue(operationTransactionHash)) {
    const nextState = state('failed', input.attemptId, {
      contractAddress,
      valuation: payload.valuation,
      valuationReference: payload.valuationReference,
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider did not return an operation transaction hash.',
    });
    emit(input, nextState);
    return nextState;
  }

  const submittedState = state('submitted', input.attemptId, {
    contractAddress,
    operationTransactionHash,
    operationReceiptStatus: 'pending',
    valuation: payload.valuation,
    valuationReference: payload.valuationReference,
  });
  if (!emit(input, submittedState)) return submittedState;

  try {
    const receipt = await waitForReceipt(provider, operationTransactionHash, input);

    if (!receipt) return submittedState;

    if (receipt.status === '0x0') {
      const nextState = state('failed', input.attemptId, {
        contractAddress,
        operationTransactionHash,
        operationReceiptStatus: 'failed',
        valuation: payload.valuation,
        valuationReference: payload.valuationReference,
        errorCode: 'receipt_failed',
        errorMessage: 'Sepolia Record NAV receipt reported failure.',
      });
      emit(input, nextState);
      return nextState;
    }

    if (receipt.status === '0x1') {
      const decodedEvent = decodeValuationUpdatedEvent(input.contractAbi, receipt, contractAddress);
      const nextState = state('confirmed', input.attemptId, {
        contractAddress,
        operationTransactionHash,
        operationReceiptStatus: 'success',
        valuation: payload.valuation,
        valuationReference: payload.valuationReference,
        decodedEvent,
      });
      emit(input, nextState);
      return nextState;
    }

    return submittedState;
  } catch {
    const nextState = state('failed', input.attemptId, {
      contractAddress,
      operationTransactionHash,
      operationReceiptStatus: 'pending',
      valuation: payload.valuation,
      valuationReference: payload.valuationReference,
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider could not read the Record NAV receipt.',
    });
    emit(input, nextState);
    return nextState;
  }
}
