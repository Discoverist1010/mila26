# Current MILA26 Gaps And Next Opportunities

MILA26 now has a blockchain-functional alpha foundation and a lifecycle workspace UI. The active goal is to make the visual tabs progressively functional while preserving the no-backend-private-key, Sepolia-only, no-fake-evidence boundaries.

## Highest-Value Current Gaps

| Area | Current state | Gap | Next opportunity | Risk if rushed |
|---|---|---|---|---|
| Shared lifecycle state | Typed lifecycle state/read models now back investor registry, subscription, redemption, and maturity placeholders. | Subscription, redemption, and maturity still need parameter edit flows. | Build parameter capture on the shared lifecycle state instead of per-tab local state. | Per-tab state silos and inconsistent Engineering Bot context. |
| Investor Registry | Investor Registry tab supports up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, and SCP handoff. | No CSV/import/export, durable persistence, or KYC/eligibility workflow. | Use the registry as the allocation/mint dependency after subscription parameters exist. | Mistaking wallet whitelisting for KYC/investor eligibility approval. |
| Subscription | UI shows subscription parameters needed. | No permitted stablecoin/payment-per-token template parameter capture. | Add subscription template parameter UI and read model. | Premature stablecoin transfer execution. |
| Redemption | UI shows redemption parameters needed. | No redemption delay, redemption wallet, or payout-per-token parameter capture. | Add redemption template parameter UI and read model. | Misleading investors into thinking redemption payout execution exists. |
| Asset Servicing | Record NAV Event exists. | Broader investor updates/corporate-action pushes are not implemented. | Add asset-servicing event/update specs after subscription/redemption parameters stabilize. | Advice/notification claims without delivery/evidence model. |
| Allocation/Mint | Locked for later. | No allocation/mint operation. | Add only after investor registry and subscription parameters are coherent. | Minting against incomplete investor/payment state. |
| Evidence | Local-session evidence exists for deployment and two operations. | No durable Evidence Vault persistence. | Add persistence after local-session evidence shape is stable. | Treating local-session evidence as durable records. |
| Persistence/Auth | Local React state only. | Refresh loses generated artifacts and readiness. | Add persistence/auth after lifecycle data shapes are stable. | Premature schema lock-in. |

## Recommended Next Sequence

1. Subscription parameter capture.
2. Redemption parameter capture, including delay unit/duration.
3. Smart-contract template parameter handoff for subscription-redemption.
4. Allocation/Mint operation using Investor Registry and Subscription state.
5. Investor Registry import/export and persistence.
6. Durable Evidence Vault persistence.
7. Maturity closeout.

## Guardrails For All Future Work

- Tabs are visual only; shared lifecycle state remains cross-stage.
- Engineering Bot must have context across all stages.
- No backend private-key custody.
- No mainnet.
- No fake wallet address.
- No fake contract address.
- No fake transaction hash.
- No signed/submitted/confirmed/deployed status unless backed by real wallet/provider state.
- No SCP operation controls until wallet/deployment/operation gates exist.
- No audit/security approval claim from local compile/test or spec-consistency checks.
- No KYC, investor eligibility, legal approval, compliance approval, or investment-advice claim.

## Useful Tests To Preserve And Extend

- App lifecycle flow in `tests/app-chat-panel.test.tsx`.
- E2E smoke in `tests/e2e/mila26.spec.ts`.
- No-fake-execution helper in `tests/golden-flow-assertions.ts`.
- Wallet connection read-model tests.
- Deployment gate, wallet-signing intent, deployment evidence, Record NAV, and Wallet Whitelist read-model tests.
- Hardhat contract tests through `npm run test:contracts`.

## Documentation Rule

When a lifecycle capability changes, update:

- `docs/handover/00-mila26-current-checkpoint.md`
- `docs/handover/03-mila26-track-status.md`
- `docs/handover/04-mila26-next-prompts.md`
- `docs/product/mvp-user-journey.md`
- relevant contract/architecture docs

This prevents future sessions from resuming from obsolete track prompts.
