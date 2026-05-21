/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';

describe('api health route', () => {
  it('returns the stable local backend health payload', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: 'mila26-api',
      mode: 'local-dev',
    });
  });

  it('returns a safe structured error for unknown routes', async () => {
    const app = createApp();

    const response = await app.inject({
      method: 'GET',
      url: '/api/unknown',
    });

    await app.close();

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });
});
