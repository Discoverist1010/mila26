# Security Benchmark Contract

## Purpose

The security benchmark contract records QA and Security Reviewer Bot checks against generated Solidity before evidence packaging and deployment readiness.

## Relationship To QA Bot And Security Reviewer Bot

QA Bot checks PRD conformance and code quality. Security Reviewer Bot checks recognized smart-contract vulnerability categories. Their outputs may share a status model, but security findings must remain explicit enough to gate deployment.

## Benchmark Sources

- OWASP Smart Contract Top 10.
- Consensys Diligence-style smart-contract security practices.
- OpenZeppelin security patterns.
- Solidity compiler warnings.
- Future static analysis tools such as Slither, Mythril, Foundry, or Hardhat.

## Categories

- Access control.
- Oracle/data reliability.
- Business logic errors.
- Input validation.
- Reentrancy.
- Unchecked external calls.
- Integer/precision issues.
- Insecure randomness.
- Denial of service/gas exhaustion.
- Unsafe admin/pause/upgrade controls.
- Event/logging gaps.
- Privacy leakage.
- Unsafe key/secret handling.

## Likely Fields

- `benchmarkRunId`.
- `artifactId`.
- `runId`.
- `benchmarkVersion`.
- `checkedCategories`.
- `findings`.
- `severity`.
- `passFailStatus`.
- `blockingFindings`.
- `waivedFindings`.
- `reviewedByAgentId`.
- `reviewedAt`.

## Invariants

- Critical unresolved findings block deployment gate readiness.
- Waivers must be explicit and recorded in the Evidence Pack.
- Benchmark is not a formal production audit.
- Unsafe key/secret handling is always blocking until removed or explicitly documented as a non-deployable demo artifact.

## Future Fixture/Test Expectations

- Add passing and blocked benchmark fixtures.
- Add fixture for waived non-critical findings.
- Add tests for blocking severity, waiver recording, and Evidence Pack linkage.
- Keep benchmark version explicit so future rule changes are traceable.
