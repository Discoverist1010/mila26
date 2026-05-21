# MVP Screen Flow

## 1. Project Home / New Tokenisation Project

- User goal: create or reopen an asset-manager project.
- Primary UI components: left sidebar project folders, new project button, top project bar.
- Backend/API dependency: later `/api/projects`.
- Data contracts involved: `FundFacts`, future project summary contract.
- MVP status: next.
- What not to overbuild yet: no multi-tenant project management or enterprise permissions.

## 2. Blockchain Engineering Bot Chat

- User goal: discuss tokenizing a portfolio and clarify requirements.
- Primary UI components: `ChatWorkspace`, `ChatMessageList`, `ChatInput`, loading/error states.
- Backend/API dependency: `POST /api/chat/blockchain-engineer`.
- Data contracts involved: `ChatMessage`, `BlockchainEngineerChatRequest`, `BlockchainEngineerChatResponse`.
- MVP status: backend current, frontend integration next.
- What not to overbuild yet: no real LLM, streaming, vector memory, or multi-agent debate.

## 3. Extracted Requirements Cards

- User goal: see chat decisions turned into structured, reviewable requirements.
- Primary UI components: `RequirementCards`, `RequirementCard`.
- Backend/API dependency: chat response suggested updates now; PRD generation later.
- Data contracts involved: `SuggestedRequirementUpdate`, future PRD/requirement draft contracts.
- MVP status: next.
- What not to overbuild yet: no full rules engine or complex configurator.

## 4. Requirement Sub-action Drawer

- User goal: edit a focused requirement without losing chat/project context.
- Primary UI components: `RequirementDrawer`, `ProtocolChoicePanel`, `WhitelistPanel`, `AllocationRulePanel`, `ValuationUpdatePanel`.
- Backend/API dependency: none initially; later save/update endpoints.
- Data contracts involved: chat suggested updates, future requirement draft contracts.
- MVP status: next.
- What not to overbuild yet: no modal-heavy workflow or separate page for every small edit.

## 5. PRD Review And Approval

- User goal: review and approve the PRD/enhanced Requirement Brief.
- Primary UI components: PRD review page, approval gate, change summary.
- Backend/API dependency: later `/api/prd`.
- Data contracts involved: `RequirementBrief`, `ProductRequirementDocument`, `PRDApproval`.
- MVP status: later.
- What not to overbuild yet: no document management suite.

## 6. Agent Build / QA / Security Progress

- User goal: watch worker bots generate and review outputs.
- Primary UI components: `AgentProgressPanel`, project timeline, artifact summaries.
- Backend/API dependency: later `/api/orchestration/runs`, `/api/artifacts`, `/api/security`.
- Data contracts involved: `AgentTask`, `AgentResult`, `GeneratedArtifact`, `SecurityReview`, `SecurityBenchmarkStatus`.
- MVP status: later.
- What not to overbuild yet: no distributed queue UI before in-process orchestration is insufficient.

## 7. Deployment Gate

- User goal: understand whether testnet deployment is ready.
- Primary UI components: `DeploymentGateCard`, blocking reasons, evidence readiness.
- Backend/API dependency: later `/api/deployment`.
- Data contracts involved: `DeploymentGateReadiness`, `SolidityArtifactMetadata`, `SecurityBenchmarkStatus`, `EvidencePack`.
- MVP status: later.
- What not to overbuild yet: no mainnet readiness path.

## 8. Wallet-signed Testnet Deployment

- User goal: connect wallet and sign deployment.
- Primary UI components: wallet status, deployment checklist, transaction status.
- Backend/API dependency: later `/api/deployment`.
- Data contracts involved: `WalletSignedDeploymentRequest`, `DeploymentTransactionStatus`.
- MVP status: later.
- What not to overbuild yet: no backend-held keys, custody, or mainnet deployment.

## 9. Mint / Whitelist / Allocation / Distribute

- User goal: mint, whitelist wallets, validate allocation equals 100%, and distribute tokens.
- Primary UI components: `InvestorAllocationTable`, whitelist drawer, allocation validation, transaction controls.
- Backend/API dependency: later deployment/token-operation routes.
- Data contracts involved: `InvestorWalletRecord`, `AllocationPlan`, future token operation contracts.
- MVP status: later.
- What not to overbuild yet: no full KYC/AML or investor portal.

## 10. Valuation Upload And Portfolio Performance Update

- User goal: upload valuation/performance data and make it visible to token holders.
- Primary UI components: `ValuationUploadPanel`, validation result, performance summary.
- Backend/API dependency: later `/api/valuation`.
- Data contracts involved: `ValuationUploadSummary`, `PortfolioPerformanceUpdate`.
- MVP status: later.
- What not to overbuild yet: no production oracle infrastructure or off-chain notification system.

## 11. Evidence Pack

- User goal: review and export evidence for CTO/compliance/audit review.
- Primary UI components: `EvidencePackPanel`, export button, artifact inventory.
- Backend/API dependency: later `/api/evidence`; current frontend beta has local evidence generation.
- Data contracts involved: `EvidencePack`, `ImplementationBundle`, security/QA statuses.
- MVP status: current beta locally, backend later.
- What not to overbuild yet: no formal audit certification claims.
