# Current MILA26 Technical Architecture

## Runtime Stack

- Frontend: Vite, React, TypeScript.
- Backend: Fastify in `server/`.
- Tests: Vitest, Testing Library, Playwright, Node test runner for Hardhat fixture tests.
- Smart-contract tooling: Hardhat 3, OpenZeppelin Contracts 5.x, viem already present for Hardhat integration.
- LLM: backend-only provider boundary; deterministic mock mode remains supported.

## Application Shape

`src/App.tsx` currently owns local React state for the lifecycle workspace flow. This is intentional until persistence is explicitly approved.

The app composes pure read models, API clients, wallet adapters, and a shared workspace presentation model rather than a per-tab state model:

- Project Closure Read Model.
- Project Lifecycle Read Model.
- Cockpit Action Registry.
- Smart Contract Control Panel View Model.
- Deployment Gate Read Model.
- Wallet Signing Intent Read Model.
- Wallet Connection Read Model.
- Deployment Transaction Intent Read Model.
- Deployment Evidence Read Model.
- Record NAV Operation Read Model.
- Wallet Whitelist Operation Read Model.
- Workspace Presentation Model.

The right rail is passive. The central Engineering Bot surface owns workflow decisions. SCP owns operation controls only after explicit wallet-signed gates are satisfied.

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
- Track 10C surfaces known local compile/test status in the workspace/SCP.

Current limitations:

- The app does not compile Solidity at runtime.
- The app deploys only through the connected browser wallet on Sepolia.
- No backend deployment route or deployment script exists.
- Contract address and transaction hash appear only after provider/receipt responses.
- No audit approval is claimed.

## Wallet And Deployment Foundation

Current wallet/deployment path:

- Track 11A defines Deployment Gate readiness.
- Track 11B surfaces Deployment Gate as view-only status.
- Track 12A defines Wallet Signing Intent.
- Track 12B surfaces Wallet Signing Intent and operation-specific safety boundaries.
- Track 12C hardens the golden flow and no-fake-execution guardrails.
- Track 13A defines MetaMask-first wallet adapter/Sepolia design and a pure Wallet Connection Read Model.
- Track 13B implements frontend-only EIP-1193 wallet connection and Sepolia verification.
- Track 14A defines unsigned deployment intent without requesting a signature or submitting a transaction.
- Track 14B implements frontend-only wallet-signed Sepolia deployment.
- Track 14C derives local-session deployment evidence/readiness from provider transaction hash and receipt-confirmed contract address.
- Track 15A implements Record NAV Event as a wallet-signed SCP operation.
- Track 15B implements Whitelist Wallet as a wallet-signed SCP operation.
- The lifecycle workspace update removes internal track labels from user-facing UI and uses shared presentation state for visual tabs/status surfaces.
- Sprint Track 5 implements Sepolia demo wallet readiness and wallet-signed Allocation / Mint behind wallet, deployment, ABI, whitelist, parameter, duplicate-attempt, and evidence gates.

## Current Guardrails

- Backend never holds private keys.
- User wallet signs deployment and operations.
- Sepolia/testnet only for alpha.
- Mainnet disabled.
- Wallet address appears only after real wallet connection.
- Contract address appears only after real deployment.
- Transaction hash appears only after real transaction submission.
- SCP operations remain unavailable unless each operation has wallet-signed deployment evidence, an ABI-supported adapter, operation-specific authorization gates, and evidence handling.
- No audited, verified, live, production-ready, or mainnet-ready claim appears before real approval tracks.

## Validation Baseline

Primary validation commands:

```bash
npm run check
npm run test:e2e
npm run contracts:build -- --force
npm run test:contracts
```

`npm run check` includes lint, unit/app tests, production build, and the JS bundle-size guard.

Recent lifecycle workspace validation passed:

- `npm run test -- tests/app-chat-panel.test.tsx`
- `npm run build`
- `npm run test`
- `npm run test:e2e`

## Still Not Implemented

- Durable lifecycle state persistence.
- Investor Registry import/export and durable registry persistence.
- Live stablecoin subscription execution.
- Live redemption wallet receipt and payout execution.
- Solidity implementation of the subscription-redemption smart-contract template.
- Allocation/Mint.
- Maturity closeout.
- Broad SCP contract operations beyond the approved deployment, Record NAV, and Whitelist Wallet paths.
- Database/persistence.
- Auth/payments.
- Mainnet.
- Production audit/legal/compliance approval.
