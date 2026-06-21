import {
  allProductSetupFieldKeys,
  type ProductSetupFieldKey,
  type ProductSetupFieldValue,
  type ProductSetupStructuredSuggestionInput,
  type ProductSetupSuggestedUpdate,
  type UnsupportedRequirementDecision,
} from './productSetupSchema';

type ProductSetupTextExtractionContext = {
  original: string;
  normalized: string;
  sourceRef: string;
};

type ProductSetupTextExtractionRule = (context: ProductSetupTextExtractionContext) => ProductSetupSuggestedUpdate[];

export function createProductSetupSuggestionsFromText(
  text: string,
  sourceRef: string,
): ProductSetupSuggestedUpdate[] {
  const original = text.trim();
  const context: ProductSetupTextExtractionContext = {
    original,
    normalized: normalizeProductSetupExtractionText(original),
    sourceRef,
  };

  return productSetupTextExtractionRules.flatMap((rule) => rule(context));
}

function normalizeProductSetupExtractionText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bnon[-\s]+white[-\s]+listed\b/g, 'non-whitelisted')
    .replace(/\bwhite[-\s]+listed\b/g, 'whitelisted')
    .replace(/\bwhite[-\s]+list\b/g, 'whitelist')
    .replace(/\bkyc\s+off\s+chain\b/g, 'kyc offchain')
    .replace(/\boff\s+chain\b/g, 'offchain')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasProductSetupIntent(value: string): boolean {
  return /\b(tokenise|tokenize|tokenised|tokenized|fund|product|portfolio|token|symbol)\b/.test(value);
}

const productSetupTextExtractionRules: ProductSetupTextExtractionRule[] = [
  extractIdentityAndTypeAssertions,
  extractTimingAssertions,
  extractSettlementAndWalletAssertions,
  extractServicingAssertions,
  extractProtocolAssertions,
];

function extractIdentityAndTypeAssertions({
  original,
  normalized,
  sourceRef,
}: ProductSetupTextExtractionContext): ProductSetupSuggestedUpdate[] {
  const updates: ProductSetupSuggestedUpdate[] = [];
  const allowGenericNameAssertion = hasProductSetupIntent(normalized);
  const productNameMatch = firstMatch(original, [
    /\b(?:product|fund|portfolio|vehicle)\s+name\s+(?:is|=|:)\s+([A-Za-z][A-Za-z0-9 .&-]{1,60}?)(?=\s+(?:and|with|as|it\s+is|symbol\s+is)|[.?!,]|$)/i,
    /\bproduct\s+display\s+name\s+(?:is|=|:)\s+([A-Za-z][A-Za-z0-9 .&-]{1,60}?)(?=\s+(?:and|with|as|it\s+is|symbol\s+is)|[.?!,]|$)/i,
    ...(allowGenericNameAssertion
      ? [
          /\b(?:the\s+)?name\s+(?:is|=|:)\s+([A-Za-z][A-Za-z0-9 .&-]{1,60}?)(?=\s+(?:and|with|as|it\s+is|symbol\s+is)|[.?!,]|$)/i,
        ]
      : []),
  ]);
  const tokenSymbolMatch = original.match(/\b(?:token\s+)?symbol\s+is\s+([A-Z][A-Z0-9]{1,11})\b/i);
  const baseCurrencyMatch =
    normalized.match(/\b(?:with\s+)?([a-z]{3,6})\s+as\s+(?:a\s+)?base\s+currency\b/) ??
    normalized.match(/\bbase\s+currency\s*(?:is|=|:)?\s*([a-z]{3,6})\b/);
  const productTypeMatch =
    normalized.match(/\bproduct\s+type\s+(?:is|=|:)\s+(pooled\s+fund|private\s+credit\s+fund|credit\s+fund|investment\s+fund|fund|note|bond|portfolio)\b/) ??
    normalized.match(/\b(?:it\s+is\s+)?(?:a\s+)?(pooled\s+fund|private\s+credit\s+fund|credit\s+fund|investment\s+fund|fund|note|bond|portfolio)\b/);
  const wrapperMatch = normalized.match(/\b(fund|bond|equity|private asset)\b/);
  const assetClassMatch =
    normalized.match(/\b(?:underlying\s+)?asset\s+class\s+(?:is|=|:)?\s+(?:a\s+)?(equities|equity|bonds|private credit|money market fund|mixed portfolio|portfolio)\b/) ??
    normalized.match(/\b(equities|equity|bonds|private credit|money market fund|mixed portfolio)\b/);
  const structureMatch =
    normalized.match(/\b(?:product\s+)?(?:term|structure)\s+(?:type\s+)?(?:is|=|:)?\s+(open[-\s]?ended|close[-\s]?ended|closed[-\s]?ended|fixed maturity)\b/) ??
    normalized.match(/\b(open[-\s]?ended|close[-\s]?ended|closed[-\s]?ended|fixed maturity)\b/);
  const offeringMatch =
    normalized.match(/\boffering\s+type\s+(?:is|=|:)?\s+(private\s+placement|restricted|private|institutional[-\s]?only|retail|all)\b/) ??
    normalized.match(/\b(?:offering|distribution)\s+(?:is|=|:)?\s+(private\s+placement|restricted|private|institutional[-\s]?only|retail|all)\b/) ??
    normalized.match(/\b(private\s+placement)\b/) ??
    normalized.match(/\b(restricted|private|institutional[-\s]?only|retail|all)\s+(?:offering|distribution|product)\b/);
  const investorTypeMatch = normalized.match(/\b(retail|high net worth|accredited investor|institutional|all)\s+(?:investors?|holders?)\b/);
  const investorMatch = normalized.match(/(?:about\s*)?(\d{1,3})(?:\s*-\s*\d{1,3})?\s+(?:investors|wallets)|(\d{1,3})\s*-\s*(\d{1,3})\s+investors/);

  if (productNameMatch?.[1]) {
    updates.push(createSuggestedUpdate('product_name', productNameMatch[1].trim(), 'User stated the product name.', sourceRef, 0.9));
  }
  if (tokenSymbolMatch?.[1]) {
    updates.push(createSuggestedUpdate('token_symbol', tokenSymbolMatch[1].trim(), 'User stated the token symbol.', sourceRef, 0.9));
  }
  if (productTypeMatch?.[1]) {
    updates.push(createSuggestedUpdate('product_type', titleCaseProductSetupValue(productTypeMatch[1]), 'User described the product type.', sourceRef, 0.84));
  }
  if (wrapperMatch?.[1]) {
    updates.push(createSuggestedUpdate('product_wrapper', titleCaseProductSetupValue(wrapperMatch[1]), 'User described the product wrapper.', sourceRef, 0.82));
  }
  if (assetClassMatch?.[1]) {
    updates.push(createSuggestedUpdate('underlying_asset_class', titleCaseProductSetupValue(assetClassMatch[1]), 'User described the underlying asset class.', sourceRef, 0.82));
  }
  if (structureMatch?.[1]) {
    updates.push(createSuggestedUpdate('product_structure', normalizeProductStructure(structureMatch[1]), 'User described the product structure.', sourceRef, 0.82));
  }
  if (offeringMatch?.[1]) {
    updates.push(createSuggestedUpdate('offering_type', titleCaseProductSetupValue(offeringMatch[1].replace('-', ' ')), 'User described the offering type.', sourceRef, 0.78));
  }
  if (investorTypeMatch?.[1]) {
    updates.push(createSuggestedUpdate('eligible_investor_type', titleCaseProductSetupValue(investorTypeMatch[1]), 'User described the eligible investor type.', sourceRef, 0.8));
  }
  if (baseCurrencyMatch?.[1]) {
    updates.push(createSuggestedUpdate('base_currency', baseCurrencyMatch[1].toUpperCase(), 'User stated the base currency.', sourceRef, 0.88));
  }
  if (investorMatch?.[1] || investorMatch?.[3]) {
    const investorCount = Number(investorMatch[1] ?? investorMatch[3]);
    updates.push(createSuggestedUpdate('expected_investor_count', investorCount, 'User described expected investor scale.', sourceRef, 0.88));
    updates.push(createSuggestedUpdate('maximum_investor_count', investorCount, 'User described the investor cap for the product.', sourceRef, 0.82));
  }

  return updates;
}

function extractTimingAssertions({
  original,
  normalized,
  sourceRef,
}: ProductSetupTextExtractionContext): ProductSetupSuggestedUpdate[] {
  const updates: ProductSetupSuggestedUpdate[] = [];
  const payoutDelay = extractRedemptionPayoutDelayAssertion(normalized);
  const ipoDateMatch =
    original.match(/\b(?:ipo|launch|initial\s+distribution)\s+date(?:\s+\w+){0,3}\s+(?:on\s+)?(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/i) ??
    original.match(/\b(?:launch(?:es|ed)?|launched|starts?|started)\s+(?:on\s+)?(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/i);
  const initialRegisterMatch = original.match(/\binitial\s+register\s+of\s+(\d{1,3})\s+investors?\s+will\s+be\s+([^.,;]+)/i);
  const maturityTermMatch =
    original.match(/\bmaturity\s*(?:is|=|:)?\s*(\d{1,3}\s+(?:years?|months?|quarters?)\s+after\s+(?:launch|ipo|ipo\s+date|opo|opo\s+date|initial\s+distribution)(?:\s+(?:date\s+)?of\s+\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})?)\b/i) ??
    original.match(/\b(?:term|tenor)\s*(?:is|=|:)?\s*(\d{1,3}[-\s]?(?:years?|months?|quarters?))\b/i) ??
    original.match(/\b(\d{1,3}[-\s]?(?:years?|months?|quarters?))\s+(?:term|tenor)\b/i) ??
    original.match(/\b(?:it|product|fund|portfolio|vehicle)\s+will\s+be\s+for\s+(\d{1,3}[-\s]?(?:years?|months?|quarters?))\b/i) ??
    original.match(/\bwill\s+run(?:\s+as\s+a\s+[^.,;]{0,60}?)?\s+for\s+(\d{1,3}[-\s]?(?:years?|months?|quarters?))\b/i) ??
    original.match(/\brun(?:s|ning)?(?:\s+as\s+a\s+[^.,;]{0,60}?)?\s+for\s+(\d{1,3}[-\s]?(?:years?|months?|quarters?))\b/i) ??
    original.match(/\b(?:close[-\s]?ended|closed[-\s]?ended|open[-\s]?ended|fixed\s+maturity|fund|product|portfolio|vehicle)[^.!?;]{0,100}\bfor\s+(\d{1,3}[-\s]?(?:years?|months?|quarters?))\b/i);
  const maturityDateMatch =
    original.match(/\bmaturity(?:\s+date)?\s*(?:is|=|:)?\s*(\d{4}-\d{2}-\d{2})\b/i) ??
    original.match(/\bmaturity(?:\s+date)?\s*(?:is|=|:)?\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})\b/i);
  const subscriptionCadence = extractSubscriptionCadenceAssertion(normalized) ?? extractCadenceNear(
    normalized,
    '(?:subscrib\\w*|subscription\\w*|buy|new\\s+investors?\\s+(?:can\\s+)?(?:come\\s+in|enter|join|buy)|investors?\\s+(?:can\\s+)?(?:come\\s+in|enter|join|buy)|accept\\s+new\\s+investors?|new\\s+money\\s+comes?\\s+in)',
  );
  const redemptionCadence = extractRedemptionCadenceAssertion(normalized) ?? extractCadenceNear(
    normalized,
    '(?:redeem\\w*|redemption\\w*|existing\\s+investors?\\s+(?:can\\s+)?(?:sell\\s+out|exit|cash\\s+out|withdraw)|investors?\\s+(?:can\\s+)?(?:sell\\s+out|exit|cash\\s+out|withdraw)|sell\\s+out|cash\\s+out|withdraw)',
  );
  const redemptionSchedule = extractRedemptionScheduleAssertion(normalized);
  const redemptionPayoutCadence = extractCadenceNear(normalized, '(?:redemption payout|settle\\w*|settlement\\w*)');
  const combinedSubscriptionRedemptionCadence =
    extractCombinedSubscriptionRedemptionCadence(normalized) ??
    extractCadenceNear(
      normalized,
      '(?:subscription\\s*/\\s*redemption|subscription\\s+and\\s+redemption|subscriptions\\s*/\\s*redemptions|subscribe\\s+and\\s+redeem)',
    );

  if (ipoDateMatch?.[1]) {
    const normalizedDate = normalizeProductSetupDate(ipoDateMatch[1]);
    updates.push(createSuggestedUpdate('product_launch_date', normalizedDate, 'User described the product launch or IPO date.', sourceRef, 0.84));
    updates.push(createSuggestedUpdate('initial_distribution_date', normalizedDate, 'User described the tentative initial distribution or IPO date.', sourceRef, 0.8));
  }
  if (maturityTermMatch?.[1]) {
    const durationMonths = durationMonthsFromTerm(maturityTermMatch[1]);
    if (durationMonths) {
      updates.push(createSuggestedUpdate('duration_months', durationMonths, 'User described the product duration.', sourceRef, 0.86));
    }
    updates.push(createSuggestedUpdate('maturity_date', normalizeMaturityTerm(maturityTermMatch[1]), 'User described the product maturity term.', sourceRef, 0.82));
  }
  if (!maturityTermMatch?.[1] && maturityDateMatch?.[1]) {
    updates.push(createSuggestedUpdate('maturity_date', normalizeProductSetupDate(maturityDateMatch[1]), 'User stated the maturity date.', sourceRef, 0.88));
  }
  if (initialRegisterMatch?.[1] && initialRegisterMatch[2]) {
    updates.push(createSuggestedUpdate('initial_investor_register_rule', `Initial register of ${initialRegisterMatch[1]} investors will be ${initialRegisterMatch[2].trim()}.`, 'User described the initial investor register process.', sourceRef, 0.78));
  }
  if (payoutDelay) {
    updates.push(createSuggestedUpdate('redemption_payout_delay', payoutDelay, 'User described a redemption payout delay.', sourceRef, 0.84));
  }
  if (subscriptionCadence) {
    updates.push(createSuggestedUpdate('subscription_cadence', subscriptionCadence, `User described ${subscriptionCadence.toLowerCase()} subscription timing.`, sourceRef, 0.83));
  }
  if (redemptionCadence) {
    updates.push(createSuggestedUpdate('redemption_cadence', redemptionCadence, `User described ${redemptionCadence.toLowerCase()} redemption timing.`, sourceRef, 0.83));
  }
  if (redemptionSchedule) {
    updates.push(createSuggestedUpdate('redemption_schedule', redemptionSchedule, 'User described when redemptions begin.', sourceRef, 0.8));
  }
  if (combinedSubscriptionRedemptionCadence && !subscriptionCadence) {
    updates.push(createSuggestedUpdate('subscription_cadence', combinedSubscriptionRedemptionCadence, `User described ${combinedSubscriptionRedemptionCadence.toLowerCase()} subscription timing.`, sourceRef, 0.82));
  }
  if (combinedSubscriptionRedemptionCadence && !redemptionCadence) {
    updates.push(createSuggestedUpdate('redemption_cadence', combinedSubscriptionRedemptionCadence, `User described ${combinedSubscriptionRedemptionCadence.toLowerCase()} redemption timing.`, sourceRef, 0.82));
  }
  if (redemptionPayoutCadence) {
    updates.push(createSuggestedUpdate('redemption_payout_cadence', redemptionPayoutCadence, `User described ${redemptionPayoutCadence.toLowerCase()} redemption payout settlement timing.`, sourceRef, 0.78));
  }

  return updates;
}

function extractSettlementAndWalletAssertions({
  normalized,
  sourceRef,
}: ProductSetupTextExtractionContext): ProductSetupSuggestedUpdate[] {
  const updates: ProductSetupSuggestedUpdate[] = [];
  const stablecoinMentioned = /\bstablecoin|usdc|usdt\b/.test(normalized);
  const offchainMentioned = /\bfiat\b|off[-\s]?chain|bank transfer|wire transfer/.test(normalized);
  const subscriptionPaymentContext =
    /\b(subscription|subscriptions|subscribe|subscribing|mint|buy|entry|new investors?)[^.!?;]{0,80}\b(stablecoin|usdc|usdt)\b/.test(normalized) ||
    /\b(stablecoin|usdc|usdt)\b[^.!?;]{0,80}\b(subscription|subscriptions|subscribe|subscribing|mint|buy|entry|new investors?)\b/.test(normalized);
  const redemptionPaymentContext =
    /\b(redemption|redemptions|redeem|payout|payouts|payment|payments|settlement|sell out|exit)[^.!?;]{0,80}\b(stablecoin|usdc|usdt)\b/.test(normalized) ||
    /\b(stablecoin|usdc|usdt)\b[^.!?;]{0,80}\b(redemption|redemptions|redeem|payout|payouts|payment|payments|settlement|sell out|exit)\b/.test(normalized);
  const subscriptionOffchainContext =
    /\b(subscription|subscriptions|subscribe|subscribing|mint|buy|entry|new investors?)[^.!?;]{0,80}\b(fiat|off[-\s]?chain|bank transfer|wire transfer)\b/.test(normalized) ||
    /\b(fiat|off[-\s]?chain|bank transfer|wire transfer)\b[^.!?;]{0,80}\b(subscription|subscriptions|subscribe|subscribing|mint|buy|entry|new investors?)\b/.test(normalized);
  const redemptionOffchainContext =
    /\b(redemption|redemptions|redeem|payout|payouts|payment|payments|settlement|sell out|exit)[^.!?;]{0,80}\b(fiat|off[-\s]?chain|bank transfer|wire transfer)\b/.test(normalized) ||
    /\b(fiat|off[-\s]?chain|bank transfer|wire transfer)\b[^.!?;]{0,80}\b(redemption|redemptions|redeem|payout|payouts|payment|payments|settlement|sell out|exit)\b/.test(normalized);
  const bothPaymentContexts =
    /\b(subscription(?:s)?\s+(?:and|\/)\s+redemption(?:s)?|subscription(?:s)?\s+(?:and|\/)\s+payout(?:s)?|subscription(?:s)?\/redemption(?:s)?|subscription(?:s)?\s+and\s+payout(?:s)?)\b/.test(normalized);

  if (stablecoinMentioned && (subscriptionPaymentContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('subscription_payment_method', 'Stablecoin', 'User described stablecoin subscription payment.', sourceRef, 0.82));
  }
  if (stablecoinMentioned && (redemptionPaymentContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('redemption_payment_method', 'Stablecoin', 'User described stablecoin redemption payout.', sourceRef, 0.8));
  }
  if (offchainMentioned && (subscriptionOffchainContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('subscription_payment_method', 'Offchain transfer', 'User described offchain or fiat subscription payment.', sourceRef, 0.8));
  }
  if (offchainMentioned && (redemptionOffchainContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('redemption_payment_method', 'Offchain transfer', 'User described offchain or fiat redemption payout.', sourceRef, 0.8));
  }
  if (normalized.includes('usdc') && (subscriptionPaymentContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('subscription_stablecoins', ['USDC'], 'User mentioned USDC subscription or payout rails.', sourceRef, 0.9));
  }
  if (normalized.includes('usdc') && (redemptionPaymentContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('redemption_stablecoin_type', 'USDC', 'User mentioned USDC redemption payout rails.', sourceRef, 0.78));
  }
  if (normalized.includes('usdt') && (subscriptionPaymentContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('subscription_stablecoins', ['USDT'], 'User mentioned USDT subscription or payout rails.', sourceRef, 0.9));
  }
  if (normalized.includes('usdt') && (redemptionPaymentContext || bothPaymentContexts)) {
    updates.push(createSuggestedUpdate('redemption_stablecoin_type', 'USDT', 'User mentioned USDT redemption payout rails.', sourceRef, 0.78));
  }
  if (normalized.includes('whitelist') || normalized.includes('approved wallet') || normalized.includes('approved wallets')) {
    updates.push(createSuggestedUpdate('whitelisted_wallets_required', true, 'User described approved or whitelisted wallet access.', sourceRef, 0.9));
    updates.push(createSuggestedUpdate('investor_wallet_rule', 'Approved wallets only; transfers should stay between approved wallets.', 'User described approved or whitelisted wallet access.', sourceRef, 0.86));
  }
  if (/peer\s*to\s*peer|p2p|buy-sell|buy sell|transfer.+each other|transact(?:ions?)?\s+between\s+themselves|trade\s+between\s+themselves|transfer\s+between\s+(?:investors|holders|wallets)/.test(normalized)) {
    updates.push(createSuggestedUpdate('p2p_transfer_allowed', true, 'User described investor peer-to-peer transfers.', sourceRef, 0.82));
    updates.push(createSuggestedUpdate('investor_wallet_rule', 'Approved investors may transfer peer-to-peer only to other approved wallets.', 'User described investor peer-to-peer transfers.', sourceRef, 0.82));
  }
  if (/no\s+(?:p2p|peer\s*to\s*peer)|p2p\s+(?:is\s+)?(?:not\s+allowed|disabled)|cannot\s+transfer\s+to\s+one\s+another/.test(normalized)) {
    updates.push(createSuggestedUpdate('p2p_transfer_allowed', false, 'User said peer-to-peer investor transfers are not allowed.', sourceRef, 0.82));
  }

  return updates;
}

function extractServicingAssertions({
  normalized,
  sourceRef,
}: ProductSetupTextExtractionContext): ProductSetupSuggestedUpdate[] {
  const updates: ProductSetupSuggestedUpdate[] = [];
  const valuationCadence = extractCadenceNear(normalized, '(?:valuation|nav)');
  const incomePayoutCadence = extractCadenceNear(
    normalized,
    '(?:income\\s+distribution|distribution\\w*|distribut\\w*|dividend\\w*|coupon\\w*|income payout|cash distribution)',
  );
  const noIncomeDistribution = /\bno\s+(?:income\s+)?(?:distribution|distributions|dividend|dividends|coupon|coupons|income\s+payout|cash\s+distribution)s?\b|\bthere\s+is\s+no\s+income\s+distribution\b|\bdoes\s+not\s+(?:pay|distribute)\s+(?:income|dividends|coupons)\b/.test(normalized);
  const incomeDistributionAssertion =
    /\bincome\s+(?:is\s+|will\s+be\s+)?distributed\b|\bincome\s+distribution\s*(?:-|=|:)?\s*(?:yes|true|enabled)\b|\bthere\s+will\s+be\s+income\b|\bdistribute\s+income\b|\bincome\s+payout\b|\bdistribution\s+to\s+investors?\b/.test(normalized);

  if (valuationCadence) {
    updates.push(createSuggestedUpdate('nav_cadence', valuationCadence, `User described ${valuationCadence.toLowerCase()} valuation or NAV updates.`, sourceRef, 0.84));
  }
  if (noIncomeDistribution) {
    updates.push(createSuggestedUpdate('income_treatment', 'No income distribution', 'User stated there is no income distribution.', sourceRef, 0.86));
  } else if (incomePayoutCadence || incomeDistributionAssertion) {
    updates.push(createSuggestedUpdate('income_treatment', 'Distributing', 'User described an income distribution workflow.', sourceRef, 0.74));
    if (incomePayoutCadence) {
      updates.push(createSuggestedUpdate('income_payout_cadence', incomePayoutCadence, `User described ${incomePayoutCadence.toLowerCase()} income or distribution payout timing.`, sourceRef, 0.78));
    }
  }
  if (/uploaded file|upload file|file upload|uploaded via a file|ingested from uploaded file/.test(normalized)) {
    updates.push(createSuggestedUpdate('nav_source', 'Uploaded file', 'User described NAV or valuation coming from an uploaded file.', sourceRef, 0.84));
  }
  if (/\bnav\b[^.!?;]{0,80}\b(?:provided|uploaded|supplied)\s+by\s+(?:myself|me|us|my team|issuer|admin|manager)\b|\b(?:provided|uploaded|supplied)\s+by\s+(?:myself|me|us|my team|issuer|admin|manager)\b[^.!?;]{0,80}\bnav\b/.test(normalized)) {
    updates.push(createSuggestedUpdate('nav_source', 'User-provided upload', 'User described who will provide NAV updates.', sourceRef, 0.82));
  }
  if (/push|send|distribute/.test(normalized) && /wallet|investor/.test(normalized) && /information|update|notice|\bnav\b/.test(normalized)) {
    updates.push(createSuggestedUpdate('investor_update_rule', 'ZiLi-OS should prepare investor update records; wallet-pushed notices remain a custom requirement for review.', 'User described pushing product or NAV updates to investors.', sourceRef, 0.8));
  }

  return updates;
}

function extractProtocolAssertions({
  normalized,
  sourceRef,
}: ProductSetupTextExtractionContext): ProductSetupSuggestedUpdate[] {
  if (/\bcustomi[sz]ed\s+erc-?\s*20\b|\bcustom\s+erc-?\s*20\b/.test(normalized)) {
    return [createSuggestedUpdate('protocol_base', 'Customised ERC-20', 'User selected customised ERC-20 as the protocol base.', sourceRef, 0.88)];
  }
  if (/\berc-?\s*20\b|\berc20\b/.test(normalized)) {
    return [createSuggestedUpdate('protocol_base', 'ERC-20', 'User selected ERC-20 as the protocol base.', sourceRef, 0.88)];
  }
  if (/\berc-?\s*3643\b|\berc3643\b/.test(normalized)) {
    return [createSuggestedUpdate('protocol_base', 'ERC-3643', 'User asked for or accepted a permissioned token protocol base.', sourceRef, 0.86)];
  }

  return [];
}

export function createProductSetupSuggestionsFromStructuredUpdates(
  updates: ProductSetupStructuredSuggestionInput[] | undefined,
  sourceRef: string,
): ProductSetupSuggestedUpdate[] {
  if (!updates?.length) return [];

  return updates.flatMap((update) => {
    const fieldKeys = normalizeProductSetupFieldAliases(update.field);
    const proposedValue = normalizeSuggestedUpdateValue(update.proposedValue);
    if (fieldKeys.length === 0 || proposedValue === undefined) return [];
    const derivedDurationMonths =
      typeof proposedValue === 'string' && fieldKeys.includes('maturity_date')
        ? durationMonthsFromTerm(proposedValue)
        : undefined;
    const normalizedUpdates = fieldKeys.map((fieldKey) => ({
      fieldKey,
      proposedValue,
    }));
    if (derivedDurationMonths !== undefined && !fieldKeys.includes('duration_months')) {
      normalizedUpdates.push({ fieldKey: 'duration_months', proposedValue: derivedDurationMonths });
    }

    return normalizedUpdates.flatMap(({ fieldKey, proposedValue: normalizedProposedValue }) => {
      const fieldScopedValue = normalizeSuggestedUpdateValueForField(fieldKey, normalizedProposedValue);
      if (fieldScopedValue === undefined) return [];

      return [{
        id: `${fieldKey}-${sourceRef}`,
        fieldKey,
        proposedValue: fieldScopedValue,
        rationale: update.rationale,
        sourceType: 'assistant_inference',
        sourceRef,
        confidence: update.confidence,
      }];
    });
  });
}

function normalizeProductSetupFieldAliases(field: string): ProductSetupFieldKey[] {
  const normalized = field
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (allProductSetupFieldKeys.includes(normalized as ProductSetupFieldKey)) return [normalized as ProductSetupFieldKey];

  if (/subscription.*redemption.*cadence|redemption.*subscription.*cadence/.test(normalized)) {
    return ['subscription_cadence', 'redemption_cadence'];
  }

  const aliases: Record<string, ProductSetupFieldKey> = {
    expected_investors: 'expected_investor_count',
    investor_count: 'expected_investor_count',
    target_investors: 'expected_investor_count',
    product_display_name: 'product_name',
    display_name: 'product_name',
    fund_name: 'product_name',
    portfolio_name: 'product_name',
    vehicle_name: 'product_name',
    product_short_name: 'token_symbol',
    short_name: 'token_symbol',
    base_currency_denomination: 'base_currency',
    maturity: 'maturity_date',
    term: 'maturity_date',
    launch_date_term: 'maturity_date',
    product_term: 'product_structure',
    product_term_type: 'product_structure',
    term_type: 'product_structure',
    structure: 'product_structure',
    product_duration: 'duration_months',
    duration: 'duration_months',
    duration_in_months: 'duration_months',
    product_duration_months: 'duration_months',
    offering: 'offering_type',
    offering_model: 'offering_type',
    distribution_model: 'offering_type',
    income_distribution: 'income_treatment',
    income_treatment_rule: 'income_treatment',
    subscription_frequency: 'subscription_cadence',
    subscription_mint_cadence: 'subscription_cadence',
    subscription_stablecoin_type: 'subscription_stablecoins',
    subscription_stablecoin: 'subscription_stablecoins',
    redemption_frequency: 'redemption_cadence',
    redemption_burn_cadence: 'redemption_cadence',
    redemption_stablecoin: 'redemption_stablecoin_type',
    valuation_cadence: 'nav_cadence',
    valuation_update_requirement: 'nav_cadence',
    nav_cadence_format: 'nav_cadence',
    nav_provider: 'nav_source',
    nav_source_actor: 'nav_source',
    nav_update_rule: 'investor_update_rule',
    investor_updates: 'investor_update_rule',
    investor_update: 'investor_update_rule',
    wallet_whitelist_requirement: 'whitelisted_wallets_required',
    whitelist_requirement: 'whitelisted_wallets_required',
    wallet_rule: 'investor_wallet_rule',
    burn_rule: 'burn_lock_rule',
  };

  return aliases[normalized] ? [aliases[normalized]] : [];
}

function normalizeSuggestedUpdateValue(value: unknown): ProductSetupFieldValue | undefined {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) return value;
  return undefined;
}

function normalizeSuggestedUpdateValueForField(
  fieldKey: ProductSetupFieldKey,
  value: ProductSetupFieldValue,
): ProductSetupFieldValue | undefined {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.toLowerCase();

  if (fieldKey === 'protocol_base') {
    if (/customi[sz]ed\s+erc-?\s*20|custom\s+erc-?\s*20/.test(normalized)) return 'Customised ERC-20';
    if (/erc-?\s*3643|erc3643/.test(normalized)) return 'ERC-3643';
    if (/erc-?\s*20|erc20/.test(normalized)) return 'ERC-20';
  }

  if (fieldKey === 'base_currency') return trimmed.toUpperCase();

  if (fieldKey === 'product_structure') return normalizeProductStructure(trimmed);

  if (fieldKey === 'duration_months') {
    const parsedDuration = durationMonthsFromTerm(trimmed) ?? Number(trimmed);
    return Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : undefined;
  }

  if (fieldKey === 'subscription_payment_method' || fieldKey === 'redemption_payment_method') {
    if (/stablecoin|usdc|usdt/.test(normalized)) return 'Stablecoin';
    if (/fiat|off[-\s]?chain|bank|wire/.test(normalized)) return 'Offchain transfer';
  }

  if (fieldKey === 'subscription_stablecoins') {
    if (/usdc/.test(normalized)) return ['USDC'];
    if (/usdt/.test(normalized)) return ['USDT'];
  }

  if (fieldKey === 'redemption_stablecoin_type') {
    if (/usdc/.test(normalized)) return 'USDC';
    if (/usdt/.test(normalized)) return 'USDT';
  }

  if (fieldKey === 'income_treatment') {
    if (/^no\b|no income|accumulat|reinvest/.test(normalized)) return 'No income distribution';
    if (/yes|distribut|dividend|coupon|income/.test(normalized)) return 'Distributing';
  }

  return value;
}

function titleCaseProductSetupValue(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function firstMatch(value: string, patterns: RegExp[]): RegExpMatchArray | null {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match) return match;
  }
  return null;
}

function normalizeProductStructure(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/, '-');
  if (/^open-?ended$/.test(normalized)) return 'Open-ended';
  if (/^close-?ended$|^closed-?ended$/.test(normalized)) return 'Closed-ended';
  if (/fixed\s*maturity|fixed-maturity/.test(normalized)) return 'Fixed maturity';
  return titleCaseProductSetupValue(value);
}

function normalizeMaturityTerm(value: string): string {
  return value
    .trim()
    .replace(/^(\d{1,3})-(year|month|quarter)s?$/i, (_match, amount: string, unit: string) => {
      const normalizedUnit = Number(amount) === 1 ? unit.toLowerCase() : `${unit.toLowerCase()}s`;
      return `${amount} ${normalizedUnit}`;
    })
    .replace(/\bopo\b/gi, 'IPO')
    .replace(/\bipo\b/gi, 'IPO')
    .replace(/\binitial distribution\b/gi, 'initial distribution')
    .replace(/\s+/g, ' ');
}

function durationMonthsFromTerm(value: string): number | undefined {
  const match = value.match(/\b(\d{1,3})[-\s]?(years?|months?|quarters?)\b/i);
  if (!match?.[1] || !match[2]) return undefined;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  const unit = match[2].toLowerCase();
  if (unit.startsWith('year')) return amount * 12;
  if (unit.startsWith('quarter')) return amount * 3;
  return amount;
}

function normalizeProductSetupDate(value: string): string {
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (match?.[1] && match[2] && match[3]) {
    const monthIndex = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ].indexOf(match[2].slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      return `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${String(Number(match[1])).padStart(2, '0')}`;
    }
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value.trim();
  return new Date(parsed).toISOString().slice(0, 10);
}

function extractCadenceNear(value: string, contextPattern: string): string | undefined {
  const cadenceTerms: Array<[RegExp, string]> = [
    [/\bintraday\b/, 'Intraday'],
    [/\bdaily\b|\beach day\b/, 'Daily'],
    [/\bweekly\b|\beach week\b/, 'Weekly'],
    [/\bmonthly\b|\beach month\b/, 'Monthly'],
    [/\bquarterly\b|\beach quarter\b|\bquarter\b/, 'Quarterly'],
    [/\bhalf[-\s]?yearly\b|\bsemi[-\s]?annual(?:ly)?\b/, 'Half-yearly'],
    [/\byearly\b|\bannually\b|\bannual\b/, 'Yearly'],
  ];

  for (const [termPattern, label] of cadenceTerms) {
    const termSource = `(?:${termPattern.source})`;
    const cadenceBeforeContext = new RegExp(`${termSource}(?:\\s+\\w+){0,4}\\s+${contextPattern}`, 'i');
    const contextBeforeCadence = new RegExp(`${contextPattern}(?:\\s+\\w+){0,4}\\s+${termSource}`, 'i');
    if (cadenceBeforeContext.test(value) || contextBeforeCadence.test(value)) return label;
  }

  return undefined;
}

function extractSubscriptionCadenceAssertion(value: string): string | undefined {
  const relevantText = relevantTextForContext(value, /\b(subscription|subscriptions|subscribe|subscribing|new investors?|investors? can buy|buy)\b/);
  if (!relevantText) return undefined;
  const cadence = cadenceLabelFromText(relevantText);
  if (!cadence) return undefined;
  if (/\bone[-\s]?time\b|\bone\s+time\b|\binitial\b|\bat\s+launch\b|\bonce\s+at\s+launch\b/.test(relevantText)) {
    if (/\bthen\b|\bafter\s+launch\b|\bpost[-\s]?launch\b|\bon\s+a\b/.test(relevantText)) {
      return `One-time at launch, then ${cadence}`;
    }
  }
  return cadence;
}

function extractRedemptionCadenceAssertion(value: string): string | undefined {
  const relevantText = relevantTextForContext(value, /\b(redemption|redemptions|redeem|existing investors?|sell out|exit|withdraw)\b/);
  if (!relevantText) return undefined;
  return cadenceLabelFromText(relevantText);
}

function extractRedemptionScheduleAssertion(value: string): string | undefined {
  const match = value.match(/\bredemption(?:s)?\s+(?:starts?|begins?|commences?)\s+(\d{1,3}\s+(?:days?|weeks?|months?|quarters?|years?)\s+after\s+(?:launch date|launch|ipo date|ipo|initial distribution))\b/i);
  if (!match?.[1]) return undefined;
  return `Starts ${match[1]}`;
}

function extractRedemptionPayoutDelayAssertion(value: string): string | undefined {
  const match = value.match(
    /\b(?:redemption\s+)?(?:payout|payment|settlement|settle|paid)[^.!?;]{0,60}\b(?:delay|delayed|after|within|takes?|t\+)?\s*(\d{1,3}\s*(?:business\s*)?(?:days?|hours?|weeks?))\b|\b(\d{1,3}\s*(?:business\s*)?(?:days?|hours?|weeks?))\s+(?:redemption\s+)?(?:payout|payment|settlement|settle)\s*(?:delay|period|window)?\b/i,
  );
  return match?.[1] ?? match?.[2];
}

function cadenceLabelFromText(value: string): string | undefined {
  if (/\bintraday\b/.test(value)) return 'Intraday';
  if (/\bdaily\b|\beach day\b/.test(value)) return 'Daily';
  if (/\bweekly\b|\beach week\b/.test(value)) return 'Weekly';
  if (/\bmonthly\b|\beach month\b/.test(value)) return 'Monthly';
  if (/\bquarterly\b|\beach quarter\b|\bquarter\b/.test(value)) return 'Quarterly';
  if (/\bhalf[-\s]?yearly\b|\bsemi[-\s]?annual(?:ly)?\b/.test(value)) return 'Half-yearly';
  if (/\byearly\b|\bannually\b|\bannual\b/.test(value)) return 'Yearly';
  return undefined;
}

function relevantTextForContext(value: string, contextPattern: RegExp): string {
  return value
    .split(/[.!?;]+/)
    .map((segment) => segment.trim())
    .filter((segment) => contextPattern.test(segment))
    .join(' ');
}

function extractCombinedSubscriptionRedemptionCadence(value: string): string | undefined {
  const match = value.match(
    /(?:subscription\s*\/\s*redemption|subscription\s+and\s+redemption|subscriptions\s*\/\s*redemptions|subscribe\s+and\s+redeem)[^a-z0-9]{0,24}(?:cadence|frequency|timing)?[^a-z0-9]{0,24}(intraday|daily|weekly|monthly|quarterly|half[-\s]?yearly|yearly|annual|annually)\b/i,
  );
  if (!match?.[1]) return undefined;
  return cadenceLabelFromTerm(match[1]);
}

function cadenceLabelFromTerm(term: string): string | undefined {
  const normalized = term.toLowerCase();
  if (normalized === 'intraday') return 'Intraday';
  if (normalized === 'daily') return 'Daily';
  if (normalized === 'weekly') return 'Weekly';
  if (normalized === 'monthly') return 'Monthly';
  if (normalized === 'quarterly') return 'Quarterly';
  if (/half[-\s]?yearly/.test(normalized)) return 'Half-yearly';
  if (normalized === 'yearly' || normalized === 'annual' || normalized === 'annually') return 'Yearly';
  return undefined;
}

function createSuggestedUpdate(
  fieldKey: ProductSetupFieldKey,
  proposedValue: ProductSetupFieldValue,
  rationale: string,
  sourceRef: string,
  confidence: number,
): ProductSetupSuggestedUpdate {
  return {
    id: `${fieldKey}-${sourceRef}`,
    fieldKey,
    proposedValue,
    rationale,
    sourceType: 'user_message',
    sourceRef,
    confidence,
  };
}

export function createUnsupportedRequirementDecisionsFromText(
  text: string,
  sourceRef: string,
): UnsupportedRequirementDecision[] {
  const normalized = text.toLowerCase();
  const decisions: UnsupportedRequirementDecision[] = [];
  if (/clawback|claw back|conditional transfer/.test(normalized)) {
    decisions.push({
      id: `unsupported-clawback-${sourceRef}`,
      requirement: 'Conditional transfers with clawback',
      mismatchReason: 'The current four protocol bases do not release an executable clawback adapter in the Sepolia prototype.',
      nearestEquivalent: 'Use approved-wallet transfer restrictions and document manual exception handling for MVP.',
      decision: 'pending',
      sourceRef,
    });
  }
  if (/peer\s*to\s*peer|p2p|buy-sell|buy sell|transfer.+each other/.test(normalized)) {
    decisions.push({
      id: `unsupported-p2p-settlement-${sourceRef}`,
      requirement: 'Investor peer-to-peer transfer and settlement workflow',
      mismatchReason: 'Approved-wallet transfers can be represented as a rule, but ZiLi-OS does not yet execute a marketplace, matching, liquidity, or settlement workflow.',
      nearestEquivalent: 'Allow only approved-wallet transfers and record P2P settlement/liquidity as excluded from MVP execution.',
      decision: 'pending',
      sourceRef,
    });
  }
  if (/push.+wallet|wallet.+push|send.+wallet/.test(normalized) && /information|update|notice/.test(normalized)) {
    decisions.push({
      id: `unsupported-wallet-push-${sourceRef}`,
      requirement: 'Push investment information directly to investor wallets',
      mismatchReason: 'The current prototype can record asset-servicing events, but it does not push arbitrary notices into wallets.',
      nearestEquivalent: 'Generate investor update records in Evidence Vault and keep wallet-push delivery outside MVP execution.',
      decision: 'pending',
      sourceRef,
    });
  }
  if (normalized.includes('oracle') && normalized.includes('automatic')) {
    decisions.push({
      id: `unsupported-auto-oracle-${sourceRef}`,
      requirement: 'Automatic oracle-driven NAV or lifecycle update',
      mismatchReason: 'Automatic oracle ingestion is outside the current Sepolia ERC-20-compatible executable prototype.',
      nearestEquivalent: 'Asset Servicing records a reviewed NAV update event after uploaded/source-checked valuation input.',
      decision: 'pending',
      sourceRef,
    });
  }
  if (normalized.includes('legal') && normalized.includes('compliant')) {
    decisions.push({
      id: `unsupported-legal-compliance-${sourceRef}`,
      requirement: 'Protocol guarantees legal or regulatory compliance',
      mismatchReason: 'Protocol selection can support technical controls but cannot make legal or compliance determinations.',
      nearestEquivalent: 'Mark relevant fields as counsel/compliance-confirmation required and keep evidence provenance.',
      decision: 'pending',
      sourceRef,
    });
  }
  return decisions;
}
