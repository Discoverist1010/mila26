# MILA26 Next Prompts

## Next Codex Prompt: Track 14B User Wallet Signs Sepolia Deployment

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main.

Before making changes:
1. Confirm Track 14A has been committed and pushed.
2. Run:
   git status --short --branch
3. Working tree must be clean before starting.
4. Run:
   npm run check
   to confirm baseline if needed.

Current project status:
- Track 13B added frontend-only EIP-1193 wallet connection and Sepolia verification.
- Track 14A added `UnsignedDeploymentIntentReadModel`, which is review-only and not executable.
- Track 14A still added no signing, no executable transaction payload, no submission, no tx hash, no contract address, no receipt, no backend wallet route, no persistence, SCP operations, or mainnet.

We are starting Track 14B - User Wallet Signs Sepolia Deployment.

Goal:
Implement the smallest safe wallet-signed Sepolia deployment path from the approved unsigned deployment intent.

Important:
Track 14B may request a real user wallet confirmation only after consuming a review-ready unsigned deployment intent and confirming Sepolia. Backend private-key custody remains prohibited. Mainnet remains disabled.

Architecture rules:
- Keep WalletConnectionReadModel separate from WalletSigningIntent.
- Consume the Track 14A unsigned deployment intent.
- Do not invent fake transaction outcomes.
- Keep transaction state narrow and tied to real wallet/provider responses.
- Continue to keep right rail passive and SCP operations locked until real deployment confirmation and later operation authorization gates exist.

Suggested files:
- To be planned carefully before implementation.

Implementation guidance:
1. Use the existing EIP-1193 adapter boundary.
2. Verify connected wallet and Sepolia immediately before requesting signature/submission.
3. Backend must not hold private keys or sign.
4. Capture only real provider-returned transaction hash after submission.
5. Do not show a contract address until a real receipt/deployment confirmation provides one.

UI behavior:
- Wallet signing/deployment actions belong only in the central Engineering Bot workflow surface.
- Right rail remains passive.
- SCP remains locked until real deployed contract state exists.

Strict prohibitions:
- No backend private keys.
- No backend private-key custody.
- No mainnet config.
- No fake contract address.
- No fake transaction hash.
- No fake submitted/confirmed transaction.
- No active Mint/Burn/Pause/NAV/Distribution controls.
- No persistence/database/auth/payments.
- No LLM changes.
- No broad UI redesign.

Testing requirements:
- Use mocked provider tests; do not require MetaMask extension in automated tests.
- Verify no backend private-key path exists.
- Verify wrong-chain blocks signing/submission.
- Verify user rejection is safe.
- Verify tx hash appears only from mocked provider submission.
- Verify contract address appears only after mocked real receipt confirmation if receipt tracking is in scope.

Validation:
Run:
npm run check
npm run test:e2e
git diff --check

Acceptance criteria:
- Wallet-signed Sepolia deployment path is backed by real provider responses in tests.
- Backend never holds private keys.
- Mainnet remains disabled.
- No fake contract/tx values are added.
- Tests pass.
```

## Later Prompt: Track 15A First Wallet-Signed SCP Operation

```text
Implement only after a real wallet-signed Sepolia deployment exists.

Add one low-risk wallet-signed SCP operation, likely Record NAV Event, with operation authorization, evidence logging, and no fake live metrics.
```
