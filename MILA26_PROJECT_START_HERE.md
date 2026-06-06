# MILA26 Project Start Here

## What MILA26 Is

MILA26 is an AI tokenisation workspace for asset managers who want to turn a financial product into a testnet-ready tokenised product without knowing the full smart-contract path upfront.

The current product direction is a guided lifecycle workspace: the user explains the product and intended investor flows in plain language, the Engineering Bot structures the requirements across the full lifecycle, and the app turns approved parameters into smart-contract artifacts, wallet-signed Sepolia operations, and local-session evidence.

The target product flow is:

- define the financial product and investor rules.
- register up to 50 whitelisted investor wallet addresses.
- configure stablecoin subscription parameters.
- configure redemption parameters, including a delay between token receipt and stablecoin payout.
- generate or configure the subscription-redemption smart-contract template.
- service the asset with NAV and investor update events.
- redeem outstanding tokens at maturity.
- preserve wallet-signed evidence without implying production audit, custody, legal approval, or mainnet readiness.

## Current Implemented Capabilities

- Lifecycle workspace UI with MILA26 branding, dark left rail, top project bar, visual stage tabs, large Engineering Bot answer area, next best actions, passive right rail, Product Vault, lifecycle snapshot, and SCP below the AI surface.
- Shared frontend presentation model in `src/domain/workspacePresentation.ts` so stage status, capability status, vault artifacts, recent activity, and lifecycle snapshot are not hardcoded independently in each visual area.
- Requirement Brief, Engineering Brief, Smart Contract Artifact Spec, deterministic artifact preview, check result, evidence-lite, and local compile/test read models.
- MetaMask-first wallet connection and Sepolia verification.
- User-wallet-signed Sepolia deployment path with real transaction hash and contract address only after real provider execution.
- Deployment evidence/readiness derived from wallet-signed deployment status.
- First wallet-signed SCP operation: Record NAV Event.
- Second wallet-signed SCP operation: Whitelist Wallet.
- Third wallet-signed SCP operation: Allocation / Mint for a selected whitelisted investor wallet after coherent registry/subscription/allocation parameters.
- Shared lifecycle state for investor registry, subscription, redemption, allocation/mint readiness, and maturity placeholders.
- Investor Registry tab for up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, SCP whitelist target handoff, and Allocation/Mint handoff.
- Test Wallet Lab prototype for generating up to 50 labelled test investor wallets, populating the Investor Registry, and explicitly preparing a test-only private-key export for selected MetaMask demo actors.
- Subscription tab for permitted stablecoins, subscription window, minimum subscription, payment wallet/contract address, and payment per token with shared lifecycle validation.
- Redemption tab for redemption window/date, redemption wallet, payout stablecoin, payout per token, and delay unit/duration with shared lifecycle validation.
- Subscription-redemption template handoff surface that derives draft/ready status from current subscription and redemption parameters.

## Current Architecture Principles

- Stable contracts, flexible intelligence.
- Minimal necessary complexity.
- Local Mac laptop MVP first.
- Backend-only LLM calls and secrets.
- User wallet signs deployment and operations; backend never holds private keys.
- Sepolia/testnet-only MVP.
- Lifecycle tabs are visual navigation only. They must not become hard code boundaries or isolated state silos.
- The Engineering Bot should have cross-stage context and recommend next actions across requirements, investor registry, subscription, smart contract, asset servicing, redemption, maturity, and evidence.
- Contract changes must update docs, fixtures, schemas/types, runtime consumers/producers, and tests together.

## Current UX Direction

The active UX direction is the lifecycle workspace mockup provided by the user and implemented directionally in the app:

- left rail for project and engineering navigation.
- top bar for product, network, wallet, guided/expert mode, and safety status.
- visual tabs for `Overview`, `Requirements`, `Investor Registry`, `Subscription`, `Smart Contract`, `Asset Servicing`, `Redemption`, `Maturity`, and `Evidence`.
- center column led by the Engineering Bot, with readable AI answers and suggested next actions.
- right rail limited to passive status, Product Vault, capability status, recent activity, and evidence status.
- SCP below the Engineering Bot for wallet-signed operations.

Avoid exposing internal implementation labels such as track numbers to users. Track labels may remain in internal roadmap documents only.

## MVP Scope Direction

The latest mockup direction and the user-stated lifecycle intent are within MVP scope. This includes the company/product intro website, controlled access/login path, guided lifecycle workspace, investor registry, subscription/redemption parameter capture, subscription-redemption template handoff, Sepolia wallet-signed workflow, asset servicing, maturity/evidence surfaces, and production-readiness gates.

MVP scope does not mean every item is already implemented. It means new coding tracks must preserve a coherent path toward these flows rather than treating them as optional later product ideas.

## Immediate Next Step

Harden the working Sepolia operation surfaces, then implement the next operation slice only after the review surface remains stable.

The next coding track should add:

- browser/screenshot polish for Investor Registry, Subscription, Redemption, Allocation/Mint execution, and the Smart Contract tab.
- the next wallet-signed operation scope without broadening SCP controls before its adapter, ABI gate, authorization gate, and evidence path exist.
- UX polish for parameter panels, edit states, and validation messages based on browser screenshots.
- persistence/access design so website/login work does not create a second lifecycle state model.
- website/access continuation from `docs/product/website-mvp-brief.md`.

The two-week prototype target is a working local/Sepolia prototype, not a static mockup. Implemented screens must validate inputs, persist state during the session, update dependent tabs/statuses/artifacts, and pass focused tests.

Do not build broad SCP execution before each operation has browser coverage, focused tests, a wallet adapter, an ABI gate, authorization checks, and an evidence contract.

## Files To Read Next

- `AGENTS.md`
- `docs/handover/00-mila26-current-checkpoint.md`
- `docs/handover/03-mila26-track-status.md`
- `docs/handover/04-mila26-next-prompts.md`
- `docs/handover/08-delivery-role-skills.md`
- `docs/product/ui-ux-vision.md`
- `docs/product/mvp-user-journey.md`
- `docs/product/allocation-mint-scope.md`
- `docs/product/mvp-screen-flow.md`
- `docs/product/quality-assurance.md`
- `docs/product/website-mvp-brief.md`
- `docs/production/production-readiness-plan.md`
- `docs/architecture/frontend-ux-architecture.md`
- `docs/architecture/frontend-component-plan.md`
- `src/domain/workspacePresentation.ts`
- `src/App.tsx`
- `src/styles.css`

## Do Not Do Yet

- No mainnet deployment.
- No backend-held private keys.
- No custody operations.
- No production legal, tax, accounting, regulatory, KYC/AML, or audit claims.
- No durable persistence/evidence storage until the lifecycle state shape is stable.
- No subscription or redemption transaction execution before the parameter model and template handoff are coherent.
- No batch allocation/mint, subscription execution, or redemption execution before the single-operation gates and evidence path are proven.
- No per-tab state silos.
- No broad UI redesign that reduces Engineering Bot readability or moves workflow decisions into the passive right rail.
