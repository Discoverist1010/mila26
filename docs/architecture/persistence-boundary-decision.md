# Persistence Boundary Decision

Status: Sprint 8 decision, not a live persistence implementation.

## Decision

MILA26 should introduce durable persistence behind a backend storage boundary, starting with SQLite for the local MVP.

Do not persist lifecycle state, wallet evidence, transaction hashes, contract addresses, generated artifacts, private keys, or investor registry state in browser `localStorage` or `sessionStorage` as the production path.

## Why This Matters To The User

The asset manager should not have to throw away useful work after a demo. Requirements, investor wallet rules, subscription/redemption parameters, smart-contract artifacts, wallet-signed evidence, and review outputs should become reusable project records when persistence is implemented.

At the same time, persistence must not make unsafe claims stronger than they are. A local-session Sepolia transaction hash is useful evidence for the current session, but it is not a durable Evidence Vault record until stored, indexed, and labelled by the approved persistence layer.

## Persistence Tiers

| Tier | What it stores | User meaning | Current status |
|---|---|---|---|
| Session state | Current React lifecycle state, wallet connection state, local-session deployment/operation evidence, generated artifacts in memory. | The prototype works during the active local/Sepolia session. | Implemented. |
| Durable local MVP storage | Project workspace, lifecycle parameters, investor registry, artifact versions, operation evidence references, review findings, and access/session metadata. | Work can be resumed, reviewed, and shown as a coherent project record. | Decision made; implementation pending. |
| Durable Evidence Vault | Provider-returned transaction hashes, receipt-confirmed contract addresses, operation receipts, decoded event evidence, artifact links, and provenance labels. | Investors, auditors, and internal reviewers can inspect the evidence trail without relying on screenshots or chat history. | Future implementation. |
| Production storage | Hosted persistence, access control, backups, retention/deletion policy, audit logs, and release controls. | The product can support beta and later live deployment workflows with stronger operational controls. | Future implementation. |

## Initial Backend Storage Shape

When implemented, the SQLite-backed local MVP should prioritize these records:

- `projects`: product workspace identity, status, created/updated timestamps.
- `lifecycle_snapshots`: versioned requirements, investor registry, subscription, redemption, maturity, and allocation parameters.
- `investor_wallets`: wallet address, label, source, validation status, whitelist status, and timestamps.
- `artifacts`: Requirement Brief, Engineering Brief, Smart Contract Spec, artifact preview, check result, and evidence-lite references.
- `wallet_evidence`: deployment, Record NAV, Wallet Whitelist, and Allocation/Mint provider/receipt evidence with provenance labels.
- `review_findings`: code, UX, security, Solidity, state/performance, and release findings when applicable.

## Guardrails

- The app lifecycle state remains the source of truth for active tab behavior.
- Website access state must not become a second lifecycle state model.
- Persistence must preserve freshness and provenance labels: local-session, provider-returned, receipt-confirmed, durable evidence.
- Private keys and wallet signatures must not be persisted.
- Generated test investor wallet private keys remain explicit test-only exports, not normal project records.
- Evidence must not be labelled durable until the Evidence Vault implementation stores and retrieves it.
- Any persistence implementation must trigger the State / Memory / Performance review lens.

## Next Implementation Step

Build the smallest backend persistence adapter after the schema is reviewed:

1. Add SQLite schema and repository interfaces.
2. Persist project and lifecycle snapshots first.
3. Add investor registry persistence second.
4. Add durable evidence storage only after deployment/operation evidence contracts are stable.
5. Add access/login state without duplicating lifecycle ownership.
