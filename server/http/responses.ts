export type ApiMeta = Record<string, unknown>;

export type ApiSuccess<TData> = {
  ok: true;
  data: TData;
  meta?: ApiMeta;
};

export type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: ApiMeta;
  };
  meta?: ApiMeta;
};

export function ok<TData>(data: TData, meta?: ApiMeta): ApiSuccess<TData> {
  return meta ? { ok: true, data, meta } : { ok: true, data };
}

export function fail(code: string, message: string, details?: ApiMeta, meta?: ApiMeta): ApiError {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    ...(meta ? { meta } : {}),
  };
}
