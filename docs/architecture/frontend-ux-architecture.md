# Frontend UX Architecture

This document describes the frontend architecture implied by the MVP UX vision. It does not implement the redesign.

Approved near-term UX direction reference: `docs/assets/ux/mila26_dashboard_v2.png`.

The mockup is the canonical visual/product direction for the near-term dashboard shell. It should guide layout hierarchy, density, tone, and component sequencing, but it is not a pixel-perfect implementation mandate.

## Frontend Responsibilities

- Layout shell and responsive behavior.
- Chat UI and safe rendering of backend responses.
- Current project context display.
- Requirement cards and sub-action drawers.
- Project status panels and next-action display.
- Collapsible left and right panels.
- Top protocol/network/wallet/service-cart status area.
- Wallet connection later.
- API client calls.
- Safe loading, empty, blocked, and error states.

## Backend Responsibilities

- LLM calls behind backend-only providers.
- Agent orchestration.
- Memory and persistence later.
- PRD generation.
- Security/deployment gate decisions.
- Evidence generation.
- No private keys.

## Suggested Frontend Layers

- UI components: pure presentational pieces.
- Feature modules: chat, projects, requirements, status, deployment.
- API client layer: typed calls to backend routes.
- Local UI state: panel collapsed state, drawer open state, current form edits.
- Future project state store if shared state becomes painful.

## Suggested Folder Direction

Do not implement this structure until a UI track begins:

```text
src/
  api/
  components/layout/
  components/chat/
  components/requirements/
  components/project/
  components/wallet/
  components/services/
  features/chat/
  features/projects/
  features/requirements/
```

Keep the initial migration incremental. Do not move `App.tsx` wholesale before the target components and tests are clear.

## State Management Approach

- Start with local React state.
- Introduce React Context or a reducer only when shared state becomes painful.
- Consider Zustand later only if the app has concrete cross-surface state needs.
- Avoid Redux, XState, or heavy state machines for now.

## API Client Principle

- Do not scatter `fetch` calls across components.
- Use a small typed client layer under `src/api/` when frontend integration begins.
- For initial chat integration, use `VITE_MILA26_API_BASE_URL` with local default `http://127.0.0.1:5174`; see `docs/architecture/frontend-chat-integration.md`.
- Map API errors to safe UI messages.
- Keep API response envelopes aligned with `docs/architecture/api-response-conventions.md`.
- Never call LLM providers directly from frontend code.

## Collapsible Panels

- Left and right panels should be collapsible.
- Collapsed rails should preserve key icons.
- Main workspace expands when panels collapse.
- User preference can be remembered later, but is not required immediately.
- The near-term shell should follow the approved mockup direction without forcing pixel-perfect measurements.

## Sub-action Drawer Pattern

- Requirement cards are entry points.
- Drawer handles detail editing.
- Header includes breadcrumb, such as `Project > Requirements > Whitelist`.
- Drawer has save/cancel actions.
- Background project context remains visible.
- Use full pages only for larger workflows like PRD review, wallet allocation, deployment checklist, or valuation upload.

## Testing Implications

- Add component tests for chat client and requirement drawer later.
- Add Playwright smoke tests for the main journey later.
- Do not make UI tests brittle on long copy text.
- Prefer structural assertions: visible project name, active workflow gate, chat response, requirement card count, drawer open/close, and safe error state.
