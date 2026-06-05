# Deployment Gate Contract

Track 11A adds a pure deployment-gate read model for deciding whether MILA26 has enough planning, artifact, check, evidence, and local compile/test readiness to review a future deployment gate.

It does not prepare, sign, submit, or track blockchain transactions.

## Purpose

The deployment gate answers:

- Are pre-deployment prerequisites complete?
- What still blocks actual deployment execution?
- Are MVP safety boundaries still enforced?

It deliberately separates:

- `preDeploymentReadiness`: planning/artifact/check/evidence/compile-test completeness.
- `deploymentExecutionStatus`: actual execution availability.

For Track 11A, `deploymentExecutionStatus` is always `blocked` because wallet signing is not implemented.

## Read Model

The current implementation is `src/domain/deploymentGateReadModel.ts`.

Inputs are lightweight statuses from existing artifacts and read models:

- Requirement Brief present/absent.
- Engineering Brief present/absent.
- Project Closure readiness status.
- Smart Contract Artifact Spec status.
- Artifact Preview status.
- Check Result status.
- Evidence-Lite status.
- Local Compile/Test status.
- Fixed MVP safety boundaries.

The read model returns:

- `gateStatus`: `blocked` or `review_ready`.
- `preDeploymentReadiness`: `incomplete`, `complete`, or `blocked`.
- `deploymentExecutionStatus`: `blocked`.
- `readyForDeploymentGateReview`.
- `readyForWalletSigningDesign`.
- prerequisite checks.
- boundary checks.
- blocked reasons.
- remaining gate items.

## Boundary Checks

Track 11A boundary checks explicitly include:

- Ethereum testnet only.
- Mainnet disabled.
- Backend holds no private keys.
- User wallet signing required for any future deployment.
- Wallet signing not implemented.
- Deployment not executed.
- Contract address absent.
- Transaction hash absent.
- Audit not performed.

Contract address and transaction hash remain absent boundary checks. They are not nullable future fields in Track 11A.

## Non-Goals

Track 11A does not add:

- UI wiring.
- backend routes or API endpoints.
- wallet adapter, wallet connection, or wallet signing.
- viem transaction code.
- deployment scripts.
- backend or frontend command execution.
- Hardhat execution from the app.
- persistence, auth, payments, LLM changes, or global state.
- fake contract address, fake transaction hash, fake deployment status, or audit/security approval claims.
- transaction lifecycle states such as `ready_for_signature`, `submitted`, `confirmed`, or `failed`.

Future wallet/deployment tracks may define transaction lifecycle contracts after the deployment gate semantics are stable.

## Track 11B View Wiring

Track 11B surfaced this read model in the workspace/SCP as view-only readiness:

- Deployment Gate Review: blocked or review-ready.
- Pre-deployment readiness: incomplete, blocked, or complete.
- Deployment execution: blocked.
- Remaining gate items.
- Safety boundaries for testnet-only, mainnet disabled, no backend private keys, user wallet signing required later, wallet signing not implemented, deployment not executed, contract address absent, transaction hash absent, and audit not performed.

Track 11B still does not add wallet connection, signing, transaction lifecycle, deployment scripts, backend routes, fake addresses, fake transaction hashes, or audit/deployment claims.
