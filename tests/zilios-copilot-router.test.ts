import { describe, expect, it } from 'vitest';
import { routeZiLiOSCopilotMessage } from '../src/domain/ziliosCopilotRouter';

describe('ZiLi-OS Copilot router', () => {
  it('routes explanation-only concept questions to Advisor', () => {
    expect(routeZiLiOSCopilotMessage('What is an admin wallet?')).toMatchObject({
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor Bot'],
    });
  });

  it('keeps explanation-only lifecycle terms in Advisor instead of treating concept words as setup facts', () => {
    expect(routeZiLiOSCopilotMessage('Explain redemption delay.')).toMatchObject({
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor Bot'],
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
      labels: ['Engineering Bot'],
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
      labels: ['Advisor Bot', 'Engineering Bot'],
    });
  });

  it('routes protocol confusion to Advisor before extracting more Product Setup facts', () => {
    expect(
      routeZiLiOSCopilotMessage(
        'I am still confused by ERC-3643 or ERC-20. Why do you recommend 3643 when the executable prototype is ERC-20?',
      ),
    ).toMatchObject({
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor Bot'],
    });
  });

  it('extracts direct protocol selections even when the message is short', () => {
    expect(routeZiLiOSCopilotMessage('will use erc 20')).toMatchObject({
      route: 'engineering',
      assistantMode: 'engineering',
      shouldExtractRequirements: true,
      labels: ['Engineering Bot'],
    });
  });

  it('defaults unclear input to Engineering so Product Setup keeps moving', () => {
    expect(routeZiLiOSCopilotMessage('hello')).toMatchObject({
      route: 'engineering',
      assistantMode: 'engineering',
      shouldExtractRequirements: true,
      labels: ['Engineering Bot'],
    });
  });
});
