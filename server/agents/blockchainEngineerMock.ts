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

function includesPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
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

function looksLikeProtocolConfusion(value: string): boolean {
  const hasConfusion = includesPattern(value, [
    /\bconfused\b/i,
    /\bdon'?t\s+understand\b/i,
    /\bnot\s+clear\b/i,
    /\bunclear\b/i,
    /\bwhy\b/i,
    /\bwhat\s+do\s+you\s+mean\b/i,
    /\bclarif(?:y|ication)\b/i,
  ]);
  const hasProtocolReference = includesPattern(value, [
    /\berc-?\s*(?:20|4626|3643)\b/i,
    /\berc\b/i,
    /\bprotocol\b/i,
    /\bsepolia\b/i,
    /\bcurrent\s+executable\s+prototype\b/i,
    /\barchitecture\s+target\b/i,
  ]);
  return hasConfusion && hasProtocolReference;
}

function selectedProtocolBaseFromContext(request: BlockchainEngineerChatRequest): string | undefined {
  const productSetup = request.projectContext?.productSetup;
  if (!productSetup || typeof productSetup !== 'object' || !('selectedProtocolBase' in productSetup)) return undefined;
  return typeof productSetup.selectedProtocolBase === 'string' ? productSetup.selectedProtocolBase : undefined;
}

function productSetupContextValue(request: BlockchainEngineerChatRequest, key: string): unknown {
  const productSetup = request.projectContext?.productSetup;
  if (!productSetup || typeof productSetup !== 'object') return undefined;
  return (productSetup as Record<string, unknown>)[key];
}

function prdReadinessStateFromContext(request: BlockchainEngineerChatRequest): string | undefined {
  const value = productSetupContextValue(request, 'prdReadinessState');
  return typeof value === 'string' ? value : undefined;
}

function stringArrayProductSetupContextValue(request: BlockchainEngineerChatRequest, key: string): string[] {
  const value = productSetupContextValue(request, key);
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function answerWithBlockchainEngineerMock(
  request: BlockchainEngineerChatRequest,
): BlockchainEngineerChatResponse {
  const lower = request.userMessage.toLowerCase();
  const investorCount = extractInvestorCount(request.userMessage);
  const selectedProtocolBase = selectedProtocolBaseFromContext(request);
  const createdAt = new Date().toISOString();
  const base = {
    messageId: createMessageId(),
    agentId,
    responseSource: 'local_fallback' as const,
    createdAt,
  };

  if (request.assistantMode === 'advisor') {
    if (looksLikeProtocolConfusion(lower)) {
      return BlockchainEngineerChatResponseSchema.parse({
        ...base,
        content:
          'Advisor Bot view: the ERC-3643 and ERC-20 messages are about two different levels. ERC-3643 is the recommended architecture target when a product needs approved wallets and restricted transfers. The current executable prototype is the Sepolia ERC-20-compatible restricted token, which means this workspace can deploy and test that simpler prototype now while keeping ERC-3643 as the target design. You do not need to choose while this is unclear. Does this clarify the difference?',
        openQuestions: [
          'Does this clarify the difference between the ERC-3643 architecture target and the current Sepolia ERC-20-compatible prototype?',
        ],
        riskNotes: ['Protocol fit is product-engineering guidance, not legal, tax, accounting, investment, or formal audit advice.'],
        nextRecommendedAction: 'Clarify the protocol distinction before continuing Product Setup.',
      });
    }

    if (includesAny(lower, ['erc', 'protocol', 'standard'])) {
      return BlockchainEngineerChatResponseSchema.parse({
        ...base,
        content:
          'Advisor Bot view: for ZiLi-OS Product Setup, compare the four active protocol bases only. ERC-20 is the simplest fungible-token base. ERC-4626 fits vault-share behaviour when investors deposit an ERC-20 asset and receive shares. ERC-3643 fits approved-wallet and transfer-restricted products. Custom ERC-20 with rebasing fits products where balances adjust after NAV, yield, or value updates. ERC-721 can be explained if needed, but it is out of MVP scope for ZiLi-OS.',
        openQuestions: ['Do you want a simple comparison, or should I map these four options to your current Product Setup?'],
        riskNotes: ['Protocol fit is product-engineering guidance, not legal, tax, accounting, investment, or formal audit advice.'],
        nextRecommendedAction: 'Ask ZiLi-OS to explain how the protocol recommendation maps to your Product Setup.',
      });
    }

    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Advisor Bot view: start by telling ZiLi-OS what you are trying to tokenise, even if the details are incomplete. I can explain protocol fit, wallet roles, minting, burning, redemption handling, and evidence in plain language while the Engineering Bot structures confirmed requirements in the same shared Product Setup context.',
      openQuestions: ['Which tokenisation concept or missing Product Setup field should I explain first?'],
      riskNotes: ['This is explanatory product guidance, not legal, tax, accounting, investment, or formal audit advice.'],
      nextRecommendedAction: 'Ask a concept question, or continue the Product Setup conversation from the current tab.',
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
        'Once the revision is clear, ZiLi-OS should consolidate the draft requirements again and refresh the protocol recommendation before later tabs rely on it.',
      ].join('\n'),
      openQuestions: [
        'Which earlier requirement should this replace?',
        'Should the older assumption be removed, kept as an alternative, or marked as deferred?',
      ],
      riskNotes: ['Confirmed Product Setup changes should keep visible provenance instead of silently overwriting prior user intent.'],
      nextRecommendedAction: 'Clarify the changed requirement, then review the consolidated Product Setup before downstream tab work continues.',
    });
  }

  const prdReadinessState = prdReadinessStateFromContext(request);
  if (!request.requestedFocus && prdReadinessState === 'Ready for review') {
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content:
        'Engineering Bot view: the Product Setup PRD is ready for review. I will stop asking for more Product Setup fields unless you explicitly want to edit or replace a captured requirement. The next clean step is to review the Product Setup PRD, finalise it, then download the DOCX or Markdown copy and send the confirmed facts to the downstream lifecycle tabs.',
      openQuestions: ['Do you want to finalise the Product Setup PRD, or edit a specific captured requirement first?'],
      riskNotes: ['Finalisation records the PRD for workflow use; it is not legal, compliance, investment, tax, or formal audit approval.'],
      nextRecommendedAction: 'Review and finalise the Product Setup PRD.',
    });
  }

  if (!request.requestedFocus && prdReadinessState === 'Ready with critical deferrals') {
    const criticalDeferredInputs = stringArrayProductSetupContextValue(request, 'criticalDeferredInputs');
    const deferredText = criticalDeferredInputs.length > 0 ? criticalDeferredInputs.join(', ') : 'the critical deferred fields';
    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content: `Engineering Bot view: the Product Setup PRD is almost ready, but ${deferredText} still need confirmation or an explicit acknowledged deferral before clean finalisation. I will not ask for already captured fields again; I will focus only on those critical deferred items.`,
      openQuestions: [`Confirm, edit, or keep deferred before finalisation: ${deferredText}?`],
      riskNotes: ['Critical deferred fields can affect downstream Contract Ops, Investor Wallets, Subscription, Redemption, or Evidence Vault assumptions.'],
      nextRecommendedAction: 'Resolve the critical deferred Product Setup fields, then finalise the PRD.',
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
        'Before I recommend protocol settings or deployment steps, I need an initial focused batch of Product Setup details. These answers will become reviewable requirement updates and can later feed the Product Setup PRD.',
        '',
        'I will not treat this as a fixed three-question form. If your answers change the direction, I will revise the working interpretation. After a few Product Setup exchanges, I should replay the draft requirements, flag remaining crucial gaps, and ask whether to confirm, revise, or defer them.',
        '',
        'Questions:',
        '- What is the underlying product or asset pool: private credit, listed securities, real estate, mixed portfolio, or something else?',
        '- How should investors subscribe: USDC, another stablecoin, bank transfer recorded off-chain, manual allocation, or not sure yet?',
        '- Should only approved wallets be allowed to hold or receive the token?',
        '',
        'Before Product Setup is treated as sufficient for later tabs, ZiLi-OS should also propose a protocol recommendation: recommended architecture target, current executable prototype, and any unsupported/custom requirements.',
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
    const hasErc20Selection = selectedProtocolBase === 'ERC-20' || /\berc-?\s*20\b|\berc20\b/.test(lower);

    return BlockchainEngineerChatResponseSchema.parse({
      ...base,
      content: hasErc20Selection
        ? 'Engineering Bot view: I will keep ERC-20 as the working protocol base. The tradeoff is that ERC-20 is simpler and matches the current Sepolia executable prototype, while approved-wallet restrictions need to be handled by ZiLi-OS workflow or custom contract logic. ERC-3643 remains the stronger native permissioning target if you later want built-in transfer checks. You can revisit this in Contract Ops before finalisation.'
        : 'Engineering Bot view: ZiLi-OS starts with four protocol bases for Product Setup: ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing. For a product with whitelisted wallets and restricted token holding, ERC-3643 is usually the best architecture target. ERC-721 can be explained if asked, but it is out of MVP scope because this workflow focuses on fungible investment units, vault shares, permissioned fungible tokens, and rebasing balances.',
      protocolComparison: {
        erc20: 'Simple fungible investment units where restrictions can stay mostly in the ZiLi-OS workflow or custom extensions.',
        erc4626: 'Best for a clean single-asset vault where investors deposit one ERC-20 asset and receive vault shares.',
        erc3643: 'Best fit when approved wallets, permissioned holding, and transfer checks are central to the product.',
        rebasingErc20: 'Use only when investor balances should automatically adjust after NAV, value, or yield updates.',
        erc721OutOfScope: 'Useful for unique non-fungible token IDs, but not an active ZiLi-OS MVP protocol base.',
        recommendation: hasErc20Selection
          ? 'Keep ERC-20 as the working choice now; revisit ERC-3643 in Contract Ops only if native permissioning becomes more important than prototype simplicity.'
          : 'Recommend ERC-3643 when whitelisted wallets and restricted transfers are core requirements; otherwise choose the closest of the four bases by product behaviour.',
      },
      suggestedRequirementUpdates: hasErc20Selection
        ? []
        : [
            {
              field: 'protocol_base',
              proposedValue: 'ERC-3643',
              rationale: 'Whitelisted wallets and restricted token holding point to a permissioned token architecture.',
              confidence: 0.88,
            },
          ],
      openQuestions: hasErc20Selection
        ? ['Does this tradeoff make sense, or do you want ZiLi-OS to compare ERC-20 and ERC-3643 in more detail?']
        : ['Do only approved wallets need to hold or receive the token?', 'Should balances stay fixed unless investors subscribe/redeem, or should they rebase after NAV updates?'],
      riskNotes: ['This is product-engineering guidance, not legal, investment, or formal audit advice.'],
      nextRecommendedAction: hasErc20Selection
        ? 'Continue Product Setup with ERC-20 as the working protocol base; revisit in Contract Ops before finalisation if needed.'
        : 'Confirm the recommended protocol base in Product Setup before Contract Ops prepares deployment settings.',
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
    nextRecommendedAction: 'Share rough Product Setup notes so ZiLi-OS can extract requirements, consolidate them, and propose a protocol recommendation for later tabs.',
  });
}
