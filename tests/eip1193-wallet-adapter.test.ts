import { describe, expect, it } from 'vitest';
import { SEPOLIA_CHAIN_ID_HEX, toWalletConnectionReadModel } from '../src/domain/walletConnectionReadModel';
import { getBrowserEthereumProvider } from '../src/wallet/browserEthereumProvider';
import {
  createEip1193WalletAdapter,
  type Eip1193Provider,
  type Eip1193ProviderEvent,
  type Eip1193RequestArguments,
} from '../src/wallet/eip1193WalletAdapter';

const connectedAccount = '0x1111111111111111111111111111111111111111';

type ProviderHandler = (payload: unknown) => void;

function createMockProvider(options: {
  accounts?: string[];
  chainId?: string;
  rejectRequestAccounts?: boolean;
  throwOnRequest?: boolean;
} = {}) {
  const calls: string[] = [];
  const handlers = new Map<Eip1193ProviderEvent, Set<ProviderHandler>>();
  let accounts = options.accounts ?? [];
  let chainId = options.chainId ?? SEPOLIA_CHAIN_ID_HEX;

  const provider: Eip1193Provider = {
    async request(args: Eip1193RequestArguments) {
      calls.push(args.method);

      if (options.throwOnRequest) {
        throw Object.assign(new Error('Provider failed'), { code: 'UNKNOWN_PROVIDER_FAILURE' });
      }

      if (args.method === 'eth_accounts') return accounts;
      if (args.method === 'eth_chainId') return chainId;
      if (args.method === 'eth_requestAccounts') {
        if (options.rejectRequestAccounts) {
          throw Object.assign(new Error('User rejected request'), { code: 4001 });
        }
        return accounts;
      }

      throw new Error(`Unexpected request method: ${args.method}`);
    },
    on(event, handler) {
      const eventHandlers = handlers.get(event) ?? new Set<ProviderHandler>();
      eventHandlers.add(handler);
      handlers.set(event, eventHandlers);
    },
    removeListener(event, handler) {
      handlers.get(event)?.delete(handler);
    },
  };

  return {
    provider,
    calls,
    setAccounts(nextAccounts: string[]) {
      accounts = nextAccounts;
      handlers.get('accountsChanged')?.forEach((handler) => handler(nextAccounts));
    },
    setChainId(nextChainId: string) {
      chainId = nextChainId;
      handlers.get('chainChanged')?.forEach((handler) => handler(nextChainId));
    },
    listenerCount(event: Eip1193ProviderEvent) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

function flushAdapterUpdates() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('EIP-1193 Wallet Adapter', () => {
  it('returns unsupported when no provider is available', async () => {
    const adapter = createEip1193WalletAdapter();
    const snapshot = await adapter.getSnapshot();

    expect(snapshot).toEqual({
      providerStatus: 'unsupported',
      connectionStatus: 'not_connected',
    });
    expect(toWalletConnectionReadModel(snapshot).walletConnectionStatus).toBe('unsupported');
  });

  it('detects a browser ethereum provider from an injected host', () => {
    const { provider } = createMockProvider();

    expect(getBrowserEthereumProvider({ ethereum: provider })).toBe(provider);
    expect(getBrowserEthereumProvider({})).toBeUndefined();
  });

  it('returns not connected when provider exists but no account is exposed', async () => {
    const { provider } = createMockProvider({ accounts: [] });
    const snapshot = await createEip1193WalletAdapter(provider).getSnapshot();

    expect(snapshot.providerStatus).toBe('available');
    expect(snapshot.connectionStatus).toBe('not_connected');
    expect(snapshot.connectedWalletAddress).toBeUndefined();
  });

  it('requests accounts and returns the connected provider result', async () => {
    const { provider, calls } = createMockProvider({ accounts: [connectedAccount] });
    const snapshot = await createEip1193WalletAdapter(provider).connect();

    expect(calls).toEqual(['eth_requestAccounts', 'eth_chainId']);
    expect(snapshot).toEqual({
      providerStatus: 'available',
      connectionStatus: 'connected',
      connectedWalletAddress: connectedAccount,
      chainId: SEPOLIA_CHAIN_ID_HEX,
    });
  });

  it('maps connected account and Sepolia chain into connected/Sepolia read-model state', async () => {
    const { provider } = createMockProvider({ accounts: [connectedAccount], chainId: SEPOLIA_CHAIN_ID_HEX });
    const snapshot = await createEip1193WalletAdapter(provider).connect();
    const readModel = toWalletConnectionReadModel(snapshot);

    expect(readModel.walletConnectionStatus).toBe('connected');
    expect(readModel.walletConnectionReadiness).toBe('review_ready');
    expect(readModel.chainStatus).toBe('sepolia');
    expect(readModel.walletExecutionStatus).toBe('not_implemented');
  });

  it('maps connected account and non-Sepolia chain into wrong-chain read-model state', async () => {
    const { provider } = createMockProvider({ accounts: [connectedAccount], chainId: '0x1' });
    const snapshot = await createEip1193WalletAdapter(provider).connect();
    const readModel = toWalletConnectionReadModel(snapshot);

    expect(readModel.walletConnectionStatus).toBe('wrong_chain');
    expect(readModel.walletConnectionReadiness).toBe('blocked');
    expect(readModel.chainStatus).toBe('wrong_chain');
  });

  it('normalizes user rejection into MILA26 rejected status without exposing vendor text', async () => {
    const { provider } = createMockProvider({ accounts: [connectedAccount], rejectRequestAccounts: true });
    const snapshot = await createEip1193WalletAdapter(provider).connect();
    const readModel = toWalletConnectionReadModel(snapshot);

    expect(snapshot.providerError?.normalizedStatus).toBe('rejected');
    expect(readModel.walletConnectionStatus).toBe('rejected');
    expect(JSON.stringify(snapshot)).not.toMatch(/User rejected request/);
  });

  it('normalizes provider failures into MILA26 error status', async () => {
    const { provider } = createMockProvider({ throwOnRequest: true });
    const snapshot = await createEip1193WalletAdapter(provider).connect();
    const readModel = toWalletConnectionReadModel(snapshot);

    expect(snapshot.providerError?.normalizedStatus).toBe('error');
    expect(readModel.walletConnectionStatus).toBe('error');
  });

  it('updates account state from accountsChanged events', async () => {
    const { provider, setAccounts } = createMockProvider({ accounts: [connectedAccount] });
    const adapter = createEip1193WalletAdapter(provider);
    const snapshots: unknown[] = [];

    adapter.subscribe((snapshot) => snapshots.push(snapshot));
    setAccounts(['0x2222222222222222222222222222222222222222']);
    await flushAdapterUpdates();

    expect(snapshots.at(-1)).toEqual({
      providerStatus: 'available',
      connectionStatus: 'connected',
      connectedWalletAddress: '0x2222222222222222222222222222222222222222',
      chainId: SEPOLIA_CHAIN_ID_HEX,
    });
  });

  it('resets account state from empty accountsChanged events', async () => {
    const { provider, setAccounts } = createMockProvider({ accounts: [connectedAccount] });
    const adapter = createEip1193WalletAdapter(provider);
    const snapshots: unknown[] = [];

    adapter.subscribe((snapshot) => snapshots.push(snapshot));
    setAccounts([]);
    await flushAdapterUpdates();

    expect(snapshots.at(-1)).toEqual({
      providerStatus: 'available',
      connectionStatus: 'not_connected',
      connectedWalletAddress: undefined,
      chainId: SEPOLIA_CHAIN_ID_HEX,
    });
  });

  it('updates chain state from chainChanged events', async () => {
    const { provider, setChainId } = createMockProvider({ accounts: [connectedAccount] });
    const adapter = createEip1193WalletAdapter(provider);
    const snapshots: unknown[] = [];

    adapter.subscribe((snapshot) => snapshots.push(snapshot));
    setChainId('0x1');
    await flushAdapterUpdates();

    const readModels = snapshots.map((snapshot) => toWalletConnectionReadModel(snapshot as Parameters<typeof toWalletConnectionReadModel>[0]));
    expect(readModels.some((model) => model.walletConnectionStatus === 'wrong_chain')).toBe(true);
  });

  it('cleans up provider event listeners', () => {
    const { provider, listenerCount } = createMockProvider({ accounts: [connectedAccount] });
    const adapter = createEip1193WalletAdapter(provider);

    const cleanup = adapter.subscribe(() => undefined);

    expect(listenerCount('accountsChanged')).toBe(1);
    expect(listenerCount('chainChanged')).toBe(1);

    cleanup();

    expect(listenerCount('accountsChanged')).toBe(0);
    expect(listenerCount('chainChanged')).toBe(0);
  });

  it('never calls signing, deployment, transaction, or chain-switch methods', async () => {
    const { provider, calls } = createMockProvider({ accounts: [connectedAccount] });
    const adapter = createEip1193WalletAdapter(provider);

    await adapter.getSnapshot();
    await adapter.connect();

    expect(calls).not.toContain('eth_sendTransaction');
    expect(calls).not.toContain('personal_sign');
    expect(calls).not.toContain('eth_sign');
    expect(calls).not.toContain('eth_signTypedData');
    expect(calls).not.toContain('wallet_switchEthereumChain');
    expect(calls).not.toContain('wallet_addEthereumChain');
  });
});
