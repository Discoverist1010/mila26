# Allocation / Mint Operation Contract

Allocation / Mint is a wallet-signed Sepolia SCP operation for the blockchain-functional alpha.

It lets the issuer/admin wallet submit `mintAllocation(address,uint256)` to the receipt-confirmed deployed contract for one selected investor wallet. It does not prove stablecoin receipt, investor eligibility, KYC/AML status, legal approval, audit approval, or production readiness.

## Release Rule

Do not keep Allocation / Mint locked for vague roadmap reasons. Keep it unavailable only when a concrete prerequisite is missing.

The operation is unavailable unless:

- an EIP-1193 wallet provider is present;
- a user wallet is connected;
- the wallet is on Sepolia;
- deployment evidence is confirmed from a successful provider receipt;
- the deployment evidence contains a valid non-zero contract address;
- the deployment artifact ABI includes `mintAllocation(address,uint256)`;
- the selected target investor wallet is a valid non-zero EVM address;
- the selected target investor wallet is registered and whitelisted in current lifecycle state;
- subscription parameters and Allocation / Mint parameters are coherent;
- token allocation amount parses to a positive integer amount in token units;
- no duplicate Allocation / Mint attempt is already awaiting wallet confirmation or receipt.

## Pre-Send Rechecks

Immediately before `eth_sendTransaction`, the app re-reads:

- `eth_accounts`;
- `eth_chainId`.

It blocks if the selected account changed, no selected account is available, or the chain is no longer Sepolia.

## Transaction Shape

The wallet transaction is sent to the receipt-confirmed deployment contract address with:

- `from`: connected issuer/admin wallet;
- `to`: deployment evidence contract address;
- `data`: ABI-encoded `mintAllocation(targetWalletAddress, tokenAmountUnits)`.

MILA26 does not store private keys or signed payloads.

## Evidence

Only provider-derived values can become evidence:

- operation transaction hash after provider return;
- operation receipt status after receipt polling;
- decoded `AllocationMinted` event evidence only if present in receipt logs;
- local-session-only evidence persistence until durable Evidence Vault work exists.

No hardcoded transaction hash, contract address, wallet address, block number, explorer link, or event evidence may be presented as real.

## UI Contract

The UI should show:

- missing prerequisites as needs-parameters, needs-review, or explicit blocked-by-precondition states;
- an enabled `Submit Allocation / Mint` control only when all release gates pass;
- a disabled reason when the control is not available;
- submitted/confirmed/rejected/failed states from wallet/provider outcomes only;
- other SCP operations as unavailable until each has its own adapter, authorization gate, ABI gate, and evidence path.

## Non-Goals

- No batch minting.
- No stablecoin subscription settlement.
- No automated investor eligibility approval.
- No redemption payout.
- No maturity closeout.
- No mainnet.
- No backend private-key custody.
