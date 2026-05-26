# Project Lifecycle Read Model Contract

Track 8A adds a thin deterministic read model for cockpit lifecycle coordination.

The read model does not own artifacts and is not a persistence boundary. Requirement Brief, Engineering Brief, Project Closure Ledger, future Smart Contract Artifact Spec, check results, evidence pack, and deployment gate outputs remain separate contracts.

## Purpose

`ProjectLifecycleReadModel` derives:

- current lifecycle stage,
- readiness status and label,
- blocked reasons,
- next recommended Engineering Bot action,
- enabled and disabled workflow action IDs,
- fixed MVP safety boundaries.

It exists to prevent UI/action drift while keeping MILA26 additive and testable.

## Inputs

The read model consumes lightweight artifact presence/status values:

- Requirement Brief exists or not,
- Engineering Brief exists or not,
- `ProjectClosureReadModel`,
- Smart Contract Artifact Spec status placeholder,
- check status placeholder,
- evidence status placeholder,
- deployment gate status placeholder.

These future statuses are intentionally small placeholders for Track 8B, 8C, 9A, and 9B. Track 8A does not model wallet signing completion or real deployment execution.

## Safety Boundary

Every derived model carries the MVP boundary:

- Ethereum testnet only,
- backend holds no private keys,
- user wallet signs deployment,
- mainnet deployment is not allowed.

## Non-Goals

Track 8A does not add backend routes, persistence, global state, wallet logic, Solidity compilation, deployment, mainnet support, or a monolithic `ProjectLifecycleContext`.
