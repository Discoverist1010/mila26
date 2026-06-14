/* @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest';
import {
  createInMemoryWorkspacePersistenceRepository,
  WorkspacePersistenceValidationError,
  type WorkspacePersistenceRepository,
} from '../server/persistence/workspacePersistenceRepository';
import { ProductSetupRecordPersistenceSchema } from '../server/contracts/workspacePersistence';
import { createInitialMila26LifecycleState, createInvestorRegistryEntry } from '../src/domain/lifecycleState';
import { createInitialProductSetupRecord } from '../src/domain/productSetup';

const firstWallet = '0x1111111111111111111111111111111111111111';
const secondWallet = '0x2222222222222222222222222222222222222222';

let repositories: WorkspacePersistenceRepository[] = [];

function createRepository() {
  const repository = createInMemoryWorkspacePersistenceRepository();
  repositories.push(repository);
  return repository;
}

afterEach(() => {
  repositories.forEach((repository) => repository.close());
  repositories = [];
});

describe('workspace persistence repository', () => {
  it('persists versioned lifecycle snapshots and investor wallet rows', () => {
    const repository = createRepository();
    const lifecycleState = {
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [
        createInvestorRegistryEntry({
          id: 'investor-wallet-1',
          label: 'Investor 01',
          walletAddress: firstWallet,
        }),
        createInvestorRegistryEntry({
          id: 'investor-wallet-2',
          label: 'Investor 02',
          walletAddress: secondWallet,
        }),
      ],
      subscriptionParameters: {
        permittedStablecoins: ['USDC'],
        subscriptionWindow: 'Monthly',
        minimumSubscriptionAmount: '25000',
        paymentAddress: firstWallet,
        paymentPerToken: '1.025',
      },
    };
    const productSetupRecord = createInitialProductSetupRecord({
      fundName: 'Alpha Income Fund I',
      tokenSymbol: 'ALPHA',
      jurisdiction: 'Singapore',
      targetInvestors: 'Accredited investors',
      totalSupply: 1_000_000,
      initialNav: 1,
    });
    productSetupRecord.fields.expected_investor_count = {
      ...productSetupRecord.fields.expected_investor_count,
      value: 2,
      status: 'user_confirmed',
      sourceType: 'user_confirmation',
      sourceRef: 'test_confirmation',
      confidence: 0.95,
      confirmedByUser: true,
    };

    const firstSave = repository.saveWorkspaceSnapshot({
      projectId: 'alpha-income-fund',
      projectName: 'Alpha Income Fund I',
      lifecycleState,
      source: 'user_action',
    });
    const secondSave = repository.saveWorkspaceSnapshot({
      projectId: 'alpha-income-fund',
      projectName: 'Alpha Income Fund I',
      lifecycleState: {
        ...lifecycleState,
        redemptionParameters: {
          redemptionWindow: 'Quarterly',
          redemptionDelayUnit: 'days',
          redemptionDelayValue: 14,
          redemptionWalletAddress: secondWallet,
          payoutStablecoin: 'USDC',
          payoutPerToken: '1.03',
        },
      },
      productSetupRecord,
      source: 'user_action',
    });

    expect(firstSave.snapshot.version).toBe(1);
    expect(secondSave.snapshot.version).toBe(2);
    expect(secondSave.project.investorCap).toBe(50);
    expect(secondSave.investorWallets).toHaveLength(2);
    expect(secondSave.investorWallets[0]).toMatchObject({
      id: 'investor-wallet-1',
      label: 'Investor 01',
      walletAddress: firstWallet,
      normalizedWalletAddress: firstWallet.toLowerCase(),
      validationStatus: 'valid',
      status: 'ready_to_whitelist',
      source: 'manual',
    });

    expect(repository.loadLatestWorkspace('alpha-income-fund')).toMatchObject({
      snapshot: {
        version: 2,
        lifecycleState: {
          redemptionParameters: {
            redemptionDelayValue: 14,
          },
        },
        productSetupRecord: {
          fields: {
            expected_investor_count: {
              value: 2,
              status: 'user_confirmed',
              confirmedByUser: true,
            },
          },
        },
      },
    });
  });

  it('rejects duplicate investor wallet addresses before storing ambiguous registry state', () => {
    const repository = createRepository();
    const existing = createInvestorRegistryEntry({
      id: 'investor-wallet-1',
      walletAddress: firstWallet,
    });

    expect(() =>
      repository.saveWorkspaceSnapshot({
        projectId: 'alpha-income-fund',
        projectName: 'Alpha Income Fund I',
        lifecycleState: {
          ...createInitialMila26LifecycleState(),
          investorRegistryEntries: [
            existing,
            createInvestorRegistryEntry({
              id: 'investor-wallet-2',
              walletAddress: firstWallet.toUpperCase(),
              existingEntries: [existing],
            }),
          ],
        },
        source: 'user_action',
      }),
    ).toThrow(WorkspacePersistenceValidationError);
  });

  it('defaults Sprint 16B Product Setup fields when loading an older persisted record shape', () => {
    const legacyRecord = JSON.parse(
      JSON.stringify(
        createInitialProductSetupRecord({
          fundName: 'Alpha Income Fund I',
          tokenSymbol: 'ALPHA',
          jurisdiction: 'Singapore',
          targetInvestors: 'Accredited investors',
          totalSupply: 1_000_000,
          initialNav: 1,
        }),
      ),
    ) as {
      fields: Record<string, unknown>;
      deploymentWarningAcknowledgements?: unknown;
    };

    delete legacyRecord.fields.investor_wallet_rule;
    delete legacyRecord.fields.token_symbol;
    delete legacyRecord.fields.income_treatment;
    delete legacyRecord.fields.subscription_cadence;
    delete legacyRecord.fields.subscription_receiving_wallet;
    delete legacyRecord.fields.redemption_cadence;
    delete legacyRecord.fields.income_payout_cadence;
    delete legacyRecord.fields.redemption_payout_cadence;
    delete legacyRecord.fields.nav_cadence;
    delete legacyRecord.fields.nav_source;
    delete legacyRecord.fields.investor_update_rule;
    delete legacyRecord.fields.maturity_date;
    delete legacyRecord.fields.maturity_closeout_rule;
    delete legacyRecord.deploymentWarningAcknowledgements;

    const parsed = ProductSetupRecordPersistenceSchema.parse(legacyRecord);

    expect(parsed.fields.subscription_receiving_wallet).toMatchObject({
      key: 'subscription_receiving_wallet',
      status: 'missing',
      usedByTabs: ['Subscription', 'Contract Ops', 'Evidence Vault'],
    });
    expect(parsed.fields.investor_wallet_rule).toMatchObject({
      key: 'investor_wallet_rule',
      status: 'missing',
    });
    expect(parsed.fields.token_symbol).toMatchObject({
      key: 'token_symbol',
      status: 'missing',
      usedByTabs: ['Overview', 'Contract Ops', 'Evidence Vault'],
    });
    expect(parsed.fields.nav_cadence.status).toBe('missing');
    expect(parsed.fields.subscription_cadence.status).toBe('missing');
    expect(parsed.fields.redemption_cadence.status).toBe('missing');
    expect(parsed.fields.income_treatment).toMatchObject({
      key: 'income_treatment',
      status: 'missing',
      usedByTabs: ['Product Setup', 'Asset Servicing', 'Evidence Vault'],
    });
    expect(parsed.fields.income_payout_cadence.status).toBe('missing');
    expect(parsed.fields.redemption_payout_cadence.status).toBe('missing');
    expect(parsed.fields.maturity_closeout_rule.status).toBe('missing');
    expect(parsed.deploymentWarningAcknowledgements).toEqual([]);
  });

  it('stores a full 50-wallet registry without exceeding the investor cap', () => {
    const repository = createRepository();
    const investorRegistryEntries = Array.from({ length: 50 }, (_, index) =>
      createInvestorRegistryEntry({
        id: `investor-wallet-${index + 1}`,
        walletAddress: `0x${(index + 1).toString(16).padStart(40, '0')}`,
      }),
    );

    const record = repository.saveWorkspaceSnapshot({
      projectId: 'full-registry',
      projectName: 'Full Registry',
      lifecycleState: {
        ...createInitialMila26LifecycleState(),
        investorRegistryEntries,
      },
      source: 'user_action',
    });

    expect(record.investorWallets).toHaveLength(50);
    expect(record.snapshot.investorWalletCount).toBe(50);
  });
});
