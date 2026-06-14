import { describe, expect, it } from 'vitest';
import {
  classifyWalletSetupResponse,
  acknowledgeProductSetupDeploymentWarnings,
  confirmProductSetupUpdate,
  createProductSetupPackMarkdown,
  createInitialProductSetupRecord,
  createProductSetupSuggestionsFromStructuredUpdates,
  createProductSetupSuggestionsFromText,
  createUnsupportedRequirementDecisionsFromText,
  deferProductSetupField,
  handleProductSetupWalletInput,
  markTermExplained,
  normalizeProductSetupRecord,
  recommendProductSetupProtocol,
  reviewProductSetupHandoffNote,
  setUnsupportedRequirementDecisions,
  setProductSetupSuggestedUpdates,
  sendProductSetupHandoffNote,
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
    const protocolTargetRow = readModel.profileRows.find((row) => row.id === 'protocol_target');

    expect(record.fields.product_name.status).toBe('missing');
    expect(record.fields.product_name.value).toBeUndefined();
    expect(record.fields.token_symbol.status).toBe('missing');
    expect(record.fields.token_symbol.value).toBeUndefined();
    expect(record.fields.product_type.status).toBe('missing');
    expect(record.fields.product_type.value).toBeUndefined();
    expect(record.fields.base_currency.status).toBe('missing');
    expect(record.fields.base_currency.value).toBeUndefined();
    expect(record.fields.investor_wallet_rule.status).toBe('missing');
    expect(record.fields.investor_wallet_rule.value).toBeUndefined();
    expect(record.fields.protocol_base.status).toBe('missing');
    expect(record.fields.protocol_base.value).toBeUndefined();
    expect(protocolTargetRow).toMatchObject({ value: 'To be filled', provenanceLabel: 'Missing' });
  });

  it('normalizes old starter identity defaults back to missing Product Setup inputs', () => {
    const legacyRecord = createInitialProductSetupRecord(facts);
    legacyRecord.fields.product_name = {
      ...legacyRecord.fields.product_name,
      value: 'MILA Income Fund',
      status: 'system_default',
      sourceType: 'system_default',
      sourceRef: 'starter_facts',
    };
    legacyRecord.fields.token_symbol = {
      ...legacyRecord.fields.token_symbol,
      value: 'MILA',
      status: 'system_default',
      sourceType: 'system_default',
      sourceRef: 'starter_facts',
    };

    const normalized = normalizeProductSetupRecord(legacyRecord);

    expect(normalized.fields.product_name).toMatchObject({
      status: 'missing',
      value: undefined,
      sourceType: undefined,
      sourceRef: undefined,
      confirmedByUser: false,
    });
    expect(normalized.fields.token_symbol).toMatchObject({
      status: 'missing',
      value: undefined,
      sourceType: undefined,
      sourceRef: undefined,
      confirmedByUser: false,
    });
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

  it('extracts monthly subscription and redemption cadence from natural entry and exit wording', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'I want to create a tokenised product to distribute to 24 investors. New investors can come in on a monthly basis. Existing investors can sell out on the same monthly basis too.',
      'chat_turn_entry_exit',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('expected_investor_count')).toBe(24);
    expect(byField.get('subscription_cadence')).toBe('Monthly');
    expect(byField.get('redemption_cadence')).toBe('Monthly');
  });

  it('extracts named product setup details from a richer Product Setup answer', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'The product name is MILA and symbol is MIA. It is a pooled fund with USD as a base currency. New and existing investors can buy on a quarterly basis after launch. Before launch i.e. "IPO", an initial register of 27 investors will be book build and tokens distributed to them on IPO date tentatively on 8 Nov 2026. NAV is monthly. Income payout is quarterly.',
      'chat_turn_rich_setup',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('product_name')).toBe('MILA');
    expect(byField.get('token_symbol')).toBe('MIA');
    expect(byField.get('product_type')).toBe('Pooled Fund');
    expect(byField.get('base_currency')).toBe('USD');
    expect(byField.get('expected_investor_count')).toBe(27);
    expect(byField.get('subscription_cadence')).toBe('Quarterly');
    expect(byField.get('nav_cadence')).toBe('Monthly');
    expect(byField.get('income_payout_cadence')).toBe('Quarterly');
    expect(byField.get('initial_distribution_date')).toBe('2026-11-08');
    expect(String(byField.get('initial_investor_register_rule'))).toMatch(/initial register of 27 investors/i);
  });

  it('extracts base currency, maturity term, and approved-wallet rule from direct answers', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'The base currency is usd. Maturity is 3 years after launch. Yes, approved wallets only.',
      'chat_turn_direct_answers',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('base_currency')).toBe('USD');
    expect(byField.get('maturity_date')).toBe('3 years after launch');
    expect(byField.get('whitelisted_wallets_required')).toBe(true);
    expect(byField.get('investor_wallet_rule')).toMatch(/Approved wallets only/i);
  });

  it('splits combined subscription and redemption cadence into both canonical fields', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Subscription/redemption cadence: quarterly post-IPO.',
      'chat_turn_combined_cadence',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('subscription_cadence')).toBe('Quarterly');
    expect(byField.get('redemption_cadence')).toBe('Quarterly');
  });

  it('normalizes structured backend suggestions and shows pending profile values without mutating fields', () => {
    const record = createInitialProductSetupRecord(facts);
    const withSuggestions = setProductSetupSuggestedUpdates(
      record,
      createProductSetupSuggestionsFromStructuredUpdates(
        [
          {
            field: 'subscription/redemption cadence',
            proposedValue: 'Quarterly',
            rationale: 'The assistant extracted a shared cadence from the latest message.',
            confidence: 0.82,
          },
          {
            field: 'maturity',
            proposedValue: '3 years after launch',
            rationale: 'The assistant extracted a maturity term.',
            confidence: 0.86,
          },
        ],
        'chat_turn_structured',
      ),
    );
    const readModel = toProductSetupReadModel(withSuggestions);
    const subscriptionRow = readModel.profileRows.find((row) => row.id === 'subscription_switch');
    const redemptionRow = readModel.profileRows.find((row) => row.id === 'redemption_switch');
    const termRow = readModel.profileRows.find((row) => row.id === 'term');

    expect(withSuggestions.fields.subscription_cadence.status).toBe('missing');
    expect(subscriptionRow).toMatchObject({ value: 'Enabled: Quarterly', provenanceLabel: 'Needs review' });
    expect(redemptionRow).toMatchObject({ value: 'Enabled: Quarterly', provenanceLabel: 'Needs review' });
    expect(termRow).toMatchObject({ value: '3 years after launch', provenanceLabel: 'Needs review' });
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

  it('clusters operational Product Setup facts into downstream draft handoffs without mutating target tabs', () => {
    let record = createInitialProductSetupRecord(facts);
    record = updateProductSetupField(record, {
      fieldKey: 'subscription_stablecoins',
      value: ['USDC'],
      sourceType: 'user_message',
      sourceRef: 'chat_turn_handoff',
    });
    record = updateProductSetupField(record, {
      fieldKey: 'redemption_cadence',
      value: 'Quarterly',
      sourceType: 'user_message',
      sourceRef: 'chat_turn_handoff',
    });

    const readModel = toProductSetupReadModel(record);
    const subscriptionHandoff = readModel.downstreamHandoffs.find((handoff) => handoff.target === 'subscription');
    const redemptionHandoff = readModel.downstreamHandoffs.find((handoff) => handoff.target === 'redemption');

    expect(subscriptionHandoff).toMatchObject({
      status: 'draft_note_ready',
      title: 'Subscription mechanics',
    });
    expect(subscriptionHandoff?.detail).toContain('Subscription stablecoins: USDC');
    expect(redemptionHandoff?.detail).toContain('Redemption cadence: Quarterly');

    const sent = sendProductSetupHandoffNote(record, subscriptionHandoff!.id);
    expect(sent.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)).toMatchObject({
      target: 'subscription',
      status: 'sent_as_draft_note',
    });

    const reviewed = reviewProductSetupHandoffNote(sent, subscriptionHandoff!.id);
    expect(reviewed.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)).toMatchObject({
      target: 'subscription',
      status: 'reviewed_in_target_tab',
    });
  });

  it('recommends ERC-3643 for whitelisted wallet products and keeps executable prototype caveat visible', () => {
    const record = updateProductSetupField(createInitialProductSetupRecord(facts), {
      fieldKey: 'whitelisted_wallets_required',
      value: true,
      sourceType: 'user_message',
      sourceRef: 'chat_turn_whitelist',
      status: 'user_stated',
    });
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
