# MILA26 MVP User Journey

Use this document as the primary UX brief for MILA26's current lifecycle workspace.

## Product Narrative

MILA26 helps an asset manager tokenise a financial product without needing to know the full blockchain workflow upfront. The user explains the product intent; the Engineering Bot structures the lifecycle across product setup, investor wallets, subscription, contract operations, asset servicing, redemption, maturity, and evidence.

The alpha path remains a restricted ERC-20-compatible tokenised fund unit contract, MetaMask/injected EIP-1193 wallet connection, Ethereum Sepolia deployment, and a small number of wallet-signed operations.

## Primary User Intent

The user wants to:

- tokenise a financial product;
- distribute the tokenised product to no more than 50 investors;
- whitelist investor wallet addresses;
- allow subscription via permitted stablecoins;
- support redemption with a configurable delay between token receipt and stablecoin payout;
- record and push product information such as NAV, valuation, investment information, and corporate actions;
- redeem outstanding tokens at maturity;
- keep evidence of wallet-signed actions.

This full user intent, together with the latest mockup-driven lifecycle workspace, is MVP scope. MVP implementation may stage the work through parameter capture, template handoff, wallet-signed Sepolia operations, and locked future states, but the product architecture must support the complete lifecycle.

## Core UX Thesis

MILA26 uses a three-region workspace with a top lifecycle tab strip.

### Left Rail

The left rail is navigation:

- active product project, e.g. `Alpha Income Fund I`;
- project list, e.g. `Singapore REIT Token`, `Mixed Portfolio Token`;
- Overview, All Projects, Templates, Knowledge Base, Activity Log;
- Engineering Bot, Smart Contract Lab, Deployments, Evidence Vault;
- Product Setup summary.

It should not become a dense workflow dashboard.

### Center Workspace

The center is the AI decision surface:

- user intent;
- Engineering Bot answer for implementation/workflow decisions;
- Advisor mode answer for plain-language Q&A in the same shared context;
- structured sections;
- next best action;
- suggested action buttons;
- lifecycle snapshot;
- generated artifacts below the AI surface when relevant.

The Engineering Bot has cross-stage context even when the user is looking at a single tab.

### Right Rail

The right rail is passive context:

- Workspace Status;
- Capability Status;
- Product Vault;
- Recent Activity;
- safety note.

It must not contain workflow, wallet, deploy, or operation buttons.

## Lifecycle Tabs

Tabs are visual separation for the user, not code separation.

1. Overview - current workspace and Engineering Bot response.
2. Product Setup - product objectives, investor rules, NAV assumptions, servicing assumptions.
3. Investor Wallets - up to 50 whitelisted wallet addresses.
4. Subscription - permitted stablecoins, windows, minimums, payment per token.
5. Contract Ops - wallet-signed deployment and released contract operations.
6. Asset Servicing - NAV and future investor updates.
7. Redemption - redemption wallet, delay, payout rules.
8. Maturity - final token closeout.
9. Evidence Vault - local-session evidence, durable evidence records, and generated artifacts.

## Current Implemented Journey

### 1. Overview / AI Intake

User describes the product intent in plain language.

Engineering Bot responds with:

- what MILA26 understands;
- what this means for the tokenisation lifecycle;
- inputs needed;
- next best action.

### 2. Requirement Brief

User creates a Requirement Brief from the Engineering Bot workspace.

Current output:

- structured requirement artifact;
- product assumptions;
- investor access assumptions;
- deployment boundary;
- open items.

### 3. Engineering Brief

User generates an Engineering Brief from the Requirement Brief.

Current output:

- architecture assumptions;
- contract approach;
- wallet/private-key boundary;
- testnet-only deployment path;
- risks, controls, and acceptance criteria.

### 4. Smart Contract Preparation / Contract Ops

User prepares the Smart Contract Artifact Spec and deterministic preview package, then uses Contract Ops for wallet-signed operations once gates are satisfied.

Current output:

- restricted ERC-20-compatible spec;
- deterministic artifact preview;
- spec-consistency check result;
- Evidence-Lite linkage;
- known local compile/test representation;
- deployment gate and wallet signing intent surfaces.

### 5. Wallet Connection

User connects MetaMask/injected EIP-1193 wallet.

Current output:

- provider detected / not detected;
- connected wallet address only after user connection;
- Sepolia / wrong chain / rejected / provider error states.

Wallet connection is not signing, deployment, or transaction execution.

### 6. Wallet-Signed Sepolia Deployment

User deploys through their connected browser wallet after gates pass.

Current output:

- transaction hash only after provider return;
- contract address only after successful receipt;
- local-session deployment evidence.

### 7. Asset Servicing: Record NAV

After confirmed deployment evidence, user can submit a wallet-signed Record NAV Event from Contract Ops.

Current output:

- operation transaction hash only after provider return;
- operation receipt/event evidence only after provider/receipt response;
- local-session operation evidence.

### 8. Investor Wallets And Whitelist Wallet

The user can register up to 50 investor wallet addresses in the Investor Wallets tab. The tab validates wallet format,
flags duplicates, tracks local-session whitelist status, and hands valid rows into the Contract Ops Whitelist Wallet operation.
After confirmed deployment evidence, the user can submit a wallet-signed whitelist operation for the selected target
wallet address.

Current output:

- investor wallet registry rows, validation messages, and local-session whitelist status;
- `setWalletAllowed(address,bool)` with `allowed = true`;
- transaction/receipt/event evidence from provider/receipt response;
- local-session operation evidence.

## Current Roadmap Gaps

The UI should show these as parameters needed, needs-review, or unavailable with explicit prerequisites:

- durable investor registry persistence;
- subscription-redemption smart-contract template implementation beyond local-session handoff;
- live stablecoin subscription execution;
- live redemption wallet receipt and payout workflow;
- batch allocation/mint and production-grade allocation reporting;
- investor communication/asset-servicing update push;
- maturity closeout;
- durable Evidence Vault persistence.

## Next Implementation Sequence

Prefer this sequence before broadening operations:

1. Start website/access work without duplicating app lifecycle state.
2. Add durable investor registry and lifecycle persistence after the local-session shape is stable.
3. Add durable evidence persistence after the local-session evidence shape is stable.
4. Design subscription-redemption execution adapters and evidence contracts before live stablecoin movement.
5. Add maturity closeout once subscription/redemption/mint flows are proven.

Production-readiness planning for website, login, beta operations, persistence, security, observability, and release gates is tracked in `docs/production/production-readiness-plan.md`.

## User Experience Rules

- Do not expose internal track numbers in the product UI.
- Left rail is navigation.
- Center workspace is AI-first and decision-oriented.
- Right rail is passive.
- Engineering Bot replies should be readable and body-sized.
- Conversation history stays visible in the local session.
- Contract Ops is the home for wallet-signed post-deployment operations.
- Wallet connection is not signing.
- Signing intent is not transaction execution.
- Deployment/operation evidence is local-session-only until persistence is implemented.
- Local compile/test is not deployment or audit approval.

## Guardrails

- Backend never holds user private keys.
- User wallet signs deployment and operations.
- Mainnet disabled.
- Sepolia/testnet only for alpha.
- No fake wallet address.
- No fake transaction hash.
- No fake contract address.
- No fake deployed, signed, live, audited, verified, production-ready, or mainnet-ready status.
- No KYC, investor eligibility, legal approval, compliance approval, or issuer authorization claim unless explicitly verified by a future capability.
- Real-world investor identities stay off-chain by default.
