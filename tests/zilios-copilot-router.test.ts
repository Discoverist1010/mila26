import { describe, expect, it } from 'vitest';
import { routeZiLiOSCopilotMessage } from '../src/domain/ziliosCopilotRouter';

describe('ZiLi-OS Copilot router', () => {
  it('routes explanation-only concept questions to Advisor', () => {
    expect(routeZiLiOSCopilotMessage('What is an admin wallet?')).toMatchObject({
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor view'],
    });
  });

  it('keeps explanation-only lifecycle terms in Advisor instead of treating concept words as setup facts', () => {
    expect(routeZiLiOSCopilotMessage('Explain redemption delay.')).toMatchObject({
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor view'],
    });
  });

  it('routes product requirement notes to Engineering', () => {
    expect(
      routeZiLiOSCopilotMessage(
        'We are tokenising a private credit product for 30 investors with USDC subscriptions.',
      ),
    ).toMatchObject({
      route: 'engineering',
      assistantMode: 'engineering',
      shouldExtractRequirements: true,
      labels: ['Engineering view'],
    });
  });

  it('routes mixed uncertainty and product facts to both bot lenses', () => {
    expect(
      routeZiLiOSCopilotMessage(
        'I am not sure how to structure this, but we have 20 investors and quarterly redemption.',
      ),
    ).toMatchObject({
      route: 'mixed',
      assistantMode: 'engineering',
      shouldExtractRequirements: true,
      labels: ['Advisor view', 'Engineering view'],
    });
  });

  it('defaults unclear input to Engineering so Product Setup keeps moving', () => {
    expect(routeZiLiOSCopilotMessage('hello')).toMatchObject({
      route: 'engineering',
      assistantMode: 'engineering',
      shouldExtractRequirements: true,
      labels: ['Engineering view'],
    });
  });
});
