import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import {
  createInvestorRegistryEntry,
  hasInvestorWalletDuplicate,
  MAX_INVESTOR_REGISTRY_ENTRIES,
  type InvestorRegistryEntry,
} from './lifecycleState';

export type TestWalletPrivateKey = `0x${string}`;

export type TestInvestorWallet = {
  id: string;
  label: string;
  walletAddress: string;
  privateKey: TestWalletPrivateKey;
};

export type TestInvestorWalletPack = {
  packId: string;
  requestedCount: number;
  createdCount: number;
  maxCount: number;
  wallets: TestInvestorWallet[];
  warnings: string[];
};

export type TestInvestorWalletPublicRecord = Omit<TestInvestorWallet, 'privateKey'>;

export type CreateTestInvestorWalletPackInput = {
  requestedCount: number;
  existingEntries?: InvestorRegistryEntry[];
  privateKeyFactory?: (index: number) => TestWalletPrivateKey;
};

export function createTestInvestorWalletPack(input: CreateTestInvestorWalletPackInput): TestInvestorWalletPack {
  const requestedCount = normalizeRequestedCount(input.requestedCount);
  const existingEntries = input.existingEntries ?? [];
  const remainingSlots = Math.max(0, MAX_INVESTOR_REGISTRY_ENTRIES - existingEntries.length);
  const targetCount = Math.min(requestedCount, remainingSlots);
  const warnings: string[] = [];
  const wallets: TestInvestorWallet[] = [];

  if (requestedCount !== input.requestedCount) {
    warnings.push(`Wallet count was adjusted to ${requestedCount}.`);
  }

  if (targetCount < requestedCount) {
    warnings.push(`Investor Registry has ${remainingSlots} slot(s) remaining, so only ${targetCount} test wallet(s) were generated.`);
  }

  const seenWalletAddresses = new Set(existingEntries.map((entry) => entry.walletAddress.trim().toLowerCase()).filter(Boolean));
  let attempt = 0;
  const maxAttempts = Math.max(targetCount * 5, 10);

  while (wallets.length < targetCount && attempt < maxAttempts) {
    const privateKey = input.privateKeyFactory?.(attempt) ?? generatePrivateKey();
    const walletAddress = privateKeyToAccount(privateKey).address;
    const normalizedWalletAddress = walletAddress.toLowerCase();
    attempt += 1;

    if (seenWalletAddresses.has(normalizedWalletAddress)) continue;

    seenWalletAddresses.add(normalizedWalletAddress);
    wallets.push({
      id: `test-investor-${wallets.length + 1}`,
      label: `Investor ${String(wallets.length + 1).padStart(2, '0')}`,
      walletAddress,
      privateKey,
    });
  }

  if (wallets.length < targetCount) {
    warnings.push(`Only ${wallets.length} unique test wallet(s) could be generated.`);
  }

  return {
    packId: `test-investor-wallet-pack-${Date.now()}`,
    requestedCount,
    createdCount: wallets.length,
    maxCount: MAX_INVESTOR_REGISTRY_ENTRIES,
    wallets,
    warnings,
  };
}

export function toTestInvestorWalletPublicRecords(pack: TestInvestorWalletPack): TestInvestorWalletPublicRecord[] {
  return pack.wallets.map(({ id, label, walletAddress }) => ({ id, label, walletAddress }));
}

export function toInvestorRegistryEntriesFromTestWalletPack(input: {
  pack: TestInvestorWalletPack;
  existingEntries?: InvestorRegistryEntry[];
  startingSequence: number;
}): InvestorRegistryEntry[] {
  const existingEntries = input.existingEntries ?? [];
  return input.pack.wallets
    .filter((wallet) => !hasInvestorWalletDuplicate(wallet.walletAddress, existingEntries))
    .map((wallet, index) =>
      createInvestorRegistryEntry({
        id: `test-investor-wallet-${input.startingSequence + index}`,
        walletAddress: wallet.walletAddress,
        label: wallet.label,
        source: 'generated_test_wallet',
        existingEntries: [...existingEntries, ...input.pack.wallets.slice(0, index).map((generatedWallet) => ({
          id: generatedWallet.id,
          walletAddress: generatedWallet.walletAddress,
          status: 'ready_to_whitelist' as const,
        }))],
      }),
    );
}

export function createTestInvestorWalletPackExport(pack: TestInvestorWalletPack): string {
  return JSON.stringify(
    {
      type: 'mila26-test-investor-wallet-pack',
      testnetOnly: true,
      warning: 'Generated test wallets only. Use a separate test-only MetaMask profile.',
      packId: pack.packId,
      wallets: pack.wallets.map((wallet) => ({
        label: wallet.label,
        walletAddress: wallet.walletAddress,
        privateKey: wallet.privateKey,
      })),
    },
    null,
    2,
  );
}

function normalizeRequestedCount(requestedCount: number): number {
  if (!Number.isFinite(requestedCount)) return MAX_INVESTOR_REGISTRY_ENTRIES;
  return Math.max(1, Math.min(MAX_INVESTOR_REGISTRY_ENTRIES, Math.floor(requestedCount)));
}
