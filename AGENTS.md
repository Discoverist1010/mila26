# MILA26 Agent Operating Rules

## First Read

Before implementation, read:

- `MILA26_PROJECT_START_HERE.md`
- `docs/handover/00-mila26-current-checkpoint.md`
- `docs/handover/03-mila26-track-status.md`
- `docs/handover/04-mila26-next-prompts.md`
- `docs/handover/07-code-review-activation-rules.md`

Use more specific architecture, product, and contract docs as the track requires.

## Lead Implementer

The main Codex session is the **Lead Implementer / Lead Integrator**.

The lead owns:

- scoped implementation;
- integration of any worker/subagent outputs;
- final test interpretation;
- active debugging of ordinary failures;
- quality refactoring in touched modules when needed;
- final readiness before commit or push.

The lead must not stop at "tests failed" when the failure is debuggable within the approved scope. Failed checks trigger an active loop: isolate, identify root cause, fix narrowly, re-run focused tests, then re-run broader checks.

Stop and ask only when the fix needs credentials, external service setup, destructive changes, new dependencies, new tools/MCPs, or clear scope expansion.

## Delivery Roles

These are delivery roles for the engineering process, not MILA26 product bots.

- **Lead Implementer / Lead Integrator:** main agent; owns correctness and integration.
- **Test Engineer:** designs and runs Vitest, Playwright, Hardhat, regression, and failure-path tests.
- **Quality Architect / Refactorer:** removes brittleness, duplicated state, hardcoding, incomplete data flow, and rigid module boundaries.
- **Code Reviewer:** applies `docs/handover/05-code-reviewer-skill.md`, `docs/contracts/code-reviewer-checklist.md`, and `docs/handover/06-code-reviewer-lessons.md`; blocks unresolved Critical/High findings.
- **Security Reviewer:** reviews auth, secrets, private-key custody, wallet safety, OWASP issues, and sensitive data handling.
- **Solidity Reviewer:** reviews Solidity, Hardhat, OpenZeppelin, viem, Sepolia-only constraints, and contract tests.
- **Frontend/UX Reviewer:** reviews responsiveness, readability, accessibility, visual hierarchy, and lifecycle tab coherence.
- **Release Engineer:** reviews build, environment config, hosted app behavior, deployment readiness, and rollback concerns.

One person/agent may perform multiple roles, but the lead remains accountable for final integration.

## Dynamic Skills And MCPs

Use available skills and MCPs when they fit the work:

- `clean-modern-ux` for UI/UX and interaction design.
- `modular-architecture` for boundaries, orchestration, and refactors.
- `engineering-review` for debugging, review, and hardening.
- `owasp-security` for auth, security, privacy, and wallet-sensitive work.
- Figma MCP for design creation, design inspection, and design-to-code work.
- Context7 MCP for current library, framework, SDK, or cloud-service docs.
- GitHub tooling for repository, PR, CI, and publishing work.
- Playwright/browser tooling for real UI verification.

When a capability gap appears:

1. Inspect existing repo tools, skills, MCPs, and scripts first.
2. If current tools are insufficient, propose the exact skill, MCP, dependency, or external tool.
3. Explain why it is needed, what it changes, and what command/permission is required.
4. Install or enable it only after user approval.
5. Record recurring approved tooling here or in the relevant handover doc.

Do not install new dependencies, global skills, MCPs, or security scanners without approval.

## Quality Gates

No implementation track is complete unless the relevant checks pass:

- focused tests for the changed behavior;
- `npm run check` unless explicitly scoped out;
- `npm run test:e2e` for meaningful UI behavior changes;
- `npm run contracts:build` and `npm run test:contracts` for smart-contract changes;
- relevant wallet adapter/read-model tests for wallet or Sepolia flows.

Before commit/push, apply `docs/handover/07-code-review-activation-rules.md`.

Critical findings must be fixed. High findings should be fixed in the same track unless explicitly deferred.

Reviewer passes must explicitly check MILA26 lifecycle invariants:

- tabs are visual only; shared typed lifecycle state owns data that crosses stages;
- Investor Registry is the wallet whitelist source of truth;
- SCP actions cannot bypass lifecycle gates;
- multi-item flows still work after the first successful operation;
- read-model counts derive from effective eligibility, not stale stored labels;
- user UI does not leak internal track labels;
- wallet whitelisting is not described as KYC, investor eligibility, legal, compliance, or investment-advice approval.

## Refactor Triggers

Pause feature work and refactor or propose a stabilization track when any of these appear:

- same lifecycle/business rule duplicated in three or more places;
- separate tab state silos instead of shared typed lifecycle state;
- `App.tsx` or another module becoming a mixed-responsibility god object;
- hardcoded chain IDs, addresses, URLs, model names, timeouts, or feature flags outside config/test fixtures;
- smart-contract parameters manually reconstructed in UI instead of derived from typed state;
- error states swallowed or converted into vague success;
- wallet account/chain state not rechecked before transaction submission;
- tests that only verify copy or implementation details while missing behavior.

Refactors should be the smallest coherent change that improves quality while preserving approved behavior.

## Subagents

Use subagents only for bounded parallel work with disjoint ownership. Each subagent task must specify files or responsibilities it owns.

The lead must review and integrate subagent outputs. Subagents cannot approve their own work and do not own final correctness.

Do not run parallel agents against overlapping files unless the lead explicitly sequences the integration.

## Non-Negotiables

- Backend never holds private keys.
- Frontend never calls LLM providers directly or exposes LLM secrets.
- Sepolia/testnet only unless a future production track explicitly changes this.
- No fake transaction hash, fake contract address, fake deployment, fake audit, or fake production-readiness claim.
- Lifecycle tabs are visual structure only; code must share lifecycle state where data crosses stages.
- Right rail stays passive; workflow decisions stay in the Engineering Bot or approved SCP operation controls.
