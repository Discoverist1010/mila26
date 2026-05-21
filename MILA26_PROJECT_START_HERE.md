# MILA26 Project Start Here

## What MILA26 Is

MILA26 is a non-throwaway, funding-demo-ready MVP foundation for an AI + blockchain tokenisation project workspace for asset managers.

It helps an asset manager move from a plain-language tokenisation intent into structured requirements, ERC-20/ERC-721 guidance, generated technical artifacts, QA/security review, evidence packs, and later wallet-signed Ethereum testnet deployment flows.

## Current Completed Tracks

- Track 0: context and architecture baseline.
- Track 1 / 1B: contract fixtures, tests, and contract reference docs.
- Track 2A: MVP journey, scope, and stack docs.
- Track 2B: backend/API boundary planning.
- Track 2C / 2C.1: minimal Fastify backend skeleton plus API response/error conventions.
- Track 3A: Blockchain Engineering Bot chat planning.
- Track 3B / 3B.1: backend mock chat route plus chat fixtures/tests.
- UX Track A: UX vision and frontend architecture docs.
- UX Track B / Track 3C planning: minimal frontend chat integration plan.

## Current Architecture Principles

- Stable contracts, flexible intelligence.
- Minimal necessary complexity.
- Local Mac laptop MVP first.
- Backend-only LLM calls and secrets.
- User wallet signs deployment; backend never holds private keys.
- Testnet-only MVP.
- Contract changes must update docs, fixtures, schemas/types, runtime consumers/producers, and tests together.

## Current UX Direction

MILA26 should become a professional AI + blockchain project workspace for asset managers. The target experience is an enhanced ChatGPT-style workspace with visible project context, workflow gates, agent progress, evidence, and later wallet/deployment controls.

Approved UX mockup: `docs/assets/ux/mila26_dashboard_v2.png`.

This mockup is the canonical near-term UX direction reference, not a pixel-perfect implementation mandate.

Do not redesign the UI during the immediate next step. First prove the existing chat panel can call the backend mock route safely.

## Immediate Next Step

Track 3C: minimal frontend chat integration.

Implement:

- `src/api/client.ts`.
- `src/api/blockchainEngineerChat.ts`.
- `VITE_MILA26_API_BASE_URL`, defaulting to `http://127.0.0.1:5174`.
- Existing `src/App.tsx` Blockchain Engineering Bot panel connected to `POST /api/chat/blockchain-engineer`.
- Local loading and safe error states.
- Blank input guard.
- Mocked-fetch tests.
- Light README/doc updates if needed.
- `npm run check`.

## Files To Read Next

- `docs/handover/00-mila26-current-checkpoint.md`
- `docs/handover/01-mila26-project-instructions-for-chatgpt.md`
- `docs/handover/02-mila26-codex-working-rules.md`
- `docs/handover/03-mila26-track-status.md`
- `docs/handover/04-mila26-next-prompts.md`
- `docs/architecture/frontend-chat-integration.md`
- `docs/architecture/api-response-conventions.md`
- `docs/contracts/chat-contract.md`
- `server/contracts/chat.ts`
- `server/routes/blockchainEngineerChat.ts`
- `src/App.tsx`

## Do Not Do Yet

- No real LLM.
- No persistence or memory.
- No wallet/blockchain tooling.
- No Solidity tooling.
- No PRD generation.
- No orchestration.
- No payments.
- No auth.
- No full UI redesign.
- No global state library.
- No broad refactor.
