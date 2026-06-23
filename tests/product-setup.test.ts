import { describe, expect, it } from 'vitest';
import {
  applyProductSetupHandoffSuggestion,
  classifyWalletSetupResponse,
  acknowledgeProductSetupDeploymentWarnings,
  confirmProductSetupUpdate,
  createProductSetupPrdArtifactKey,
  createProductSetupPackMarkdown,
  createProductSetupPrdDocxContent,
  createInitialProductSetupRecord,
  createProductSetupSuggestionsFromStructuredUpdates,
  createProductSetupSuggestionsFromText,
  createUnsupportedRequirementDecisionsFromText,
  decideUnsupportedRequirement,
  deferProductSetupField,
  dismissProductSetupHandoffSuggestion,
  handleProductSetupWalletInput,
  markTermExplained,
  mergeProductSetupSuggestedUpdates,
  normalizeProductSetupRecord,
  PRODUCT_SETUP_PRD_GENERATOR_VERSION,
  productSetupPrdFieldKeys,
  recommendProductSetupProtocol,
  reconcileProductSetupIntake,
  reconcileProductSetupSuggestedUpdates,
  reviewProductSetupHandoffNote,
  setUnsupportedRequirementDecisions,
  setProductSetupSuggestedUpdates,
  sendProductSetupHandoffNote,
  toProductSetupReadModel,
  updateProductSetupField,
  type ProductSetupFieldKey,
  type ProductSetupFieldValue,
  type ProductSetupRecord,
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

function createCompleteProductSetupRecord(): ProductSetupRecord {
  const fieldValues: Partial<Record<ProductSetupFieldKey, ProductSetupFieldValue>> = {
    product_name: 'MERIDIAN Growth Fund',
    token_symbol: 'MGF',
    product_launch_date: '2027-04-01',
    product_wrapper: 'Fund',
    underlying_asset_class: 'Fixed income (bonds)',
    product_structure: 'Closed-ended',
    offering_type: 'Private placement',
    eligible_investor_type: 'Accredited investors',
    maximum_investor_count: 30,
    nav_cadence: 'Monthly',
    nav_price_assumption: '$1 per token',
    nav_upload_timing: '1 day before subscription day',
    subscription_cadence: 'Monthly',
    subscription_window: 'Opens 2 weeks before launch date; closes launch date',
    subscription_payment_method: 'Fiat offchain',
    minimum_subscription_amount: '$10,000',
    redemption_cadence: 'Monthly',
    redemption_payment_method: 'Fiat offchain',
    income_treatment: 'Distributing',
    income_payout_cadence: 'Monthly',
    income_payout_timing: '1 day before redemption date',
    duration_months: 24,
    base_currency: 'USD',
    whitelisted_wallets_required: true,
    p2p_transfer_allowed: true,
    protocol_base: 'Customised ERC-20',
  };

  return Object.entries(fieldValues).reduce(
    (record, [fieldKey, value]) =>
      updateProductSetupField(record, {
        fieldKey: fieldKey as ProductSetupFieldKey,
        value,
        sourceType: 'user_message',
        sourceRef: 'test_complete_prd',
        status: 'user_confirmed',
      }),
    createInitialProductSetupRecord(facts),
  );
}

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
        'redemption_payout_delay',
      ]),
    );
    expect(withSuggestions.fields.expected_investor_count.status).toBe('missing');
  });

  it('starts protocol base blank while still offering a separate protocol recommendation', () => {
    const record = createInitialProductSetupRecord(facts);
    const readModel = toProductSetupReadModel(record);
    const protocolTargetRow = readModel.profileRows.find((row) => row.id === 'protocol_base');

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
    expect(protocolTargetRow).toMatchObject({ value: 'Customised ERC-20 recommended; not selected', provenanceLabel: 'Needs review' });
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
    expect(byField.get('income_treatment')).toBe('Distributing');
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
    expect(byField.get('income_treatment')).toBe('Distributing');
    expect(byField.get('income_payout_cadence')).toBe('Quarterly');
    expect(byField.get('initial_distribution_date')).toBe('2026-11-08');
    expect(String(byField.get('initial_investor_register_rule'))).toMatch(/initial register of 27 investors/i);
  });

  it('keeps the Product Profile in sync with a multi-turn Product Setup transcript', () => {
    const transcript = [
      'i want to create a tokenised fund to be distributed to 23 investors. the fund name is TEST and symbol is TST. the launch date is 8 Nov 2026 and will run as a close-ended fund for 3 years. what else do you need to draft the prd and start creating this tokenised product?',
      'the base currency is SGD. subscription is one time at launch and then on a quarterly basis. redemption starts 3 months after launch date and runs on a quarterly basis too. income will be distirbuted as dividend quarterly, before redemption begins. NAV is uploaded monthly.',
      'the underlying asset class is a portfolio while the product term is close-ended',
      'yes product display name is TEST. product type is portfolio and the maturity is correct. the nav will be provided by myself.',
    ];
    const record = transcript.reduce((currentRecord, message, index) => {
      const suggestions = createProductSetupSuggestionsFromText(message, `chat_turn_transcript_${index + 1}`);
      return reconcileProductSetupSuggestedUpdates(currentRecord, suggestions).record;
    }, createInitialProductSetupRecord(facts));
    const readModel = toProductSetupReadModel(record);
    const rowsById = new Map(readModel.profileRows.map((row) => [row.id, row]));

    expect(record.fields.product_name).toMatchObject({ value: 'TEST', status: 'user_stated' });
    expect(record.fields.token_symbol).toMatchObject({ value: 'TST', status: 'user_stated' });
    expect(record.fields.product_launch_date).toMatchObject({ value: '2026-11-08', status: 'user_stated' });
    expect(record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(record.fields.underlying_asset_class).toMatchObject({ value: 'Portfolio', status: 'user_stated' });
    expect(record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(record.fields.product_type).toMatchObject({ value: 'Portfolio', status: 'user_stated' });
    expect(record.fields.base_currency).toMatchObject({ value: 'SGD', status: 'user_stated' });
    expect(record.fields.subscription_cadence).toMatchObject({ value: 'One-time at launch, then Quarterly', status: 'user_stated' });
    expect(record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(record.fields.redemption_schedule).toMatchObject({ value: 'Starts 3 months after launch date', status: 'user_stated' });
    expect(record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(record.fields.income_payout_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(record.fields.nav_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(record.fields.nav_source).toMatchObject({ value: 'User-provided upload', status: 'user_stated' });
    expect(record.fields.duration_months).toMatchObject({ value: 36, status: 'user_stated' });
    expect(record.fields.derived_maturity_date).toMatchObject({ value: '2029-11-08', status: 'system_default' });
    expect(record.fields.maturity_date.status).toBe('missing');

    expect(rowsById.get('product_name')).toMatchObject({ value: 'TEST', provenanceLabel: 'Stated' });
    expect(rowsById.get('product_structure')).toMatchObject({ value: 'Closed-ended', provenanceLabel: 'Stated' });
    expect(rowsById.get('subscription_cadence')).toMatchObject({ value: 'One-time at launch, then Quarterly', provenanceLabel: 'Stated' });
    expect(rowsById.get('redemption_cadence')).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Stated' });
    expect(rowsById.get('duration_months')).toMatchObject({ value: '36 months', provenanceLabel: 'Stated' });
    expect(rowsById.get('derived_maturity_date')).toMatchObject({ value: '2029-11-08', provenanceLabel: 'Assumed' });
  });

  it('captures a messy closed-ended fund transcript without misrouting timing or eligibility details', () => {
    const transcript = [
      'i want to create a tokenised close-ended fund to distribute to 32 investors. the fund name is TEST, symbol is TST and the launch date is 11 Nov 2026. it will be for 3 years.',
      'the base currency is SGD. investor wallets will be whitelisted. subscription will have an initial issuance at launch, and then open on a quarterly basis. redemption will also be on a quarterly basis. nav is monthly that will be pushed to the investors whitelisted address.',
      'the underlying product is a fund. income is distributed to token holders before redemption starts. income distribution is also quarterly minus 1 day so that redemption happens next day.',
      'eligible investors will be kyc off chain. investors subscribe via fiat curreny that is also done offchain. redemption is also in fiat done offchain.',
      'i thought i had stated the produt will run for 3 years',
      'offering type is private placement',
    ];
    const record = transcript.reduce((currentRecord, message, index) => {
      const suggestions = createProductSetupSuggestionsFromText(message, `chat_turn_messy_${index + 1}`);
      return reconcileProductSetupSuggestedUpdates(currentRecord, suggestions).record;
    }, createInitialProductSetupRecord(facts));
    const readModel = toProductSetupReadModel(record);
    const rowsById = new Map(readModel.profileRows.map((row) => [row.id, row]));

    expect(record.fields.product_name).toMatchObject({ value: 'TEST', status: 'user_stated' });
    expect(record.fields.token_symbol).toMatchObject({ value: 'TST', status: 'user_stated' });
    expect(record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(record.fields.product_type).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(record.fields.expected_investor_count).toMatchObject({ value: 32, status: 'user_stated' });
    expect(record.fields.maximum_investor_count).toMatchObject({ value: 32, status: 'user_stated' });
    expect(record.fields.product_launch_date).toMatchObject({ value: '2026-11-11', status: 'user_stated' });
    expect(record.fields.duration_months).toMatchObject({ value: 36, status: 'user_stated' });
    expect(record.fields.derived_maturity_date).toMatchObject({ value: '2029-11-12', status: 'system_default' });
    expect(record.fields.base_currency).toMatchObject({ value: 'SGD', status: 'user_stated' });
    expect(record.fields.whitelisted_wallets_required).toMatchObject({ value: true, status: 'user_stated' });
    expect(record.fields.investor_wallet_rule).toMatchObject({ value: 'Approved wallets only; transfers should stay between approved wallets.', status: 'user_stated' });
    expect(record.fields.subscription_cadence).toMatchObject({ value: 'One-time at launch, then Quarterly', status: 'user_stated' });
    expect(record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(record.fields.nav_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(record.fields.investor_update_rule).toMatchObject({ status: 'user_stated' });
    expect(record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(record.fields.income_payout_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(record.fields.subscription_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(record.fields.redemption_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(record.fields.offering_type).toMatchObject({ value: 'Private', status: 'user_stated' });

    expect(record.fields.underlying_asset_class.status).toBe('missing');
    expect(record.fields.eligible_investor_type.status).toBe('missing');
    expect(record.fields.redemption_payout_delay.status).toBe('missing');
    expect(rowsById.get('derived_maturity_date')).toMatchObject({ value: '2029-11-12', provenanceLabel: 'Assumed' });
    expect(rowsById.get('offering_type')).toMatchObject({ value: 'Private', provenanceLabel: 'Stated' });
  });

  it('extracts base currency, maturity term, and approved-wallet rule from direct answers', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'The base currency is usd. Maturity is 3 years after launch. Yes, approved wallets only.',
      'chat_turn_direct_answers',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('base_currency')).toBe('USD');
    expect(byField.get('duration_months')).toBe(36);
    expect(byField.has('maturity_date')).toBe(false);
    expect(byField.get('whitelisted_wallets_required')).toBe(true);
    expect(byField.get('investor_wallet_rule')).toMatch(/Approved wallets only/i);
  });

  it('extracts IPO-relative maturity and no-income treatment from follow-up assertions', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Base currency is usd. There is no income distribution. The term is 3 years. Maturity is 3 years after opo date of 8 Nov 2026.',
      'chat_turn_income_maturity',
    );
    const record = setProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), suggestions);
    const readModel = toProductSetupReadModel(record);
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));
    const incomeRow = readModel.profileRows.find((row) => row.id === 'income_treatment');
    const durationRow = readModel.profileRows.find((row) => row.id === 'duration_months');

    expect(byField.get('base_currency')).toBe('USD');
    expect(byField.get('income_treatment')).toBe('No income distribution');
    expect(byField.has('income_payout_cadence')).toBe(false);
    expect(byField.get('duration_months')).toBe(36);
    expect(byField.has('maturity_date')).toBe(false);
    expect(incomeRow).toMatchObject({ value: 'No income distribution', provenanceLabel: 'Needs review' });
    expect(durationRow).toMatchObject({ label: 'Duration of product in months', value: '36 months', provenanceLabel: 'Needs review' });
  });

  it('extracts stated protocol, maturity date, and income distribution into pending profile rows', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Will use ERC 20. Maturity 2029-11-08. Income is distributed to investors wallet.',
      'chat_turn_protocol_maturity_income',
    );
    const record = setProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), suggestions);
    const readModel = toProductSetupReadModel(record);
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));
    const protocolRow = readModel.profileRows.find((row) => row.id === 'protocol_base');
    const incomeRow = readModel.profileRows.find((row) => row.id === 'income_treatment');

    expect(byField.get('protocol_base')).toBe('ERC-20');
    expect(byField.get('maturity_date')).toBe('2029-11-08');
    expect(byField.get('income_treatment')).toBe('Distributing');
    expect(protocolRow).toMatchObject({ value: 'ERC-20', provenanceLabel: 'Needs review' });
    expect(incomeRow).toMatchObject({ value: 'Distributing', provenanceLabel: 'Needs review' });
  });

  it('reconciles explicit user-stated setup facts directly into the Product Profile', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Ok, lets use ERC 3643. The base currency is SGD. Subscription and redemption are quarterly. Income will be distributed quarterly. Maturity is 3 years after IPO date of 8 Nov 2026.',
      'chat_turn_explicit_setup',
    );
    const result = reconcileProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), suggestions);
    const readModel = toProductSetupReadModel(result.record);
    const protocolRow = readModel.profileRows.find((row) => row.id === 'protocol_base');
    const currencyRow = readModel.profileRows.find((row) => row.id === 'base_currency');
    const subscriptionRow = readModel.profileRows.find((row) => row.id === 'subscription_cadence');
    const redemptionRow = readModel.profileRows.find((row) => row.id === 'redemption_cadence');
    const incomeRow = readModel.profileRows.find((row) => row.id === 'income_treatment');
    const durationRow = readModel.profileRows.find((row) => row.id === 'duration_months');

    expect(result.record.fields.protocol_base).toMatchObject({ value: 'ERC-3643', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'SGD', status: 'user_stated' });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(result.record.fields.income_payout_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.duration_months).toMatchObject({ value: 36, status: 'user_stated' });
    expect(result.record.fields.derived_maturity_date).toMatchObject({ value: '2029-11-08', status: 'system_default' });
    expect(result.record.fields.maturity_date.status).toBe('missing');
    expect(protocolRow).toMatchObject({ value: 'ERC-3643', provenanceLabel: 'Stated' });
    expect(currencyRow).toMatchObject({ value: 'SGD', provenanceLabel: 'Stated' });
    expect(subscriptionRow).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Stated' });
    expect(redemptionRow).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Stated' });
    expect(incomeRow).toMatchObject({ value: 'Distributing', provenanceLabel: 'Stated' });
    expect(durationRow).toMatchObject({
      value: '36 months',
      provenanceLabel: 'Stated',
    });
  });

  it('merges partial structured extraction with local extraction coverage', () => {
    const localSuggestions = createProductSetupSuggestionsFromText(
      'Ok, lets use ERC 3643. The base currency is SGD. Subscription and redemption are quarterly.',
      'chat_turn_merge',
    );
    const structuredSuggestions = createProductSetupSuggestionsFromStructuredUpdates(
      [
        {
          field: 'protocol_base',
          proposedValue: 'ERC-3643',
          rationale: 'User selected ERC-3643.',
          confidence: 0.9,
        },
        {
          field: 'base_currency',
          proposedValue: 'SGD',
          rationale: 'User stated SGD as base currency.',
          confidence: 0.9,
        },
      ],
      'chat_turn_merge',
    );
    const mergedSuggestions = mergeProductSetupSuggestedUpdates(localSuggestions, structuredSuggestions);
    const result = reconcileProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), mergedSuggestions);

    expect(result.record.fields.protocol_base).toMatchObject({ value: 'ERC-3643', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'SGD', status: 'user_stated' });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
  });

  it('keeps Product Profile in sync through the unified intake reconciliation path', () => {
    const transcript = [
      'i want to create a tokenised close-ended fund to distribute to 32 investors. the fund name is TEST, symbol is TST and the launch date is 11 Nov 2026. it will be for 3 years.',
      'the base currency is SGD. investor wallets will be whitelisted. subscription will have an initial issuance at launch, and then open on a quarterly basis. redemption will also be on a quarterly basis. nav is monthly that will be pushed to the investors whitelisted address.',
      'the underlying product is a fund. income is distributed to token holders before redemption starts. income distribution is also quarterly minus 1 day so that redemption happens next day.',
      'eligible investors will be kyc off chain. investors subscribe via fiat currency that is also done offchain. redemption is also in fiat done offchain.',
      'offering type is private placement',
    ];
    const record = transcript.reduce((currentRecord, message, index) => {
      return reconcileProductSetupIntake(currentRecord, {
        userMessage: message,
        sourceRef: `chat_turn_unified_${index + 1}`,
      }).record;
    }, createInitialProductSetupRecord(facts));
    const readModel = toProductSetupReadModel(record);
    const profileRowsById = new Map(readModel.profileRows.map((row) => [row.id, row]));

    expect(record.fields.product_name).toMatchObject({ value: 'TEST', status: 'user_stated' });
    expect(record.fields.token_symbol).toMatchObject({ value: 'TST', status: 'user_stated' });
    expect(record.fields.product_launch_date).toMatchObject({ value: '2026-11-11', status: 'user_stated' });
    expect(record.fields.duration_months).toMatchObject({ value: 36, status: 'user_stated' });
    expect(record.fields.derived_maturity_date).toMatchObject({
      value: '2029-11-12',
      status: 'system_default',
      sourceRef: 'derived_from_launch_date_and_duration',
    });
    expect(record.fields.base_currency).toMatchObject({ value: 'SGD', status: 'user_stated' });
    expect(record.fields.subscription_cadence).toMatchObject({
      value: 'One-time at launch, then Quarterly',
      status: 'user_stated',
    });
    expect(record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(record.fields.nav_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(record.fields.income_payout_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(record.fields.subscription_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(record.fields.redemption_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(record.fields.offering_type).toMatchObject({ value: 'Private', status: 'user_stated' });

    expect(profileRowsById.get('product_launch_date')).toMatchObject({ value: '2026-11-11', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('duration_months')).toMatchObject({ value: '36 months', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('derived_maturity_date')).toMatchObject({
      value: '2029-11-12',
      provenanceLabel: 'Assumed',
    });
    expect(profileRowsById.get('subscription_cadence')).toMatchObject({
      value: 'One-time at launch, then Quarterly',
      provenanceLabel: 'Stated',
    });
    expect(profileRowsById.get('redemption_cadence')).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Stated' });
  });

  it('commits a full unstructured Product Setup paragraph into canonical Product Profile fields', () => {
    const message = [
      'I want to tokenise a fund product to distribute to 32 investors. The name is TEST and symbol is TST. The base currency is SGD. The underlying is a portfolio of equities. It will be launched on 17 Nov 2026 as a close-ended fund for 3 years.',
      'Investors wallet addresses will be white listed. They can transact between themselves but only based on white listed addresses. Tokens cannot be transferred to non-white listed addresses.',
      'NAV is monthly and remains at $1 per token. It will be uploaded 1 day before subscription day. Subscription period is 1 week before launch date after which it will close on launch date.',
      'Redemption and subscription is on quarterly basis. Eligible investors are verified offchain so the smart contract don’t need to verify investors.',
    ].join('\n\n');

    const result = reconcileProductSetupIntake(createInitialProductSetupRecord(facts), {
      userMessage: message,
      sourceRef: 'chat_turn_full_unstructured_profile',
    });
    const readModel = toProductSetupReadModel(result.record);
    const profileRowsById = new Map(readModel.profileRows.map((row) => [row.id, row]));

    expect(result.record.fields.product_name).toMatchObject({ value: 'TEST', status: 'user_stated' });
    expect(result.record.fields.token_symbol).toMatchObject({ value: 'TST', status: 'user_stated' });
    expect(result.record.fields.product_launch_date).toMatchObject({ value: '2026-11-17', status: 'user_stated' });
    expect(result.record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(result.record.fields.product_type).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(result.record.fields.underlying_asset_class).toMatchObject({ value: 'Equities', status: 'user_stated' });
    expect(result.record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'SGD', status: 'user_stated' });
    expect(result.record.fields.expected_investor_count).toMatchObject({ value: 32, status: 'user_stated' });
    expect(result.record.fields.maximum_investor_count).toMatchObject({ value: 32, status: 'user_stated' });
    expect(result.record.fields.whitelisted_wallets_required).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.p2p_transfer_allowed).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.nav_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.duration_months).toMatchObject({ value: 36, status: 'user_stated' });
    expect(result.record.fields.derived_maturity_date).toMatchObject({
      value: '2029-11-19',
      status: 'system_default',
      sourceRef: 'derived_from_launch_date_and_duration',
    });

    expect(result.record.fields.eligible_investor_type.status).toBe('missing');
    expect(profileRowsById.get('product_name')).toMatchObject({ value: 'TEST', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('product_launch_date')).toMatchObject({ value: '2026-11-17', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('product_structure')).toMatchObject({ value: 'Closed-ended', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('whitelisted_wallets_required')).toMatchObject({ value: 'Yes', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('p2p_transfer_allowed')).toMatchObject({ value: 'Yes', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('duration_months')).toMatchObject({ value: '36 months', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('derived_maturity_date')).toMatchObject({
      value: '2029-11-19',
      provenanceLabel: 'Assumed',
    });
  });

  it('commits a low-mess PRD setup script without requiring stablecoins for offchain payments', () => {
    const message = [
      'hi, i need to set up a new tokenised fund. here are the details:',
      'product name: MERIDIAN Growth Fund',
      'short name / symbol: MGF',
      'launch date: 1 April 2027',
      'base currency: USD',
      'product wrapper: fund',
      'underlying asset class: fixed income (bonds)',
      'product term type: closed-ended',
      'duration: 24 months (so maturity would be April 2029)',
      'income treatment: distribute',
      'offering type: private placement',
      'eligible investor type: accredited investors',
      'max investors: 30 (i know the cap is 50, just want 30 for this one)',
      'distribution jurisdiction: Singapore',
      'nav cadence: monthly, fixed at $1 per token',
      'nav upload method: CSV (as per default)',
      'nav uploaded 1 day before subscription day',
      'subscription / mint cadence: monthly',
      'redemption / burn cadence: monthly',
      'subscription payment method: fiat, off-chain',
      'redemption payment method: fiat, off-chain',
      'minimum subscription amount: $10,000',
      'minimum redemption amount: 1 token (default is fine)',
      'subscription window opens 2 weeks before launch date, closes on launch date',
      'whitelisted wallets required: yes',
      'p2p transfer allowed: yes, but only between whitelisted wallets',
      'compliance model: whitelist-based transfer restrictions (default)',
      'income distribution: monthly, paid 1 day before redemption date',
      'eligible investors verified offchain — smart contract does not need to handle investor verification',
      'blockchain network: Sepolia testnet (default)',
      'protocol base: ERC-20 customised',
      'evidence model: store PRD, approvals, tx hashes, artefacts, version history (default)',
    ].join('\n');

    const result = reconcileProductSetupIntake(createInitialProductSetupRecord(facts), {
      userMessage: message,
      sourceRef: 'chat_turn_v3_low_mess',
    });
    const readModel = toProductSetupReadModel(result.record);
    const profileRowsById = new Map(readModel.profileRows.map((row) => [row.id, row]));

    expect(result.record.fields.product_name).toMatchObject({ value: 'MERIDIAN Growth Fund', status: 'user_stated' });
    expect(result.record.fields.token_symbol).toMatchObject({ value: 'MGF', status: 'user_stated' });
    expect(result.record.fields.product_launch_date).toMatchObject({ value: '2027-04-01', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'USD', status: 'user_stated' });
    expect(result.record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(result.record.fields.underlying_asset_class).toMatchObject({ value: 'Bonds', status: 'user_stated' });
    expect(result.record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(result.record.fields.duration_months).toMatchObject({ value: 24, status: 'user_stated' });
    expect(result.record.fields.derived_maturity_date).toMatchObject({ value: '2029-04-02', status: 'system_default' });
    expect(result.record.fields.maturity_date.status).toBe('missing');
    expect(result.record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(result.record.fields.income_payout_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.offering_type).toMatchObject({ value: 'Private', status: 'user_stated' });
    expect(result.record.fields.eligible_investor_type).toMatchObject({ value: 'Accredited investor', status: 'user_stated' });
    expect(result.record.fields.expected_investor_count).toMatchObject({ value: 30, status: 'user_stated' });
    expect(result.record.fields.maximum_investor_count).toMatchObject({ value: 30, status: 'user_stated' });
    expect(result.record.fields.nav_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.nav_price_assumption).toMatchObject({ value: '$1 per token', status: 'user_stated' });
    expect(result.record.fields.nav_upload_method).toMatchObject({ value: 'CSV', status: 'locked' });
    expect(result.record.fields.nav_upload_timing).toMatchObject({
      value: '1 day before subscription day',
      status: 'user_stated',
    });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.subscription_window).toMatchObject({
      value: 'Opens 2 weeks before launch date; closes launch date',
      status: 'user_stated',
    });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.subscription_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.redemption_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.minimum_subscription_amount).toMatchObject({ value: '$10,000', status: 'user_stated' });
    expect(result.record.fields.minimum_redemption_amount).toMatchObject({ value: '1 token', status: 'user_stated' });
    expect(result.record.fields.income_payout_timing).toMatchObject({
      value: '1 day before redemption date',
      status: 'user_stated',
    });
    expect(result.record.fields.whitelisted_wallets_required).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.p2p_transfer_allowed).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.prototype_network).toMatchObject({ value: 'Sepolia testnet', status: 'locked' });
    expect(result.record.fields.protocol_base).toMatchObject({ value: 'Customised ERC-20', status: 'user_stated' });
    expect(result.record.fields.redemption_payout_delay.status).toBe('missing');

    expect(readModel.missingEssentials).not.toEqual(expect.arrayContaining(['subscription_stablecoins', 'redemption_stablecoin_type']));
    expect(profileRowsById.get('product_name')).toMatchObject({ value: 'MERIDIAN Growth Fund', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('product_launch_date')).toMatchObject({ value: '2027-04-01', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('duration_months')).toMatchObject({ value: '24 months', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('derived_maturity_date')).toMatchObject({ value: '2029-04-02', provenanceLabel: 'Assumed' });
    expect(profileRowsById.get('protocol_base')).toMatchObject({ value: 'Customised ERC-20', provenanceLabel: 'Stated' });
  });

  it('commits a medium-mess PRD setup script with corrections into canonical Product Profile fields', () => {
    const message = [
      'ok so setting up another fund on the platform, client briefed me this morning so some of this might be slightly disorganised sorry',
      '',
      "name is CYPRESS something — full name CYPRESS Capital Opportunities Fund, let's use CYP as the short name/ticker. base ccy is EUR. underlying is private equity (so product wrapper = fund, asset class = private equity).",
      '',
      'launch is 15 September 2027. running for 4 years so maturity somewhere around Sept 2031 — system can calculate exact date. closed-ended structure. income gets distributed (not accumulated).',
      '',
      "for the offering — it's institutional only. eligible investors are institutional investors, all verified offchain, so no onchain verification logic needed in the contract.",
      '',
      'we want about 25 investors max. jurisdiction is Singapore as always (locked default anyway).',
      '',
      'on the NAV side — quarterly NAV this time, still $1/token fixed. CSV upload. nav file goes up 2 days before subscription opens.',
      '',
      'sub and redemption cadence — both quarterly. fiat off-chain for both sub and redemption payments. minimum sub is $50,000. redemption minimum stays at 1 token default.',
      '',
      'sub window: opens 3 weeks before launch date, closes on launch date.',
      '',
      'whitelist — yes wallets must be whitelisted. p2p allowed but only whitelist-to-whitelist, no transfers outside.',
      '',
      'income distribution quarterly, 2 days before each redemption date.',
      '',
      'i think protocol base should be ERC-20 customised (same recommendation as usual). Sepolia testnet. compliance = whitelist transfer restrictions. evidence vault stores everything per default.',
      '',
      'oh wait i forgot — offering type is private placement. eligible investor type = institutional. think i said that already but just confirming.',
      '',
      'let me know if anything looks off',
    ].join('\n');

    const result = reconcileProductSetupIntake(createInitialProductSetupRecord(facts), {
      userMessage: message,
      sourceRef: 'chat_turn_v4_medium_mess',
    });
    const readModel = toProductSetupReadModel(result.record);
    const profileRowsById = new Map(readModel.profileRows.map((row) => [row.id, row]));

    expect(result.record.fields.product_name).toMatchObject({
      value: 'CYPRESS Capital Opportunities Fund',
      status: 'user_stated',
    });
    expect(result.record.fields.token_symbol).toMatchObject({ value: 'CYP', status: 'user_stated' });
    expect(result.record.fields.product_launch_date).toMatchObject({ value: '2027-09-15', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'EUR', status: 'user_stated' });
    expect(result.record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(result.record.fields.underlying_asset_class).toMatchObject({ value: 'Private equity', status: 'user_stated' });
    expect(result.record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(result.record.fields.duration_months).toMatchObject({ value: 48, status: 'user_stated' });
    expect(result.record.fields.derived_maturity_date).toMatchObject({ value: '2031-09-15', status: 'system_default' });
    expect(result.record.fields.maturity_date.status).toBe('missing');
    expect(result.record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(result.record.fields.income_payout_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.offering_type).toMatchObject({ value: 'Private', status: 'user_stated' });
    expect(result.record.fields.eligible_investor_type).toMatchObject({ value: 'Institutional', status: 'user_stated' });
    expect(result.record.fields.expected_investor_count.status).toBe('missing');
    expect(result.record.fields.maximum_investor_count).toMatchObject({ value: 50, status: 'system_default' });
    expect(result.reviewFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'expected_investor_count', value: 25 }),
        expect.objectContaining({ fieldKey: 'maximum_investor_count', value: 25 }),
      ]),
    );
    expect(result.record.fields.nav_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.nav_price_assumption).toMatchObject({ value: '$1 per token', status: 'user_stated' });
    expect(result.record.fields.nav_upload_method).toMatchObject({ value: 'CSV', status: 'locked' });
    expect(result.record.fields.nav_upload_timing).toMatchObject({
      value: '2 days before subscription opens',
      status: 'user_stated',
    });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.subscription_window).toMatchObject({
      value: 'Opens 3 weeks before launch date; closes launch date',
      status: 'user_stated',
    });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.subscription_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.redemption_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.minimum_subscription_amount).toMatchObject({ value: '$50,000', status: 'user_stated' });
    expect(result.record.fields.minimum_redemption_amount).toMatchObject({ value: '1 token', status: 'user_stated' });
    expect(result.record.fields.whitelisted_wallets_required).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.p2p_transfer_allowed).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.prototype_network).toMatchObject({ value: 'Sepolia testnet', status: 'locked' });
    expect(result.record.fields.protocol_base).toMatchObject({ value: 'Customised ERC-20', status: 'user_stated' });
    expect(result.record.fields.income_payout_timing).toMatchObject({
      value: '2 days before each redemption date',
      status: 'user_stated',
    });

    expect(readModel.missingEssentials).not.toEqual(expect.arrayContaining(['subscription_stablecoins', 'redemption_stablecoin_type']));
    expect(profileRowsById.get('product_name')).toMatchObject({
      value: 'CYPRESS Capital Opportunities Fund',
      provenanceLabel: 'Stated',
    });
    expect(profileRowsById.get('product_launch_date')).toMatchObject({ value: '2027-09-15', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('duration_months')).toMatchObject({ value: '48 months', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('derived_maturity_date')).toMatchObject({ value: '2031-09-15', provenanceLabel: 'Assumed' });
    expect(profileRowsById.get('offering_type')).toMatchObject({ value: 'Private', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('eligible_investor_type')).toMatchObject({
      value: 'Institutional',
      provenanceLabel: 'Stated',
    });
  });

  it('decomposes compound offering and eligibility phrases without misusing product structure', () => {
    const textSuggestions = createProductSetupSuggestionsFromText(
      'Offering type is private placement to accredited investors.',
      'chat_turn_compound_offering',
    );
    const structuredSuggestions = createProductSetupSuggestionsFromStructuredUpdates(
      [
        {
          field: 'offering_type',
          proposedValue: 'Private Placement to accredited investors',
          rationale: 'Assistant extracted a compound offering phrase.',
          confidence: 0.9,
        },
      ],
      'chat_turn_compound_structured',
    );
    const closedEndedSuggestions = createProductSetupSuggestionsFromStructuredUpdates(
      [
        {
          field: 'offering_type',
          proposedValue: 'closed-ended, eligible investors verified offchain as usual',
          rationale: 'Assistant placed structure and offchain verification under offering type.',
          confidence: 0.88,
        },
      ],
      'chat_turn_closed_ended_offering',
    );
    const textByField = new Map(textSuggestions.map((update) => [update.fieldKey, update.proposedValue]));
    const structuredByField = new Map(structuredSuggestions.map((update) => [update.fieldKey, update.proposedValue]));
    const closedEndedByField = new Map(closedEndedSuggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(textByField.get('offering_type')).toBe('Private');
    expect(textByField.get('eligible_investor_type')).toBe('Accredited investor');
    expect(structuredByField.get('offering_type')).toBe('Private');
    expect(structuredByField.get('eligible_investor_type')).toBe('Accredited investor');
    expect(closedEndedByField.get('product_structure')).toBe('Closed-ended');
    expect(closedEndedByField.has('offering_type')).toBe(false);
    expect(closedEndedByField.has('eligible_investor_type')).toBe(false);
  });

  it('handles a freeform NOVA setup dump without cross-attaching cadence or eligibility facts', () => {
    const message = [
      'need another tokenization setup, slightly diff parameters this round for testing purposes.',
      'quick context dump:',
      '- fund = BRIDGEWATER something... actually let’s just call it NOVA, symbol NVA',
      '- ccy = EUR',
      '- underlying = equities portfolio (same as usual)',
      '- launching 3 Mar 2027',
      '- close ended fund, term is 7 years this time (long one)',
      '- investor count -> 18 investors only, smaller cohort for this test',
      'whitelisting same logic as always - addresses must be whitelisted, investors can only transact peer to peer among whitelisted wallets, anything outside the whitelist = blocked, no transfers permitted to non-whitelisted addresses',
      'nav cadence -> weekly (testing higher frequency this time)',
      'nav fixed at $1 per token',
      'nav uploaded 3 days ahead of the subscription day',
      'subscription period -> opens 10 days before launch, closes on the launch date',
      'subscriptions = fiat / off-chain',
      'redemptions = fiat / off-chain too',
      'sub + redemption cadence = monthly',
      'income distro = monthly, released 3 days before the redemption date',
      'minimum sub amount = $500',
      'investor eligibility verified off-chain (kyc/aml done outside contract) so no onchain investor verification needed in the smart contract logic',
      'offering type: closed-ended, eligible investors verified offchain as usual',
    ].join('\n\n');

    const result = reconcileProductSetupIntake(createInitialProductSetupRecord(facts), {
      userMessage: message,
      sourceRef: 'chat_turn_nova_freeform',
    });
    const profileRowsById = new Map(toProductSetupReadModel(result.record).profileRows.map((row) => [row.id, row]));

    expect(result.record.fields.product_name).toMatchObject({ value: 'NOVA', status: 'user_stated' });
    expect(result.record.fields.token_symbol).toMatchObject({ value: 'NVA', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'EUR', status: 'user_stated' });
    expect(result.record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(result.record.fields.underlying_asset_class).toMatchObject({ value: 'Equities', status: 'user_stated' });
    expect(result.record.fields.product_launch_date).toMatchObject({ value: '2027-03-03', status: 'user_stated' });
    expect(result.record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(result.record.fields.duration_months).toMatchObject({ value: 84, status: 'user_stated' });
    expect(result.record.fields.derived_maturity_date).toMatchObject({ value: '2034-03-03', status: 'system_default' });
    expect(result.record.fields.expected_investor_count).toMatchObject({ value: 18, status: 'user_stated' });
    expect(result.record.fields.maximum_investor_count).toMatchObject({ value: 18, status: 'user_stated' });
    expect(result.record.fields.whitelisted_wallets_required).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.p2p_transfer_allowed).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.nav_cadence).toMatchObject({ value: 'Weekly', status: 'user_stated' });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.subscription_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.redemption_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(result.record.fields.income_payout_cadence).toMatchObject({ value: 'Monthly', status: 'user_stated' });
    expect(result.record.fields.offering_type.status).toBe('missing');
    expect(result.record.fields.eligible_investor_type.status).toBe('missing');
    expect(profileRowsById.get('nav_cadence')).toMatchObject({ value: 'Weekly', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('subscription_cadence')).toMatchObject({ value: 'Monthly', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('redemption_cadence')).toMatchObject({ value: 'Monthly', provenanceLabel: 'Stated' });
  });

  it('handles an ALPHA setup dump with shorthand labels, semi-annual cadence, and offchain eligibility notes', () => {
    const message = [
      'hey so i need to set up a tokenised fund thing for a client, basically distributing to around 65 investors. fund name is ALPHA, ticker ALP. base ccy USD this time not SGD.',
      'underlying is a portfolio of equities again. launch date is 15 Jan 2027, close-ended structure, runs for 5 years.',
      'wallets need to be whitelisted - investors can only move tokens between each other if both addresses are on the whitelist, no transfers out to randoms / non-whitelisted wallets at all.',
      'nav - quarterly this time, fixed at $1/token same as before. nav gets uploaded 2 days before the subscription window opens.',
      'subscription window is 2 weeks before launch, closes on launch day itself. subscriptions in fiat, off-chain, nothing onchain for that part. redemptions same - fiat, off chain.',
      'redemption + subscription cadence -> semi-annual (every 6 months)',
      'income distribution - semi-annual also, but paid out 2 days before the redemption date (not 1 day, want to test that variation)',
      'minimum sub amount = $5,000',
      'investors are kyc’d / verified offchain so contract doesn’t need to do any onchain investor verification',
      'offering type = closed ended, eligible investors verified offchain',
    ].join('\n\n');

    const result = reconcileProductSetupIntake(createInitialProductSetupRecord(facts), {
      userMessage: message,
      sourceRef: 'chat_turn_alpha_freeform',
    });
    const profileRowsById = new Map(toProductSetupReadModel(result.record).profileRows.map((row) => [row.id, row]));

    expect(result.record.fields.product_name).toMatchObject({ value: 'ALPHA', status: 'user_stated' });
    expect(result.record.fields.token_symbol).toMatchObject({ value: 'ALP', status: 'user_stated' });
    expect(result.record.fields.base_currency).toMatchObject({ value: 'USD', status: 'user_stated' });
    expect(result.record.fields.product_wrapper).toMatchObject({ value: 'Fund', status: 'user_stated' });
    expect(result.record.fields.underlying_asset_class).toMatchObject({ value: 'Equities', status: 'user_stated' });
    expect(result.record.fields.product_launch_date).toMatchObject({ value: '2027-01-15', status: 'user_stated' });
    expect(result.record.fields.product_structure).toMatchObject({ value: 'Closed-ended', status: 'user_stated' });
    expect(result.record.fields.duration_months).toMatchObject({ value: 60, status: 'user_stated' });
    expect(result.record.fields.derived_maturity_date).toMatchObject({ value: '2032-01-15', status: 'system_default' });
    expect(result.record.fields.expected_investor_count.status).toBe('missing');
    expect(result.record.fields.maximum_investor_count).toMatchObject({ value: 50, status: 'system_default' });
    expect(result.reviewFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fieldKey: 'expected_investor_count', value: 65 }),
        expect.objectContaining({ fieldKey: 'maximum_investor_count', value: 65 }),
      ]),
    );
    expect(result.record.fields.whitelisted_wallets_required).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.p2p_transfer_allowed).toMatchObject({ value: true, status: 'user_stated' });
    expect(result.record.fields.nav_cadence).toMatchObject({ value: 'Quarterly', status: 'user_stated' });
    expect(result.record.fields.subscription_cadence).toMatchObject({ value: 'Half-yearly', status: 'user_stated' });
    expect(result.record.fields.redemption_cadence).toMatchObject({ value: 'Half-yearly', status: 'user_stated' });
    expect(result.record.fields.subscription_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.redemption_payment_method).toMatchObject({ value: 'Offchain transfer', status: 'user_stated' });
    expect(result.record.fields.income_treatment).toMatchObject({ value: 'Distributing', status: 'user_stated' });
    expect(result.record.fields.income_payout_cadence).toMatchObject({ value: 'Half-yearly', status: 'user_stated' });
    expect(result.record.fields.offering_type.status).toBe('missing');
    expect(result.record.fields.eligible_investor_type.status).toBe('missing');
    expect(profileRowsById.get('product_name')).toMatchObject({ value: 'ALPHA', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('product_launch_date')).toMatchObject({ value: '2027-01-15', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('nav_cadence')).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('subscription_cadence')).toMatchObject({ value: 'Half-yearly', provenanceLabel: 'Stated' });
    expect(profileRowsById.get('redemption_cadence')).toMatchObject({ value: 'Half-yearly', provenanceLabel: 'Stated' });
  });

  it('does not convert quarterly income distribution into a redemption schedule', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Income will be distributed quarterly.',
      'chat_turn_quarterly_income_only',
    );
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('income_treatment')).toBe('Distributing');
    expect(byField.get('income_payout_cadence')).toBe('Quarterly');
    expect(byField.has('redemption_schedule')).toBe(false);
    expect(byField.has('redemption_cadence')).toBe(false);
  });

  it('keeps explicit ERC-20 selection ahead of conflicting assistant protocol recommendations', () => {
    const localSuggestions = createProductSetupSuggestionsFromText(
      'I will use ERC 20. Approved wallets only.',
      'chat_turn_user_erc20',
    );
    const structuredSuggestions = createProductSetupSuggestionsFromStructuredUpdates(
      [
        {
          field: 'protocol_base',
          proposedValue: 'ERC-3643',
          rationale: 'Whitelisted wallets suggest ERC-3643 as a recommended architecture target.',
          confidence: 0.94,
        },
      ],
      'chat_turn_user_erc20',
    );
    const mergedSuggestions = mergeProductSetupSuggestedUpdates(localSuggestions, structuredSuggestions);
    const result = reconcileProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), mergedSuggestions);
    const protocolRow = toProductSetupReadModel(result.record).profileRows.find((row) => row.id === 'protocol_base');

    expect(result.record.fields.protocol_base).toMatchObject({ value: 'ERC-20', status: 'user_stated' });
    expect(protocolRow).toMatchObject({ value: 'ERC-20', provenanceLabel: 'Stated' });
  });

  it('extracts natural income distribution confirmations and cadence', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Income distribution - yes. Income will be distributed quarterly.',
      'chat_turn_income_yes',
    );
    const record = setProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), suggestions);
    const readModel = toProductSetupReadModel(record);
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));
    const incomeRow = readModel.profileRows.find((row) => row.id === 'income_treatment');

    expect(byField.get('income_treatment')).toBe('Distributing');
    expect(byField.get('income_payout_cadence')).toBe('Quarterly');
    expect(incomeRow).toMatchObject({
      value: 'Distributing',
      provenanceLabel: 'Needs review',
    });
  });

  it('normalizes hyphenated maturity terms into readable plural text', () => {
    const suggestions = createProductSetupSuggestionsFromText('3-year term.', 'chat_turn_hyphen_term');
    const byField = new Map(suggestions.map((update) => [update.fieldKey, update.proposedValue]));

    expect(byField.get('duration_months')).toBe(36);
    expect(byField.has('maturity_date')).toBe(false);
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
    const structuredUpdates = createProductSetupSuggestionsFromStructuredUpdates(
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
    );
    const byField = new Map(structuredUpdates.map((update) => [update.fieldKey, update.proposedValue]));
    const withSuggestions = setProductSetupSuggestedUpdates(
      record,
      structuredUpdates,
    );
    const readModel = toProductSetupReadModel(withSuggestions);
    const subscriptionRow = readModel.profileRows.find((row) => row.id === 'subscription_cadence');
    const redemptionRow = readModel.profileRows.find((row) => row.id === 'redemption_cadence');
    const durationRow = readModel.profileRows.find((row) => row.id === 'duration_months');

    expect(withSuggestions.fields.subscription_cadence.status).toBe('missing');
    expect(subscriptionRow).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Needs review' });
    expect(redemptionRow).toMatchObject({ value: 'Quarterly', provenanceLabel: 'Needs review' });
    expect(durationRow).toMatchObject({ value: '36 months', provenanceLabel: 'Needs review' });
    expect(byField.get('duration_months')).toBe(36);
    expect(byField.has('maturity_date')).toBe(false);
  });

  it('does not let assistant protocol recommendations override a user-stated protocol choice', () => {
    const record = updateProductSetupField(createInitialProductSetupRecord(facts), {
      fieldKey: 'protocol_base',
      value: 'ERC-20',
      sourceType: 'user_message',
      sourceRef: 'chat_turn_user_protocol',
      status: 'user_stated',
    });
    const withAssistantRecommendation = setProductSetupSuggestedUpdates(
      record,
      createProductSetupSuggestionsFromStructuredUpdates(
        [
          {
            field: 'protocol_base',
            proposedValue: 'ERC-3643',
            rationale: 'Whitelisted wallets suggest ERC-3643 as an architecture target.',
            confidence: 0.88,
          },
        ],
        'chat_turn_assistant_recommendation',
      ),
    );
    const protocolRow = toProductSetupReadModel(withAssistantRecommendation).profileRows.find((row) => row.id === 'protocol_base');

    expect(withAssistantRecommendation.fields.protocol_base.value).toBe('ERC-20');
    expect(withAssistantRecommendation.pendingSuggestedUpdates.some((update) => update.fieldKey === 'protocol_base')).toBe(false);
    expect(protocolRow).toMatchObject({ value: 'ERC-20', provenanceLabel: 'Stated' });
  });

  it('keeps subscription and redemption payment rails scoped to the user wording', () => {
    const suggestions = createProductSetupSuggestionsFromText(
      'Subscriptions should use USDC stablecoin. Redemptions and payouts should be offchain fiat bank transfer.',
      'chat_turn_mixed_payment_rails',
    );
    const result = reconcileProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), suggestions);

    expect(result.record.fields.subscription_payment_method).toMatchObject({
      value: 'Stablecoin',
      status: 'user_stated',
    });
    expect(result.record.fields.subscription_stablecoins).toMatchObject({
      value: ['USDC'],
      status: 'user_stated',
    });
    expect(result.record.fields.redemption_payment_method).toMatchObject({
      value: 'Offchain transfer',
      status: 'user_stated',
    });
    expect(result.record.fields.redemption_stablecoin_type.value).toBeUndefined();
  });

  it('normalizes structured extractor values before reconciling Product Setup fields', () => {
    const suggestions = createProductSetupSuggestionsFromStructuredUpdates(
      [
        {
          field: 'protocol_base',
          proposedValue: 'erc 3643',
          rationale: 'User selected the protocol base.',
          confidence: 0.9,
        },
        {
          field: 'base currency',
          proposedValue: 'sgd',
          rationale: 'User stated SGD as the base currency.',
          confidence: 0.9,
        },
        {
          field: 'subscription payment method',
          proposedValue: 'USDC stablecoin',
          rationale: 'User selected USDC stablecoin subscriptions.',
          confidence: 0.9,
        },
        {
          field: 'subscription stablecoin type',
          proposedValue: 'usdc',
          rationale: 'User selected USDC.',
          confidence: 0.9,
        },
      ],
      'chat_turn_structured_normalized',
    );
    const record = setProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), suggestions);
    const byField = new Map(record.pendingSuggestedUpdates.map((update) => [update.fieldKey, update.proposedValue]));
    const readModel = toProductSetupReadModel(record);

    expect(byField.get('protocol_base')).toBe('ERC-3643');
    expect(byField.get('base_currency')).toBe('SGD');
    expect(byField.get('subscription_payment_method')).toBe('Stablecoin');
    expect(byField.get('subscription_stablecoins')).toEqual(['USDC']);
    expect(readModel.profileRows.find((row) => row.id === 'protocol_base')).toMatchObject({
      value: 'ERC-3643',
      provenanceLabel: 'Needs review',
    });
    expect(record.fields.protocol_base.status).toBe('missing');
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

  it('protects confirmed fields from casual overwrite but allows explicit corrections', () => {
    const confirmedRecord = updateProductSetupField(createInitialProductSetupRecord(facts), {
      fieldKey: 'base_currency',
      value: 'SGD',
      sourceType: 'user_confirmation',
      sourceRef: 'confirmed_base_currency',
      status: 'user_confirmed',
    });

    const casualRetouch = reconcileProductSetupIntake(confirmedRecord, {
      userMessage: 'base currency is USD',
      sourceRef: 'chat_turn_base_usd_casual',
    });

    expect(casualRetouch.record.fields.base_currency).toMatchObject({
      value: 'SGD',
      status: 'user_confirmed',
    });
    expect(casualRetouch.reviewFacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: 'base_currency',
          value: 'USD',
          reviewReason: expect.stringMatching(/already confirmed/i),
        }),
      ]),
    );

    const correction = reconcileProductSetupIntake(confirmedRecord, {
      userMessage: 'Actually, base currency is USD, not SGD.',
      sourceRef: 'chat_turn_base_usd_correction',
    });

    expect(correction.record.fields.base_currency).toMatchObject({
      value: 'USD',
      status: 'user_stated',
    });
    expect(correction.transaction.botClaimSummary.updated).toEqual(
      expect.arrayContaining([expect.stringMatching(/Base currency: USD \(was SGD\)/)]),
    );
  });

  it('ignores duplicate intake idempotency keys but rebases newer stale turns', () => {
    const initialRecord = createInitialProductSetupRecord(facts);
    const duplicate = reconcileProductSetupIntake(initialRecord, {
      userMessage: 'Product name is DUPLICATE.',
      sourceRef: 'chat_turn_duplicate',
      idempotencyKey: 'same-key',
      committedIdempotencyKeys: ['same-key'],
    });

    expect(duplicate.record.fields.product_name.status).toBe('missing');
    expect(duplicate.transaction.rejectedFacts[0].reason).toMatch(/duplicate/i);

    const advancedRecord = updateProductSetupField(initialRecord, {
      fieldKey: 'product_name',
      value: 'Existing Fund',
      sourceType: 'user_message',
      sourceRef: 'chat_turn_existing',
      status: 'user_stated',
    });
    const rebased = reconcileProductSetupIntake(advancedRecord, {
      userMessage: 'Token symbol is RBS.',
      sourceRef: 'chat_turn_rebased',
      previousRecordRevision: 0,
    });

    expect(rebased.record.fields.product_name.value).toBe('Existing Fund');
    expect(rebased.record.fields.token_symbol).toMatchObject({ value: 'RBS', status: 'user_stated' });
    expect(rebased.transaction.rebasedFromRevision).toBe(0);
    expect(rebased.transaction.previousRecordRevision).toBe(0);
    expect(rebased.transaction.nextRecordRevision).toBeGreaterThan(advancedRecord.revision);
  });

  it('routes direct derived maturity date candidates away from canonical writes', () => {
    const result = reconcileProductSetupSuggestedUpdates(createInitialProductSetupRecord(facts), [
      {
        id: 'derived_maturity_date-test',
        fieldKey: 'derived_maturity_date',
        proposedValue: '2030-01-01',
        rationale: 'User supplied a maturity date that should be derived from launch date and duration.',
        sourceType: 'user_message',
        sourceRef: 'chat_turn_derived_candidate',
        confidence: 0.95,
      },
    ]);

    expect(result.record.fields.derived_maturity_date.status).toBe('missing');
    expect(result.rejectedUpdates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldKey: 'derived_maturity_date',
          reason: expect.stringMatching(/derived/i),
        }),
      ]),
    );
  });

  it('does not mutate Product Setup from question-mode structured candidates', () => {
    const result = reconcileProductSetupIntake(createInitialProductSetupRecord(facts), {
      userMessage: 'What if base currency is USD?',
      sourceRef: 'chat_turn_question_structured',
      structuredSuggestions: [
        {
          id: 'base_currency-question',
          fieldKey: 'base_currency',
          proposedValue: 'USD',
          rationale: 'Question-mode candidate should be treated as exploratory.',
          sourceType: 'user_message',
          sourceRef: 'chat_turn_question_structured',
          confidence: 0.98,
        },
      ],
      unsupportedRequirementDecisions: [
        {
          id: 'unsupported-question',
          requirement: 'custom question-only requirement',
          mismatchReason: 'Question-mode artefact should not be persisted.',
          decision: 'pending',
          sourceRef: 'chat_turn_question_structured',
        },
      ],
    });

    expect(result.transaction.intakeMode).toBe('question');
    expect(result.record.fields.base_currency.status).toBe('missing');
    expect(result.record.unsupportedRequirementDecisions).toHaveLength(0);
    expect(result.appliedFacts).toHaveLength(0);
    expect(result.reviewFacts).toHaveLength(0);
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
    expect(subscriptionHandoff?.detail).toContain('Subscription stablecoin type: USDC');
    expect(subscriptionHandoff?.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceFieldKey: 'subscription_stablecoins',
          targetFieldKey: 'permittedStablecoins',
          value: ['USDC'],
          valueLabel: 'USDC',
          status: 'pending',
        }),
      ]),
    );
    expect(redemptionHandoff?.detail).toContain('Redemption / burn cadence: Quarterly');
    expect(redemptionHandoff?.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceFieldKey: 'redemption_cadence',
          targetFieldKey: 'redemptionCadence',
          value: 'Quarterly',
          status: 'pending',
        }),
      ]),
    );

    const sent = sendProductSetupHandoffNote(record, subscriptionHandoff!.id);
    expect(sent.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)).toMatchObject({
      target: 'subscription',
      status: 'sent_as_draft_note',
    });
    expect(sent.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)?.suggestions[0]).toMatchObject({
      status: 'pending',
      targetFieldKey: 'permittedStablecoins',
    });

    const applied = applyProductSetupHandoffSuggestion(
      sent,
      subscriptionHandoff!.id,
      sent.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)!.suggestions[0].id,
    );
    expect(applied.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)).toMatchObject({
      target: 'subscription',
      status: 'reviewed_in_target_tab',
      suggestions: [expect.objectContaining({ status: 'applied_in_target_tab' })],
    });

    const reviewed = reviewProductSetupHandoffNote(sent, subscriptionHandoff!.id);
    expect(reviewed.downstreamHandoffNotes.find((note) => note.id === subscriptionHandoff!.id)).toMatchObject({
      target: 'subscription',
      status: 'reviewed_in_target_tab',
    });
  });

  it('dismisses Product Setup starter suggestions without applying them in the target tab', () => {
    let record = createInitialProductSetupRecord(facts);
    record = updateProductSetupField(record, {
      fieldKey: 'redemption_cadence',
      value: 'Quarterly',
      sourceType: 'user_message',
      sourceRef: 'chat_turn_handoff',
    });

    const redemptionHandoff = toProductSetupReadModel(record).downstreamHandoffs.find((handoff) => handoff.target === 'redemption')!;
    const sent = sendProductSetupHandoffNote(record, redemptionHandoff.id);
    const dismissed = dismissProductSetupHandoffSuggestion(
      sent,
      redemptionHandoff.id,
      sent.downstreamHandoffNotes.find((note) => note.id === redemptionHandoff.id)!.suggestions[0].id,
    );

    expect(dismissed.downstreamHandoffNotes.find((note) => note.id === redemptionHandoff.id)).toMatchObject({
      status: 'reviewed_in_target_tab',
      suggestions: [expect.objectContaining({ status: 'dismissed_in_target_tab' })],
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
    expect(readModel.packPreview.status).toBe('Draft');
    expect(readModel.packPreview.canDownloadArtifacts).toBe(false);
  });

  it('distinguishes clean PRD readiness from critical Product Setup deferrals', () => {
    const completeRecord = createCompleteProductSetupRecord();
    const cleanReadModel = toProductSetupReadModel(completeRecord);
    const deferredRecord = deferProductSetupField(completeRecord, 'offering_type', 'User will confirm the offering type before final PRD approval.');
    const deferredReadModel = toProductSetupReadModel(deferredRecord);

    expect(productSetupPrdFieldKeys).toContain('offering_type');
    expect(cleanReadModel.missingEssentials).toHaveLength(0);
    expect(cleanReadModel.criticalDeferredEssentials).toHaveLength(0);
    expect(cleanReadModel.packPreview.status).toBe('Ready for review');
    expect(deferredReadModel.missingEssentials).toHaveLength(0);
    expect(deferredReadModel.criticalDeferredEssentials.map((field) => field.key)).toContain('offering_type');
    expect(deferredReadModel.packPreview.status).toBe('Ready with critical deferrals');
    expect(deferredReadModel.packPreview.warning).toMatch(/critical deferred Product Setup fields/i);
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

  it('translates an accepted P2P equivalent into non-conflicting smart contract rules', () => {
    const decisions = createUnsupportedRequirementDecisionsFromText(
      'Investors should be able to buy-sell peer to peer with each other.',
      'chat_turn_p2p_equivalent',
    );
    const record = setUnsupportedRequirementDecisions(createInitialProductSetupRecord(facts), decisions);
    const decided = decideUnsupportedRequirement(record, decisions[0].id, 'accepted_equivalent');

    expect(decided.unsupportedRequirementDecisions[0]).toMatchObject({
      decision: 'accepted_equivalent',
    });
    expect(decided.fields.whitelisted_wallets_required).toMatchObject({
      value: true,
      status: 'user_confirmed',
      sourceType: 'user_confirmation',
      sourceRef: decisions[0].id,
    });
    expect(decided.fields.p2p_transfer_allowed).toMatchObject({
      value: true,
      status: 'user_confirmed',
      sourceType: 'user_confirmation',
      sourceRef: decisions[0].id,
    });
    expect(decided.fields.investor_wallet_rule).toMatchObject({
      status: 'user_confirmed',
      sourceType: 'user_confirmation',
      sourceRef: decisions[0].id,
    });
    expect(String(decided.fields.investor_wallet_rule.value)).toContain(
      'Approved investors may transfer peer-to-peer only to other approved wallets',
    );
    expect(String(decided.fields.investor_wallet_rule.value)).toContain(
      'matching, liquidity, and settlement workflow are excluded from MVP execution',
    );
  });

  it('excludes unsupported requirements from MVP without mutating canonical contract rules', () => {
    const decisions = createUnsupportedRequirementDecisionsFromText(
      'Investors should be able to buy-sell peer to peer with each other.',
      'chat_turn_p2p_excluded',
    );
    const record = setUnsupportedRequirementDecisions(createInitialProductSetupRecord(facts), decisions);
    const decided = decideUnsupportedRequirement(record, decisions[0].id, 'excluded_from_mvp');

    expect(decided.unsupportedRequirementDecisions[0]).toMatchObject({
      decision: 'excluded_from_mvp',
    });
    expect(decided.fields.whitelisted_wallets_required.status).toBe('missing');
    expect(decided.fields.p2p_transfer_allowed.status).toBe('missing');
    expect(decided.fields.investor_wallet_rule.status).toBe('missing');
  });

  it('generates a Product Setup PRD with definitions, protocol fit, provenance, and unsupported decisions', () => {
    const record = setUnsupportedRequirementDecisions(
      createInitialProductSetupRecord(facts),
      createUnsupportedRequirementDecisionsFromText('I need conditional transfer with clawback.', 'chat_turn_pack'),
    );
    const markdown = createProductSetupPackMarkdown(record);

    expect(markdown).toContain('# ZiLi-OS Product Requirements Document');
    expect(markdown).toContain('## 9. Definitions Used In This Product Setup');
    expect(markdown).toContain('Recommended architecture target');
    expect(markdown).toContain('Current executable prototype');
    expect(markdown).toContain('Conditional transfers with clawback');
  });

  it('generates narrative PRD prose from the canonical Product Setup record', () => {
    const record = createCompleteProductSetupRecord();
    const markdown = createProductSetupPackMarkdown(record);

    expect(markdown).toContain('## 1. Executive Summary');
    expect(markdown).toContain('MERIDIAN Growth Fund is a closed-ended fund');
    expect(markdown).toContain('run for 24 months');
    expect(markdown).toContain('Private placement');
    expect(markdown).toContain('fixed income (bonds)');
    expect(markdown).toContain('The subscription window is recorded as: Opens 2 weeks before launch date; closes launch date.');
    expect(markdown).toContain('The current NAV price assumption is $1 per token.');
    expect(markdown).toContain('with timing recorded as: 1 day before subscription day.');
    expect(markdown).toContain('with timing recorded as: 1 day before redemption date.');
    expect(markdown).toContain('with a minimum subscription amount of $10,000');
    expect(markdown).toContain('## 7. Open Decisions And Review Items');
    expect(markdown).toContain('- No critical deferred Product Setup fields.');
    expect(markdown).not.toContain('### Deployment Warnings');
    expect(markdown).not.toContain('Protocol base: Smart contract architecture may be generated against the wrong token pattern.');
    expect(markdown).not.toContain('Expected investors: Investor Wallets capacity and distribution assumptions may be wrong.');
    expect(markdown).not.toContain('| Minimum redemption amount | $10,000 |');
  });

  it('uses record revision and generator version for Product Setup PRD idempotency keys', () => {
    const record = createCompleteProductSetupRecord();
    const sameRevisionKey = createProductSetupPrdArtifactKey(record);
    const updatedRecord = updateProductSetupField(record, {
      fieldKey: 'base_currency',
      value: 'EUR',
      sourceType: 'user_message',
      sourceRef: 'test_revision_change',
      status: 'user_confirmed',
    });

    expect(sameRevisionKey).toBe(createProductSetupPrdArtifactKey(record));
    expect(sameRevisionKey).toContain(PRODUCT_SETUP_PRD_GENERATOR_VERSION);
    expect(createProductSetupPrdArtifactKey(updatedRecord)).not.toBe(sameRevisionKey);
  });

  it('escapes user-provided Markdown table content in generated PRD artifacts', () => {
    let record = createInitialProductSetupRecord(facts);
    record = updateProductSetupField(record, {
      fieldKey: 'product_name',
      value: 'MILA | Income\nFund',
      sourceType: 'user_message',
      sourceRef: 'chat_turn_markdown_safety',
      status: 'user_stated',
    });
    record = updateProductSetupField(record, {
      fieldKey: 'nav_source',
      value: 'CSV upload | custodian file\nreviewed monthly',
      sourceType: 'user_message',
      sourceRef: 'chat_turn_markdown_safety',
      status: 'user_stated',
    });

    const markdown = createProductSetupPackMarkdown(record);
    const docx = createProductSetupPrdDocxContent(record);

    expect(markdown).toContain('| Product name | MILA \\| Income Fund |');
    expect(markdown).toContain('| NAV source | CSV upload \\| custodian file reviewed monthly |');
    expect(new TextDecoder().decode(docx)).toContain('word/document.xml');
  });

  it('generates a real DOCX package for the Product Setup PRD download', () => {
    const docx = createProductSetupPrdDocxContent(createInitialProductSetupRecord(facts));
    const packageText = new TextDecoder().decode(docx);

    expect(docx[0]).toBe(0x50);
    expect(docx[1]).toBe(0x4b);
    expect(packageText).toContain('[Content_Types].xml');
    expect(packageText).toContain('word/document.xml');
    expect(packageText).toContain('ZiLi-OS Product Requirements Document');
  });
});
