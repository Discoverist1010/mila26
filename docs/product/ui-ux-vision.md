# MILA26 UI/UX Vision

## Product UX Identity

MILA26 is a professional AI tokenisation workspace for asset managers preparing a controlled tokenised financial product. The interface should help a user who knows the desired product outcome but does not yet know the blockchain, smart-contract, investor-registry, subscription, redemption, or evidence steps.

The current implemented direction is the MILA26 lifecycle workspace:

- dark left navigation rail;
- top project, wallet, network, and safety bar;
- visual lifecycle tabs;
- large central Engineering Bot conversation and answer surface;
- suggested next actions based on the user's intent;
- passive right status/Product Vault rail;
- Smart Contract Control Panel below the main AI workspace for executable wallet-signed operations.

The tabs are visual separation only. The Engineering Bot and code should operate over one shared product lifecycle state.

## Visual Identity

- MILA26 is the visible brand.
- Tone is institutional, calm, and asset-manager-friendly.
- Use a high-trust dark navy shell with restrained blue/green status accents.
- Avoid crypto-casino visuals, speculative trading language, neon clutter, or retail-token energy.
- The first viewport should identify the current product, investor cap, Sepolia testnet boundary, connected wallet state, and safety status.

## Core Layout Thesis

MILA26 is AI-first, not dashboard-first.

The central column must prioritize:

- the user's latest intent;
- the Engineering Bot's readable answer;
- the next best action;
- a small set of lifecycle snapshot cards.

Operational and artifact status belongs in passive surrounding context. Do not crowd the Engineering Bot answer with dashboard cards, repeated readiness meters, or dense stage summaries.

## Main UI Regions

### Left Rail

Responsibilities:

- MILA26 brand;
- active project selector;
- workspace navigation;
- Engineering Bot / Smart Contract Lab / Deployments / Evidence Vault links;
- settings links;
- compact Product Setup status.

The left rail is navigation, not a duplicate workflow dashboard.

### Top Bar

Responsibilities:

- active project name, e.g. `Alpha Income Fund I`;
- product type and investor cap, e.g. `Tokenised Financial Product`, `Up to 50 investors`;
- network, wallet, guided/expert mode, and safety status.

### Lifecycle Tabs

Current tabs:

1. Overview
2. Requirements
3. Investor Registry
4. Subscription
5. Smart Contract
6. Asset Servicing
7. Redemption
8. Maturity
9. Evidence

Tabs structure the user's mental model only. They must not create real state silos in code.

### Center Workspace

Responsibilities:

- Engineering Bot conversation;
- readable structured AI responses;
- next best action;
- suggested buttons such as defining stablecoins, redemption delay, investor registry, or smart-contract parameters;
- generated artifacts below the AI surface when relevant;
- hidden/accessibility-preserved brief artifact data for tests and future drawers.

### Right Rail

Responsibilities:

- Workspace Status;
- Capability Status;
- Product Vault;
- Recent Activity;
- passive safety note.

The right rail must not contain workflow or wallet execution buttons.

### Smart Contract Control Panel

Responsibilities:

- wallet-signed Sepolia deployment evidence;
- Record NAV Event operation;
- Whitelist Wallet operation;
- locked/future operations;
- operation evidence and safety boundaries.

The SCP remains the place for executable wallet-signed contract operations once their gates exist.

## UX Principles

- The Engineering Bot should have cross-stage context at all times.
- Use tabs to guide the user, not to fragment state.
- The user should always understand where they are in the lifecycle, what has been captured, what is missing, and what MILA26 recommends next.
- Keep AI answers readable with normal body text, short sections, and clear next actions.
- Show one next best action, then optional supporting actions.
- Keep the right rail passive.
- Keep financial-product wording user-facing; do not expose internal track numbers in the app UI.
- Avoid in-app legal/tax/accounting disclaimer clutter unless required for a specific flow.
- Preserve explicit blockchain safety boundaries: Sepolia only, user wallet signs, backend never holds private keys, local-session evidence only where applicable.

## User-Perspective Lifecycle Review

Every meaningful UI or lifecycle-flow change should be reviewed from the point of view of an asset manager who wants to tokenise and distribute a financial product but does not know the blockchain implementation steps.

The reviewer should ask:

- Does the screen make the next best action obvious?
- Does the Engineering Bot explain the outcome in user language before smart-contract language?
- Do locked, available, draft, completed, and needs-parameter states explain what the user can do next?
- Do the tabs feel like one connected lifecycle rather than disconnected tools?
- Do subscription, investor registry, redemption, asset servicing, maturity, and evidence states remain consistent with one another?
- Can the user recover from missing or invalid inputs without needing implementation knowledge?
- Is the center AI surface still the primary place for understanding and decision-making?

## Current Product Gaps Shown By The UI

The UI intentionally shows some future capabilities as not ready or needing parameters:

- subscription stablecoin template;
- redemption template and delay;
- investor registry data model for up to 50 whitelisted wallets;
- allocation/mint operation;
- maturity closeout;
- durable Evidence Vault persistence;
- investor communication/asset servicing automation beyond current NAV event recording.

These are roadmap signals, not broken UI states.
