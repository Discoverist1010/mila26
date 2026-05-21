/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import type { Mila26LlmProvider } from '../server/llm/types';

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

  it('uses an injected real LLM provider and returns provider-generated assistant content', async () => {
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete(request) {
        expect(request.purpose).toBe('blockchain_engineer_chat');
        expect(request.messages[0]).toMatchObject({
          role: 'system',
        });
        expect(request.messages.at(-1)).toMatchObject({
          role: 'user',
          content: 'Can we deploy this tokenized fund?',
        });

        return {
          content:
            'Provider answer: keep MILA26 on Ethereum testnet, prepare only wallet-signed deployment intent, and do not hold private keys.',
          provider: 'openai',
          model: 'test-model',
          metadata: {
            rawProviderDebug: 'must-not-leak',
          },
        };
      },
    };

    const app = createApp({ blockchainEngineerLlmProvider: provider });
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: {
        userMessage: 'Can we deploy this tokenized fund?',
        requestedFocus: 'deployment',
      },
    });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.agentId).toBe('blockchain-engineer');
    expect(body.data.content).toContain('Provider answer');
    expect(JSON.stringify(body)).not.toContain('test-model');
    expect(JSON.stringify(body)).not.toContain('rawProviderDebug');
  });

  it('falls back to deterministic mock behavior when the injected LLM provider fails', async () => {
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete() {
        throw new Error('OPENAI_API_KEY=sk-test-secret stack trace from provider');
      },
    };

    const app = createApp({ blockchainEngineerLlmProvider: provider });
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: {
        userMessage: 'Can we deploy to testnet and mint tokens?',
        requestedFocus: 'deployment',
      },
    });
    await app.close();
    const body = response.json();
    const serialized = JSON.stringify(body);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/Deployment should stay Ethereum testnet-only/i);
    expect(body.data.content).toMatch(/user wallet must sign/i);
    expect(serialized).not.toContain('OPENAI_API_KEY');
    expect(serialized).not.toContain('sk-test-secret');
    expect(serialized).not.toContain('stack trace');
    expect(serialized).not.toContain('test-model');
  });

  it('falls back to deterministic mock behavior when the LLM provider returns invalid output', async () => {
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete() {
        return {
          content: '   ',
          provider: 'openai',
          model: 'test-model',
        };
      },
    };

    const app = createApp({ blockchainEngineerLlmProvider: provider });
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: {
        userMessage: 'Should this portfolio token use ERC-20 or ERC-721?',
        requestedFocus: 'protocol_choice',
      },
    });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/ERC-20/i);
    expect(body.data.content).toMatch(/ERC-721/i);
    expect(JSON.stringify(body)).not.toContain('test-model');
  });

  it('falls back instead of returning provider text that looks like leaked internals', async () => {
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete() {
        return {
          content: 'debug stack trace OPENAI_API_KEY=sk-test-secret MILA26_LLM_MODEL=test-model',
          provider: 'openai',
          model: 'test-model',
        };
      },
    };

    const app = createApp({ blockchainEngineerLlmProvider: provider });
    const response = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: {
        userMessage: 'Can we deploy to testnet and mint tokens?',
        requestedFocus: 'deployment',
      },
    });
    await app.close();
    const body = response.json();
    const serialized = JSON.stringify(body);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/Deployment should stay Ethereum testnet-only/i);
    expect(serialized).not.toContain('OPENAI_API_KEY');
    expect(serialized).not.toContain('sk-test-secret');
    expect(serialized).not.toContain('MILA26_LLM_MODEL');
    expect(serialized).not.toContain('stack trace');
    expect(serialized).not.toContain('test-model');
  });
});
