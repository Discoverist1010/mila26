# Current MILA26 Gaps And Next Opportunities

MILA26 has moved beyond the initial rewrite context. The active goal is a blockchain-functional alpha with MetaMask/Sepolia execution, while preserving no-backend-private-key and no-fake-deployment boundaries.

## Highest-Value Current Gaps

| Area | Current state | Gap | Next opportunity | Risk if rushed |
|---|---|---|---|---|
| Wallet connection | Track 13A design/read model exists. | No runtime MetaMask/EIP-1193 connection yet. | Track 13B provider detection, connect request, Sepolia check, account/chain events. | Fake wallet state or stale account/chain UI. |
| Deployment transaction intent | Deployment Gate and Wallet Signing Intent exist. | No unsigned deployment transaction review payload. | Track 14A unsigned deployment intent only. | Signing request without user-review structure. |
| Wallet signing | No signing runtime exists. | No real signature request or tx submission. | Track 14B wallet-signed Sepolia deployment after 14A. | Backend key leakage, wrong-chain signing, fake tx status. |
| Transaction record | No tx hash/contract address exists. | No receipt tracking or display. | Track 14C real tx hash, contract address, receipt status only from real submission. | Fake address/hash or misleading deployed state. |
| SCP operations | Operations locked. | No wallet-signed contract operation yet. | Track 15A one low-risk operation, likely Record NAV Event. | Live-sounding controls before deployed contract exists. |
| Persistence | Local React state only. | Refresh loses generated artifacts and readiness. | Add persistence only after wallet/deployment flow shape stabilizes. | Premature schema lock-in. |
| Auth/payments | Not implemented. | No production user/tenant boundary. | Defer until alpha execution path is proven. | Sprawl before core blockchain functionality. |

## Recommended Next Sequence

1. Track 13B: MetaMask wallet connection + Sepolia verification.
2. Track 14A: unsigned deployment transaction intent and user-review payload.
3. Track 14B: user wallet signs Sepolia deployment.
4. Track 14C: capture real tx hash, contract address, and receipt status.
5. Track 15A: first wallet-signed SCP operation.
6. Persistence/auth hardening after the execution path is stable.

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
