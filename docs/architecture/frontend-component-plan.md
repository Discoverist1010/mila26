# Frontend Component Plan

This is the practical roadmap for evolving the current `App.tsx` lifecycle workspace into smaller components. Do not split files just for neatness; split when a component boundary supports upcoming tab functionality or testing.

## 1. Shell Components

Future components:

- `LifecycleWorkspaceShell`
- `LeftNavigationRail`
- `ProjectTopBar`
- `LifecycleTabs`
- `RightStatusRail`
- `RailToggle`

Purpose: preserve the current MILA26 shell while making the visual tabs and rails easier to test.

Current source: `src/App.tsx`, `src/styles.css`, `src/domain/workspacePresentation.ts`.

## 2. Engineering Bot Components

Future components:

- `EngineeringBotWorkspace`
- `ConversationHistory`
- `EngineerResponseView`
- `NextBestActionPanel`
- `SuggestedActionRow`
- `ChatComposer`

Purpose: keep the AI answer readable and central.

Do not add streaming, persistence, markdown rendering, or multi-agent panes until needed.

## 3. Lifecycle Tab Components

Future components:

- `OverviewTab`
- `RequirementsTab`
- `InvestorRegistryTab`
- `SubscriptionTab`
- `SmartContractTab`
- `AssetServicingTab`
- `RedemptionTab`
- `MaturityTab`
- `EvidenceTab`

Purpose: make each visual tab functional while reading from shared lifecycle state.

First implementation target completed in Sprint Track 1: the center workspace now renders the Investor Registry tab
from shared lifecycle state. Extract dedicated components only when the registry grows beyond the current inline
surface.

## 4. Investor Registry Components

Potential extracted components:

- `InvestorRegistryTable`
- `InvestorWalletRow`
- `InvestorWalletEditor`
- `WalletAddressValidationMessage`
- `WhitelistStatusBadge`

Purpose: support up to 50 wallet addresses and bridge registry state to the existing Whitelist Wallet SCP operation.

Do not claim KYC, investor eligibility, or legal approval.

## 5. Subscription / Redemption Components

Future components:

- `SubscriptionParametersForm`
- `StablecoinSelector`
- `SubscriptionWindowFields`
- `PaymentPerTokenField`
- `RedemptionParametersForm`
- `RedemptionDelayFields`
- `RedemptionWalletField`

Purpose: capture parameters for a predefined subscription-redemption smart-contract template.

Do not execute stablecoin transfers or redemption payouts yet.

## 6. Product Vault / Evidence Components

Future components:

- `ProductVault`
- `ProductVaultItem`
- `RecentActivityList`
- `EvidenceSummary`
- `LocalSessionEvidenceBadge`

Purpose: show generated artifacts and evidence without turning the right rail into an action surface.

## 7. Smart Contract Control Panel Components

Future components:

- `SmartContractControlPanel`
- `ContractOverview`
- `DeploymentEvidenceSection`
- `WalletSigningReadinessSection`
- `ScpOperationControls`
- `RecordNavOperationControl`
- `WhitelistWalletOperationControl`

Purpose: isolate wallet-signed operation controls and evidence views.

Do not move wallet-signed operations into the right rail or tab headers.

## 8. State/Model Roadmap

Add domain/read-model support in this order:

1. investor registry;
2. subscription parameters;
3. redemption parameters;
4. maturity parameters;
5. template parameter handoff into smart-contract spec;
6. allocation/mint operation state;
7. durable evidence persistence.

Avoid Redux/XState for now. Use local React state plus pure domain/read-model functions until complexity justifies a shared store.
