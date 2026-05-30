import type { WalletConnectionReadModelInput, WalletProviderErrorStatus } from '../domain/walletConnectionReadModel';

export type Eip1193RequestArguments = {
  method: 'eth_accounts' | 'eth_requestAccounts' | 'eth_chainId';
  params?: readonly unknown[] | Record<string, unknown>;
};

export type Eip1193ProviderEvent = 'accountsChanged' | 'chainChanged';

export type Eip1193Provider = {
  request(args: Eip1193RequestArguments): Promise<unknown>;
  on?: (event: Eip1193ProviderEvent, handler: (payload: unknown) => void) => void;
  removeListener?: (event: Eip1193ProviderEvent, handler: (payload: unknown) => void) => void;
  isMetaMask?: boolean;
};

export type WalletConnectionSnapshot = WalletConnectionReadModelInput;

export type Eip1193WalletAdapter = {
  getSnapshot(): Promise<WalletConnectionSnapshot>;
  connect(): Promise<WalletConnectionSnapshot>;
  subscribe(onChange: (snapshot: WalletConnectionSnapshot) => void): () => void;
};

function normalizeProviderErrorStatus(error: unknown): WalletProviderErrorStatus {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string | number }).code;
    if (code === 4001 || code === '4001') return 'rejected';
  }

  return 'error';
}

function unsupportedSnapshot(): WalletConnectionSnapshot {
  return {
    providerStatus: 'unsupported',
    connectionStatus: 'not_connected',
  };
}

function errorSnapshot(error: unknown): WalletConnectionSnapshot {
  return {
    providerStatus: 'available',
    connectionStatus: 'not_connected',
    providerError: {
      code: typeof error === 'object' && error !== null && 'code' in error ? (error as { code?: string | number }).code : undefined,
      normalizedStatus: normalizeProviderErrorStatus(error),
    },
  };
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function toChainId(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value.toString() : undefined;
}

async function requestAccounts(provider: Eip1193Provider, requestType: 'eth_accounts' | 'eth_requestAccounts') {
  return toStringArray(await provider.request({ method: requestType }));
}

async function requestChainId(provider: Eip1193Provider) {
  return toChainId(await provider.request({ method: 'eth_chainId' }));
}

async function snapshotFromProvider(provider: Eip1193Provider, requestType: 'eth_accounts' | 'eth_requestAccounts') {
  try {
    const accounts = await requestAccounts(provider, requestType);
    const chainId = await requestChainId(provider);
    const connectedWalletAddress = accounts[0];

    return {
      providerStatus: 'available',
      connectionStatus: connectedWalletAddress ? 'connected' : 'not_connected',
      connectedWalletAddress,
      chainId,
    } satisfies WalletConnectionSnapshot;
  } catch (error) {
    return errorSnapshot(error);
  }
}

async function snapshotFromAccounts(provider: Eip1193Provider, accounts: string[]) {
  try {
    const chainId = await requestChainId(provider);
    const connectedWalletAddress = accounts[0];

    return {
      providerStatus: 'available',
      connectionStatus: connectedWalletAddress ? 'connected' : 'not_connected',
      connectedWalletAddress,
      chainId,
    } satisfies WalletConnectionSnapshot;
  } catch (error) {
    return errorSnapshot(error);
  }
}

export function createEip1193WalletAdapter(provider?: Eip1193Provider): Eip1193WalletAdapter {
  return {
    getSnapshot() {
      if (!provider) return Promise.resolve(unsupportedSnapshot());
      return snapshotFromProvider(provider, 'eth_accounts');
    },
    connect() {
      if (!provider) return Promise.resolve(unsupportedSnapshot());
      return snapshotFromProvider(provider, 'eth_requestAccounts');
    },
    subscribe(onChange) {
      if (!provider?.on || !provider.removeListener) return () => undefined;

      const handleAccountsChanged = (payload: unknown) => {
        void snapshotFromAccounts(provider, toStringArray(payload)).then(onChange);
      };
      const handleChainChanged = () => {
        void snapshotFromProvider(provider, 'eth_accounts').then(onChange);
      };

      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);

      return () => {
        provider.removeListener?.('accountsChanged', handleAccountsChanged);
        provider.removeListener?.('chainChanged', handleChainChanged);
      };
    },
  };
}
