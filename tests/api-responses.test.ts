/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { fail, ok } from '../server/http/responses';

describe('api response helpers', () => {
  it('creates a lightweight success envelope', () => {
    expect(ok({ id: 'example' }, { requestId: 'req-1' })).toEqual({
      ok: true,
      data: { id: 'example' },
      meta: { requestId: 'req-1' },
    });
  });

  it('creates a safe error envelope', () => {
    expect(fail('VALIDATION_ERROR', 'Invalid request.', { field: 'fundName' })).toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request.',
        details: { field: 'fundName' },
      },
    });
  });
});
