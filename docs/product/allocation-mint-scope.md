# Allocation / Mint Scope

## Purpose

Allocation / Mint is the next smart-contract operation after Investor Registry and Subscription parameters are coherent. The current implemented slice prepares and validates single-investor allocation parameters from shared lifecycle state. A later slice should let the issuer request a wallet-signed mint/allocation operation on Sepolia.

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

The first Allocation / Mint slice is parameter and intent driven:

1. Select an investor wallet from the registry.
2. Enter token allocation amount.
3. Show derived context from subscription state, such as payment per token and permitted stablecoins.
4. Validate:
   - selected wallet is valid and registered;
   - token amount is greater than zero;
   - subscription parameters are ready;
   - wallet/deployment gates are satisfied before signing.
5. Keep live mint execution locked while readiness is being reviewed.
6. Prepare a wallet-signed Sepolia operation only in a later execution slice after explicit user action.
7. Record local-session evidence only after provider transaction/receipt responses.

## UI Placement

- The Smart Contract tab owns Allocation / Mint readiness and will later own action controls.
- The Investor Registry tab provides a handoff action: `Use for Allocation / Mint`.
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

- Allocation/Mint readiness remains locked until Investor Registry and Subscription are ready.
- UI explains the exact missing dependency when locked.
- Single-wallet allocation amount validates before any wallet action appears.
- No transaction hash, contract address, or confirmed status appears before provider evidence.
- Tests cover valid, invalid, locked, and edited lifecycle states. Wallet-rejected states remain for the later execution slice.
