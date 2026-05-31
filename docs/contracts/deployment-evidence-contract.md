# Deployment Evidence Contract

Track 14C adds `DeploymentEvidenceReadModel`, a pure derived read model for wallet-signed Sepolia deployment evidence.

It derives from Track 14B local-session deployment state. It does not call wallets, providers, backend routes, storage, or Hardhat.

## Purpose

The read model answers:

- whether deployment evidence is not started, awaiting wallet confirmation, submitted, confirmed, rejected, failed, or blocked.
- whether evidence strength is none, provider transaction hash, or confirmed receipt.
- whether transaction hash came from the provider or is absent.
- whether contract address came from a successful receipt or is absent.
- whether Smart Contract Operations remain locked.

## Provenance Rules

- `transactionHashSource` is `provider_returned` only when Track 14B state contains a provider-returned transaction hash.
- `contractAddressSource` is `receipt_returned` only when deployment is `confirmed`, receipt status is `success`, and a receipt contract address exists.
- Failed, rejected, blocked, submitted, or malformed states cannot become confirmed receipt evidence.
- The model never invents transaction hashes, contract addresses, block numbers, explorer links, confirmations, audit status, or production approval.

## Persistence Boundary

`evidencePersistence` is always `local_session_only`.

Track 14C is an evidence/readiness linkage surface only. It is not durable Evidence Pack storage, indexing, database persistence, backend deployment evidence API, or an on-chain audit trail.

## SCP Boundary

SCP may passively show deployment evidence status, evidence strength, provider-returned transaction hash, receipt-returned contract address, Sepolia network, and local-session persistence.

SCP operations remain locked until Track 15A or a later operation-specific authorization/evidence track.

## Non-Goals

Track 14C does not add:

- new wallet signing.
- new deployment execution.
- backend deployment/evidence routes.
- localStorage/sessionStorage/database persistence.
- backend private-key custody.
- mainnet.
- fake transaction hash, contract address, block number, or explorer link.
- audit/security/legal/production approval.
- Mint/Burn/Pause/NAV/Distribution controls.
