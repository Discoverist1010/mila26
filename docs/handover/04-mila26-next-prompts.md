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

## Completed Prompt: Operation Hardening + Sepolia Funding Helper

This prompt has been implemented. Keep it here as completion context:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read `AGENTS.md`, then run:

git status --short --branch
npm run test -- tests/lifecycle-state.test.ts tests/app-chat-panel.test.tsx
npm run test:e2e

Goal:
Harden the working wallet-signed operation surfaces and add the Sepolia funding-helper UX for generated demo wallets without broadening SCP controls.

Scope:
1. Run browser/screenshot review for Overview, Investor Registry, Subscription, Smart Contract, Sepolia readiness, Allocation/Mint execution, and right rail status.
2. Fix only UX/state issues found by the review; avoid broad redesign.
3. Add Sepolia funding-helper UX for generated/manual demo wallets:
   - show which issuer/admin and investor wallets need Sepolia ETH;
   - provide copyable public addresses;
   - keep private keys out of normal lifecycle state;
   - do not claim automated funding unless a real faucet/provider integration exists.
4. Preserve Allocation/Mint release gates from `docs/contracts/allocation-mint-operation-contract.md`.
5. Do not add live stablecoin execution, durable persistence, or mainnet support.

Acceptance:
- Existing tests continue passing.
- Browser/e2e coverage proves Allocation/Mint execution gates survive cross-tab edits.
- The Smart Contract tab remains readable and uncluttered.
- The right rail remains passive.
- No transaction hash, contract address, or confirmed mint status appears without provider evidence.
- No internal track numbers appear in user-facing UI.
```

## Completed Prompt: Website Access + Persistence Decision

This prompt has been implemented. Keep it here as completion context:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read `AGENTS.md`, then run:

git status --short --branch
npm run test -- tests/app-chat-panel.test.tsx tests/e2e/mila26.spec.ts

Goal:
Build the next prototype slice around website/access and make the persistence decision without duplicating app lifecycle state.

Scope:
1. Continue the website/access first slice from `docs/product/website-mvp-brief.md`.
2. Route serious users from website intro to the working MILA26 app without creating a separate lifecycle state model.
3. Define the persistence boundary for project, lifecycle, investor registry, wallet-operation evidence, and generated artifacts.
4. Implement only the lowest-risk persistence foundation if the schema is clear; otherwise produce the schema/adapter contract first.
5. Keep Sepolia-only, wallet-signed, local-session evidence boundaries until durable evidence storage is explicitly implemented.
6. Do not add live stablecoin subscription/redemption execution in this sprint.

Acceptance:
- Existing tests continue passing.
- Website/access copy accurately states the three MILA26 capability domains: AI tokenisation, blockchain execution, and distribution/post-trade asset servicing.
- App lifecycle state remains the source of truth for tabs, Engineering Bot, Product Vault, and SCP.
- No internal track numbers appear in user-facing UI.
- No fake transaction hash, contract address, investor eligibility, investment advice, mainnet, audit, or production-ready claim is introduced.
```

## Completed Prompt: Backend Persistence Adapter Foundation

This prompt has been implemented. Keep it here as completion context:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read:

- `AGENTS.md`
- `docs/architecture/persistence-boundary-decision.md`
- `docs/architecture/mvp-stack-decisions.md`
- `docs/architecture/memory-design-mvp.md`

Then run:

git status --short --branch
npm run test -- tests/app-chat-panel.test.tsx tests/e2e/mila26.spec.ts

Goal:
Implement the smallest backend persistence adapter foundation without changing the app lifecycle source of truth or claiming durable Evidence Vault support.

Scope:
1. Add SQLite schema/repository boundaries for projects and lifecycle snapshots first.
2. Keep active React lifecycle state as the source of truth for the current session.
3. Do not persist private keys, wallet signatures, generated test wallet private keys, or raw unvalidated model output.
4. Do not label deployment/operation evidence as durable until Evidence Vault storage and retrieval are implemented.
5. Add tests for schema/repository behavior and stale-state guardrails.
6. Do not add live stablecoin subscription/redemption execution.

Acceptance:
- Existing tests continue passing.
- Persistence code is behind backend/storage adapters, not website state or browser storage.
- Website access does not become a second lifecycle state model.
- Freshness/provenance labels remain explicit: local-session, provider-returned, receipt-confirmed, durable only when implemented.
- No fake transaction hash, contract address, investor eligibility, investment advice, mainnet, audit, or production-ready claim is introduced.
```

## Completed Prompt: Durable Evidence Vault + Generated Artifact Persistence

This prompt has been implemented with Sprint 11/12. Keep it here as completion context:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read:

- `AGENTS.md`
- `docs/architecture/persistence-boundary-decision.md`
- `docs/contracts/deployment-evidence-contract.md`
- `docs/contracts/record-nav-operation-contract.md`
- `docs/contracts/wallet-whitelist-operation-contract.md`
- `docs/contracts/allocation-mint-operation-contract.md`

Then run:

git status --short --branch
npm run test -- tests/workspace-persistence-repository.test.ts tests/api-workspace-persistence.test.ts tests/app-chat-panel.test.tsx

Goal:
Design and implement the smallest durable Evidence Vault foundation without weakening local-session/provenance labels.

Scope:
1. Add storage contracts/schema for evidence records only after mapping existing deployment, Record NAV, Wallet Whitelist, and Allocation/Mint evidence fields.
2. Preserve provenance labels: local-session, provider-returned, receipt-confirmed, durable.
3. Do not persist private keys, wallet signatures, generated test wallet private keys, raw provider objects, or unvalidated model output.
4. Do not claim audit, production readiness, mainnet readiness, investor eligibility, or legal/compliance approval.
5. Keep React lifecycle state as the active session source of truth; Evidence Vault persistence is a storage/readback layer, not a second workflow state model.
6. Add focused repository/API tests and UI guardrails for stale or missing evidence.
7. Do not add live stablecoin subscription/redemption execution.

Acceptance:
- Existing tests continue passing.
- Evidence records can be stored and loaded with explicit provenance and timestamps.
- The UI distinguishes durable evidence from local-session-only evidence.
- Loading workspace state does not resurrect stale wallet operation evidence unless it was loaded from the durable Evidence Vault.
- No fake transaction hash, contract address, investor eligibility, investment advice, mainnet, audit, or production-ready claim is introduced.
```

## Next Codex Prompt: Live Sepolia Readiness

Use this prompt for the next implementation turn:

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main. Before editing, read:

- `AGENTS.md`
- `docs/architecture/persistence-boundary-decision.md`
- `docs/architecture/wallet-adapter-sepolia-design.md`
- `docs/contracts/deployment-evidence-contract.md`
- `docs/contracts/allocation-mint-operation-contract.md`

Then run:

git status --short --branch
npm run test -- tests/app-chat-panel.test.tsx tests/workspace-evidence-artifacts-repository.test.ts tests/api-workspace-evidence-artifacts.test.ts

Goal:
Add Live Sepolia readiness without making normal tests depend on MetaMask, private keys, or external RPC.

Scope:
1. Add `.env.example` entries for public Sepolia test addresses and optional Sepolia RPC URL.
2. Add a live-test harness gated behind an explicit flag such as `LIVE_SEPOLIA=1`.
3. Validate public issuer/admin, payment, redemption, and representative investor addresses.
4. Validate optional RPC connectivity, chain id, balance lookup, and transaction receipt lookup when values are provided.
5. Do not commit private keys, wallet seeds, RPC secrets, or generated test wallet exports.
6. Do not require live tests in normal `npm run check`.
7. Document exactly what user-provided artefacts are needed before live Sepolia evidence testing.

Acceptance:
- Normal tests remain deterministic and pass without external network.
- Live tests are opt-in, clearly skipped when env is absent, and fail loudly when configured artefacts are invalid.
- Evidence Vault remains the storage path for real provider-returned hashes/receipts.
- No mainnet, backend private-key custody, or production-ready claim is introduced.
```

## Prototype Sprint Target

The two-week prototype target is tracked in `docs/production/production-readiness-plan.md`.

For the next sprint, keep the goal narrow:

1. Add e2e and screenshot hardening for the working Subscription/Redemption and Allocation/Mint execution flows.
2. Keep all tabs connected to shared lifecycle state.
3. Make Engineering Bot next actions reflect the next missing lifecycle dependency.
4. Start website/access only after the app flow remains stable.
5. Do not add live stablecoin execution or broad/batch Allocation/Mint execution without a separate operation contract and tests.

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

## Later Prompt: Next SCP Operation

Add the next SCP operation only after:

- the required lifecycle state exists;
- smart-contract spec and ABI can consume those parameters;
- wallet/deployment/operation evidence gates remain stable.

Any new operation must remain wallet-signed, Sepolia-only, operation-specific, and evidence-linked. It must not unlock broad operations.
