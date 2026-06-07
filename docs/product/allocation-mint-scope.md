# Allocation / Mint Scope

## Purpose

Allocation / Mint is the smart-contract operation after Investor Wallets, Wallet Whitelist, and Subscription parameters are coherent. The current implemented slice prepares and validates single-investor allocation parameters from shared lifecycle state and lets the issuer request a wallet-signed `mintAllocation(address,uint256)` operation on Sepolia after explicit gates pass.

This is not live investor subscription settlement. It must not imply stablecoins have been received, KYC/AML is complete, or investors are eligible.

## Required Inputs

Allocation / Mint can only be designed against shared lifecycle state:

- Investor Wallets:
  - up to 50 wallet addresses;
  - each target wallet must be a valid non-zero EVM address;
  - duplicate and invalid entries block readiness;
  - wallet whitelist status must be clear.
- Subscription parameters:
  - permitted stablecoins;
  - subscription window;
  - minimum subscription amount;
  - payment wallet or contract address;
  - payment per token.
- Smart-contract/deployment state:
  - reviewed smart-contract artifact/spec;
  - Sepolia wallet connection;
  - confirmed deployment evidence before any wallet-signed operation.

## MVP Operation Shape

The current Allocation / Mint slice is parameter, gate, and wallet-operation driven:

1. Select an investor wallet from the registry.
2. Enter token allocation amount.
3. Show derived context from subscription state, such as payment per token and permitted stablecoins.
4. Validate:
   - selected wallet is valid and registered;
   - token amount is greater than zero;
   - subscription parameters are ready;
   - wallet/deployment gates are satisfied before signing.
5. Require confirmed Sepolia deployment evidence and a receipt-returned contract address.
6. Require the selected investor wallet to be whitelisted in local-session operation state.
7. Require the generated/deployed ABI to expose `mintAllocation(address,uint256)`.
8. Prepare and submit a wallet-signed Sepolia operation only after explicit user action.
9. Record local-session evidence only after provider transaction/receipt responses.

## UI Placement

- The Contract Ops tab owns Allocation / Mint readiness and action controls.
- The Investor Wallets tab provides a handoff action: `Use for Allocation / Mint`.
- The Subscription tab should remain parameter capture only.
- The right rail should stay passive and show readiness, not execution controls.
- Contract Ops remains the only home for wallet-signed contract operations.

## Non-Goals

- No live stablecoin receipt check.
- No production payment reconciliation.
- No KYC/AML or investor eligibility approval.
- No backend-held private keys.
- No mainnet.
- No batch mint before the single-wallet operation has real Sepolia demo evidence and broader tests.
- No durable evidence storage until the local evidence shape is stable.

## Acceptance Criteria For Current Coding Slice

- Allocation/Mint shows missing prerequisites as needs-parameters or needs-review states, not as arbitrary future locks.
- Single-wallet allocation amount validates before any wallet action appears.
- Wallet-signed submission is gated by Sepolia wallet readiness, confirmed deployment evidence, ABI support, whitelisted target wallet, coherent subscription parameters, and token amount.
- No transaction hash, contract address, or confirmed status appears before provider evidence.
- Tests cover valid, invalid, missing-prerequisite, edited lifecycle, wrong-chain, rejected-wallet, submitted, failed, and confirmed operation states.
