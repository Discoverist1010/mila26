export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

export type WalletProviderTarget = 'metamask';
export type WalletProviderStandard = 'eip1193';
export type WalletProviderStatus = 'unknown' | 'available' | 'unsupported';
export type WalletConnectionStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'wrong_chain'
  | 'rejected'
  | 'unsupported'
  | 'error';
export type WalletConnectionReadiness = 'blocked' | 'review_ready';
export type WalletRuntimeExecutionStatus = 'not_implemented' | 'blocked';
export type WalletChainStatus = 'unknown' | 'sepolia' | 'wrong_chain';
export type WalletConnectionBoundaryStatus = 'enforced' | 'not_implemented' | 'absent';
export type WalletProviderErrorStatus = 'rejected' | 'unsupported' | 'error';

export type WalletConnectionReadModelInput = {
  providerStatus: WalletProviderStatus;
  connectionStatus: Exclude<WalletConnectionStatus, 'wrong_chain' | 'unsupported' | 'error'>;
  chainId?: string | number;
  connectedWalletAddress?: string;
  providerError?: {
    code?: string | number;
    normalizedStatus?: WalletProviderErrorStatus;
  };
};

export type WalletConnectionBoundary = {
  id: string;
  label: string;
  status: WalletConnectionBoundaryStatus;
  detail: string;
};

export type WalletConnectionReadModel = {
  provider: {
    targetWallet: WalletProviderTarget;
    providerStandard: WalletProviderStandard;
    providerStatus: WalletProviderStatus;
  };
  walletConnectionStatus: WalletConnectionStatus;
  walletConnectionReadiness: WalletConnectionReadiness;
  walletExecutionStatus: WalletRuntimeExecutionStatus;
  chainStatus: WalletChainStatus;
  connectedWalletAddress?: string;
  blockedReasons: string[];
  boundaries: WalletConnectionBoundary[];
};

function normalizeChainId(chainId: WalletConnectionReadModelInput['chainId']): string | undefined {
  if (typeof chainId === 'number') {
    return `0x${chainId.toString(16)}`;
  }

  return chainId?.toLowerCase();
}

function isSepoliaChain(chainId: WalletConnectionReadModelInput['chainId']): boolean {
  const normalizedChainId = normalizeChainId(chainId);

  return normalizedChainId === SEPOLIA_CHAIN_ID_HEX;
}

function hasConnectedWalletAddress(input: WalletConnectionReadModelInput): boolean {
  return input.connectionStatus === 'connected' && typeof input.connectedWalletAddress === 'string' && input.connectedWalletAddress.length > 0;
}

export function normalizeWalletProviderError(
  error: WalletConnectionReadModelInput['providerError'],
): WalletProviderErrorStatus {
  if (error?.normalizedStatus) {
    return error.normalizedStatus;
  }

  if (error?.code === 4001 || error?.code === '4001') {
    return 'rejected';
  }

  return 'error';
}

export function formatWalletAddressForDisplay(address?: string): string {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function deriveConnectionStatus(input: WalletConnectionReadModelInput): WalletConnectionStatus {
  if (input.providerStatus === 'unsupported') return 'unsupported';

  if (input.providerError) {
    return normalizeWalletProviderError(input.providerError);
  }

  if (input.connectionStatus === 'connected' && !hasConnectedWalletAddress(input)) {
    return 'error';
  }

  if (input.connectionStatus === 'connected' && !isSepoliaChain(input.chainId)) {
    return 'wrong_chain';
  }

  return input.connectionStatus;
}

function deriveChainStatus(
  input: WalletConnectionReadModelInput,
  connectionStatus: WalletConnectionStatus,
): WalletChainStatus {
  if (connectionStatus !== 'connected' && connectionStatus !== 'wrong_chain') {
    return 'unknown';
  }

  return isSepoliaChain(input.chainId) ? 'sepolia' : 'wrong_chain';
}

function blockedReasonsFor(
  input: WalletConnectionReadModelInput,
  connectionStatus: WalletConnectionStatus,
  chainStatus: WalletChainStatus,
): string[] {
  const reasons: string[] = [];

  if (connectionStatus === 'unsupported') {
    reasons.push('MetaMask or another EIP-1193 browser wallet provider is not detected.');
  }

  if (connectionStatus === 'not_connected') {
    reasons.push('Wallet connection has not been requested.');
  }

  if (connectionStatus === 'connecting') {
    reasons.push('Wallet connection is still in progress.');
  }

  if (connectionStatus === 'rejected') {
    reasons.push('User rejected the wallet connection request.');
  }

  if (connectionStatus === 'error') {
    reasons.push('Wallet provider returned an error that must be normalized before continuing.');
  }

  if (input.connectionStatus === 'connected' && !hasConnectedWalletAddress(input)) {
    reasons.push('Connected wallet address is absent.');
  }

  if (chainStatus === 'wrong_chain') {
    reasons.push('Connected wallet is not on Ethereum Sepolia testnet.');
  }

  if (connectionStatus === 'connected' && chainStatus === 'sepolia') {
    reasons.push('Wallet execution remains not implemented; Track 13A defines connection readiness only.');
  }

  return reasons;
}

function buildBoundaries(): WalletConnectionBoundary[] {
  return [
    {
      id: 'metamask-first-eip1193-provider',
      label: 'MetaMask first through EIP-1193 provider boundary',
      status: 'enforced',
      detail: 'Track 13B should target MetaMask as the first injected browser wallet while keeping the adapter EIP-1193-shaped.',
    },
    {
      id: 'backend-never-holds-private-keys',
      label: 'Backend never holds private keys',
      status: 'enforced',
      detail: 'The backend must never receive, store, or use user private keys.',
    },
    {
      id: 'user-wallet-signs-later',
      label: 'User wallet signs later',
      status: 'enforced',
      detail: 'Future deployment and operations must be signed by the user wallet in the browser.',
    },
    {
      id: 'sepolia-only-alpha',
      label: 'Sepolia testnet only for alpha',
      status: 'enforced',
      detail: 'Track 13B should accept Ethereum Sepolia chain ID 11155111 / 0xaa36a7 only.',
    },
    {
      id: 'mainnet-disabled',
      label: 'Mainnet disabled',
      status: 'enforced',
      detail: 'Mainnet remains out of scope for the alpha wallet boundary.',
    },
    {
      id: 'wallet-execution-not-implemented',
      label: 'Wallet execution not implemented',
      status: 'not_implemented',
      detail: 'Track 13A does not add signing, deployment, or transaction preparation.',
    },
    {
      id: 'transaction-hash-absent',
      label: 'No transaction hash',
      status: 'absent',
      detail: 'Transaction hash appears only after a real wallet-submitted transaction in a later track.',
    },
    {
      id: 'contract-address-absent',
      label: 'No contract address',
      status: 'absent',
      detail: 'Contract address appears only after real wallet-signed deployment in a later track.',
    },
    {
      id: 'signed-payload-absent',
      label: 'No signed payload',
      status: 'absent',
      detail: 'Signed payload remains absent until a future explicit wallet-signing track.',
    },
    {
      id: 'submitted-transaction-absent',
      label: 'No submitted transaction',
      status: 'absent',
      detail: 'Submitted transaction remains absent until future transaction submission is implemented.',
    },
    {
      id: 'confirmed-transaction-absent',
      label: 'No confirmed transaction',
      status: 'absent',
      detail: 'Confirmed transaction remains absent until a future receipt-tracking track.',
    },
  ];
}

export function toWalletConnectionReadModel(input: WalletConnectionReadModelInput): WalletConnectionReadModel {
  const walletConnectionStatus = deriveConnectionStatus(input);
  const chainStatus = deriveChainStatus(input, walletConnectionStatus);
  const walletConnectionReadiness =
    walletConnectionStatus === 'connected' && chainStatus === 'sepolia' ? 'review_ready' : 'blocked';

  return {
    provider: {
      targetWallet: 'metamask',
      providerStandard: 'eip1193',
      providerStatus: input.providerStatus,
    },
    walletConnectionStatus,
    walletConnectionReadiness,
    walletExecutionStatus: walletConnectionReadiness === 'review_ready' ? 'not_implemented' : 'blocked',
    chainStatus,
    connectedWalletAddress: hasConnectedWalletAddress(input) ? input.connectedWalletAddress : undefined,
    blockedReasons: blockedReasonsFor(input, walletConnectionStatus, chainStatus),
    boundaries: buildBoundaries(),
  };
}
