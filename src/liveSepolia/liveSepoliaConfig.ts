import { isValidNonZeroEvmAddress } from '../domain/recordNavOperationReadModel';

export type LiveSepoliaEvidenceType = 'deployment' | 'record_nav' | 'wallet_whitelist' | 'allocation_mint';

export type LiveSepoliaEvidenceHashConfig = {
  evidenceType: LiveSepoliaEvidenceType;
  transactionHash: string;
};

export type LiveSepoliaConfig = {
  issuerAdminAddress: string;
  paymentAddress: string;
  redemptionWalletAddress: string;
  investorAddresses: string[];
  rpcUrl?: string;
  apiBaseUrl?: string;
  evidenceProjectId?: string;
  evidenceTransactionHashes: LiveSepoliaEvidenceHashConfig[];
};

export type LiveSepoliaConfigResult =
  | { enabled: false; reason: string }
  | { enabled: true; config?: LiveSepoliaConfig; errors: string[] };

export const LIVE_SEPOLIA_ENV_KEYS = {
  enabled: 'LIVE_SEPOLIA',
  rpcUrl: 'MILA26_SEPOLIA_RPC_URL',
  issuerAdminAddress: 'MILA26_SEPOLIA_ISSUER_ADMIN_ADDRESS',
  paymentAddress: 'MILA26_SEPOLIA_PAYMENT_ADDRESS',
  redemptionWalletAddress: 'MILA26_SEPOLIA_REDEMPTION_WALLET_ADDRESS',
  investorAddresses: 'MILA26_SEPOLIA_INVESTOR_ADDRESSES',
  apiBaseUrl: 'MILA26_LIVE_EVIDENCE_API_BASE_URL',
  evidenceProjectId: 'MILA26_LIVE_EVIDENCE_PROJECT_ID',
  deploymentTransactionHash: 'MILA26_SEPOLIA_DEPLOYMENT_TX_HASH',
  recordNavTransactionHash: 'MILA26_SEPOLIA_RECORD_NAV_TX_HASH',
  walletWhitelistTransactionHash: 'MILA26_SEPOLIA_WALLET_WHITELIST_TX_HASH',
  allocationMintTransactionHash: 'MILA26_SEPOLIA_ALLOCATION_MINT_TX_HASH',
} as const;

const EVM_TRANSACTION_HASH_PATTERN = /^0x[0-9a-fA-F]{64}$/;

function value(env: Record<string, string | undefined>, key: string): string | undefined {
  const candidate = env[key]?.trim();
  return candidate ? candidate : undefined;
}

function parseAddressList(input: string | undefined): string[] {
  if (!input) return [];
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isHttpUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function validateAddress(label: string, address: string | undefined, errors: string[]): string | undefined {
  if (!address) {
    errors.push(`${label} is required.`);
    return undefined;
  }

  if (!isValidNonZeroEvmAddress(address)) {
    errors.push(`${label} must be a valid non-zero EVM address.`);
    return undefined;
  }

  return address;
}

function evidenceHashes(env: Record<string, string | undefined>, errors: string[]): LiveSepoliaEvidenceHashConfig[] {
  const candidates: Array<{ evidenceType: LiveSepoliaEvidenceType; key: string; label: string }> = [
    { evidenceType: 'deployment', key: LIVE_SEPOLIA_ENV_KEYS.deploymentTransactionHash, label: 'Deployment transaction hash' },
    { evidenceType: 'record_nav', key: LIVE_SEPOLIA_ENV_KEYS.recordNavTransactionHash, label: 'Record NAV transaction hash' },
    { evidenceType: 'wallet_whitelist', key: LIVE_SEPOLIA_ENV_KEYS.walletWhitelistTransactionHash, label: 'Wallet whitelist transaction hash' },
    { evidenceType: 'allocation_mint', key: LIVE_SEPOLIA_ENV_KEYS.allocationMintTransactionHash, label: 'Allocation / Mint transaction hash' },
  ];

  return candidates.flatMap(({ evidenceType, key, label }) => {
    const transactionHash = value(env, key);
    if (!transactionHash) return [];
    if (!EVM_TRANSACTION_HASH_PATTERN.test(transactionHash)) {
      errors.push(`${label} must be a 32-byte hex transaction hash.`);
      return [];
    }
    return [{ evidenceType, transactionHash }];
  });
}

export function parseLiveSepoliaConfig(env: Record<string, string | undefined>): LiveSepoliaConfigResult {
  if (value(env, LIVE_SEPOLIA_ENV_KEYS.enabled) !== '1') {
    return { enabled: false, reason: 'LIVE_SEPOLIA is not set to 1.' };
  }

  const errors: string[] = [];
  const issuerAdminAddress = validateAddress('Issuer/admin address', value(env, LIVE_SEPOLIA_ENV_KEYS.issuerAdminAddress), errors);
  const paymentAddress = validateAddress('Payment address', value(env, LIVE_SEPOLIA_ENV_KEYS.paymentAddress), errors);
  const redemptionWalletAddress = validateAddress(
    'Redemption wallet address',
    value(env, LIVE_SEPOLIA_ENV_KEYS.redemptionWalletAddress),
    errors,
  );
  const investorAddresses = parseAddressList(value(env, LIVE_SEPOLIA_ENV_KEYS.investorAddresses));

  if (investorAddresses.length === 0) {
    errors.push('At least one representative investor address is required.');
  }

  investorAddresses.forEach((address, index) => {
    if (!isValidNonZeroEvmAddress(address)) {
      errors.push(`Investor address ${index + 1} must be a valid non-zero EVM address.`);
    }
  });

  const uniqueInvestorAddresses = new Set(investorAddresses.map((address) => address.toLowerCase()));
  if (uniqueInvestorAddresses.size !== investorAddresses.length) {
    errors.push('Representative investor addresses must be unique.');
  }

  const rpcUrl = value(env, LIVE_SEPOLIA_ENV_KEYS.rpcUrl);
  if (rpcUrl && !isHttpUrl(rpcUrl)) {
    errors.push('Sepolia RPC URL must be an http(s) URL.');
  }

  const apiBaseUrl = value(env, LIVE_SEPOLIA_ENV_KEYS.apiBaseUrl);
  if (apiBaseUrl && !isHttpUrl(apiBaseUrl)) {
    errors.push('Live evidence API base URL must be an http(s) URL.');
  }

  const evidenceProjectId = value(env, LIVE_SEPOLIA_ENV_KEYS.evidenceProjectId);
  if ((apiBaseUrl && !evidenceProjectId) || (!apiBaseUrl && evidenceProjectId)) {
    errors.push('Live evidence API base URL and project id must be provided together.');
  }

  if (apiBaseUrl && !rpcUrl) {
    errors.push('Sepolia RPC URL is required when live Evidence Vault API save is configured.');
  }

  const evidenceTransactionHashes = evidenceHashes(env, errors);
  if (apiBaseUrl && evidenceTransactionHashes.length === 0) {
    errors.push('At least one Sepolia transaction hash is required when live Evidence Vault API save is configured.');
  }

  if (errors.length > 0 || !issuerAdminAddress || !paymentAddress || !redemptionWalletAddress) {
    return { enabled: true, errors };
  }

  return {
    enabled: true,
    errors: [],
    config: {
      issuerAdminAddress,
      paymentAddress,
      redemptionWalletAddress,
      investorAddresses,
      rpcUrl,
      apiBaseUrl,
      evidenceProjectId,
      evidenceTransactionHashes,
    },
  };
}
