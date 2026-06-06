# Frontend UX Architecture

This document describes the frontend architecture for the current MILA26 lifecycle workspace.

## Current UX Model

The implemented app is an AI-first lifecycle workspace:

- dark MILA26 left navigation rail;
- top project/network/wallet/safety bar;
- visual lifecycle tab strip;
- large Engineering Bot answer and conversation area;
- suggested next action row;
- passive right rail;
- Product Vault and Recent Activity;
- Smart Contract Control Panel below the main AI workspace.

Tabs are visual only. They must not create separate state silos.

## Frontend Responsibilities

- Layout shell and responsive behavior.
- Visual tab state and tab-purpose copy.
- Shared lifecycle presentation state.
- Engineering Bot conversation and safe rendering of backend responses.
- Current project context display.
- Product Vault and passive status rail.
- Generated artifact display.
- Wallet connection and wallet-signed Sepolia actions through the browser provider.
- SCP status/evidence/boundary/operation controls.
- Safe loading, empty, blocked, and error states.

## Backend Responsibilities

- LLM calls behind backend-only providers.
- Requirement/Engineering Brief generation.
- Smart Contract Artifact Spec generation.
- Deterministic artifact/check/evidence-lite generation.
- No private keys.
- No wallet signing.
- No frontend secrets.

## Suggested Frontend Layers

- `src/domain/`: pure read models and presentation models.
- `src/api/`: typed backend clients.
- `src/wallet/`: browser wallet adapters.
- `src/contracts/`: exported local deployment artifacts.
- `src/App.tsx`: current integrated shell; split only when component boundaries are stable.
- Future `src/components/`: layout, tabs, AI workspace, rails, Product Vault, SCP sections.

## Bundle Splitting

The frontend uses route and vendor code splitting before deeper component refactors:

- `/site` lazy-loads the website surface.
- `/` lazy-loads the MILA26 app workspace.
- React and wallet/vendor code are split into stable vendor chunks.
- `npm run check` includes a bundle-size guard after production build.

Do not split lifecycle tabs into separately owned state containers. Component splitting should preserve shared lifecycle state and Engineering Bot cross-stage context.

## Shared State Approach

Current state can remain local to `App.tsx` while the product is alpha-stage.

Add structured domain/read-model layers before adding heavier state tools:

- investor registry state;
- subscription parameters;
- redemption parameters;
- maturity parameters;
- evidence persistence state when implemented.

Avoid a monolithic lifecycle context until repeated cross-component plumbing proves it is necessary.

## Tab Architecture

Tabs should be backed by shared state and presentation models:

- Overview;
- Requirements;
- Investor Registry;
- Subscription;
- Smart Contract;
- Asset Servicing;
- Redemption;
- Maturity;
- Evidence.

Each tab may render a different view, but the Engineering Bot should always see the whole lifecycle.

## Right Rail Rule

The right rail is passive.

It can show:

- Workspace Status;
- Capability Status;
- Product Vault;
- Recent Activity;
- safety notes.

It must not show:

- deploy buttons;
- wallet buttons;
- operation buttons;
- primary workflow buttons.

## Testing Implications

- Prefer structural assertions over long copy assertions.
- Keep tests for:
  - lifecycle tabs visible;
  - center Engineering Bot workspace visible;
  - right rail passive;
  - primary actions in center;
  - SCP owns wallet-signed operations;
  - no fake wallet/deployment/evidence claims.
- Keep Playwright smoke tests for desktop and narrow viewport.
