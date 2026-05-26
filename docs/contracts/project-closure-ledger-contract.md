# Project Closure Ledger Contract

## Purpose

Track 7A adds a minimal typed Project Closure Ledger / Open Items contract foundation.

The ledger is a future-facing domain object for deciding whether a tokenisation project is ready to move from requirements and engineering planning into build, QA, security review, evidence, wallet signing, and testnet deployment gates.

This track does not add workflow orchestration, backend routes, persistence, wallet handling, Solidity compilation, blockchain deployment, or UI wiring.

## Source

Implementation:

- `src/domain/projectClosureLedger.ts`

Tests:

- `tests/project-closure-ledger.test.ts`

## Contract Shape

The contract captures:

- open items / unresolved questions
- closure checks / readiness checks
- evidence or artifact references
- decision status
- safety/deployment boundaries
- derived readiness summary

## Statuses

Decision, check, and open-item status values are:

- `open`
- `in_review`
- `resolved`
- `blocked`
- `deferred`

## Check Categories

Supported closure check categories are:

- `requirement_brief`
- `engineering_brief`
- `token_design`
- `wallet_access`
- `valuation_updates`
- `compliance_assumptions`
- `security_review`
- `evidence_pack`
- `deployment_boundary`
- `user_approval`

## Fixed MVP Boundaries

The ledger schema enforces these MVP boundaries:

- Network boundary: `ethereum-testnet-only`
- Backend custody boundary: `backend-holds-no-private-keys`
- Deployment signing boundary: `user-wallet-signs`
- Mainnet deployment allowed: `false`

These are contract invariants for the MVP unless a later explicit track changes them.

## Readiness Summary

`summarizeProjectClosureReadiness()` derives:

- total checks
- passed checks
- blocked checks
- unresolved open items
- deferred items
- boundary status
- whether the project is ready for the next stage

A project is ready only when required checks are resolved, no required check is blocked, no unresolved blocking open item remains, and all MVP safety boundaries are intact.

## Future Migration Rule

Future tracks may wire this contract into UI, backend routes, evidence packs, deployment gates, or LLM-assisted review. Any change to the contract must update:

- source schema/type
- deterministic construction behavior
- tests
- this document

Do not add production deployment capability by changing this contract alone.
