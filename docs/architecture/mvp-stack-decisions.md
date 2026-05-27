# MILA26 MVP Stack Decisions

This document captures near-term stack direction for the local-laptop funding-demo MVP. It does not implement the stack.

## Frontend

Decision: keep the current Vite + React + TypeScript frontend.

Reasoning:

- It already supports the beta journey.
- It is fast for a local Mac demo.
- It avoids a broad UI/platform rewrite before product workflow needs it.

Revisit if:

- Routing, server rendering, or deployment requirements outgrow the current setup.
- The funding-demo flow needs a framework capability the current app cannot provide simply.

## Backend/API

Decision: add a lightweight local TypeScript backend later, likely Fastify unless Express is clearly simpler in repo context.

Reasoning:

- Backend-only secrets are required for real LLM and audit adapters.
- Fastify gives a small, typed, local-friendly API boundary without heavy framework commitment.
- The first backend should protect contracts and secrets, not become a platform rewrite.

Revisit if:

- Hosting/deployment strongly favors another runtime.
- Existing code or dependencies make Express materially simpler.
- API routes need to move into a full-stack framework for concrete product reasons.

## Storage

Decision: use SQLite first for local run/project/chat memory when persistence is introduced; consider Postgres/Supabase later.

Reasoning:

- SQLite fits local Mac demo constraints.
- It is enough for one asset manager, one project, and small run history.
- It avoids production database overhead before MVP validation.

Revisit if:

- Multi-user access, hosted beta, collaboration, or concurrent writes become real requirements.

## Blockchain

Decision: use user wallet signing for deployment and token actions; likely use `viem` or equivalent TypeScript Ethereum tooling later.

Reasoning:

- Backend must not hold deployment private keys.
- Wallet signing improves demo credibility and security.
- TypeScript Ethereum tooling can prepare transactions and read status while keeping signing in the user's wallet.

Revisit if:

- Wallet support, chain coverage, or contract tooling needs are better served by another library.

## Smart-Contract Tooling

Decision: Track 9B.2 keeps Solidity compile/test tooling uninstalled, but recommends Hardhat as the first future implementation path for a minimal compile/test foundation. Foundry remains a later candidate for Solidity-native tests, fuzzing, gas reporting, and deeper security workflows.

Near-term direction:

- Default Solidity generation to OpenZeppelin Contracts for ERC-20/ERC-721 and common access-control/security primitives unless the approved PRD explicitly justifies otherwise.
- Default to simple non-upgradeable contracts for MVP unless upgradeability is explicitly required.
- Do not install or pin OpenZeppelin package versions yet; that belongs to a later approved Solidity tooling implementation track.
- Use `viem` or equivalent TypeScript Ethereum tooling later for wallet/testnet interactions.
- Add Solidity compiler/tooling later only after a dedicated implementation track is approved.
- Use [`solidity-toolchain-decision.md`](solidity-toolchain-decision.md) as the Track 9B.2 ADR for Hardhat / Foundry / defer reasoning.
- Consider static analysis later, such as Slither or Mythril; decision deferred.

Reasoning:

- Solidity scaffold generation and security benchmarking are required for credibility.
- Compile/test/static-analysis tools add value, but installing them before the implementation track would add premature complexity.
- The MVP needs clear library policy and review gates before heavy tooling.

Revisit if:

- Generated Solidity becomes a user-facing deployment artifact.
- Testnet deployment is implemented.
- QA/security bots need executable compile/test/static-analysis outputs.

Future tooling decisions:

- OpenZeppelin package version.
- Solidity compiler version.
- Hardhat implementation details.
- Foundry revisit trigger.
- `viem` integration shape.
- Compile/test command.
- Static-analysis approach.
- Deployment artifact format.

## LLM Provider Adapter

Decision: use a backend-only LLM provider adapter.

Reasoning:

- Live model/API keys must never enter browser code.
- Provider-specific logic should stay behind a small adapter boundary.
- Outputs must be validated against MILA26 contracts.

Revisit if:

- Multiple providers create real duplicated logic.
- Local/offline model support becomes a funding-demo requirement.

## Orchestration

Decision: use a custom lightweight orchestrator first.

Reasoning:

- Current deterministic orchestration already models task decomposition and parallel worker results.
- A custom orchestrator can show progress/status without a heavy agent framework.
- It preserves stable contracts while allowing future LLM-backed workers.

Revisit if:

- Runs require durable retries, distributed workers, scheduling, or complex dependency graphs.

## Memory

Decision: model turn, run, project, and working memory first.

Reasoning:

- These memory types map directly to the user journey.
- They support chat continuity, run traceability, project context, and worker task execution.
- They avoid premature vector/RAG infrastructure.

Revisit if:

- Prior runs or document references become too large for structured summaries and simple lookup.

## Deferred Infrastructure

Deferred until concrete need:

- Redis/queues.
- Vector DB.
- Microservices.
- Kubernetes.
- Heavy agent frameworks.
- Enterprise auth.

Principle: stable contracts, flexible intelligence, efficient execution, minimal necessary complexity.
