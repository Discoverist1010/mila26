# Record NAV Operation Contract

Track 15A adds the first wallet-signed SCP operation for the blockchain-functional alpha: `Record NAV Event`.

## Scope

The operation is intentionally narrow:

- one deployed Sepolia contract call: `recordValuation(uint256,string)`;
- one SCP action: `Record NAV Event`;
- one deterministic alpha payload: `1050000` / `MILA26-ALPHA-NAV-001`;
- local-session-only operation status and evidence.

It does not unlock Mint, Burn, Pause, Distribution, Whitelist, Allocation, or any broad operation suite.

## ABI Boundary

Before the operation path is used, the app validates that the source Solidity contract and frontend deployment artifact expose:

```solidity
recordValuation(uint256 valuation, string calldata valuationReference)
```

If the generated deployment artifact ABI does not contain `recordValuation(uint256,string)`, the operation is blocked. MILA26 does not invent ABI or modify Solidity as part of this track.

## Preconditions

The operation is blocked unless:

- wallet provider exists;
- wallet is connected;
- wallet is on Sepolia;
- deployment evidence is confirmed from receipt;
- contract address source is receipt-returned;
- contract address is a valid non-zero EVM address;
- operation payload is complete;
- no Record NAV operation attempt is already awaiting wallet confirmation or receipt.

Immediately before `eth_sendTransaction`, the app re-reads `eth_accounts` and `eth_chainId`. It blocks if the selected account changed or the chain is no longer Sepolia.

## Evidence Provenance

The Record NAV read model keeps explicit source fields:

- `operationTransactionHashSource: "provider_returned" | "absent"`
- `operationReceiptSource: "provider_receipt" | "absent"`
- `eventEvidenceSource: "decoded_from_receipt" | "receipt_confirmed" | "absent"`
- `operationEvidencePersistence: "local_session_only"`

Transaction hash appears only after the provider returns it. Receipt status appears only after provider receipt return. `ValuationUpdated` event evidence appears only if decoded from receipt logs. A successful receipt may still provide receipt-confirmed operation evidence if event decoding is not available.

## Boundaries

- Backend never holds private keys.
- User wallet signs in browser.
- Sepolia only.
- Mainnet disabled.
- Operation evidence is local-session-only.
- No durable evidence storage or operation history exists in Track 15A.
- No audit, security approval, production readiness, or legal/compliance approval is claimed.

## Future Tracks

If Track 15A reveals event decoding or SCP gating issues, use a short Track 15A.1 hardening track. If clean, proceed to Track 15B: Whitelist + Allocation/Mint Operation.
