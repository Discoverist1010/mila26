# Smart Contract Artifact Contract

Track 9B adds a deterministic bridge from the Track 9A Smart Contract Artifact Spec to downstream build-readiness artifacts.

## Route

`POST /api/smart-contract/artifact`

The request body is strict:

- `smartContractArtifactSpec`: a valid Track 9A `SmartContractArtifactSpec`

Unknown top-level fields fail validation. Deployment-like or secret-like fields such as `deployedAddress`, `contractAddress`, `txHash`, `privateKey`, `signerKey`, `walletPrivateKey`, `compiled`, `deployed`, `signed`, or `mainnet` are rejected.

## Response

The route uses the existing MILA26 `ok` / `fail` API envelope.

Successful responses include:

- `artifactPackage`: deterministic preview package metadata
- `checkResult`: deterministic spec-consistency/static-preview check result
- `evidenceLite`: traceable evidence-lite references for later SCP/Evidence Pack wiring

## Boundaries

Track 9B does not compile Solidity, install OpenZeppelin, deploy contracts, connect wallets, sign transactions, create contract addresses, create transaction hashes, or produce production audit/legal/compliance conclusions.

The source preview is explicitly labelled:

`Deterministic preview only - not compiled, not deployed, not audited.`

OpenZeppelin remains a spec/implementation assumption only. Track 9B.2 recommends Hardhat as the first future compile/test implementation path, but does not install tooling, add Solidity files, add OpenZeppelin imports, or change the preview-only artifact/check/evidence contract.
