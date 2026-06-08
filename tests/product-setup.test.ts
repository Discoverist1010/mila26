import { describe, expect, it } from 'vitest';
import {
  classifyWalletSetupResponse,
  confirmProductSetupUpdate,
  createInitialProductSetupRecord,
  createProductSetupSuggestionsFromText,
  deferProductSetupField,
  markTermExplained,
  recommendProductSetupProtocol,
  setProductSetupSuggestedUpdates,
  toProductSetupReadModel,
} from '../src/domain/productSetup';
import type { FundFacts } from '../src/domain/schemas';

const facts: FundFacts = {
  fundName: 'MILA Income Fund',
  tokenSymbol: 'MILA',
  jurisdiction: 'Singapore',
  targetInvestors: 'Accredited investors',
  totalSupply: 1_000_000,
  initialNav: 1_000_000,
};

describe('Product Setup record', () => {
  it('extracts suggestions from unstructured chat without mutating confirmed fields', () => {
    const record = createInitialProductSetupRecord(facts);
    const suggestions = createProductSetupSuggestionsFromText(
      'Private credit portfolio for 25 investors, USDC subscriptions, whitelisted wallets, quarterly redemption, payout may take 10 business days.',
      'chat_turn_1',
    );
    const withSuggestions = setProductSetupSuggestedUpdates(record, suggestions);

    expect(withSuggestions.pendingSuggestedUpdates.map((update) => update.fieldKey)).toEqual(
      expect.arrayContaining([
        'expected_investor_count',
        'subscription_stablecoins',
        'whitelisted_wallets_required',
        'redemption_schedule',
        'redemption_payout_delay',
      ]),
    );
    expect(withSuggestions.fields.expected_investor_count.status).toBe('missing');
  });

  it('promotes a suggested field only after user confirmation', () => {
    const record = setProductSetupSuggestedUpdates(
      createInitialProductSetupRecord(facts),
      createProductSetupSuggestionsFromText('25 investors and USDC subscriptions.', 'chat_turn_2'),
    );
    const investorUpdate = record.pendingSuggestedUpdates.find((update) => update.fieldKey === 'expected_investor_count');

    expect(investorUpdate).toBeDefined();
    const confirmed = confirmProductSetupUpdate(record, investorUpdate!.id);

    expect(confirmed.fields.expected_investor_count.status).toBe('user_confirmed');
    expect(confirmed.fields.expected_investor_count.value).toBe(25);
    expect(confirmed.pendingSuggestedUpdates.some((update) => update.id === investorUpdate!.id)).toBe(false);
  });

  it('recommends ERC-3643 for whitelisted wallet products and keeps executable prototype caveat visible', () => {
    const record = createInitialProductSetupRecord(facts);
    const recommendation = recommendProductSetupProtocol(record);

    expect(recommendation.recommendedProtocol).toBe('ERC-3643');
    expect(recommendation.reasons.join(' ')).toMatch(/Whitelisted wallets/i);
    expect(recommendation.executablePrototypeLabel).toMatch(/Sepolia restricted ERC-20-compatible/i);
  });

  it('tracks just-in-time term explanation state without requiring repeated long-form prompts later', () => {
    const once = markTermExplained(createInitialProductSetupRecord(facts), 'admin_wallet');
    const twice = markTermExplained(once, 'admin_wallet');

    expect(twice.termExplanations.admin_wallet.timesShown).toBe(2);
    expect(toProductSetupReadModel(twice).firstTimePrompts[0].prompt).toMatch(/private key, seed phrase, or recovery phrase/i);
  });

  it('records safe deferrals instead of forcing every field before the user can continue', () => {
    const deferred = deferProductSetupField(createInitialProductSetupRecord(facts), 'admin_wallet');
    const readModel = toProductSetupReadModel(deferred);

    expect(deferred.fields.admin_wallet.status).toBe('deferred');
    expect(readModel.packPreview.canDownloadDraft).toBe(true);
  });

  it('classifies wallet follow-up responses by intent', () => {
    expect(classifyWalletSetupResponse('0x1111111111111111111111111111111111111111')).toBe('address');
    expect(classifyWalletSetupResponse('Issuer operations wallet')).toBe('role_placeholder');
    expect(classifyWalletSetupResponse('not sure yet')).toBe('not_sure');
    expect(classifyWalletSetupResponse('')).toBe('invalid');
  });
});
