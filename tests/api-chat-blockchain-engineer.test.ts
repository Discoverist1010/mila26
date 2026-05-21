/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';

async function postChat(userMessage: string, requestedFocus?: string) {
  const app = createApp();
  const response = await app.inject({
    method: 'POST',
    url: '/api/chat/blockchain-engineer',
    payload: {
      userMessage,
      ...(requestedFocus ? { requestedFocus } : {}),
    },
  });
  await app.close();
  return response;
}

describe('blockchain engineer chat api', () => {
  it('returns a schema-shaped response for a valid request', async () => {
    const response = await postChat('I want to tokenize a portfolio for 20 investors.');
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.agentId).toBe('blockchain-engineer');
    expect(body.data.messageId).toEqual(expect.any(String));
    expect(body.data.content.length).toBeGreaterThan(0);
    expect(body.data.createdAt).toEqual(expect.any(String));
  });

  it('explains ERC-20 vs ERC-721 tradeoffs', async () => {
    const response = await postChat('Should this portfolio token use ERC-20 or ERC-721?', 'protocol_choice');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/ERC-20/i);
    expect(body.data.content).toMatch(/ERC-721/i);
    expect(body.data.protocolComparison.erc20).toMatch(/fungible/i);
    expect(body.data.protocolComparison.erc721).toMatch(/unique/i);
  });

  it('covers whitelist and allocation requirements', async () => {
    const response = await postChat('We need a whitelist for 20 wallet addresses and allocations.', 'whitelist');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/20/);
    expect(body.data.content).toMatch(/wallet/i);
    expect(body.data.content).toMatch(/100%/);
    expect(body.data.suggestedRequirementUpdates.length).toBeGreaterThan(0);
  });

  it('covers valuation and performance updates', async () => {
    const response = await postChat('How do we upload daily valuation and performance updates?', 'valuation_update');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/performance/i);
    expect(body.data.content).toMatch(/upload/i);
    expect(body.data.content).toMatch(/dashboard|event/i);
  });

  it('covers wallet-signed testnet deployment gates', async () => {
    const response = await postChat('Can we deploy to testnet and mint tokens?', 'deployment');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/testnet/i);
    expect(body.data.content).toMatch(/wallet/i);
    expect(body.data.content).toMatch(/PRD approval/i);
  });

  it('covers OpenZeppelin and QA/security review', async () => {
    const response = await postChat('What should the security and OpenZeppelin policy be?', 'security');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/OpenZeppelin/i);
    expect(body.data.content).toMatch(/QA/i);
    expect(body.data.content).toMatch(/Security Reviewer/i);
    expect(body.data.riskNotes.join(' ')).toMatch(/not a formal production audit/i);
  });

  it('rejects a blank userMessage with the API error envelope', async () => {
    const response = await postChat('   ');
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid Blockchain Engineering Bot chat request.',
        details: {
          fields: [
            {
              path: 'userMessage',
              message: 'userMessage is required.',
            },
          ],
        },
      },
    });
  });

  it('rejects invalid conversationHistory shape', async () => {
    const app = createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: {
        userMessage: 'Hello',
        conversationHistory: 'not-an-array',
      },
    });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});
