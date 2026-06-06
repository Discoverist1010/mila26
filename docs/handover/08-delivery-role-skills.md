# Delivery Role Skills - MILA26

## Status: ACTIVE
**Version:** 1.1.0
**Last updated:** 2026-06-06
**Applies to:** MILA26 delivery roles in `AGENTS.md`
**File path:** `docs/handover/08-delivery-role-skills.md`

---

## Purpose

This file gives the non-Code-Reviewer delivery roles practical operating skills. These are engineering-process roles, not MILA26 product bots.

Use this file when spawning or simulating a specialist role:

- Test Engineer
- Quality Architect / Refactorer
- Security Reviewer
- Solidity Reviewer
- Frontend/UX Reviewer
- Release Engineer

The Lead Implementer remains accountable for integration, debugging, final test interpretation, commit readiness, and push readiness.

---

## Universal Role Rules

Every specialist role must:

- stay within the assigned scope and files;
- report findings before summaries;
- identify the broken user/system flow, not only the symptom;
- recommend a focused fix and regression test;
- avoid rewriting unrelated code;
- avoid adding dependencies, tools, MCPs, scanners, or frameworks without explicit approval;
- preserve MILA26 non-negotiables: Sepolia/testnet only, user wallet signing, backend never holds private keys, no fake evidence, no per-tab state silos, and no legal/KYC/advice/audit claims.

When a role finds a repeated pattern, it should suggest an update to this file or the relevant specialist contract. The Lead Implementer decides whether to apply it.

---

## Drift Detection And Correction

Drift means the product, code, docs, tests, UI labels, contract artifacts, or roadmap no longer describe the same system. Every specialist role must check for drift inside its scope.

### Drift Owners

- **Quality Architect / Refactorer:** source-of-truth drift, duplicated domain rules, brittle read models, per-tab state silos, and incomplete data flow.
- **Code Reviewer:** guardrail drift, architecture drift, roadmap/scope drift, user-facing claim drift, and missed lesson patterns.
- **Test Engineer:** test drift where assertions no longer cover current behavior, risk, or regression classes.
- **Frontend/UX Reviewer:** UI flow drift, lifecycle tab drift, copy/status drift, and right-rail action drift.
- **Security Reviewer:** secret handling drift, wallet custody drift, chain/network drift, logging/evidence drift, and unsafe external-service assumptions.
- **Solidity Reviewer:** contract invariant drift, ABI/artifact drift, event/evidence drift, and deployment-script drift.
- **Release Engineer:** environment, build, release note, handover, and deployment-readiness drift.

### Must Check

- docs and prompts still match implemented behavior;
- lifecycle read models still feed every tab that needs the data;
- user-facing labels do not expose internal track names or overclaim capability;
- Product Vault, right rail, Engineering Bot, SCP, and tabs derive status from the same source where applicable;
- tests cover the current behavior rather than obsolete UI copy or implementation details;
- smart-contract specs, ABI/artifacts, parameter cards, and operation gates agree;
- environment docs and examples do not imply mainnet, production readiness, private-key custody, audit completion, KYC approval, or legal/investment advice.

### Correction Loop

When drift is found:

1. Identify the authoritative source: domain/read model, contract artifact, architecture doc, product prompt, or test.
2. Classify severity and blast radius.
3. Correct the source or the dependent surfaces. Do not update both blindly to hide the inconsistency.
4. Add or update the smallest regression check that would catch recurrence.
5. Re-run the relevant focused checks.
6. Record repeated patterns in `docs/handover/06-code-reviewer-lessons.md` or this file.

Reviewers detect drift and recommend corrections. The Lead Implementer owns the final correction, integration, debugging, and verification. A specialist agent must not self-approve its own correction.

---

## Test Engineer Skill

### Use When

- behavior changed;
- a bug was fixed;
- lifecycle state/read models changed;
- wallet/Sepolia flows changed;
- a reviewer finding needs regression coverage;
- the release gate needs focused or full validation.

### Must Check

- Happy path, failure path, and boundary path.
- Multi-item flows, not just the first item.
- Cross-tab state visibility when tabs are visual only.
- Direct-input bypass attempts for operation surfaces.
- Wrong-chain, rejected-wallet, duplicate-submit, and receipt-failure paths for wallet work.
- Negative guardrail assertions: no fake hash/address/status, no KYC/legal/advice/audit claims.

### Expected Output

- exact commands run;
- passed/failed result;
- failing test name and root cause if any;
- missing regression tests;
- smallest next test to add.

### Default Commands

- Focused domain/UI: `npm run test -- <test files>`
- Full app gate: `npm run check`
- UI smoke: `npm run test:e2e`
- Contracts: `npm run contracts:build` and `npm run test:contracts`

### Anti-Patterns To Flag

- tests that assert only copy while missing behavior;
- tests that mock domain logic instead of exercising it;
- tests that pass for the wrong reason;
- no regression test for a fixed Critical/High finding;
- skipping e2e after meaningful UI workflow changes.

---

## Quality Architect / Refactorer Skill

### Use When

- a module is accumulating mixed responsibilities;
- the same lifecycle/business rule appears in several places;
- state flows are brittle or one-shot;
- App-level logic grows enough to hide domain rules;
- a reviewer finds hidden coupling, stale counts, or source-of-truth drift.

### Must Check

- Which module owns the rule?
- Is the read model the single derivation point?
- Are UI tabs creating state silos?
- Are raw stored labels used where effective eligibility should be used?
- Are operation gates duplicated instead of derived?
- Can the second, third, and fiftieth item follow the same path as the first?

### Expected Output

- ownership map: domain, read model, UI, adapter, tests;
- smallest refactor that removes brittleness;
- files that should not be touched;
- regression tests needed to preserve behavior.

### Refactor Bias

- prefer pure domain/read-model helpers over UI-local business rules;
- prefer typed state/read models over ad hoc object literals;
- prefer guard clauses over deep ternaries;
- extract only when it removes real duplication or clarifies ownership.

### Anti-Patterns To Flag

- per-tab state silos;
- hardcoded feature readiness or stale status counts;
- broad context/global state added without a concrete current need;
- operation parameters reconstructed manually in UI;
- refactors that improve aesthetics while increasing indirection.

---

## Security Reviewer Skill

### Use When

- auth, persistence, secrets, wallet, LLM, API, user data, upload, evidence, or deployment behavior changes;
- a route accepts new input;
- transaction or wallet state is touched;
- generated artifacts can affect deployment or user-facing claims.

### Must Check

- backend-only secrets and LLM calls;
- no private keys in backend, frontend, env examples, fixtures, logs, or docs;
- browser wallet signs all transactions;
- account and chain rechecked before `eth_sendTransaction`;
- no mainnet RPC/chain references;
- request validation and safe errors for backend routes;
- no sensitive data in prompts, logs, evidence, or screenshots;
- OWASP-style web risks when auth/persistence/uploads appear.

### Expected Output

- findings with exploit or false-claim scenario;
- severity and affected boundary;
- required fix;
- required security regression test;
- whether new tooling is recommended and why.

### Anti-Patterns To Flag

- frontend direct OpenAI/LLM provider calls;
- `VITE_` secrets;
- localStorage for wallet/evidence secrets without approval;
- generic catch blocks hiding security failures;
- screenshots/logs containing wallet/private data beyond intended test fixtures.

---

## Solidity Reviewer Skill

### Use When

- Solidity source, ABI, bytecode, Hardhat config, deployment artifacts, contract tests, viem encoding/decoding, or smart-contract template parameters change.

### Must Check

- Solidity compiler version is pinned;
- artifacts come from compiled contracts, not manual bytecode/hash construction;
- OpenZeppelin use is explicit and justified;
- access control matches the product operation model;
- whitelist, subscription, redemption, NAV, maturity, and allocation logic use explicit invariants;
- events cover evidence needs;
- Sepolia/testnet boundaries remain intact;
- contract tests cover revert paths and edge cases.

### Expected Output

- contract invariants reviewed;
- unsafe pattern findings;
- missing tests;
- whether `npm run contracts:build` and `npm run test:contracts` are required or were run.

### Anti-Patterns To Flag

- mint/burn/pause/transfer controls unlocked before their product track;
- unrestricted admin functions;
- missing zero-address checks;
- ambiguous stablecoin decimal assumptions;
- redemption logic that pays before the configured delay;
- event omissions that make evidence incomplete;
- upgradeability added before explicit requirement.

---

## Frontend/UX Reviewer Skill

### Use When

- user-visible UI, lifecycle tabs, Engineering Bot area, right rail, SCP controls, responsive layout, or copy changes.

### Must Check

- Engineering Bot answer area remains readable and central;
- tabs orient the user but do not imply code segregation;
- right rail remains passive;
- next actions match current lifecycle gaps;
- user-facing copy avoids internal track labels;
- no KYC/legal/advice/audit/production claims;
- mobile and desktop layouts do not overlap or truncate critical controls;
- buttons expose real actions only when gates are satisfied.

### Expected Output

- UX findings ordered by user impact;
- screenshots or Playwright recommendation if visual risk is meaningful;
- specific copy/interaction fix;
- accessibility or responsive risks.

### Anti-Patterns To Flag

- cluttered workspace summaries that compete with AI answers;
- workflow buttons in passive status panels;
- disabled buttons without clear reason;
- visual tabs that hide cross-stage dependencies;
- generic dashboard cards that do not support the user's current job.

---

## Release Engineer Skill

### Use When

- before commit/push for meaningful tracks;
- deployment/hosting/env/build scripts change;
- release notes, GTM readiness, beta rounds, or production migration is discussed.

### Must Check

- working tree state and branch;
- validation commands and results;
- env/config changes documented;
- no generated build artifacts accidentally committed unless intended;
- reviewer gates completed;
- app is not claiming production/mainnet/audit readiness prematurely;
- rollback or recovery path for hosted changes when applicable.

### Expected Output

- exact commit/push readiness status;
- commands run and pass/fail;
- remaining uncommitted files;
- release risks and explicit non-goals;
- next release step.

### Anti-Patterns To Flag

- committing without reviewer gate after Level 1/2 changes;
- pushing with failing checks or unexplained skipped checks;
- hidden env dependency;
- release notes claiming more capability than tests prove;
- deployment path that cannot be rolled back.

---

## Role Activation Matrix

| Change Type | Required Roles |
|---|---|
| Pure docs, non-guardrail | Release Engineer light check |
| Guardrail, handover, architecture docs | Code Reviewer, Release Engineer |
| Domain/read-model state | Test Engineer, Quality Architect, Code Reviewer |
| UI lifecycle tabs or SCP controls | Frontend/UX Reviewer, Test Engineer, Code Reviewer |
| Wallet/provider/Sepolia transaction path | Security Reviewer, Test Engineer, Code Reviewer, Release Engineer |
| Solidity/contracts/artifacts | Solidity Reviewer, Security Reviewer, Test Engineer, Code Reviewer |
| Backend routes/API contracts | Security Reviewer, Test Engineer, Code Reviewer |
| Persistence/auth/uploads | Security Reviewer, Quality Architect, Test Engineer, Code Reviewer, Release Engineer |

One agent can play several roles in a small track, but the final answer must say which role checks were actually performed.

---

## Improvement Loop

After every meaningful specialist pass:

1. Record reusable lessons in this file if they apply to a non-Code-Reviewer role.
2. Record recurring code-review findings in `docs/handover/06-code-reviewer-lessons.md`.
3. Update activation rules only when the required review level changes.
4. Keep additions concrete; avoid generic "be careful" guidance.

## External Model Reviewer Reminder

Claude, or another independent external model reviewer, should be added only when the review surface is mature enough for useful second-opinion variance.

### Add After

- Subscription and Redemption parameter capture are implemented and tested;
- the smart-contract template handoff can consume lifecycle parameters;
- the first Solidity/security hardening pass has run;
- review output can be validated against a structured schema;
- cost controls, rate limits, and backend-only model access are designed.

### Trigger Earlier Only If

- Code Reviewer, Security Reviewer, or Solidity Reviewer finds repeated unresolved High/Critical classes;
- beta or investor-readiness review needs independent evidence before external demos;
- an eval set of known defects exists and can benchmark the external reviewer;
- a security-sensitive contract/deployment change needs extra independent scrutiny.

### Non-Negotiables

- Use a backend-only adapter. Never expose external model keys in the frontend.
- Keep prompts role-specific: security review, Solidity review, architecture drift review, or release readiness.
- Validate responses against a structured finding schema.
- Do not allow external reviewer output to commit, push, deploy, or auto-fix without Lead Implementer review.
- Treat the external reviewer as independent signal, not final authority.

## Version History

| Version | Date | Change | Author |
|---|---|---|---|
| 1.1.0 | 2026-06-06 | Added drift detection/correction ownership and external model reviewer reminder. | Codex |
| 1.0.0 | 2026-06-06 | Added specialist delivery-role skills for Test, Quality, Security, Solidity, Frontend/UX, and Release roles. | Codex |
