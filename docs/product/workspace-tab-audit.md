# MILA26 Workspace Tab Audit

Status: Sprint 15 audit-first review complete.

## Purpose

This audit checks the current lifecycle workspace tab by tab before broadening functionality. The goal is to make sure each tab has clear user-facing content, active actions, status, artefacts, persistence ownership, and cross-tab data flow.

Tabs are visual structure for the user. They must not become code-level silos. Engineering Bot, Advisor mode, lifecycle state, Product Vault, Evidence Vault, and Contract Ops must keep a shared picture of the product lifecycle.

## Audit Principles

- Every active-looking control must be wired to state, validation, tests, and a clear persistence owner.
- Shared lifecycle data remains the source of truth across tabs.
- Generated artefacts are not durable until saved through the generated artifact persistence path.
- Provider-derived blockchain evidence is not durable until saved through the Evidence Vault path.
- Local wallet state, private keys, generated private-key exports, and MetaMask session state remain local-session only.
- The right rail should stay passive. Primary work happens in the center panel and AI interaction surface.
- Hidden or legacy implementation surfaces should not drift from the primary user journey.

## Executive Findings

The strongest current matches are Investor Wallets, Subscription, Redemption, Contract Ops, Evidence Vault, and the persistent AI panel. These already use shared lifecycle state and have useful regression coverage.

The main gaps are Product Setup, Asset Servicing, and Maturity. These tabs exist in the lifecycle navigation, but they do not yet have enough dedicated content for a user who is trying to work tab by tab. The functionality is partly present elsewhere, especially in the shared AI panel and Contract Ops, but the user experience is not yet explicit enough.

The next implementation sprint should be a focused workspace completion pass, not a new feature expansion. It should add the missing tab panels, remove active-looking controls that are not wired, and keep all new panels attached to existing shared state rather than adding per-tab state stores.

## Current Fit

- The AI panel persists across tabs, supporting the correct model where tabs are visual separators and the Engineering Bot has cross-stage context.
- Investor Wallets supports up to 50 wallets, duplicate detection, generated test wallet packs, explicit private-key export, whitelist handoff, and Allocation/Mint handoff.
- Subscription and Redemption capture the core template parameters needed for the subscription-redemption smart contract.
- Contract Ops supports wallet-signed deployment, Record NAV, Wallet Whitelist, and Allocation/Mint with explicit readiness gates.
- Evidence Vault supports durable save/load for provider-derived evidence and generated artefacts after a workspace snapshot exists.
- The website/product copy now better explains user meaning: AI tokenisation, blockchain execution, distribution/post-trade servicing, evidence, and reduced throwaway effort.

## Current Gaps

- Product Setup needs a dedicated tab panel. Requirement Brief and Engineering Brief actions exist through the shared AI/artifact area, but the tab itself does not yet feel like a proper setup workspace.
- Asset Servicing needs a dedicated tab panel. Record NAV exists in Contract Ops, but the Asset Servicing tab does not yet show valuation/update actions, servicing status, or investor communication direction.
- Maturity needs a dedicated parameter panel. Maturity is part of the lifecycle model, but the user cannot yet review or capture maturity closeout inputs in a clear tab.
- Guided/Expert top-bar controls look active, but Expert mode is not yet a meaningful workspace mode. This should be wired or made visibly inactive until it is real.
- Contract Ops is functionally strong but dense. It should be reorganised into clearer groups without moving state ownership away from shared lifecycle and operation adapters.
- Some copy and internal remnants still use older naming or legacy concepts, including hidden Smart Contract Control Panel content. These should be cleaned up when the relevant tab is touched.
- The right rail open-item label should use current user-facing language, for example Investor Wallets rather than Investor Registry.

## Tab Review

| Tab | Current state | User actions | Status/information | Artefacts/persistence | Fit | Gap | Sprint 16 decision |
|---|---|---|---|---|---|---|---|
| Overview | AI-first entry surface with lifecycle context and passive right rail. | Ask Engineering/Advisor, follow next actions, save/load via visible workspace controls. | Lifecycle snapshot, Product Vault, open items, recent activity. | Conversation is local-session; generated artefacts can be saved where supported. | Good primary entry point. | Needs clearer "current objective / next blockers / saved state" overview. | Add a compact next-work panel only if it reduces clutter. |
| Product Setup | Visual tab exists, but there is no dedicated setup panel. | Requirement Brief, Engineering Brief, Smart Contract Spec generation via shared AI/artifact actions. | Product facts, assumptions, open questions partly exist in AI responses and artefacts. | Generated artifact records persist after explicit save. | Correct lifecycle stage exists. | User may not know what to review or fill in when landing on the tab. | Add dedicated Product Setup panel with brief statuses, assumptions, open questions, and artefact actions. |
| Investor Wallets | Dedicated working panel. | Add wallets, generate test wallet pack, prepare explicit test-only export, hand off wallet to whitelist/allocation. | Registered, ready, whitelisted, remaining capacity, validation. | Workspace snapshot persists wallet rows; private keys are not persisted. | Strong match. | Minor copy polish and export warning can improve confidence. | Keep mostly intact; add only small clarity improvements if needed. |
| Subscription | Dedicated working parameter panel. | Capture stablecoins, subscription window, minimum amount, payment address, payment per token. | Parameter readiness and validation. | Workspace snapshot persists lifecycle parameters. | Strong match for template readiness. | Free-text stablecoin input is flexible but less guided. | Add presets later if they do not constrain custom products. |
| Contract Ops | Dedicated working operation panel. | Deploy, Record NAV, Whitelist Wallet, Allocation/Mint. | Wallet/deployment/readiness/evidence status. | Provider-derived evidence can be saved through Evidence Vault; local wallet session remains local. | Strong technical functionality. | Dense layout; duplicated actions can make priority unclear. | Reorganise visually into Deployment, Investor Ops, Asset Ops, Allocation/Mint while reusing current state. |
| Asset Servicing | Visual tab exists, but no dedicated servicing panel yet. | Record NAV exists in Contract Ops. Future notices/updates are not yet implemented. | Current NAV operation status is visible elsewhere. | Record NAV evidence can be saved when provider-derived. | The underlying first operation exists. | User cannot yet work from the Asset Servicing tab; investor update workflow is not represented. | Add dedicated Asset Servicing panel with Record NAV handoff, servicing log, and future investor notice placeholders. |
| Redemption | Dedicated working parameter panel. | Capture redemption window/date, delay, redemption wallet, payout stablecoin, payout per token. | Parameter readiness and validation. | Workspace snapshot persists lifecycle parameters. | Strong match for template readiness. | No live redemption request or delayed payout operation yet. | Keep parameter focus; later add execution adapter/evidence contract. |
| Maturity | Visual tab exists, but no dedicated maturity panel yet. | No clear maturity input surface. | Maturity status exists in lifecycle/read models. | Workspace snapshot can carry maturity fields once captured. | Correct stage exists. | User cannot capture maturity date, closeout method, or closeout readiness. | Add parameter-only Maturity panel before live closeout execution. |
| Evidence Vault | Dedicated working evidence/artifact persistence panel. | Save/load evidence records and generated artefacts. | Current/stale/historical labels, record lists. | SQLite-backed local MVP persistence. | Strong match. | Needs clearer "what can be saved now" guidance from each tab. | Add save-readiness hints and tab-origin grouping later. |

## Sprint 16 Backlog

Priority 0:

- Add a Product Setup tab panel backed by existing artefact state and lifecycle state.
- Add an Asset Servicing tab panel backed by existing Record NAV operation state and future servicing placeholders.
- Add a Maturity tab panel for maturity date, closeout method, and closeout readiness parameters.
- Wire or visibly disable Expert mode so the top bar does not imply unavailable capability.
- Rename stale user-facing "Investor Registry" remnants to "Investor Wallets" where appropriate.

Priority 1:

- Reorganise Contract Ops into clearer sections while preserving current operation adapters and state ownership.
- Add an Overview next-work summary only if it improves clarity without re-cluttering the center panel.
- Add Evidence Vault readiness hints showing which records or artefacts can be saved now and what prerequisite is missing.

Priority 2:

- Add stablecoin presets for common test stablecoins if they remain customisable.
- Remove or quarantine hidden legacy Smart Contract Control Panel markup once Contract Ops coverage is complete.
- Add browser screenshot review for each newly functional tab after the implementation pass.

## Acceptance Criteria For The Next Implementation Pass

- Every lifecycle tab has either a dedicated working panel or a clear handoff to the shared AI/Contract Ops surface.
- No active-looking button remains unwired.
- New panels read from and write to shared lifecycle state, not tab-local lifecycle stores.
- Existing Investor Wallets, Subscription, Redemption, Contract Ops, and Evidence Vault tests continue to pass.
- New Product Setup, Asset Servicing, and Maturity panels have React tests, and at least one E2E flow confirms navigation and primary actions.
- Durable state and evidence labels remain honest: local-session, durable, current, stale, or historical.

## User Feedback Needed Before Sprint 16 Implementation

- Confirm that Product Setup, Asset Servicing, and Maturity are the right P0 tab priorities.
- Confirm whether Asset Servicing should include investor notices as draft-only UI now, or stay focused on NAV recording first.
- Confirm whether Maturity should remain parameter-only until redemption/maturity execution adapters are designed.

## Source Review

Reviewed implementation surfaces:

- `src/App.tsx`
- `src/domain/workspacePresentation.ts`
- `src/domain/lifecycleState.ts`
- `tests/app-chat-panel.test.tsx`
- `tests/e2e/mila26.spec.ts`
- `docs/operations/live-sepolia-readiness.md`
