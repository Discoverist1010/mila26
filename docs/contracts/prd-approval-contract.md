# PRD Approval Contract

## Purpose

The PRD approval contract records the asset manager's approved product design before coding and orchestration begin.

## Relationship To Current `RequirementBrief`

`RequirementBrief` is the current beta contract. `ProductRequirementDocument` / `ApprovedPRD` is the planned MVP evolution that captures chat-derived protocol, feature, whitelist, valuation, risk, and acceptance-criteria decisions. Future implementation should either migrate from `RequirementBrief` deliberately or map between the two with tests.

## Likely Fields

- `projectId`.
- `runId`.
- `prdId`.
- `version`.
- `generatedFromChatTurnIds`.
- `selectedProtocol`: `ERC-20` or `ERC-721`.
- `selectedFeatures`.
- `walletWhitelistRequirement`.
- `valuationUpdateRequirement`.
- `acceptanceCriteria`.
- `risksAndAssumptions`.
- `userApprovalStatus`.
- `approvedAt`.
- `approvedBy`.

## Lifecycle

`draft` -> `user_review` -> `approved` -> `superseded`

## Invariants

- Coding/orchestration cannot start until PRD is approved.
- PRD must state `ERC-20` or `ERC-721`.
- Material changes after approval create a new version.
- PRD approval should be traceable to chat turns and user action.

## Future Fixture/Test Expectations

- Add fixtures for draft and approved PRD states.
- Add contract tests for required protocol, approval lifecycle, versioning, and orchestration gate behavior.
- Update existing Requirement Brief fixtures if the current shape is migrated or wrapped.
