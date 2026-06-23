# Delivery Role Skills - MILA26

## Status: ACTIVE
**Version:** 1.5.0
**Last updated:** 2026-06-23
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
- State / Memory / Performance review lens, when triggered by the changed surface

The Lead Implementer remains accountable for integration, debugging, final test interpretation, commit readiness, and push readiness.

---

## Universal Role Rules

Every specialist role must:

- stay within the assigned scope and files;
- report findings before summaries;
- identify the broken user/system flow, not only the symptom;
- avoid tunnel vision: after checking the specialist concern, scan adjacent impacts on state, UX, security, tests, performance, and release readiness;
- recommend a focused fix and regression test;
- avoid rewriting unrelated code;
- avoid adding dependencies, tools, MCPs, scanners, or frameworks without explicit approval;
- use Context7 before code changes that depend on library APIs, framework behavior, SDK syntax, MCP integrations, OpenAI APIs, React, Vite, TypeScript, Fastify, Solidity tooling, or any other external dependency, preferring version-specific documentation where available;
- preserve MILA26 non-negotiables: Sepolia/testnet only, user wallet signing, backend never holds private keys, no fake evidence, no per-tab state silos, and no legal/KYC/advice/audit claims.

When a role finds a repeated pattern, it should suggest an update to this file or the relevant specialist contract. The Lead Implementer decides whether to apply it.

---

## Failure-Scenario Walkthrough

Before approving a readiness model, generated artifact, LLM-assisted flow, cache, idempotency guard, or user-confirmation workflow, each relevant role must walk the proposed design through concrete failure scenarios, not only the happy path.

### Required Review Questions

- What new failure can this safety mechanism introduce?
- Which code path consumes each new flag, status, marker, or policy?
- Can the behavior be expressed as predicates over real state, rather than vague terms such as "casual overwrite" or "clear correction"?
- Does the fallback path meet the same minimum user-facing acceptance bar, or is it a degraded placeholder?
- Does the generated output make only facts grounded in the canonical record?
- Can rapid retries, double-clicks, refreshes, or concurrent user turns create duplicates, stale writes, or lost corrections?
- Is the ready state a milestone that supports explicit user edits, or has it become an accidental lock?
- Does Advisor-style guidance describe status without restarting intake or re-asking for already captured/deferred fields?

### Common Counterexamples To Walk

- Critical Product Setup fields are deferred: the system must not claim clean PRD readiness without a visible critical-deferral warning or user acknowledgement.
- PRD generation route is clicked twice: repeated requests must not create duplicate artifacts or trigger duplicate LLM calls when an idempotent result is available.
- LLM prose invents a plausible investor eligibility, protocol, jurisdiction, wallet, or compliance fact: validation must detect the ungrounded claim or fall back to deterministic prose.
- Deterministic PRD fallback runs without an LLM: it must still read like a structured PRD, not a raw field dump.
- User says "I need to edit this" after PRD-ready state: Product Setup must reopen through an explicit intake transaction rather than blocking the correction.
- Advisor response after PRD-ready state: it may explain status, but must not ask for already captured or explicitly deferred fields unless the user asks to edit.

---

## Drift Detection And Correction

Drift means the product, code, docs, tests, UI labels, contract artifacts, or roadmap no longer describe the same system. Every specialist role must check for drift inside its scope.

### Drift Owners

- **Quality Architect / Refactorer:** source-of-truth drift, duplicated domain rules, brittle read models, per-tab state silos, incomplete data flow, and state/cache/memory drift.
- **Code Reviewer:** guardrail drift, architecture drift, roadmap/scope drift, user-facing claim drift, and missed lesson patterns.
- **Test Engineer:** test drift where assertions no longer cover current behavior, risk, or regression classes.
- **Frontend/UX Reviewer:** UI flow drift, lifecycle tab drift, copy/status drift, and right-rail action drift, distinguishing allowed captured-fact review from prohibited wallet/contract operation controls.
- **Security Reviewer:** secret handling drift, wallet custody drift, chain/network drift, logging/evidence drift, and unsafe external-service assumptions.
- **Solidity Reviewer:** contract invariant drift, ABI/artifact drift, event/evidence drift, and deployment-script drift.
- **Release Engineer:** environment, build, release note, handover, and deployment-readiness drift.

### Must Check

- docs and prompts still match implemented behavior;
- lifecycle read models still feed every tab that needs the data;
- user-facing labels do not expose internal track names or overclaim capability;
- Product Vault, ZiLi-OS right console, center artifacts, Contract Ops, and tabs derive status from the same source where applicable;
- cached, persisted, or remembered values do not override fresher lifecycle, wallet, NAV, subscription, redemption, or evidence state;
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
- Product Setup -> Contract Ops handoff scenarios cover novice, informed, intermediate, advanced, and expert tokenised-product paths when those surfaces change.
- Contract Ops specialist-skill routing has deterministic fixtures for protocol advice, contract-spec compilation, Solidity review, test planning, deployment readiness, evidence planning, and QA review.
- Skill/eval tests verify user-selected protocol respect, ERC tradeoff explanation, deploy blocker classification, and no full EthSkills source-doc injection into runtime prompts.
- Product Setup PRD readiness tests cover missing, deferred, critical-deferred, and ready-for-review states.
- PRD generation tests cover deterministic fallback quality, duplicate-click/idempotency behavior, generated artifact versioning, and no ungrounded LLM facts.
- Chat milestone tests verify ZiLiOS stops asking Product Setup questions when essentials are captured or explicitly deferred, but accepts explicit edit/reopen requests.
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
- Are Contract Ops skill cards, runtime catalog entries, prompt fragments, and tests deriving from one explicit catalog rather than copied prompt text?
- Does Product Setup remain the typed PRD source for Contract Ops, with raw chat used only as proposed updates before confirmation?
- Does Product Setup PRD readiness distinguish captured, missing, non-critical deferred, and critical deferred fields?
- Does every new readiness/status/uncertainty/idempotency marker have a concrete consumer and regression test?
- Are state transitions defined as predicates over real state, not reviewer-only wording such as "casual" or "clear"?
- Are protocol selection, deployment readiness, evidence, and lifecycle-handoff rules duplicated across UI, backend prompts, and tests?
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

## State / Memory / Performance Review Lens

This is a triggered lens, not a separate always-on reviewer. Apply it inside Quality Architect, Code Reviewer, Test Engineer, Security Reviewer, or Release Engineer work when the changed surface touches state, cache, memory, persistence, async orchestration, LLM calls, expensive validation, evidence exports, or perceived speed.

### Use When

- shared lifecycle state, read models, Product Vault status, lifecycle snapshot, SCP gates, or Engineering Bot context changes;
- local React state, local-session evidence, browser storage, SQLite/project memory, run memory, chat memory, or evidence persistence changes;
- caching or memoization is added, removed, or used for generated artifacts, validation results, LLM responses, evidence exports, NAV/valuation data, wallet status, or contract parameters;
- a flow may become slow because of LLM calls, blockchain calls, contract compilation/tests, file parsing, audits, evidence export, or multi-agent orchestration;
- UI responsiveness, loading states, retry behavior, or progress reporting changes.

### Must Check

- one source of truth owns each lifecycle value; tabs must not cache independent copies of cross-stage data;
- cache keys are deterministic and include every input that affects the output;
- invalidation is explicit for investor registry, subscription, redemption, NAV/valuation, wallet/chain, deployment, operation evidence, and smart-contract parameters;
- stale data cannot be displayed as current or used to generate contract artifacts, execute wallet operations, or produce evidence;
- sensitive values are not cached without an explicit retention boundary;
- raw model output, unsafe artifacts, wallet signatures, private keys, and unreviewed blocked outputs are never cached as approved state;
- memory improves continuity without hiding user approval, provenance, or evidence traceability;
- slow paths show responsive progress and do not block local validation or basic navigation;
- repeated LLM, compile, test, or evidence work is avoided when deterministic cached outputs are safe and keyed correctly.
- generated PRD, evidence, or LLM-assisted artifacts use cache/idempotency keys that include the canonical record revision, generator version, mode, and output format;
- stale generated artifacts are not presented as current after Product Setup fields change.

### Expected Output

- source-of-truth map for touched state;
- cache/memory/persistence boundary summary;
- stale-data and invalidation risks;
- latency risks and whether async progress, retry, cancellation, or deterministic fast paths are needed;
- regression tests for cache invalidation, stale state, and slow/error paths.

### Anti-Patterns To Flag

- UI reads a stale cached value while the shared lifecycle state has changed;
- cache keys omit investor list, stablecoin, delay, payment-per-token, wallet chain/account, contract address, artifact version, or safety status;
- memoized/read-model output is reused after direct user edits;
- raw LLM output or generated artifacts are treated as approved from cache;
- NAV, valuation, wallet, deployment, redemption, or evidence status appears current without freshness/provenance;
- expensive async work freezes the Engineering Bot or tab navigation;
- persistence is added before retention, deletion, privacy, and evidence traceability are clear.

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
- specialised Contract Ops skills treat user chat, uploaded docs, and generated code as untrusted input;
- LLM-generated PRDs, summaries, and recommendations are treated as untrusted drafts until grounded against the canonical record;
- generated prose cannot add investor eligibility, jurisdiction, protocol, compliance, wallet, or deployment claims not present in confirmed Product Setup state;
- prompt-injection cannot override Sepolia-only, wallet-signed, no-private-key, no-fake-evidence, or no-production-claim rules;
- skill traces include IDs, versions, source hashes, schema results, and safety outcomes without logging raw prompts by default;
- private keys, seed phrases, RPC keys, API keys, raw signatures, and long secret-like hex strings are redacted from prompts, traces, logs, evidence, and screenshots;
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
- Contract Ops protocol advice distinguishes selected protocol, recommended architecture target, current executable prototype, and unsupported/future requirements;
- generated Solidity is produced only from confirmed contract specs and remains draft until review, tests, and user confirmation pass;
- ERC-20, Customised ERC-20, ERC-3643, ERC-4626, ERC-1400-style, and planned ERC-7683 are reviewed for deployability honestly against the current template/adapters;
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
- any change affects how a user moves through requirements, investor registry, subscription, smart contract, asset servicing, redemption, maturity, or evidence.

### Must Check

- Engineering Bot answer area remains readable and central;
- tabs orient the user but do not imply code segregation;
- the user can understand the current stage, what has already been captured, what is missing, and what happens next;
- PRD-ready status is presented as a milestone for review/finalisation, not as a permanent lock against explicit edits;
- critical deferred fields are visibly distinct from non-critical deferred fields and cannot be mistaken for clean readiness;
- ZiLiOS responses are tab-aware and must not tell the user to open the tab they are already using;
- Advisor-style responses may explain status and next actions, but must not restart intake or ask for fields that are already captured or explicitly deferred unless the user asks to edit;
- specialist capability labels stay subtle and product-facing; do not force the user to manage internal agents or delivery roles;
- review queues stay bounded and do not squeeze or hide the persistent chat composer;
- Product Setup remains PRD intake, and Contract Ops remains contract specification/readiness/deployment; operational execution details do not leak into the wrong tab;
- lifecycle flow feels continuous from the user's perspective even when implementation spans multiple modules;
- suggested next actions match the user's stated intent and the actual capability gaps;
- right rail does not contain wallet signing, deployment, mint, whitelist, NAV, redemption execution, or other contract-operation controls;
- next actions match current lifecycle gaps;
- user-facing copy avoids internal track labels;
- no KYC/legal/advice/audit/production claims;
- mobile and desktop layouts do not overlap or truncate critical controls;
- buttons expose real actions only when gates are satisfied.

### Expected Output

- UX findings ordered by user impact;
- user-journey findings for friendliness, continuity, consistency, and recoverability;
- screenshots or Playwright recommendation if visual risk is meaningful;
- specific copy/interaction fix;
- accessibility or responsive risks.

### Anti-Patterns To Flag

- cluttered workspace summaries that compete with AI answers;
- wallet/contract operation buttons in the ZiLi-OS right console or passive status panels;
- disabled buttons without clear reason;
- visual tabs that hide cross-stage dependencies;
- technically correct screens that leave a non-technical asset manager unsure what to do next;
- locked, draft, available, or completed states that do not explain their user meaning;
- repeated or conflicting next actions across the Engineering Bot, tab content, lifecycle snapshot, Product Vault, or SCP;
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
- Contract Ops skill catalog versions, source hashes, and focused evals/tests are updated when skill behavior changes;
- runtime prompts still use distilled MILA26 skill cards, not full EthSkills snapshots;
- generated PRD/artifact routes have idempotency or de-duplication keyed to canonical record revision and generator version;
- PRD and evidence artifact version labels clearly distinguish current, stale, draft, and finalised outputs;
- no generated skill, eval, trace, build, screenshot, or local evidence artifact is committed unintentionally;
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
| 1.5.1 | 2026-06-24 | Added Context7 documentation rule for external library/API/framework work across delivery roles. | Codex |
| 1.5.0 | 2026-06-23 | Added failure-scenario walkthrough and Product Setup PRD/LLM artifact hardening review checks. | Codex |
| 1.4.0 | 2026-06-20 | Added Contract Ops specialist-skill review checks for Test, Quality, Security, Solidity, Frontend/UX, and Release roles. | Codex |
| 1.3.1 | 2026-06-06 | Added universal anti-tunnel-vision review rule. | Codex |
| 1.3.0 | 2026-06-06 | Added State / Memory / Performance as a triggered review lens. | Codex |
| 1.2.0 | 2026-06-06 | Added explicit user-perspective lifecycle UX review checks. | Codex |
| 1.1.0 | 2026-06-06 | Added drift detection/correction ownership and external model reviewer reminder. | Codex |
| 1.0.0 | 2026-06-06 | Added specialist delivery-role skills for Test, Quality, Security, Solidity, Frontend/UX, and Release roles. | Codex |
