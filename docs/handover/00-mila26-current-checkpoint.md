# MILA26 Current Checkpoint

## One-Page Summary

MILA26 is a blockchain-functional alpha foundation for an AI + blockchain tokenisation workspace for asset managers.

The current app can guide a project from a plain-language requirement through Engineering Brief, closure readiness, Smart Contract Artifact Spec, deterministic artifact preview, check/evidence-lite, local compile/test representation, Deployment Gate, Wallet Signing Intent, and locked Smart Contract Operations.

The next implementation step is real wallet connection and Sepolia verification through a MetaMask-first EIP-1193 browser-provider boundary.

## Current Product Direction

- Build a professional AI + blockchain workspace, not a crypto trading dashboard.
- Current alpha path: restricted ERC-20-compatible fund units for a tokenised income/fund product.
- Start with one local Mac laptop alpha for one asset manager and up to 20 investor wallets.
- Keep execution Ethereum Sepolia/testnet-only.
- Use Engineering Bot as the lifecycle decision surface.
- Keep the right rail passive.
- Keep SCP as status/evidence/boundary/health until a real wallet-signed deployment exists.
- Backend never holds private keys.
- User wallet signs future deployment and operations.

## Current Architecture

- Frontend: Vite, React, TypeScript.
- Backend: lightweight Fastify server in `server/`.
- Contracts/read models: Zod contracts plus pure domain/read-model layers.
- API convention: product routes use `{ ok: true, data }` and `{ ok: false, error }`; `/api/health` remains simple.
- LLM boundary: backend-only; deterministic mock remains supported; OpenAI mode requires explicit backend config.
- Smart contract tooling: local Hardhat/OpenZeppelin fixture exists for compile/test only.
- Wallet boundary: Track 13A defines a MetaMask-first EIP-1193 connection/readiness design; no wallet runtime exists yet.
- Persistence, auth, payments, wallet signing, deployment execution, transaction lifecycle, and mainnet are not implemented.

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
- Wallet Connection Read Model for the next MetaMask/Sepolia track.

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

## Current Next Step

Track 14A: Unsigned Deployment Transaction Intent.

Track 14A should:

- define the reviewable unsigned deployment intent.
- consume lightweight readiness from Deployment Gate, Wallet Signing Intent, Wallet Connection, artifact/check/evidence, and local compile/test state.
- keep deployment/signing/transaction execution blocked.
- keep transaction hash, contract address, signed payload, submitted transaction, confirmed transaction, and receipt absent.

## What Must Not Be Done Yet

- No deployment transaction preparation.
- No wallet signing request.
- No transaction submission.
- No transaction hash display.
- No contract address display.
- No SCP operational controls.
- No mainnet.
- No backend private-key custody.
- No persistence/database.
- No auth/payments.
- No broad Cockpit2 redesign.
- No monolithic lifecycle context.
