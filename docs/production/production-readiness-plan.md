# MILA26 Production Readiness Plan

## Status: ACTIVE

**Last updated:** 2026-06-07
**Target GTM date:** 2026-11-01
**Prototype target:** 2026-06-20
**Beta window:** 2026-09-01 to 2026-10-31

---

## Purpose

This plan turns MILA26's MVP scope into an execution path from current alpha to:

- a functional prototype in roughly two weeks;
- investor and beta-tester readiness during September and October 2026;
- a credible November 1, 2026 GTM launch.

The plan covers product, UX, frontend, backend, smart contracts, wallet operations, persistence, security, quality assurance, website/login, infrastructure, and release operations.

This is not a mainnet launch approval. Mainnet, custody, production legal/KYC/compliance approval, formal audit-complete claims, and regulated investment-advice delivery remain gated until separately approved.

---

## MVP Scope Statement

Everything captured in the latest mockup direction and the user-stated lifecycle intent is in MVP scope:

- company and product intro website;
- access/login path for controlled users;
- guided MILA26 lifecycle workspace;
- Engineering Bot as cross-stage lifecycle copilot;
- visual tabs for Overview, Requirements, Investor Registry, Subscription, Smart Contract, Asset Servicing, Redemption, Maturity, and Evidence;
- shared lifecycle state across all tabs;
- Investor Registry for up to 50 whitelisted wallet addresses;
- permitted stablecoin subscription parameter capture;
- redemption parameter capture, including redemption wallet, payout stablecoin, payout-per-token, and configurable delay;
- subscription-redemption smart-contract template handoff;
- Sepolia-only wallet connection, deployment, and wallet-signed operation model;
- wallet-signed whitelist and NAV operation foundations;
- future allocation/mint after investor registry and subscription parameters are coherent;
- asset servicing updates such as NAV, valuation, notices, corporate actions, and maturity events;
- evidence surfaces and future durable Evidence Vault;
- reviewer, QA, security, Solidity, UX, state/memory/performance, and release gates.

MVP does not mean every scoped item is already implemented. It means the product and code roadmap must support these items without treating them as optional later product ideas.

---

## Current Baseline

Already implemented or documented:

- lifecycle workspace UI direction and shared presentation state;
- Engineering Bot-centric center workspace;
- visual tabs and passive right rail;
- Requirement Brief, Engineering Brief, Smart Contract Artifact Spec, deterministic preview, evidence-lite, compile/test read models;
- MetaMask/EIP-1193 wallet connection and Sepolia verification;
- wallet-signed Sepolia deployment with provider-returned transaction hash and receipt-confirmed contract address;
- local-session deployment evidence;
- wallet-signed Record NAV Event operation;
- wallet-signed Whitelist Wallet operation;
- wallet-signed Allocation/Mint operation for a selected whitelisted investor wallet after coherent registry/subscription/allocation parameters;
- Investor Registry tab for up to 50 wallet addresses with validation, duplicate detection, generated test investor wallet packs, local-session whitelist status, SCP handoff, and Allocation/Mint handoff;
- Subscription tab parameter capture with permitted stablecoins, subscription window, minimum subscription amount, payment address, and payment per token;
- Redemption tab parameter capture with redemption window/date, payout stablecoin, payout per token, redemption wallet, and delay unit/duration;
- shared lifecycle validation and subscription-redemption template handoff status across the Engineering Bot, Product Vault, lifecycle snapshot, and tabs;
- backend SQLite workspace snapshot persistence for project/lifecycle state and Investor Registry rows;
- reviewer system and triggered review lenses.

Immediate implementation gap:

- Browser/screenshot hardening remains part of the validation loop for every new working path.
- Durable Evidence Vault storage.
- Generated artifact persistence.
- Website/login path.
- Production readiness controls.

---

## Readiness Levels

| Level | Target Date | Meaning | Required Before Advancing |
|---|---:|---|---|
| Prototype | 2026-06-20 | Working local/Sepolia product prototype, not a static mockup. It must let a user enter, edit, validate, and reuse lifecycle data across tabs, generate/review artifacts where scoped, and demonstrate real wallet-signed Sepolia paths already implemented. | Subscription/Redemption capture, coherent lifecycle state, working validation, artifact/status handoff, mockup-aligned UX, explicit gate states, passing tests. |
| Internal Alpha | 2026-07-31 | Team-usable build with stable flows, stronger validation, and repeatable Sepolia demos. | Template handoff, Allocation/Mint operation hardening, persistence decision, QA gates, security threat model. |
| Private Beta | 2026-09-01 | Controlled external users can test without handholding. | Website/login, hosted or scripted access, telemetry, feedback loop, security review, beta scripts. |
| GTM Candidate | 2026-10-15 | Product, website, docs, QA, and release posture are ready for launch decisions. | Release runbook, regression suite, external review where useful, issue burn-down, launch copy approved. |
| GTM Live | 2026-11-01 | Public-facing company/product launch with a controlled MVP path. | No unresolved Critical/High launch blockers, deployment checklist complete, rollback/support plan ready. |

---

## Two-Week Prototype Plan

The prototype must work. It is not acceptable for the two-week target to be a static mockup, decorative UI, or click-through shell. Every implemented surface must change real application state, validate inputs, update dependent surfaces, and be covered by focused tests.

### Week 1: Lifecycle Completeness

1. Implement Subscription tab parameter capture:
   - permitted stablecoins;
   - subscription window;
   - minimum subscription amount;
   - payment wallet or contract address;
   - payment per token.
2. Implement Redemption tab parameter capture:
   - redemption window/date;
   - redemption wallet;
   - payout stablecoin;
   - payout per token;
   - delay unit and duration.
3. Extend shared lifecycle state/read model so the Engineering Bot, tabs, Product Vault, lifecycle snapshot, and SCP gates read the same values.
4. Update Engineering Bot next actions to recommend the next missing parameter or handoff.
5. Add focused tests for valid, invalid, incomplete, edited, and cross-tab parameter state.

Current status: the Week 1 Subscription/Redemption parameter capture and shared lifecycle validation slice is implemented in local-session state with focused unit/UI tests. Continue by hardening e2e coverage and screenshot review rather than rebuilding the same fields.

### Week 2: Template Handoff And Prototype Polish

1. Harden the subscription-redemption smart-contract template parameter handoff with e2e coverage and browser review.
2. Keep the handoff as spec/template work unless execution is explicitly scoped.
3. Add Product Vault artifact/status updates for the template.
4. Tighten lifecycle tab UI, empty states, locked states, and next-best-action wording.
5. Add prototype smoke tests and e2e coverage for the full guided flow.
6. Create a short prototype demo script:
   - define product intent;
   - register investor wallets;
   - configure subscription;
   - configure redemption delay;
   - generate/review template handoff;
   - connect wallet and show Sepolia boundary;
   - show existing deployment/NAV/whitelist evidence path;
   - explain Allocation/Mint execution gates, durable Evidence Vault, and Maturity closeout.

Prototype success means the user can complete a working local workflow:

1. enter product intent;
2. register investor wallet addresses;
3. configure subscription parameters;
4. configure redemption parameters and delay;
5. see those values reflected across Engineering Bot guidance, tabs, lifecycle snapshot, Product Vault, and template handoff;
6. generate or review scoped artifacts/statuses from current lifecycle state;
7. connect a wallet and demonstrate the existing real Sepolia deployment/NAV/whitelist/allocation foundations where available;
8. see unavailable future actions with clear reasons.

It does not require live stablecoin subscription/redemption execution, but any parameter/template flow that is shown as implemented must be functional and test-protected.

---

## Workstreams

### Product And UX

Owner lens: Frontend/UX Reviewer.

Must deliver:

- mockup-aligned lifecycle workspace;
- clear first impression;
- AI-first center workspace;
- obvious next best action;
- no internal track labels in user-facing UI;
- right rail passive;
- mobile/desktop no-overlap checks;
- first-run path for a user who does not know tokenisation.

### Frontend Application

Owner lens: Quality Architect / Refactorer, Test Engineer.

Must deliver:

- shared lifecycle state;
- no per-tab data silos;
- feature-complete controls for MVP tabs;
- stable derived read models;
- clear loading/error/locked/available/completed states;
- e2e coverage for lifecycle flow.

### Backend And LLM

Owner lens: Security Reviewer, State / Memory / Performance Lens.

Must deliver:

- backend-only LLM/provider calls;
- schema-validated outputs;
- no frontend secrets;
- deterministic fallback where practical;
- compact prompts;
- prompt budget guards that preserve required context and fall back instead of sending partial facts;
- typed run/project/chat context boundaries.

### Smart Contracts And Wallet

Owner lens: Solidity Reviewer, Security Reviewer.

Must deliver:

- subscription-redemption template specification;
- contract parameter mapping from lifecycle state;
- Sepolia-only wallet signing;
- no backend private-key custody;
- provider-returned transaction hash only after submission;
- receipt-confirmed contract address only after receipt;
- focused contract tests for invariants and failure paths.

### Persistence And Evidence

Owner lens: State / Memory / Performance Lens, Security Reviewer.

Must deliver before beta:

- decision on local SQLite versus hosted database for beta;
- durable Evidence Vault storage with explicit provenance labels;
- generated artifact persistence with invalidation rules;
- retention/deletion boundary;
- evidence provenance model;
- local-session versus durable status labeling;
- no stale NAV, wallet, redemption, or evidence state shown as current.

### Website, Access, And First Impression

Owner lens: Frontend/UX Reviewer, Release Engineer.

Must deliver before beta:

- company/product intro website with benefit-led technical storytelling;
- controlled access/login path;
- product positioning without legal/KYC/advice/audit overclaims;
- link from website to app;
- onboarding copy for asset-manager user intent.

Use `docs/product/website-mvp-brief.md` as the website implementation brief. The website must route into the app without duplicating project lifecycle state.

Persistence planning is recorded in `docs/architecture/persistence-boundary-decision.md`. Durable lifecycle/evidence records should start behind a backend SQLite boundary, not browser storage.

### Security And Compliance Boundaries

Owner lens: Security Reviewer.

Must deliver before beta:

- threat model;
- secrets and env review;
- access control design;
- input validation and upload boundary;
- wallet custody boundary review;
- AI prompt/input safety review;
- no regulated approval claims.

### QA, Release, And Operations

Owner lens: Code Reviewer, Test Engineer, Release Engineer.

Must deliver:

- `npm run check` pass;
- focused domain/UI tests for each track;
- e2e lifecycle smoke;
- `npm run contracts:build` and `npm run test:contracts` for contract changes;
- release checklist;
- rollback/support plan;
- issue triage labels for beta.

---

## Gate Checklist

| Gate | Blocks If |
|---|---|
| UX Gate | User cannot understand current stage, next action, locked state, or lifecycle continuity. |
| State Gate | Tabs, Engineering Bot, Product Vault, SCP, or contract handoff derive from inconsistent state. |
| Security Gate | Secrets in frontend, backend private keys, unsafe wallet assumptions, auth gaps, or sensitive data leakage. |
| Contract Gate | ABI/spec mismatch, missing invariant tests, wrong access control, missing events, or unsafe redemption assumptions. |
| Evidence Gate | Fake transaction/address/evidence, stale local-session data shown as durable/current, missing provenance. |
| Performance Gate | Slow path freezes navigation or repeats expensive work without safe cache/progress behavior. |
| Claims Gate | UI/docs imply legal, KYC, compliance, audit, custody, mainnet, or investment-advice approval. |
| Release Gate | Required tests/checks fail, env is unclear, rollback plan absent, or Critical/High findings unresolved. |

---

## External Reviewer Trigger

Claude or another independent reviewer can be considered now only for bounded independent review, because Subscription/Redemption parameter capture and template handoff readiness exist. Do not add it as a standing reviewer until:

- review outputs have a structured finding schema;
- cost/rate limits are explicit;
- known-defect or eval cases exist.

Use external review first for:

- Solidity invariants;
- wallet/security changes;
- architecture drift;
- beta-readiness review.

External reviewers provide independent signal only. They do not commit, push, deploy, approve readiness, or replace the Lead Implementer.

---

## Open Decisions

Resolve before beta:

1. Hosted app stack and environment strategy.
2. Auth provider or controlled-login approach.
3. Persistence target for beta.
4. Evidence Vault storage format.
5. Website launch stack.
6. Support and incident channel for beta testers.
7. Whether the prototype remains local-only or gains a hosted demo path before September.
8. Whether external smart-contract/security review is needed before beta or before GTM.

---

## Immediate Next Coding Track

Harden the investor registry, Subscription, Redemption, subscription-redemption template handoff, Sepolia readiness, and Allocation/Mint execution flow with e2e coverage and browser review. Continue website/access work only if it remains cleanly separated from app lifecycle state. Use `docs/product/allocation-mint-scope.md` and `docs/contracts/allocation-mint-operation-contract.md` before changing Allocation/Mint behavior.

Do this before:

- broad/batch Allocation/Mint execution;
- durable Evidence Vault;
- maturity closeout;
- investor update automation;
- external model reviewer integration.

Required reviewers:

- Quality Architect / Refactorer;
- Frontend/UX Reviewer;
- Test Engineer;
- Code Reviewer;
- State / Memory / Performance Lens.

Use Security Reviewer if any persistence, backend, upload, wallet, or LLM boundary changes.
