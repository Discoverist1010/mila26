# Current MILA26 Gaps And Next Opportunities

MILA26 now has a blockchain-functional alpha foundation and a lifecycle workspace UI. The active goal is to make the visual tabs progressively functional while preserving the no-backend-private-key, Sepolia-only, no-fake-evidence boundaries.

## Highest-Value Current Gaps

| Area | Current state | Gap | Next opportunity | Risk if rushed |
|---|---|---|---|---|
| Shared lifecycle state | Typed lifecycle state/read models now back investor registry, subscription, redemption, allocation/mint readiness, and maturity placeholders. | Maturity still needs a real closeout model, and browser coverage should keep proving cross-tab state coherence. | Harden shared lifecycle browser/screenshot tests before persistence or live Allocation/Mint execution. | Per-tab state silos and inconsistent Engineering Bot context. |
| Investor Registry | Investor Registry tab supports up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, SCP whitelist handoff, and Allocation/Mint handoff. | No CSV/import/export, durable persistence, or KYC/eligibility workflow. | Use the registry as the target-wallet source for the later wallet-signed allocation/mint operation. | Mistaking wallet whitelisting for KYC/investor eligibility approval. |
| Subscription | Subscription tab captures permitted stablecoins, subscription window, minimum subscription amount, payment address, and payment per token with validation. | No live stablecoin execution, durable persistence, import/export, or receipt reconciliation. | Use the validated subscription state as the pricing/payment context for Allocation/Mint execution design. | Premature stablecoin transfer execution. |
| Redemption | Redemption tab captures redemption window/date, redemption delay, redemption wallet, payout stablecoin, and payout per token with validation. | No live redemption wallet receipt/payout execution or maturity closeout yet. | Use the validated redemption state in the subscription-redemption template handoff and later contract mapping. | Misleading investors into thinking redemption payout execution exists. |
| Asset Servicing | Record NAV Event exists. | Broader investor updates/corporate-action pushes are not implemented. | Add asset-servicing event/update specs after subscription/redemption parameters stabilize. | Advice/notification claims without delivery/evidence model. |
| Allocation/Mint | Readiness panel exists in the Smart Contract tab, sourced from Investor Registry and Subscription state, with target wallet and token amount validation. | No wallet-signed mint/allocation execution, receipt evidence, batch allocation, or stablecoin receipt reconciliation. | Design and test the wallet-signed Sepolia operation contract after browser polish. | Minting against incomplete investor/payment state or implying stablecoin receipt. |
| Evidence | Local-session evidence exists for deployment and two operations. | No durable Evidence Vault persistence. | Add persistence after local-session evidence shape is stable. | Treating local-session evidence as durable records. |
| Persistence/Auth | Local React state only. | Refresh loses generated artifacts and readiness. | Add persistence/auth after lifecycle data shapes are stable. | Premature schema lock-in. |

## Recommended Next Sequence

1. E2E/screenshot hardening for investor registry, subscription, redemption, template handoff, and Allocation/Mint readiness.
2. Wallet-signed Allocation/Mint operation contract using Investor Registry and Subscription state.
3. Website/access first slice that routes into the app without duplicating lifecycle state.
4. Investor Registry import/export and persistence.
5. Durable Evidence Vault persistence.
6. Maturity closeout.

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
