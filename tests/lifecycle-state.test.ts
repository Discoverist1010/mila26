import { describe, expect, it } from 'vitest';
import {
  createInitialMila26LifecycleState,
  createInvestorRegistryEntry,
  markInvestorWalletWhitelisted,
  MAX_INVESTOR_REGISTRY_ENTRIES,
  parsePermittedStablecoins,
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
    expect(readModel.allocationMintStatus).toBe('locked_for_later');
    expect(readModel.allocationMint.blockingReasons).toContain('Register at least one investor wallet before Allocation / Mint.');
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

  it('normalizes permitted stablecoins and reports draft subscription parameters until every required field is valid', () => {
    expect(parsePermittedStablecoins(' usdc, USDT, usdc ,, dai ')).toEqual(['USDC', 'USDT', 'DAI']);

    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      subscriptionParameters: {
        permittedStablecoins: ['usdc', 'USDC'],
        subscriptionWindow: '2026-07-01 to 2026-07-15',
        minimumSubscriptionAmount: '1000',
        paymentAddress: '0x1234',
        paymentPerToken: '',
      },
    });

    expect(readModel.subscription.status).toBe('draft');
    expect(readModel.subscriptionStatus).toBe('draft');
    expect(readModel.subscription.normalizedPermittedStablecoins).toEqual(['USDC']);
    expect(readModel.subscription.validationMessages).toEqual(
      expect.arrayContaining([
        'Payment wallet or contract address must be a valid non-zero EVM address.',
        'Payment per token must be greater than zero.',
      ]),
    );
    expect(readModel.subscriptionRedemptionTemplate.canGenerateTemplateParameters).toBe(false);
  });

  it('marks subscription parameters ready when stablecoin, window, payment address, and token price are valid', () => {
    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      subscriptionParameters: {
        permittedStablecoins: ['USDC', 'USDT'],
        subscriptionWindow: 'Monthly window: first five business days',
        minimumSubscriptionAmount: '25000',
        paymentAddress: firstWallet,
        paymentPerToken: '1.025',
      },
    });

    expect(readModel.subscription.status).toBe('ready');
    expect(readModel.subscription.statusLabel).toBe('Subscription: Ready for template');
    expect(readModel.subscription.validationMessages).toEqual([]);
    expect(readModel.subscription.normalizedPermittedStablecoins).toEqual(['USDC', 'USDT']);
  });

  it('marks redemption parameters ready only after delay, wallet, payout asset, and payout price are valid', () => {
    const draftReadModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      redemptionParameters: {
        redemptionWindow: 'Quarterly redemption date',
        redemptionDelayUnit: 'days',
        redemptionDelayValue: 0,
        redemptionWalletAddress: secondWallet,
        payoutStablecoin: 'USDC',
        payoutPerToken: '1.03',
      },
    });

    expect(draftReadModel.redemption.status).toBe('draft');
    expect(draftReadModel.redemption.validationMessages).toContain('Redemption delay duration must be greater than zero.');

    const readyReadModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      redemptionParameters: {
        redemptionWindow: 'Quarterly redemption date',
        redemptionDelayUnit: 'days',
        redemptionDelayValue: 14,
        redemptionWalletAddress: secondWallet,
        payoutStablecoin: 'usdc',
        payoutPerToken: '1.03',
      },
    });

    expect(readyReadModel.redemption.status).toBe('ready');
    expect(readyReadModel.redemption.statusDetail).toBe('Redemption delay configured: 14 days.');
    expect(readyReadModel.redemption.validationMessages).toEqual([]);
  });

  it('creates a ready subscription-redemption template handoff only from current valid lifecycle state', () => {
    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      subscriptionParameters: {
        permittedStablecoins: ['USDC'],
        subscriptionWindow: 'Monthly subscriptions',
        minimumSubscriptionAmount: '10000',
        paymentAddress: firstWallet,
        paymentPerToken: '1.02',
      },
      redemptionParameters: {
        redemptionWindow: 'Quarterly redemptions',
        redemptionDelayUnit: 'hours',
        redemptionDelayValue: 72,
        redemptionWalletAddress: secondWallet,
        payoutStablecoin: 'usdc',
        payoutPerToken: '1.01',
      },
    });

    expect(readModel.subscriptionRedemptionTemplate.status).toBe('ready');
    expect(readModel.subscriptionRedemptionTemplate.canGenerateTemplateParameters).toBe(true);
    expect(readModel.subscriptionRedemptionTemplate.parameterSummary).toMatchObject({
      permittedStablecoins: ['USDC'],
      subscriptionWindow: 'Monthly subscriptions',
      minimumSubscriptionAmount: '10000',
      paymentAddress: firstWallet,
      paymentPerToken: '1.02',
      redemptionWindow: 'Quarterly redemptions',
      redemptionDelay: '72 hours',
      redemptionWalletAddress: secondWallet,
      payoutStablecoin: 'USDC',
      payoutPerToken: '1.01',
    });

    const editedReadModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      subscriptionParameters: {
        ...createInitialMila26LifecycleState().subscriptionParameters,
        permittedStablecoins: ['USDC'],
      },
      redemptionParameters: {
        redemptionWindow: 'Quarterly redemptions',
        redemptionDelayUnit: 'hours',
        redemptionDelayValue: 72,
        redemptionWalletAddress: secondWallet,
        payoutStablecoin: 'USDC',
        payoutPerToken: '1.01',
      },
    });

    expect(editedReadModel.subscriptionRedemptionTemplate.status).toBe('draft');
    expect(editedReadModel.subscriptionRedemptionTemplate.canGenerateTemplateParameters).toBe(false);
  });

  it('keeps Allocation / Mint locked until Investor Registry and Subscription are coherent', () => {
    const readModel = toMila26LifecycleReadModel({
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [
        createInvestorRegistryEntry({
          id: 'investor-wallet-1',
          walletAddress: firstWallet,
        }),
      ],
      allocationMintParameters: {
        targetWalletAddress: firstWallet,
        tokenAmount: '1000',
      },
    });

    expect(readModel.investorRegistry.status).toBe('ready');
    expect(readModel.subscription.status).toBe('needs_parameters');
    expect(readModel.allocationMint.status).toBe('locked_for_later');
    expect(readModel.allocationMint.canReviewAllocationMint).toBe(false);
    expect(readModel.allocationMint.blockingReasons).toContain('Complete Subscription parameters before Allocation / Mint.');
  });

  it('validates Allocation / Mint target wallet and token amount against shared lifecycle state', () => {
    const baseState = {
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [
        createInvestorRegistryEntry({
          id: 'investor-wallet-1',
          walletAddress: firstWallet,
        }),
      ],
      subscriptionParameters: {
        permittedStablecoins: ['USDC'],
        subscriptionWindow: 'Monthly subscriptions',
        minimumSubscriptionAmount: '10000',
        paymentAddress: secondWallet,
        paymentPerToken: '1.02',
      },
    };

    const draftReadModel = toMila26LifecycleReadModel({
      ...baseState,
      allocationMintParameters: {
        targetWalletAddress: '0x9999999999999999999999999999999999999999',
        tokenAmount: '0',
      },
    });

    expect(draftReadModel.allocationMint.status).toBe('draft');
    expect(draftReadModel.allocationMint.validationMessages).toEqual(
      expect.arrayContaining([
        'Select a wallet from Investor Registry before Allocation / Mint.',
        'Token allocation amount must be greater than zero.',
      ]),
    );

    const readyReadModel = toMila26LifecycleReadModel({
      ...baseState,
      allocationMintParameters: {
        targetWalletAddress: firstWallet,
        tokenAmount: '1250.5',
      },
    });

    expect(readyReadModel.allocationMint.status).toBe('ready');
    expect(readyReadModel.allocationMintStatus).toBe('ready');
    expect(readyReadModel.allocationMint.canReviewAllocationMint).toBe(true);
    expect(readyReadModel.allocationMint.statusDetail).toBe(`Allocation ready for 1250.5 token(s) to ${firstWallet}.`);
    expect(readyReadModel.allocationMint.validationMessages).toEqual([]);
  });
});
