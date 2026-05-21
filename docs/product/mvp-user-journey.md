# MILA26 MVP User Journey

## Narrative

MILA26 is moving toward a funding-demo-ready MVP for an asset manager that wants to tokenize a portfolio, distribute tokens to investors, and expose portfolio performance to token holders.

The asset manager should be able to work through a real turn-based chat with the Blockchain Engineering Bot, decide whether ERC-20 or ERC-721 is suitable, approve a PRD/enhanced Requirement Brief, watch specialist bots produce and review artifacts, then use wallet-signed Ethereum testnet flows for deployment, minting, allocation, distribution, and performance updates.

## Journey Stages

1. **Portfolio Tokenization Intent**
   - User action: asset manager explains they want to deploy an Ethereum smart contract to tokenize a portfolio.
   - Bot action: Blockchain Engineering Bot asks clarifying questions about asset type, investor count, transfer restrictions, performance reporting, and token behavior.
   - System output: captured facts and open questions for the PRD/Requirement Brief.

2. **ERC Protocol Decision**
   - User action: asset manager compares ERC-20 and ERC-721 for the product.
   - Bot action: Blockchain Engineering Bot explains ERC-20 vs ERC-721 suitability, including predefined events and expected contract behavior.
   - System output: recommended protocol choice and rationale.

3. **Investor And Servicing Requirements**
   - User action: asset manager provides up to 20 investor wallet addresses and real-world names.
   - Bot action: Engineering Bot captures whitelist requirements, allocation needs, and performance reporting requirements.
   - System output: requirements such as 20 whitelisted wallets, allocation percentages, total allocation validation, daily valuation upload, and token-holder performance access.

4. **PRD / Enhanced Requirement Brief**
   - User action: asset manager reviews generated PRD/Requirement Brief.
   - Bot action: Engineering Bot turns the finalized token design into a structured PRD/Requirement Brief.
   - System output: approved or revised PRD/Requirement Brief.

5. **Bot Orchestration**
   - User action: asset manager approves the PRD and starts generation.
   - Bot action: Engineering Bot engages Coding Bot, QA Bot, Security Reviewer Bot, Evidence Pack Bot, and other worker bots.
   - Bot action: Coding Bot generates Solidity contract artifacts based on the approved ERC-20 or ERC-721 choice and PRD features.
   - Bot action: QA Bot checks Solidity outputs against the approved PRD and smart-contract quality expectations.
   - Bot action: Security Reviewer Bot runs a smart-contract benchmark review before any deployment path is unlocked.
   - System output: visible bot progress/status, generated Solidity/API/frontend/test artifacts, QA results, security findings, and evidence pack.
   - UX requirement: the user can continue chatting with the Blockchain Engineering Bot while other bots are working.

6. **External Review Adapter**
   - User action: asset manager reviews internal bot outputs.
   - Bot action: MILA26 may call an External Auditor Bot adapter after code generation and QA.
   - System output: external-review-style findings or adapter status.

7. **Wallet-Signed Testnet Deployment**
   - User action: asset manager connects a wallet and confirms deployment.
   - Bot action: Deployment Bot prepares Ethereum testnet deployment data only after PRD approval, coding completion, QA completion, security benchmark completion, and evidence-pack recording.
   - System output: transaction request for user wallet signing and deployment status.
   - Guardrail: backend must not hold deployment private keys.

8. **Mint, Whitelist, Allocate, Distribute**
   - User action: asset manager clicks buttons to deploy to testnet, mint tokens, verify wallet addresses against off-chain names, allocate percentages, validate total allocation equals 100%, and distribute tokens.
   - Bot/system action: system checks whitelist and allocation rules, prepares transactions, and tracks transaction status.
   - System output: transaction statuses, allocation validation result, and distribution result.
   - Guardrail: real-world names stay off-chain in project/local storage by default.

9. **Valuation Upload And Performance Update**
   - User action: asset manager uploads a valuation file with today's total portfolio performance and gain/loss against initial investment.
   - Bot/system action: system validates the file, links it to the project/run, and prepares token-holder performance output.
   - System output: on-chain event emission and/or token-holder dashboard display for the 20 wallet holders.

## What Is Real In MVP

- Turn-based Blockchain Engineering Bot chat.
- PRD/enhanced Requirement Brief generation and approval.
- Visible bot orchestration/status.
- Generated contract/API/frontend/test/evidence artifacts.
- Solidity ERC-20/ERC-721 scaffold generation from approved PRD requirements.
- QA/security review before testnet deployment preparation.
- Security and QA gates appropriate for a funding demo.
- Ethereum testnet-only deployment preparation.
- User wallet signing for deployment and token operations.
- Up to 20 investor wallet addresses.
- Off-chain real-world investor names.
- Valuation upload and performance display or event emission.

## What Is Simulated Or Adapter-Based In MVP

- External Auditor Bot may start as an adapter boundary or simulated adapter result.
- Some worker bots may initially use deterministic or mocked outputs behind stable contracts.
- Solidity compile/test/static-analysis integrations may start as planned checks or adapter boundaries before real tooling is wired in.
- Deployment may begin with prepared transaction data and testnet status simulation before full wallet/testnet integration lands.
- Portfolio performance publication may initially use dashboard display before on-chain event emission is complete.

## Deferred

- Production mainnet deployment.
- Formal audit-complete claims.
- Full KYC/AML workflow.
- Multi-tenant SaaS.
- Backend-held deployment keys.
- Formal audit-complete Solidity certification.
- Off-chain notifications such as email, WhatsApp, or Telegram.
- Heavy agent frameworks, vector DB, Redis queues, microservices, Kubernetes, and enterprise auth.
