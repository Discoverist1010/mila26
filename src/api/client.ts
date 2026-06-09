export const defaultApiBaseUrl = 'http://127.0.0.1:5174';

export type ApiSuccess<TData> = {
  ok: true;
  data: TData;
  meta?: Record<string, unknown>;
};

export type ApiErrorEnvelope = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: Record<string, unknown>;
};

export type ApiClientResult<TData> =
  | { ok: true; data: TData }
  | { ok: false; message: string; code?: string };

type RequestJsonOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

function getConfiguredApiBaseUrl(): string {
  return import.meta.env.VITE_MILA26_API_BASE_URL || defaultApiBaseUrl;
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorEnvelope(value: unknown): value is ApiErrorEnvelope {
  if (!isRecord(value) || value.ok !== false || !isRecord(value.error)) {
    return false;
  }

  return typeof value.error.code === 'string' && typeof value.error.message === 'string';
}

function isApiSuccessEnvelope<TData>(value: unknown): value is ApiSuccess<TData> {
  return isRecord(value) && value.ok === true && 'data' in value;
}

export async function requestJson<TData>(
  path: string,
  body: unknown,
  options: RequestJsonOptions = {},
): Promise<ApiClientResult<TData>> {
  const baseUrl = options.baseUrl ?? getConfiguredApiBaseUrl();
  const fetcher = options.fetcher ?? fetch;

  try {
    const response = await fetcher(joinUrl(baseUrl, path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('Content-Type') ?? '';
    const payload: unknown = contentType.includes('application/json') ? await response.json().catch(() => undefined) : undefined;

    if (isApiErrorEnvelope(payload)) {
      return { ok: false, code: payload.error.code, message: payload.error.message };
    }

    if (!response.ok) {
      return { ok: false, message: 'The MILA26 API returned an unexpected error.' };
    }

    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        message:
          'The MILA26 API did not return JSON. Check that the backend API is running on the configured API port, not the Vite app.',
      };
    }

    if (isApiSuccessEnvelope<TData>(payload)) {
      return { ok: true, data: payload.data };
    }

    return { ok: false, message: 'The MILA26 API returned an unexpected response.' };
  } catch {
    return { ok: false, message: 'Could not reach the MILA26 API. Check that the local API server is running.' };
  }
}
