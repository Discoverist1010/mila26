import { describe, expect, it } from 'vitest';
import {
  SEPOLIA_CHAIN_ID_DECIMAL,
  SEPOLIA_CHAIN_ID_HEX,
  normalizeWalletProviderError,
  toWalletConnectionReadModel,
  type WalletConnectionReadModelInput,
} from '../src/domain/walletConnectionReadModel';

const connectedSepoliaInput: WalletConnectionReadModelInput = {
  providerStatus: 'available',
  connectionStatus: 'connected',
  chainId: SEPOLIA_CHAIN_ID_HEX,
  connectedWalletAddress: '0x1111111111111111111111111111111111111111',
};

function walletConnection(overrides: Partial<WalletConnectionReadModelInput> = {}) {
  return toWalletConnectionReadModel({
    ...connectedSepoliaInput,
    ...overrides,
  });
}

describe('Wallet Connection Read Model', () => {
  it('marks missing browser provider as unsupported and blocked without a wallet address', () => {
    const model = walletConnection({
      providerStatus: 'unsupported',
      connectionStatus: 'not_connected',
      chainId: undefined,
      connectedWalletAddress: undefined,
    });

    expect(model.provider).toEqual({
      targetWallet: 'metamask',
      providerStandard: 'eip1193',
      providerStatus: 'unsupported',
    });
    expect(model.walletConnectionStatus).toBe('unsupported');
    expect(model.walletConnectionReadiness).toBe('blocked');
    expect(model.walletExecutionStatus).toBe('blocked');
    expect(model.chainStatus).toBe('unknown');
    expect(model.connectedWalletAddress).toBeUndefined();
    expect(model.blockedReasons).toContain('MetaMask or another EIP-1193 browser wallet provider is not detected.');
  });

  it('keeps not-connected and connecting states blocked without a wallet address', () => {
    const notConnected = walletConnection({
      connectionStatus: 'not_connected',
      chainId: undefined,
      connectedWalletAddress: undefined,
    });
    const connecting = walletConnection({
      connectionStatus: 'connecting',
      chainId: undefined,
      connectedWalletAddress: undefined,
    });

    expect(notConnected.walletConnectionStatus).toBe('not_connected');
    expect(connecting.walletConnectionStatus).toBe('connecting');
    expect(notConnected.walletConnectionReadiness).toBe('blocked');
    expect(connecting.walletConnectionReadiness).toBe('blocked');
    expect(notConnected.connectedWalletAddress).toBeUndefined();
    expect(connecting.connectedWalletAddress).toBeUndefined();
  });

  it('normalizes rejected provider state without depending on vendor error strings', () => {
    const rejectedByCode = walletConnection({
      connectionStatus: 'not_connected',
      chainId: undefined,
      connectedWalletAddress: undefined,
      providerError: { code: 4001 },
    });
    const rejectedByStatus = walletConnection({
      connectionStatus: 'not_connected',
      chainId: undefined,
      connectedWalletAddress: undefined,
      providerError: { normalizedStatus: 'rejected' },
    });

    expect(normalizeWalletProviderError({ code: '4001' })).toBe('rejected');
    expect(rejectedByCode.walletConnectionStatus).toBe('rejected');
    expect(rejectedByStatus.walletConnectionStatus).toBe('rejected');
    expect(rejectedByCode.walletConnectionReadiness).toBe('blocked');
    expect(rejectedByStatus.connectedWalletAddress).toBeUndefined();
  });

  it('normalizes non-rejection provider errors into a safe MILA26-owned error status', () => {
    const model = walletConnection({
      connectionStatus: 'not_connected',
      chainId: undefined,
      connectedWalletAddress: undefined,
      providerError: { code: 'UNKNOWN_PROVIDER_FAILURE' },
    });

    expect(normalizeWalletProviderError({ code: 'UNKNOWN_PROVIDER_FAILURE' })).toBe('error');
    expect(model.walletConnectionStatus).toBe('error');
    expect(model.walletConnectionReadiness).toBe('blocked');
    expect(model.blockedReasons).toContain('Wallet provider returned an error that must be normalized before continuing.');
  });

  it('blocks readiness when connected to the wrong chain', () => {
    const model = walletConnection({
      chainId: '0x1',
    });

    expect(model.walletConnectionStatus).toBe('wrong_chain');
    expect(model.chainStatus).toBe('wrong_chain');
    expect(model.walletConnectionReadiness).toBe('blocked');
    expect(model.walletExecutionStatus).toBe('blocked');
    expect(model.connectedWalletAddress).toBe(connectedSepoliaInput.connectedWalletAddress);
    expect(model.blockedReasons).toContain('Connected wallet is not on Ethereum Sepolia testnet.');
  });

  it('marks Sepolia-connected wallet connection as review-ready while keeping execution not implemented', () => {
    const hexModel = walletConnection();
    const decimalModel = walletConnection({ chainId: SEPOLIA_CHAIN_ID_DECIMAL });

    expect(hexModel.walletConnectionStatus).toBe('connected');
    expect(hexModel.chainStatus).toBe('sepolia');
    expect(hexModel.walletConnectionReadiness).toBe('review_ready');
    expect(hexModel.walletExecutionStatus).toBe('not_implemented');
    expect(hexModel.connectedWalletAddress).toBe(connectedSepoliaInput.connectedWalletAddress);
    expect(decimalModel.chainStatus).toBe('sepolia');
    expect(hexModel.blockedReasons).toContain(
      'Wallet execution remains not implemented; Track 13A defines connection readiness only.',
    );
  });

  it('treats connected state without an address as an error', () => {
    const model = walletConnection({
      connectedWalletAddress: undefined,
    });

    expect(model.walletConnectionStatus).toBe('error');
    expect(model.walletConnectionReadiness).toBe('blocked');
    expect(model.connectedWalletAddress).toBeUndefined();
    expect(model.blockedReasons).toContain('Connected wallet address is absent.');
  });

  it('keeps transaction, deployment, and signing values absent from the read model', () => {
    const model = walletConnection();
    const serialized = JSON.stringify(model);

    expect(serialized).not.toMatch(/transactionHash|txHash|contractAddress|signedPayload/i);
    expect(serialized).not.toMatch(/submittedTransaction|confirmedTransaction|deploymentReceipt/i);
    expect(serialized).not.toMatch(/"status":"signed"|"status":"submitted"|"status":"confirmed"|"status":"deployed"/i);
    expect(serialized).not.toMatch(/ready_for_signature|ready to sign|ready to deploy|deployment ready/i);
    expect(serialized).not.toMatch(/live|verified|production[- ]ready|mainnet[- ]ready/i);
    expect(serialized).not.toMatch(/audit passed|security approved/i);
  });

  it('documents alpha wallet boundaries without creating runtime wallet integration', () => {
    const model = walletConnection();

    expect(model.boundaries).toEqual(
      expect.arrayContaining([
        {
          id: 'metamask-first-eip1193-provider',
          label: 'MetaMask first through EIP-1193 provider boundary',
          status: 'enforced',
          detail:
            'Track 13B should target MetaMask as the first injected browser wallet while keeping the adapter EIP-1193-shaped.',
        },
        {
          id: 'backend-never-holds-private-keys',
          label: 'Backend never holds private keys',
          status: 'enforced',
          detail: 'The backend must never receive, store, or use user private keys.',
        },
        {
          id: 'sepolia-only-alpha',
          label: 'Sepolia testnet only for alpha',
          status: 'enforced',
          detail: 'Track 13B should accept Ethereum Sepolia chain ID 11155111 / 0xaa36a7 only.',
        },
        {
          id: 'wallet-execution-not-implemented',
          label: 'Wallet execution not implemented',
          status: 'not_implemented',
          detail: 'Track 13A does not add signing, deployment, or transaction preparation.',
        },
      ]),
    );
  });
});
