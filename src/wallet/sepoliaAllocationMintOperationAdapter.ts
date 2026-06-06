import { decodeEventLog, encodeFunctionData, parseUnits, type Abi, type Hex } from 'viem';
import type { AllocationMintReadModel } from '../domain/lifecycleState';
import type { DeploymentEvidenceReadModel } from '../domain/deploymentEvidenceReadModel';
import { isValidNonZeroEvmAddress } from '../domain/recordNavOperationReadModel';
import { SEPOLIA_CHAIN_ID_HEX } from '../domain/walletConnectionReadModel';
import {
  isWalletAllocationMintOperationInFlight,
  type WalletAllocationMintDecodedEvent,
  type WalletAllocationMintOperationState,
  type WalletAllocationMintOperationStatus,
} from '../domain/walletAllocationMintOperationReadModel';

export type SepoliaAllocationMintOperationRequestArguments =
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

export type SepoliaAllocationMintOperationProvider = {
  request(args: SepoliaAllocationMintOperationRequestArguments): Promise<unknown>;
};

export type AllocationMintOperationReceipt = {
  status?: string;
  logs?: Array<{
    address?: string;
    data?: string;
    topics?: string[];
  }>;
};

export type AllocationMintOperationPollOptions = {
  maxAttempts?: number;
  intervalMs?: number;
  wait?: (ms: number) => Promise<void>;
};

export type SepoliaAllocationMintOperationInput = {
  provider?: SepoliaAllocationMintOperationProvider;
  connectedWalletAddress?: string;
  deploymentEvidence: DeploymentEvidenceReadModel;
  contractAbi: Abi;
  allocationMint: AllocationMintReadModel;
  selectedInvestorWhitelisted: boolean;
  currentOperationState: WalletAllocationMintOperationState;
  attemptId: string;
  tokenDecimals?: number;
  pollOptions?: AllocationMintOperationPollOptions;
  shouldContinue?: (attemptId: string) => boolean;
  onStateChange?: (state: WalletAllocationMintOperationState) => void;
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
  operationStatus: Exclude<WalletAllocationMintOperationStatus, 'ready'>,
  attemptId: string,
  overrides: Omit<Partial<WalletAllocationMintOperationState>, 'operationStatus' | 'attemptId' | 'localSessionOnly'> = {},
): WalletAllocationMintOperationState {
  return {
    operationStatus,
    attemptId,
    localSessionOnly: true,
    ...overrides,
  };
}

function blocked(
  attemptId: string,
  errorCode: WalletAllocationMintOperationState['errorCode'],
  errorMessage: string,
): WalletAllocationMintOperationState {
  return state('blocked', attemptId, { errorCode, errorMessage });
}

function emit(
  input: Pick<SepoliaAllocationMintOperationInput, 'attemptId' | 'shouldContinue' | 'onStateChange'>,
  nextState: WalletAllocationMintOperationState,
) {
  if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return false;
  input.onStateChange?.(nextState);
  return true;
}

async function waitForReceipt(
  provider: SepoliaAllocationMintOperationProvider,
  transactionHash: string,
  input: Pick<SepoliaAllocationMintOperationInput, 'attemptId' | 'shouldContinue' | 'pollOptions'>,
): Promise<AllocationMintOperationReceipt | null> {
  const maxAttempts = input.pollOptions?.maxAttempts ?? 8;
  const intervalMs = input.pollOptions?.intervalMs ?? 1_500;
  const wait = input.pollOptions?.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (input.shouldContinue && !input.shouldContinue(input.attemptId)) return null;

    const receipt = await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [transactionHash],
    });

    if (receipt && typeof receipt === 'object') return receipt as AllocationMintOperationReceipt;

    if (attempt < maxAttempts - 1) await wait(intervalMs);
  }

  return null;
}

export function hasMintAllocationFunction(abi: Abi): boolean {
  return abi.some(
    (entry) =>
      entry.type === 'function' &&
      entry.name === 'mintAllocation' &&
      entry.stateMutability === 'nonpayable' &&
      entry.inputs?.length === 2 &&
      entry.inputs[0]?.type === 'address' &&
      entry.inputs[1]?.type === 'uint256',
  );
}

export function parseAllocationMintTokenAmountUnits(tokenAmount: string | undefined, tokenDecimals = 18): bigint {
  if (!tokenAmount?.trim()) throw new Error('Token allocation amount must be greater than zero.');

  const parsed = parseUnits(tokenAmount.trim(), tokenDecimals);
  if (parsed <= 0n) throw new Error('Token allocation amount must be greater than zero.');
  return parsed;
}

export function createAllocationMintOperationData(
  abi: Abi,
  targetWalletAddress: string,
  tokenAmount: string,
  tokenDecimals = 18,
): { data: Hex; tokenAmountUnits: bigint } {
  if (!hasMintAllocationFunction(abi)) {
    throw new Error('mintAllocation(address,uint256) is missing from the deployment artifact ABI.');
  }

  if (!isValidNonZeroEvmAddress(targetWalletAddress)) {
    throw new Error('Allocation target wallet must be a valid non-zero EVM address.');
  }

  const tokenAmountUnits = parseAllocationMintTokenAmountUnits(tokenAmount, tokenDecimals);

  return {
    data: encodeFunctionData({
      abi,
      functionName: 'mintAllocation',
      args: [targetWalletAddress, tokenAmountUnits],
    }),
    tokenAmountUnits,
  };
}

function validateBeforeProviderRead(input: SepoliaAllocationMintOperationInput): WalletAllocationMintOperationState | undefined {
  if (!input.provider) return blocked(input.attemptId, 'provider_unavailable', 'No EIP-1193 wallet provider is available.');

  if (isWalletAllocationMintOperationInFlight(input.currentOperationState)) {
    return blocked(input.attemptId, 'duplicate_attempt', 'An Allocation / Mint operation is already awaiting confirmation or receipt.');
  }

  if (!input.connectedWalletAddress) return blocked(input.attemptId, 'wallet_not_connected', 'Connect a user wallet before Allocation / Mint.');

  if (
    input.deploymentEvidence.status !== 'confirmed' ||
    input.deploymentEvidence.evidenceStrength !== 'confirmed_receipt' ||
    input.deploymentEvidence.contractAddressSource !== 'receipt_returned'
  ) {
    return blocked(input.attemptId, 'deployment_evidence_missing', 'Confirmed receipt-derived deployment evidence is required before Allocation / Mint.');
  }

  if (!input.deploymentEvidence.contractAddress) {
    return blocked(input.attemptId, 'contract_address_missing', 'Receipt-returned contract address is required before Allocation / Mint.');
  }

  if (!isValidNonZeroEvmAddress(input.deploymentEvidence.contractAddress)) {
    return blocked(input.attemptId, 'contract_address_invalid', 'Receipt-returned contract address must be a valid non-zero EVM address.');
  }

  if (!hasMintAllocationFunction(input.contractAbi)) {
    return blocked(input.attemptId, 'abi_function_missing', 'mintAllocation(address,uint256) is missing from the deployment artifact ABI.');
  }

  if (!input.allocationMint.canReviewAllocationMint) {
    return blocked(input.attemptId, 'allocation_not_ready', input.allocationMint.statusDetail);
  }

  if (!input.allocationMint.targetWalletAddress) return blocked(input.attemptId, 'target_wallet_missing', 'Target wallet address is required.');
  if (!isValidNonZeroEvmAddress(input.allocationMint.targetWalletAddress)) {
    return blocked(input.attemptId, 'target_wallet_invalid', 'Target wallet address must be a valid non-zero EVM address.');
  }
  if (!input.selectedInvestorWhitelisted) {
    return blocked(input.attemptId, 'target_wallet_not_whitelisted', 'Whitelist the selected investor wallet before Allocation / Mint.');
  }

  try {
    parseAllocationMintTokenAmountUnits(input.allocationMint.tokenAmount, input.tokenDecimals);
  } catch {
    return blocked(input.attemptId, 'token_amount_invalid', 'Token allocation amount must be greater than zero.');
  }

  return undefined;
}

function decodeAllocationMintedEvent(
  abi: Abi,
  receipt: AllocationMintOperationReceipt,
  contractAddress: string,
  targetWalletAddress: string,
  tokenAmountUnits: bigint,
): WalletAllocationMintDecodedEvent | undefined {
  const logs = receipt.logs ?? [];

  for (const log of logs) {
    if (!log.data || !log.topics?.length) continue;
    if (log.address && normalizeAddress(log.address) !== normalizeAddress(contractAddress)) continue;

    try {
      const decoded = decodeEventLog({
        abi,
        eventName: 'AllocationMinted',
        data: log.data as Hex,
        topics: log.topics as [Hex, ...Hex[]],
      });
      const args = decoded.args as {
        wallet?: string;
        amount?: bigint;
        operator?: string;
      };

      if (args.wallet && normalizeAddress(args.wallet) === normalizeAddress(targetWalletAddress) && args.amount === tokenAmountUnits) {
        return {
          eventName: 'AllocationMinted',
          wallet: args.wallet,
          amount: args.amount.toString(),
          operator: args.operator,
        };
      }
    } catch {
      // Other receipt logs may not be AllocationMinted.
    }
  }

  return undefined;
}

export async function requestWalletSignedAllocationMintOperation(
  input: SepoliaAllocationMintOperationInput,
): Promise<WalletAllocationMintOperationState> {
  const earlyBlock = validateBeforeProviderRead(input);
  if (earlyBlock) {
    emit(input, earlyBlock);
    return earlyBlock;
  }

  const provider = input.provider;
  const targetWalletAddress = input.allocationMint.targetWalletAddress;
  const tokenAmount = input.allocationMint.tokenAmount;
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
  if (!tokenAmount) {
    const nextState = blocked(input.attemptId, 'token_amount_invalid', 'Token allocation amount must be greater than zero.');
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
    const nextState = blocked(input.attemptId, 'account_changed', 'Selected wallet account changed before Allocation / Mint.');
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

  const { data, tokenAmountUnits } = createAllocationMintOperationData(input.contractAbi, targetWalletAddress, tokenAmount, input.tokenDecimals);
  const awaitingState = state('awaiting_wallet_confirmation', input.attemptId, {
    contractAddress,
    targetWalletAddress,
    tokenAmount,
    tokenAmountUnits: tokenAmountUnits.toString(),
    operationReceiptStatus: 'pending',
  });
  if (!emit(input, awaitingState)) return awaitingState;

  let operationTransactionHash: unknown;

  try {
    operationTransactionHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from: selectedAccount, to: contractAddress, data, value: '0x0' }],
    });
  } catch (error) {
    const nextState = state(providerRejected(error) ? 'rejected' : 'failed', input.attemptId, {
      contractAddress,
      targetWalletAddress,
      tokenAmount,
      tokenAmountUnits: tokenAmountUnits.toString(),
      errorCode: providerRejected(error) ? 'provider_rejected' : 'provider_error',
      errorMessage: providerRejected(error)
        ? 'Allocation / Mint rejected in wallet.'
        : 'Wallet provider could not submit Allocation / Mint. Contract authorization is enforced on-chain.',
    });
    emit(input, nextState);
    return nextState;
  }

  if (!isHexValue(operationTransactionHash)) {
    const nextState = state('failed', input.attemptId, {
      contractAddress,
      targetWalletAddress,
      tokenAmount,
      tokenAmountUnits: tokenAmountUnits.toString(),
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider did not return an Allocation / Mint transaction hash.',
    });
    emit(input, nextState);
    return nextState;
  }

  const submittedState = state('submitted', input.attemptId, {
    contractAddress,
    targetWalletAddress,
    tokenAmount,
    tokenAmountUnits: tokenAmountUnits.toString(),
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
        tokenAmount,
        tokenAmountUnits: tokenAmountUnits.toString(),
        operationTransactionHash,
        operationReceiptStatus: 'failed',
        errorCode: 'receipt_failed',
        errorMessage: 'Sepolia Allocation / Mint receipt reported failure. Contract authorization is enforced on-chain.',
      });
      emit(input, nextState);
      return nextState;
    }

    if (receipt.status === '0x1') {
      const decodedEvent = decodeAllocationMintedEvent(input.contractAbi, receipt, contractAddress, targetWalletAddress, tokenAmountUnits);
      const nextState = state('confirmed', input.attemptId, {
        contractAddress,
        targetWalletAddress,
        tokenAmount,
        tokenAmountUnits: tokenAmountUnits.toString(),
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
      tokenAmount,
      tokenAmountUnits: tokenAmountUnits.toString(),
      operationTransactionHash,
      operationReceiptStatus: 'pending',
      errorCode: 'provider_error',
      errorMessage: 'Wallet provider could not read the Allocation / Mint receipt.',
    });
    emit(input, nextState);
    return nextState;
  }
}
