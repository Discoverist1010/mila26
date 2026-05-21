# MILA26 Current Checkpoint

## One-Page Summary

MILA26 is a non-throwaway, funding-demo-ready MVP foundation for an AI + blockchain tokenisation project workspace for asset managers.

The product helps a small asset manager move from a plain-language tokenisation intent into a structured requirement brief, ERC-20/ERC-721 guidance, generated technical artifacts, QA/security review, evidence packs, and later wallet-signed Ethereum testnet deployment flows.

## Current Product Direction

- Build a professional AI + blockchain workspace, not a disposable prototype or crypto trading dashboard.
- Start with one local Mac laptop MVP for one asset manager and up to 20 investor wallets.
- Keep the MVP testnet-only and funding-demo credible.
- Use the Blockchain Engineering Bot as the first backend product route.
- Keep user wallet signing as the deployment model; the backend must not hold private keys.

## Current Architecture

- Frontend: Vite, React, TypeScript.
- Backend: lightweight Fastify server in `server/`.
- Contracts: Zod-backed schemas and JSON fixtures for stable request/response and artifact shapes.
- API convention: product routes use `{ ok: true, data }` and `{ ok: false, error }`; `/api/health` remains a simple operational endpoint.
- LLM boundary: planned backend-only provider adapter; current chat uses a deterministic mock provider.
- Persistence, wallet tooling, Solidity tooling, orchestration backend, payments, and auth are not implemented yet.

## Completed Tracks

- Track 0: context and architecture baseline.
- Track 1: contract fixtures/tests.
- Track 1B: contract reference cleanup.
- Track 2A: MVP journey, scope, and stack docs.
- Track 2B: backend/API boundary planning.
- Track 2C: minimal Fastify backend skeleton.
- Track 2C.1: API response/error conventions.
- Track 3A: Blockchain Engineering Bot chat planning.
- Track 3B: backend mock chat route.
- Track 3B.1: chat fixtures/tests.
- UX Track A: UX vision and frontend architecture docs.
- UX Track B / Track 3C planning: minimal frontend chat integration plan.

## Current Repo Capabilities

- Vite/React/TypeScript frontend beta.
- Fastify backend skeleton.
- `GET /api/health`.
- API response/error conventions.
- `POST /api/chat/blockchain-engineer` using mock/deterministic provider.
- Chat request/response schemas.
- Chat fixtures/tests.
- UX vision/frontend architecture docs.
- Track 3C planning docs.

## Current UX Direction

MILA26 should feel like an enhanced ChatGPT-style project workspace with visible project context, workflow gates, agent progress, evidence, and later wallet/deployment controls. The current app UI remains a beta surface; do not redesign it during the next minimal chat integration.

## Current Next Step

Track 3C minimal frontend chat integration.

Connect the existing Blockchain Engineering Bot panel in `src/App.tsx` to the backend mock route through a small typed frontend API client, keeping state local and preserving the current beta journey.

## What Must Not Be Done Yet

- No real LLM integration.
- No persistence, memory, database, or vector store.
- No wallet/blockchain tooling.
- No Solidity tooling.
- No PRD/orchestration implementation.
- No payments.
- No auth.
- No full UI redesign.
- No broad refactors or new dependencies unless a specific track justifies them.
