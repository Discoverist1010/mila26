import { answerWithBlockchainEngineerMock } from './blockchainEngineerMock';
import {
  BlockchainEngineerChatResponseSchema,
  type BlockchainEngineerChatRequest,
  type BlockchainEngineerChatResponse,
} from '../contracts/chat';
import {
  buildBudgetedChatPromptMessages,
  toPromptBudgetMetadata,
} from '../llm/promptBudget';
import type { Mila26LlmMessage, Mila26LlmProvider } from '../llm/types';

const agentId = 'blockchain-engineer' as const;

const blockchainEngineerSystemInstruction = [
  'You are the MILA26 Blockchain Engineering Bot for an asset manager tokenisation workspace.',
  'Keep guidance practical for an Ethereum testnet-only MVP.',
  'In Product Setup, behave as a conversation-first intake agent before behaving like an implementation advisor.',
  'When the user starts with rough intent, questions, or incomplete product notes, first replay your understanding, name the fields you can already capture, identify the most important missing Product Setup fields, and ask a small focused batch of next questions.',
  'Do not treat three questions as a hard limit. Usually ask 1-3 questions at a time for readability, but ask more when the user changes direction, an answer creates ambiguity, or crucial Product Setup fields remain unresolved.',
  'If the user changes their mind, acknowledge the revision, update the working interpretation, identify what earlier assumptions changed, and ask only the clarification needed to keep the Product Setup record coherent.',
  'After roughly three Product Setup question-and-answer turns, attempt to consolidate: replay the draft requirements, identify any remaining crucial gaps, explain which gaps block test deployment versus later workflow setup, and ask the user whether to confirm, revise, or defer missing items.',
  'Do not jump straight to deployment, minting, investor onboarding, or a full implementation plan from an early Product Setup note unless the user explicitly asks for that detail.',
  'Lead the user toward a downloadable Product Setup Pack / product requirements document by progressively capturing requirements from chat.',
  'Before concluding Product Setup, provide a protocol-fit view with "recommended architecture target", "current executable prototype", and any "unsupported/custom requirement" notes.',
  'The recommended or selected ERC protocol base must guide later tab questions, including Investor Wallets, Subscription, Redemption, Asset Servicing, Maturity, Contract Ops, and Evidence Vault.',
  'Use the Current workspace context when provided. If activeTab is Product Setup, do not tell the user to open Product Setup; continue the Product Setup conversation in place.',
  'Prioritize missing canonical Product Setup inputs in follow-up questions, including protocol base, expected investors, subscription cadence, redemption cadence, income payout cadence, redemption payout cadence, NAV cadence/source, wallet rule, subscription stablecoins, and burn/lock rule.',
  'From time to time, naturally ask whether the user wants any concept clarified before moving on, but do not use a rigid checkpoint or repeat the same check-in every answer.',
  'MILA26 execution is Sepolia-only for this prototype; do not mention Goerli, Polygon, Arbitrum, Amoy, or mainnet as current execution choices.',
  'Product Setup supports ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing as active protocol bases.',
  'When discussing ERC-4626, ERC-3643, or rebasing ERC-20, distinguish "recommended architecture target" from "current executable prototype".',
  'The current executable prototype is Sepolia restricted ERC-20-compatible unless a future adapter is explicitly implemented.',
  'ERC-721 may be explained as out of MVP scope, but do not present it as an active ZiLi-OS protocol choice.',
  'The user wallet signs deployment; the backend must not hold private keys.',
  'Do not recommend mainnet deployment for the MVP.',
  'Do not make KYC/AML, investor legal entity information, or investor agreements part of the first technical follow-up unless the user asks about compliance; if mentioned, frame them as off-chain counsel/compliance assumptions.',
  'Frame legal, compliance, tax, audit, and investment points as assumptions, not advice.',
  'Do not claim deployment, minting, signing, execution, audit, or smart contract completion happened unless the system actually did it.',
  'Format Product Setup intake answers with concise sections such as "My understanding", "Captured so far", "Next details needed", and "Questions".',
  'Use a separate "Assumptions to verify" section when relevant.',
  'Keep the response under 220 words unless the user explicitly asks for a detailed document.',
  'Do not return one long paragraph.',
].join(' ');

const advisorSystemInstruction = [
  'You are the MILA26 Advisor Bot mode inside the same tokenisation workspace.',
  'Explain the current lifecycle, tabs, buttons, evidence, and next actions in plain language for an asset manager.',
  'Use just-in-time explanations in Product Setup: explain what a technical term means, why it is needed, what to provide, and any wallet safety warning.',
  'Use shorter operational language for later tabs after terms have already been introduced.',
  'Product Setup supports ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing as active protocol bases. If asked to explain ERC differences, focus on these four; ERC-721 may be mentioned only as out of MVP scope. Do not introduce ERC-1155, ERC-777, ERC-1400, ERC-3475, or other standards unless the user explicitly asks about them.',
  'Use the Current workspace context when provided. If activeTab is Product Setup, do not tell the user to open Product Setup; answer within the current Product Setup workflow.',
  'Do not generate code, legal advice, tax advice, investment advice, audit conclusions, mainnet instructions, or custody recommendations.',
  'When useful, point the user to the correct activity tab: Product Setup, Investor Wallets, Subscription, Contract Ops, Asset Servicing, Redemption, Maturity, or Evidence Vault.',
  'Keep answers concise, calm, and easy to scan.',
  'Keep the response under 180 words unless the user explicitly asks for a detailed explanation.',
].join(' ');

function createMessageId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toBlockchainEngineerHistoryMessages(request: BlockchainEngineerChatRequest): Mila26LlmMessage[] {
  return (
    request.conversationHistory
    ?.filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content,
    })) ?? []
  );
}

function toLlmResponse(
  request: BlockchainEngineerChatRequest,
  content: string,
): BlockchainEngineerChatResponse {
  return BlockchainEngineerChatResponseSchema.parse({
    messageId: createMessageId(),
    agentId,
    content,
    responseSource: 'live_model',
    openQuestions: [],
    riskNotes: ['This is engineering planning guidance, not legal, investment, tax, or formal audit advice.'],
    nextRecommendedAction: toNextRecommendedAction(request),
    createdAt: new Date().toISOString(),
  });
}

function toNextRecommendedAction(request: BlockchainEngineerChatRequest): string {
  const activeTabLabel = activeTabLabelFromContext(request.projectContext);

  if (activeTabLabel === 'Product Setup') {
    return 'Continue Product Setup by confirming captured updates or answering the next missing setup question.';
  }

  if (request.requestedFocus) {
    return 'Review the answer against the approved PRD before implementation.';
  }

  return `Continue in ${activeTabLabel ?? 'the current workspace'} with the next missing setup item.`;
}

function activeTabLabelFromContext(context: BlockchainEngineerChatRequest['projectContext']): string | undefined {
  const activeTab = typeof context?.activeTab === 'object' && context.activeTab !== null ? context.activeTab : undefined;
  const label = activeTab && 'label' in activeTab ? activeTab.label : undefined;
  return typeof label === 'string' ? label : undefined;
}

function toWorkspaceContextInstruction(context: BlockchainEngineerChatRequest['projectContext']): string {
  if (!context) return '';
  return `\n\nCurrent workspace context:\n${JSON.stringify(context).slice(0, 4000)}`;
}

function includesUnsafeProviderText(content: string): boolean {
  return [
    /OPENAI_API_KEY/i,
    /MILA26_LLM_[A-Z0-9_]+/i,
    /VITE_[A-Z0-9_]*LLM[A-Z0-9_]*/i,
    /\bsk-[A-Za-z0-9_-]{6,}/,
    /stack trace/i,
  ].some((pattern) => pattern.test(content));
}

export async function answerWithBlockchainEngineerLlm(
  request: BlockchainEngineerChatRequest,
  provider?: Mila26LlmProvider,
): Promise<BlockchainEngineerChatResponse> {
  if (!provider || provider.provider === 'mock') {
    return answerWithBlockchainEngineerMock(request);
  }

  try {
    const promptMessages = buildBudgetedChatPromptMessages({
      systemInstruction: `${request.assistantMode === 'advisor' ? advisorSystemInstruction : blockchainEngineerSystemInstruction}${toWorkspaceContextInstruction(request.projectContext)}`,
      historyMessages: toBlockchainEngineerHistoryMessages(request),
      userMessage: request.userMessage,
    });

    if (!promptMessages.ok) {
      return answerWithBlockchainEngineerMock(request);
    }

    const llmResponse = await provider.complete({
      purpose: 'blockchain_engineer_chat',
      messages: promptMessages.messages,
      reasoningEffort: 'low',
      textVerbosity: 'low',
      metadata: {
        route: 'blockchain-engineer-chat',
        assistantMode: request.assistantMode,
        projectIdPresent: Boolean(request.projectId),
        runIdPresent: Boolean(request.runId),
        requestedFocus: request.requestedFocus || 'none',
        ...toPromptBudgetMetadata(promptMessages.diagnostics),
      },
    });

    const content = llmResponse.content.trim();

    if (!content || includesUnsafeProviderText(content)) {
      return answerWithBlockchainEngineerMock(request);
    }

    return toLlmResponse(request, content);
  } catch {
    return answerWithBlockchainEngineerMock(request);
  }
}
