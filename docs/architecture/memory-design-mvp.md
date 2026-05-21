# MVP Memory Design

MILA26 memory should support the user journey without introducing heavy retrieval infrastructure too early.

## Memory Types

### Turn Memory

Stores:

- Recent chat turns.
- Current question and answer context.
- Clarifying answers from the asset manager.

Supports:

- Real turn-based Blockchain Engineering Bot chat.
- Follow-up questions while workers are running.

Initial persistence:

- Can remain temporary in memory until backend/chat persistence exists.

### Run Memory

Stores:

- PRD/Requirement Brief for one run.
- Bot tasks and statuses.
- Generated artifacts.
- QA/security findings.
- Evidence pack output.
- Transaction preparation/status once deployment track begins.

Supports:

- Visible orchestration progress.
- Traceability from approved PRD to artifacts and evidence.

Initial persistence:

- Persist later in SQLite when backend/run history is introduced.

### Project Memory

Stores:

- Asset manager project profile.
- Chosen ERC protocol.
- Up to 20 investor wallet addresses.
- Off-chain real-world investor names.
- Allocation percentages.
- Testnet contract address after deployment.
- Valuation upload summaries.

Supports:

- Returning to the same local project.
- Mint/distribute and performance update flows.

Initial persistence:

- Persist later in SQLite for the local Mac demo.

### Working Memory

Stores:

- Temporary per-bot scratch context.
- Prompt inputs.
- Intermediate validation results.
- Short-lived compile/test/audit context.

Supports:

- Worker execution without polluting long-term project state.

Initial persistence:

- Temporary only unless needed for debugging failed runs.

## SQLite Persistence Later

When persistence is introduced, SQLite should store:

- Chat sessions/turn summaries.
- PRD/Requirement Brief versions.
- Run records and statuses.
- Bot tasks and results.
- Generated artifacts and evidence packs.
- Security/QA findings.
- Project wallet list and off-chain investor names.
- Allocation state.
- Valuation upload metadata and summaries.
- Testnet deployment transaction hashes/statuses.

## Temporary Initially

Can remain temporary at first:

- Working memory.
- Intermediate prompt inputs.
- In-progress worker scratch state.
- Non-approved draft outputs.
- Cached validation results.

## Caching

Cache:

- Stable module/protocol explanations.
- Deterministic validation results for unchanged inputs.
- Generated outputs keyed by approved PRD/Requirement Brief.
- Evidence export for a stable run.

Do not cache blindly:

- Private or sensitive user input without retention policy.
- Raw model output before validation.
- Unsafe or blocked artifacts as approved.
- Wallet signatures or private keys.
- Stale valuation results that users may treat as current.

## Memory, Caching, Orchestration, And Latency

Memory should reduce repeated work, not hide decision-making. Orchestration should read from stable approved inputs and write clear run events. Caching should speed deterministic or repeated work while preserving traceability.

Avoid memory designs that make the demo harder to explain, harder to debug, or dependent on heavyweight retrieval.

## Deferred

- Vector memory.
- Heavy RAG.
- Long-term user memory across multiple asset managers.
- Cross-project personalization.

Add these only when structured memory and SQLite are no longer enough for a concrete near-term track.
