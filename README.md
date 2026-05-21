# MILA26

MILA26 is a clean beta rebuild of the MILA dashboard. It is designed as a compact CTO and developer team for a small asset manager preparing tokenized products.

## Beta Capabilities

- Blockchain Engineer Bot: guides non-technical users and creates a structured requirement brief.
- Coding Bot: coordinates implementation and spawns parallel mini-bots.
- Mini Coding Bots: generate contract, API, frontend, and test artifacts in parallel.
- Security Reviewer Bot: blocks unsafe outputs before release.
- Evidence & Documentation Bot: creates asset-manager-facing evidence packs.
- Deploy Simulation: creates a deployment manifest without enabling live deployment.

## Development

```bash
npm install
npm run dev
```

Run the local API skeleton in a second terminal:

```bash
npm run dev:api
```

The backend exposes `GET /api/health`, a mock-provider `POST /api/chat/blockchain-engineer` route, and deterministic `POST /api/prd/engineering-brief` route on `http://127.0.0.1:5174` by default. Real LLM calls, persistence, wallet integration, and deployment behavior are intentionally not implemented yet.

The frontend chat client also defaults to `http://127.0.0.1:5174`. Override it for local testing with:

```bash
VITE_MILA26_API_BASE_URL=http://127.0.0.1:5174 npm run dev
```

Run checks:

```bash
npm run check
npm run test:e2e
```

## Architecture and Rewrite Guidance

- MVP user journey: [`docs/product/mvp-user-journey.md`](docs/product/mvp-user-journey.md)
- MVP scope: [`docs/product/mvp-scope.md`](docs/product/mvp-scope.md)
- UI/UX vision: [`docs/product/ui-ux-vision.md`](docs/product/ui-ux-vision.md)
- Approved UX mockup: [`docs/assets/ux/mila26_dashboard_v2.png`](docs/assets/ux/mila26_dashboard_v2.png) (directional reference, not a pixel-perfect implementation mandate)
- MVP screen flow: [`docs/product/mvp-screen-flow.md`](docs/product/mvp-screen-flow.md)
- Current context pack: [`docs/context-pack/`](docs/context-pack/)
- Contract reference: [`docs/contracts/README.md`](docs/contracts/README.md)
- MVP API contract index: [`docs/contracts/mvp-api-contracts.md`](docs/contracts/mvp-api-contracts.md)
- Engineering principles: [`docs/architecture/engineering-principles.md`](docs/architecture/engineering-principles.md)
- Architecture guardrails: [`docs/architecture/architecture-guardrails.md`](docs/architecture/architecture-guardrails.md)
- Backend/API boundary: [`docs/architecture/backend-api-boundary.md`](docs/architecture/backend-api-boundary.md)
- API response conventions: [`docs/architecture/api-response-conventions.md`](docs/architecture/api-response-conventions.md)
- Blockchain Engineer chat MVP: [`docs/architecture/blockchain-engineer-chat-mvp.md`](docs/architecture/blockchain-engineer-chat-mvp.md)
- Frontend chat integration plan: [`docs/architecture/frontend-chat-integration.md`](docs/architecture/frontend-chat-integration.md)
- Frontend UX architecture: [`docs/architecture/frontend-ux-architecture.md`](docs/architecture/frontend-ux-architecture.md)
- Frontend component plan: [`docs/architecture/frontend-component-plan.md`](docs/architecture/frontend-component-plan.md)
- MVP stack decisions: [`docs/architecture/mvp-stack-decisions.md`](docs/architecture/mvp-stack-decisions.md)
- Wallet-signed deployment: [`docs/architecture/wallet-signed-deployment.md`](docs/architecture/wallet-signed-deployment.md)
- Agent orchestration MVP: [`docs/architecture/agent-orchestration-mvp.md`](docs/architecture/agent-orchestration-mvp.md)
- MVP memory design: [`docs/architecture/memory-design-mvp.md`](docs/architecture/memory-design-mvp.md)
- MVP track plan: [`docs/architecture/mvp-track-plan.md`](docs/architecture/mvp-track-plan.md)
- Rewrite strategy: [`docs/architecture/rewrite-strategy.md`](docs/architecture/rewrite-strategy.md)
- Future stack considerations: [`docs/architecture/future-stack-considerations.md`](docs/architecture/future-stack-considerations.md)

## Security Defaults

- No secrets are committed.
- No API keys, seed phrases, or private keys are accepted into chat.
- Real deployment is disabled unless `ENABLE_REAL_DEPLOY=true`.
- Generated code and model output are rendered as text, not raw HTML.

## Legacy Policy

The previous MILA dashboard repo is reference-only. Do not copy its history, hardcoded proxy files, debug HTML sandboxes, giant HTML entrypoints, or browser secret storage into this repo.
