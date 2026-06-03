# MILA26 MVP User Journey

Use this document as the primary ChatGPT working brief when designing MILA26's UX/UI flow.

It is product-facing on purpose. It should help shape user journeys, screen flows, navigation, labels, and dashboard information hierarchy before those decisions become Codex implementation tracks.

## How To Use This With ChatGPT

Paste this file into ChatGPT when exploring UX/UI flow changes and ask for:

- a user journey map for the asset-manager workflow;
- screen-by-screen information hierarchy;
- left rail / center workspace / right rail responsibilities;
- copy and label refinements;
- low-fidelity dashboard flow options;
- risk review for confusing, repetitive, or over-engineered UX;
- Codex-ready implementation prompts after the journey is settled.

Good ChatGPT prompt starter:

```text
Using this MILA26 MVP User Journey, propose a clean AI workspace UX flow.
Focus on the asset manager's journey from project selection to requirement brief,
engineering brief, Sepolia deployment, and gated SCP operations.
Reduce repetitive dashboard state, keep the left rail as project navigation,
keep the center as the decision workspace, and keep the right rail as passive
project artifacts/status. Do not introduce persistence, mainnet, backend keys,
or broad redesign beyond the scoped UX flow.
```

## Product Narrative

MILA26 helps an asset manager move from tokenisation intent to a controlled blockchain-functional alpha path.

The alpha direction is a restricted ERC-20-compatible tokenised fund unit contract, with MetaMask and Ethereum Sepolia as the first wallet/testnet execution path.

The app should feel like a professional AI project workspace, not a generic dashboard and not a crypto trading app. Chat is the starting point, but important decisions must become structured project artifacts, status panels, gates, and SCP controls.

## Primary User

The primary alpha user is an asset manager or product operator preparing a tokenised portfolio product.

They need to:

- create or select a project workspace;
- explain the intended fund/tokenisation product in plain language;
- turn the intent into a Requirement Brief and Engineering Brief;
- understand blockers, assumptions, and safety boundaries;
- prepare and review smart-contract artifacts;
- connect a browser wallet on Sepolia;
- deploy using their own wallet;
- perform a small number of wallet-signed SCP operations;
- avoid any impression that mainnet, legal approval, audit approval, or investor eligibility is complete.

## Core UX Thesis

MILA26 should use a three-region workspace:

1. **Left rail: project navigation**
   - Shows project folders such as `usequities`, `sgequities`, and `mixedportfolio`.
   - Clicking a project changes the active project context.
   - `Project workspace` shows the directory of all projects.
   - It should not repeat stage-progress explanations that already appear elsewhere.

2. **Center workspace: Engineering Bot decision surface**
   - Main place for the conversation, current task, project workflow, and active action buttons.
   - Engineering Bot helps the user progress from brief to artifact to deployment.
   - Before SCP operations, active lifecycle decisions belong here.
   - After deployment, operation-specific controls belong primarily in SCP.

3. **Right rail: passive artifacts and status**
   - Shows linked project documents, artifacts, evidence, and passive safety state for the selected project.
   - On `Project workspace`, it should simply explain that project artifacts and documents appear here after selecting a project.
   - It must not contain workflow buttons.

## Current Dashboard Problems To Avoid

These are explicit UX risks observed during the current dashboard review:

- Repeating Step 1 / workflow state across left rail, top cards, and right rail.
- Fragmenting project context across too many surfaces.
- Showing status cards that do not explain what the user should do next.
- Making the left rail behave like stage progress instead of project navigation.
- Making the right rail feel empty or repetitive instead of artifact/status-oriented.
- Showing large, dense bot replies without readable paragraph/list structure.
- Using oversized bold typography for bot replies.
- Adding "need help" prompts where the Engineering Bot is already the main workspace.

## Desired Project Workspace Journey

### 1. Project Directory

User lands on `Project workspace`.

Left rail:

- `Project workspace`
- `usequities`
- `sgequities`
- `mixedportfolio`

Center workspace:

- Explains that the user should select or create a project folder.
- Shows the Engineering Bot decision workspace.
- Avoids showing repetitive stage cards.

Right rail:

- Shows a short empty-state sentence:
  - `Select a project folder to view its linked documents and artifacts for download.`

### 2. Project Selection

User clicks a project folder, for example `usequities`.

Center workspace:

- Shows the selected project name and current workflow.
- Engineering Bot continues the conversation in that project context.
- Current action is clear, for example:
  - `Create Requirement Brief`
  - `Generate Engineering Brief`
  - `Prepare Smart Contract Spec`
  - `Connect Wallet`
  - `Deploy to Sepolia with Wallet`

Right rail:

- Shows linked artifacts for that project:
  - Requirement Brief
  - Engineering Brief
  - Smart Contract Artifact Spec
  - Deployment Evidence
  - Operation Evidence
- Shows download/open affordances only where an artifact exists.
- Shows passive safety boundary:
  - Sepolia/testnet only
  - backend never holds private keys
  - evidence local-session-only where applicable

### 3. Requirement Brief Journey

User describes the tokenised portfolio goal.

Engineering Bot should:

- reply in readable structured sections;
- avoid dense wall-of-text;
- avoid all-bold body copy;
- keep copy at normal chat/body size;
- generate a Requirement Brief draft;
- clear the input box after response;
- preserve visible local-session conversation history for reference.

The user should be able to review and approve the brief before downstream artifacts unlock.

### 4. Engineering Brief Journey

After the Requirement Brief is approved, user generates the Engineering Brief.

The Engineering Brief should summarize:

- architecture assumptions;
- contract approach;
- off-chain responsibilities;
- wallet/private-key boundary;
- testnet-only deployment path;
- risks and blockers.

The UI should show the artifact in the project right rail and the next action in the center workspace.

### 5. Smart Contract Artifact Journey

After planning readiness, user prepares the smart-contract artifact spec and preview package.

The UI must clearly distinguish:

- preview/spec artifact;
- local compile/test representation;
- deployment gate;
- wallet signing intent;
- actual wallet-signed deployment.

Do not use labels that imply deployed, live, audited, verified, or production-ready status before real provider/receipt evidence exists.

### 6. Wallet Connection Journey

User connects MetaMask/injected EIP-1193 wallet.

The UI may show:

- provider detected / not detected;
- connected wallet address only after real user connection;
- Sepolia / wrong chain;
- rejected / provider error states.

The UI must still say:

- wallet connection is not signing;
- wallet connection is not deployment;
- no transaction hash exists;
- no contract address exists.

### 7. Wallet-Signed Sepolia Deployment Journey

User deploys from the central Engineering Bot workflow surface after all deployment gates pass.

The UI may show:

- `Deployment submitted to Sepolia` after provider returns a transaction hash;
- `Transaction hash` only from the provider;
- `Contract address` only after receipt confirms contract creation;
- `Deployment Evidence: Local session only`.

The UI must not imply durable evidence storage until a later persistence/evidence track.

### 8. SCP Operation Journey

After confirmed deployment evidence, SCP becomes the primary place for operation-specific controls.

Current operation controls after Track 15B:

- `Record NAV Event`
- `Whitelist Wallet`

Other operations remain locked or absent:

- Allocation/Mint
- Burn
- Pause/Unpause
- Distribution
- Transfer
- Role administration

SCP operation controls must be gated by:

- connected wallet;
- Sepolia chain;
- confirmed receipt-derived deployment evidence;
- valid contract address;
- operation-specific input validation;
- explicit user action.

The app must not claim wallet authorization, KYC approval, investor eligibility, legal approval, audit approval, or production readiness unless a future track explicitly verifies that.

## Current Implemented Journey

1. **Requirement Brief**
   - User works with the Engineering Bot to create a structured Requirement Brief.
   - Output: approved requirement artifact and assumptions.

2. **Engineering Brief**
   - User generates an Engineering Brief from the Requirement Brief.
   - Output: engineering plan, risks, open questions, and next action.

3. **Project Closure / Open Items**
   - System derives closure readiness and open-item blockers.
   - Output: closure/readiness summary for cockpit surfaces.

4. **Smart Contract Artifact Spec**
   - User triggers Prepare Smart Contract Spec after lifecycle readiness allows it.
   - Output: restricted ERC-20-compatible spec with token profile, functions, events, policies, and safety boundaries.

5. **Artifact Preview / Check / Evidence-Lite**
   - Backend generates deterministic preview-only artifact package, spec-consistency check result, and Evidence-Lite.
   - Output: preview artifacts and traceability without claiming compile/deploy/audit.

6. **Local Compile/Test Representation**
   - App surfaces the known local Hardhat compile/test result for the restricted ERC-20-compatible fixture.
   - Output: local compile/test passed status while still not deployed, signed, or audited.

7. **Deployment Gate**
   - System shows whether planning/artifact/check/evidence/compile-test prerequisites are complete.
   - Output: Deployment Gate Review can become review-ready, but deployment execution remains blocked.

8. **Wallet Signing Intent**
   - System shows what must be reviewed before future wallet signing.
   - Output: signing intent can become review-ready, but wallet execution remains separate.

9. **Wallet Connection + Sepolia Check**
   - User connects MetaMask/injected EIP-1193 wallet.
   - Output: connected wallet address appears only after user connection, Sepolia/wrong-chain/rejected/provider-error states are visible, and signing/deployment remain gated.

10. **Unsigned Deployment Intent**
    - System prepares a review-only unsigned deployment intent after the gate, wallet intent, wallet connection, Sepolia, artifact, and compile/test prerequisites are coherent.
    - Output: intent can become review-ready, but it does not sign or deploy by itself.

11. **Wallet-Signed Sepolia Deployment**
    - User requests deployment from the central Engineering Bot workflow surface.
    - Output: transaction hash appears only after the wallet/provider returns it; contract address appears only after a successful receipt confirms contract creation.

12. **Deployment Evidence / Readiness**
    - System derives local-session deployment evidence from the wallet-signed deployment state.
    - Output: evidence strength distinguishes none, provider transaction hash, and confirmed receipt. Evidence persistence remains local-session-only.

13. **Record NAV Event**
    - User can submit a wallet-signed Record NAV Event operation from SCP after deployment evidence is confirmed.
    - Output: operation transaction hash and receipt/event evidence remain provider/receipt-derived and local-session-only.

14. **Whitelist Wallet**
    - User can submit a wallet-signed `setWalletAllowed(address,bool)` operation with `allowed = true`.
    - Output: whitelist transaction hash and receipt/event evidence remain provider/receipt-derived and local-session-only.

## Next Journey Stage

The next blockchain capability track is likely **Track 15C - Allocation/Mint Operation**, unless the team chooses a short UX/UI cleanup track first to improve the dashboard before adding more operation controls.

If the dashboard remains confusing, prefer a bounded UX/UI flow track before wiring allocation/mint. That UX track should clean the workspace layout and information hierarchy without changing blockchain execution behavior.

## User Experience Rules

- Left rail is project navigation, not a duplicate stage-progress panel.
- Center workspace is the Engineering Bot decision surface.
- Right rail is passive artifact/status context.
- Engineering Bot replies should be readable, structured, and body-sized.
- Conversation history should remain visible within the local session.
- Project artifacts should be grouped by selected project.
- SCP is the primary home for post-deployment operation controls.
- Right rail must not contain workflow buttons.
- Wallet connection is not signing.
- Signing intent is not transaction execution.
- Deployment evidence is local-session-only until a later persistence/evidence track.
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
- No KYC, investor eligibility, legal approval, compliance approval, or issuer authorization claim unless explicitly verified by a future track.
- Real-world names stay off-chain by default.
