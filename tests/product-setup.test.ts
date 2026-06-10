import { describe, expect, it } from 'vitest';
import {
  classifyWalletSetupResponse,
  acknowledgeProductSetupDeploymentWarnings,
  confirmProductSetupUpdate,
  createProductSetupPackMarkdown,
  createInitialProductSetupRecord,
  createProductSetupSuggestionsFromText,
  createUnsupportedRequirementDecisionsFromText,
  deferProductSetupField,
  handleProductSetupWalletInput,
  markTermExplained,
  recommendProductSetupProtocol,
  setUnsupportedRequirementDecisions,
  setProductSetupSuggestedUpdates,
  toProductSetupReadModel,
  updateProductSetupField,
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
        'redemption_cadence',
        'redemption_schedule',
        'redemption_payout_delay',
      ]),
    );
    expect(withSuggestions.fields.expected_investor_count.status).toBe('missing');
  });

  it('starts protocol base blank while still offering a separate protocol recommendation', () => {
    const record = createInitialProductSetupRecord(facts);
    const readModel = toProductSetupReadModel(record);

    expect(record.fields.protocol_base.status).toBe('missing');
    expect(record.fields.protocol_base.value).toBeUndefined();
    expect(readModel.protocolRecommendation.recommendedProtocol).toBe('ERC-3643');
  });

  it('extracts cadence fields from Product Setup conversation without cross-attaching unrelated cadence', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'I want to tokenise an investment fund and distribute to 33 investors. Valuation will be monthly. Subscribe and redeem monthly. On-chain distribution monthly too.',
      'chat_turn_cadence',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('expected_investor_count')).toBe(33);
    expect(byField.get('nav_cadence')).toBe('Monthly');
    expect(byField.get('subscription_cadence')).toBe('Monthly');
    expect(byField.get('redemption_cadence')).toBe('Monthly');
    expect(byField.get('income_payout_cadence')).toBe('Monthly');
    expect(byField.has('redemption_payout_cadence')).toBe(false);
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
    expect(classifyWalletSetupResponse('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe('unsafe_secret');
    expect(classifyWalletSetupResponse('')).toBe('invalid');
  });

  it('accepts public wallet addresses but rejects private-key-shaped wallet input', () => {
    const record = createInitialProductSetupRecord(facts);
    const accepted = handleProductSetupWalletInput(record, 'admin_wallet', '0x1111111111111111111111111111111111111111');
    const rejected = handleProductSetupWalletInput(
      accepted.record,
      'redemption_wallet',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    );

    expect(accepted.classification).toBe('address');
    expect(accepted.record.fields.admin_wallet.status).toBe('user_confirmed');
    expect(rejected.classification).toBe('unsafe_secret');
    expect(rejected.record.fields.redemption_wallet.status).toBe('missing');
  });

  it('shows deployment warnings and records an explicit proceed-with-warnings decision', () => {
    const record = updateProductSetupField(createInitialProductSetupRecord(facts), {
      fieldKey: 'subscription_stablecoins',
      value: ['USDC'],
      sourceType: 'direct_form_input',
      sourceRef: 'test',
    });
    const readModel = toProductSetupReadModel(record);

    expect(readModel.deploymentWarnings.map((warning) => warning.fieldKey)).toEqual(
      expect.arrayContaining(['admin_wallet', 'subscription_receiving_wallet', 'redemption_wallet', 'burn_lock_rule']),
    );
    expect(readModel.hasUnacknowledgedDeploymentWarnings).toBe(true);

    const acknowledged = acknowledgeProductSetupDeploymentWarnings(record, 'test_ack');
    const acknowledgedReadModel = toProductSetupReadModel(acknowledged);

    expect(acknowledged.deploymentWarningAcknowledgements).toHaveLength(1);
    expect(acknowledgedReadModel.hasUnacknowledgedDeploymentWarnings).toBe(false);
  });

  it('does not treat an empty deployment default as ready', () => {
    const record = createInitialProductSetupRecord(facts);
    const withoutNetworkValue = {
      ...record,
      fields: {
        ...record.fields,
        prototype_network: {
          ...record.fields.prototype_network,
          value: undefined,
          status: 'system_default' as const,
        },
      },
    };

    expect(toProductSetupReadModel(withoutNetworkValue).deploymentWarnings.map((warning) => warning.fieldKey)).toContain(
      'prototype_network',
    );
  });

  it('captures unsupported custom requirements from messy product notes', () => {
    const decisions = createUnsupportedRequirementDecisionsFromText(
      'Investors can buy-sell from each other peer to peer and I want conditional transfers with clawback.',
      'chat_turn_custom',
    );
    const record = setUnsupportedRequirementDecisions(createInitialProductSetupRecord(facts), decisions);

    expect(record.unsupportedRequirementDecisions.map((decision) => decision.requirement)).toEqual(
      expect.arrayContaining([
        'Investor peer-to-peer transfer and settlement workflow',
        'Conditional transfers with clawback',
      ]),
    );
  });

  it('generates a Product Setup Pack with definitions, protocol fit, provenance, and unsupported decisions', () => {
    const record = setUnsupportedRequirementDecisions(
      createInitialProductSetupRecord(facts),
      createUnsupportedRequirementDecisionsFromText('I need conditional transfer with clawback.', 'chat_turn_pack'),
    );
    const markdown = createProductSetupPackMarkdown(record);

    expect(markdown).toContain('# ZiLi-OS Product Setup Pack');
    expect(markdown).toContain('## Definitions Used In This Product Setup');
    expect(markdown).toContain('Recommended architecture target');
    expect(markdown).toContain('Current executable prototype');
    expect(markdown).toContain('Conditional transfers with clawback');
  });
});
