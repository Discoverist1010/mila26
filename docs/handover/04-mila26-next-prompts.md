# MILA26 Next Prompts

## Next Codex Prompt: Track 15A.1 or 15B

If Track 15A event decoding, local-session operation evidence, or SCP gating needs cleanup, run a short Track 15A.1 hardening track.

If Track 15A is clean, proceed to Track 15B - Whitelist + Allocation/Mint Operation.

## Prior Prompt: Track 15A First SCP Wallet-Signed Operation - Record NAV Event

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main.

Before making changes:
1. Confirm Track 14C has been committed and pushed.
2. Run:
   git status --short --branch
3. Working tree must be clean before starting.
4. Run baseline validation:
   npm run check
   npm run test:e2e

Current project status:
- Track 13B added frontend-only EIP-1193 wallet connection and Sepolia verification.
- Track 14A added the review-only UnsignedDeploymentIntentReadModel.
- Track 14B added frontend-only wallet-signed Sepolia deployment.
- Track 14C added local-session deployment evidence/readiness:
  - transaction hash evidence only if provider-returned.
  - contract address evidence only if receipt-returned from successful confirmed deployment.
  - evidence persistence is local-session-only.
  - no Evidence Pack storage, backend route, mainnet, audit claim, or SCP operations were added.

We are starting Track 15A - First SCP Wallet-Signed Operation: Record NAV Event.

Goal:
Add one low-risk wallet-signed SCP operation path for Record NAV Event after confirmed deployment evidence exists.

Important:
Track 15A should be operation-specific. Do not unlock Mint/Burn/Pause/Distribution suites. Do not add mainnet, backend private-key custody, fake transaction hashes, fake event logs, or broad SCP redesign.

Acceptance criteria:
- Record NAV Event is blocked unless wallet is connected, chain is Sepolia, deployment evidence is confirmed from receipt, and contract address is receipt-returned.
- User wallet signs the operation in browser.
- Backend never holds private keys.
- Operation transaction hash appears only after provider response.
- Receipt/event evidence appears only after receipt/log response.
- SCP operations remain gated; only Record NAV Event is introduced.
- Tests pass.
```
