# Deployment Transaction Intent Contract

Track 14A adds a pure unsigned deployment intent read model. It defines the review payload needed before a wallet-signed Sepolia deployment track.

This contract is intentionally named in code as `UnsignedDeploymentIntentReadModel` to avoid implying an executable transaction.

## Purpose

The read model answers:

- whether MILA26 can prepare an unsigned deployment intent for review.
- which compiled artifact reference is proposed.
- which Sepolia-only target is allowed.
- which connected user wallet would later sign.
- which constructor/deployment parameter summary must be reviewed.
- which execution artifacts remain absent until real wallet-signed deployment.

It does not sign, submit, deploy, confirm, or create transaction output.

## Inputs

`UnsignedDeploymentIntentReadModelInput` consumes lightweight existing models:

- `DeploymentGateReadModel`.
- `WalletSigningIntentReadModel`.
- `WalletConnectionReadModel`.
- `compiledArtifactReference`.
- `constructorParameters`.
- optional requested network, defaulting to `ethereum_sepolia`.

It does not access `window.ethereum`, call provider methods, import viem/ethers/wagmi, run Hardhat, or call backend routes.

## Compiled Artifact Reference

Track 14A does not import generated Hardhat JSON artifacts. Generated artifacts may be absent after a clean checkout.

Instead, the read model accepts a stable `compiledArtifactReference`:

- `artifactPackageId`
- `specId`
- `contractName`
- `artifactSource`
- `artifactStatus`
- `abiStatus`
- `bytecodeStatus`
- optional `bytecodeHash`
- `compileCheckId`
- `compileTestStatus`

The reference is metadata for review only. Full bytecode is not exposed in the UI by this contract.

## Review-Ready Conditions

`intentStatus` becomes `review_ready` only when:

- Deployment Gate is review-ready.
- Wallet Signing Intent is review-ready.
- Wallet Connection is connected.
- Wallet chain is Sepolia.
- requested network is Sepolia.
- compiled artifact reference is available.
- ABI reference is available.
- bytecode reference is available.
- local compile/test status is passed.
- constructor/deployment parameter summary is complete.

Otherwise `intentStatus` is `blocked`.

## Execution Boundary

`deploymentExecutionStatus` is always `not_implemented` in Track 14A.

The model always preserves:

- backend private-key custody: `never`.
- user wallet signs later.
- Sepolia only.
- mainnet disabled.
- wallet signing not implemented.
- deployment execution not implemented.

## Absent Execution Artifacts

Track 14A explicitly keeps these absent:

- transaction hash.
- contract address.
- signed payload.
- submitted transaction.
- confirmed transaction.
- deployment receipt.

These values may appear only after real wallet-signed execution. Track 14B can display provider-returned transaction hash and receipt-confirmed contract address in local session state; Track 14C derives local-session evidence/readiness from those values.

## Forbidden Current Payload Fields

The read model must not expose executable transaction fields:

- `to`
- `from`
- `data`
- `value`
- `gas`
- `nonce`
- `maxFeePerGas`
- `maxPriorityFeePerGas`
- `chain`

Those belong to a later reviewed transaction-preparation/signing track, if explicitly approved.

## Non-Goals

Track 14A does not add:

- wallet signing.
- transaction preparation.
- transaction submission.
- deployment execution.
- transaction lifecycle state.
- transaction hash.
- contract address.
- deployment receipt.
- backend route/API.
- backend private-key custody.
- server-side deployer account.
- viem/ethers/wagmi runtime deployment code.
- mainnet configuration.
- SCP operation controls.
- persistence, auth, payments, or LLM changes.

Track 14B consumes this read model but does not change its semantics. The unsigned intent remains the pre-signing review boundary; actual deployment status is tracked separately as local-session wallet-signed deployment state.

## Tests

`tests/unsigned-deployment-intent-read-model.test.ts` validates:

- blocked states for missing gate/signing/wallet/artifact/ABI/bytecode/compile-test/constructor prerequisites.
- Sepolia-only behavior.
- review-ready behavior only when all prerequisites are complete.
- `deploymentExecutionStatus: not_implemented`.
- backend private-key custody remains `never`.
- execution artifacts remain absent.
- no fake transaction hash, contract address, signed payload, submitted transaction, confirmed transaction, receipt, or execution-ready status appears.
