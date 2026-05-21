# MILA26 Preservation Guardrails

MILA26 is a durable MVP foundation, not a throwaway prototype. Preserve the working beta skeleton until each part has a tested replacement.

Durable does not mean overbuilt. Preserve contracts and tests, but avoid adding databases, queues, vector stores, agent frameworks, plugin systems, or microservice boundaries before the product workflow needs them.

## Current Beta Journey

Preserve this journey:

Fund setup -> Requirement Brief -> module selection -> Coding Bot orchestration -> generated artifacts -> Security Review -> Evidence Pack.

The current implementation is deterministic and frontend-only, but the journey is the product baseline for future backend, LLM, persistence, memory, and audit work.

## Contracts To Preserve

- `FundFacts`.
- `RequirementBrief`.
- `AgentTask`.
- `AgentResult`.
- `GeneratedArtifact`.
- `SecurityReview`.
- `EvidencePack`.
- `ImplementationBundle`.
- Servicing module catalog and module IDs.
- Agent role names.
- Artifact kinds and filenames.
- Evidence pack structure.

Any contract change must be deliberate, documented, migrated where needed, and protected by tests.

MVP contract changes must update affected fixtures in `tests/fixtures/contracts/` and contract coverage in `tests/contracts.test.ts`.

## Files Not To Delete Before Replacement

- `src/domain/schemas.ts`.
- `src/domain/moduleCatalog.ts`.
- `src/domain/templates.ts`.
- `src/agents/agentRuntime.ts`.
- `src/agents/security.ts`.
- `src/agents/evidence.ts`.
- `src/App.tsx`.
- `tests/agent-runtime.test.ts`.
- `tests/security.test.ts`.
- `tests/e2e/mila26.spec.ts`.
- `.env.example`.
- `README.md`.
- `docs/context-pack/`.
- `docs/architecture/`.
- `docs/contracts/`.

## Tests To Run After Changes

Baseline command:

```bash
npm run check
```

Also run when relevant:

```bash
npm run test:e2e
```

Run e2e tests when changing the UI journey, visible workflow copy, generated artifact display, evidence pack flow, or app startup behavior.

## Browser Secret Warning

Never put live LLM/API/audit/wallet/custody/deployment secrets in browser code. Future LLM and audit-agent calls must run behind a backend/API boundary. Vite client environment variables are not secret.

## Generated Solidity Warning

Generated Solidity is scaffold/demo code unless compiled, tested, security-reviewed, and externally audited. Do not label generated contracts as production-ready, deployed, compliant, certified, or audited.

For MVP, generated Solidity is demo/testnet scaffold until compiled, tested, and reviewed against smart-contract security benchmarks. No mainnet deployment is in scope. Real-world investor names should stay off-chain by default.

Solidity generation should default to OpenZeppelin Contracts for ERC-20/ERC-721 and common access-control/security primitives unless the approved PRD explicitly justifies otherwise. Any deviation must be reflected in the affected fixtures/tests and recorded in the PRD, QA review, Security Review, and Evidence Pack.

## Latency Warning

Latency is a product concern. Avoid unnecessary LLM/API calls, avoid unjustified sequential multi-agent calls, keep prompts compact, parallelize independent work safely, and keep the UI responsive during long operations.

## No Throwaway Rewrite Warning

Do not wipe the current skeleton blindly. Replace pieces incrementally:

- Preserve behavior.
- State the contract being touched.
- Add or update tests first where practical.
- Keep deterministic fallback where useful.
- Keep the funding-demo journey runnable after each track.

## Track 1 Contract Test Note

Track 1 protects the current contract spine but does not freeze future implementation details. Future backend, LLM, memory, and persistence work should preserve these contracts or migrate them deliberately with tests.
