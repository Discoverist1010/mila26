# MILA26 MVP Scope

## Target User

The MVP target user is one asset manager or tokenized portfolio founder preparing a funding-demo-ready Ethereum testnet workflow for tokenizing a portfolio and distributing tokens to a small investor set.

## Scale

- 1 asset manager.
- Up to 20 investor wallet addresses.
- Ethereum testnet only.
- Local Mac laptop demo first.
- Funding-demo-ready, not production mainnet.

## Supported ERC Protocols

MVP protocol choices:

- ERC-20.
- ERC-721.

The Blockchain Engineering Bot should explain suitability tradeoffs and help the asset manager decide. ERC protocols should be treated as having predefined events and contract behavior that guide generated requirements and code.

## Solidity Library Policy

MILA26 Solidity generation should default to OpenZeppelin Contracts for ERC-20/ERC-721 and common access-control/security primitives unless the approved PRD explicitly justifies otherwise.

Use simple non-upgradeable contracts for MVP unless upgradeability is explicitly required. Do not introduce custom token standards beyond ERC-20/ERC-721 in MVP.

## In Scope

- Turn-based Blockchain Engineering Bot chat.
- ERC-20 vs ERC-721 guidance.
- Solidity smart-contract scaffold generation.
- ERC-20/ERC-721 library-based implementation approach, using trusted primitives where practical instead of hand-rolling standard token behavior.
- PRD/enhanced Requirement Brief generation and approval.
- Whitelist requirement for up to 20 wallet addresses.
- Off-chain mapping between wallet addresses and real-world names.
- Allocation percentage entry and validation that total allocation equals 100%.
- Coding, QA, security, evidence, and deployment bot orchestration.
- QA/security benchmark review before testnet deployment preparation.
- Visible progress/status while bots work.
- User can continue chatting while background bot work runs.
- Ethereum testnet deployment preparation.
- User wallet-signed deployment and token actions.
- Mint and distribute flow.
- Valuation file upload.
- Portfolio performance availability through on-chain event emission and/or token-holder dashboard display.
- Testnet-only deployability after PRD approval, QA review, security review, and evidence-pack recording.

## Out Of Scope

- Production mainnet deployment.
- Formal audit-complete certification.
- Formal production audit.
- Custom token standard design beyond ERC-20/ERC-721.
- Production oracle infrastructure.
- Full KYC/AML.
- Multi-tenant SaaS.
- Enterprise auth.
- Backend-held private keys.
- Custody operations.
- Off-chain notifications such as email, WhatsApp, or Telegram.
- Redis queues, vector DB, microservices, Kubernetes, and heavy agent frameworks.

## Funding-Demo Success Criteria

- The demo tells a clear story from asset-manager intent to approved PRD to generated artifacts to reviewed testnet deployment path.
- The app remains runnable on a local Mac laptop.
- The interface feels like a professional AI + blockchain project workspace for asset managers, not a crypto trading dashboard.
- The user can see current project context, protocol/network/wallet status, next action, and workflow gates without hunting through chat history.
- The user sees bot orchestration and progress without waiting on unnecessary infrastructure.
- The workflow shows why ERC-20 or ERC-721 was chosen.
- Investor wallets, whitelist status, allocation validation, and distribution actions are understandable.
- The wallet-signed model is clear: user wallet signs, backend never holds private keys.
- Performance update flow is credible through dashboard display and/or event emission.
- Guardrails are visible: testnet-only, not formal audit-complete, not production mainnet.

## Risks And Assumptions

- Solidity remains scaffold/demo code until compiled, tested, reviewed, and audited.
- Solidity generation should default to OpenZeppelin Contracts-style ERC-20/ERC-721 primitives where practical.
- Security review must benchmark against recognized smart-contract vulnerability categories before testnet deployment.
- Testnet wallet UX can still be slow or fragile during live demos.
- Real-world names must remain off-chain by default.
- Valuation uploads need clear file shape and validation before implementation.
- ERC-20 vs ERC-721 guidance must be clear enough for non-technical asset managers.
- The MVP assumes one local project context, not multi-tenant collaboration.
