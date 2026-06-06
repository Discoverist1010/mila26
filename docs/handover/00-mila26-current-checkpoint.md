# MILA26 Current Checkpoint

## One-Page Summary

MILA26 is a blockchain-functional alpha foundation for an AI tokenisation workspace for asset managers.

The current app can guide a project from plain-language intent through Requirement Brief, Engineering Brief, closure readiness, Smart Contract Artifact Spec, deterministic artifact preview, check/evidence-lite, local compile/test representation, Deployment Gate, Wallet Signing Intent, wallet connection, unsigned deployment intent, wallet-signed Sepolia deployment, local-session deployment evidence/readiness, and three wallet-signed SCP operations: Record NAV Event, Whitelist Wallet, and Allocation / Mint.

The current UI is the MILA26 lifecycle workspace. It uses visual lifecycle tabs, a large Engineering Bot answer surface, suggested next actions, passive right rail, Product Vault, lifecycle snapshot, and a scroll-down Smart Contract Control Panel.

The next implementation step should follow the tab-aligned roadmap, not the old dashboard flow:

1. website/access first slice without duplicating app lifecycle state;
2. durable lifecycle and Investor Registry persistence after local-session state shape is stable;
3. durable Evidence Vault persistence after local-session evidence shape is stable;
4. subscription-redemption execution design with explicit adapter/evidence contracts;
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
- Keep the right rail passive.
- Keep SCP as status/evidence/boundary/health plus operation-specific controls.
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
- Operation boundary: Record NAV Event, Whitelist Wallet, and Allocation / Mint exist as operation-specific wallet-signed SCP controls.
- Persistence, auth, payments, durable Evidence Vault storage, live subscription/redemption execution, batch allocation/mint execution, maturity closeout, and mainnet are not implemented.

## Current Repo Capabilities

- MILA26 lifecycle workspace UI.
- Visual tabs: Overview, Requirements, Investor Registry, Subscription, Smart Contract, Asset Servicing, Redemption, Maturity, Evidence.
- Shared workspace presentation model: `src/domain/workspacePresentation.ts`.
- Shared lifecycle state/read model: `src/domain/lifecycleState.ts`.
- Investor Registry tab for up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, SCP whitelist target handoff, and Allocation/Mint handoff.
- Subscription and Redemption tabs for local-session parameter capture, validation, lifecycle snapshot/vault/status updates, and subscription-redemption template handoff input.
- Smart Contract tab Allocation/Mint readiness and wallet-signed execution panel for a selected whitelisted target wallet and token allocation amount from shared Investor Registry and Subscription state.
- Passive right rail and Product Vault.
- Backend chat route: `POST /api/chat/blockchain-engineer`.
- Backend Engineering Brief route: `POST /api/prd/engineering-brief`.
- Backend Smart Contract Artifact Spec route: `POST /api/smart-contract/artifact-spec`.
- Backend deterministic Artifact Preview / Check Result / Evidence-Lite route: `POST /api/smart-contract/artifact`.
- Project Closure Ledger and closure read model.
- Project Lifecycle Read Model and Cockpit Action Registry.
- Smart Contract Control Panel deterministic view model.
- Local Hardhat compile/test foundation:
  - `contracts/Mila26RestrictedFundToken.sol`
  - `npm run contracts:build`
  - `npm run test:contracts`
- Deployment Gate read model and UI surface.
- Wallet Signing Intent read model and UI surface.
- Wallet Connection Read Model and frontend-only EIP-1193 adapter.
- Unsigned Deployment Intent Read Model.
- Wallet-signed Sepolia deployment adapter and local-session deployment state.
- Deployment Evidence Read Model and passive UI/SCP evidence surface.
- Record NAV, Wallet Whitelist, and Allocation / Mint operation adapters/read models with local-session-only operation evidence.
- Sepolia funding helper targets for issuer/admin signer, generated investor wallet pack, payment destination, and redemption wallet, with copyable public addresses.

## Completed Recent Work

- Requirement Brief, Engineering Brief, backend-only LLM boundary, deterministic and optional OpenAI-assisted backend paths.
- Smart Contract Artifact Spec, deterministic artifact preview, spec-consistency check result, and Evidence-Lite.
- Local Hardhat compile/test foundation and compile/test result adapter.
- Deployment Gate, Wallet Signing Intent, Wallet Connection, Unsigned Deployment Intent, wallet-signed Sepolia deployment, and deployment evidence.
- Record NAV Event operation.
- Whitelist Wallet operation.
- Sprint Track 1 shared lifecycle state and Investor Registry functionality.
- Sprint Track 2 shared Subscription/Redemption parameter capture and template handoff readiness.
- Sprint Track 3 shared Allocation/Mint readiness, Investor Registry handoff, and Smart Contract tab validation.
- Sprint Track 5 Sepolia demo wallet readiness plus wallet-signed Allocation / Mint execution behind explicit wallet, deployment, whitelist, ABI, parameter, duplicate-attempt, and evidence gates.
- Sprint Track 6 demo hardening: Sepolia funding-helper targets, repeated investor whitelist/mint regression coverage, and 50-investor product-boundary cleanup in chat mocks/fixtures.
- Lifecycle workspace UX implementation:
  - dark left navigation rail;
  - top project/network/wallet/safety bar;
  - visual lifecycle tabs;
  - AI-first center workspace;
  - suggested next actions;
  - passive right rail;
  - Product Vault and Recent Activity;
  - product-facing copy with no internal track labels.

## Current Next Step

Recommended next coding sequence:

1. Continue website/access work from `docs/product/website-mvp-brief.md` without duplicating app lifecycle state.
2. Add durable lifecycle and Investor Registry persistence after confirming the state schema.
3. Add durable Evidence Vault persistence after the local-session evidence shape is stable.
4. Design subscription-redemption execution adapters and evidence contracts before live stablecoin movement.
5. Keep browser/screenshot review in the validation loop for every newly functional tab.

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
- No production persistence/database until data shape is settled.
- No auth/payments.
- No per-tab state silos.
- No durable evidence claim until persistence exists.
- No investor eligibility/KYC/legal/audit approval claim.
