import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/App';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('App Blockchain Engineer Bot panel', () => {
  it('shows local preview before asking and then renders a backend mock answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: {
          messageId: 'chat-1',
          agentId: 'blockchain-engineer',
          content: 'Backend mock says ERC-20 is suitable for fungible portfolio shares.',
          createdAt: '2026-05-21T00:00:00.000Z',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(screen.getByText('KangLe AI')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Tokenized Income Fund' })).toBeVisible();
    expect(screen.getByLabelText('Project navigation')).toBeVisible();
    expect(screen.getByLabelText('Project status and assistant')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Project setup' })).toBeVisible();
    expect(screen.getByText('Define tokenisation requirement')).toBeVisible();
    expect(screen.getByText('Local preview shown until a backend response is available.')).toBeVisible();

    fireEvent.change(screen.getByRole('textbox', { name: 'Blockchain Engineer Bot question' }), {
      target: { value: 'Should we use ERC-20 or ERC-721?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Blockchain Engineer' }));

    expect(screen.getByRole('button', { name: 'Asking bot...' })).toBeDisabled();
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Waiting for Blockchain Engineer Bot...');

    await waitFor(() => {
      expect(screen.getByText('Backend mock response.')).toBeVisible();
    });
    expect(screen.getByTestId('engineer-answer')).toHaveTextContent('Backend mock says ERC-20');
  });

  it('blocks blank input before calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Blockchain Engineer Bot question' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Blockchain Engineer' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a question before asking the bot.');
  });

  it('shows a safe error and local fallback when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    render(<App />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Blockchain Engineer Bot question' }), {
      target: { value: 'How should deployment work?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Blockchain Engineer' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Could not reach the MILA26 API. Check that the local API server is running.',
      );
    });
    expect(screen.getByText('Local preview shown until a backend response is available.')).toBeVisible();
  });
});
