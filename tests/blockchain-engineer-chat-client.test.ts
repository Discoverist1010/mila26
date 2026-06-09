import { describe, expect, it, vi } from 'vitest';
import { askBlockchainEngineer } from '../src/api/blockchainEngineerChat';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('blockchain engineer chat client', () => {
  it('returns backend data from a successful response envelope', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          messageId: 'chat-1',
          agentId: 'blockchain-engineer',
          content: 'ERC-3643 is usually the stronger fit for whitelisted investor wallet products.',
          createdAt: '2026-05-21T00:00:00.000Z',
        },
      }),
    );

    const result = await askBlockchainEngineer(
      { userMessage: 'Which supported protocol base should we use?' },
      { baseUrl: 'http://api.test', fetcher },
    );

    expect(fetcher).toHaveBeenCalledWith('http://api.test/api/chat/blockchain-engineer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: 'Which supported protocol base should we use?' }),
    });
    expect(result).toEqual({
      ok: true,
      data: {
        messageId: 'chat-1',
        agentId: 'blockchain-engineer',
        content: 'ERC-3643 is usually the stronger fit for whitelisted investor wallet products.',
        createdAt: '2026-05-21T00:00:00.000Z',
      },
    });
  });

  it('maps backend API error envelopes to safe client errors', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid Blockchain Engineering Bot chat request.',
          },
        },
        { status: 400 },
      ),
    );

    const result = await askBlockchainEngineer({ userMessage: 'Hello' }, { baseUrl: 'http://api.test', fetcher });

    expect(result).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid Blockchain Engineering Bot chat request.',
    });
  });

  it('maps network failures to a safe client error', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:5174'));

    const result = await askBlockchainEngineer({ userMessage: 'Hello' }, { baseUrl: 'http://api.test', fetcher });

    expect(result).toEqual({
      ok: false,
      message: 'Could not reach the MILA26 API. Check that the local API server is running.',
    });
  });

  it('maps non-json app-shell responses to a useful local API setup error', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response('<!doctype html><div id="root"></div>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const result = await askBlockchainEngineer({ userMessage: 'Hello' }, { baseUrl: 'http://api.test', fetcher });

    expect(result).toEqual({
      ok: false,
      message:
        'The MILA26 API did not return JSON. Check that the backend API is running on the configured API port, not the Vite app.',
    });
  });

  it('guards blank input before calling fetch', async () => {
    const fetcher = vi.fn();

    const result = await askBlockchainEngineer({ userMessage: '   ' }, { baseUrl: 'http://api.test', fetcher });

    expect(fetcher).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      code: 'CLIENT_VALIDATION_ERROR',
      message: 'Enter a question before asking the bot.',
    });
  });
});
