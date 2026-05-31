# Code Review Activation Rules — MILA26

## Status: ACTIVE
**Version:** 1.0.0
**Last updated:** 2026-05-31
**Applies to:** MILA26 repository
**File path:** `docs/handover/07-code-review-activation-rules.md`

---

## Purpose

Use this file to decide when the Code Reviewer should run after implementation and before commit/push.

The reviewer is a separate pass. Do not use the same implementation mindset as the review mindset.

---

## Default Workflow

For implementation work:

1. Implement the track narrowly.
2. Run focused tests and `npm run check` when applicable.
3. Classify the diff using this file.
4. Run the required Code Reviewer pass.
5. Fix real Critical and High findings.
6. Re-run affected tests/checks.
7. Commit and push only after the reviewer gate is clear.

For review-only work:

1. Read `docs/handover/05-code-reviewer-skill.md`.
2. Scan `docs/handover/06-code-reviewer-lessons.md`.
3. Run `docs/contracts/code-reviewer-checklist.md`.
4. Do not modify files unless explicitly asked.

---

## Review Level Classifier

### Level 0 — Diff Check Only

Use when the diff is tiny and docs-only, and does not change guardrails, contracts, track plans, architecture rules, or handover instructions.

Run:

```zsh
git diff --check
```

If the docs touch guardrails, contracts, architecture, or handover rules, use Level 1 instead.

### Level 1 — Quick Review

Use for:

- docs that change guardrails, contracts, roadmap, handover, or code-review rules
- small domain/read-model changes
- small UI/status/readiness surface changes
- test-only changes
- cleanup that changes behavior-adjacent wording

Reviewer prompt:

```text
Quick review: scan CRITICAL patterns in docs/handover/06-code-reviewer-lessons.md, then phases 0-3 of docs/contracts/code-reviewer-checklist.md. Review the current diff only. Produce findings with severities, file references, and recommended fixes. Do not modify files unless explicitly asked.
```

### Level 2 — Full Audit

Use for any diff that touches:

- `src/wallet/`
- `src/contracts/`
- wallet/provider connection behavior
- transaction submission
- transaction hashes
- contract addresses
- deployment status or deployment evidence
- SCP operation controls
- backend routes or API contracts
- persistence, storage, database, or evidence storage
- user-visible lifecycle labels
- smart-contract operation execution
- LLM provider behavior or secrets

Reviewer prompt:

```text
Full audit: run phases 0-9 and Phase 10 report per docs/contracts/code-reviewer-checklist.md. Scan docs/handover/06-code-reviewer-lessons.md first. Include brittleness and rigidity heat maps. Review the current diff and relevant touched modules. Produce findings with severities, file references, and recommended fixes. Do not modify files unless explicitly asked.
```

---

## Blocking Rules

Before commit/push:

- Critical findings must be fixed.
- High findings should be fixed in the same track unless explicitly deferred.
- Medium findings may be fixed if low-risk or documented for a future cleanup.
- Observations do not block commit.

If a fix changes architecture, wallet flow, transaction handling, deployment evidence, SCP controls, or user-visible lifecycle labels, re-run the same review level after the fix.

---

## Commit/Push Gate

Before a requested `git add`, `git commit`, or `git push`, apply this classifier.

If the diff triggers Level 1 or Level 2 and no Code Reviewer pass has been run after the latest implementation changes, run the appropriate review before committing.

If the user explicitly asks to skip review, report that the reviewer gate was skipped.

---

## Examples

| Diff | Required review |
|------|-----------------|
| Typo fix in a non-contract doc | Level 0 |
| Update to checkpoint, working rules, or guardrail docs | Level 1 |
| New pure domain read model | Level 1 |
| App UI status labels | Level 1 |
| Wallet provider adapter | Level 2 |
| Deployment adapter or receipt polling | Level 2 |
| SCP operation button | Level 2 |
| Backend route | Level 2 |
| Persistence/evidence storage | Level 2 |

---

## Non-Goals

This file does not replace the checklist.

This file does not define severities.

This file only decides which review pass to run. The checklist remains the authority for findings and severity.
