# Current MILA26 Technical Architecture

## Runtime Stack

- Frontend: Vite, React, TypeScript.
- Backend: Fastify in `server/`.
- Tests: Vitest, Testing Library, Playwright, Node test runner for Hardhat fixture tests.
- Smart-contract tooling: Hardhat 3, OpenZeppelin Contracts 5.x, viem already present for Hardhat integration.
- LLM: backend-only provider boundary; deterministic mock mode remains supported.

## Application Shape

`src/App.tsx` currently owns local React state for the cockpit flow. This is intentional until persistence is explicitly approved.

The app composes pure read models and API clients rather than a global lifecycle context:

- Project Closure Read Model.
- Project Lifecycle Read Model.
- Cockpit Action Registry.
- Smart Contract Control Panel View Model.
- Deployment Gate Read Model.
- Wallet Signing Intent Read Model.
- Wallet Connection Read Model.

The right rail is passive. The central Engineering Bot surface owns workflow decisions. SCP remains a status/evidence/boundary/health surface and locked operations area until real deployment exists.

## Backend Routes

Current backend routes:

- `GET /api/health`
- `POST /api/chat/blockchain-engineer`
- `POST /api/prd/engineering-brief`
- `POST /api/smart-contract/artifact-spec`
- `POST /api/smart-contract/artifact`

Product routes use safe success/failure envelopes:

- `{ ok: true, data }`
- `{ ok: false, error }`

No backend route executes Hardhat, signs transactions, connects wallets, stores private keys, deploys contracts, or handles persistence.

## Domain And Contract Spine

Key source areas:

- `src/domain/`: frontend/domain read models and deterministic view models.
- `server/contracts/`: API/server contract schemas.
- `server/routes/`: backend route handlers.
- `server/agents/`: deterministic generators/mappers.
- `src/api/`: frontend API wrappers.
- `contracts/`: local Solidity fixture.
- `test/`: Hardhat fixture tests.
- `tests/`: Vitest and Playwright coverage.
- `docs/contracts/`: contract references.
- `docs/architecture/`: architecture decisions and boundaries.

## Smart Contract Foundation

Current contract path:

- Track 9A creates a `SmartContractArtifactSpec`.
- Track 9B creates deterministic preview-only `artifactPackage`, `checkResult`, and `evidenceLite`.
- Track 10A adds local Hardhat compile/test foundation for `Mila26RestrictedFundToken`.
- Track 10B represents local compile/test outcomes in a typed adapter.
- Track 10C surfaces known local compile/test status in the cockpit/SCP.

Current limitations:

- The app does not compile Solidity at runtime.
- The app does not deploy.
- No deployment scripts exist.
- No contract address or transaction hash exists.
- No audit approval is claimed.

## Wallet And Deployment Foundation

Current wallet/deployment path:

- Track 11A defines Deployment Gate readiness.
- Track 11B surfaces Deployment Gate as view-only status.
- Track 12A defines Wallet Signing Intent.
- Track 12B surfaces Wallet Signing Intent and operations locked state.
- Track 12C hardens the golden flow and no-fake-execution guardrails.
- Track 13A defines MetaMask-first wallet adapter/Sepolia design and a pure Wallet Connection Read Model.
- Track 13B implements frontend-only EIP-1193 wallet connection and Sepolia verification.

Track 14A should define unsigned deployment intent without requesting a signature or submitting a transaction.

## Current Guardrails

- Backend never holds private keys.
- User wallet signs future deployment and operations.
- Sepolia/testnet only for alpha.
- Mainnet disabled.
- Wallet address appears only after real wallet connection.
- Contract address appears only after real deployment.
- Transaction hash appears only after real transaction submission.
- SCP operations remain locked until wallet-signed deployment and authorization gates exist.
- No deployment, signing, submitted, confirmed, audited, verified, live, production-ready, or mainnet-ready claim appears before real execution.

## Validation Baseline

Primary validation commands:

```bash
npm run check
npm run test:e2e
npm run contracts:build -- --force
npm run test:contracts
```

Recent Track 13A validation passed:

- `npm run test -- tests/wallet-connection-read-model.test.ts`
- `npm run test -- tests/app-chat-panel.test.tsx`
- `npm run check`
- `npm run test:e2e`

## Still Not Implemented

- Wallet runtime connection.
- Signing request.
- Deployment transaction preparation.
- Transaction submission.
- Transaction receipt tracking.
- Contract address persistence/display.
- SCP contract operations.
- Database/persistence.
- Auth/payments.
- Mainnet.
- Production audit/legal/compliance approval.
