# Agent Orchestration MVP

## Goal

The MVP should demonstrate orchestration and agentic bot characteristics without adopting a heavy agent framework too early. The user should see a real turn-based Blockchain Engineering Bot conversation and visible progress from worker bots.

## Agents / Bots

- Blockchain Engineering Bot: chats with the asset manager, explains ERC-20 vs ERC-721, captures requirements, and remains available while workers run.
- PRD/Requirement Brief Bot or Engineering Bot: turns finalized design into a PRD/enhanced Requirement Brief.
- Contract Coding Bot: generates Solidity ERC-20/ERC-721 scaffold/artifacts from the approved PRD, defaulting to OpenZeppelin Contracts for ERC-20/ERC-721 and common access-control/security primitives unless the PRD explicitly justifies otherwise.
- API/Integration Bot: prepares backend/API or integration notes/artifacts.
- Frontend Bot: prepares UI workflow notes/artifacts.
- Test Bot: generates Solidity test plans, test artifacts, or compile/test expectations.
- QA Bot: checks PRD conformance, generated Solidity quality, allocation/whitelist logic, event coverage, and test readiness before release.
- Security Reviewer Bot: blocks unsafe outputs and benchmarks generated Solidity against OWASP Smart Contract Top 10, known Solidity vulnerability categories, and recognized secure-contract patterns.
- Evidence Pack Bot: prepares the review/evidence package.
- External Auditor Bot adapter: optional adapter/handoff after code generation and QA; it is not a formal audit by default.
- Deployment Bot: prepares wallet-signed Ethereum testnet deployment.

## Turn-Based Chat Requirement

The Blockchain Engineering Bot must support a real turn-based chat. It should answer follow-up questions, ask clarifying questions, and keep enough turn context to produce a coherent PRD/Requirement Brief.

The user should be able to keep chatting while Coding, QA, Security, Evidence, Auditor, or Deployment bots are running.

## Suggested Orchestration Sequence

1. Chat captures initial product intent.
2. Engineering Bot compares ERC-20 vs ERC-721 and helps decide.
3. Engineering Bot captures investor wallet, whitelist, allocation, and performance-reporting requirements.
4. Engineering Bot generates PRD/enhanced Requirement Brief.
5. User approves PRD.
6. Orchestrator starts coding, integration, frontend, and test workers.
7. QA Bot reviews worker outputs.
8. Security Reviewer Bot gates generated outputs.
9. Evidence Pack Bot packages outputs and findings.
10. Optional External Auditor Bot adapter runs.
11. Deployment Bot prepares wallet-signed testnet deployment.

Deployment gate:

PRD approved -> coding complete -> QA complete -> security benchmark complete -> evidence pack updated -> user wallet signs testnet deployment.

## Parallelizable Steps

- Contract, API/integration, frontend, and test artifact generation after PRD approval.
- Evidence inventory assembly for already-generated artifacts.
- Independent QA checks that do not depend on security review.
- Chat continuation while background workers run.

## Sequential / Dependency Steps

- PRD approval before code generation.
- Contract design before deployment preparation.
- QA/security before approved evidence release.
- Wallet connection before signing.
- Allocation total validation before distribution.
- Deployment confirmation before mint/distribute actions.

## Quality Controls

- Schema validation for all contract-shaped outputs.
- Golden fixture/contract tests for the contract spine.
- Solidity generation should prefer trusted ERC-20/ERC-721 libraries and security patterns where practical.
- Deviations from the default OpenZeppelin Contracts policy must be documented in the PRD, QA review, Security Review, and Evidence Pack.
- MVP Solidity should default to simple non-upgradeable contracts unless upgradeability is explicitly required.
- QA must check generated Solidity against the approved PRD and tokenized-portfolio requirements.
- Security Reviewer Bot must benchmark generated Solidity against recognized smart-contract vulnerability categories before testnet deployment.
- Security review before release/export.
- QA review before deployment preparation.
- Testnet-only guardrails.
- No raw LLM output directly trusted by UI or deployment flow.

## Smart-Contract Security Benchmarks

Use these as review sources and future tooling references:

- OWASP Smart Contract Top 10.
- Consensys Diligence smart-contract security best practices.
- Solidity compiler warnings.
- OpenZeppelin Contracts/security patterns.
- Future static analysis tools such as Slither, Mythril, Foundry, or Hardhat; do not implement these until the relevant tooling track.

Benchmark categories:

- Access control failures.
- Oracle/data-feed manipulation or unreliable external data.
- Business logic / logic errors.
- Lack of input validation.
- Reentrancy.
- Unchecked external calls.
- Integer/precision/rounding issues.
- Insecure randomness.
- Denial of service / gas exhaustion.
- Unsafe admin, pause, upgrade, or ownership controls.
- Event/logging gaps where events are needed for evidence or token-holder visibility.
- Privacy leakage, especially real-world investor names on-chain.
- Unsafe key/secret handling.

## Latency Controls

- Use deterministic validation where rules are enough.
- Parallelize independent workers.
- Keep prompts compact.
- Use faster models for simple classification/formatting.
- Use stronger models only for high-value reasoning.
- Stream or show progress/status during longer work.

## Visible Progress / Status Model

Minimum statuses:

- Queued.
- Running.
- Waiting for dependency.
- Needs user approval.
- Blocked.
- Completed.
- Failed.

Each status should identify the bot, task, affected artifact or contract, and next action.

## What Not To Overengineer

- Do not add a heavy agent framework before the custom lightweight orchestrator fails a concrete MVP need.
- Do not add Redis/queues before in-process async orchestration is insufficient.
- Do not add vector memory before structured turn/run/project memory is proven insufficient.
- Do not add multi-tenant orchestration before one-asset-manager MVP works.
- Do not install OpenZeppelin, choose Hardhat vs Foundry, or add Solidity tooling until the Solidity tooling implementation track.
