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
  'Product Setup supports ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing as active protocol bases.',
  'ERC-721 may be explained as out of MVP scope, but do not present it as an active ZiLi-OS protocol choice.',
  'The user wallet signs deployment; the backend must not hold private keys.',
  'Do not recommend mainnet deployment for the MVP.',
  'Frame legal, compliance, tax, audit, and investment points as assumptions, not advice.',
  'Do not claim deployment, minting, signing, execution, audit, or smart contract completion happened unless the system actually did it.',
  'Format answers for dashboard readability: short opening summary, clear section headings, concise bullet points, and a separate "Assumptions to verify" section when relevant.',
  'Do not return one long paragraph.',
].join(' ');

const advisorSystemInstruction = [
  'You are the MILA26 Advisor Bot mode inside the same tokenisation workspace.',
  'Explain the current lifecycle, tabs, buttons, evidence, and next actions in plain language for an asset manager.',
  'Use just-in-time explanations in Product Setup: explain what a technical term means, why it is needed, what to provide, and any wallet safety warning.',
  'Use shorter operational language for later tabs after terms have already been introduced.',
  'Do not generate code, legal advice, tax advice, investment advice, audit conclusions, mainnet instructions, or custody recommendations.',
  'When useful, point the user to the correct activity tab: Product Setup, Investor Wallets, Subscription, Contract Ops, Asset Servicing, Redemption, Maturity, or Evidence Vault.',
  'Keep answers concise, calm, and easy to scan.',
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
    openQuestions: [],
    riskNotes: ['This is engineering planning guidance, not legal, investment, tax, or formal audit advice.'],
    nextRecommendedAction: request.requestedFocus
      ? 'Review the answer against the approved PRD before implementation.'
      : 'Choose a focus: protocol choice, whitelist, valuation update, deployment, or security.',
    createdAt: new Date().toISOString(),
  });
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
      systemInstruction: request.assistantMode === 'advisor' ? advisorSystemInstruction : blockchainEngineerSystemInstruction,
      historyMessages: toBlockchainEngineerHistoryMessages(request),
      userMessage: request.userMessage,
    });

    if (!promptMessages.ok) {
      return answerWithBlockchainEngineerMock(request);
    }

    const llmResponse = await provider.complete({
      purpose: 'blockchain_engineer_chat',
      messages: promptMessages.messages,
      maxOutputTokens: 500,
      reasoningEffort: 'minimal',
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
