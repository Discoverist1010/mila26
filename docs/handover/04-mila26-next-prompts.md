# MILA26 Next Prompts

## Next Codex Prompt: Track 14A Unsigned Deployment Transaction Intent

```text
You are working inside the MILA26 repository:

/Users/macbookpro18/Desktop/CODE/active/mila26

Start from main.

Before making changes:
1. Confirm Track 13B has been committed and pushed.
2. Run:
   git status --short --branch
3. Working tree must be clean before starting.
4. Run:
   npm run check
   to confirm baseline if needed.

Current project status:
- Track 13A added the MetaMask-first wallet adapter + Sepolia signing design and pure WalletConnectionReadModel.
- Track 13B added frontend-only EIP-1193 wallet connection and Sepolia verification:
  - provider detection.
  - user-initiated account request.
  - Sepolia/wrong-chain status.
  - rejected/provider-error/unsupported states.
  - passive wallet status in cockpit/SCP.
- Track 13B did not add signing, deployment, transaction preparation/submission, tx hash, contract address, backend wallet route, persistence, SCP operations, or mainnet.

We are starting Track 14A - Unsigned Deployment Transaction Intent.

Goal:
Define a typed, reviewable unsigned deployment intent that describes what the user may later be asked to sign for Sepolia deployment, without requesting a signature or submitting a transaction.

Important:
Track 14A is not a signing or deployment track. It must not request a signature, submit a transaction, display a transaction hash, display a contract address, unlock SCP operations, add backend private-key custody, or enable mainnet.

Architecture rules:
- Keep WalletConnectionReadModel separate from WalletSigningIntent.
- Consume Deployment Gate, Wallet Signing Intent, Wallet Connection, artifact/check/evidence, and compile/test status as lightweight inputs.
- Do not create a transaction lifecycle model yet.
- Keep it typed/domain-first; UI wiring can be a later small track unless the scope is explicitly approved.

Suggested files:
- src/domain/unsignedDeploymentIntentReadModel.ts
- tests/unsigned-deployment-intent-read-model.test.ts
- docs/contracts/unsigned-deployment-intent-contract.md
- docs/contracts/README.md

Implementation guidance:
1. Model the unsigned deployment intent as a review payload, not an executable transaction.
2. Include chain target Sepolia only, contract fixture/artifact identity, required bytecode/ABI readiness, constructor/deployment parameter requirements, user wallet address requirement, and safety boundaries.
3. Keep transaction hash, contract address, signed payload, submitted transaction, confirmed transaction, and receipt absent.
4. Do not prepare calldata/bytecode transaction submission unless a later track explicitly approves it.

UI behavior:
- No UI wiring by default in Track 14A.
- If any copy/docs mention the intent, it must say unsigned review intent only.

Strict prohibitions:
- No signing request.
- No transaction submission.
- No deployment script.
- No backend route/API.
- No private keys.
- No backend private-key custody.
- No mainnet config.
- No fake contract address.
- No fake transaction hash.
- No signed payload.
- No submitted/confirmed transaction.
- No active Mint/Burn/Pause/NAV/Distribution controls.
- No persistence/database/auth/payments.
- No LLM changes.
- No broad UI redesign.

Testing requirements:
- Intent remains blocked unless deployment gate, wallet signing intent, wallet connection, artifact/check/evidence, and local compile/test prerequisites are present.
- Connected Sepolia wallet may be referenced only if it came from WalletConnectionReadModel.
- Output contains no transaction hash, contract address, signed payload, submitted transaction, confirmed transaction, or receipt.
- No ready-to-sign, ready-to-deploy, deployed, signed, live, verified, audited, production-ready, or mainnet-ready claims.

Validation:
Run:
npm run test -- tests/unsigned-deployment-intent-read-model.test.ts
npm run check
git diff --check

Acceptance criteria:
- A typed unsigned deployment intent/read model exists.
- It consumes existing lightweight readiness state instead of recreating a monolithic lifecycle context.
- It is review-only and not executable.
- No signing/deployment/transaction behavior is added.
- No fake contract/tx values are added.
- Tests pass.
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
