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
4. Do not add Allocation/Mint yet.
5. Do not add subscription/redemption execution yet.
6. Do not add persistence unless explicitly scoped.

Acceptance:
- Existing tests continue passing.
- Add focused tests for investor registry state and UI.
- Right rail remains passive.
- SCP remains the only home for wallet-signed contract operations.
- No internal track numbers appear in user-facing UI.
```

## Next Codex Prompt: Subscription + Redemption Template Parameters

Use this prompt for the next implementation turn:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read `AGENTS.md`, then run:

git status --short --branch
npm run test -- tests/lifecycle-state.test.ts tests/app-chat-panel.test.tsx

Goal:
Implement Subscription and Redemption parameter capture for the predefined subscription-redemption smart-contract template.

Scope:
1. Extend the shared lifecycle state/read model for:
   - permitted stablecoins;
   - subscription window;
   - minimum subscription amount;
   - payment wallet/contract address;
   - payment per token;
   - redemption window/date;
   - redemption delay unit and duration;
   - redemption wallet;
   - stablecoin payout asset;
   - payout per token.
2. Implement the Subscription tab UI as parameter capture only.
3. Implement the Redemption tab UI as parameter capture only.
4. Keep tabs visual-only. Engineering Bot, lifecycle snapshot, Product Vault, and status panels must read the same shared lifecycle state.
5. Do not add live stablecoin execution.
6. Do not add Allocation/Mint yet.
7. Do not add persistence unless explicitly scoped.

Acceptance:
- Existing tests continue passing.
- Add focused tests for subscription/redemption read-model validation and UI.
- Right rail remains passive.
- SCP remains the only home for wallet-signed contract operations.
- No internal track numbers appear in user-facing UI.
- No claim that stablecoin payment, redemption payout, or liquidity management is live.
```

This should still be parameter/spec work, not live stablecoin execution.

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

## Later Prompt: Allocation/Mint

Add Allocation/Mint only after:

- investor registry state exists;
- subscription parameters exist;
- smart-contract spec can consume those parameters;
- wallet/deployment/operation evidence gates remain stable.

Allocation/Mint must remain wallet-signed, Sepolia-only, operation-specific, and evidence-linked. It must not unlock broad operations.
