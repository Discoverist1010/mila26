# MILA26 Current Checkpoint

## One-Page Summary

MILA26 is a blockchain-functional alpha foundation for an AI + blockchain tokenisation workspace for asset managers.

The current app can guide a project from a plain-language requirement through Engineering Brief, closure readiness, Smart Contract Artifact Spec, deterministic artifact preview, check/evidence-lite, local compile/test representation, Deployment Gate, Wallet Signing Intent, Wallet Connection Readiness, Unsigned Deployment Intent, a wallet-signed Sepolia deployment path, local-session deployment evidence/readiness, and the first wallet-signed SCP operation: Record NAV Event. Other Smart Contract Operations remain locked.

The next implementation step is Track 15A.1 hardening if Record NAV event evidence or SCP gating needs cleanup, otherwise Track 15B Whitelist + Allocation/Mint Operation.

## Current Product Direction

- Build a professional AI + blockchain workspace, not a crypto trading dashboard.
- Current alpha path: restricted ERC-20-compatible fund units for a tokenised income/fund product.
- Start with one local Mac laptop alpha for one asset manager and up to 20 investor wallets.
- Keep execution Ethereum Sepolia/testnet-only.
- Use Engineering Bot as the lifecycle decision surface.
- Keep the right rail passive.
- Keep SCP as status/evidence/boundary/health; operation controls stay locked until operation authorization and evidence logging exist.
- Backend never holds private keys.
- User wallet signs future deployment and operations.

## Current Architecture

- Frontend: Vite, React, TypeScript.
- Backend: lightweight Fastify server in `server/`.
- Contracts/read models: Zod contracts plus pure domain/read-model layers.
- API convention: product routes use `{ ok: true, data }` and `{ ok: false, error }`; `/api/health` remains simple.
- LLM boundary: backend-only; deterministic mock remains supported; OpenAI mode requires explicit backend config.
- Smart contract tooling: local Hardhat/OpenZeppelin fixture exists for compile/test only.
- Wallet boundary: MetaMask-first EIP-1193 connection and Sepolia readiness are implemented frontend-only.
- Unsigned deployment intent boundary: review-only domain model exists.
- Wallet-signed deployment boundary: frontend-only Sepolia deployment exists.
- Deployment evidence boundary: provider transaction hash and receipt-confirmed contract address are represented as local-session evidence/readiness only.
- Persistence, auth, payments, SCP operations, durable Evidence Pack storage, and mainnet are not implemented.

## Current Repo Capabilities

- Cockpit2 guided lifecycle UI.
- Passive right rail and collapsible Brief Preview.
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
- Compile/test result adapter.
- Deployment Gate read model and UI surface.
- Wallet Signing Intent read model and UI surface.
- Smart Contract Operations locked state.
- Golden-flow guardrails against fake deployment/signing/address/hash claims.
- Wallet Connection Read Model and frontend-only EIP-1193 adapter.
- Unsigned Deployment Intent Read Model.
- Wallet-signed Sepolia deployment adapter and local-session deployment state.
- Deployment Evidence Read Model and passive UI/SCP evidence surface.

## Completed Recent Tracks

- Track 7A: Project Closure Ledger contract.
- Track 7B: Closure read model and passive cockpit wiring.
- Track 7C: structured Engineering Bot response rendering.
- Track 8A: thin Project Lifecycle Read Model.
- Track 8B: Cockpit Action Registry and primary action wiring.
- Track 8C: SCP deterministic view model.
- Track 9A: Smart Contract Artifact Spec contract and backend route.
- Track 9B: deterministic artifact package, check result, and evidence-lite route.
- Track 9C: cockpit/SCP smart-contract preparation flow.
- Track 9D: demo-readiness polish.
- Track 9B.2: Solidity compile/test toolchain decision ADR.
- Track 10A: minimal Hardhat compile/test foundation.
- Track 10B: compile/test result adapter.
- Track 10C: local compile/test status surfaced in cockpit/SCP.
- Track 11A: Deployment Gate read model.
- Track 11B: Deployment Gate view-only cockpit/SCP wiring.
- Track 12A: Wallet Signing Intent read model.
- Track 12B: Wallet Signing Intent view-only cockpit/SCP wiring and operations locked state.
- Track 12C: lifecycle golden-flow hardening.
- Track 13A: MetaMask-first wallet adapter and Sepolia signing design plus pure wallet connection read model.
- Track 13B: frontend-only EIP-1193 wallet connection and Sepolia verification.
- Track 14A: unsigned deployment intent read model.
- Track 14B: wallet-signed Sepolia deployment through browser wallet.
- Track 14C: deployment evidence/readiness local-session surface.

## Current Next Step

Track 15A: First SCP Wallet-Signed Operation - Record NAV Event.

Track 15A should:

- consume confirmed deployment evidence/readiness.
- add one low-risk operation intent for Record NAV Event.
- request a user wallet-signed contract operation only after wallet/chain/deployment/authorization gates pass.
- link operation transaction/receipt result into evidence.
- keep backend private-key custody impossible.
- remain Sepolia-only.

## Code Review (Agent / PR)

For structured reviews, use the **Code Reviewer trio** (keep severities aligned with the checklist):

1. `docs/handover/05-code-reviewer-skill.md` — how to review and report
2. `docs/contracts/code-reviewer-checklist.md` — executable phases (PASS/FAIL authority)
3. `docs/handover/06-code-reviewer-lessons.md` — pattern memory; scan before checklist

Read this checkpoint first. Guardrails here and in `docs/architecture/architecture-guardrails.md` must match Phase 1–2 of the checklist.

## What Must Not Be Done Yet

- No broad operation suite yet.
- No mainnet.
- No backend private-key custody.
- No persistence/database.
- No auth/payments.
- No broad Cockpit2 redesign.
- No monolithic lifecycle context.
