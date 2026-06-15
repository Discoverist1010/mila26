import { describe, expect, it } from 'vitest';
import {
  canApplyProductSetupHandoffSuggestionToLifecycle,
  toProductSetupHandoffLifecyclePatch,
} from '../src/domain/productSetupHandoffApply';
import type { ProductSetupHandoffSuggestion } from '../src/domain/productSetup';

function suggestion(
  targetFieldKey: ProductSetupHandoffSuggestion['targetFieldKey'],
  value: ProductSetupHandoffSuggestion['value'],
  valueLabel = String(value),
): ProductSetupHandoffSuggestion {
  return {
    id: `suggestion-${targetFieldKey ?? 'guidance'}`,
    sourceFieldKey: 'subscription_stablecoins',
    targetFieldKey,
    label: 'Test suggestion',
    value,
    valueLabel,
    provenanceLabel: 'Stated',
    status: 'pending',
  };
}

describe('Product Setup handoff application mapper', () => {
  it('converts subscription stablecoin suggestions into destination-tab patches', () => {
    const patch = toProductSetupHandoffLifecyclePatch('subscription', suggestion('permittedStablecoins', ['usdc', 'dai']));

    expect(patch).toEqual({
      permittedStablecoinsInput: 'USDC, DAI',
      subscription: { permittedStablecoins: ['USDC', 'DAI'] },
    });
  });

  it('maps cadence suggestions to visible subscription and redemption window fields', () => {
    expect(toProductSetupHandoffLifecyclePatch('subscription', suggestion('subscriptionCadence', 'Quarterly'))).toMatchObject({
      subscription: { subscriptionCadence: 'Quarterly', subscriptionWindow: 'Quarterly' },
    });
    expect(toProductSetupHandoffLifecyclePatch('redemption', suggestion('redemptionCadence', 'Monthly'))).toMatchObject({
      redemption: { redemptionCadence: 'Monthly', redemptionWindow: 'Monthly' },
    });
  });

  it('parses redemption payout delays only when they can be applied safely', () => {
    const delay = suggestion('redemptionDelay', '10 business days');
    const unsupported = suggestion('redemptionDelay', 'after manual review');

    expect(canApplyProductSetupHandoffSuggestionToLifecycle('redemption', delay)).toBe(true);
    expect(toProductSetupHandoffLifecyclePatch('redemption', delay)).toEqual({
      redemption: { redemptionDelayUnit: 'days', redemptionDelayValue: 10 },
    });
    expect(canApplyProductSetupHandoffSuggestionToLifecycle('redemption', unsupported)).toBe(false);
  });

  it('keeps guidance-only handoffs as notes rather than mutating target state', () => {
    expect(toProductSetupHandoffLifecyclePatch('investor_wallets', suggestion(undefined, 29, '29 investors'))).toBeUndefined();
    expect(canApplyProductSetupHandoffSuggestionToLifecycle('contract_ops', suggestion(undefined, 'Admin role'))).toBe(false);
  });
});
