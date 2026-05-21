# Deployment Gate Readiness Contract

## Purpose

The deployment gate readiness contract confirms whether a generated contract is ready for user wallet-signed Ethereum testnet deployment.

It does not authorize mainnet deployment and does not hold private keys.

## Likely Fields

- `gateId`.
- `projectId`.
- `runId`.
- `prdId`.
- `artifactId`.
- `targetNetwork`.
- `protocol`.
- `prdApproved`.
- `compilePassed`.
- `testsPassed`.
- `qaPassed`.
- `securityPassed`.
- `evidencePackReady`.
- `criticalFindingsUnresolved`.
- `walletConnectionRequired`.
- `userSignatureRequired`.
- `readyForTestnetDeployment`.
- `blockingReasons`.
- `createdAt`.

## Invariants

- Mainnet is not allowed in MVP.
- User wallet signs deployment.
- Backend does not hold deployer private key.
- No deployment readiness if PRD is not approved.
- No deployment readiness if critical security findings are unresolved.
- Evidence Pack must record readiness state and any waivers.

## Lifecycle

`not_ready` -> `ready_for_signature` -> `submitted` -> `confirmed` -> `failed`

## Future Fixture/Test Expectations

- Add fixture for `not_ready` with blocking reasons.
- Add fixture for `ready_for_signature` with all gates passed.
- Add tests for mainnet fail-closed behavior, PRD approval gating, security gating, evidence readiness, and wallet-signature requirement.
- Add transaction-status fixtures when wallet-signed deployment is implemented.
