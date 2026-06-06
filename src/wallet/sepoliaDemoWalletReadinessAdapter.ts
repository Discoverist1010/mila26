import { SEPOLIA_CHAIN_ID_HEX } from '../domain/walletConnectionReadModel';
import {
  initialSepoliaDemoWalletReadinessState,
  signerHasMinimumDemoBalance,
  type SepoliaDemoWalletReadinessState,
} from '../domain/sepoliaDemoWalletReadiness';

export type SepoliaDemoWalletReadinessRequestArguments =
  | { method: 'eth_accounts'; params?: readonly unknown[] | Record<string, unknown> }
  | { method: 'eth_chainId'; params?: readonly unknown[] | Record<string, unknown> }
  | { method: 'eth_getBalance'; params: [string, 'latest'] };

export type SepoliaDemoWalletReadinessProvider = {
  request(args: SepoliaDemoWalletReadinessRequestArguments): Promise<unknown>;
};

export type SepoliaDemoWalletReadinessInput = {
  provider?: SepoliaDemoWalletReadinessProvider;
  connectedWalletAddress?: string;
};

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function toChainId(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value.toString().toLowerCase() : undefined;
}

function normalizeAddress(address?: string): string | undefined {
  return address?.toLowerCase();
}

function parseHexBalance(value: unknown): string | undefined {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]+$/.test(value)) return undefined;
  return BigInt(value).toString();
}

export async function checkSepoliaDemoWalletReadiness(
  input: SepoliaDemoWalletReadinessInput,
): Promise<SepoliaDemoWalletReadinessState> {
  if (!input.provider) {
    return {
      ...initialSepoliaDemoWalletReadinessState,
      checkStatus: 'blocked',
      errorMessage: 'No EIP-1193 wallet provider is available.',
    };
  }

  if (!input.connectedWalletAddress) {
    return {
      ...initialSepoliaDemoWalletReadinessState,
      checkStatus: 'blocked',
      errorMessage: 'Connect a Sepolia wallet before checking readiness.',
    };
  }

  try {
    const accounts = toStringArray(await input.provider.request({ method: 'eth_accounts' }));
    const selectedAccount = accounts[0];
    const chainId = toChainId(await input.provider.request({ method: 'eth_chainId' }));

    if (!selectedAccount) {
      return {
        ...initialSepoliaDemoWalletReadinessState,
        checkStatus: 'blocked',
        errorMessage: 'No selected wallet account is available.',
      };
    }

    if (normalizeAddress(selectedAccount) !== normalizeAddress(input.connectedWalletAddress)) {
      return {
        ...initialSepoliaDemoWalletReadinessState,
        checkStatus: 'blocked',
        checkedWalletAddress: selectedAccount,
        errorMessage: 'Selected wallet account changed before readiness check.',
      };
    }

    if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
      return {
        ...initialSepoliaDemoWalletReadinessState,
        checkStatus: 'blocked',
        checkedWalletAddress: selectedAccount,
        errorMessage: 'Wrong chain: switch to Sepolia in your wallet.',
      };
    }

    const signerBalanceWei = parseHexBalance(
      await input.provider.request({ method: 'eth_getBalance', params: [selectedAccount, 'latest'] }),
    );

    if (!signerBalanceWei) {
      return {
        ...initialSepoliaDemoWalletReadinessState,
        checkStatus: 'failed',
        checkedWalletAddress: selectedAccount,
        errorMessage: 'Wallet provider did not return a readable Sepolia ETH balance.',
      };
    }

    return {
      checkStatus: signerHasMinimumDemoBalance(signerBalanceWei) ? 'ready' : 'needs_funding',
      checkedWalletAddress: selectedAccount,
      signerBalanceWei,
      localSessionOnly: true,
    };
  } catch {
    return {
      ...initialSepoliaDemoWalletReadinessState,
      checkStatus: 'failed',
      errorMessage: 'Wallet provider could not complete the Sepolia readiness check.',
    };
  }
}
