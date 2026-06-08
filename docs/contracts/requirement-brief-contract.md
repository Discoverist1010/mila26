# Requirement Brief Contract

## Purpose

Track 5A adds a stable typed Requirement Brief contract boundary for future MILA26 tracks.

The contract is the source-of-truth input object that later PRD, backend-only LLM, Solidity generation, QA/security, evidence pack, deployment gate, and wallet-signed testnet deployment tracks can consume.

This track does not add PRD generation, real LLM calls, persistence, wallet integration, Solidity tooling, or deployment.

## Source

Implementation:

- `src/domain/requirementBrief.ts`

Tests:

- `tests/requirement-brief-contract.test.ts`

The adapter `toRequirementBriefContract()` accepts the current beta `RequirementBrief`, validates it through the existing schema, and returns the stable future-facing contract.

## Contract Shape

The contract captures:

- `projectName`
- `assetProfile`
  - fund name
  - token symbol
  - jurisdiction
  - target investors
  - total supply
  - initial NAV
- `tokenModel`
  - token standard preference
  - deterministic assumption
- `investorAccess`
  - whether wallet whitelist is required
  - access assumptions
- `valuationPolicy`
  - valuation/performance cadence assumption
  - supporting assumptions
- `selectedServicingModules`
- `networkBoundary`
- `deploymentBoundary`
- `backendCustodyBoundary`
- `complianceSecurityAssumptions`
- `approvalStatus`
- `unresolvedQuestions`

## Fixed MVP Boundaries

Track 5A deliberately records these MVP boundaries in the contract:

- Network boundary: `ethereum-testnet-only`
- Deployment signing boundary: `user-wallet-signs`
- Backend custody boundary: `backend-holds-no-private-keys`

These are contract invariants for the MVP unless a later explicit track changes them.

## Current Adapter Rules

- The current beta `RequirementBrief` remains the runtime producer.
- Enabled servicing modules are preserved exactly.
- The active ZiLi-OS Product Setup protocol bases are `ERC-20`, `ERC-4626`, `ERC-3643`, and `Custom ERC-20 with rebasing`.
- ERC-20 is inferred for unrestricted fungible product units.
- ERC-3643 is inferred when wallet whitelist / permissioned transfer requirements are enabled.
- ERC-721 is not an active Product Setup protocol base and must not be inferred from current inputs.
- Wallet whitelist is inferred from the current `whitelist` module.
- Valuation/performance cadence remains a deterministic assumption because no real valuation feed or oracle cadence exists yet.
- Compliance and security assumptions are combined for future QA/security/evidence gates.

## Validation

The contract is schema-validated with Zod.

Critical fields such as project/fund name, token symbol, jurisdiction, target investors, supply, and NAV are validated through the existing `RequirementBriefSchema` before the stable contract is emitted.

## Future Migration Rule

Future tracks may add PRD, LLM, Solidity, security, evidence, or deployment consumers, but they should consume this contract instead of re-deriving brief assumptions from UI state.

Any contract change must update:

- source type/schema
- adapter
- tests
- this document

Do not add production capabilities by changing this contract alone.
