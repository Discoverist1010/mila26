# MILA26 Current Checkpoint

## One-Page Summary

MILA26 is a blockchain-functional alpha foundation for an AI tokenisation workspace for asset managers.

The current app can guide a project from plain-language intent through Requirement Brief, Engineering Brief, closure readiness, Smart Contract Artifact Spec, deterministic artifact preview, check/evidence-lite, local compile/test representation, Deployment Gate, Wallet Signing Intent, wallet connection, unsigned deployment intent, wallet-signed Sepolia deployment, local-session deployment evidence/readiness, and two wallet-signed SCP operations: Record NAV Event and Whitelist Wallet.

The current UI is the MILA26 lifecycle workspace. It uses visual lifecycle tabs, a large Engineering Bot answer surface, suggested next actions, passive right rail, Product Vault, lifecycle snapshot, and a scroll-down Smart Contract Control Panel.

The next implementation step should follow the new tab-aligned roadmap, not the old dashboard flow:

1. shared lifecycle state hardening;
2. Investor Registry tab functionality;
3. Subscription template parameter capture;
4. Redemption template parameter capture;
5. Allocation/Mint only after registry/subscription parameters are coherent;
6. Evidence persistence and maturity closeout later.

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
- Operation boundary: Record NAV Event and Whitelist Wallet exist as operation-specific wallet-signed SCP controls.
- Persistence, auth, payments, durable Evidence Vault storage, subscription/redemption templates, allocation/mint, maturity closeout, and mainnet are not implemented.

## Current Repo Capabilities

- MILA26 lifecycle workspace UI.
- Visual tabs: Overview, Requirements, Investor Registry, Subscription, Smart Contract, Asset Servicing, Redemption, Maturity, Evidence.
- Shared workspace presentation model: `src/domain/workspacePresentation.ts`.
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
- Record NAV and Wallet Whitelist operation adapters/read models with local-session-only operation evidence.

## Completed Recent Work

- Requirement Brief, Engineering Brief, backend-only LLM boundary, deterministic and optional OpenAI-assisted backend paths.
- Smart Contract Artifact Spec, deterministic artifact preview, spec-consistency check result, and Evidence-Lite.
- Local Hardhat compile/test foundation and compile/test result adapter.
- Deployment Gate, Wallet Signing Intent, Wallet Connection, Unsigned Deployment Intent, wallet-signed Sepolia deployment, and deployment evidence.
- Record NAV Event operation.
- Whitelist Wallet operation.
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

1. Add shared lifecycle data structures for investor registry, subscription parameters, redemption parameters, and maturity settings.
2. Implement the Investor Registry tab UI and state for up to 50 wallet addresses.
3. Implement Subscription tab parameter capture:
   - permitted stablecoins;
   - subscription window;
   - minimum subscription;
   - payment wallet/contract;
   - payment per token.
4. Implement Redemption tab parameter capture:
   - redemption window/date;
   - redemption wallet;
   - delay unit/duration;
   - payout per token;
   - permitted stablecoin payout asset.
5. Prepare the subscription-redemption smart-contract template spec.
6. Only then add Allocation/Mint.

## Code Review (Agent / PR)

For structured reviews, use the Code Reviewer trio:

1. `docs/handover/05-code-reviewer-skill.md`
2. `docs/contracts/code-reviewer-checklist.md`
3. `docs/handover/06-code-reviewer-lessons.md`

Activation before commit/push is governed by:

4. `docs/handover/07-code-review-activation-rules.md`

## What Must Not Be Done Yet

- No broad operation suite.
- No mainnet.
- No backend private-key custody.
- No production persistence/database until data shape is settled.
- No auth/payments.
- No per-tab state silos.
- No durable evidence claim until persistence exists.
- No investor eligibility/KYC/legal/audit approval claim.
