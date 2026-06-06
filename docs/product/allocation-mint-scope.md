# Allocation / Mint Scope

## Purpose

Allocation / Mint is the next smart-contract operation after Investor Registry and Subscription parameters are coherent. It should let the issuer allocate token amounts to whitelisted investor wallets and request a wallet-signed mint/allocation operation on Sepolia.

This is not live investor subscription settlement. It must not imply stablecoins have been received, KYC/AML is complete, or investors are eligible.

## Required Inputs

Allocation / Mint can only be designed against shared lifecycle state:

- Investor Registry:
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

The first Allocation / Mint slice should be parameter and intent driven:

1. Select an investor wallet from the registry.
2. Enter token allocation amount.
3. Show derived context from subscription state, such as payment per token and permitted stablecoins.
4. Validate:
   - selected wallet is valid and registered;
   - token amount is greater than zero;
   - subscription parameters are ready;
   - wallet/deployment gates are satisfied before signing.
5. Prepare a wallet-signed Sepolia operation only after explicit user action.
6. Record local-session evidence only after provider transaction/receipt responses.

## UI Placement

- The Smart Contract tab should own Allocation / Mint readiness and action controls.
- The Investor Registry tab may provide a handoff action such as `Use for Allocation / Mint`.
- The Subscription tab should remain parameter capture only.
- The right rail should stay passive and show readiness, not execution controls.
- SCP remains the only home for wallet-signed contract operations.

## Non-Goals

- No live stablecoin receipt check.
- No production payment reconciliation.
- No KYC/AML or investor eligibility approval.
- No backend-held private keys.
- No mainnet.
- No batch mint before single-wallet operation is tested.
- No durable evidence storage until the local evidence shape is stable.

## Acceptance Criteria For First Coding Slice

- Allocation/Mint remains locked until Investor Registry and Subscription are ready.
- UI explains the exact missing dependency when locked.
- Single-wallet allocation amount validates before any wallet action appears.
- No transaction hash, contract address, or confirmed status appears before provider evidence.
- Tests cover valid, invalid, locked, edited, and wallet-rejected states.

