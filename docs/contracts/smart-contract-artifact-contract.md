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

Track 10A adds local-only Hardhat/OpenZeppelin compile/test fixture support. The 9B artifact route remains preview-only.

Track 10B adds a companion compile/test result adapter:

- [`smart-contract-compile-check-contract.md`](smart-contract-compile-check-contract.md)

The adapter can map the local Hardhat compile/test baseline into `SmartContractArtifactCheckResult.checks`-compatible rows, Evidence-Lite item candidates, safety evidence refs, and lightweight SCP status fields. It does not replace the Track 9B spec-consistency result, run Hardhat from the backend, deploy contracts, sign wallets, create addresses or transaction hashes, or make audit/readiness claims.
