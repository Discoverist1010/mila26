import { describe, expect, it } from 'vitest';
import { createInitialMila26LifecycleState, toMila26LifecycleReadModel } from '../src/domain/lifecycleState';
import {
  createTestInvestorWalletPack,
  createTestInvestorWalletPackExport,
  toInvestorRegistryEntriesFromTestWalletPack,
  toTestInvestorWalletPublicRecords,
  type TestWalletPrivateKey,
} from '../src/domain/testWalletLab';

function privateKeyFor(index: number): TestWalletPrivateKey {
  return `0x${(index + 1).toString(16).padStart(64, '0')}`;
}

describe('Test Wallet Lab', () => {
  it('generates a capped labelled test investor wallet pack with valid unique addresses', () => {
    const pack = createTestInvestorWalletPack({
      requestedCount: 55,
      privateKeyFactory: privateKeyFor,
    });

    expect(pack.requestedCount).toBe(50);
    expect(pack.createdCount).toBe(50);
    expect(pack.wallets[0].label).toBe('Investor 01');
    expect(pack.wallets[49].label).toBe('Investor 50');
    expect(new Set(pack.wallets.map((wallet) => wallet.walletAddress.toLowerCase())).size).toBe(50);
    expect(pack.wallets.every((wallet) => /^0x[a-fA-F0-9]{40}$/.test(wallet.walletAddress))).toBe(true);
    expect(pack.warnings).toContain('Wallet count was adjusted to 50.');
  });

  it('exports private keys only through the explicit test-only export shape', () => {
    const pack = createTestInvestorWalletPack({
      requestedCount: 2,
      privateKeyFactory: privateKeyFor,
    });

    const publicRecords = toTestInvestorWalletPublicRecords(pack);
    const exportContent = createTestInvestorWalletPackExport(pack);

    expect(JSON.stringify(publicRecords)).not.toContain('privateKey');
    expect(exportContent).toContain('mila26-test-investor-wallet-pack');
    expect(exportContent).toContain('privateKey');
    expect(exportContent).toContain('Generated test wallets only.');
  });

  it('converts generated public addresses into registry entries without leaking private keys into lifecycle read models', () => {
    const pack = createTestInvestorWalletPack({
      requestedCount: 3,
      privateKeyFactory: privateKeyFor,
    });
    const entries = toInvestorRegistryEntriesFromTestWalletPack({
      pack,
      startingSequence: 1,
    });

    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: entries,
    });
    const serializedReadModel = JSON.stringify(readModel);

    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      label: 'Investor 01',
      source: 'generated_test_wallet',
      status: 'ready_to_whitelist',
    });
    expect(readModel.investorRegistry.entryCount).toBe(3);
    expect(readModel.investorRegistry.entries[0].displayLabel).toBe('Investor 01');
    expect(readModel.investorRegistry.entries[0].sourceLabel).toBe('Generated test wallet');
    expect(serializedReadModel).not.toContain('privateKey');
    expect(serializedReadModel).not.toContain(pack.wallets[0].privateKey);
  });
});
