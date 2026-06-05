# Wallet Whitelist Operation Contract

Whitelist Wallet is the second wallet-signed SCP operation.

The operation calls the current deployed contract ABI function:

```solidity
setWalletAllowed(address wallet, bool allowed)
```

In the current alpha, `allowed` is always `true`.

## Scope

The operation is frontend-only and Sepolia-only. The user wallet signs through the browser EIP-1193 provider. The backend never holds private keys, never signs operation transactions, and never receives a backend operation route.

The operation is local-session-only. It does not create durable operation history, persistent evidence storage, an Evidence Pack record, or an indexed audit trail.

## Preconditions

Whitelist Wallet is blocked unless:

- an EIP-1193 provider exists.
- the wallet is connected.
- the connected chain is Sepolia.
- deployment evidence is confirmed from a receipt.
- the deployed contract address is receipt-returned, valid, and non-zero.
- the target wallet address is explicitly provided by the user.
- the target wallet address is valid and non-zero.
- `setWalletAllowed(address,bool)` exists in the source-controlled deployment artifact ABI.
- no whitelist operation attempt is already awaiting wallet confirmation or submitted.

Immediately before `eth_sendTransaction`, the operation re-reads `eth_accounts` and `eth_chainId`. It blocks if the account changed, no selected account is available, or the chain is no longer Sepolia.

## Provider Methods

Allowed:

- `eth_accounts`
- `eth_chainId`
- `eth_sendTransaction`
- `eth_getTransactionReceipt`

Not allowed:

- `personal_sign`
- `eth_sign`
- `eth_signTypedData`
- `wallet_switchEthereumChain`
- `wallet_addEthereumChain`
- backend operation APIs

## Evidence Rules

The whitelist transaction hash appears only after the provider returns it.

The receipt status appears only after the provider returns a receipt.

`WalletWhitelisted` event evidence appears only if decoded from receipt logs. A successful receipt may confirm the operation even when event decoding is unavailable; in that case the event remains `Not decoded`.

Evidence persistence is always `local_session_only` in the current alpha.

## Authorization Honesty

The Solidity function is protected by contract-level authorization. MILA26 does not pre-claim that the connected wallet is an issuer, authorized wallet, KYC-approved investor, eligible investor, or legally approved participant.

UI copy may state:

- `Contract authorization is enforced on-chain.`

UI copy must not state:

- `Issuer authorized`
- `Wallet authorized`
- `KYC approved`
- `Investor eligible`
- `Legal approval`
- `Audit approval`
- `Production ready`

If the contract rejects the transaction because the connected account lacks authorization, the operation is represented as a failed wallet-signed operation, not as legal/KYC/investor status.

## Locked Operations

SCP may expose at most two active wallet-signed operation controls:

- Record NAV Event
- Whitelist Wallet

Allocation/Mint remains deferred until investor registry and subscription parameters are coherent. Burn, pause/unpause, transfer, distribution, and role-administration operations remain locked or absent until their own capability work exists.
