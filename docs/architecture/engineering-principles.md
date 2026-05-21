# MILA26 Engineering Principles

MILA26 is not a throwaway prototype. It is a durable, funding-demo-ready MVP foundation for helping a small asset manager, tokenized product team, or founder move from a product launch intent to a structured requirement brief, selected servicing modules, generated technical scaffold, security review, and evidence pack.

The app must remain runnable and credible after every stage of work. Prefer visible, coherent progress over deep rewrites that break the current beta journey.

## Core Principle

Build with a stable contract spine and a flexible intelligence layer.

Stable where correctness matters:

- Zod schemas and validation boundaries.
- Requirement Brief, Agent Task, Agent Result, Generated Artifact, Security Review, Evidence Pack, and Implementation Bundle shapes.
- Artifact filenames, artifact kinds, module IDs, agent roles, and evidence pack structure.
- Security review gates and browser secret boundaries.
- Regression tests, golden fixtures, and e2e smoke tests.

Flexible where product intelligence evolves:

- Prompts and agent strategies.
- LLM provider choices.
- Orchestration methods.
- Future modules, exporters, and artifact generators.
- UI extensions that preserve the main journey.

## Minimal Necessary Complexity

MILA26 must avoid overengineering. It should be durable and well-architected, but not heavy, abstract, or complex before the product needs it. The goal is a funding-demo-ready MVP path, not enterprise architecture theatre.

Prefer the simplest design that preserves contracts, testability, debuggability, and future extensibility. Do not introduce abstractions before there are at least two real use cases. Do not introduce infrastructure before the product workflow needs it.

Good architecture for MILA26 means stable contracts, flexible intelligence, efficient execution, and minimal necessary complexity.

Before adding a new abstraction, answer:

1. What concrete problem does this solve now?
2. What future extension does it enable?
3. What complexity does it add?
4. What test protects it?
5. Can this be done more simply?

Good: use one small adapter boundary when adding the first real LLM provider.

Bad: add a database, queue, vector store, agent framework, plugin system, and microservice boundary because they may be useful later.

## Maintainability

Keep responsibilities separated:

- Domain contracts live in schema/contract modules.
- Product module vocabulary lives in the module catalog.
- Artifact generation lives behind template/generator functions.
- Agent orchestration should call typed workers and validate outputs.
- Security review should remain a required gate before release/export.

Good: add a new artifact type by extending the schema, adding a generator, adding tests, and updating the evidence inventory.

Bad: push arbitrary model text directly into UI state and let downstream code infer whether it is a contract, note, test plan, or manifest.

Prefer small replaceable modules over large generic frameworks. Prefer explicit code over clever meta-frameworks.

## Debuggability

Every future run should be traceable:

- What user inputs were used.
- Which Requirement Brief was approved.
- Which modules were selected.
- Which agent tasks ran.
- Which artifacts were generated.
- Which security findings were raised.
- Which evidence pack was exported.

Errors should be structured and explainable. A future backend should distinguish validation errors, model/provider errors, security blocks, compilation failures, export failures, and user-cancelled runs.

Good: a failed generated Solidity compile reports the artifact ID, source task ID, compiler message, and whether the evidence pack was blocked.

Bad: a generic "agent failed" message with no run ID, task ID, or affected artifact.

## Extensibility

Future capabilities should be additive rather than invasive:

- New servicing modules should be registered through a catalog.
- New worker roles should be typed and added to orchestration deliberately.
- New artifact kinds should have explicit contracts and tests.
- New LLM providers should sit behind adapters.
- New exporters should consume Evidence Pack data rather than re-scraping UI text.

Good: introduce `tax-note` as a new `GeneratedArtifact` kind with a generator, evidence pack row, and tests.

Bad: overload `frontend-note` to contain unrelated compliance, tax, and deployment content.

## Test-Protected Evolution

Future rewrites should be incremental and test-protected:

- Preserve current unit tests and Playwright journey.
- Add or update tests before changing behavior.
- Use contract/golden tests for schema and artifact shapes.
- End each implementation track with `npm run check`.
- Run e2e tests when UI journey, visible copy, or user flow changes.

Good: add a golden test for a known `RequirementBrief` before changing artifact generation.

Bad: replace agent orchestration and evidence generation in one change with no parity tests.

## Security By Design

Never put live LLM/API secrets in browser code. Future LLM/backend integration must happen behind a backend/API boundary. Frontend-only security checks are useful for beta feedback, but they are not sufficient for production.

Generated Solidity is scaffold/demo code unless compiled, tested, reviewed, and audited. The product must not imply legal, regulatory, tax, investment, custody, or formal audit certification.

Good: keep `ENABLE_REAL_DEPLOY=false` as the default and require backend enforcement before any future testnet path.

Bad: expose an API key through Vite env variables or accept seed phrases/private keys in browser input.

## Latency Awareness

Latency is a first-class design concern:

- Avoid unnecessary LLM/API calls.
- Use deterministic validation for schemas, safety rules, and formatting where possible.
- Parallelize independent agent work when safe.
- Cache stable outputs when appropriate.
- Keep prompts compact.
- Use faster models for classification/formatting and stronger models only for high-value reasoning.
- Keep UI responsive during longer operations.

Good: validate `FundFacts` locally/server-side before calling any LLM.

Bad: run five sequential LLM calls when one deterministic schema validation plus two parallel calls would satisfy the task.

## Dependency And Version Discipline

Avoid incompatible versions and accidental tooling mismatch:

- Preserve `package-lock.json` discipline.
- Document Node/npm expectations before they matter.
- Avoid new dependencies unless justified.
- Any future dependency addition must explain what it enables or replaces.
- Prefer existing toolchain capabilities before adding libraries.

Good: add a Solidity compiler dependency only when implementing compile tests, and document why it is needed.

Bad: add a queue, database client, vector store, UI kit, and LLM SDK in the same change before an API boundary exists.
