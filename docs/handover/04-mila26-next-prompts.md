# MILA26 Next Prompts

## Next Codex Prompt: Lifecycle State + Investor Registry Foundation

Use this prompt for the next implementation turn:

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

## Following Prompt: Subscription + Redemption Template Parameters

After the investor registry foundation is clean, implement parameter capture for the subscription-redemption template:

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

This should still be parameter/spec work, not live stablecoin execution.

## Later Prompt: Allocation/Mint

Add Allocation/Mint only after:

- investor registry state exists;
- subscription parameters exist;
- smart-contract spec can consume those parameters;
- wallet/deployment/operation evidence gates remain stable.

Allocation/Mint must remain wallet-signed, Sepolia-only, operation-specific, and evidence-linked. It must not unlock broad operations.
