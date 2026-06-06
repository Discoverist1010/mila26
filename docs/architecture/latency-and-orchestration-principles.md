# MILA26 Latency And Orchestration Principles

Stable contracts, flexible intelligence, efficient execution.

Latency is a first-class design concern for MILA26. The product must stay responsive during demos and credible under technical review, especially as future backend, LLM, persistence, and audit features are added.

## Fast Path Vs Deep Reasoning Path

Use the fast path for:

- Local form validation.
- Schema validation.
- Deterministic safety checks.
- Module catalog lookup.
- Artifact inventory formatting.
- Evidence pack assembly from already-validated data.
- Simple classification where deterministic rules are enough.

Use the deep reasoning path for:

- Ambiguous requirement interpretation.
- Complex tradeoff explanation.
- Multi-step technical planning.
- Security analysis that benefits from model reasoning.
- Evidence/audit narrative synthesis.
- Future agent planning across several modules or artifacts.

Do not use the deep path simply because an LLM is available.

## When To Use Deterministic/Local Validation

Prefer deterministic or local validation when correctness can be expressed as a rule:

- Required fields and allowed enum values.
- Module IDs and artifact kinds.
- Missing security constraints.
- Browser secret patterns.
- Evidence pack section presence.
- Generated artifact traceability.

This keeps the app fast, testable, and less dependent on provider availability.

## When To Use LLM Calls

Use LLM calls when the output requires interpretation, synthesis, or domain reasoning that cannot be captured cleanly by rules. Future LLM calls should:

- Happen behind backend/API boundaries.
- Return typed, schema-validated data.
- Include deterministic fallback where practical.
- Be scoped to the smallest useful task.
- Avoid exposing raw provider output directly to UI or evidence exports.

## When To Parallelize

Parallelize when tasks are independent and share a stable input contract:

- Contract scaffold generation.
- API boundary notes.
- Frontend workflow notes.
- Test plan generation.
- Independent evidence sections.
- Independent security analysis passes.

Current deterministic orchestration already models this with `Promise.all` over mini-bot tasks. Preserve that pattern unless task dependencies require sequencing.

## When Not To Parallelize

Do not parallelize when:

- One task depends on another task's validated output.
- Shared mutable state would create race conditions.
- A security gate must block downstream release/export.
- The provider or infrastructure has strict rate limits.
- Parallel calls would make errors harder to explain than the latency savings justify.

Example: evidence export should wait for security review results before marking a bundle approved.

## Caching Considerations

Cache stable outputs when they are expensive and keyed by clear inputs:

- Requirement Brief previews for unchanged `FundFacts` and goal.
- Module catalog metadata.
- Deterministic generated artifacts from the same brief.
- Evidence pack exports for a persisted run.
- LLM responses only when the prompt, model, input contracts, and safety posture are stable.

Do not cache secrets, raw private inputs beyond the intended retention policy, or unreviewed unsafe outputs as approved artifacts.

## Prompt Compactness

Future prompts should be compact and contract-focused:

- Include only the fields needed for the task.
- Reference canonical names.
- Ask for schema-shaped output where possible.
- Avoid pasting whole run histories when a summary and IDs are enough.
- Separate planner prompts from worker prompts.

Long prompts increase cost, latency, and failure surface.

Current prompt guards are fail-soft:

- Current user messages are never truncated.
- Required structured inputs, such as the full Requirement Brief JSON, are never partially truncated.
- Optional chat history is dropped oldest-first and only as complete turns.
- If required context exceeds budget, MILA26 uses deterministic fallback instead of calling the LLM with incomplete context.
- Prompt metadata may include size diagnostics, but not raw prompt content.

## Streaming And Async UX

Longer operations should keep the UI responsive:

- Show immediate validation feedback.
- Show run/task progress.
- Stream or incrementally reveal safe status updates where useful.
- Separate "brief accepted" from "artifacts generated" from "security reviewed" from "evidence exported."
- Allow future cancellation/retry at task or run level.

Do not freeze the UI while waiting for multi-agent generation or audit-style review.

## Future Multi-Agent Orchestration Guidance

Future orchestration should preserve:

- A stable run input contract.
- Typed task planning.
- Worker-specific outputs.
- Security review before evidence approval.
- Run logs that explain what happened.
- Provider-agnostic adapter boundaries.

Avoid sequential multi-agent calls unless there is a clear dependency. Sequential calls compound latency and failure risk. When sequencing is required, document why and show which output becomes the next input.
