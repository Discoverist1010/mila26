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
import { systemInstructionForAssistantMode } from './blockchainEngineerPrompt';

const agentId = 'blockchain-engineer' as const;

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
      systemInstruction: systemInstructionForAssistantMode(request.assistantMode, request.projectContext),
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
