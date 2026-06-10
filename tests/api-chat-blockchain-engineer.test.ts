/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import type { Mila26LlmProvider } from '../server/llm/types';

async function postChat(
  userMessage: string,
  requestedFocus?: string,
  assistantMode?: 'engineering' | 'advisor',
) {
  const app = createApp();
  const response = await app.inject({
    method: 'POST',
    url: '/api/chat/blockchain-engineer',
    payload: {
      userMessage,
      ...(assistantMode ? { assistantMode } : {}),
      ...(requestedFocus ? { requestedFocus } : {}),
    },
  });
  await app.close();
  return response;
}

describe('blockchain engineer chat api', () => {
  it('returns a schema-shaped response for a valid request', async () => {
    const response = await postChat('I want to tokenize a portfolio for 50 investors.');
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.agentId).toBe('blockchain-engineer');
    expect(body.data.messageId).toEqual(expect.any(String));
    expect(body.data.content.length).toBeGreaterThan(0);
    expect(body.data.createdAt).toEqual(expect.any(String));
  });

  it('treats rough Product Setup intent as guided intake before implementation planning', async () => {
    const response = await postChat('I want to create a tokenised portfolio with 22 investors.');
    const body = response.json();
    const serialized = JSON.stringify(body);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/Captured so far/i);
    expect(body.data.content).toMatch(/22/);
    expect(body.data.content).toMatch(/Before I recommend protocol settings or deployment steps/i);
    expect(body.data.content).toMatch(/not treat this as a fixed three-question form/i);
    expect(body.data.content).toMatch(/Product Setup Pack/i);
    expect(body.data.content).toMatch(/protocol-fit view/i);
    expect(body.data.openQuestions).toEqual([
      'What is the underlying product or asset pool?',
      'How should investors subscribe?',
      'Should only approved wallets be allowed to hold or receive the token?',
    ]);
    expect(body.data.suggestedRequirementUpdates).toEqual([
      expect.objectContaining({
        field: 'expected_investors',
        proposedValue: '22',
      }),
    ]);
    expect(serialized).not.toMatch(/Deploy ERC-20|mint tokens|KYC\/AML|legal entity/i);
  });

  it('treats user mind changes as Product Setup revisions to consolidate', async () => {
    const response = await postChat('Actually make it a credit fund instead of a mixed portfolio.');
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/revision to the working Product Setup/i);
    expect(body.data.content).toMatch(/not as a separate product/i);
    expect(body.data.content).toMatch(/which earlier requirement changed/i);
    expect(body.data.content).toMatch(/refresh the protocol-fit view/i);
    expect(body.data.openQuestions).toEqual([
      'Which earlier requirement should this replace?',
      'Should the older assumption be removed, kept as an alternative, or marked as deferred?',
    ]);
  });

  it('explains the four supported protocol bases and ERC-721 as out of scope', async () => {
    const response = await postChat('Which ERC protocol should this whitelisted portfolio token use?', 'protocol_choice');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/ERC-20/i);
    expect(body.data.content).toMatch(/ERC-3643/i);
    expect(body.data.content).toMatch(/ERC-721/i);
    expect(body.data.protocolComparison.erc20).toMatch(/fungible/i);
    expect(body.data.protocolComparison.erc4626).toMatch(/vault/i);
    expect(body.data.protocolComparison.erc3643).toMatch(/approved|permissioned/i);
    expect(body.data.protocolComparison.rebasingErc20).toMatch(/balances/i);
    expect(body.data.protocolComparison.erc721OutOfScope).toMatch(/not an active|out of.*scope/i);
  });

  it('keeps Advisor protocol explanations scoped to ZiLi-OS active protocol bases', async () => {
    const response = await postChat('Explain the differences between the different ERC protocols.', undefined, 'advisor');
    const body = response.json();
    const serialized = JSON.stringify(body);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/ERC-20/i);
    expect(body.data.content).toMatch(/ERC-4626/i);
    expect(body.data.content).toMatch(/ERC-3643/i);
    expect(body.data.content).toMatch(/rebasing/i);
    expect(body.data.content).toMatch(/ERC-721.*out of MVP scope/i);
    expect(serialized).not.toMatch(/ERC-1155|ERC-777|ERC-1400|ERC-3475/i);
  });

  it('covers whitelist and allocation requirements', async () => {
    const response = await postChat('We need a whitelist for 50 wallet addresses and allocations.', 'whitelist');
    const body = response.json();

    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/50/);
    expect(body.data.content).toMatch(/wallet/i);
    expect(body.data.content).toMatch(/evidence|token-holder/i);
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
    expect(body.data.content).toMatch(/Product Setup|generated artifacts/i);
  });

  it('supports Advisor mode for plain-language lifecycle Q&A', async () => {
    const response = await postChat('Where should I configure redemption delay?', undefined, 'advisor');
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.content).toMatch(/Advisor Bot view/i);
    expect(body.data.content).toMatch(/redemption/i);
    expect(body.data.nextRecommendedAction).toMatch(/Product Setup|current tab/i);
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
        expect(request.messages[0]?.content).toMatch(/conversation-first intake agent/i);
        expect(request.messages[0]?.content).toMatch(/replay your understanding/i);
        expect(request.messages[0]?.content).toMatch(/ask a small focused batch/i);
        expect(request.messages[0]?.content).toMatch(/Do not treat three questions as a hard limit/i);
        expect(request.messages[0]?.content).toMatch(/If the user changes their mind/i);
        expect(request.messages[0]?.content).toMatch(/attempt to consolidate/i);
        expect(request.messages[0]?.content).toMatch(/Do not jump straight to deployment/i);
        expect(request.messages[0]?.content).toMatch(/Product Setup Pack/i);
        expect(request.messages[0]?.content).toMatch(/recommended or selected ERC protocol base must guide later tab questions/i);
        expect(request.messages[0]?.content).toMatch(/Current workspace context/i);
        expect(request.messages[0]?.content).toMatch(/"label":"Product Setup"/i);
        expect(request.messages[0]?.content).toMatch(/Sepolia-only/i);
        expect(request.messages[0]?.content).toMatch(/recommended architecture target/i);
        expect(request.messages[0]?.content).toMatch(/current executable prototype/i);
        expect(request.messages[0]?.content).toMatch(/Do not return one long paragraph/i);
        expect(request.messages.at(-1)).toMatchObject({
          role: 'user',
          content: 'Can we deploy this tokenized fund?',
        });
        expect(request.temperature).toBeUndefined();
        expect(request.maxOutputTokens).toBeUndefined();
        expect(request.reasoningEffort).toBe('low');
        expect(request.textVerbosity).toBe('low');
        expect(request.metadata).toEqual(
          expect.objectContaining({
            promptBudgetName: 'blockchain_engineer_chat',
            estimatedInputTokens: expect.any(Number),
            maxEstimatedInputTokens: 6000,
            promptWithinBudget: true,
            historyTurnsIncluded: 0,
            historyTurnsOmitted: 0,
          }),
        );
        expect(JSON.stringify(request.metadata)).not.toContain('Can we deploy this tokenized fund?');

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
        projectContext: {
          activeTab: {
            id: 'requirements',
            label: 'Product Setup',
          },
          productSetup: {
            selectedProtocolBase: null,
            recommendedProtocol: 'ERC-3643',
            missingCanonicalInputs: ['Protocol base'],
          },
        },
      },
    });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.agentId).toBe('blockchain-engineer');
    expect(body.data.responseSource).toBe('live_model');
    expect(body.data.content).toContain('Provider answer');
    expect(body.data.nextRecommendedAction).toMatch(/Continue Product Setup/i);
    expect(JSON.stringify(body)).not.toContain('test-model');
    expect(JSON.stringify(body)).not.toContain('rawProviderDebug');
  });

  it('omits oldest optional history instead of truncating the current user message', async () => {
    let capturedMessages: unknown[] = [];
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete(request) {
        capturedMessages = request.messages;
        expect(request.metadata).toEqual(
          expect.objectContaining({
            historyTurnsIncluded: 1,
            historyTurnsOmitted: 5,
            promptWithinBudget: true,
          }),
        );

        return {
          content: 'Provider answer with reduced history but intact current user message.',
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
        userMessage: 'Current user message must remain intact.',
        conversationHistory: Array.from({ length: 6 }, (_, index) => ({
          messageId: `history-${index}`,
          role: index === 5 ? 'assistant' : 'user',
          content: index === 5 ? 'short recent answer' : 'x'.repeat(25_000),
          createdAt: '2026-06-06T00:00:00.000Z',
        })),
      },
    });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.responseSource).toBe('live_model');
    expect(capturedMessages.at(-1)).toEqual({
      role: 'user',
      content: 'Current user message must remain intact.',
    });
    expect(capturedMessages).toContainEqual({ role: 'assistant', content: 'short recent answer' });
    expect(JSON.stringify(capturedMessages)).not.toContain('x'.repeat(200));
  });

  it('falls back without calling the LLM when the current user message alone exceeds prompt budget', async () => {
    let providerCalled = false;
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete() {
        providerCalled = true;
        return {
          content: 'This should not be used.',
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
        userMessage: `Can we deploy to testnet? ${'x'.repeat(30_000)}`,
        requestedFocus: 'deployment',
      },
    });
    await app.close();
    const body = response.json();

    expect(providerCalled).toBe(false);
    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.responseSource).toBe('local_fallback');
    expect(body.data.content).toMatch(/Deployment should stay Sepolia testnet-only/i);
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
    expect(body.data.responseSource).toBe('local_fallback');
    expect(body.data.content).toMatch(/Deployment should stay Sepolia testnet-only/i);
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
        userMessage: 'Which supported protocol base should this whitelisted portfolio token use?',
        requestedFocus: 'protocol_choice',
      },
    });
    await app.close();
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.responseSource).toBe('local_fallback');
    expect(body.data.content).toMatch(/ERC-20/i);
    expect(body.data.content).toMatch(/ERC-3643/i);
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
    expect(body.data.responseSource).toBe('local_fallback');
    expect(body.data.content).toMatch(/Deployment should stay Sepolia testnet-only/i);
    expect(serialized).not.toContain('OPENAI_API_KEY');
    expect(serialized).not.toContain('sk-test-secret');
    expect(serialized).not.toContain('MILA26_LLM_MODEL');
    expect(serialized).not.toContain('stack trace');
    expect(serialized).not.toContain('test-model');
  });
});
