import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import type { Mila26LlmProvider } from '../server/llm/types';

describe('Product Setup extraction API', () => {
  it('uses an injected LLM provider to return schema-validated Product Setup facts', async () => {
    const provider: Mila26LlmProvider = {
      provider: 'openai',
      model: 'test-model',
      async complete(request) {
        expect(request.purpose).toBe('product_setup_extraction');
        expect(request.reasoningEffort).toBe('minimal');
        expect(request.textVerbosity).toBe('low');
        expect(request.textFormat).toMatchObject({
          type: 'json_schema',
          name: 'mila26_product_setup_extraction',
        });
        expect(request.metadata).toEqual(
          expect.objectContaining({
            route: 'product-setup-extraction',
            promptBudgetName: 'product_setup_extraction',
            maxEstimatedInputTokens: 3500,
          }),
        );
        expect(request.messages[0]?.content).toMatch(/Do not invent/i);
        expect(request.messages[0]?.content).toMatch(/income distribution yes/i);
        expect(request.messages[1]?.content).toContain('Income distribution - yes');

        return {
          content: JSON.stringify({
            facts: [
              {
                fieldKey: 'protocol_base',
                value: 'ERC-20',
                status: 'user_stated',
                confidence: 0.94,
                sourceQuote: 'the protocol should be erc-20',
                rationale: 'User explicitly selected ERC-20.',
                targetTab: 'product_setup',
              },
              {
                fieldKey: 'income_treatment',
                value: 'Distributing',
                status: 'user_stated',
                confidence: 0.93,
                sourceQuote: 'Income distribution - yes',
                rationale: 'User confirmed income distribution.',
                targetTab: 'asset_servicing',
              },
              {
                fieldKey: 'income_payout_cadence',
                value: 'Quarterly',
                status: 'user_stated',
                confidence: 0.92,
                sourceQuote: 'income will be distributed quarterly',
                rationale: 'User stated quarterly income distribution.',
                targetTab: 'asset_servicing',
              },
              {
                fieldKey: 'maturity_date',
                value: '3 years after IPO date of 8 Nov 2026',
                status: 'user_stated',
                confidence: 0.91,
                sourceQuote: 'maturity is 3 years after IPO date of 8 Nov 2026',
                rationale: 'User stated a maturity term relative to IPO date.',
                targetTab: 'maturity',
              },
            ],
            warnings: [],
          }),
          provider: 'openai',
          model: 'test-model',
        };
      },
    };
    const app = createApp({ productSetupExtractionLlmProvider: provider });

    const response = await app.inject({
      method: 'POST',
      url: '/api/product-setup/extract',
      payload: {
        userMessage:
          'The protocol should be erc-20. Income distribution - yes. Income will be distributed quarterly. Maturity is 3 years after IPO date of 8 Nov 2026.',
        sourceRef: 'chat_turn_test',
        productSetupContext: {
          selectedProtocolBase: null,
          canonicalFields: {},
        },
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      extractionSource: 'llm',
      facts: [
        expect.objectContaining({ fieldKey: 'protocol_base', value: 'ERC-20' }),
        expect.objectContaining({ fieldKey: 'income_treatment', value: 'Distributing' }),
        expect.objectContaining({ fieldKey: 'income_payout_cadence', value: 'Quarterly' }),
        expect.objectContaining({ fieldKey: 'maturity_date', value: '3 years after IPO date of 8 Nov 2026' }),
      ],
      warnings: [],
    });
  });

  it('returns a fallback signal when no real provider is configured', async () => {
    const app = createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/product-setup/extract',
      payload: {
        userMessage: 'Income distribution - yes.',
        sourceRef: 'chat_turn_no_provider',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      data: {
        extractionSource: 'fallback_unavailable',
        facts: [],
      },
    });
  });

  it('rejects invalid extraction requests', async () => {
    const app = createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/product-setup/extract',
      payload: {
        userMessage: '',
        sourceRef: 'chat_turn_invalid',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
  });
});
