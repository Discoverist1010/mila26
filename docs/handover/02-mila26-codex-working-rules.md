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
