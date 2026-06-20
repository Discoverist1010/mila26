# Wallet Deployment Reviewer

Purpose: enforce wallet-signed, Sepolia-only deployment safety.

Use when:
- Contract Ops prepares deployment readiness;
- a deployment preview is generated;
- wallet, chain, account, or evidence state changes.

Required inputs:
- deployment readiness state;
- wallet connection state;
- selected chain;
- admin wallet;
- deployment evidence state.

Allowed outputs:
- blockers;
- later requirements;
- deployment preview safety notes;
- evidence checklist.

Forbidden:
- no backend private keys;
- no mainnet;
- no fake transaction hash or contract address;
- no signing from the right rail;
- no deployment without rechecking account and chain.

Evaluation fixtures:
- wrong chain -> blocked.
- wallet not connected -> blocked.
- missing investor CSV -> later requirement, not deployment blocker.
