# MILA26 Current Checkpoint

## One-Page Summary

MILA26 is a blockchain-functional alpha foundation for an AI tokenisation workspace for asset managers.

The current app can guide a project from plain-language intent through Requirement Brief, Engineering Brief, closure readiness, Smart Contract Artifact Spec, deterministic artifact preview, check/evidence-lite, local compile/test representation, Deployment Gate, Wallet Signing Intent, wallet connection, unsigned deployment intent, wallet-signed Sepolia deployment, local-session deployment evidence/readiness, and three wallet-signed Contract Ops operations: Record NAV Event, Whitelist Wallet, and Allocation / Mint.

The current UI is the MILA26 lifecycle workspace. It uses visual lifecycle tabs, active tab artifacts in the center, a persistent ZiLi-OS right console for chat plus captured-fact review, Product Vault/lifecycle status surfaces, and a focused Contract Ops tab for wallet-signed operations.

The next implementation step should follow the tab-aligned roadmap, not the old dashboard flow:

1. Sprint 16 workspace completion pass from `docs/product/workspace-tab-audit.md`;
2. website/access/login without duplicating lifecycle state;
3. subscription-redemption execution design with explicit adapter/evidence contracts;
4. beta live Sepolia evidence rehearsals using the opt-in Sprint 14A/14B harness;
5. maturity closeout later.

For coding execution, read root `AGENTS.md` first. It defines the Lead Implementer role, active debugging loop, quality refactor triggers, dynamic skill/MCP acquisition policy, and review gates.

Production readiness, beta preparation, website/login, and GTM gates are tracked in `docs/production/production-readiness-plan.md`.

## Current Product Direction

- Build a professional AI tokenisation workspace, not a crypto trading dashboard.
- Current alpha path: restricted ERC-20-compatible fund units for a tokenised financial product.
- Target product constraint: up to 50 investor wallets.
- Keep execution Ethereum Sepolia/testnet-only.
- Use Engineering Bot as the cross-stage lifecycle decision surface.
- Treat tabs as visual structure only; do not segregate state by tab.
- Keep wallet signing, deployment, mint, whitelist, NAV, and other contract-operation controls out of the right rail. Captured-fact review, reject/edit, and draft handoff confirmation may live in the ZiLi-OS console because they do not execute wallet or contract operations.
- Keep Contract Ops as status/evidence/boundary/health plus operation-specific controls.
- Backend never holds private keys.
- User wallet signs deployment and operations.

## Current Architecture

- Frontend: Vite, React, TypeScript.
- Backend: lightweight Fastify server in `server/`.
- Contracts/read models: Zod contracts plus pure domain/read-model layers.
- API convention: product routes use `{ ok: true, data }` and `{ ok: false, error }`; `/api/health` remains simple.
- LLM boundary: backend-only; deterministic mock remains supported; OpenAI mode requires explicit backend config.
- Smart contract tooling: local Hardhat/OpenZeppelin fixture exists for compile/test only.
- Wallet boundary: MetaMask-first EIP-1193 connection and Sepolia readiness are implemented frontend-only.
- Deployment boundary: wallet-signed Sepolia deployment exists, with local-session provider/receipt evidence only.
- Operation boundary: Record NAV Event, Whitelist Wallet, and Allocation / Mint exist as operation-specific wallet-signed Contract Ops controls.
- Auth, payments, live subscription/redemption execution, batch allocation/mint execution, maturity closeout, and mainnet are not implemented.

## Current Repo Capabilities

- MILA26 lifecycle workspace UI.
- Visual tabs: Overview, Product Setup, Investor Wallets, Subscription, Contract Ops, Asset Servicing, Redemption, Maturity, Evidence Vault.
- Shared workspace presentation model: `src/domain/workspacePresentation.ts`.
- Shared lifecycle state/read model: `src/domain/lifecycleState.ts`.
- Investor Wallets tab for up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, Contract Ops whitelist target handoff, and Allocation/Mint handoff.
- Subscription and Redemption tabs for local-session parameter capture, validation, lifecycle snapshot/vault/status updates, and subscription-redemption template handoff input.
- Contract Ops tab for wallet-signed deployment, Record NAV, Whitelist Wallet, Allocation/Mint readiness, and wallet-signed execution for a selected whitelisted target wallet and token allocation amount from shared Investor Wallets and Subscription state.
- Persistent ZiLi-OS right console and Product Vault/status surfaces.
- Backend chat route: `POST /api/chat/blockchain-engineer`.
- Backend Engineering Brief route: `POST /api/prd/engineering-brief`.
- Backend Smart Contract Artifact Spec route: `POST /api/smart-contract/artifact-spec`.
- Backend deterministic Artifact Preview / Check Result / Evidence-Lite route: `POST /api/smart-contract/artifact`.
- Project Closure Ledger and closure read model.
- Project Lifecycle Read Model and Cockpit Action Registry.
- Smart Contract Control Panel deterministic view model remains in code, while the primary user-facing operation surface is now the Contract Ops tab.
- Local Hardhat compile/test foundation:
  - `contracts/Mila26RestrictedFundToken.sol`
  - `npm run contracts:build`
  - `npm run test:contracts`
- Deployment Gate read model and UI surface.
- Wallet Signing Intent read model and UI surface.
- Wallet Connection Read Model and frontend-only EIP-1193 adapter.
- Unsigned Deployment Intent Read Model.
- Wallet-signed Sepolia deployment adapter and local-session deployment state.
- Deployment Evidence Read Model and passive UI/Contract Ops evidence surface.
- Record NAV, Wallet Whitelist, and Allocation / Mint operation adapters/read models with local-session-only operation evidence.
- Sepolia funding helper targets for issuer/admin signer, generated investor wallet pack, payment destination, and redemption wallet, with copyable public addresses.
- Benefit-led website first slice that explains AI tokenisation, blockchain execution, distribution/post-trade servicing, user meaning, and quality boundaries.
- Backend SQLite workspace snapshot persistence for project identity, versioned lifecycle state, and investor wallet rows.
- Durable Evidence Vault foundation for provider-derived deployment, Record NAV, Wallet Whitelist, and Allocation/Mint evidence records.
- Opt-in live Sepolia readiness harness for public addresses, optional RPC chain/balance/receipt checks, and optional Evidence Vault API save.
- Generated artifact persistence for Requirement Brief, Engineering Brief, Smart Contract Spec, Artifact Preview, Check Result, and Evidence-Lite records.
- Persistence boundary decision: active app state remains the current-session source of truth; durable records do not restore local wallet session state.

## Completed Recent Work

- Requirement Brief, Engineering Brief, backend-only LLM boundary, deterministic and optional OpenAI-assisted backend paths.
- Smart Contract Artifact Spec, deterministic artifact preview, spec-consistency check result, and Evidence-Lite.
- Local Hardhat compile/test foundation and compile/test result adapter.
- Deployment Gate, Wallet Signing Intent, Wallet Connection, Unsigned Deployment Intent, wallet-signed Sepolia deployment, and deployment evidence.
- Record NAV Event operation.
- Whitelist Wallet operation.
- Sprint Track 1 shared lifecycle state and Investor Wallets functionality.
- Sprint Track 2 shared Subscription/Redemption parameter capture and template handoff readiness.
- Sprint Track 3 shared Allocation/Mint readiness, Investor Wallets handoff, and Contract Ops validation.
- Sprint Track 5 Sepolia demo wallet readiness plus wallet-signed Allocation / Mint execution behind explicit wallet, deployment, whitelist, ABI, parameter, duplicate-attempt, and evidence gates.
- Sprint Track 6 demo hardening: Sepolia funding-helper targets, repeated investor whitelist/mint regression coverage, and 50-investor product-boundary cleanup in chat mocks/fixtures.
- Sprint Track 7/8 website and persistence decision: benefit-led website messaging plus backend/SQLite persistence boundary decision, without browser-storage persistence or durable evidence claims.
- Sprint Track 9/10 backend persistence foundation: project/lifecycle snapshot and investor wallet persistence through SQLite repository/API routes, with frontend save/load actions and local-session evidence reset on load.
- Sprint Track 11/12 durable Evidence Vault and generated artifact persistence foundation: typed evidence/artifact records, current/stale lifecycle context labels, and Evidence tab save/load controls.
- Lifecycle workspace UX implementation:
  - dark left navigation rail;
  - top project/network/wallet/safety bar;
  - visual lifecycle tabs;
  - AI-first center workspace;
  - suggested next actions;
  - persistent ZiLi-OS right console;
  - Product Vault and Recent Activity;
  - product-facing copy with no internal track labels.
- Sprint Track 13 UX cleanup:
  - Engineering/Advisor modes share one AI panel and lifecycle context;
  - visual tab labels now match the user journey;
  - Contract Ops replaces the old scroll-down SCP as the focused user operation surface;
  - confirmed deployments disable duplicate deployment requests.
- Sprint Track 14A/14B live Sepolia/evidence foundation:
  - public-address and optional RPC readiness harness is opt-in through `LIVE_SEPOLIA=1`;
  - normal tests remain deterministic and do not require RPC, MetaMask, or private keys;
  - live provider receipts can be mapped into existing durable Evidence Vault records;
  - operation contract-address evidence is labelled as coming from confirmed deployment evidence, not from operation receipts.
- Sprint Track 15 audit-first workspace review:
  - completed the tab-by-tab audit for actions, status, information, artefacts, persistence ownership, and cross-tab dependencies;
  - confirmed that Investor Wallets, Subscription, Redemption, Contract Ops, Evidence Vault, and the persistent AI panel are the strongest current matches;
  - identified Product Setup, Asset Servicing, Maturity, unwired Expert mode, stale Investor Registry labels, Contract Ops density, and legacy SCP remnants as the next implementation priorities;
  - captured the Sprint 16 backlog in `docs/product/workspace-tab-audit.md`.

## Current Next Step

Recommended next coding sequence:

1. Implement Sprint 16 P0 fixes from `docs/product/workspace-tab-audit.md`: Product Setup panel, Asset Servicing panel, Maturity panel, Expert-mode cleanup, and stale Investor Wallets naming cleanup.
2. Reorganise Contract Ops only where it improves clarity without changing operation adapters or shared state ownership.
3. Add website/access/login without duplicating lifecycle ownership.
4. Design subscription-redemption execution adapters and evidence contracts before live stablecoin movement.
5. Use the opt-in live Sepolia harness when public testnet addresses/RPC/transaction hashes are available.
6. Keep browser/screenshot review in the validation loop for every newly functional tab.

## Code Review (Agent / PR)

For structured reviews, use the Code Reviewer trio:

1. `docs/handover/05-code-reviewer-skill.md`
2. `docs/contracts/code-reviewer-checklist.md`
3. `docs/handover/06-code-reviewer-lessons.md`

Activation before commit/push is governed by:

4. `docs/handover/07-code-review-activation-rules.md`

Other delivery roles use:

5. `docs/handover/08-delivery-role-skills.md`

Use it for Test Engineer, Quality Architect / Refactorer, Security Reviewer, Solidity Reviewer, Frontend/UX Reviewer, and Release Engineer checks. It also defines triggered review lenses, including State / Memory / Performance for cache, persistence, lifecycle state, async orchestration, and speed-sensitive changes. These roles and lenses improve specialist coverage, but the Lead Implementer remains accountable for final integration and active debugging.

## What Must Not Be Done Yet

- No broad operation suite.
- No mainnet.
- No backend private-key custody.
- No production database or hosted persistence switch until beta storage, backup, and audit-log requirements are settled.
- No auth/payments.
- No per-tab state silos.
- No durable evidence claim unless the record was stored and loaded through the durable Evidence Vault.
- No investor eligibility/KYC/legal/audit approval claim.
