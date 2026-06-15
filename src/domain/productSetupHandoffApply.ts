import {
  parsePermittedStablecoins,
  type AssetServicingParameters,
  type MaturityParameters,
  type RedemptionParameters,
  type SubscriptionParameters,
} from './lifecycleState';
import type { ProductSetupFieldValue, ProductSetupHandoffSuggestion, ProductSetupHandoffTarget } from './productSetup';

export type ProductSetupHandoffLifecyclePatch = {
  permittedStablecoinsInput?: string;
  subscription?: Partial<SubscriptionParameters>;
  redemption?: Partial<RedemptionParameters>;
  assetServicing?: Partial<AssetServicingParameters>;
  maturity?: Partial<MaturityParameters>;
};

export function toProductSetupHandoffLifecyclePatch(
  target: ProductSetupHandoffTarget,
  suggestion: ProductSetupHandoffSuggestion,
): ProductSetupHandoffLifecyclePatch | undefined {
  const textValue = productSetupSuggestionTextValue(suggestion.value, suggestion.valueLabel);
  switch (target) {
    case 'subscription':
      return toSubscriptionHandoffPatch(suggestion, textValue);
    case 'redemption':
      return toRedemptionHandoffPatch(suggestion, textValue);
    case 'asset_servicing':
      return toAssetServicingHandoffPatch(suggestion, textValue);
    case 'maturity':
      return toMaturityHandoffPatch(suggestion, textValue);
    case 'investor_wallets':
    case 'contract_ops':
      return undefined;
    default:
      return undefined;
  }
}

export function canApplyProductSetupHandoffSuggestionToLifecycle(
  target: ProductSetupHandoffTarget,
  suggestion: ProductSetupHandoffSuggestion,
): boolean {
  if (!suggestion.targetFieldKey || suggestion.status !== 'pending') return false;
  return Boolean(toProductSetupHandoffLifecyclePatch(target, suggestion));
}

function toSubscriptionHandoffPatch(
  suggestion: ProductSetupHandoffSuggestion,
  textValue: string,
): ProductSetupHandoffLifecyclePatch | undefined {
  if (suggestion.targetFieldKey === 'permittedStablecoins') {
    const stablecoins = productSetupSuggestionStringList(suggestion.value, suggestion.valueLabel);
    if (stablecoins.length === 0) return undefined;
    return {
      permittedStablecoinsInput: stablecoins.join(', '),
      subscription: { permittedStablecoins: stablecoins },
    };
  }
  if (suggestion.targetFieldKey === 'paymentAddress') {
    return textValue ? { subscription: { paymentAddress: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'subscriptionWindow') {
    return textValue ? { subscription: { subscriptionWindow: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'subscriptionCadence') {
    return textValue ? { subscription: { subscriptionCadence: textValue, subscriptionWindow: textValue } } : undefined;
  }
  return undefined;
}

function toRedemptionHandoffPatch(
  suggestion: ProductSetupHandoffSuggestion,
  textValue: string,
): ProductSetupHandoffLifecyclePatch | undefined {
  if (suggestion.targetFieldKey === 'redemptionCadence') {
    return textValue ? { redemption: { redemptionCadence: textValue, redemptionWindow: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'redemptionWindow') {
    return textValue ? { redemption: { redemptionWindow: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'redemptionPayoutCadence') {
    return textValue ? { redemption: { redemptionPayoutCadence: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'redemptionWalletAddress') {
    return textValue ? { redemption: { redemptionWalletAddress: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'redemptionHandlingRule') {
    return textValue ? { redemption: { redemptionHandlingRule: textValue } } : undefined;
  }
  if (suggestion.targetFieldKey === 'redemptionDelay') {
    const delay = parseProductSetupRedemptionDelay(textValue);
    return delay ? { redemption: { redemptionDelayUnit: delay.unit, redemptionDelayValue: delay.value } } : undefined;
  }
  return undefined;
}

function toAssetServicingHandoffPatch(
  suggestion: ProductSetupHandoffSuggestion,
  textValue: string,
): ProductSetupHandoffLifecyclePatch | undefined {
  if (!textValue) return undefined;
  if (suggestion.targetFieldKey === 'navCadence') return { assetServicing: { navCadence: textValue } };
  if (suggestion.targetFieldKey === 'navSource') return { assetServicing: { navSource: textValue } };
  if (suggestion.targetFieldKey === 'incomePayoutCadence') return { assetServicing: { incomePayoutCadence: textValue } };
  if (suggestion.targetFieldKey === 'investorUpdateRule') return { assetServicing: { investorUpdateRule: textValue } };
  return undefined;
}

function toMaturityHandoffPatch(
  suggestion: ProductSetupHandoffSuggestion,
  textValue: string,
): ProductSetupHandoffLifecyclePatch | undefined {
  if (!textValue) return undefined;
  if (suggestion.targetFieldKey === 'maturityDate') return { maturity: { maturityDate: textValue } };
  if (suggestion.targetFieldKey === 'closeoutMethod') return { maturity: { closeoutMethod: textValue } };
  return undefined;
}

function productSetupSuggestionTextValue(value: ProductSetupFieldValue, fallback: string): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return fallback.trim();
}

function productSetupSuggestionStringList(value: ProductSetupFieldValue, fallback: string): string[] {
  if (Array.isArray(value)) return value.map((item) => item.trim().toUpperCase()).filter(Boolean);
  return parsePermittedStablecoins(productSetupSuggestionTextValue(value, fallback));
}

function parseProductSetupRedemptionDelay(value: string):
  | { unit: NonNullable<RedemptionParameters['redemptionDelayUnit']>; value: number }
  | undefined {
  const match = value.match(/\b(\d+)\s*(business\s+)?(minute|minutes|hour|hours|day|days)\b/i);
  if (!match) return undefined;
  const delayValue = Number(match[1]);
  const rawUnit = match[3].toLowerCase();
  const unit = rawUnit.startsWith('minute') ? 'minutes' : rawUnit.startsWith('hour') ? 'hours' : 'days';
  return Number.isFinite(delayValue) && delayValue > 0 ? { unit, value: delayValue } : undefined;
}
