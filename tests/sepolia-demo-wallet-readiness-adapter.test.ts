import { describe, expect, it } from 'vitest';
import { SEPOLIA_CHAIN_ID_HEX } from '../src/domain/walletConnectionReadModel';
import {
  checkSepoliaDemoWalletReadiness,
  type SepoliaDemoWalletReadinessProvider,
  type SepoliaDemoWalletReadinessRequestArguments,
} from '../src/wallet/sepoliaDemoWalletReadinessAdapter';

const connectedWallet = '0x1111111111111111111111111111111111111111';
const changedWallet = '0x2222222222222222222222222222222222222222';

function createMockReadinessProvider(options: {
  accounts?: string[];
  chainId?: string;
  balance?: string;
} = {}) {
  const calls: SepoliaDemoWalletReadinessRequestArguments[] = [];
  const provider: SepoliaDemoWalletReadinessProvider = {
    async request(args) {
      calls.push(args);

      if (args.method === 'eth_accounts') return options.accounts ?? [connectedWallet];
      if (args.method === 'eth_chainId') return options.chainId ?? SEPOLIA_CHAIN_ID_HEX;
      if (args.method === 'eth_getBalance') return options.balance ?? '0x38d7ea4c68000';

      throw new Error('Unexpected provider method');
    },
  };

  return { provider, calls };
}

describe('Sepolia demo wallet readiness adapter', () => {
  it('blocks when provider, wallet, account, or chain prerequisites are missing', async () => {
    await expect(checkSepoliaDemoWalletReadiness({ provider: undefined, connectedWalletAddress: connectedWallet })).resolves.toMatchObject({
      checkStatus: 'blocked',
      errorMessage: 'No EIP-1193 wallet provider is available.',
    });

    await expect(checkSepoliaDemoWalletReadiness({ provider: createMockReadinessProvider().provider })).resolves.toMatchObject({
      checkStatus: 'blocked',
      errorMessage: 'Connect a Sepolia wallet before checking readiness.',
    });

    await expect(
      checkSepoliaDemoWalletReadiness({
        provider: createMockReadinessProvider({ accounts: [changedWallet] }).provider,
        connectedWalletAddress: connectedWallet,
      }),
    ).resolves.toMatchObject({
      checkStatus: 'blocked',
      checkedWalletAddress: changedWallet,
      errorMessage: 'Selected wallet account changed before readiness check.',
    });

    await expect(
      checkSepoliaDemoWalletReadiness({
        provider: createMockReadinessProvider({ chainId: '0x1' }).provider,
        connectedWalletAddress: connectedWallet,
      }),
    ).resolves.toMatchObject({
      checkStatus: 'blocked',
      checkedWalletAddress: connectedWallet,
      errorMessage: 'Wrong chain: switch to Sepolia in your wallet.',
    });
  });

  it('reports ready or needs funding from the selected signer balance', async () => {
    const ready = createMockReadinessProvider({ balance: '0x38d7ea4c68000' });
    await expect(
      checkSepoliaDemoWalletReadiness({ provider: ready.provider, connectedWalletAddress: connectedWallet }),
    ).resolves.toMatchObject({
      checkStatus: 'ready',
      checkedWalletAddress: connectedWallet,
      signerBalanceWei: '1000000000000000',
      localSessionOnly: true,
    });
    expect(ready.calls.map((call) => call.method)).toEqual(['eth_accounts', 'eth_chainId', 'eth_getBalance']);

    await expect(
      checkSepoliaDemoWalletReadiness({
        provider: createMockReadinessProvider({ balance: '0x1' }).provider,
        connectedWalletAddress: connectedWallet,
      }),
    ).resolves.toMatchObject({
      checkStatus: 'needs_funding',
      signerBalanceWei: '1',
    });
  });
});
