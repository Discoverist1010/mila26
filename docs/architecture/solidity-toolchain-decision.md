# Solidity Compile/Test Toolchain Decision

Track 9B.2 decides the compile/test tooling direction before MILA26 installs dependencies, adds Solidity files, or claims compiler/test output.

## Decision

MILA26 should continue to defer toolchain installation in Track 9B.2, but adopt **Hardhat as the recommended first implementation path** for the next compile/test foundation track.

Foundry remains the preferred later candidate for deeper Solidity-native testing, fuzzing, gas reporting, and advanced security workflows after the TypeScript-first MVP path proves useful.

## Current Repo Fit

MILA26 is currently a TypeScript, Vite, Fastify, Vitest, and Playwright repo. Tracks 9A through 9D already produce and display:

- `SmartContractArtifactSpec`
- deterministic artifact preview metadata
- deterministic spec-consistency `SmartContractArtifactCheckResult`
- Evidence-Lite linkage
- SCP readiness/status

No compile/test toolchain is installed. No Solidity files, OpenZeppelin imports, Hardhat config, Foundry config, wallet signing, deployment scripts, mainnet support, contract addresses, transaction hashes, or audit claims exist in the repo.

## Documentation Inputs

Current official documentation was checked through Context7 before this decision:

- Hardhat documentation presents `npx hardhat build` for build/type generation and `hardhat test` for Solidity and TypeScript tests.
- Foundry documentation presents `forge build` and `forge test` as the core compile/test workflow.

This ADR does not approve running either workflow yet.

## Options Compared

| Option | Assessment for MILA26 |
| --- | --- |
| Hardhat | Best first fit for the current TypeScript/npm repo. It can be added later behind npm scripts, can support TypeScript tests, and can map outputs into existing backend/domain contracts without introducing a second non-JS toolchain immediately. |
| Foundry | Strong smart-contract-native toolkit with fast `forge build` / `forge test`, useful later for Solidity-first tests, fuzzing, gas reporting, and deeper contract workflows. It adds a separate Rust/Forge toolchain and is less aligned with the current TypeScript MVP surface as the first step. |
| Defer | Correct for Track 9B.2. The current preview/spec-consistency flow is not blocked by a compiler yet, and installing tooling now would expand scope before the minimal fixture and output mapping are approved. |

## Rationale

Hardhat is the recommended future first path because it is the smallest practical bridge from the current TypeScript backend/frontend repo to compile/test evidence. It can be introduced later as a narrow npm-based local toolchain without changing the backend-only LLM boundary, wallet custody model, SCP contract, or Track 9A/9B API shapes.

Foundry should not be rejected permanently. It should be revisited when MILA26 needs Solidity-native tests, fuzzing, gas reports, or more advanced security workflows that justify a separate toolchain.

## Smallest Future Implementation Path

Proposed next implementation track:

**Track 10A - Minimal Hardhat Compile/Test Foundation**

Track 10A should be explicitly approved before any install or Solidity work. Its smallest safe scope should be:

- Add Hardhat and the minimum required compile/test packages.
- Add one restricted ERC-20-compatible Solidity fixture generated from the Track 9A spec assumptions.
- Add one minimal test proving compile/test wiring and core restriction/event expectations.
- Add npm scripts for future compile/test commands.
- Map successful compiler/test output into existing 9B-style contracts without replacing the deterministic preview flow.

Likely future files, not to be added in Track 9B.2:

- `hardhat.config.ts`
- `contracts/MILARestrictedIncomeFundToken.sol`
- `test/solidity/*.test.ts` or equivalent Hardhat test path
- updates to `package.json` / `package-lock.json`
- narrow adapter code that maps compiler/test results into `SmartContractArtifactCheckResult` and Evidence-Lite

Future command shape, not available in Track 9B.2:

- `npm run contracts:build`
- `npm run contracts:test`
- underlying Hardhat commands such as `npx hardhat build` and `hardhat test`

## Output Mapping Requirements

Future compile/test outputs must feed the existing artifact spine:

- `artifactPackage.sourceModel.compilerToolchainStatus`: move from `not_configured` to a truthful configured/compiled status only after a real compiler run.
- `checkResult.checkMode`: add a compiler/test-backed mode without removing deterministic spec-consistency checks.
- `checkResult.checks`: include compiler success/failure, test success/failure, ERC-20 compatibility, restriction behavior, custom events, and safety boundaries.
- `evidenceLite`: link compiler/test command summaries, generated artifacts, and event/check evidence references.
- SCP readiness/status: show compiled/tested only when real outputs exist; continue to show not deployed, not audited, not signed, no wallet connected, no address, and no transaction hash.
- Deployment Gate: consume compiler/test/evidence status later, but never treat compile/test success as deployment approval.

## Non-Goals and Boundaries

Track 9B.2 does not add:

- npm installs or package-lock smart-contract tooling changes
- Hardhat config
- Foundry config
- Solidity files
- OpenZeppelin install/imports
- compiler setup or compile scripts
- wallet connection or wallet signing
- backend private-key custody
- deployment scripts
- mainnet support
- fake contract addresses or transaction hashes
- audit, legal, or compliance claims
- backend route, frontend UI, LLM, persistence, auth, payment, or multi-agent changes

## Revisit Conditions

Revisit this decision only after:

- Track 10A or another implementation track is explicitly approved.
- The dependency list is accepted.
- The minimal Solidity fixture scope is accepted.
- The no-deployment, no-private-key, no-mainnet, no-fake-address, and no-fake-transaction guardrails are accepted.
- The team decides whether Foundry-specific capabilities such as fuzzing or gas reporting are needed before the TypeScript-first path.
