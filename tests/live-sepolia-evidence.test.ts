import { describe, expect, it } from 'vitest';
import { WorkspaceEvidenceRecordInputSchema } from '../server/contracts/workspacePersistence';
import { toWorkspaceEvidenceRecordFromLiveSepoliaReceipt } from '../src/liveSepolia/liveSepoliaEvidence';

const transactionHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const investorWallet = '0x1111111111111111111111111111111111111111';

describe('live Sepolia evidence mapping', () => {
  it('maps a successful deployment receipt to durable Evidence Vault input provenance', () => {
    const record = toWorkspaceEvidenceRecordFromLiveSepoliaReceipt({
      evidenceType: 'deployment',
      transactionHash,
      receipt: {
        transactionHash,
        status: '0x1',
        contractAddress,
      },
    });

    expect(WorkspaceEvidenceRecordInputSchema.parse(record)).toMatchObject({
      evidenceType: 'deployment',
      status: 'confirmed',
      chainId: 11155111,
      networkName: 'Sepolia',
      transactionHash,
      transactionHashSource: 'provider_returned',
      receiptSource: 'provider_receipt',
      receiptStatus: 'success',
      contractAddress,
      contractAddressSource: 'receipt_returned',
      eventEvidenceSource: 'absent',
    });
  });

  it('maps an operation receipt to confirmed deployment evidence as the contract address source', () => {
    const record = toWorkspaceEvidenceRecordFromLiveSepoliaReceipt({
      evidenceType: 'wallet_whitelist',
      transactionHash,
      deployedContractAddress: contractAddress,
      targetWalletAddress: investorWallet,
      receipt: {
        transactionHash,
        status: '0x1',
        to: contractAddress,
      },
    });

    expect(WorkspaceEvidenceRecordInputSchema.parse(record)).toMatchObject({
      evidenceType: 'wallet_whitelist',
      status: 'confirmed',
      receiptSource: 'provider_receipt',
      receiptStatus: 'success',
      contractAddress,
      contractAddressSource: 'confirmed_deployment_evidence',
      eventEvidenceSource: 'receipt_confirmed',
      eventName: 'WalletWhitelisted',
      targetWalletAddress: investorWallet,
    });
  });

  it('keeps pending transaction hashes as submitted evidence without fake receipts', () => {
    const record = toWorkspaceEvidenceRecordFromLiveSepoliaReceipt({
      evidenceType: 'record_nav',
      transactionHash,
      receipt: null,
      valuation: '1.025',
      valuationReference: 'NAV-2026-06-07',
    });

    expect(WorkspaceEvidenceRecordInputSchema.parse(record)).toMatchObject({
      evidenceType: 'record_nav',
      status: 'submitted',
      receiptSource: 'absent',
      contractAddressSource: 'absent',
      eventEvidenceSource: 'absent',
      valuation: '1.025',
      valuationReference: 'NAV-2026-06-07',
    });
  });

  it('rejects confirmed deployment receipts without receipt-returned contract addresses', () => {
    const record = toWorkspaceEvidenceRecordFromLiveSepoliaReceipt({
      evidenceType: 'deployment',
      transactionHash,
      receipt: {
        transactionHash,
        status: '0x1',
        contractAddress: null,
      },
    });

    expect(() => WorkspaceEvidenceRecordInputSchema.parse(record)).toThrow();
  });

  it('rejects receipts that do not match the configured transaction hash', () => {
    expect(() =>
      toWorkspaceEvidenceRecordFromLiveSepoliaReceipt({
        evidenceType: 'deployment',
        transactionHash,
        receipt: {
          transactionHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          status: '0x1',
          contractAddress,
        },
      }),
    ).toThrow('Provider receipt transaction hash does not match the configured transaction hash.');
  });
});
