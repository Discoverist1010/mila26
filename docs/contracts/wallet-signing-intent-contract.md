# Wallet Signing Intent Contract

Track 12A adds a pure wallet-signing intent read model for describing what a future user-wallet signing step would require after Deployment Gate Review.

It does not connect a wallet, prepare a transaction, sign, submit, deploy, or track blockchain execution.

## Purpose

The wallet-signing intent answers:

- Is the Deployment Gate Review ready enough to discuss future wallet signing?
- What must the user review before any later signing track?
- What boundaries prevent MILA26 from handling keys, deployment execution, or transaction state?
- What transaction-preparation inputs will be required later?

The current implementation is `src/domain/walletSigningIntentReadModel.ts`.

## Input Boundary

The model consumes the Track 11A `DeploymentGateReadModel`.

It deliberately does not consume raw UI state, wallet provider objects, private-key material, transaction data, or a monolithic project lifecycle object.

## Read Model

The read model returns:

- `intentStatus`: `blocked` or `review_ready`.
- `walletExecutionStatus`: always `not_implemented` in Track 12A.
- `sourceDeploymentGate`: the source gate status, pre-deployment readiness, and execution status.
- `requiredReviewItems`: review rows for briefs, closure, spec, artifact, checks, evidence, compile/test, gate, and safety boundaries.
- `blockedReasons`: gate-derived blockers plus the wallet-integration blocker.
- `signingBoundaries`: no-key, no-wallet, no-execution, no-address, no-hash, no-signed-payload, no-submitted-transaction, no-confirmed-transaction, no-mainnet, and no-audit boundaries.
- `futureTransactionRequirements`: descriptive requirements for later wallet/deployment tracks.

## Semantics

If Deployment Gate Review is blocked, wallet signing intent is blocked.

If Deployment Gate Review is review-ready, wallet signing intent may become `review_ready`.

Even when intent is `review_ready`, `walletExecutionStatus` remains `not_implemented`. Track 12A only describes future signing intent and boundaries.

## Required Review Items

Track 12A includes review rows for:

- Requirement Brief reviewed.
- Engineering Brief reviewed.
- Project Closure / Open Items reviewed.
- Smart Contract Artifact Spec reviewed.
- Smart Contract Artifact Preview reviewed.
- Check Result reviewed.
- Evidence-Lite reviewed.
- Local Compile/Test result reviewed.
- Deployment Gate reviewed.
- Safety boundaries reviewed.

## Signing Boundaries

Track 12A explicitly states:

- Backend must never hold user private keys.
- User wallet signs any future deployment transaction.
- Wallet signing is not implemented yet.
- Wallet connection is not implemented yet.
- Deployment execution is not implemented yet.
- Ethereum testnet only.
- Mainnet disabled.
- No contract address exists.
- No transaction hash exists.
- No signed payload exists.
- No submitted transaction exists.
- No confirmed transaction exists.
- Audit not performed.

## Future Transaction Requirements

The model can describe future requirements, but does not create them:

- User-controlled wallet address required later.
- Browser wallet/provider integration required later.
- Target Ethereum testnet chain selection required later.
- Deployable contract bytecode and ABI required later.
- Constructor/deployment parameters required later.
- Explicit wallet confirmation required later.
- Transaction submission and confirmation tracking model required later.

## Non-Goals

Track 12A does not add:

- UI wiring, App wiring, or SCP wiring.
- backend routes or API endpoints.
- wallet adapter, wallet connection, or wallet signing.
- viem/ethers transaction code.
- deployment scripts.
- transaction lifecycle states such as `ready_for_signature`, `submitted`, `confirmed`, or `failed`.
- command execution.
- fake contract address, fake transaction hash, fake deployment status, or fake audit/security approval.
- mainnet configuration.
- persistence, auth, payments, LLM changes, global state, or a monolithic lifecycle context.

Future wallet/deployment tracks may define wallet adapter and transaction lifecycle contracts only after the wallet-signing intent boundary is stable.
