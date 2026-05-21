# MVP Track Plan

This plan supersedes the earlier generic rewrite sequence for MVP delivery planning. It remains documentation-first and avoids backend, LLM, persistence, wallet, or deployment implementation until the relevant track begins.

## Track 1B: Contract Reference Cleanup

Goal: explain contract fixtures, test coverage, and schema gaps.

Expected deliverables:

- `docs/contracts/README.md`.
- README link to contract docs.

Acceptance criteria:

- Contract fixtures and tests are documented.
- ImplementationBundle and module catalog schema gaps are noted.
- `npm run check` passes.

Tests/smoke tests:

- `npm run check`.

What not to overbuild:

- Do not add new schemas unless a concrete implementation track requires them.

## Track 2A: MVP User Journey And Stack Decision Docs

Goal: document the confirmed MVP journey, scope, stack choices, wallet-signing model, orchestration, memory, and track plan.

Expected deliverables:

- `docs/product/mvp-user-journey.md`.
- `docs/product/mvp-scope.md`.
- MVP architecture docs.

Acceptance criteria:

- Wallet-signed testnet deployment is documented.
- Local-laptop, one-asset-manager, 20-wallet scope is clear.
- Deferred items are explicit.
- `npm run check` passes.

Tests/smoke tests:

- `npm run check`.

What not to overbuild:

- Documentation only; no backend or wallet implementation.

## Track 2B: Backend/API Boundary Design

Goal: design the smallest backend boundary for secrets, validation, chat, orchestration, and future wallet/testnet support.

Expected deliverables:

- `docs/architecture/backend-api-boundary.md`.
- `docs/contracts/mvp-api-contracts.md`.
- Planned PRD approval, Solidity artifact, security benchmark, and deployment gate contract notes.
- Request/response route-group proposal.
- Error/status model proposal.

Acceptance criteria:

- No browser-side LLM or audit secrets.
- Existing contract spine is preserved or deliberate migrations are listed.
- Backend remains lightweight and local-MVP oriented.
- Implementation begins only after the boundary docs are reviewed.
- New planned contracts get fixtures/tests before or alongside implementation.

Tests/smoke tests:

- Documentation review.
- Contract test update plan.
- `npm run check`.

What not to overbuild:

- No server implementation yet unless explicitly approved.
- No server folder, backend framework dependency, database, wallet integration, or real LLM call in this planning track.

## Track 2C: Backend Skeleton

Goal: add the minimal local TypeScript backend skeleton.

Status: implemented as a health-only local API skeleton; product routes remain deferred.

Expected deliverables:

- Lightweight backend app, likely Fastify.
- Health endpoint: `GET /api/health`.
- Shared schema validation boundary remains planned for product routes.
- Dev scripts.

Acceptance criteria:

- Frontend beta still runs.
- Backend starts locally.
- `npm run check` passes.
- No real LLM, database, wallet, or deployment integration yet.
- No product route stubs.

Tests/smoke tests:

- Unit/API smoke tests.
- `npm run check`.

What not to overbuild:

- No auth, queues, database, vector DB, or microservices.

## Track 3A: Blockchain Engineering Bot Chat Planning

Goal: define the backend-only chat route, chat contracts, and LLM provider boundary before implementation.

Expected deliverables:

- `docs/architecture/blockchain-engineer-chat-mvp.md`.
- `docs/contracts/chat-contract.md`.
- `docs/contracts/llm-provider-contract.md`.

Acceptance criteria:

- Chat request/response contracts are documented.
- LLM provider adapter contract is documented.
- No chat route, SDK, persistence, wallet integration, or UI behavior is implemented.
- `npm run check` passes.

Tests/smoke tests:

- Documentation review.
- `npm run check`.

What not to overbuild:

- No SDK dependency, vector memory, tool calling, multi-agent debate, or provider router.

## Track 3B: Mock-Provider Backend Chat Implementation

Goal: implement backend chat route behind stable contracts using a mock or deterministic provider first.

Status: implemented with a non-streaming mock/deterministic backend provider.

Expected deliverables:

- Turn-based chat endpoint/service.
- `POST /api/chat/blockchain-engineer`.
- Backend-only mock provider adapter.
- Request validation and safe error handling.
- Contract fixtures/tests if route responses use planned chat contracts.

Acceptance criteria:

- Secrets stay server-side.
- Chat can discuss ERC-20 vs ERC-721.
- User can continue chat while runs are active.
- No real LLM provider SDK or persistence unless explicitly approved.
- No frontend UI integration yet.

Tests/smoke tests:

- Mocked provider tests.
- Schema/contract tests.
- Chat smoke test.

What not to overbuild:

- No multi-provider framework unless needed.

## Track 3C: Real LLM Provider Integration

Goal: replace the mock provider with a backend-only real provider adapter after Track 3B contracts and tests are stable.

Expected deliverables:

- Provider adapter implementation.
- Backend-only secret handling.
- Mock provider retained for tests.
- Safe provider-error mapping.

Acceptance criteria:

- Browser never receives provider secrets.
- Raw provider output is mapped into `BlockchainEngineerChatResponse`.
- Provider errors use safe API error envelopes.
- `npm run check` passes.

Tests/smoke tests:

- Mocked unit tests.
- Provider-disabled local smoke test.

What not to overbuild:

- No provider marketplace, vector memory, tool calling, or multi-agent orchestration in this track.

## UX Track A: UX Vision And Frontend Architecture

Goal: document the MVP interface direction before redesigning the frontend.

Expected deliverables:

- `docs/product/ui-ux-vision.md`.
- `docs/product/mvp-screen-flow.md`.
- `docs/architecture/frontend-ux-architecture.md`.
- `docs/architecture/frontend-component-plan.md`.
- Approved UX mockup reference: `docs/assets/ux/mila26_dashboard_v2.png`.

Acceptance criteria:

- Professional AI + blockchain workspace vision is documented.
- Approved mockup is registered as directional, not pixel-perfect.
- MVP screen flow is documented.
- Frontend architecture and component roadmap are documented.
- No frontend implementation or refactor is done.
- `npm run check` passes.

Tests/smoke tests:

- Documentation review.
- `npm run check`.

What not to overbuild:

- No UI redesign, frontend chat integration, wallet integration, payments, or auth.

## UX Track B / Track 3C: Frontend Chat Integration

Goal: connect the chat UI to the backend mock chat route without changing broader product flows.

Expected deliverables:

- `docs/architecture/frontend-chat-integration.md`.
- Small typed API client for `POST /api/chat/blockchain-engineer`.
- Chat loading/error states.
- Safe rendering of `BlockchainEngineerChatResponse`.

Acceptance criteria:

- Frontend does not call LLM providers directly.
- Existing beta journey remains runnable.
- Route errors map to safe UI messages.

Tests/smoke tests:

- Component or route-client tests.
- Playwright smoke test if visible journey changes.
- `npm run check`.

What not to overbuild:

- No streaming, persistence, real LLM provider, or full app shell redesign in this step.

## UX Track C: App Shell Layout

Goal: introduce the enhanced ChatGPT-style app shell with collapsible panels and prominent project header.

Reference: `docs/assets/ux/mila26_dashboard_v2.png` as directional guidance, not a pixel-perfect implementation mandate.

Expected deliverables:

- Left sidebar/project folders.
- Top project bar with project name and protocol/network/wallet/service status placeholders.
- Collapsible right project panel.

Acceptance criteria:

- Current project context is always visible.
- Chat/workspace area expands when panels collapse.
- Mobile layout remains usable.

Tests/smoke tests:

- UI smoke tests for shell rendering and collapse behavior.

What not to overbuild:

- No complete routing system or persisted layout preferences yet.

## UX Track D: Requirement Cards And Contextual Drawer

Goal: turn chat decisions into structured cards and focused sub-action drawers.

Expected deliverables:

- Requirement cards for protocol, whitelist, allocation, valuation, deployment, and security.
- Drawer pattern for focused editing.

Acceptance criteria:

- Chat decisions are visible outside chat.
- Drawer preserves project context.
- Save/cancel behavior is clear.

Tests/smoke tests:

- Component tests for card/drawer behavior.

What not to overbuild:

- No generic form-builder or full configurator.

## UX Track E: Project Status / Agent Progress / Deployment Gate Panels

Goal: add right-panel status for workflow stage, next action, agent progress, and deployment gate.

Expected deliverables:

- Project timeline.
- Agent progress panel.
- Next action card.
- Deployment gate card.

Acceptance criteria:

- User can see what is ready, blocked, running, and next.
- Deployment remains gated and testnet-only.

Tests/smoke tests:

- Structural UI tests for statuses and blocked states.

What not to overbuild:

- No production queue monitor or observability dashboard.

## UX Track F: Wallet/Services Placeholders

Goal: show wallet and future paid services affordances without implementing payments or wallet signing.

Expected deliverables:

- Wallet status placeholder.
- Services or Add Services icon after wallet status.

Acceptance criteria:

- UI communicates future wallet/services locations.
- No payment, custody, or wallet signing logic exists.

Tests/smoke tests:

- UI smoke test if implemented.

What not to overbuild:

- No payment provider, checkout, custody, or mainnet workflow.

## UX Track G: PRD / Deployment / Valuation Screens

Goal: build larger workflow screens only after backend state and contracts exist.

Expected deliverables:

- PRD review screen.
- Deployment checklist.
- Investor allocation workflow.
- Valuation upload screen.
- Evidence pack panel.

Acceptance criteria:

- Screens consume documented backend contracts.
- Workflow gates remain visible.
- `npm run check` passes.

Tests/smoke tests:

- Playwright journey tests for each added workflow.

What not to overbuild:

- No production audit, KYC/AML, mainnet, or multi-tenant workflows.

## Track 4 Closure: Dashboard UX Foundation Accepted

Status: accepted as the MVP UX foundation for the next technical tracks.

The Track 4 dashboard shell now provides the near-term product foundation: KangLe AI / MILA26 branding, left project navigation, central funding-demo workspace, right project status/assistant panel, visible Step 1-4 journey, structured Requirement Brief presentation, local agent progress, and a deployment-gate placeholder.

Track 5 in the current post-dashboard sequence should move to Requirement Brief contracts and PRD/LLM foundations on top of this shell rather than reopening the dashboard layout.

Deferred UX items are placeholders and should not block the next technical track:

- Real collapsible panel behavior.
- Services/Add Services cart functionality.
- Contextual drawers.
- Wallet connection/status implementation.
- Persisted projects or folders.
- Production deployment status.

## Track 5A: Requirement Brief Contract Boundary

Status: implemented.

Track 5A added a stable typed Requirement Brief contract boundary and adapter so later PRD, backend-only LLM, Solidity generation, QA/security, evidence, deployment gate, and wallet-signed testnet tracks can consume one source-of-truth input object.

Reference:

- `docs/contracts/requirement-brief-contract.md`

## Track 5B: Deterministic PRD / Engineering Brief Route

Status: implemented.

Track 5B adds `POST /api/prd/engineering-brief`, a deterministic/mock backend route that consumes the Track 5A Requirement Brief contract and returns a structured Engineering Brief response.

This route establishes the API shape, validation boundary, response contract, and safe error behavior for the later backend-only LLM adapter track.

Reference:

- `docs/contracts/engineering-brief-contract.md`

What remains deferred:

- real LLM provider integration
- frontend PRD UI integration
- autonomous orchestration
- Solidity compilation
- wallet integration
- blockchain deployment

## Track 6A: Backend-only LLM Adapter Boundary

Status: implemented.

Track 6A adds backend-only LLM infrastructure for future real-provider work without changing current route behavior.

Implemented deliverables:

- Typed LLM request, response, usage, provider, and config contracts under `server/llm/`.
- Backend-only config parser using exact `MILA26_LLM_*` variables.
- Deterministic mock provider and provider factory.
- Safe unsupported-provider handling for `openai` until Track 6B.
- Documentation in `docs/architecture/backend-llm-boundary.md`.

Acceptance criteria:

- Default provider is `mock`.
- No real LLM calls are made.
- `OPENAI_API_KEY` is not required in Track 6A.
- No `VITE_` LLM variables are introduced.
- Existing chat and Engineering Brief routes remain behaviorally unchanged.

What remains deferred:

- OpenAI SDK or real provider implementation.
- Backend-only `OPENAI_API_KEY` usage.
- Replacing deterministic route generators with real LLM-backed generation.

## Track 4: PRD Generation And Approval

Goal: generate and approve PRD/enhanced Requirement Brief from chat.

Expected deliverables:

- PRD/Requirement Brief generation flow.
- Approval state.
- Contract tests/fixtures updated if shape changes.

Acceptance criteria:

- Approved PRD is the source for worker orchestration.
- User can revise before approval.

Tests/smoke tests:

- Contract/golden tests.
- UI/API smoke test.

What not to overbuild:

- No document-management system.

## Track 5: Coding/QA/Security/Evidence Orchestration

Goal: run worker bots from approved PRD with visible progress.

Expected deliverables:

- Custom lightweight orchestrator.
- Worker task statuses.
- Solidity ERC-20/ERC-721 contract generation and library policy.
- OpenZeppelin Contracts default policy for ERC-20/ERC-721 and common access-control/security primitives.
- Solidity test plan/test artifact generation.
- QA/security/evidence outputs.
- Smart-contract security benchmark checklist.

Acceptance criteria:

- Independent workers run in parallel where safe.
- Security gate blocks unsafe outputs.
- Contract Coding Bot can generate Solidity scaffold/artifacts from approved PRD requirements.
- Generated Solidity defaults to OpenZeppelin Contracts-style ERC-20/ERC-721 primitives unless the approved PRD documents a justified deviation.
- QA Bot checks PRD conformance and Solidity code quality.
- Security Reviewer Bot benchmarks generated contracts against OWASP/known Solidity vulnerability categories.
- Evidence pack traces back to PRD and artifacts.

Tests/smoke tests:

- Orchestration tests.
- Security tests.
- Evidence pack tests.

What not to overbuild:

- No heavy agent framework or Redis queue.
- Do not choose Foundry, Hardhat, Slither, Mythril, or other heavy tooling before the compile/test/security tooling subtrack.

### Track 5A: Solidity Compile/Test/Security Tooling Choice

Goal: choose the smallest Solidity tooling path for compile/test and benchmark evidence.

Expected deliverables:

- OpenZeppelin package version decision.
- Solidity compiler version decision.
- Compile/test tooling recommendation, likely Foundry or Hardhat.
- `viem` integration shape for wallet/testnet interaction.
- Compile/test command proposal.
- Static analysis recommendation, such as Slither or Mythril, if needed.
- Deployment artifact format.
- Security benchmark mapping to OWASP Smart Contract Top 10 and known Solidity vulnerability categories.

Acceptance criteria:

- Tooling choice explains why it is needed now.
- Generated Solidity can be compiled/tested or explicitly marked uncompiled.
- Deployment gating knows how to consume QA/security results.

Tests/smoke tests:

- Tooling smoke test plan.
- Contract/golden fixture update plan.

What not to overbuild:

- No production audit pipeline.
- No heavy CI infrastructure before local MVP needs it.

## Track 6: Wallet-Signed Testnet Deployment

Goal: prepare and submit Ethereum testnet deployment through user wallet signing.

Expected deliverables:

- Wallet connect/signing UI path.
- Deployment Bot transaction preparation.
- Testnet-only guardrails.
- Transaction status tracking.

Acceptance criteria:

- Backend never holds private keys.
- Mainnet fails closed.
- User wallet signs deployment.
- PRD approval, coding completion, QA completion, security benchmark completion, and evidence-pack recording gate deployment.

Tests/smoke tests:

- Wallet/testnet mock tests.
- Chain guardrail tests.

What not to overbuild:

- No custody, mainnet, or production key management.

## Track 7: Mint, Whitelist, Allocation, And Distribute

Goal: support post-deployment token operations for up to 20 wallets.

Expected deliverables:

- Whitelist validation.
- Off-chain name mapping.
- Allocation entry and 100% validation.
- Mint/distribute transaction preparation.

Acceptance criteria:

- Real-world names are off-chain by default.
- Allocation must equal 100% before distribution.
- User wallet signs token operations.

Tests/smoke tests:

- Allocation validation tests.
- Wallet operation mock tests.

What not to overbuild:

- No full KYC/AML.

## Track 8: Valuation Upload And Performance Update

Goal: ingest valuation file and make performance information available to token holders.

Expected deliverables:

- Valuation file shape.
- Upload/validation flow.
- Performance dashboard and/or event emission path.

Acceptance criteria:

- Shows total performance and gain/loss against initial investment.
- Makes performance visible to the 20 wallet holders.

Tests/smoke tests:

- File validation tests.
- Dashboard/event smoke test.

What not to overbuild:

- No email, WhatsApp, or Telegram notifications.

## Track 9: Funding-Demo Polish

Goal: make the MVP coherent and credible for investor/CTO review.

Expected deliverables:

- Demo script.
- Clean statuses and error states.
- Seeded local demo data.

Acceptance criteria:

- Full journey works on local Mac laptop.
- Risks and non-production boundaries are clear.

Tests/smoke tests:

- End-to-end demo smoke test.

What not to overbuild:

- No production SaaS polish before live beta needs it.

## Track 10: Live Beta Hardening

Goal: prepare for controlled beta beyond local demo.

Expected deliverables:

- Auth plan/implementation if needed.
- Hosted persistence plan.
- Observability.
- Stronger audit/security workflow.

Acceptance criteria:

- Secrets are server-only.
- User/project data has ownership boundaries.
- Operational risks are documented and mitigated.

Tests/smoke tests:

- Security regression tests.
- Deployment/observability smoke tests.

What not to overbuild:

- No mainnet or multi-tenant SaaS until requirements are explicit.
