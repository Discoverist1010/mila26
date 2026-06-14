# MILA26 Codex Working Rules

Apply these rules to every Codex task in this repo.

## Preflight

- Run a preflight scan first: current path, `git status --short --branch`, and relevant file tree/docs.
- Read the relevant docs/files before editing.
- Report conflicts, stale docs, or scope mismatches before making changes.

## Editing Rules

- Preserve current behavior unless the task explicitly says otherwise.
- Do not perform broad refactors.
- Do not add new dependencies unless the task requires them and the justification is documented.
- Keep changes small, track-scoped, and aligned with existing patterns.
- Do not implement future tracks while working on the current one.

## Contract Rules

- If request/response contracts change, update docs, fixtures, schemas/types, runtime producers/consumers, and tests together.
- Product routes should follow the documented API response/error conventions.
- Keep LLM provider secrets backend-only.
- Keep wallet signing user-owned; never introduce backend private keys.

## Verification

- Run `npm run check` before finishing unless blocked.
- If UI behavior changes materially, consider a focused UI or Playwright smoke test if available and in scope.

## Delivery Role Skills

Use `docs/handover/08-delivery-role-skills.md` when a task benefits from specialist checks:

- Test Engineer for focused, regression, e2e, and contract validation.
- Quality Architect / Refactorer for brittleness, duplicated state, source-of-truth drift, and module-boundary concerns.
- Security Reviewer for auth, secrets, wallet, LLM, API, evidence, and sensitive-data boundaries.
- Solidity Reviewer for Solidity, Hardhat, ABI, bytecode, viem, and contract-test changes.
- Frontend/UX Reviewer for lifecycle tabs, ZiLi-OS console readability, right-rail operation-control boundaries, responsive behavior, user-facing claims, and user-perspective lifecycle flow.
- Release Engineer for commit/push readiness, build/env checks, reviewer gates, and release-risk summaries.

Triggered review lenses are applied inside those roles rather than treated as extra always-on bots:

- State / Memory / Performance Lens for shared lifecycle state, caching, persistence, chat/project/run memory, async orchestration, LLM calls, expensive validation, evidence exports, or speed-sensitive UI flows.

The Lead Implementer remains responsible for final integration and active debugging.

## Drift Control

Reviewers must check whether docs, prompts, UI labels, tests, lifecycle read models, Product Vault status, SCP gates, and contract artifacts still describe the same system.

When drift is found:

- identify the authoritative source before editing;
- fix the source or dependent surface, not both blindly;
- add the smallest regression or docs check that would catch recurrence;
- re-run the relevant focused checks;
- keep the Lead Implementer accountable for final correction and verification.

## Code Review

When the task is a **review** (not implementation), use the Code Reviewer trio in `docs/handover/00-mila26-current-checkpoint.md` § Code Review. Do not invent severities — follow `docs/contracts/code-reviewer-checklist.md`.

When the task is **implementation**, apply `docs/handover/07-code-review-activation-rules.md` after implementation/tests and before commit/push:

- docs-only trivial edits may need only `git diff --check`.
- guardrail, contract, handover, small domain, small UI, or test changes need quick review.
- wallet, deployment, tx/hash/address, SCP operation, backend, persistence, LLM, or lifecycle-label changes need full audit.

Critical findings must be fixed before commit/push. High findings should be fixed in the same track unless explicitly deferred.

## Final Report

Report:

- Files created.
- Files modified.
- Tests/checks run.
- Failures or blocked checks.
- Whether application code changed.
- Deliberate non-goals.
- Where the next track should start.

Stop after the requested track.
