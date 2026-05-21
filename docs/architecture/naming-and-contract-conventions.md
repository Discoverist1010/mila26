# MILA26 Naming And Contract Conventions

Use one canonical name for each product concept. Do not introduce duplicate names for the same concept unless the new concept is genuinely different and documented.

## Canonical Domain Names

- `FundFacts`: user-provided fund/product facts needed to create a requirement brief.
- `RequirementBrief`: approved structured requirements derived from fund facts and user goal.
- `AgentTask`: one typed unit of worker/mini-bot work.
- `AgentResult`: the result of one worker/mini-bot task.
- `GeneratedArtifact`: a generated file-like output with kind, filename, content, and source task.
- `SecurityReview`: approval status, findings, and blocked artifact IDs.
- `EvidencePack`: generated evidence markdown/export content.
- `ImplementationBundle`: top-level result containing brief, tasks, results, security review, and evidence pack.

Avoid aliases such as `fundInfo`, `fund_data`, `fundProfile`, `spec`, `briefJson`, `botOutput`, or `auditPack` unless they represent a clearly distinct concept and the distinction is documented.

## Canonical Agent Names

Product-facing names:

- Blockchain Engineer Bot.
- Coding Bot.
- Security Reviewer Bot.
- Evidence Pack Bot.
- Mini-bots / workers.

Code-facing roles:

- `contract_worker`.
- `api_worker`.
- `frontend_worker`.
- `test_worker`.

When adding a new role, use a lowercase snake-case role ID, a clear product label, a scoped responsibility, acceptance criteria, and tests.

## Module Naming Rules

Module IDs should be:

- Lowercase kebab-case.
- Stable once persisted or used in generated artifacts.
- Specific enough to avoid ambiguity.
- Registered in the module catalog before use.

Examples:

- Good: `nav-oracle`, `investor-registry`, `cash-registry`.
- Bad: `nav`, `registry2`, `fundStuff`, `InvestorRegistry`.

Module labels should be human-readable and stable for evidence packs. Module rationale should explain why the module is selected for a specific requirement brief.

## Artifact Naming Rules

Artifact kinds should be explicit and schema-backed. Current canonical kinds are:

- `solidity`.
- `manifest`.
- `frontend-note`.
- `api-note`.
- `test-plan`.

Artifact filenames should look like real repository paths but should not imply production readiness unless the artifact is actually production-ready.

Examples:

- Good: `contracts/MilaIncomeFundToken.sol`.
- Good: `deployment/manifest.json`.
- Good: `api/SECURITY_BOUNDARY.md`.
- Bad: `final-audited-contract.sol` for an uncompiled scaffold.
- Bad: `misc.txt` for a contract or security boundary.

Every artifact must have a `sourceTaskId` linking it back to an `AgentTask`.

## Variable Naming Conventions

- Use camelCase for variables and functions.
- Use PascalCase for TypeScript types and React components.
- Use the canonical domain names in type names and function names.
- Prefer `brief` for a `RequirementBrief`, `facts` for `FundFacts`, `task` for `AgentTask`, `result` for `AgentResult`, `artifact` for `GeneratedArtifact`, `securityReview` for `SecurityReview`, and `evidencePack` for `EvidencePack`.
- Use `bundle` only for an `ImplementationBundle`.

Examples:

- Good: `createRequirementBrief(facts, userGoal)`.
- Good: `runCodingBotOrchestration(brief)`.
- Good: `generateEvidencePack(brief, results, securityReview)`.
- Bad: `makeSpec(fundInfo)`.
- Bad: `runBots(data)`.
- Bad: `auditResult` when the object is actually a `SecurityReview`.

## File Naming Conventions

- Documentation files use lowercase kebab-case.
- Architecture docs live in `docs/architecture/`.
- Preservation and contract guardrails live in `docs/contracts/`.
- Context snapshots live in `docs/context-pack/`.
- Source modules should keep their current responsibility-focused names unless a deliberate migration happens.

Examples:

- Good: `docs/architecture/rewrite-strategy.md`.
- Good: `docs/contracts/preservation-guardrails.md`.
- Bad: `docs/new stuff/final doc.md`.

## Naming Mistakes To Avoid

- Introducing `FundProfile` when it means `FundFacts`.
- Calling the Evidence Pack an `AuditPack` before it is a real audit artifact.
- Calling generated Solidity `production`, `deployed`, `audited`, or `certified`.
- Using both `mini-bot` and `subagent` in user-facing copy without explaining the relationship.
- Adding provider names to core domain contracts, such as `OpenAIAgentTask`.
- Renaming module IDs casually after generated artifacts or persisted runs depend on them.
