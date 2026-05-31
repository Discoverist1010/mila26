# Current MILA26 Gaps And Next Opportunities

MILA26 has moved beyond the initial rewrite context. The active goal is a blockchain-functional alpha with MetaMask/Sepolia execution, while preserving no-backend-private-key and no-fake-deployment boundaries.

## Highest-Value Current Gaps

| Area | Current state | Gap | Next opportunity | Risk if rushed |
|---|---|---|---|---|
| Wallet connection | Track 13B frontend-only EIP-1193 connection exists. | No persistence or multi-wallet orchestration yet. | Keep wallet connection stable while operation tracks consume it. | Mistaking wallet connection for signing/deployment readiness. |
| Deployment transaction intent | Track 14A unsigned deployment intent read model exists. | Durable deployment evidence storage is still absent. | Use Track 14C local-session evidence as the input to the next operation track. | Treating local-session evidence as durable storage. |
| Wallet signing | Track 15A adds wallet-signed Record NAV Event after Track 14B deployment. | Broader operation signing remains future. | Track 15B Whitelist + Allocation/Mint Operation if 15A is clean. | Backend key leakage, wrong-chain signing, fake tx status. |
| Transaction record | Track 14C local-session deployment evidence/readiness exists. | No durable Evidence Pack storage/indexing yet. | Defer storage until operation evidence shape is proven. | Fake address/hash or misleading durable deployed state. |
| SCP operations | Record NAV Event is the first gated wallet-signed operation. | Mint/Burn/Pause/Distribution/Whitelist remain locked. | Track 15B Whitelist + Allocation/Mint Operation. | Live-sounding controls before deployed contract exists. |
| Persistence | Local React state only. | Refresh loses generated artifacts and readiness. | Add persistence only after wallet/deployment flow shape stabilizes. | Premature schema lock-in. |
| Auth/payments | Not implemented. | No production user/tenant boundary. | Defer until alpha execution path is proven. | Sprawl before core blockchain functionality. |

## Recommended Next Sequence

1. Track 15A.1 hardening if Record NAV event evidence needs cleanup, otherwise Track 15B Whitelist + Allocation/Mint Operation.
2. Operation evidence linkage for transaction hash, receipt, and event result.
3. Persistence/auth hardening after the execution path is stable.

## Guardrails For All Future Tracks

- No backend private-key custody.
- No mainnet.
- No fake wallet address.
- No fake contract address.
- No fake transaction hash.
- No signed/submitted/confirmed/deployed status unless backed by real wallet/provider state.
- No SCP operation controls until a wallet-signed deployment and operation authorization gate exist.
- No audit/security approval claim from local compile/test or spec-consistency checks.
- No monolithic lifecycle context.

## Useful Tests To Preserve And Extend

- Golden lifecycle flow in `tests/app-chat-panel.test.tsx`.
- E2E smoke in `tests/e2e/mila26.spec.ts`.
- No-fake-execution helper in `tests/golden-flow-assertions.ts`.
- Wallet connection read-model tests in `tests/wallet-connection-read-model.test.ts`.
- Deployment gate and wallet-signing intent read-model tests.
- Hardhat contract tests through `npm run test:contracts`.

## Documentation Rule

When a track changes the lifecycle state, update:

- `docs/handover/00-mila26-current-checkpoint.md`
- `docs/handover/03-mila26-track-status.md`
- `docs/handover/04-mila26-next-prompts.md`
- relevant contract/architecture docs

This prevents future sessions from resuming from obsolete track prompts.
