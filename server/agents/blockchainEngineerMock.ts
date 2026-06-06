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

  if (
    request.requestedFocus === 'protocol_choice' ||
    includesAny(lower, ['erc-20', 'erc20', 'erc-721', 'erc721', 'protocol', 'fungible', 'non-fungible'])
  ) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'For a tokenized portfolio with many investors holding proportional exposure, ERC-20 is usually the simpler fit because balances represent fungible shares. ERC-721 is better when each token represents a unique asset or position. We should confirm whether the product needs interchangeable investor units or unique portfolio claims before the PRD locks the protocol.',
      protocolComparison: {
        erc20: 'Best for fungible portfolio shares, percentage allocations, mint/distribute flows, and familiar token-holder balances.',
        erc721: 'Best for unique positions, individually identified assets, or non-fungible claims where each token has distinct meaning.',
        recommendation: 'Start from ERC-20 for the MVP unless the asset manager needs each investor position to be unique.',
      },
      suggestedRequirementUpdates: [
        {
          field: 'selectedProtocol',
          proposedValue: 'ERC-20 preferred unless unique investor positions are required',
          rationale: 'The MVP describes proportional portfolio exposure and distribution to up to 50 wallets.',
          confidence: 0.82,
        },
      ],
      openQuestions: ['Should investors hold fungible shares, or does each investor position need unique token metadata?'],
      riskNotes: ['This is product-engineering guidance, not legal, investment, or formal audit advice.'],
      nextRecommendedAction: 'Confirm fungible versus unique-token behavior before PRD approval.',
    });
  }

  if (request.requestedFocus === 'whitelist' || includesAny(lower, ['whitelist', 'wallet', '20', '50', 'address'])) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'For the MVP, we can model up to 50 investor wallet addresses as a whitelist requirement. Real-world investor names should stay off-chain by default, while the contract can use wallet addresses and events for token-holder visibility. Allocation percentages should be validated so the total equals 100% before distribution.',
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
      openQuestions: ['Will the asset manager provide all wallet addresses before deployment, or add them before mint/distribution?'],
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
        'Deployment should stay Ethereum testnet-only for the MVP. The backend can prepare deployment or token-operation intent later, but the user wallet must sign. Deployment should remain gated by PRD approval, coding completion, QA review, security benchmark review, and evidence-pack recording.',
      suggestedRequirementUpdates: [
        {
          field: 'deploymentModel',
          proposedValue: 'user wallet signs Ethereum testnet deployment and token operations',
          rationale: 'This keeps private keys out of the backend and supports demo credibility.',
          confidence: 0.88,
        },
      ],
      openQuestions: ['Which Ethereum testnet should be used for the local funding demo?'],
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
        'For Solidity generation, the MVP should default to OpenZeppelin Contracts for ERC-20/ERC-721 and common access-control/security primitives unless the approved PRD justifies otherwise. QA and Security Reviewer Bot checks should happen before deployment readiness, and no generated code should be described as formal-audit-complete.',
      suggestedRequirementUpdates: [
        {
          field: 'libraryPolicy',
          proposedValue: 'default to OpenZeppelin Contracts for ERC-20/ERC-721 primitives',
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
      'I can help turn the asset manager intent into concrete tokenization requirements. The next useful decisions are ERC-20 versus ERC-721, whitelist and allocation rules for up to 50 wallets, valuation/performance update shape, and the wallet-signed testnet deployment gate. I will keep recommendations reviewable before PRD approval.',
    openQuestions: [
      'Should token holders receive fungible portfolio shares or unique token positions?',
      'Do you already have the investor wallet addresses and allocation percentages?',
      'How will daily portfolio performance be uploaded?',
    ],
    riskNotes: ['This is engineering planning guidance, not legal, investment, tax, or formal audit advice.'],
    nextRecommendedAction: 'Choose a focus: protocol choice, whitelist, valuation update, deployment, or security.',
  });
}
