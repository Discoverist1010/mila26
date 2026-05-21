# Engineering Brief Contract

## Purpose

Track 5B adds a deterministic backend PRD / Engineering Brief route.

The route bridges the Track 5A Requirement Brief contract to a stable Engineering Brief response shape that later backend-only LLM, Solidity generation, QA/security, evidence pack, and deployment-gate tracks can consume.

This is deterministic/mock generation. It does not call an LLM provider and does not add OpenAI, persistence, wallet integration, Solidity tooling, or deployment.

## Route

`POST /api/prd/engineering-brief`

Request:

```json
{
  "requirementBrief": {
    "id": "requirement-contract-brief-example",
    "sourceBriefId": "brief-example",
    "projectName": "MILA Income Fund",
    "networkBoundary": "ethereum-testnet-only",
    "deploymentBoundary": {
      "currentTarget": "simulation-only",
      "signing": "user-wallet-signs"
    },
    "backendCustodyBoundary": "backend-holds-no-private-keys"
  }
}
```

The real request includes the full Track 5A Requirement Brief contract shape.

Success response uses the standard API envelope:

```json
{
  "ok": true,
  "data": {
    "id": "engineering-brief-brief-example",
    "sourceRequirementBriefId": "brief-example",
    "title": "MILA Income Fund Engineering Brief"
  }
}
```

Invalid requests use the standard safe error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid Engineering Brief generation request."
  }
}
```

## Response Shape

The Engineering Brief response includes:

- `id`
- `generatedAtIso`
- `sourceRequirementBriefId`
- `title`
- `summary`
- `projectContext`
- `functionalRequirements`
- `nonFunctionalRequirements`
- `tokenDesign`
- `walletAndAccessModel`
- `valuationAndPerformanceUpdates`
- `complianceAndSecurityAssumptions`
- `deploymentBoundary`
- `implementationPlan`
- `testingAndQaPlan`
- `evidencePackPlan`
- `openQuestions`
- `risksAndControls`
- `acceptanceCriteria`
- `metadata`

## Validation Boundaries

The route rejects:

- missing request body
- missing `requirementBrief`
- blank project/fund context
- missing or non-testnet network boundary
- missing or unsupported deployment signing boundary
- anything implying backend private-key custody
- malformed selected servicing modules

For Track 5B, unsupported mainnet-like network input is rejected rather than downgraded.

## Fixed MVP Boundaries

The deterministic Engineering Brief explicitly preserves:

- Ethereum testnet only
- no mainnet deployment in MVP
- user wallet signs deployment
- backend holds no private keys
- future LLM calls and secrets stay backend-only
- this route is deterministic/mock, not production legal/compliance/investment/audit advice
- deployment remains disabled unless a later wallet-signed testnet track enables it

## Implementation

Contract:

- `server/contracts/engineeringBrief.ts`

Deterministic generator:

- `server/agents/engineeringBriefMock.ts`

Route:

- `server/routes/engineeringBrief.ts`

Tests:

- `tests/api-prd-engineering-brief.test.ts`
- `tests/engineering-brief-contract.test.ts`

## Track 6A Preparation

Track 6A can add a backend-only LLM adapter behind this same response contract.

The future LLM provider should produce or be mapped into `EngineeringBriefSchema`, while tests continue to use deterministic generation for local reliability.

## Out Of Scope

- real LLM calls
- OpenAI integration
- API keys or secrets
- autonomous orchestration
- frontend PRD UI integration
- Solidity compilation
- wallet integration
- private key handling
- blockchain deployment
- persistence
- auth
- payments
- production legal/compliance/audit advice
