import { describe, expect, it } from 'vitest';
import {
  createInitialMila26LifecycleState,
  createInvestorRegistryEntry,
  markInvestorWalletWhitelisted,
  MAX_INVESTOR_REGISTRY_ENTRIES,
  toMila26LifecycleReadModel,
  type InvestorRegistryEntry,
} from '../src/domain/lifecycleState';

const firstWallet = '0x1111111111111111111111111111111111111111';
const secondWallet = '0x2222222222222222222222222222222222222222';

describe('MILA26 lifecycle state', () => {
  it('starts with shared lifecycle parameter gaps and an empty investor registry', () => {
    const readModel = toMila26LifecycleReadModel(createInitialMila26LifecycleState());

    expect(readModel.investorRegistry.status).toBe('empty');
    expect(readModel.investorRegistry.entryCount).toBe(0);
    expect(readModel.investorRegistry.remainingSlots).toBe(MAX_INVESTOR_REGISTRY_ENTRIES);
    expect(readModel.subscriptionStatus).toBe('needs_parameters');
    expect(readModel.redemptionStatus).toBe('needs_parameters');
    expect(readModel.maturityStatus).toBe('locked_for_later');
  });

  it('marks valid unique investor wallets as ready to whitelist', () => {
    const entry = createInvestorRegistryEntry({
      id: 'investor-wallet-1',
      walletAddress: ` ${firstWallet} `,
    });
    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [entry],
    });

    expect(entry.walletAddress).toBe(firstWallet);
    expect(entry.status).toBe('ready_to_whitelist');
    expect(readModel.investorRegistry.status).toBe('ready');
    expect(readModel.investorRegistry.readyToWhitelistCount).toBe(1);
    expect(readModel.investorRegistry.entries[0].validationStatus).toBe('valid');
    expect(readModel.investorRegistry.entries[0].canUseForWhitelist).toBe(true);
  });

  it('keeps invalid and duplicate wallets as draft registry gaps', () => {
    const existing = createInvestorRegistryEntry({
      id: 'investor-wallet-1',
      walletAddress: firstWallet,
    });
    const duplicate = createInvestorRegistryEntry({
      id: 'investor-wallet-2',
      walletAddress: firstWallet.toUpperCase(),
      existingEntries: [existing],
    });
    const invalid = createInvestorRegistryEntry({
      id: 'investor-wallet-3',
      walletAddress: '0x1234',
      existingEntries: [existing, duplicate],
    });

    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [existing, duplicate, invalid],
    });

    expect(duplicate.status).toBe('draft');
    expect(invalid.status).toBe('draft');
    expect(readModel.investorRegistry.status).toBe('needs_attention');
    expect(readModel.investorRegistry.readyToWhitelistCount).toBe(0);
    expect(readModel.investorRegistry.duplicateCount).toBe(2);
    expect(readModel.investorRegistry.invalidCount).toBe(1);
    expect(readModel.investorRegistry.entries[0].statusLabel).toBe('Duplicate wallet');
    expect(readModel.investorRegistry.entries[1].statusLabel).toBe('Duplicate wallet');
    expect(readModel.investorRegistry.entries[2].statusLabel).toBe('Needs valid wallet');
    expect(readModel.investorRegistry.blockingReasons).toEqual(
      expect.arrayContaining(['Resolve invalid wallet addresses.', 'Remove duplicate wallet addresses.']),
    );
  });

  it('tracks whitelisted wallets as local-session-only without claiming eligibility or KYC approval', () => {
    const state = {
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [
        createInvestorRegistryEntry({
          id: 'investor-wallet-1',
          walletAddress: firstWallet,
        }),
        createInvestorRegistryEntry({
          id: 'investor-wallet-2',
          walletAddress: secondWallet,
        }),
      ],
    };

    const nextState = markInvestorWalletWhitelisted(state, firstWallet);
    const readModel = toMila26LifecycleReadModel(nextState);
    const serialized = JSON.stringify(readModel);

    expect(readModel.investorRegistry.status).toBe('active');
    expect(readModel.investorRegistry.readyToWhitelistCount).toBe(1);
    expect(readModel.investorRegistry.whitelistedCount).toBe(1);
    expect(readModel.investorRegistry.entries[0].status).toBe('whitelisted_local_session_only');
    expect(readModel.investorRegistry.entries[0].canUseForWhitelist).toBe(false);
    expect(readModel.investorRegistry.entries[1].canUseForWhitelist).toBe(true);
    expect(serialized).not.toMatch(/KYC approved|eligibility approved|legal approval|issuer authorized|production ready/i);
  });

  it('keeps a full valid 50 wallet registry ready while separately reporting capacity', () => {
    const entries: InvestorRegistryEntry[] = Array.from({ length: MAX_INVESTOR_REGISTRY_ENTRIES }, (_, index) =>
      createInvestorRegistryEntry({
        id: `investor-wallet-${index + 1}`,
        walletAddress: `0x${(index + 1).toString(16).padStart(40, '0')}`,
      }),
    );

    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: entries,
    });

    expect(readModel.investorRegistry.entryCount).toBe(MAX_INVESTOR_REGISTRY_ENTRIES);
    expect(readModel.investorRegistry.remainingSlots).toBe(0);
    expect(readModel.investorRegistry.isAtCapacity).toBe(true);
    expect(readModel.investorRegistry.canAddEntry).toBe(false);
    expect(readModel.investorRegistry.status).toBe('ready');
    expect(readModel.investorRegistry.blockingReasons).toContain('Investor registry is at the 50 wallet limit.');
  });

  it('prioritizes invalid or duplicate wallet problems even when the registry is full', () => {
    const entries: InvestorRegistryEntry[] = Array.from({ length: MAX_INVESTOR_REGISTRY_ENTRIES }, (_, index) =>
      createInvestorRegistryEntry({
        id: `investor-wallet-${index + 1}`,
        walletAddress: index === MAX_INVESTOR_REGISTRY_ENTRIES - 1 ? '0x1234' : `0x${(index + 1).toString(16).padStart(40, '0')}`,
      }),
    );

    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: entries,
    });

    expect(readModel.investorRegistry.isAtCapacity).toBe(true);
    expect(readModel.investorRegistry.status).toBe('needs_attention');
    expect(readModel.investorRegistry.blockingReasons).toEqual(
      expect.arrayContaining(['Resolve invalid wallet addresses.', 'Investor registry is at the 50 wallet limit.']),
    );
  });
});
