/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import {
  BlockchainEngineerChatRequestSchema,
  BlockchainEngineerChatResponseSchema,
} from '../server/contracts/chat';
import chatRequestFixture from './fixtures/contracts/blockchain-engineer-chat-request.json';
import chatResponseFixture from './fixtures/contracts/blockchain-engineer-chat-response.json';
import chatValidationErrorFixture from './fixtures/contracts/blockchain-engineer-chat-validation-error.json';

describe('blockchain engineer chat contract fixtures', () => {
  it('parses the request fixture through the current chat request schema', () => {
    const request = BlockchainEngineerChatRequestSchema.parse(chatRequestFixture);

    expect(request.userMessage).toMatch(/supported protocol base/i);
    expect(request.conversationHistory).toHaveLength(2);
    expect(request.projectContext?.investorWalletCount).toBe(50);
    expect(request.requestedFocus).toBe('protocol_choice');
  });

  it('parses the response fixture through the current chat response schema', () => {
    const response = BlockchainEngineerChatResponseSchema.parse(chatResponseFixture);

    expect(response.agentId).toBe('blockchain-engineer');
    expect(response.content.length).toBeGreaterThan(0);
    expect(response.protocolComparison?.erc20).toMatch(/fungible/i);
    expect(response.protocolComparison?.erc3643).toMatch(/approved|permissioned/i);
    expect(response.protocolComparison?.erc721OutOfScope).toMatch(/not an active/i);
    expect(response.suggestedRequirementUpdates?.length).toBeGreaterThan(0);
  });

  it('captures the validation error envelope fixture', () => {
    expect(chatValidationErrorFixture).toEqual({
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

  it('accepts the request fixture through the live chat route', async () => {
    const app = createApp();

    const routeResponse = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: chatRequestFixture,
    });

    await app.close();

    const body = routeResponse.json();
    expect(routeResponse.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(BlockchainEngineerChatResponseSchema.parse(body.data).agentId).toBe('blockchain-engineer');
    expect(body.data.content.length).toBeGreaterThan(0);
  });

  it('rejects blank userMessage with the documented validation envelope shape', async () => {
    const app = createApp();

    const routeResponse = await app.inject({
      method: 'POST',
      url: '/api/chat/blockchain-engineer',
      payload: {
        ...chatRequestFixture,
        userMessage: ' ',
      },
    });

    await app.close();

    const body = routeResponse.json();
    expect(routeResponse.statusCode).toBe(400);
    expect(body.error.code).toBe(chatValidationErrorFixture.error.code);
    expect(body.error.message).toBe(chatValidationErrorFixture.error.message);
    expect(body.error.details.fields).toContainEqual({
      path: 'userMessage',
      message: 'userMessage is required.',
    });
  });
});
