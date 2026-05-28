# Hardhat Compile/Test Foundation

Track 10A adds a local-only Hardhat compile/test foundation for one MILA26 restricted ERC-20-compatible contract fixture.

## Documentation Checked

- EIP-20 defines the ERC-20 functions and events used by this fixture: `totalSupply`, `balanceOf`, `transfer`, `allowance`, `approve`, `transferFrom`, `Transfer`, and `Approval`: <https://eips.ethereum.org/EIPS/eip-20>
- Hardhat 3 documentation was checked through official docs/Context7. The official local command shape includes `hardhat build` and `hardhat test`; this repo uses `hardhat build` plus Node's built-in test runner with viem to avoid adding deployment-oriented or vulnerable reporter plugin paths.
- OpenZeppelin Contracts 5.x documentation was checked through official docs/Context7. ERC-20 transfer customizations use `_update`, not the old `_beforeTokenTransfer` hook. `ERC20Pausable` provides pause enforcement through `_update`, and public pause/unpause functions still need explicit access control.
- OWASP Smart Contract Top 10 was checked for access-control, input-validation, unchecked-call, arithmetic, reentrancy, and business-logic risk framing: <https://owasp.org/www-project-smart-contract-top-10/>
- NIST blockchain references were checked for general blockchain/security context: <https://www.nist.gov/blockchain>

## Added Foundation

- `hardhat.config.ts` uses Hardhat 3 with viem and network helpers.
- `contracts/Mila26RestrictedFundToken.sol` is a local fixture only. It is not deployed, audited, production-ready, or a generic smart-contract framework.
- `test/Mila26RestrictedFundToken.ts` validates compile/deploy on the local simulated Hardhat network and checks the MVP restriction profile.
- `npm run contracts:build` runs `hardhat build`.
- `npm run test:contracts` runs `node --import tsx/esm --test test/Mila26RestrictedFundToken.ts`.

`npm run check` remains the existing lint/unit/build gate. Contract tests stay separate in Track 10A to avoid making the main app check slower or dependent on Hardhat compiler cache behavior.

## Contract Fixture Capabilities

The fixture keeps `restricted_erc20` as a MILA26 profile layered over ERC-20 compatibility, not a formal ERC standard.

It uses OpenZeppelin Contracts 5.x:

- `ERC20Pausable`
- `AccessControl`

It tests:

- ERC-20 name, symbol, decimals, supply, balances, transfer, approve, allowance, transferFrom, `Transfer`, and `Approval`.
- issuer/admin-only wallet allowlisting.
- issuer/admin-only allocation minting.
- transfers and transferFrom only between allowed wallets.
- valuation/performance event recording.
- distribution event recording.
- pause/unpause and transfer blocking while paused.

Custom MILA26 events included:

- `WalletWhitelisted`
- `AllocationMinted`
- `ValuationUpdated`
- `DistributionRecorded`
- `TransferRestrictionUpdated`
- `ContractPaused`
- `ContractUnpaused`

## Guardrails

Track 10A does not add:

- mainnet configuration
- RPC URLs
- private keys or mnemonics
- wallet connection or wallet signing
- deployment scripts
- fake contract addresses
- fake transaction hashes
- audit, legal, or compliance claims
- backend route changes
- frontend UI changes
- LLM changes
- persistence, database, auth, payments, or multi-agent orchestration

Hardhat output directories are ignored:

- `artifacts/`
- `cache/`

## Future Output Mapping

Later tracks can map real compile/test results into the existing MILA26 artifact spine:

- `artifactPackage.sourceModel.compilerToolchainStatus`: `not_configured` can become a truthful configured/compiled status after a real compile run is captured.
- `SmartContractArtifactCheckResult.checkMode` / `checkResult.checkMode`: add a compiler/test-backed mode while retaining deterministic spec-consistency checks.
- `SmartContractArtifactCheckResult.checks` / `checkResult.checks`: include compiler result, test result, ERC-20 compatibility checks, whitelist restriction checks, valuation/distribution event checks, pause behavior, and safety boundaries.
- `Evidence-Lite`: link command summaries, source fixture, check IDs, event evidence, and compiler/test output summaries.
- SCP readiness/status: show compiled/tested only when real outputs are captured; continue showing not deployed, not audited, not signed, no wallet connected, no address, and no transaction hash.
- Deployment Gate: consume compile/test/evidence readiness later, but compile/test success must never imply deployment approval.

## Track 10B Adapter

Track 10B adds `SmartContractCompileTestResult` as a typed representation of the local Track 10A compile/test baseline.

The adapter represents operator-run local command outcomes; it does not run Hardhat from a backend route, job runner, queue, command bus, or user request.

The adapter maps local compile/test status into:

- `SmartContractArtifactCheckResult.checks`-compatible rows
- `SmartContractEvidenceLite.evidenceItems` candidates
- `SmartContractEvidenceLite.safetyEvidenceRefs` entries
- lightweight SCP status fields

It preserves the distinction between:

- Track 9B spec-consistency/static-preview checking
- Track 10A local Hardhat compile/test execution
- Track 10B typed representation/mapping of that local result

Passing local compile/test results still do not mean deployed, wallet signed, audited, verified, production ready, legally approved, or mainnet enabled.

## Track 10C Cockpit/SCP Surfacing

Track 10C surfaces the known local Track 10A compile/test baseline in the cockpit and SCP after Smart Contract Spec and Artifact Preview generation succeeds.

This is display-only integration:

- no frontend or backend Hardhat command execution
- no "Run Hardhat" button
- no deployment, wallet signing, private keys, mainnet, contract address, transaction hash, or audit claim

The cockpit can show `Local Compile/Test - Passed` and the SCP can show local compile/test readiness rows, but the result remains a developer-local foundation result rather than a runtime action triggered by the user.

## Revisit Items

Before moving beyond Track 10A, decide:

- whether `npm run check` should include `npm run test:contracts`
- whether a later adapter should serialize Hardhat output into `SmartContractArtifactCheckResult`
- whether Foundry should be added later for fuzzing, gas reporting, or deeper Solidity-native tests
- whether OpenZeppelin `AccessControlDefaultAdminRules` is needed before any non-demo deployment path
