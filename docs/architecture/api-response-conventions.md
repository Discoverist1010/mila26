# API Response Conventions

This convention keeps future MILA26 backend routes predictable without adding a heavy API framework around the current Fastify skeleton.

## Purpose

API responses should be easy for the frontend, tests, and future agents to validate. Routes should return stable shapes, safe error messages, and enough metadata for debugging without leaking secrets or internal traces.

`/api/health` may keep its current simple operational response:

```json
{
  "ok": true,
  "service": "mila26-api",
  "mode": "local-dev"
}
```

Product routes should use the conventions below when they are added.

## Success Responses

Use a small envelope:

```json
{
  "ok": true,
  "data": {},
  "meta": {}
}
```

- `ok` is always `true`.
- `data` contains the route contract payload.
- `meta` is optional and should stay small, such as request ID, run ID, pagination, or timing fields when needed.

Do not add generic envelope layers until real route consumers need them.

## Error Responses

Use a safe error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "SNAKE_CASE_ERROR_CODE",
    "message": "Human-readable safe message",
    "details": {}
  },
  "meta": {}
}
```

- `ok` is always `false`.
- `error.code` is stable and machine-readable.
- `error.message` is safe to show or log in local development.
- `error.details` is optional and must contain only safe, intentional details.
- `meta` is optional.

Future route-specific errors should distinguish validation failures, missing resources, security blocks, provider failures, compile/test failures, and user-cancelled runs.

## Request And Correlation IDs

Future routes should accept or generate a lightweight request/correlation ID when it helps debug longer flows. Do not add heavy observability infrastructure yet.

Guidance:

- Prefer a single `requestId` in response `meta` when needed.
- Preserve `runId`, `projectId`, `artifactId`, and similar domain IDs in route data where they are part of the contract.
- Do not require request IDs for `/api/health`.

## Validation Errors

Future product routes should validate request bodies before invoking LLMs, agents, blockchain tooling, persistence, or artifact generation.

Validation errors should:

- Return `ok: false`.
- Use a stable code such as `VALIDATION_ERROR`.
- Include safe field-level details when useful.
- Avoid dumping raw parser internals if they expose implementation details.

## Security

Never return:

- API keys, private keys, seed phrases, wallet secrets, or provider credentials.
- Raw LLM provider errors that may include prompts, account metadata, or secrets.
- Internal stack traces or filesystem paths in API responses.
- Sensitive chat, investor, wallet, valuation, or deployment details unless the route contract explicitly allows them.

Unexpected errors should return a generic safe message.

## Latency

Long-running future routes should not block indefinitely. Prefer returning a `runId`, status, or polling/streaming handle for work such as agent orchestration, PRD generation, Solidity compile/test, security benchmarking, evidence generation, or deployment status tracking.

Fast routes should stay deterministic and avoid unnecessary LLM/API calls.

## Anti-Overengineering

Keep response envelopes simple until real product routes require more. Do not add a full error taxonomy, observability platform, tracing system, or generated API client before the backend has concrete route consumers.
