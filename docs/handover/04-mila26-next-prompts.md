# MILA26 Next Prompts

## Next Codex Prompt: Track 14C Deployment Status / Evidence Linkage

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main.

Before making changes:
1. Confirm Track 14B has been committed and pushed.
2. Run:
   git status --short --branch
3. Working tree must be clean before starting.
4. Run baseline validation:
   npm run check
   npm run test:e2e

Current project status:
- Track 13B added frontend-only EIP-1193 wallet connection and Sepolia verification.
- Track 14A added the review-only UnsignedDeploymentIntentReadModel.
- Track 14B added frontend-only wallet-signed Sepolia deployment:
  - user wallet signs in browser.
  - backend never holds private keys.
  - account and chain are re-checked immediately before eth_sendTransaction.
  - duplicate deployment attempts are blocked while awaiting wallet confirmation or receipt.
  - transaction hash appears only after provider response.
  - contract address appears only after successful receipt confirmation.
  - deployment status is local-session-only.
  - SCP operations remain locked.

We are starting Track 14C - Deployment Status / Evidence Linkage.

Goal:
Link real Track 14B deployment outputs into MILA26 evidence/readiness without adding new wallet execution or SCP operations.

Important:
Track 14C should consume already-returned deployment outputs. It should not add a new deployment route, backend signing, private-key custody, mainnet, fake tx hash/address, or active Mint/Burn/Pause/NAV/Distribution controls.

Suggested outputs:
- typed deployment evidence/status read model.
- evidence item candidates for transaction hash, contract address, chain, receipt status, artifact hash, and local-session source.
- SCP/readiness projection that distinguishes evidence-linked deployment state from operation readiness.

Acceptance criteria:
- real tx hash and contract address can be represented only if they came from provider/receipt output.
- deployment evidence linkage is distinct from wallet execution.
- SCP operations remain locked until a later operation-specific track.
- backend never holds private keys.
- mainnet remains disabled.
- tests pass.
```

## Later Prompt: Track 15A First Wallet-Signed SCP Operation

```text
Implement only after wallet-signed Sepolia deployment evidence linkage exists.

Add one low-risk wallet-signed SCP operation, likely Record NAV Event, with operation authorization, evidence logging, and no fake live metrics.
```
