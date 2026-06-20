---
name: mila26-contract-ops
description: Use when working on MILA26 Contract Ops expertise, including ERC protocol advice, Product Setup to contract-spec compilation, Solidity planning, Solidity security review, contract testing, Sepolia wallet deployment readiness, evidence indexing, and pre-ship QA for tokenised product smart-contract workflows.
---

# MILA26 Contract Ops Skill

Use this repo-owned skill for Contract Ops smart-contract, wallet, deployment, and evidence work. The user sees ZiLiOS. These skills are internal capabilities and review lenses, not visible product bots.

## Core Rules

- Product Setup is the canonical PRD source.
- Contract Ops owns contract specification, feature/event mapping, readiness, deployment preview, wallet-signed Sepolia deployment, and deployment evidence.
- Backend never holds private keys.
- Frontend never calls LLM providers directly.
- Sepolia/testnet is the only deployment network.
- Generated Solidity is draft until reviewed, tested, and explicitly confirmed.
- Do not inject full EthSkills source snapshots into runtime prompts. Use compact distilled cards.

## Which Card To Read

- Protocol choice, ERC tradeoffs, or user confusion: read `protocol-advisor.md`.
- Product Setup snapshot to deployable contract spec: read `contract-spec-compiler.md`.
- Solidity implementation plan or draft generation: read `solidity-builder.md`.
- Solidity safety or audit-style review: read `solidity-security-reviewer.md`.
- Contract unit/failure/invariant test planning: read `contract-test-planner.md`.
- Wallet, Sepolia, admin-wallet, deployment preview, or readiness: read `wallet-deployment-reviewer.md`.
- Evidence events, artifacts, hashes, versioning, or Evidence Vault: read `evidence-indexing-reviewer.md`.
- UI readiness, right-rail behavior, traceability, or demo release QA: read `pre-ship-qa-reviewer.md`.

## Runtime Boundary

The backend registry should route to the minimum relevant cards, include skill IDs/versions/source hashes in traces, and schema-validate outputs. Skills propose structured outputs; they must not silently mutate Product Setup, Contract Ops settings, Solidity files, deployment state, or Evidence Vault records.

## Required Review Before Release

For meaningful changes, apply `docs/handover/08-delivery-role-skills.md` and the code-review activation rules. In particular, check:

- Test Engineer coverage for current user journeys and failure paths.
- Quality Architect source-of-truth and drift checks.
- Security Reviewer wallet, LLM, prompt-injection, and evidence safety checks.
- Solidity Reviewer protocol/template invariants and event coverage.
- Frontend/UX Reviewer tab-aware ZiLiOS behavior and right-rail passive boundary.
- Release Engineer skill versions, evals, source hashes, and validation results.
