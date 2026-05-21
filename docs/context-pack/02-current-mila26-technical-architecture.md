# Current MILA26 Technical Architecture

## Folder Tree

```text
mila26/
  .env.example
  README.md
  eslint.config.js
  index.html
  package-lock.json
  package.json
  playwright.config.ts
  tsconfig.json
  vite.config.ts
  src/
    App.tsx
    main.tsx
    styles.css
    agents/
      agentRuntime.ts
      evidence.ts
      security.ts
    domain/
      moduleCatalog.ts
      schemas.ts
      templates.ts
  tests/
    agent-runtime.test.ts
    security.test.ts
    setup.ts
    e2e/
      mila26.spec.ts
  docs/
    context-pack/
```

## Frontend Framework And Runtime

MILA26 is a Vite + React + TypeScript frontend app. `package.json` declares ESM mode, React 19, TypeScript 5.8, Vite 7, and Zod (`package.json:1-22`). `main.tsx` mounts `<App />` into `#root` under `React.StrictMode` and imports the global stylesheet (`src/main.tsx:1-10`).

Vite config uses `@vitejs/plugin-react` and configures Vitest to run in `jsdom`, excluding e2e tests from unit runs (`vite.config.ts:1-10`). Playwright is configured separately for Chromium against `http://127.0.0.1:5173` and starts `npm run dev` as its web server (`playwright.config.ts:1-14`).

## Key Dependencies

Runtime dependencies:

- `react`, `react-dom`: UI runtime (`package.json:16-18`).
- `typescript`: source language and build type checking (`package.json:19`).
- `vite`: dev server and bundler (`package.json:20`).
- `zod`: runtime schema validation and inferred types (`package.json:21`, `src/domain/schemas.ts:1-85`).
- `@vitejs/plugin-react`: Vite React integration (`package.json:16`, `vite.config.ts:1-4`).

Dev/test dependencies:

- `vitest`, `jsdom`, Testing Library packages for unit-level tests (`package.json:24-37`, `tests/setup.ts:1`).
- `@playwright/test` for the guided journey smoke test (`package.json:25`, `tests/e2e/mila26.spec.ts:1-15`).
- ESLint, React Hooks lint rules, React Refresh lint rules, globals, and TypeScript ESLint (`package.json:24-37`, `eslint.config.js:1-28`).

## Main Source Files And Responsibilities

- `src/main.tsx`: React entrypoint and stylesheet import (`src/main.tsx:1-10`).
- `src/App.tsx`: complete current UI, local state, guided journey, artifact display, evidence pack download, and Blockchain Engineer Bot side panel (`src/App.tsx:30-188`).
- `src/styles.css`: layout and visual styling for the app shell, panels, module grid, agent grid, chat panel, code blocks, approval states, and responsive behavior (`src/styles.css:1-168`).
- `src/domain/schemas.ts`: Zod schemas and TypeScript types for fund facts, modules, requirement briefs, agent tasks, generated artifacts, agent results, security reviews, and evidence packs (`src/domain/schemas.ts:3-85`).
- `src/domain/moduleCatalog.ts`: static servicing module catalog, default module selection, and module label lookup (`src/domain/moduleCatalog.ts:10-67`).
- `src/domain/templates.ts`: deterministic Solidity artifact and deployment manifest generators (`src/domain/templates.ts:4-127`).
- `src/agents/agentRuntime.ts`: deterministic "agent" runtime, requirement brief creation, Blockchain Engineer Bot answers, mini-bot decomposition, mini-bot execution, security review call, and evidence pack call (`src/agents/agentRuntime.ts:17-194`).
- `src/agents/security.ts`: rules-based generated-artifact scanner for forbidden patterns (`src/agents/security.ts:3-36`).
- `src/agents/evidence.ts`: Markdown evidence pack generator (`src/agents/evidence.ts:4-60`).

## State Flow

All application state currently lives in `App`:

- `facts`: seeded `FundFacts` object (`src/App.tsx:11-18`, `src/App.tsx:31`).
- `goal`: launch goal text (`src/App.tsx:32`).
- `question`: Blockchain Engineer Bot input (`src/App.tsx:33`).
- `brief`: current `RequirementBrief` (`src/App.tsx:34`).
- `bundle`: current `ImplementationBundle` with tasks, results, review, and evidence pack (`src/App.tsx:35`).
- `isRunning`: button/loading state during agent orchestration (`src/App.tsx:36`, `src/App.tsx:51-60`).

Derived state:

- `engineerAnswer` comes from `answerAsBlockchainEngineer(question, brief)` via `useMemo` (`src/App.tsx:38`).
- `generatedArtifacts` flattens all artifacts from the current bundle (`src/App.tsx:39`).

There is no global store, router, server state library, persistence layer, or URL state.

## Data Flow From Fund Setup To Artifacts/Evidence Pack

1. Fund setup form updates `facts` through `updateFact` (`src/App.tsx:41-43`, `src/App.tsx:73-97`).
2. Goal textarea updates `goal` (`src/App.tsx:99-103`).
3. `createBrief` calls `createRequirementBrief(facts, goal)`, stores the new brief, and clears old bundle output (`src/App.tsx:45-49`).
4. `createRequirementBrief` builds a brief with default modules, compliance assumptions, simulation-only deployment target, security constraints, and unresolved questions, then parses it with `RequirementBriefSchema` (`src/agents/agentRuntime.ts:25-53`).
5. UI renders the brief as JSON text (`src/App.tsx:118-129`).
6. `runAgents` calls `runCodingBotOrchestration(brief)` (`src/App.tsx:51-60`).
7. `runCodingBotOrchestration` parses the brief, decomposes tasks, runs mini-bots in `Promise.all`, runs security review, and generates evidence (`src/agents/agentRuntime.ts:180-194`).
8. Mini-bot outputs come from `runMiniBot`: Solidity artifact, API note, frontend workflow note, deployment manifest, and test plan (`src/agents/agentRuntime.ts:108-177`).
9. Generated artifacts are displayed as text, not HTML (`src/App.tsx:155-164`).
10. Evidence pack is displayed and downloadable as Markdown text (`src/App.tsx:167-174`).

## Test Structure

- `tests/agent-runtime.test.ts`: unit coverage for requirement brief creation, mini-bot decomposition, reviewed artifact generation, and evidence pack generation (`tests/agent-runtime.test.ts:13-38`).
- `tests/security.test.ts`: unit coverage for blocking secret-like generated content (`tests/security.test.ts:5-28`).
- `tests/e2e/mila26.spec.ts`: Playwright smoke test for the guided beta journey (`tests/e2e/mila26.spec.ts:3-15`).
- `tests/setup.ts`: imports Testing Library DOM matchers for Vitest (`tests/setup.ts:1`).

## Existing NPM Scripts

- `npm run dev`: starts Vite on `127.0.0.1:5173` (`package.json:7`).
- `npm run build`: runs `tsc -b` and `vite build` (`package.json:8`).
- `npm run preview`: starts Vite preview on `127.0.0.1:4173` (`package.json:9`).
- `npm run lint`: runs ESLint (`package.json:10`).
- `npm run test`: runs Vitest (`package.json:11`).
- `npm run test:e2e`: runs Playwright (`package.json:12`).
- `npm run check`: lint, unit tests, and build (`package.json:13`).

## Current Environment Variables

`.env.example` lists:

- `OPENAI_API_KEY=` (`.env.example:1`).
- `AUDIT_AGENT_API_KEY=` (`.env.example:2`).
- `ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173` (`.env.example:3`).
- `ENABLE_REAL_DEPLOY=false` (`.env.example:4`).

No current source file reads these variables. They are future-facing placeholders for backend/API, LLM, audit-agent, CORS/origin, and deployment gating work.

## What Is Frontend-Only

Everything currently runs in the browser bundle:

- Requirement brief creation.
- Blockchain Engineer Bot answers.
- Agent decomposition and orchestration.
- Artifact generation.
- Security review.
- Evidence pack generation.
- Evidence pack download.

The deterministic runtime imports domain templates and local security/evidence functions directly (`src/agents/agentRuntime.ts:1-15`). There is no API client, no `fetch`, no backend route, and no server entrypoint in the current source tree.

## Missing Backend/API Components

Current missing components include:

- API routes for creating briefs, starting runs, polling runs, and exporting evidence.
- Server-side validation boundary separate from frontend schemas.
- Real LLM provider adapter for Blockchain Engineer Bot and coding mini-bots.
- Secret management for `OPENAI_API_KEY` and `AUDIT_AGENT_API_KEY`.
- CORS/origin enforcement for `ALLOWED_ORIGINS`.
- Database and persistence for briefs, runs, artifacts, findings, and evidence packs.
- Auth, tenant/account model, and user ownership.
- Solidity compilation, static analysis, testing, or deployment pipeline.
- Background jobs or durable agent orchestration.
- Observability/logging/audit trail.
