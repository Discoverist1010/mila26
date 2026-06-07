# Persistence Boundary Decision

Status: Sprint 11/12 foundation implemented for workspace snapshots, durable evidence records, and generated artifact records.

## Decision

MILA26 introduces durable persistence behind a backend storage boundary, starting with SQLite for the local MVP.

Do not persist wallet evidence, transaction hashes, contract addresses, generated artifacts, private keys, or investor registry state in browser `localStorage` or `sessionStorage` as the production path.

Sprint 9/10 implements the first backend adapter for project records, versioned lifecycle snapshots, and investor wallet registry rows. Sprint 11/12 extends the same adapter with durable evidence records and generated artifact records. It does not implement auth, live stablecoin execution, production hosted storage, private-key custody, or live Sepolia RPC automation.

## Why This Matters To The User

The asset manager should not have to throw away useful work after a demo. Requirements, investor wallet rules, subscription/redemption parameters, smart-contract artifacts, wallet-signed evidence, and review outputs should become reusable project records when persistence is implemented.

At the same time, persistence must not make unsafe claims stronger than they are. A local-session Sepolia transaction hash is useful evidence for the current session, but it is not a durable Evidence Vault record until stored, indexed, and labelled by the approved persistence layer.

## Persistence Tiers

| Tier | What it stores | User meaning | Current status |
|---|---|---|---|
| Session state | Current React lifecycle state, wallet connection state, local-session deployment/operation evidence, generated artifacts in memory. | The prototype works during the active local/Sepolia session. | Implemented. |
| Durable local MVP storage | Project workspace, lifecycle parameters, investor registry rows, generated artifact records, and provider-derived evidence records. Later: review findings and access/session metadata. | Work can be resumed without relying on browser storage or screenshots. | Foundation implemented. |
| Durable Evidence Vault | Provider-returned transaction hashes, receipt-confirmed contract addresses, operation receipts, decoded/receipt-confirmed event evidence, artifact links, and provenance labels. | Investors, auditors, and internal reviewers can inspect the evidence trail without relying on screenshots or chat history. | Foundation implemented for current Sepolia deployment/NAV/whitelist/allocation evidence shapes. |
| Production storage | Hosted persistence, access control, backups, retention/deletion policy, audit logs, and release controls. | The product can support beta and later live deployment workflows with stronger operational controls. | Future implementation. |

## Initial Backend Storage Shape

The SQLite-backed local MVP starts with these records:

- `projects`: product workspace identity, status, created/updated timestamps.
- `lifecycle_snapshots`: versioned requirements, investor registry, subscription, redemption, maturity, and allocation parameters.
- `investor_wallets`: wallet address, label, source, validation status, whitelist status, and timestamps.
- `evidence_records`: provider-derived deployment, Record NAV, Wallet Whitelist, and Allocation/Mint evidence with transaction hash, receipt, event, snapshot, and provenance labels.
- `artifact_records`: Requirement Brief, Engineering Brief, Smart Contract Spec, Artifact Preview, Check Result, and Evidence-Lite payloads with content hash and lifecycle snapshot context.

Later persistence work should add these records only when the surrounding evidence contracts are stable:

- `review_findings`: code, UX, security, Solidity, state/performance, and release findings when applicable.

The current local adapter uses Node's `node:sqlite` API for the prototype storage layer. Node currently emits an experimental warning for this module in the local Node 22 runtime, which means the API may still change across Node releases. This is acceptable for the prototype because all direct SQLite usage is isolated inside the workspace persistence repository.

Before upgrading Node or moving this storage path toward beta, future implementers must:

- run `node -v` and record the runtime used for validation;
- run `npm run check` so TypeScript, lint, unit/integration tests, build, and bundle checks catch `node:sqlite` API drift;
- run `npm run test:e2e` so browser flows still work after storage changes;
- watch for changed or removed `node:sqlite` warnings during test/API startup;
- if `DatabaseSync` or SQLite behavior changes, keep the `WorkspacePersistenceRepository` contract stable and replace only the storage adapter.

Do not move persistence rules into React components to work around a Node SQLite change. The safety design is that the app lifecycle and UI use typed API/repository contracts, while the SQLite implementation remains a swappable backend adapter.

## Guardrails

- The app lifecycle state remains the source of truth for active tab behavior.
- Website access state must not become a second lifecycle state model.
- Loading a workspace snapshot should reset local-session-only wallet evidence, generated test wallet private-key exports, and transient smart-contract artifacts unless those artifacts have their own durable storage contract.
- Persistence must preserve freshness and provenance labels: local-session, provider-returned, receipt-confirmed, durable evidence.
- Private keys and wallet signatures must not be persisted.
- Generated test investor wallet private keys remain explicit test-only exports, not normal project records.
- Evidence must not be labelled durable unless it was stored and retrieved through the Evidence Vault API/repository.
- Generated artifacts are tied to a lifecycle snapshot version; when the lifecycle snapshot advances, older artifact records must show stale context rather than current context.
- Durable evidence is tied to a lifecycle snapshot version; if the workspace changes afterward, older evidence must show historical context rather than current context.
- Any persistence implementation must trigger the State / Memory / Performance review lens.

## Next Implementation Step

Extend persistence only after the foundation remains stable:

1. Add Live Sepolia readiness using public addresses and RPC configuration, behind explicit live-test flags.
2. Feed real provider-returned Sepolia transaction hashes and receipt-confirmed contract addresses into the durable Evidence Vault path.
3. Add access/login state without duplicating lifecycle ownership.
4. Decide whether beta should remain on local SQLite or move to hosted storage with backups and audit logging.
