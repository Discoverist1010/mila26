# Code Reviewer Checklist — MILA26

## Status: ACTIVE
**Version:** 1.0.2
**Last updated:** 2026-05-31
**Applies to:** MILA26 repository
**File path:** `docs/contracts/code-reviewer-checklist.md`

---

## RELATED FILES (Code Reviewer Trio)

| File | Role |
|------|------|
| `docs/handover/05-code-reviewer-skill.md` | Reviewer identity, principles, report format |
| `docs/contracts/code-reviewer-checklist.md` | This file — executable phases |
| `docs/handover/06-code-reviewer-lessons.md` | Pattern memory (`MILA26-XXX`) and catch counts |

Also read before review: `docs/handover/00-mila26-current-checkpoint.md`, `docs/architecture/architecture-guardrails.md`, and track-specific contracts in `docs/contracts/`.

---

## PURPOSE

This checklist is executed by the Code Reviewer Skill (`docs/handover/05-code-reviewer-skill.md`) for every review. It defines the concrete checks that turn the review principles into verifiable pass/fail criteria.

This file is a **contract** — it specifies what code must satisfy. It lives in `docs/contracts/` alongside the project's other typed contracts because it is a quality contract that all MILA26 code must fulfill.

---

## HOW TO USE THIS CHECKLIST

The reviewer executes phases in order. Each phase contains specific checks. Every check must result in PASS, FAIL, or NOT APPLICABLE. A FAIL at **CRITICAL** severity blocks merge. A FAIL at **HIGH** severity requires documented acknowledgment or fix within the track unless the work order explicitly defers it.

**Before Phase 0:** Read `docs/handover/06-code-reviewer-lessons.md` and run detection for every pattern with **Catch count ≥ 2**, then all **CRITICAL**-severity patterns (`MILA26-001`, `002`, `006`, `007`, `011`, `014`, `021`). Reference pattern IDs in the review report.

**Phase execution rules:**
- **Full review (track/PR):** Phases 0–8, applicable Phase 9 sections, then Phase 10 report
- **Quick review (PR):** Phases 0–3, plus lessons pattern scan for all CRITICAL patterns on the diff
- **Architecture-only review:** Phase 3, applicable Phase 9 sections (e.g. 9.4 for Cockpit2), Phase 5–6 as needed for structure
- **Pre-milestone audit:** Phases 0–9 (all applicable), Phase 10 report, plus brittleness and rigidity heat maps (format in skill file)

---

## PHASE 0: SCOPE VERIFICATION (Always First — CRITICAL)

Scope violations are the primary failure mode of agentic coding. This phase runs before any other assessment because out-of-scope changes bypass all other review.

### 0.1 — Allowed Scope Adherence
- [ ] Read the track's "Allowed" section from the work order or track prompt
- [ ] List every file changed in the diff
- [ ] Verify each changed file is explicitly listed in "Allowed" OR is a necessary test file for an allowed change
- [ ] Flag any file NOT in allowed scope as **CRITICAL — Scope Violation** (lessons: `MILA26-021`)

### 0.2 — Prohibited Items Absence
- [ ] Read the track's "Must not add" section
- [ ] Search the diff for each prohibited item
- [ ] Flag any prohibited item found as **CRITICAL — Scope Violation** (lessons: `MILA26-021`)

### 0.3 — Dependency Check
- [ ] Check `package.json` or equivalent for new dependencies
- [ ] Verify each new dependency is explicitly approved in the track
- [ ] Flag any unapproved dependency as **CRITICAL — Unapproved Dependency** (lessons: `MILA26-021`)

### 0.4 — Scope Creep (Incidental Out-of-Scope Edits)
- [ ] Check if any existing files outside scope were modified (even small changes: import order, formatting-only drive-bys)
- [ ] Flag any incidental out-of-scope modification as **HIGH — Scope Creep** (lessons: `MILA26-003`)
- [ ] Do not downgrade Phase 0.1–0.3 violations to HIGH; those remain **CRITICAL** (lessons: `MILA26-021`)

---

## PHASE 1: GUARDRAIL AUDIT (CRITICAL)

Guardrails are the boundary between honest demo and false claim. A single guardrail violation is a CRITICAL issue.

### 1.1 — Unsafe Label Detection
Search the diff for ANY of these labels. Flag every premature or unqualified occurrence as **CRITICAL — Unsafe Label**:

- [ ] "Ready to deploy"
- [ ] "Ready to sign"
- [ ] "Deployed" (as a current state, not as a future reference)
- [ ] "Live"
- [ ] "Signed" (as a completed state)
- [ ] "Submitted" (as a final state without provider-returned transaction provenance)
- [ ] "Confirmed" (as a final state without receipt-confirmed provenance)
- [ ] "Verified"
- [ ] "Audited"
- [ ] "Production ready"
- [ ] "Mainnet ready"
- [ ] "Minted today"
- [ ] "Transfer status open"
- [ ] "txHash" used as a hardcoded value
- [ ] "deployedAddress" used as a hardcoded value
- [ ] "contractAddress" presented as real before deployment
- [ ] Any hardcoded `0x...` value (64 hex characters) presented as a real transaction hash or contract address

Source-sensitive exception: qualified labels such as "Deployment submitted to Sepolia", "Deployment confirmed on Sepolia", "Record NAV submitted to Sepolia", or "Record NAV confirmed on Sepolia" are acceptable only when backed by explicit provider/receipt provenance fields and tests. Do not flag those as unsafe solely because they contain "submitted" or "confirmed".

### 1.2 — Safe Label Presence
Verify these labels appear where applicable. Flag missing labels as **HIGH — Missing Safe Label**:

- [ ] "Deployment execution: Blocked" or "Not implemented" — in deployment status context
- [ ] "Backend never holds private keys" — in any security/boundary context
- [ ] "Mainnet disabled" — near any chain/network reference
- [ ] "No transaction hash" — before any deployment execution
- [ ] "No contract address" — before any deployment confirmation
- [ ] "Smart Contract Operations: Locked" — in SCP before operation tracks
- [ ] "Record NAV gated; other Smart Contract Operations locked" — after Track 15A confirmed deployment evidence
- [ ] "Other Smart Contract Operations: Locked" — after a single operation-specific SCP track unlocks
- [ ] "Audit not performed" — where audit status is shown
- [ ] "User wallet signing required later" — in signing context before implementation
- [ ] "Deployment status is held in this local session" — if deployment state is local-only

### 1.3 — Fake Data Detection
- [ ] Search for any `0x` followed by 64 hex characters
- [ ] Verify each occurrence is either: a known constant, a test fixture, or a provider-returned value
- [ ] Flag any hardcoded hash/address presented as real as **CRITICAL — Fake Blockchain Data**

### 1.4 — Evidence Boundary Honesty
- [ ] If deployment status is local-session-only, verify the UI/docs state this clearly
- [ ] If evidence is not persisted, verify no claim of persistent evidence exists
- [ ] Flag any misleading evidence claim as **HIGH — Evidence Boundary Violation**

---

## PHASE 2: BLOCKCHAIN SAFETY (CRITICAL)

Blockchain safety violations can result in lost funds, false claims, or security breaches. Every check in this phase is CRITICAL.

### 2.1 — No Fake Blockchain Artifacts
- [ ] No hardcoded contract address presented as real
- [ ] No hardcoded transaction hash presented as real
- [ ] No fake deployment status ("deployed" when no deployment occurred)
- [ ] Flag any violation as **CRITICAL — Fake Blockchain Artifact**

### 2.2 — Network Safety
- [ ] No mainnet chain ID (1) in any configuration
- [ ] No mainnet RPC URL
- [ ] No mainnet references in deployment scripts or config
- [ ] Sepolia-only for any testnet reference (chain ID 11155111 or `0xaa36a7`)
- [ ] Flag any mainnet presence as **CRITICAL — Mainnet Reference**

### 2.3 — Key Custody
- [ ] Backend never holds private keys
- [ ] No server-side deployer account
- [ ] No backend wallet/signing route
- [ ] No `.env` file committed with private keys
- [ ] Flag any key custody issue as **CRITICAL — Key Custody Violation**

### 2.4 — Transaction Safety
- [ ] Wallet signing only through browser provider (EIP-1193)
- [ ] Account re-checked immediately before any `eth_sendTransaction` — flag as **CRITICAL** (lessons: `MILA26-011`)
- [ ] Chain re-checked immediately before any `eth_sendTransaction` — flag as **CRITICAL** (lessons: `MILA26-011`)
- [ ] No `personal_sign`, `eth_sign`, or `eth_signTypedData` without explicit track approval — flag as **CRITICAL**
- [ ] Duplicate transaction submission prevented (`awaiting_wallet_confirmation` or `submitted` guard before send) — flag as **HIGH** (lessons: `MILA26-013`)
- [ ] Receipt polling has maximum attempts or timeout — flag as **HIGH** (lessons: `MILA26-012`)
- [ ] Receipt polling is cancellable (stops on unmount or new attempt) — flag as **HIGH** (lessons: `MILA26-012`)

### 2.5 — Bytecode and Artifact Integrity
- [ ] Bytecode derived from compiled Solidity contract (not manually invented)
- [ ] ABI derived from compiled Solidity contract
- [ ] Deployment artifact has documented refresh process
- [ ] No manual hash or bytecode construction
- [ ] Flag any violation as **CRITICAL — Artifact Integrity Violation**

---

## PHASE 3: ARCHITECTURE BOUNDARY CHECK (CRITICAL for violations, HIGH for concerns)

MILA26's architecture uses typed artifacts, thin derived read models, and explicit boundaries. Boundary violations erode the project's structural integrity.

### 3.1 — Critical Architecture Violations
- [ ] No new global state library (Redux, Zustand, Jotai, etc.) without explicit track approval
- [ ] No monolithic `ProjectLifecycleContext` or similar large context object
- [ ] No bypass of Engineering Bot as the single workflow decision orchestrator
- [ ] No frontend LLM calls (OpenAI, etc.)
- [ ] No `VITE_*LLM*` or similar frontend LLM environment variables
- [ ] Flag any violation as **CRITICAL — Architecture Violation**

### 3.2 — UI Architecture
- [ ] Right rail contains NO workflow/action buttons (must be passive status only)
- [ ] SCP contains NO active operations before the corresponding operation track
- [ ] Engineering Bot is the single visible workflow decision surface
- [ ] Lifecycle and pre-operation workflow actions appear ONLY in the central Engineering Bot area
- [ ] Operation-specific SCP actions appear ONLY after their approved operation track and required gates exist
- [ ] SCP must not expose broad operation suites when only one operation-specific track is approved
- [ ] Flag any violation as **HIGH — UI Architecture Violation**

### 3.3 — Layer Isolation
- [ ] Domain logic is NOT in UI components
- [ ] Connector logic is NOT in domain modules
- [ ] No cross-boundary imports that violate architecture layers
- [ ] Backend-only LLM calls (verify no frontend fetch to LLM endpoints)
- [ ] Flag any violation as **HIGH — Layer Isolation Violation**

### 3.4 — Pattern Consistency
- [ ] New domain concepts use typed artifacts (not ad-hoc objects)
- [ ] Read models are pure derivations (not stateful)
- [ ] No introduction of alternative patterns that conflict with existing architecture
- [ ] Flag any violation as **MEDIUM — Pattern Inconsistency**

---

## PHASE 4: NAMING DISCIPLINE (MEDIUM for individuals, HIGH for patterns)

Names are the UI of code. Poor naming causes confusion and bugs over time.

### 4.1 — Generic Name Detection
Search for these variable names in any scope wider than a 3-line lambda. Flag each as **MEDIUM — Generic Name**:

- [ ] `data` — what data? What does it represent?
- [ ] `result` — result of what operation?
- [ ] `item` — what kind of item?
- [ ] `temp` — temporary what? Why is it temporary?
- [ ] `val` — value of what?
- [ ] `obj` — what object?
- [ ] `arr` — array of what?
- [ ] `ret` — return value of what?
- [ ] `res` — response? result? resource?
- [ ] `tmp` — same as temp

### 4.2 — Domain Name Consistency
- [ ] Names match MILA26 domain language:
  - "Requirement Brief" — not RequirementDoc, RequirementSpec
  - "Engineering Brief" — not EngineeringDoc, EngineeringSpec
  - "Deployment Gate" — not DeployCheck, DeployGate
  - "Wallet Signing Intent" — not WalletSignReady, SigningCheck
  - "Smart Contract Control Panel" / "SCP" — consistent abbreviation
  - "Engineering Bot" — not EngineerBot, EngBot
  - "Cockpit2" — consistent capitalization
- [ ] No synonyms for the same concept across files
- [ ] Flag inconsistency as **MEDIUM — Domain Name Inconsistency**

### 4.3 — Boolean Naming
- [ ] Boolean names read as questions: `isOverdue`, `hasApproval`, `canDeploy`
- [ ] Not: `overdue`, `approval`, `deployReady` (ambiguous)
- [ ] Not negative unless unavoidable: prefer `isReady` over `isNotReady`
- [ ] Flag violations as **LOW — Boolean Naming**

### 4.4 — Function Naming
- [ ] Functions are verb + domain noun: `parseReminderRequest()`, `buildUnsignedDeploymentIntent()`
- [ ] Not generic verbs: `process()`, `handle()`, `doAction()`
- [ ] Not misleading: a `validate()` that mutates state, a `getUser()` that makes network calls
- [ ] Flag violations as **MEDIUM — Function Naming**

### 4.5 — Collection Naming
- [ ] Collections are plural: `reminders`, `events`, `artifacts`
- [ ] Not: `reminderList` (redundant), `reminder` (misleading — is it one or many?)
- [ ] Flag violations as **LOW — Collection Naming**

### 4.6 — Abbreviation Discipline
- [ ] Abbreviations expanded unless universal domain terms
- [ ] Good: `configuration`, not `cfg`; `transaction`, not `txn` (outside blockchain context)
- [ ] Acceptable: `API`, `SCP`, `EIP`, `ABI`, `LLM` (universal in context)
- [ ] Flag over-abbreviation as **LOW — Abbreviation**

---

## PHASE 5: CODE STRUCTURE — BRITTLENESS (HIGH)

Brittle code breaks when something unrelated changes. Find the fractures waiting to happen.

### 5.1 — Implicit Ordering Dependencies
- [ ] Does Module A assume Module B has already run?
- [ ] Is this dependency enforced or just "known" by developers?
- [ ] Flag as **HIGH — Implicit Ordering Dependency**

### 5.2 — Assumed Data Shapes
- [ ] Is there destructuring or property access that assumes a specific response shape without validation?
- [ ] Are there optional chaining chains (`a?.b?.c?.d`) that suggest uncertainty about the shape?
- [ ] Flag as **HIGH — Unvalidated Data Shape Assumption**

### 5.3 — Magic String Coupling
- [ ] Are there strings that must match across files with no shared constant?
- [ ] Example: `'reminder_created'` used as event name in three files, each hardcoded
- [ ] Flag as **MEDIUM — Magic String Coupling**

### 5.4 — Index-Based Access
- [ ] `items[0]`, `response[3]` — what if the array order changes or is empty?
- [ ] Flag as **MEDIUM — Unsafe Index Access**

### 5.5 — Silent Error Swallowing
- [ ] Try-catch blocks that log and continue without the caller knowing something failed
- [ ] Empty catch blocks `catch(e) {}`
- [ ] Catch blocks that only `console.error` without re-throwing or returning error state
- [ ] Flag as **HIGH — Silent Error Swallow**

### 5.6 — Half-Implemented States
- [ ] Objects that can exist in states not handled by any conditional branch
- [ ] Enum with 5 values but only 3 handled in a switch statement
- [ ] Boolean combinations that create impossible states (2 booleans = 4 states, only 3 valid)
- [ ] Flag as **HIGH — Unhandled State**

### 5.7 — Timing Assumptions
- [ ] Code that assumes a network call will complete within an unstated timeframe
- [ ] No timeout on async operations
- [ ] `setTimeout` used as a "wait for it" hack instead of proper async coordination
- [ ] Flag as **MEDIUM — Timing Assumption**

### 5.8 — Regex Without Tests
- [ ] Regular expressions used for parsing/validation without documented examples
- [ ] No test cases showing what the regex matches and doesn't match
- [ ] Flag as **MEDIUM — Untested Regex**

---

## PHASE 6: CODE STRUCTURE — RIGIDITY (MEDIUM)

Rigid code resists change. Adding features or modifying behavior requires touching too many places.

### 6.1 — Premature Abstraction
- [ ] Interface, abstract class, or factory with only ONE implementation
- [ ] "Just in case" abstraction before a second use case exists
- [ ] Flag as **MEDIUM — Premature Abstraction**

### 6.2 — Boolean Trap Parameters
- [ ] Functions with boolean parameters that change behavior: `createReminder(request, true)`
- [ ] What does `true` mean? Use options object or named enum instead
- [ ] Flag as **MEDIUM — Boolean Trap**

### 6.3 — Copy-Paste Variation
- [ ] Same logic appearing in 3+ places with slight differences
- [ ] Should it be one parameterized function?
- [ ] Flag as **MEDIUM — Duplicated Logic**

### 6.4 — God Objects
- [ ] Modules/classes with more than 10 public methods
- [ ] Modules that know about multiple unrelated domains
- [ ] Flag as **MEDIUM — God Object**

### 6.5 — Scattered Concerns
- [ ] Same concept (like "approval" or "validation") implemented partially in 4+ different modules
- [ ] No single owner for the concern
- [ ] Flag as **MEDIUM — Scattered Concern**

### 6.6 — Deep Nesting
- [ ] More than 3 levels of indentation in a single function
- [ ] Happy path buried under error handling
- [ ] Flag as **MEDIUM — Deep Nesting**

### 6.7 — Unnecessary Indirection
- [ ] Function that exists only to call another function with slightly different argument order
- [ ] "Pass-through" modules that add no logic but create another import
- [ ] Flag as **LOW — Unnecessary Indirection**

---

## PHASE 7: TEST QUALITY (HIGH)

Tests are part of the track contract. Missing or poor tests are incomplete implementation.

### 7.1 — Test Coverage
- [ ] Tests exist for ALL acceptance criteria in the track
- [ ] Tests cover failure paths, not just happy paths
- [ ] Edge cases tested: empty, null, undefined, boundary values, maximum/minimum
- [ ] For blockchain tracks: wrong-chain, rejected-signature, failed-transaction scenarios
- [ ] Flag missing coverage as **HIGH — Incomplete Test Coverage**

### 7.2 — Test Quality
- [ ] Tests verify BEHAVIOR, not implementation details
- [ ] Tests have descriptive names that explain what they verify
- [ ] No tests with misleading names
- [ ] No tests that pass accidentally (false positives)
- [ ] Tests are independent (don't depend on execution order)
- [ ] Flag quality issues as **MEDIUM — Test Quality**

### 7.3 — Regression Tests
- [ ] Are there tests for previously fixed bugs documented in the decision log?
- [ ] Do regression tests verify the exact bug scenario doesn't recur?
- [ ] Flag missing regression tests as **HIGH — Missing Regression Test**

### 7.4 — Mock Usage
- [ ] External dependencies are mocked (API calls, blockchain providers, LLM calls)
- [ ] Domain objects are NOT mocked (test the real domain logic)
- [ ] Mock behavior matches documented contract
- [ ] Flag mock issues as **MEDIUM — Mock Misuse**

### 7.5 — Guardrail Assertions in Tests
- [ ] Tests assert that unsafe labels do NOT appear
- [ ] Tests assert that required safe labels DO appear where applicable
- [ ] Tests assert no fake hash/address in output
- [ ] Flag missing guardrail assertions as **HIGH — Missing Guardrail Test**

---

## PHASE 8: DOCUMENTATION AND HANDOVER (MEDIUM)

Documentation that's missing or misleading creates friction for the next developer (human or AI).

### 8.1 — Handover Files
- [ ] `docs/handover/00-mila26-current-checkpoint.md` updated with track completion status
- [ ] Decision log updated if architectural decisions were made
- [ ] Next prompts updated if this track enables the next track
- [ ] Flag missing updates as **MEDIUM — Handover Not Updated**

### 8.2 — Contract Documentation
- [ ] New typed contracts documented in `docs/contracts/`
- [ ] `docs/contracts/README.md` updated with new contract listing
- [ ] Flag missing docs as **MEDIUM — Contract Not Documented**

### 8.3 — README Updates
- [ ] README updated if public API, setup steps, or available scripts changed
- [ ] Flag as **LOW — README Not Updated**

### 8.4 — Comment Quality
- [ ] Comments explain WHY, not WHAT (code should explain itself)
- [ ] No commented-out code blocks (git remembers — delete them)
- [ ] No TODO comments without ticket reference or owner
- [ ] No stale comments that contradict the code
- [ ] Flag issues as **LOW — Comment Quality**

### 8.5 — Complex Logic Documentation
- [ ] Complex regular expressions documented with examples
- [ ] Non-obvious algorithms explained
- [ ] Workarounds documented with reason and conditions for removal
- [ ] Flag missing docs as **MEDIUM — Complex Logic Undocumented**

### 8.6 — Environment Variable Documentation
- [ ] For each new `process.env` / `import.meta.env` access in the diff, verify a matching entry exists in `.env.example` with purpose comment
- [ ] Flag missing entries as **LOW — Missing .env.example Entry** (lessons: `MILA26-020`)

---

## PHASE 9: MILA26-SPECIFIC CHECKS

These checks apply based on the type of code being reviewed. Execute the relevant section.

### 9.1 — Smart Contract / Blockchain Tracks (if applicable)
- [ ] No OpenZeppelin imports without explicit track approval
- [ ] No Hardhat/Foundry config changes without explicit track approval
- [ ] Compiled artifacts handled deterministically
- [ ] Deployment artifact has documented refresh process (`npm run contracts:build`)
- [ ] No manual bytecode or hash construction
- [ ] Solidity version pinned, not floating (`^0.8.x` not `>=0.8.x`)
- [ ] Flag violations per severity in the check

### 9.2 — Wallet Tracks (if applicable)
- [ ] EIP-1193 used for provider interaction (not viem/ethers unless approved)
- [ ] No `personal_sign` or `eth_signTypedData` without explicit track approval
- [ ] Account re-checked before transaction
- [ ] Chain re-checked before transaction
- [ ] Duplicate transaction submission prevented
- [ ] Receipt polling bounded and cancellable
- [ ] No wallet state in localStorage unless explicitly approved
- [ ] Flag violations per severity in the check

### 9.3 — LLM Tracks (if applicable)
- [ ] LLM calls are backend-only
- [ ] No frontend OpenAI/fetch-to-LLM calls
- [ ] No `VITE_*LLM*` environment variables
- [ ] Raw LLM output validated before becoming API response
- [ ] Schema validation on LLM output
- [ ] Deterministic fallback on LLM failure
- [ ] No secrets in LLM prompt logs
- [ ] Flag violations per severity in the check

### 9.4 — UI / Cockpit2 Tracks (if applicable)
- [ ] Engineering Bot is the single workflow decision surface
- [ ] Right rail contains no action buttons
- [ ] SCP shows only status/evidence/boundary (pre-deployment) or approved operations (post-deployment)
- [ ] New UI actions use typed `CockpitAction` pattern
- [ ] No workflow buttons in right rail or SCP
- [ ] Flag violations per severity in the check

---

## PHASE 10: COMPLETION REPORT

After executing all applicable phases, compile the structured review report using the format defined in `docs/handover/05-code-reviewer-skill.md` (Review Output Format section).

The report must include:
- Executive Summary with decision
- All issues found, organized by severity, with **Pattern ID** when a lessons pattern applies
- **Patterns triggered** list (`MILA26-XXX` or "none")
- Scope compliance table
- Guardrail audit table
- Naming review table
- Architecture boundary check table
- Flow and structure assessment
- Test adequacy table
- Lessons for reviewer (new patterns to add to `06-code-reviewer-lessons.md`)
- Recommended actions (before merge, this track, future)
- **Pre-milestone audits only:** Brittleness heat map and Rigidity heat map (see skill file)

---

## QUICK REFERENCE: SEVERITY MAPPING

| Phase | Critical Checks | High Checks | Medium Checks | Low Checks |
|-------|----------------|-------------|---------------|------------|
| 0 — Scope | All checks | Scope creep | — | — |
| 1 — Guardrails | Unsafe labels, fake data | Missing safe labels, evidence boundary | — | — |
| 2 — Blockchain Safety | All checks | — | — | — |
| 3 — Architecture | Critical violations | UI architecture, layer isolation | Pattern inconsistency | — |
| 4 — Naming | — | — | Generic names, domain inconsistency, function naming | Boolean, collection, abbreviation |
| 5 — Brittleness | — | Ordering, data shape, error swallow, unhandled state | Magic strings, index access, timing, regex | — |
| 6 — Rigidity | — | — | Abstraction, boolean trap, duplication, god object, scattered, nesting | Indirection |
| 7 — Tests | — | Coverage, regression, guardrail assertions | Test quality, mock usage | — |
| 8 — Documentation | — | — | Handover, contracts, complex logic | README, comments, `.env.example` |
| 9 — MILA26-Specific | Per-check | Per-check | Per-check | Per-check |
| 10 — Report | — | — | — | — |

**Phase 2.4 severity note:** Account/chain re-check and unapproved signing methods are CRITICAL; duplicate-submit and receipt-polling bounds are HIGH (aligned with `05-code-reviewer-skill.md` Principle 3 and `06-code-reviewer-lessons.md`).

---

## PATTERN ID QUICK MAP (Lessons ↔ Phases)

| Pattern ID | Phase(s) | Topic |
|------------|----------|-------|
| MILA26-001, 002 | 1 | Fake hash/address, unsafe labels |
| MILA26-003 | 0.4 | Scope creep (HIGH) |
| MILA26-021 | 0.1–0.3 | Scope violation (CRITICAL) |
| MILA26-004 | 4 | Generic naming |
| MILA26-005, 006, 008, 015 | 3, 9.4 | Cockpit2 / SCP / context / domain in UI |
| MILA26-007 | 3, 9.3 | Frontend LLM / secrets |
| MILA26-009 | 6 | Premature abstraction |
| MILA26-010, 019 | 5 | Silent swallow, stale closure |
| MILA26-011–014 | 2, 9.1–9.2 | Blockchain safety |
| MILA26-016 | 5–6, 9.x config | Hardcoded config |
| MILA26-017 | 7 | Test behavior vs implementation |
| MILA26-018 | 1.2 | Missing safe labels |
| MILA26-020 | 8.6 | `.env.example` |

---

## VERSION HISTORY

| Version | Date | Change | Author |
|---------|------|--------|--------|
| 1.0.2 | 2026-05-31 | Aligned Phase 1/3 with Track 15A source-sensitive submitted/confirmed labels and SCP operation-specific controls | AI Bot Factory |
| 1.0.1 | 2026-05-31 | Aligned trio: lessons pre-scan, phase 0–10, split 2.4 severities, pattern map, 8.6 | AI Bot Factory |
| 1.0.0 | 2026-05-31 | Initial Code Reviewer Checklist for MILA26 | AI Bot Factory |
