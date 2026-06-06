# Current MILA26 Gaps And Next Opportunities

MILA26 now has a blockchain-functional alpha foundation and a lifecycle workspace UI. The active goal is to make the visual tabs progressively functional while preserving the no-backend-private-key, Sepolia-only, no-fake-evidence boundaries.

## Highest-Value Current Gaps

| Area | Current state | Gap | Next opportunity | Risk if rushed |
|---|---|---|---|---|
| Shared lifecycle state | Typed lifecycle state/read models now back investor registry, subscription, redemption, allocation/mint readiness, and maturity placeholders. | Maturity still needs a real closeout model, and browser coverage should keep proving cross-tab state coherence. | Harden shared lifecycle browser/screenshot tests before persistence or new operation slices. | Per-tab state silos and inconsistent Engineering Bot context. |
| Investor Registry | Investor Registry tab supports up to 50 wallet addresses with validation, duplicate detection, local-session whitelist status, SCP whitelist handoff, Allocation/Mint handoff, generated test investor wallet packs, and Smart Contract tab funding-helper targets. | No durable persistence, off-chain investor profile fields, CSV import/export, or KYC/eligibility workflow. | Use the generated/manual registry as the target-wallet source for demo investor activities and future persistence. | Mistaking generated test wallets, Sepolia funding, or wallet whitelisting for KYC/investor eligibility approval. |
| Subscription | Subscription tab captures permitted stablecoins, subscription window, minimum subscription amount, payment address, and payment per token with validation. | No live stablecoin execution, durable persistence, import/export, or receipt reconciliation. | Use the validated subscription state as the pricing/payment context for subscription execution design. | Premature stablecoin transfer execution. |
| Redemption | Redemption tab captures redemption window/date, redemption delay, redemption wallet, payout stablecoin, and payout per token with validation. | No live redemption wallet receipt/payout execution or maturity closeout yet. | Use the validated redemption state in the subscription-redemption template handoff and later contract mapping. | Misleading investors into thinking redemption payout execution exists. |
| Asset Servicing | Record NAV Event exists. | Broader investor updates/corporate-action pushes are not implemented. | Add asset-servicing event/update specs after subscription/redemption parameters stabilize. | Advice/notification claims without delivery/evidence model. |
| Allocation/Mint | Single-investor wallet-signed Sepolia Allocation/Mint exists in the Smart Contract tab, sourced from Investor Registry, Wallet Whitelist, Subscription, deployment evidence, ABI, and token amount validation. | No batch allocation, stablecoin receipt reconciliation, durable evidence, or production allocation reporting. | Harden browser review, demo funding support, and repeated-operation tests. | Minting against incomplete investor/payment state or implying stablecoin receipt. |
| Evidence | Local-session evidence exists for deployment and three operations. | No durable Evidence Vault persistence. | Add persistence after local-session evidence shape is stable. | Treating local-session evidence as durable records. |
| Persistence/Auth | Local React state only. | Refresh loses generated artifacts and readiness. | Add persistence/auth after lifecycle data shapes are stable. | Premature schema lock-in. |

## Recommended Next Sequence

1. Website/access first slice that routes into the app without duplicating lifecycle state.
2. Investor Registry persistence.
3. Durable Evidence Vault persistence.
4. Subscription-redemption execution design and adapter contracts.
5. Maturity closeout.

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
