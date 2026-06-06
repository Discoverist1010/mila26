# MILA26 Next Prompts

## Completed Prompt: Lifecycle State + Investor Registry Foundation

This prompt has been implemented. Keep it here as completion context:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, run:

git status --short --branch
npm run test -- tests/app-chat-panel.test.tsx

Goal:
Implement the next lifecycle workspace foundation after the UI update.

Scope:
1. Add shared lifecycle state/read model support for:
   - investor registry entries;
   - subscription parameters;
   - redemption parameters;
   - maturity parameters.
2. Implement the Investor Registry tab as the first functional tab beyond Overview:
   - up to 50 investor wallet addresses;
   - wallet address validation;
   - status per entry: draft, ready to whitelist, whitelisted local-session-only;
   - no real-world investor names required;
   - no KYC/investor eligibility claim.
3. Keep tabs visual-only. The Engineering Bot and all tabs must read the same shared lifecycle state.
4. Do not add Allocation/Mint execution yet.
5. Do not add subscription/redemption execution yet.
6. Do not add persistence unless explicitly scoped.

Acceptance:
- Existing tests continue passing.
- Add focused tests for investor registry state and UI.
- Right rail remains passive.
- SCP remains the only home for wallet-signed contract operations.
- No internal track numbers appear in user-facing UI.
```

## Completed Prompt: Prototype Hardening + Website Start

This prompt has been implemented. Keep it here as completion context:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read `AGENTS.md`, then run:

git status --short --branch
npm run test -- tests/lifecycle-state.test.ts tests/app-chat-panel.test.tsx

Goal:
Harden the working investor registry -> subscription -> redemption -> subscription-redemption template handoff path, then start the website/access first slice where feasible.

Scope:
1. Add e2e coverage for:
   - add a valid investor wallet;
   - configure Subscription parameters;
   - configure Redemption parameters and delay;
   - verify Engineering Bot next action, lifecycle snapshot, Product Vault, and template handoff update from shared lifecycle state;
   - edit a previously valid value and verify draft/blocked status returns without stale readiness.
2. Run browser screenshot review for Overview, Investor Registry, Subscription, Redemption, and Smart Contract surfaces.
3. Fix only UX or state issues found by the review; avoid broad redesign.
4. Create the first website/access implementation slice from `docs/product/website-mvp-brief.md` only if it can be kept separate from app lifecycle state.
5. Do not add live stablecoin execution.
6. Do not add Allocation/Mint execution yet.
7. Do not add durable persistence unless explicitly scoped.

Acceptance:
- Existing tests continue passing.
- E2E proves the prototype workflow is working software, not a click-through mockup.
- User-entered subscription/redemption values persist in app state during the session and remain editable.
- Engineering Bot, lifecycle snapshot, Product Vault, status panels, Subscription tab, Redemption tab, and template handoff all reflect the same shared lifecycle state.
- Invalid, incomplete, and edited values update validation/status without stale summaries.
- Right rail remains passive.
- SCP remains the only home for wallet-signed contract operations.
- No internal track numbers appear in user-facing UI.
- No claim that stablecoin payment, redemption payout, or liquidity management is live.
```

This should still be parameter/spec work, not live stablecoin execution.

## Next Codex Prompt: Allocation/Mint Browser Hardening + Operation Contract

Use this prompt for the next implementation turn:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read `AGENTS.md`, then run:

git status --short --branch
npm run test -- tests/lifecycle-state.test.ts tests/app-chat-panel.test.tsx
npm run test:e2e

Goal:
Harden the working Allocation/Mint readiness surface and design the wallet-signed Allocation/Mint operation contract without enabling live execution yet.

Scope:
1. Run browser/screenshot review for Overview, Investor Registry, Subscription, Smart Contract, Allocation/Mint readiness, and right rail status.
2. Fix only UX/state issues found by the review; avoid broad redesign.
3. Add or update a contract/read-model spec for the later wallet-signed Allocation/Mint operation:
   - selected wallet must come from Investor Registry;
   - token amount must be greater than zero;
   - Subscription must be ready;
   - deployment evidence, Sepolia wallet, and contract address gates must stay operation-specific;
   - no stablecoin receipt or KYC/eligibility claim.
4. Keep the SCP Mint button locked until the execution slice is explicitly implemented.
5. Do not add live stablecoin execution, durable persistence, or mainnet support.

Acceptance:
- Existing tests continue passing.
- Browser/e2e coverage proves Allocation/Mint readiness survives cross-tab edits.
- The Smart Contract tab remains readable and uncluttered.
- The right rail remains passive.
- No transaction hash, contract address, or confirmed mint status appears without provider evidence.
- No internal track numbers appear in user-facing UI.
```

## Prototype Sprint Target

The two-week prototype target is tracked in `docs/production/production-readiness-plan.md`.

For the next sprint, keep the goal narrow:

1. Add e2e and screenshot hardening for the working Subscription/Redemption and Allocation/Mint readiness flows.
2. Keep all tabs connected to shared lifecycle state.
3. Make Engineering Bot next actions reflect the next missing lifecycle dependency.
4. Start website/access only after the app flow remains stable.
5. Do not add live stablecoin execution or Allocation/Mint execution without a separate operation contract and tests.

The result must be working software, not a visual placeholder. If a field, button, status, or artifact is shown as active, it must be wired to state, validation, and tests.

## Reminder: Independent External Reviewer

After the Subscription + Redemption parameter track and the first smart-contract template handoff, reassess whether to add Claude or another independent external model reviewer.

Do not add it before:

- backend-only model access is designed;
- review output has a structured finding schema;
- cost and rate limits are explicit;
- there is an eval set or known-defect checklist to measure whether the extra reviewer improves catch rate.

Use it first for bounded independent review only:

- security-sensitive wallet/Sepolia changes;
- Solidity template and contract invariant review;
- architecture drift review across lifecycle state, tabs, SCP, Product Vault, and Engineering Bot;
- beta-readiness review before external tester rounds.

The Lead Implementer remains accountable for deciding whether to debug, refactor, defer, or reject findings.

## Later Prompt: Allocation/Mint Execution

Add Allocation/Mint execution only after:

- investor registry state exists;
- subscription parameters exist;
- Allocation/Mint readiness state exists;
- smart-contract spec can consume those parameters;
- wallet/deployment/operation evidence gates remain stable.

Allocation/Mint must remain wallet-signed, Sepolia-only, operation-specific, and evidence-linked. It must not unlock broad operations.
