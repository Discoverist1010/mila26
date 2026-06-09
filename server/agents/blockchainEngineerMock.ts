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

function extractInvestorCount(value: string): string | undefined {
  const match = value.match(/\b(\d{1,3})(?:\s*-\s*\d{1,3}|\s+to\s+\d{1,3})?\s+investors?\b/i);
  return match?.[1];
}

function looksLikeEarlyProductSetupIntent(value: string): boolean {
  return (
    includesAny(value, ['tokenise', 'tokenize', 'tokenised', 'tokenized', 'create a token', 'create token']) ||
    (includesAny(value, ['portfolio', 'fund', 'product']) && includesAny(value, ['create', 'setup', 'set up', 'build']))
  );
}

function looksLikeRequirementRevision(value: string): boolean {
  return includesAny(value, ['actually', 'instead', 'change my mind', 'changed my mind', 'rather than', 'make it']);
}

export function answerWithBlockchainEngineerMock(
  request: BlockchainEngineerChatRequest,
): BlockchainEngineerChatResponse {
  const lower = request.userMessage.toLowerCase();
  const investorCount = extractInvestorCount(request.userMessage);
  const createdAt = new Date().toISOString();
  const base = {
    messageId: createMessageId(),
    agentId,
    responseSource: 'local_fallback' as const,
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

  if (!request.requestedFocus && looksLikeRequirementRevision(lower)) {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content: [
        'Engineering Bot view: understood. I will treat this as a revision to the working Product Setup, not as a separate product.',
        '',
        'Next I would replay the affected assumptions, mark which earlier requirement changed, and ask only the clarification needed to keep the canonical Product Setup record coherent.',
        '',
        'Revision questions:',
        '- Which earlier requirement should this replace: product type, investor count, subscription method, transfer rule, redemption handling, or protocol preference?',
        '- Should the older assumption be removed, kept as an alternative, or marked as deferred?',
        '',
        'Once the revision is clear, ZiLi-OS should consolidate the draft requirements again and refresh the protocol-fit view before later tabs rely on it.',
      ].join('\n'),
      openQuestions: [
        'Which earlier requirement should this replace?',
        'Should the older assumption be removed, kept as an alternative, or marked as deferred?',
      ],
      riskNotes: ['Confirmed Product Setup changes should keep visible provenance instead of silently overwriting prior user intent.'],
      nextRecommendedAction: 'Clarify the changed requirement, then review the consolidated Product Setup before downstream tab work continues.',
    });
  }

  if (!request.requestedFocus && looksLikeEarlyProductSetupIntent(lower)) {
    const productShape = lower.includes('portfolio')
      ? 'portfolio-like tokenised product'
      : lower.includes('fund')
        ? 'fund-like tokenised product'
        : 'tokenised product';
    const capturedFields = [
      `product shape: ${productShape}`,
      investorCount ? `expected investors: ${investorCount}` : 'expected investors: not confirmed yet',
    ];

    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content: [
        'Engineering Bot view: I understand you want ZiLi-OS to help shape the product before we move into contract configuration.',
        '',
        'Captured so far:',
        `- ${capturedFields.join('\n- ')}`,
        '',
        'Before I recommend protocol settings or deployment steps, I need an initial focused batch of Product Setup details. These answers will become reviewable requirement updates and can later feed the Product Setup Pack.',
        '',
        'I will not treat this as a fixed three-question form. If your answers change the direction, I will revise the working interpretation. After a few Product Setup exchanges, I should replay the draft requirements, flag remaining crucial gaps, and ask whether to confirm, revise, or defer them.',
        '',
        'Questions:',
        '- What is the underlying product or asset pool: private credit, listed securities, real estate, mixed portfolio, or something else?',
        '- How should investors subscribe: USDC, another stablecoin, bank transfer recorded off-chain, manual allocation, or not sure yet?',
        '- Should only approved wallets be allowed to hold or receive the token?',
        '',
        'Before Product Setup is treated as sufficient for later tabs, ZiLi-OS should also propose a protocol-fit view: recommended architecture target, current executable prototype, and any unsupported/custom requirements.',
        '',
        'If any term is unclear, ask me and I will explain it before we continue.',
      ].join('\n'),
      suggestedRequirementUpdates: investorCount
        ? [
            {
              field: 'expected_investors',
              proposedValue: investorCount,
              rationale: 'User described the expected investor count in the Product Setup chat.',
              confidence: 0.88,
            },
          ]
        : [],
      openQuestions: [
        'What is the underlying product or asset pool?',
        'How should investors subscribe?',
        'Should only approved wallets be allowed to hold or receive the token?',
      ],
      riskNotes: ['This is Product Setup intake, not legal, investment, tax, or formal audit advice.'],
      nextRecommendedAction: 'Answer the next Product Setup questions so ZiLi-OS can update the canonical requirements record.',
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

  if (request.requestedFocus === 'whitelist' || includesAny(lower, ['whitelist', 'wallet', 'address'])) {
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
      'Engineering Bot view: I can help turn unstructured asset-manager intent into Product Setup requirements. I will first replay what I understand, capture likely fields for review, then ask focused questions before moving into protocol or deployment details. The question count is not fixed: if you revise the product or a crucial field is still missing, I will clarify and then consolidate the draft requirements. I will propose updates for user confirmation instead of silently changing the Product Setup record.',
    openQuestions: [
      'What are you trying to tokenise?',
      'How many investors or wallets should ZiLi-OS plan for?',
      'Should only approved wallets be allowed to hold or receive the token?',
    ],
    riskNotes: ['This is engineering planning guidance, not legal, investment, tax, or formal audit advice.'],
    nextRecommendedAction: 'Share rough Product Setup notes so ZiLi-OS can extract requirements, consolidate them, and propose a protocol-fit view for later tabs.',
  });
}
