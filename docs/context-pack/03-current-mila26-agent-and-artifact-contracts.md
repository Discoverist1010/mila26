# Current MILA26 Agent And Artifact Contracts

## Current Agent Roles

MILA26 currently models agents as deterministic TypeScript functions and typed records. `AgentTaskSchema` defines four worker roles: `contract_worker`, `api_worker`, `frontend_worker`, and `test_worker` (`src/domain/schemas.ts:41-47`). `ImplementationBundle` groups the brief, tasks, results, security review, and evidence pack into the top-level orchestration result (`src/agents/agentRuntime.ts:17-23`).

The README describes the product-level bot lineup as Blockchain Engineer Bot, Coding Bot, Mini Coding Bots, Security Reviewer Bot, Evidence & Documentation Bot, and Deploy Simulation (`README.md:5-12`). In code, those map to:

- Blockchain Engineer Bot: `answerAsBlockchainEngineer`.
- Coding Bot: `runCodingBotOrchestration`.
- Mini Coding Bots: `decomposeForMiniBots` plus `runMiniBot`.
- Security Reviewer Bot: `runSecurityReview`.
- Evidence & Documentation Bot: `generateEvidencePack`.
- Deploy Simulation: `generateDeploymentManifest`.

## Blockchain Engineer Bot Behavior

`answerAsBlockchainEngineer(question, brief?)` is a deterministic classifier over the user's question (`src/agents/agentRuntime.ts:55-71`). It lowercases the question and returns one of four plain-English answers:

- Deployment/wallet/testnet/mainnet questions: keep deployment in simulation mode and keep real deployment environment-disabled (`src/agents/agentRuntime.ts:61-63`).
- Audit/security/risk questions: generate traceable artifacts, run mandatory security review, and prepare an evidence pack (`src/agents/agentRuntime.ts:64-66`).
- NAV/price/valuation questions: treat NAV as an operational input with ownership, timing, and evidence records (`src/agents/agentRuntime.ts:67-69`).
- Default: translate the business goal into a Requirement Brief and flag security, audit, and deployment implications (`src/agents/agentRuntime.ts:70`).

If a brief exists, the answer adds context for the fund name and selected module count (`src/agents/agentRuntime.ts:57-59`). This is currently not an LLM conversation. It is a small deterministic intent matcher.

## Coding Bot Orchestration

`runCodingBotOrchestration(brief)` is the top-level deterministic coding-bot function (`src/agents/agentRuntime.ts:180-194`). It:

1. Parses the input with `RequirementBriefSchema`.
2. Calls `decomposeForMiniBots`.
3. Runs `runMiniBot` for each task in `Promise.all`.
4. Runs `runSecurityReview(results)`.
5. Runs `generateEvidencePack(parsedBrief, results, securityReview)`.
6. Returns an `ImplementationBundle`.

This gives the app the shape of a multi-agent system without requiring backend jobs or LLM calls.

## Mini-Bot Decomposition

`decomposeForMiniBots(brief)` always creates four tasks (`src/agents/agentRuntime.ts:73-106`):

- `task-contracts` / `contract_worker`: generate Solidity beta scaffold from the approved brief with enabled modules (`src/agents/agentRuntime.ts:76-82`).
- `task-api` / `api_worker`: document API constraints for chat, codegen, audit package, and evidence export (`src/agents/agentRuntime.ts:83-89`).
- `task-frontend` / `frontend_worker`: define beta user journey and safe rendering behavior (`src/agents/agentRuntime.ts:90-96`).
- `task-tests` / `test_worker`: define tests needed to prove generated outputs and guardrails (`src/agents/agentRuntime.ts:97-103`).

Every task is parsed through `AgentTaskSchema` before return (`src/agents/agentRuntime.ts:105`).

## Mini-Bot Outputs

`runMiniBot(task, brief)` is private to `agentRuntime.ts` and branches by `task.role` (`src/agents/agentRuntime.ts:108-177`):

- `contract_worker`: returns a Solidity artifact from `generateSolidityArtifact`, risk note, and test hints (`src/agents/agentRuntime.ts:108-118`).
- `api_worker`: returns `api/SECURITY_BOUNDARY.md` as an `api-note` artifact with environment-only secrets, origin allowlists, rate limits, body limits, schema validation, and fail-closed config guidance (`src/agents/agentRuntime.ts:120-137`).
- `frontend_worker`: returns `frontend/WORKFLOW.md` as a `frontend-note` artifact with UI and safe rendering guidance (`src/agents/agentRuntime.ts:140-157`).
- `test_worker`: returns a deployment simulation manifest plus `tests/BETA_TEST_PLAN.md` as a `test-plan` artifact (`src/agents/agentRuntime.ts:160-177`).

Every result is parsed through `AgentResultSchema` (`src/agents/agentRuntime.ts:110`, `src/agents/agentRuntime.ts:121`, `src/agents/agentRuntime.ts:141`, `src/agents/agentRuntime.ts:160`).

## Security Reviewer Bot

`runSecurityReview(results)` scans generated artifact content for forbidden regex patterns (`src/agents/security.ts:3-36`). Current blocked patterns include:

- OpenAI-style API keys.
- Private key handling.
- Seed phrase handling.
- Raw `innerHTML =`.
- Secret-like `localStorage.setItem`.
- `ENABLE_REAL_DEPLOY=true`.

If any pattern matches, the review records a finding and the artifact ID in `blockedArtifacts` (`src/agents/security.ts:16-24`). If no pattern matches, it emits one positive finding and approves the bundle (`src/agents/security.ts:27-35`). The security test confirms that private-key content is blocked (`tests/security.test.ts:5-28`).

## Evidence Pack Generator

`generateEvidencePack(brief, results, securityReview)` creates a Markdown evidence pack (`src/agents/evidence.ts:4-60`). The pack includes:

- Generated timestamp.
- Requirement summary.
- Module rationale.
- Security constraints.
- Generated artifact inventory.
- Security review status and findings.
- Work evidence from agent results.
- Disclaimer that the pack evidences engineering preparation only and does not certify legal, regulatory, tax, or investment compliance.

The app renders this Markdown as escaped text and offers a text-file download named `MILA26-Evidence-Pack.md` (`src/App.tsx:167-174`).

## Generated Artifacts

Current artifact kinds are constrained by `GeneratedArtifactSchema` to `solidity`, `manifest`, `frontend-note`, `api-note`, and `test-plan` (`src/domain/schemas.ts:49-55`).

Current generated filenames:

- `contracts/<FundName>FundToken.sol` from `generateSolidityArtifact` (`src/domain/templates.ts:97-103`).
- `deployment/manifest.json` from `generateDeploymentManifest` (`src/domain/templates.ts:106-127`).
- `api/SECURITY_BOUNDARY.md` from the API mini-bot (`src/agents/agentRuntime.ts:126-133`).
- `frontend/WORKFLOW.md` from the frontend mini-bot (`src/agents/agentRuntime.ts:146-153`).
- `tests/BETA_TEST_PLAN.md` from the test mini-bot (`src/agents/agentRuntime.ts:166-173`).

These artifacts are currently displayed in the browser; they are not written into the repository or a database (`src/App.tsx:155-164`).

## Requirement Brief Contract

`RequirementBriefSchema` requires:

- `id`.
- `createdAt`.
- `fundFacts`.
- `modules`.
- `complianceAssumptions`.
- `deploymentTarget`: `simulation-only`, `testnet-disabled`, or `testnet-enabled`.
- `securityConstraints`.
- `unresolvedQuestions`.

The full schema is in `src/domain/schemas.ts:30-39`. `createRequirementBrief` currently always sets `deploymentTarget` to `simulation-only`, uses default modules, includes compliance disclaimers, captures the user goal, applies default security constraints, and adds two unresolved questions (`src/agents/agentRuntime.ts:33-53`).

## Security Review Contract

`SecurityReviewSchema` contains:

- `approved: boolean`.
- `findings: string[]`.
- `blockedArtifacts: string[]`.

The schema is in `src/domain/schemas.ts:66-70`. The implementation approves only when `blockedArtifacts.length === 0` (`src/agents/security.ts:31-35`).

## Evidence Pack Contract

`EvidencePackSchema` contains:

- `id`.
- `generatedAt`.
- `markdown`.

The schema is in `src/domain/schemas.ts:72-76`. The generator assigns `id` as `evidence-${brief.id}`, creates a fresh timestamp, and returns Markdown content (`src/agents/evidence.ts:55-59`).

## Deterministic Simulations

Currently deterministic:

- Blockchain Engineer Bot answers.
- Requirement brief creation.
- Module selection.
- Mini-bot task decomposition.
- Mini-bot outputs.
- Solidity and deployment manifest templates.
- Security review pattern matching.
- Evidence Pack Markdown generation.

The only time-varying fields are `Date.now()`/`new Date().toISOString()` IDs and timestamps (`src/agents/agentRuntime.ts:35-36`, `src/agents/evidence.ts:17`, `src/agents/evidence.ts:56-57`).

## Future LLM/Backend Agent Candidates

These functions are the clearest adapter boundaries for later backend or LLM implementation:

- `answerAsBlockchainEngineer`: can become a backend chat/assistant endpoint while preserving current answer shape.
- `createRequirementBrief`: can become a validated server action that derives modules, assumptions, and unresolved questions from user facts and goal.
- `decomposeForMiniBots`: can become planner output, still parsed by `AgentTaskSchema`.
- `runMiniBot`: can become role-specific backend agent execution.
- `runSecurityReview`: can become a layered local + external audit-agent review.
- `generateEvidencePack`: can become a server-side export with persisted run IDs and artifact references.

The important rewrite constraint is to keep existing schemas or introduce migrations before replacing deterministic functions.
