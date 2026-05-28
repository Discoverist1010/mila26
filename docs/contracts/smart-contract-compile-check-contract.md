# Smart Contract Compile/Test Check Contract

Track 10B adds a typed representation of the local Track 10A Hardhat compile/test foundation.

This is a domain adapter, not a runtime executor. MILA26 does not run Hardhat from a backend route, user request, job queue, command bus, or workflow engine in Track 10B.

## Source Commands

The result represents the known local commands introduced in Track 10A:

- `npm run contracts:build -- --force`
- `npm run test:contracts`

These commands are still run by the developer/operator, not by the app at runtime.

## Contract Shape

`SmartContractCompileTestResult` uses the existing MILA26 naming style:

- `compileCheckId`
- `artifactId`
- `specId`
- `status`
- `metadata.generatedAt`
- `metadata.generator`
- `metadata.version`
- `blockedReasons`

Supported statuses are:

- `passed`
- `failed`
- `blocked`
- `not_run`

The result includes:

- compiler command/status/summary
- contract test command/status/summary
- tested capabilities for ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation events, distribution events, pause/unpause, and access control
- deterministic evidence refs
- fixed safety boundary checks

## Canonical Boundaries

Every result preserves these boundary fields:

- `deploymentNotExecuted`
- `walletSigningNotPerformed`
- `privateKeysNotUsed`
- `mainnetDisabled`
- `noFakeAddressOrTxHash`
- `auditNotPerformed`

The contract deliberately avoids conflicting names such as `deployStatus`, `walletSigned`, `auditPassed`, `contractAddress`, `txHash`, or `deployedAddress`.

## Mapping

Track 10B adds pure mappers that can produce:

- compile/test check rows compatible with `SmartContractArtifactCheckResult.checks`
- evidence-lite item candidates compatible with `SmartContractEvidenceLite.evidenceItems`
- safety evidence refs compatible with `SmartContractEvidenceLite.safetyEvidenceRefs`
- lightweight SCP status fields

The compile/test result supplements Track 9B spec-consistency checking. It does not replace the preview-only artifact package or mutate artifact ownership.

Track 10C surfaces the known local compile/test result in the Cockpit/SCP as lightweight status only. The UI does not execute Hardhat and does not turn the result into deployment, signing, audit, or mainnet readiness.

## Non-Goals

Track 10B does not add:

- backend route execution of Hardhat commands
- deployment scripts
- wallet connection or wallet signing
- private keys or backend key custody
- mainnet config
- fake contract addresses or transaction hashes
- audit, verification, production-readiness, legal, or compliance claims
- persistence, auth, payments, LLM changes, or multi-agent orchestration
