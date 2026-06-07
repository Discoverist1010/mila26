import { describe, expect, it } from 'vitest';
import { parseLiveSepoliaConfig } from '../src/liveSepolia/liveSepoliaConfig';

const baseEnv = {
  LIVE_SEPOLIA: '1',
  MILA26_SEPOLIA_ISSUER_ADMIN_ADDRESS: '0x1111111111111111111111111111111111111111',
  MILA26_SEPOLIA_PAYMENT_ADDRESS: '0x2222222222222222222222222222222222222222',
  MILA26_SEPOLIA_REDEMPTION_WALLET_ADDRESS: '0x3333333333333333333333333333333333333333',
  MILA26_SEPOLIA_INVESTOR_ADDRESSES: '0x4444444444444444444444444444444444444444, 0x5555555555555555555555555555555555555555',
};

describe('live Sepolia config parser', () => {
  it('skips unless live Sepolia is explicitly enabled', () => {
    expect(parseLiveSepoliaConfig({ LIVE_SEPOLIA: '0' })).toEqual({
      enabled: false,
      reason: 'LIVE_SEPOLIA is not set to 1.',
    });
  });

  it('accepts public addresses and optional RPC/evidence settings', () => {
    const result = parseLiveSepoliaConfig({
      ...baseEnv,
      MILA26_SEPOLIA_RPC_URL: 'https://sepolia.example/rpc',
      MILA26_LIVE_EVIDENCE_API_BASE_URL: 'http://127.0.0.1:5174',
      MILA26_LIVE_EVIDENCE_PROJECT_ID: 'usequities',
      MILA26_SEPOLIA_DEPLOYMENT_TX_HASH: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });

    expect(result).toMatchObject({
      enabled: true,
      errors: [],
      config: {
        issuerAdminAddress: baseEnv.MILA26_SEPOLIA_ISSUER_ADMIN_ADDRESS,
        evidenceTransactionHashes: [{ evidenceType: 'deployment' }],
      },
    });
  });

  it('fails loudly for missing, duplicate, or malformed public artefacts', () => {
    const result = parseLiveSepoliaConfig({
      LIVE_SEPOLIA: '1',
      MILA26_SEPOLIA_ISSUER_ADMIN_ADDRESS: '0x0000000000000000000000000000000000000000',
      MILA26_SEPOLIA_PAYMENT_ADDRESS: 'not-an-address',
      MILA26_SEPOLIA_REDEMPTION_WALLET_ADDRESS: baseEnv.MILA26_SEPOLIA_REDEMPTION_WALLET_ADDRESS,
      MILA26_SEPOLIA_INVESTOR_ADDRESSES:
        '0x4444444444444444444444444444444444444444,0x4444444444444444444444444444444444444444',
      MILA26_SEPOLIA_RPC_URL: 'ftp://not-rpc',
      MILA26_SEPOLIA_DEPLOYMENT_TX_HASH: 'not-a-hash',
    });

    expect(result.enabled).toBe(true);
    expect(result).toMatchObject({
      errors: expect.arrayContaining([
        'Issuer/admin address must be a valid non-zero EVM address.',
        'Payment address must be a valid non-zero EVM address.',
        'Representative investor addresses must be unique.',
        'Sepolia RPC URL must be an http(s) URL.',
        'Deployment transaction hash must be a 32-byte hex transaction hash.',
      ]),
    });
  });

  it('requires RPC and transaction hashes before live Evidence Vault API save is configured', () => {
    const result = parseLiveSepoliaConfig({
      ...baseEnv,
      MILA26_LIVE_EVIDENCE_API_BASE_URL: 'http://127.0.0.1:5174',
      MILA26_LIVE_EVIDENCE_PROJECT_ID: 'usequities',
    });

    expect(result).toMatchObject({
      enabled: true,
      errors: expect.arrayContaining([
        'Sepolia RPC URL is required when live Evidence Vault API save is configured.',
        'At least one Sepolia transaction hash is required when live Evidence Vault API save is configured.',
      ]),
    });
  });
});
