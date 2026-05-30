# MVP Screen Flow

Approved directional UX reference: `docs/assets/ux/mila26_dashboard_v2.png`.

The mockup remains directional, not a pixel-perfect implementation mandate. Current code uses Cockpit2 plus a scrollable Smart Contract Control Panel.

## 1. Cockpit Home / Requirement Brief

- User goal: start or continue a tokenisation project.
- Primary UI: central Engineering Bot workflow surface, left activity rail, passive right rail, collapsible Brief Preview.
- Current status: implemented.
- Guardrail: no wallet/deploy buttons in the right rail.

## 2. Engineering Brief

- User goal: turn Requirement Brief into an engineering plan.
- Primary UI: central workflow action and structured Engineering Bot response sections.
- Backend/API: `POST /api/prd/engineering-brief`.
- Current status: implemented.
- Guardrail: backend-only LLM boundary; no frontend LLM secrets.

## 3. Closure / Open Items

- User goal: see whether planning assumptions and open items block downstream work.
- Primary UI: passive readiness surfaces and Brief Preview summaries.
- Current status: implemented.
- Guardrail: closure is derived from ledger/read model, not scattered UI conditionals.

## 4. Smart Contract Spec + Artifact Preview

- User goal: prepare the smart-contract implementation spec and deterministic preview.
- Primary UI: central Prepare Smart Contract Spec action and generated artifacts area.
- Backend/API:
  - `POST /api/smart-contract/artifact-spec`
  - `POST /api/smart-contract/artifact`
- Current status: implemented.
- Guardrail: preview only; no compiled/deployed/audited claim.

## 5. Local Compile/Test Status

- User goal: understand whether the local restricted ERC-20-compatible fixture compiles and tests.
- Primary UI: generated artifacts area and SCP status rows.
- Current status: implemented as known local compile/test representation.
- Guardrail: app does not execute Hardhat dynamically.

## 6. Deployment Gate

- User goal: understand whether pre-deployment review prerequisites are complete.
- Primary UI: generated artifacts area, passive right rail, SCP boundary/health rows.
- Current status: implemented.
- Guardrail: pre-deployment readiness is separate from deployment execution, which remains blocked.

## 7. Wallet Signing Intent

- User goal: understand what must be reviewed before future wallet signing.
- Primary UI: generated artifacts area, passive right rail, SCP boundary rows.
- Current status: implemented.
- Guardrail: wallet signing intent is not wallet connection or transaction execution.

## 8. Smart Contract Operations Locked

- User goal: see that operations are intentionally unavailable before wallet-signed deployment.
- Primary UI: SCP locked operations section.
- Current status: implemented.
- Guardrail: no Mint/Burn/Pause/NAV/Distribution controls before real deployment and operation gates.

## 9. Wallet Connection + Sepolia Verification

- User goal: connect MetaMask and verify Sepolia.
- Primary UI: future central Engineering Bot workflow action.
- Current status: Track 13B next.
- Guardrail: wallet connection is not signing; no tx hash or contract address.

## 10. Unsigned Deployment Intent

- User goal: review what would be signed before a signature request exists.
- Primary UI: future central workflow review surface.
- Current status: future Track 14A.
- Guardrail: no signature request or transaction submission.

## 11. Wallet-Signed Sepolia Deployment

- User goal: sign/submit deployment through user wallet.
- Primary UI: central workflow action, SCP testnet deployment status.
- Current status: future Track 14B/14C.
- Guardrail: backend never holds private keys; mainnet disabled.

## 12. First SCP Operation

- User goal: perform one wallet-signed contract operation after deployment.
- Preferred first operation: Record NAV Event.
- Primary UI: SCP gated operation control.
- Current status: future Track 15A.
- Guardrail: operation controls unlock only after real wallet-signed deployment and authorization gates.
