# Solidity Artifact Metadata Contract

## Purpose

The Solidity artifact metadata contract records whether a generated Solidity artifact is suitable for QA, security review, evidence packaging, and wallet-signed testnet deployment preparation.

## Relationship To `GeneratedArtifact`

`GeneratedArtifact` stores the current file-like output shape. `SolidityArtifactMetadata` is a planned companion contract for Solidity-specific readiness, policy, tooling, and deployment eligibility.

## Likely Fields

- `artifactId`.
- `projectId`.
- `runId`.
- `prdId`.
- `protocol`: `ERC-20` or `ERC-721`.
- `contractName`.
- `solidityVersion`.
- `libraryPolicy`.
- `usesOpenZeppelin`.
- `importedLibraries`.
- `sourceCodeRef` or `contentRef`.
- `generatedByAgentId`.
- `generatedAt`.
- `compileStatus`.
- `testStatus`.
- `securityBenchmarkStatus`.
- `deploymentEligibility`.

## Invariants

- Generated Solidity is testnet/demo scaffold until compiled, tested, and reviewed.
- OpenZeppelin Contracts is the default policy unless the approved PRD justifies a deviation.
- Contract must not include real-world investor names by default.
- Unresolved critical security findings block deployment readiness.
- Solidity artifacts must trace back to an approved PRD and generating agent/task.

## Future Fixture/Test Expectations

- Add fixture for a Solidity artifact using the default OpenZeppelin policy.
- Add fixture for a justified deviation only when a real PRD use case exists.
- Add tests for protocol, policy, compile/test/security status, and deployment eligibility.
- Keep source code content separate from list views when artifact bodies become large.
