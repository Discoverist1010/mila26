# Wallet Adapter + Sepolia Signing Design

Track 13A defines MILA26's wallet adapter and Sepolia signing boundary before any wallet runtime is implemented. It is a design and type/read-model track only.

## Recommendation

Track 13B should start with a minimal EIP-1193 browser-provider adapter boundary, targeting MetaMask as the first wallet because the product path will use MetaMask for the blockchain-functional alpha.

The adapter should remain EIP-1193-shaped so other injected wallets can be considered later without changing MILA26's domain language.

MetaMask's current documentation recommends EIP-6963 for multi-injected-provider discovery. MILA26 should treat that as a future compatibility consideration, not as a reason to introduce multi-wallet orchestration in Track 13B. If EIP-6963 support is added later, it should still feed the same MILA26 wallet connection read-model statuses.

Use viem later for typed chain, account, ABI, contract, and deployment primitives as needed. viem is already present in the repo for the Hardhat foundation, and its custom transport can wrap an EIP-1193 provider.

Defer wagmi until MILA26 needs multi-wallet connector management, React connector abstractions, wallet discovery, or richer wallet orchestration. Avoid ethers unless there is a clear reason to carry a second Ethereum client library.

Track 13A does not install wallet runtime dependencies.

## Documentation References Checked

- EIP-1193: Ethereum Provider JavaScript API, including `request`, `accountsChanged`, and `chainChanged`: https://eips.ethereum.org/EIPS/eip-1193
- MetaMask provider API, including `window.ethereum`, request handling, provider events, and listener cleanup guidance: https://docs.metamask.io/wallet/reference/provider-api/
- MetaMask account access flow using `eth_requestAccounts`: https://metamask.github.io/mm-docs-v2/87-onboarding/wallet/get-started/access-accounts/
- viem custom transport for EIP-1193 providers: https://viem.sh/docs/clients/transports/custom
- wagmi React wallet connection guides and connector model: https://wagmi.sh/react/guides/connect-wallet
- ethers v6 `BrowserProvider` for EIP-1193 providers: https://docs.ethers.org/v6/api/providers/
- Sepolia chain configuration, chain ID `11155111`: https://github.com/eth-clients/sepolia

## Options Considered

### Minimal EIP-1193 Provider Boundary

This is the recommended first implementation path.

Why it fits MILA26 now:

- It matches MetaMask's injected provider model.
- It keeps Track 13B small: provider detection, connection request, account capture, chain ID check, account/chain change handling, and safe error normalization.
- It does not require a React provider layer or connector framework.
- It is straightforward to mock in Vitest and Playwright without a real wallet extension.
- It keeps wallet connection separate from Wallet Signing Intent, Deployment Gate, and transaction execution.

Risks:

- MILA26 must own small adapter code and event cleanup carefully.
- Multi-wallet connector UX is deferred.

### viem-Based Approach

viem is a good future typed primitive layer. It can wrap an EIP-1193 provider with custom transport and later help with ABI, contract, account, and deployment transaction handling.

Why not make viem the first visible wallet abstraction in 13B:

- Track 13B only needs provider detection, account request, and Sepolia guardrails.
- Starting with an EIP-1193 boundary keeps the first wallet integration easier to test and explain.
- viem can be introduced inside the adapter later without changing the domain read model.

### wagmi-Based Approach

wagmi is powerful for React wallet hooks, connectors, provider state, TanStack Query integration, and multi-wallet support.

Why it is deferred:

- It adds React-wide provider and connector configuration before MILA26 needs that surface.
- It can make early wallet state feel like a framework concern instead of a small domain boundary.
- It is better suited once MILA26 needs multiple wallet connectors or more complex account/network orchestration.

### ethers-Based Approach

ethers v6 can wrap EIP-1193 providers through `BrowserProvider` and provide signer abstractions.

Why it is not recommended first:

- MILA26 already carries viem from the Hardhat foundation.
- Adding ethers now would add a second Ethereum client library before there is a clear need.
- The immediate connection/Sepolia work can be handled through EIP-1193 directly.

## Browser Wallet Boundary

Future frontend wallet code may access only:

- provider availability.
- connected account address after a real user connection.
- chain ID after provider access.
- Sepolia chain verification.
- user rejection and safe error state.
- disconnected state.
- provider account and chain change events.

Future frontend wallet code must not fake:

- wallet address.
- signature.
- signed payload.
- transaction hash.
- contract address.
- deployment status.
- confirmation status.

Provider/vendor errors should be normalized into MILA26-owned statuses. Tests should not rely on exact MetaMask error text.

## Backend Private-Key Boundary

The backend must never hold user private keys.

The backend must never sign deployment transactions or user operations. In later tracks it may provide artifact, ABI, bytecode, evidence, or unsigned deployment-intent metadata. The user wallet signs in the browser.

## Sepolia Guardrails

Alpha execution target:

- Ethereum Sepolia only.
- Sepolia chain ID: `11155111`, hex `0xaa36a7`.
- Mainnet disabled.
- Wrong-chain state blocks readiness.
- Automatic network switching is deferred unless explicitly approved later.
- No mainnet RPC/configuration should be added for alpha wallet work.

Safe display language:

- `Connected to Sepolia`.
- `Wrong chain`.
- `Sepolia required for alpha`.
- `Mainnet disabled`.

Avoid:

- `mainnet ready`.
- `ready to deploy`.
- `ready to sign`.

## Wallet Connection Readiness Model

Track 13A adds a pure wallet connection read model in `src/domain/walletConnectionReadModel.ts`.

It separates wallet connection readiness from Track 12A Wallet Signing Intent:

- Wallet connection means the browser provider/account/chain boundary is known.
- Wallet signing intent means the lifecycle has reached a signing-review state.
- Wallet execution remains not implemented in Track 13A.

Core future state names:

- `walletConnectionStatus`: `not_connected`, `connecting`, `connected`, `wrong_chain`, `rejected`, `unsupported`, or `error`.
- `walletConnectionReadiness`: `blocked` or `review_ready`.
- `walletExecutionStatus`: `not_implemented` or `blocked`.
- `chainStatus`: `unknown`, `sepolia`, or `wrong_chain`.
- `connectedWalletAddress`: present only after a real connection.

The read model does not include transaction hash, contract address, signed payload, submitted transaction, confirmed transaction, deployment receipt, or transaction lifecycle states.

## User and Error States

Track 13B should support deterministic states for:

- no browser wallet detected.
- wallet not connected.
- user rejects connection.
- wallet connection in progress.
- wallet connected to the wrong chain.
- wallet connected to Sepolia.
- account changes.
- chain changes.
- provider error.
- unsupported wallet/provider.

Normalize provider errors into:

- `rejected`.
- `unsupported`.
- `wrong_chain`.
- `error`.

Do not build user-facing behavior around exact MetaMask/vendor error messages.

## Future Deployment Signing Path

Proposed next sequence:

- Track 13B: connect MetaMask through an EIP-1193 adapter and verify Sepolia only.
- Track 14A: define unsigned deployment transaction intent and user review payload.
- Track 14B: user wallet signs deployment.
- Track 14C: capture real transaction hash, real contract address, and receipt status.
- Track 15A: first wallet-signed SCP operation, likely `Record NAV Event`.

## UI Placement

Future wallet workflow controls belong in the central Engineering Bot workflow surface.

Right rail remains passive status and safety.

SCP remains status, evidence, boundary, health, and locked operations before deployment.

After wallet-signed deployment exists, SCP may expose gated contract-operation controls that are backed by the real deployed contract, operation authorization, and evidence logging.

## Track 13B Test Strategy

Track 13B should use a mocked browser provider in Vitest. Automated tests should not require a real MetaMask extension unless explicitly approved.

Tests should cover:

- no provider.
- not connected.
- user rejection.
- provider error normalization.
- account changes.
- chain changes.
- wrong-chain state.
- Sepolia connected state.
- wallet address appears only after mocked real connection.
- no transaction hash or contract address before real deployment.
- no signed/submitted/confirmed transaction states before later deployment tracks.

E2E tests should remain deterministic and should not depend on external wallet extension state.

## Risks and Deferred Decisions

Deferred:

- wallet runtime implementation.
- wallet button/UI wiring.
- viem wallet client usage.
- wagmi connector setup.
- deployment transaction construction.
- transaction signing.
- transaction submission and confirmation tracking.
- persistence of wallet/deployment state.
- SCP operations.
- mainnet.

Risks:

- Browser wallets vary in provider behavior. MILA26 should normalize provider outcomes into its own statuses.
- Account/chain change events can create stale UI if listeners are not cleaned up in Track 13B.
- Wallet connection may be mistaken for deployment readiness unless UI copy keeps connection, signing intent, and execution separate.
- Automatic network switching can create confusing UX and should remain deferred until explicitly approved.

## Non-Goals

Track 13A does not add:

- wallet adapter runtime implementation.
- `window.ethereum` access.
- wallet connection button.
- signing button.
- deployment button.
- viem, ethers, or wagmi runtime code.
- transaction preparation/signing/submission.
- backend routes.
- fake wallet address.
- fake contract address.
- fake transaction hash.
- mainnet configuration.
- persistence.
- LLM changes.
