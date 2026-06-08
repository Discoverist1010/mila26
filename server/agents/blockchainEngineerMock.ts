import {
  BlockchainEngineerChatResponseSchema,
  type BlockchainEngineerChatRequest,
  type BlockchainEngineerChatResponse,
} from '../contracts/chat';

const agentId = 'blockchain-engineer' as const;

function createMessageId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

export function answerWithBlockchainEngineerMock(
  request: BlockchainEngineerChatRequest,
): BlockchainEngineerChatResponse {
  const lower = request.userMessage.toLowerCase();
  const createdAt = new Date().toISOString();
  const base = {
    messageId: createMessageId(),
    agentId,
    createdAt,
  };

  if (request.assistantMode === 'advisor') {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Advisor Bot view: start by telling ZiLi-OS what you are trying to tokenise, even if the details are incomplete. I can explain protocol fit, wallet roles, minting, burning, redemption handling, and evidence in plain language while the Engineering Bot structures confirmed requirements in the same shared Product Setup context.',
      openQuestions: ['Which tokenisation concept or missing Product Setup field should I explain first?'],
      riskNotes: ['This is explanatory product guidance, not legal, tax, accounting, investment, or formal audit advice.'],
      nextRecommendedAction: 'Ask Advisor Bot to explain a concept, or switch to Engineering Bot to structure the next Product Setup requirement.',
    });
  }

  if (
    request.requestedFocus === 'protocol_choice' ||
    includesAny(lower, ['erc-20', 'erc20', 'erc-4626', 'erc4626', 'erc-3643', 'erc3643', 'erc-721', 'erc721', 'protocol', 'fungible', 'non-fungible', 'rebasing'])
  ) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Engineering Bot view: ZiLi-OS starts with four protocol bases for Product Setup: ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing. For a product with whitelisted wallets and restricted token holding, ERC-3643 is usually the best architecture target. ERC-721 can be explained if asked, but it is out of MVP scope because this workflow focuses on fungible investment units, vault shares, permissioned fungible tokens, and rebasing balances.',
      protocolComparison: {
        erc20: 'Simple fungible investment units where restrictions can stay mostly in the ZiLi-OS workflow or custom extensions.',
        erc4626: 'Best for a clean single-asset vault where investors deposit one ERC-20 asset and receive vault shares.',
        erc3643: 'Best fit when approved wallets, permissioned holding, and transfer checks are central to the product.',
        rebasingErc20: 'Use only when investor balances should automatically adjust after NAV, value, or yield updates.',
        erc721OutOfScope: 'Useful for unique non-fungible token IDs, but not an active ZiLi-OS MVP protocol base.',
        recommendation: 'Recommend ERC-3643 when whitelisted wallets and restricted transfers are core requirements; otherwise choose the closest of the four bases by product behaviour.',
      },
      suggestedRequirementUpdates: [
        {
          field: 'protocol_base',
          proposedValue: 'ERC-3643',
          rationale: 'Whitelisted wallets and restricted token holding point to a permissioned token architecture.',
          confidence: 0.88,
        },
      ],
      openQuestions: ['Do only approved wallets need to hold or receive the token?', 'Should balances stay fixed unless investors subscribe/redeem, or should they rebase after NAV updates?'],
      riskNotes: ['This is product-engineering guidance, not legal, investment, or formal audit advice.'],
      nextRecommendedAction: 'Confirm the recommended protocol base in Product Setup before Contract Ops prepares deployment settings.',
    });
  }

  if (request.requestedFocus === 'whitelist' || includesAny(lower, ['whitelist', 'wallet', '20', '50', 'address'])) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Engineering Bot view: for the MVP, ZiLi-OS can model up to 50 investor wallet addresses as a whitelist requirement. A whitelisted wallet is a public address approved to receive or hold the product token. Real-world investor names should stay off-chain by default, while wallet addresses and provider-derived events can support token-holder evidence.',
      suggestedRequirementUpdates: [
        {
          field: 'walletWhitelistRequirement',
          proposedValue: 'up to 50 whitelisted investor wallet addresses',
          rationale: 'The MVP scale is one asset manager and up to 50 investor wallets.',
          confidence: 0.9,
        },
        {
          field: 'allocationValidation',
          proposedValue: 'allocation percentages must total 100% before distribution',
          rationale: 'Distribution should fail closed if allocations are incomplete or inconsistent.',
          confidence: 0.86,
        },
      ],
      openQuestions: ['Will the asset manager provide public wallet addresses now, or mark them as to be added before deployment?'],
      riskNotes: ['Do not put real-world investor names on-chain by default.'],
      nextRecommendedAction: 'Capture wallet list and allocation rules in the PRD.',
    });
  }

  if (
    request.requestedFocus === 'valuation_update' ||
    includesAny(lower, ['valuation', 'performance', 'nav', 'daily', 'gain', 'loss'])
  ) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Daily portfolio performance should be treated as an off-chain upload first: total portfolio performance, gain/loss against initial investment, and the effective date. For MVP visibility, MILA26 can make this available through a token-holder dashboard and later consider on-chain event emission for evidence without building production oracle infrastructure.',
      suggestedRequirementUpdates: [
        {
          field: 'valuationUpdateRequirement',
          proposedValue: 'daily valuation upload with total performance and gain/loss fields',
          rationale: 'This supports token-holder visibility without adding a production oracle in the MVP.',
          confidence: 0.84,
        },
      ],
      openQuestions: ['What file format will the asset manager upload for valuation data?'],
      riskNotes: ['Avoid presenting uploaded valuation data as independently verified unless a review process exists.'],
      nextRecommendedAction: 'Define the minimum valuation file fields before implementation.',
    });
  }

  if (request.requestedFocus === 'deployment' || includesAny(lower, ['deploy', 'testnet', 'sign', 'mint', 'distribute'])) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Deployment should stay Sepolia testnet-only for the current executable MVP. Ethereum mainnet may be recorded as a future intent, but Contract Ops must not execute mainnet. The backend can prepare deployment or token-operation intent, but the user wallet must sign. Deployment remains gated by confirmed Product Setup essentials, generated artifacts, wallet readiness, and evidence boundaries.',
      suggestedRequirementUpdates: [
        {
          field: 'deploymentModel',
          proposedValue: 'user wallet signs Sepolia testnet deployment and token operations',
          rationale: 'This keeps private keys out of the backend and supports demo credibility.',
          confidence: 0.88,
        },
      ],
      openQuestions: ['Which public admin wallet address should manage the token contract before Sepolia deployment?'],
      riskNotes: ['Backend must never hold deployment private keys; mainnet is out of scope for MVP.'],
      nextRecommendedAction: 'Keep deployment planning behind the testnet-only wallet-signed gate.',
    });
  }

  if (
    request.requestedFocus === 'security' ||
    includesAny(lower, ['security', 'audit', 'openzeppelin', 'qa', 'review', 'gate'])
  ) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'For Solidity generation, the MVP should default to OpenZeppelin Contracts for the supported fungible-token profiles and common access-control/security primitives unless the approved Product Setup record justifies otherwise. QA and Security Reviewer checks should happen before deployment readiness, and no generated code should be described as formal-audit-complete.',
      suggestedRequirementUpdates: [
        {
          field: 'libraryPolicy',
          proposedValue: 'default to OpenZeppelin Contracts for supported fungible-token primitives and access-control patterns',
          rationale: 'Trusted token primitives reduce avoidable risk versus hand-rolled standards.',
          confidence: 0.9,
        },
      ],
      openQuestions: ['Does the PRD require upgradeability, or can MVP contracts stay simple and non-upgradeable?'],
      riskNotes: ['Security benchmark review is not a formal production audit.'],
      nextRecommendedAction: 'Record library policy and QA/security gates in the PRD.',
    });
  }

  return BlockchainEngineerChatResponseSchema.parse({
    ...base,
    content:
      'Engineering Bot view: I can help turn unstructured asset-manager intent into Product Setup requirements. The next useful decisions are protocol base, whitelisted wallet rules for up to 50 investors, subscription stablecoins, redemption delay, admin wallet, redemption wallet, and the wallet-signed Sepolia deployment gate. I will propose updates for user confirmation instead of silently changing the Product Setup record.',
    openQuestions: [
      'Do only approved wallets need to hold or receive tokens?',
      'Do you already have the investor wallet addresses and allocation percentages?',
      'Which stablecoins and redemption delay should ZiLi-OS capture first?',
    ],
    riskNotes: ['This is engineering planning guidance, not legal, investment, tax, or formal audit advice.'],
    nextRecommendedAction: 'Choose a focus: protocol choice, whitelist, valuation update, deployment, or security.',
  });
}
