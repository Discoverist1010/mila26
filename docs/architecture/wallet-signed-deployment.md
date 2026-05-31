# Wallet-Signed Deployment

## Confirmed Choice

MILA26 MVP uses Option A: user wallet signs deployment.

The backend must not hold deployment private keys. The user signs deployment and token-operation transactions through a connected wallet.

## Why This Choice

- Better demo credibility: the asset manager sees a real wallet-confirmed testnet flow.
- Better security posture: private keys stay with the user's wallet.
- Clearer responsibility boundary: backend prepares and validates; wallet signs.
- Better fit for a local-laptop MVP than custody or server-side signing.

## Track 14B Implementation Boundary

Track 14B implements the first real blockchain execution step:

- the user connects a browser wallet through the EIP-1193 boundary.
- the app verifies Sepolia.
- the app consumes the unsigned deployment intent.
- the user explicitly requests wallet-signed Sepolia deployment from the central Engineering Bot workflow surface.
- the app re-checks `eth_accounts` and `eth_chainId` immediately before `eth_sendTransaction`.
- the app sends a contract-creation transaction through the browser wallet provider.
- transaction hash appears only after the provider returns it.
- contract address appears only after a successful receipt includes `contractAddress`.
- deployment evidence remains local-session-only until a later persistence/evidence track.
- SCP operations remain locked.

## Backend Responsibilities

- Provide artifact/spec/check/evidence metadata.
- Validate PRD/Requirement Brief and generated contract metadata.
- Enforce testnet-only configuration.
- Later, provide chain ID, contract ABI/bytecode metadata, constructor arguments, unsigned transaction intent, and durable evidence/status storage.
- Store off-chain project data later when persistence exists.
- Never store or request private keys or seed phrases.

## Frontend/Wallet Responsibilities

- Connect user wallet.
- Show transaction intent clearly.
- Request user signature through wallet provider.
- Submit signed transaction or wallet-initiated transaction.
- Show pending, confirmed, failed, or rejected status.
- Let user retry failed/rejected actions safely.

## Must Never Happen

- No private keys in frontend code.
- No private keys in backend code.
- No private keys in committed files.
- No seed phrases in chat.
- No server-side deployment signing for MVP.
- No mainnet deployment path in MVP.

## Testnet-Only Guardrails

- MVP deployment is Ethereum testnet only.
- UI and backend should display the active testnet.
- Chain ID should be checked before transaction preparation/submission.
- Mainnet should fail closed.
- Generated Solidity remains demo/scaffold code unless compiled, tested, reviewed, and audited.
- Deployment is blocked if unresolved critical QA or security benchmark findings exist, unless explicitly waived for a demo and recorded in the Evidence Pack.

## Deployment Flow

1. User approves PRD/Requirement Brief.
2. Smart-contract preparation completes the restricted ERC-20-compatible artifact spec, preview, checks, evidence-lite, and local compile/test representation.
3. QA Bot completes PRD conformance and code-quality checks.
4. Security Reviewer Bot completes smart-contract benchmark review.
5. Evidence Pack Bot records generated artifacts, QA/security status, and any demo waivers.
6. Deployment Bot prepares testnet deployment intent.
7. Frontend displays deployment summary.
8. User connects MetaMask through the approved EIP-1193 wallet boundary.
9. App verifies Sepolia.
10. App re-checks account and chain immediately before submission.
11. User wallet signs/submits the testnet transaction.
12. MILA26 displays the real transaction hash after provider submission.
13. Contract address is displayed only after a successful receipt confirms contract creation.
14. Track 14C derives local-session evidence/readiness from deployment status and identifiers.
15. A later persistence/evidence track can store or index deployment evidence durably.

## Mint And Distribute Flow

1. User verifies up to 20 whitelisted wallet addresses against off-chain real-world names.
2. User allocates percentages to addresses.
3. MILA26 validates total allocation equals 100%.
4. User signs mint/distribution transactions.
5. MILA26 tracks transaction status and shows completion/failure.

## Transaction Status Tracking

Minimum statuses:

- Not started.
- Awaiting wallet.
- Rejected by user.
- Submitted.
- Pending.
- Confirmed.
- Failed.

Status is visible in the UI as local-session state and local-session evidence/readiness. It becomes traceable in run/project memory only after persistence/evidence storage exists.

## Limitations And Deferred Production Concerns

- No mainnet deployment.
- No custody.
- No production key management.
- No formal audit-complete claim.
- No multi-chain support unless later justified.
- No full KYC/AML.
- No production-grade monitoring until live beta hardening.
