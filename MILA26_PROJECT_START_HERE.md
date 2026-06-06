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
- Shared lifecycle state for investor registry, subscription, redemption, and maturity placeholders.
- Investor Registry tab for up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, and SCP whitelist target handoff.

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

## Immediate Next Step

Implement Subscription and Redemption parameter capture before building allocation/mint.

The next coding track should add:

- permitted stablecoin parameter capture.
- subscription window, minimum subscription amount, payment wallet/contract address, and payment per token.
- redemption window/date, redemption wallet, payout stablecoin, payout per token, and redemption delay unit/duration.
- shared lifecycle read-model validation for subscription and redemption parameters.
- Product Vault, lifecycle snapshot, and Engineering Bot next-action updates from the same shared lifecycle state.
- focused tests proving subscription/redemption data is parameter/spec work only, not live stablecoin execution.

After that, build subscription-redemption template handoff and only then allocation/mint.

## Files To Read Next

- `AGENTS.md`
- `docs/handover/00-mila26-current-checkpoint.md`
- `docs/handover/03-mila26-track-status.md`
- `docs/handover/04-mila26-next-prompts.md`
- `docs/handover/08-delivery-role-skills.md`
- `docs/product/ui-ux-vision.md`
- `docs/product/mvp-user-journey.md`
- `docs/product/mvp-screen-flow.md`
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
- No allocation/mint before Investor Registry and subscription parameters are implemented.
- No per-tab state silos.
- No broad UI redesign that reduces Engineering Bot readability or moves workflow decisions into the passive right rail.
