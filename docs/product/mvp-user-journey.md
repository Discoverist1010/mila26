# MILA26 MVP User Journey

## Narrative

MILA26 helps an asset manager move from tokenisation intent to a controlled blockchain-functional alpha path.

The current alpha direction is a restricted ERC-20-compatible tokenised fund unit contract, with MetaMask and Ethereum Sepolia as the first wallet/testnet execution path.

## Current Implemented Journey

1. **Requirement Brief**
   - User works with the Engineering Bot to create a structured Requirement Brief.
   - Output: approved requirement artifact and assumptions.

2. **Engineering Brief**
   - User generates an Engineering Brief from the Requirement Brief.
   - Output: engineering plan, risks, open questions, and next action.

3. **Project Closure / Open Items**
   - System derives closure readiness and open-item blockers.
   - Output: closure/readiness summary for cockpit surfaces.

4. **Smart Contract Artifact Spec**
   - User triggers Prepare Smart Contract Spec after lifecycle readiness allows it.
   - Output: restricted ERC-20-compatible spec with token profile, functions, events, policies, and safety boundaries.

5. **Artifact Preview / Check / Evidence-Lite**
   - Backend generates deterministic preview-only artifact package, spec-consistency check result, and Evidence-Lite.
   - Output: preview artifacts and traceability without claiming compile/deploy/audit.

6. **Local Compile/Test Representation**
   - App surfaces the known local Hardhat compile/test result for the restricted ERC-20-compatible fixture.
   - Output: local compile/test passed status while still not deployed, signed, or audited.

7. **Deployment Gate**
   - System shows whether planning/artifact/check/evidence/compile-test prerequisites are complete.
   - Output: Deployment Gate Review can become review-ready, but deployment execution remains blocked.

8. **Wallet Signing Intent**
   - System shows what must be reviewed before future wallet signing.
   - Output: signing intent can become review-ready, but wallet execution remains not implemented.

9. **Smart Contract Operations Locked**
   - SCP shows operations are locked.
   - Output: no Mint/Burn/Pause/NAV/Distribution buttons are active before real deployment.

10. **Wallet Connection + Sepolia Check**
    - User connects MetaMask/injected EIP-1193 wallet from the central Engineering Bot workflow surface.
    - Output: connected wallet address appears only after user connection, Sepolia/wrong-chain/rejected/provider-error states are visible, and signing/deployment remain unavailable.

## Next Journey Stage

Track 14A adds an unsigned deployment intent read model and user-review payload boundary only. It does not add:

- signing.
- transaction submission.
- transaction hash.
- contract address.
- SCP operation controls.
- mainnet.

## Future Blockchain-Functional Alpha Journey

After Track 14A, the intended flow is:

1. User connects MetaMask.
2. App verifies Sepolia.
3. User reviews the unsigned deployment intent.
4. User wallet signs/submits Sepolia deployment.
5. App records real transaction hash.
6. App records real contract address after confirmation.
7. SCP reflects deployed Sepolia state.
8. User performs one wallet-signed operation, preferably Record NAV Event.
9. Evidence links artifacts, checks, wallet transaction, and operation result.

## User Experience Rules

- Engineering Bot remains the workflow decision surface.
- Right rail remains passive status/safety.
- SCP remains status/evidence/boundary/health before deployment.
- SCP operations unlock only after real wallet-signed deployment and operation gates.
- Wallet connection is not signing.
- Signing intent is not transaction execution.
- Local compile/test is not deployment or audit approval.

## Guardrails

- Backend never holds user private keys.
- User wallet signs future deployment and operations.
- Mainnet disabled.
- Sepolia/testnet only for alpha.
- No fake wallet address.
- No fake transaction hash.
- No fake contract address.
- No fake deployed, signed, live, audited, verified, production-ready, or mainnet-ready status.
- Real-world names stay off-chain by default.
