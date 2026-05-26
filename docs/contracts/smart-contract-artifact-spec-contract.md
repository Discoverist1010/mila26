# Smart Contract Artifact Spec Contract

Track 9A adds a deterministic Smart Contract Artifact Spec contract and backend route.

The spec is the typed bridge from Engineering Brief and closure readiness to later contract artifact work. It does not generate Solidity, install OpenZeppelin, compile contracts, sign wallets, deploy, or claim execution has happened.

## API

`POST /api/smart-contract/artifact-spec`

The route accepts:

- optional Requirement Brief contract,
- required Engineering Brief,
- minimal serializable closure readiness status.

It returns the standard MILA26 API envelope:

- `ok: true` with `SmartContractArtifactSpec`,
- `ok: false` with a safe error envelope for missing, blocked, or unsafe input.

Blocked closure readiness returns a safe failure response rather than a successful blocked spec.

## Token Profile

Track 9A distinguishes:

- base standard compatibility: `erc20`,
- MILA26 restriction profile: `restricted_erc20`.

`restricted_erc20` is a MILA26 ERC-20-compatible restricted token profile, not a separate formal ERC standard.

The spec includes minimum ERC-20-style functions and events:

- functions: `totalSupply`, `balanceOf`, `transfer`, `allowance`, `approve`, `transferFrom`,
- events: `Transfer`, `Approval`.

It also includes MILA26 tokenisation events:

- `WalletWhitelisted`,
- `AllocationMinted`,
- `ValuationUpdated`,
- `DistributionRecorded`,
- `TransferRestrictionUpdated`,
- `ContractPaused`,
- `ContractUnpaused`.

Exact Solidity signatures are deferred to Track 9B.

## OpenZeppelin Assumptions

The spec records OpenZeppelin assumptions as plain contract data:

- use OpenZeppelin Contracts,
- base contract: `ERC20`,
- extensions: `AccessControl`, `Pausable`,
- exact package version deferred to Track 9B or 9B.2.

Track 9A does not add package imports, npm installs, Solidity files, or compile tooling.

## Safety Boundary

The spec enforces:

- Ethereum testnet only,
- mainnet disabled,
- backend holds no private keys,
- future deployment is user-wallet signed,
- no deployment until checks, evidence, and deployment gate are ready,
- no production legal/compliance advice,
- no real investor onboarding in MVP.

## Evidence Linkage

The event model includes event-to-evidence mapping so Track 9B can connect future contract artifacts, check results, SCP recent events, and evidence-lite output without inventing a new bridge.
