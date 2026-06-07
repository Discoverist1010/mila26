import { existsSync, readFileSync } from 'node:fs';
import { parseLiveSepoliaConfig, type LiveSepoliaConfig, type LiveSepoliaEvidenceType } from '../src/liveSepolia/liveSepoliaConfig';
import {
  toWorkspaceEvidenceRecordFromLiveSepoliaReceipt,
  type LiveSepoliaTransactionReceipt,
} from '../src/liveSepolia/liveSepoliaEvidence';
import type { WorkspaceEvidenceRecordInput } from '../server/contracts/workspacePersistence';

const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

type JsonRpcResponse<T> = {
  result?: T;
  error?: {
    code: number;
    message: string;
  };
};

function parseDotEnv(path = '.env'): Record<string, string> {
  if (!existsSync(path)) return {};

  const env: Record<string, string> = {};
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    env[key] = rawValue.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return env;
}

function mergedEnv(): Record<string, string | undefined> {
  return { ...parseDotEnv(), ...process.env };
}

async function rpc<T>(rpcUrl: string, method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC ${method} failed with HTTP ${response.status}.`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) {
    throw new Error(`RPC ${method} failed: ${payload.error.message}`);
  }

  return payload.result as T;
}

function requiredRpcUrl(config: LiveSepoliaConfig): string {
  if (!config.rpcUrl) {
    throw new Error('No Sepolia RPC URL configured. Address validation passed; RPC checks were skipped.');
  }
  return config.rpcUrl;
}

async function validateRpc(config: LiveSepoliaConfig): Promise<void> {
  if (!config.rpcUrl) {
    console.warn('Address validation passed. No Sepolia RPC URL configured, so chain, balance, and receipt checks were skipped.');
    return;
  }

  const chainId = (await rpc<string>(config.rpcUrl, 'eth_chainId')).toLowerCase();
  if (chainId !== SEPOLIA_CHAIN_ID_HEX) {
    throw new Error(`Configured RPC is not Sepolia. Expected ${SEPOLIA_CHAIN_ID_HEX}; received ${chainId}.`);
  }

  const addresses = [
    ['issuer/admin', config.issuerAdminAddress],
    ['payment', config.paymentAddress],
    ['redemption', config.redemptionWalletAddress],
    ...config.investorAddresses.map((address, index) => [`investor ${index + 1}`, address] as const),
  ] as const;

  for (const [label, address] of addresses) {
    const balance = await rpc<string>(config.rpcUrl, 'eth_getBalance', [address, 'latest']);
    console.warn(`Sepolia balance lookup passed for ${label}: ${balance}`);
  }
}

async function evidenceRecordsFromReceipts(config: LiveSepoliaConfig): Promise<WorkspaceEvidenceRecordInput[]> {
  if (config.evidenceTransactionHashes.length === 0) return [];

  const rpcUrl = requiredRpcUrl(config);
  const deploymentReceipt = config.evidenceTransactionHashes.some((hash) => hash.evidenceType !== 'deployment')
    ? await firstDeploymentReceipt(config, rpcUrl)
    : undefined;
  const deployedContractAddress = deploymentReceipt?.contractAddress ?? undefined;

  const records: WorkspaceEvidenceRecordInput[] = [];
  for (const evidenceHash of config.evidenceTransactionHashes) {
    const receipt = await rpc<LiveSepoliaTransactionReceipt | null>(rpcUrl, 'eth_getTransactionReceipt', [
      evidenceHash.transactionHash,
    ]);
    const record = toWorkspaceEvidenceRecordFromLiveSepoliaReceipt({
      evidenceType: evidenceHash.evidenceType,
      transactionHash: evidenceHash.transactionHash,
      receipt,
      deployedContractAddress: evidenceHash.evidenceType === 'deployment' ? undefined : deployedContractAddress,
      eventName: eventName(evidenceHash.evidenceType),
    });
    records.push(record);
  }

  return records;
}

async function firstDeploymentReceipt(
  config: LiveSepoliaConfig,
  rpcUrl: string,
): Promise<LiveSepoliaTransactionReceipt | null | undefined> {
  const deploymentHash = config.evidenceTransactionHashes.find((hash) => hash.evidenceType === 'deployment');
  if (!deploymentHash) return undefined;
  return rpc<LiveSepoliaTransactionReceipt | null>(rpcUrl, 'eth_getTransactionReceipt', [deploymentHash.transactionHash]);
}

function eventName(evidenceType: LiveSepoliaEvidenceType): WorkspaceEvidenceRecordInput['eventName'] | undefined {
  if (evidenceType === 'record_nav') return 'ValuationUpdated';
  if (evidenceType === 'wallet_whitelist') return 'WalletWhitelisted';
  if (evidenceType === 'allocation_mint') return 'AllocationMinted';
  return undefined;
}

async function saveEvidenceRecords(config: LiveSepoliaConfig, records: WorkspaceEvidenceRecordInput[]): Promise<void> {
  if (!config.apiBaseUrl || !config.evidenceProjectId || records.length === 0) return;

  const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/api/workspace/evidence/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId: config.evidenceProjectId,
      records,
    }),
  });

  if (!response.ok) {
    throw new Error(`Evidence Vault save failed with HTTP ${response.status}. Ensure a workspace snapshot exists first.`);
  }

  console.warn(`Evidence Vault save submitted ${records.length} provider-derived record(s).`);
}

async function main() {
  const parsed = parseLiveSepoliaConfig(mergedEnv());
  if (!parsed.enabled) {
    console.warn(`Live Sepolia readiness skipped: ${parsed.reason}`);
    return;
  }

  if (parsed.errors.length > 0 || !parsed.config) {
    console.error(`Live Sepolia readiness failed:\n- ${parsed.errors.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  try {
    await validateRpc(parsed.config);
    const records = await evidenceRecordsFromReceipts(parsed.config);
    await saveEvidenceRecords(parsed.config, records);
    console.warn('Live Sepolia readiness completed.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Live Sepolia readiness failed.');
    process.exitCode = 1;
  }
}

await main();
