# Frontend Component Plan

This is a practical roadmap for future UI implementation. It does not require immediate refactoring.

## 1. App Shell Components

Components:

- `AppShell`.
- `Sidebar`.
- `TopProjectBar`.
- `RightProjectPanel`.
- `CollapseRail`.

Purpose: establish the enhanced ChatGPT-style workspace with project folders, current project context, visible status, and collapsible side panels.

Likely data needed: current project name, route/view state, protocol, network, wallet status, active services, panel collapsed state.

Backend/API dependency: project summary later; none required for initial static shell.

Implementation timing: UX Track C.

What not to overbuild: no full router/sidebar permission model before project state exists.

## 2. Chat Components

Components:

- `ChatWorkspace`.
- `ChatMessageList`.
- `ChatInput`.
- `ChatErrorBanner`.
- `ChatLoadingState`.

Purpose: connect the user to the Blockchain Engineering Bot and render safe conversation turns.

Likely data needed: chat messages, pending state, validation errors, current project/run IDs, request focus.

Backend/API dependency: `POST /api/chat/blockchain-engineer`; `ChatMessage`, `BlockchainEngineerChatRequest`, `BlockchainEngineerChatResponse`.

Implementation timing: UX Track B / Track 3C frontend integration.

What not to overbuild: no streaming, persistence, markdown renderer, or multi-agent chat UI until needed.

## 3. Requirement Components

Components:

- `RequirementCards`.
- `RequirementCard`.
- `RequirementDrawer`.
- `ProtocolChoicePanel`.
- `WhitelistPanel`.
- `AllocationRulePanel`.
- `ValuationUpdatePanel`.

Purpose: turn chat outputs into structured, reviewable requirements and focused editing flows.

Likely data needed: suggested requirement updates, selected protocol, whitelist count, allocation rule, valuation update requirement, confidence/rationale.

Backend/API dependency: chat suggested updates now; PRD/requirement update routes later.

Implementation timing: UX Track D.

What not to overbuild: no generic form-builder or rules engine.

## 4. Project Status Components

Components:

- `ProjectStatusTimeline`.
- `AgentProgressPanel`.
- `DeploymentGateCard`.
- `NextActionCard`.

Purpose: show workflow position, active gates, worker progress, and the next recommended action.

Likely data needed: PRD approval state, task statuses, security/QA status, deployment readiness, evidence readiness.

Backend/API dependency: later orchestration, security, deployment, and evidence routes.

Implementation timing: UX Track E.

What not to overbuild: no queue monitor or production observability UI before backend runs exist.

## 5. Future Components

Components:

- `WalletStatusBadge`.
- `ServicesCartIcon`.
- `EvidencePackPanel`.
- `ValuationUploadPanel`.
- `InvestorAllocationTable`.

Purpose: support wallet-signed testnet flows, future services, evidence export, valuation upload, and investor allocation.

Likely data needed: wallet connection state, service selections, evidence pack, valuation summary, investor wallet records, allocation percentages.

Backend/API dependency: wallet/testnet integration, evidence, valuation, and allocation routes later.

Implementation timing: UX Track F and UX Track G.

What not to overbuild: no payment logic, custody, mainnet controls, investor portal, or production audit workflow yet.
