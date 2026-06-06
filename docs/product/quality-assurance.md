# MILA26 Quality Assurance

## Purpose

MILA26 is being built with a structured quality-assurance process for an AI-assisted tokenisation workspace. The aim is to reduce brittle code, incomplete data flow, unsafe blockchain assumptions, and unsupported product claims before work reaches users or external reviewers.

This page is suitable source material for company and product website copy. It summarizes the quality model in user-facing language while the internal review contracts remain in `docs/handover/` and `docs/contracts/`.

---

## Quality Philosophy

MILA26 uses AI-assisted engineering, but final delivery is not treated as an automatic code-generation exercise.

The quality model is:

- lead-led implementation;
- specialist reviewer checks;
- source-of-truth drift control;
- focused regression testing;
- Sepolia/testnet safety boundaries;
- human accountability for final decisions.

The Lead Implementer remains responsible for integration, debugging, refactoring decisions, test interpretation, and release readiness. Reviewers provide independent checks, but they do not replace final engineering accountability.

---

## Reviewer System

MILA26 uses a reviewer system with defined roles:

| Role | What It Checks |
|---|---|
| Lead Implementer / Lead Integrator | Integrates work, debugs failures, decides fixes, and owns final readiness. |
| Code Reviewer | Reviews correctness, scope, guardrails, maintainability, tests, and recurring defect patterns. |
| Test Engineer | Checks happy paths, failure paths, edge cases, regression coverage, and e2e behavior where needed. |
| Quality Architect / Refactorer | Looks for brittleness, duplicated rules, source-of-truth drift, hardcoding, and weak module boundaries. |
| Security Reviewer | Reviews wallet safety, secrets, auth, API boundaries, private-key custody, LLM provider exposure, and sensitive data handling. |
| Solidity Reviewer | Reviews smart-contract invariants, ABI/artifact consistency, access control, events, revert paths, and testnet boundaries. |
| Frontend/UX Reviewer | Reviews Engineering Bot readability, lifecycle tab coherence, right-rail passivity, responsive behavior, and user-facing claims. |
| Release Engineer | Reviews build status, environment configuration, reviewer gates, commit/push readiness, and release risk. |

One person or agent may perform more than one role in a small track, but the role checks remain explicit.

---

## What Reviewers Check

Reviewer checks focus on the failure modes most likely to matter for MILA26:

- lifecycle tabs must remain visual navigation only, not separate code silos;
- shared lifecycle state must feed tabs, Engineering Bot prompts, Product Vault, SCP gates, and evidence surfaces where applicable;
- investor wallet registry data must remain the whitelist source of truth;
- wallet operations must remain user-signed and Sepolia/testnet-only;
- backend code must never hold private keys;
- frontend code must never expose LLM provider secrets;
- transaction hashes, contract addresses, deployment evidence, and operation evidence must not be faked;
- generated smart contracts must not be described as audited, production-ready, legally approved, or investment-advice compliant;
- tests must cover behavior and failure paths, not only display text or implementation details.

---

## Review Gates

MILA26 uses staged review gates:

| Gate | Use |
|---|---|
| Focused validation | For narrow behavior changes, bug fixes, and small UI/domain updates. |
| Quick review | For docs, guardrails, small domain changes, small UI changes, or contract-surface updates. |
| Full audit | For wallet, deployment, transaction, backend, persistence, LLM, SCP operation, lifecycle-label, or smart-contract changes. |
| Release check | Before meaningful commit, push, deployment, beta handoff, or investor-facing demo material. |

Critical findings must be fixed before commit or release. High findings should be fixed in the same track unless deliberately deferred and documented.

---

## Drift Control

MILA26 treats drift as a quality risk.

Drift happens when the product, code, docs, tests, UI labels, lifecycle state, smart-contract artifacts, or roadmap stop describing the same system.

Reviewer roles check for drift across:

- product and roadmap prompts;
- Engineering Bot guidance;
- lifecycle tab state;
- Product Vault and capability status;
- SCP operation gates;
- contract specs, ABI, and artifacts;
- tests and fixtures;
- release notes and handover docs.

When drift is found, the correction loop is:

1. Identify the authoritative source.
2. Decide whether the source or the dependent surface is wrong.
3. Fix the smallest coherent set of files.
4. Add or update a focused regression check.
5. Re-run relevant validation.
6. Record repeated patterns for future reviewer checks.

This is designed to prevent small inconsistencies from turning into brittle flows, hidden state bugs, or misleading user-facing claims.

---

## Blockchain Safety Boundaries

The current MILA26 MVP is intentionally bounded:

- Ethereum Sepolia/testnet only;
- user wallet signs deployment and operations;
- backend never holds private keys;
- no production mainnet deployment;
- no custody operations;
- no fake transaction hash, contract address, deployment, or audit evidence;
- generated Solidity remains scaffold/demo code unless compiled, tested, security-reviewed, and externally audited.

These boundaries are product safeguards, not marketing limitations. They keep the MVP honest while the workflow matures.

---

## Smart Contract Review

Smart-contract related work receives additional scrutiny.

The Solidity review process checks:

- pinned compiler and deterministic build assumptions;
- OpenZeppelin usage;
- access control;
- whitelist behavior;
- subscription, redemption, NAV, maturity, and allocation invariants where applicable;
- event coverage for evidence;
- revert paths and edge cases;
- ABI and artifact consistency;
- testnet-only deployment assumptions.

Stablecoin subscription, redemption execution, maturity closeout, and production liquidity management are not treated as live until the relevant parameter model, template handoff, contract implementation, tests, and evidence gates are complete.

---

## Independent External Review

MILA26 may add an independent external model reviewer, such as Claude or another model, after the review surface is mature enough for useful second-opinion variance.

This should happen after:

- Subscription and Redemption parameter capture are implemented and tested;
- smart-contract template handoff can consume lifecycle parameters;
- Solidity and security hardening has started;
- reviewer output can be validated against a structured finding schema;
- cost controls, rate limits, and backend-only model access are designed.

An external reviewer would be used for bounded independent review only, such as security-sensitive wallet changes, Solidity invariants, architecture drift, or beta-readiness checks. It would not autonomously commit, push, deploy, or approve production readiness.

---

## What This Does Not Mean

MILA26 quality assurance does not mean:

- legal, tax, accounting, or regulatory advice;
- formal KYC/AML approval;
- investment advice;
- production smart-contract audit completion;
- mainnet deployment readiness;
- custody approval;
- guaranteed security;
- guaranteed investment performance.

Those require separate professional, legal, regulatory, operational, and external audit processes.

---

## Internal Evidence Base

The website-facing QA story is backed by these internal docs:

- `docs/handover/05-code-reviewer-skill.md`
- `docs/contracts/code-reviewer-checklist.md`
- `docs/handover/06-code-reviewer-lessons.md`
- `docs/handover/07-code-review-activation-rules.md`
- `docs/handover/08-delivery-role-skills.md`
- `AGENTS.md`
