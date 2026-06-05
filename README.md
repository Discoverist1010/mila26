# MILA26

MILA26 is a clean alpha rebuild of the MILA dashboard. It is designed as a compact AI + blockchain workspace for a small asset manager preparing a restricted ERC-20-compatible tokenised fund product.

## Current Alpha Capabilities

- MILA26 lifecycle workspace UI with visual tabs: Overview, Requirements, Investor Registry, Subscription, Smart Contract, Asset Servicing, Redemption, Maturity, and Evidence.
- Engineering Bot: guides the lifecycle across all tabs from product intent through wallet/testnet readiness.
- Shared workspace presentation state for tab/status/Product Vault surfaces.
- Requirement Brief and Engineering Brief generation.
- Project Closure Ledger and closure readiness.
- Smart Contract Artifact Spec for a MILA26 restricted ERC-20-compatible profile.
- Deterministic artifact preview, check result, and Evidence-Lite linkage.
- Local Hardhat/OpenZeppelin compile/test foundation for `Mila26RestrictedFundToken`.
- Deployment Gate and Wallet Signing Intent readiness surfaces.
- Smart Contract Operations locked state for future operations beyond the implemented narrow controls.
- MetaMask-first EIP-1193 wallet connection and Sepolia readiness check.
- Unsigned Sepolia deployment intent read model that gates wallet-signed deployment review.
- Wallet-signed Sepolia deployment through the connected browser wallet, with local-session-only transaction hash and contract address display from real provider/receipt responses.
- Deployment evidence/readiness surface that derives local-session evidence from provider transaction hash and receipt-confirmed contract address.
- First wallet-signed SCP operation: Record NAV Event on Sepolia, with local-session-only operation transaction/receipt/event evidence.
- Second wallet-signed SCP operation: Whitelist Wallet on Sepolia via `setWalletAllowed(address,bool)` with `allowed = true`, local-session-only operation evidence, and on-chain contract authorization honesty.

## Development

```bash
npm install
npm run dev
```

Run the local API skeleton in a second terminal:

```bash
npm run dev:api
```

The backend exposes `GET /api/health`, `POST /api/chat/blockchain-engineer`, `POST /api/prd/engineering-brief`, `POST /api/smart-contract/artifact-spec`, and `POST /api/smart-contract/artifact` on `http://127.0.0.1:5174` by default. Wallet connection, Sepolia deployment, Record NAV, and Wallet Whitelist operations are frontend-only through the browser's injected EIP-1193 provider. Persistence, backend wallet custody, backend deployment/operation routes, mainnet, durable deployment/operation evidence storage, and broad SCP operation execution are intentionally not implemented yet.

The current frontend implements the MILA26 lifecycle workspace: dark left navigation rail, top project/network/wallet bar, visual lifecycle tabs, AI-first center workspace, suggested next actions, passive right rail, Product Vault, lifecycle snapshot, and a scroll-down Smart Contract Control Panel. Tabs are visual only; the Engineering Bot and product surfaces read shared lifecycle state.

Earlier tracks added a frontend action that generates a readable Engineering Brief artifact from the current Requirement Brief. The backend PRD route can be LLM-assisted when a real backend provider is configured; deterministic generation remains the default and fallback.

Track 9B adds deterministic Smart Contract Artifact preview, spec-consistency check result, and evidence-lite linkage from the Track 9A spec. It remains preview-only: no Solidity compilation, OpenZeppelin install, wallet signing, deployment, fake contract address, transaction hash, or audit claim.

Track 10A adds a local-only Hardhat compile/test foundation for one restricted ERC-20-compatible fixture. Use `npm run contracts:build` and `npm run test:contracts` for contract compile/tests. These commands do not deploy, sign wallets, configure mainnet, create contract addresses, create transaction hashes, or produce audit claims.

The wallet adapter and Sepolia signing design use a MetaMask-first minimal EIP-1193 browser-provider boundary, with viem reserved for typed chain/account/contract primitives where useful. Backend private-key custody remains out of scope.

Track 13B adds the minimal frontend-only wallet connection foundation. The central Engineering Bot workflow can request accounts from an injected EIP-1193 provider, display a returned wallet address only after connection, and distinguish Sepolia from wrong-chain, rejected, unsupported, and provider-error states. It does not sign, prepare transactions, submit transactions, deploy, persist wallet state, show contract addresses or transaction hashes, unlock SCP operations, or add backend wallet routes.

The unsigned deployment intent read model consumes existing gate/signing/wallet/artifact/compile-test readiness and can mark a Sepolia deployment intent as review-ready, but it does not create an executable transaction, request a wallet signature, submit a transaction, deploy a contract, show a transaction hash, show a contract address, or unlock SCP operations by itself.

Track 14B adds the first wallet-signed Sepolia deployment path. The central Engineering Bot workflow can request a contract-creation transaction from the connected browser wallet after re-checking the selected account and Sepolia chain. Transaction hash appears only after the provider returns it, contract address appears only after the receipt confirms contract creation, and deployment state remains local-session-only. SCP operations remain locked.

Deployment evidence/readiness is derived from local-session deployment state. It distinguishes no evidence, provider transaction-hash evidence, and confirmed receipt evidence. It does not add a new deployment mechanism, backend route, persistence, mainnet, audit claim, or broad SCP operation controls.

The first narrow SCP wallet-signed operation is Record NAV Event. The operation calls `recordValuation(uint256,string)` only after confirmed receipt-derived deployment evidence, a valid non-zero receipt-returned contract address, and a connected Sepolia wallet exist. The operation transaction hash appears only after provider return, receipt/event evidence appears only after provider receipt/log response, and operation evidence remains local-session-only.

The second narrow SCP wallet-signed operation is Whitelist Wallet. The operation calls `setWalletAllowed(address,bool)` with `allowed = true` only after confirmed receipt-derived deployment evidence, a valid explicit non-zero target wallet address, and a connected Sepolia wallet exist. It does not claim issuer authorization, KYC approval, investor eligibility, audit approval, production readiness, or durable evidence storage. Allocation/Mint, burn, pause, distribution, transfer, and role-admin operations remain locked.

Next implementation work should make the visual tabs functional in sequence: shared lifecycle state, Investor Registry, Subscription parameters, Redemption parameters, subscription-redemption template handoff, then Allocation/Mint.

The frontend chat client also defaults to `http://127.0.0.1:5174`. Override it for local testing with:

```bash
VITE_MILA26_API_BASE_URL=http://127.0.0.1:5174 npm run dev
```

Backend-only LLM configuration defaults to deterministic mock mode:

```bash
MILA26_LLM_PROVIDER=mock
MILA26_LLM_MODEL=mila26-mock-model
MILA26_LLM_TIMEOUT_MS=30000
MILA26_LLM_MAX_OUTPUT_TOKENS=2000
```

OpenAI mode is backend-only and opt-in:

```bash
MILA26_LLM_PROVIDER=openai
MILA26_LLM_MODEL=gpt-5-mini # example only; choose a model enabled for your account
OPENAI_API_KEY=...
```

`MILA26_LLM_MODEL` is required when `MILA26_LLM_PROVIDER=openai`. MILA26 does not hardcode an OpenAI runtime default; choose a model available to the backend operator's OpenAI account before starting the API.

Do not use `VITE_` variables for LLM provider config or secrets. Track 6C wires the Blockchain Engineering Bot route to the backend-only LLM boundary, and Track 6E wires the Engineering Brief route to the same backend-only boundary. Mock mode remains deterministic by default, and provider errors fall back to deterministic behavior.

Run checks:

```bash
npm run check
npm run test:e2e
```

## Architecture and Rewrite Guidance

- Agent operating rules: [`AGENTS.md`](AGENTS.md)
- MVP user journey: [`docs/product/mvp-user-journey.md`](docs/product/mvp-user-journey.md)
- MVP scope: [`docs/product/mvp-scope.md`](docs/product/mvp-scope.md)
- UI/UX vision: [`docs/product/ui-ux-vision.md`](docs/product/ui-ux-vision.md)
- UX vision: lifecycle workspace mockup direction captured in the current UI and [`docs/product/ui-ux-vision.md`](docs/product/ui-ux-vision.md); the older [`docs/assets/ux/mila26_dashboard_v2.png`](docs/assets/ux/mila26_dashboard_v2.png) remains historical reference only.
- MVP screen flow: [`docs/product/mvp-screen-flow.md`](docs/product/mvp-screen-flow.md)
- Current context pack: [`docs/context-pack/`](docs/context-pack/)
- Contract reference: [`docs/contracts/README.md`](docs/contracts/README.md)
- MVP API contract index: [`docs/contracts/mvp-api-contracts.md`](docs/contracts/mvp-api-contracts.md)
- Engineering principles: [`docs/architecture/engineering-principles.md`](docs/architecture/engineering-principles.md)
- Architecture guardrails: [`docs/architecture/architecture-guardrails.md`](docs/architecture/architecture-guardrails.md)
- Backend/API boundary: [`docs/architecture/backend-api-boundary.md`](docs/architecture/backend-api-boundary.md)
- API response conventions: [`docs/architecture/api-response-conventions.md`](docs/architecture/api-response-conventions.md)
- Blockchain Engineer chat MVP: [`docs/architecture/blockchain-engineer-chat-mvp.md`](docs/architecture/blockchain-engineer-chat-mvp.md)
- Frontend chat integration plan: [`docs/architecture/frontend-chat-integration.md`](docs/architecture/frontend-chat-integration.md)
- Frontend UX architecture: [`docs/architecture/frontend-ux-architecture.md`](docs/architecture/frontend-ux-architecture.md)
- Frontend component plan: [`docs/architecture/frontend-component-plan.md`](docs/architecture/frontend-component-plan.md)
- Backend LLM boundary: [`docs/architecture/backend-llm-boundary.md`](docs/architecture/backend-llm-boundary.md)
- MVP stack decisions: [`docs/architecture/mvp-stack-decisions.md`](docs/architecture/mvp-stack-decisions.md)
- Alpha demo boundary: [`docs/architecture/alpha-demo-boundary.md`](docs/architecture/alpha-demo-boundary.md)
- Wallet adapter and Sepolia signing design: [`docs/architecture/wallet-adapter-sepolia-design.md`](docs/architecture/wallet-adapter-sepolia-design.md)
- Wallet-signed deployment: [`docs/architecture/wallet-signed-deployment.md`](docs/architecture/wallet-signed-deployment.md)
- Agent orchestration MVP: [`docs/architecture/agent-orchestration-mvp.md`](docs/architecture/agent-orchestration-mvp.md)
- MVP memory design: [`docs/architecture/memory-design-mvp.md`](docs/architecture/memory-design-mvp.md)
- MVP track plan: [`docs/architecture/mvp-track-plan.md`](docs/architecture/mvp-track-plan.md)
- Rewrite strategy: [`docs/architecture/rewrite-strategy.md`](docs/architecture/rewrite-strategy.md)
- Future stack considerations: [`docs/architecture/future-stack-considerations.md`](docs/architecture/future-stack-considerations.md)

## Security Defaults

- No secrets are committed.
- No API keys, seed phrases, or private keys are accepted into chat.
- Wallet-signed Sepolia deployment is frontend-only through the connected browser wallet; backend-held signing keys and mainnet deployment remain disabled.
- Generated code and model output are rendered as text, not raw HTML.

## Legacy Policy

The previous MILA dashboard repo is reference-only. Do not copy its history, hardcoded proxy files, debug HTML sandboxes, giant HTML entrypoints, or browser secret storage into this repo.
