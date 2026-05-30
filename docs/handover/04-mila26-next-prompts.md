# MILA26 Next Prompts

## Next Codex Prompt: Track 13B MetaMask Wallet Connection + Sepolia Verification

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main.

Before making changes:
1. Confirm Track 13A has been committed and pushed.
2. Run:
   git status --short --branch
3. Working tree must be clean before starting.
4. Run:
   npm run check
   to confirm baseline if needed.

Current project status:
- Track 12C hardened the golden lifecycle flow and no-fake-deployment guardrails.
- Track 13A added wallet adapter + Sepolia signing design:
  - docs/architecture/wallet-adapter-sepolia-design.md
  - src/domain/walletConnectionReadModel.ts
  - tests/wallet-connection-read-model.test.ts
- Track 13A recommendation:
  - MetaMask first through a minimal EIP-1193 browser-provider boundary.
  - Sepolia only for alpha: decimal 11155111 / hex 0xaa36a7.
  - viem reserved for typed chain/account/contract/deployment primitives later.
  - wagmi deferred.
  - ethers avoided unless there is a clear reason.

We are starting Track 13B - MetaMask Wallet Connection + Sepolia Verification.

Goal:
Add the smallest safe frontend wallet connection foundation:
- detect an injected MetaMask/EIP-1193 provider.
- let the user request wallet connection from the central Engineering Bot workflow surface.
- capture connected wallet address only after real user approval.
- verify Sepolia chain.
- normalize provider errors into MILA26-owned statuses.
- react safely to account and chain changes.
- surface wallet connection readiness without enabling signing or deployment.

Important:
Track 13B is not a signing track.
Track 13B is not a deployment track.
Track 13B must not prepare a transaction, request a signature, submit a transaction, display a transaction hash, display a contract address, unlock SCP operations, or add mainnet behavior.

Architecture rules:
- Keep WalletConnectionReadModel separate from WalletSigningIntent.
- Do not merge wallet connection with deployment gate or signing intent.
- Use local React state only.
- Prefer a small wallet adapter module over scattered window.ethereum conditionals in App.tsx.
- Do not add global state, persistence, backend routes, or a workflow engine.
- Keep Engineering Bot as the workflow action surface.
- Right rail remains passive.
- SCP remains status/evidence/boundary/health and locked operations until real deployment exists.

Suggested files:
- src/wallet/eip1193WalletAdapter.ts
- src/wallet/metamaskWalletAdapter.ts
- src/domain/walletConnectionReadModel.ts only if small refinements are needed
- src/App.tsx
- tests/wallet-connection-read-model.test.ts
- tests/wallet-adapter.test.ts
- tests/app-chat-panel.test.tsx
- tests/e2e/mila26.spec.ts if visible text changes

Implementation guidance:
1. Define a minimal typed EIP-1193 provider interface locally if needed.
2. Do not import wagmi or ethers.
3. Use existing viem dependency only if it materially reduces risk; direct EIP-1193 is preferred for 13B.
4. Do not install dependencies.
5. Implement provider detection without throwing during SSR/tests.
6. Implement request accounts using EIP-1193 request method.
7. Read chain ID and compare against Sepolia.
8. Subscribe to accountsChanged and chainChanged where practical, with cleanup.
9. Normalize provider errors into rejected, unsupported, wrong_chain, or error.
10. Do not depend on exact MetaMask error strings.

UI behavior:
- Before connection: central action can show Connect MetaMask Wallet.
- If no provider: show MetaMask / EIP-1193 provider not detected.
- If user rejects: show safe rejected message.
- If wrong chain: show Sepolia required; mainnet disabled.
- If connected to Sepolia: show wallet connection readiness review-ready.
- Wallet execution remains not implemented.
- Wallet Signing Intent remains separate.
- Deployment and SCP operations remain locked.

Strict prohibitions:
- No signing request.
- No transaction preparation.
- No transaction submission.
- No deployment script.
- No backend route/API.
- No private keys.
- No backend private-key custody.
- No mainnet config.
- No fake wallet address.
- No fake contract address.
- No fake transaction hash.
- No signed payload.
- No submitted/confirmed transaction.
- No active Mint/Burn/Pause/NAV/Distribution controls.
- No persistence/database/auth/payments.
- No LLM changes.
- No broad UI redesign.

Testing requirements:
- Mock EIP-1193 provider in Vitest.
- Test no provider.
- Test user rejection.
- Test successful account connection on Sepolia.
- Test wrong-chain state.
- Test account change handling.
- Test chain change handling.
- Test cleanup if event listeners are added.
- Test wallet address appears only after mocked real connection.
- Test no tx hash or contract address appears.
- Test right rail remains passive.
- Test SCP operations remain locked.
- Test no ready-to-sign, ready-to-deploy, deployed, signed, live, verified, audited, production-ready, mainnet-ready claims.

Validation:
Run:
npm run test -- tests/wallet-connection-read-model.test.ts
npm run test -- tests/app-chat-panel.test.tsx
npm run check
npm run test:e2e
git diff --check

Acceptance criteria:
- MetaMask/EIP-1193 provider detection exists.
- User can request wallet connection from the central workflow surface.
- Real connected wallet address is only stored/displayed after connection approval.
- Sepolia verification works.
- Wrong-chain and rejection states are safe.
- Wallet connection readiness is distinct from Wallet Signing Intent.
- Wallet execution remains not implemented.
- No signing/deployment/transaction behavior is added.
- No fake wallet/contract/tx values are added.
- Tests pass.
```

## Later Prompt: Track 14A Unsigned Deployment Transaction Intent

```text
Plan or implement only after Track 13B is stable.

Define the unsigned deployment transaction intent and user review payload needed before requesting a wallet signature. Do not request a signature, submit a transaction, show a transaction hash, or record a contract address in Track 14A.
```

## Later Prompt: Track 14B User Wallet Signs Deployment

```text
Implement only after unsigned deployment intent is stable.

Request user wallet confirmation for Sepolia deployment through the approved wallet adapter. Backend never holds private keys. Capture only real transaction outcomes. No mainnet.
```

## Later Prompt: Track 15A First Wallet-Signed SCP Operation

```text
Implement only after a real wallet-signed Sepolia deployment exists.

Add one low-risk wallet-signed SCP operation, likely Record NAV Event, with operation authorization, evidence logging, and no fake live metrics.
```
