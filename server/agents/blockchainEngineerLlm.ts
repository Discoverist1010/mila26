import { answerWithBlockchainEngineerMock } from './blockchainEngineerMock';
import {
  BlockchainEngineerChatResponseSchema,
  type BlockchainEngineerChatRequest,
  type BlockchainEngineerChatResponse,
} from '../contracts/chat';
import type { ContractOpsSkillInvocationTrace } from '../contracts/contractOpsSkills';
import { resolveContractOpsSkillInvocation } from '../contractOpsSkills/registry';
import {
  evaluateContractOpsUserTextSafety,
  includesUnsafeContractOpsOutput,
} from '../contractOpsSkills/safety';
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
  skillInvocationTrace?: ContractOpsSkillInvocationTrace,
): BlockchainEngineerChatResponse {
  return BlockchainEngineerChatResponseSchema.parse({
    messageId: createMessageId(),
    agentId,
    content,
    responseSource: 'live_model',
    openQuestions: [],
    riskNotes: ['This is engineering planning guidance, not legal, investment, tax, or formal audit advice.'],
    nextRecommendedAction: toNextRecommendedAction(request),
    skillInvocationTrace,
    createdAt: new Date().toISOString(),
  });
}

function toSafetyBlockedResponse(
  request: BlockchainEngineerChatRequest,
  reason: string,
  skillInvocationTrace?: ContractOpsSkillInvocationTrace,
): BlockchainEngineerChatResponse {
  return BlockchainEngineerChatResponseSchema.parse({
    messageId: createMessageId(),
    agentId,
    content:
      'ZiLiOS cannot process private keys, seed phrases, recovery phrases, API keys, or secret-like values. Please provide only public wallet addresses, public transaction hashes with context, or plain product requirements.',
    responseSource: 'local_fallback',
    openQuestions: ['Can you resend the requirement without any secret material?'],
    riskNotes: [reason, 'Backend never holds private keys. User wallets sign Sepolia deployment and operation transactions.'],
    nextRecommendedAction: toNextRecommendedAction(request),
    skillInvocationTrace,
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
  const activeTabLabel = activeTabLabelFromContext(request.projectContext);
  const skillResolutionInput = {
    activeTabLabel,
    requestedFocus: request.requestedFocus,
    userMessage: request.userMessage,
  };
  const safety = evaluateContractOpsUserTextSafety(request.userMessage);

  if (!safety.ok) {
    const blockedInvocation = resolveContractOpsSkillInvocation({
      ...skillResolutionInput,
      safetyGate: 'blocked',
      redactedReason: safety.reason,
    });
    return toSafetyBlockedResponse(request, safety.reason, blockedInvocation?.trace);
  }

  const skillInvocation = resolveContractOpsSkillInvocation(skillResolutionInput);

  if (!provider || provider.provider === 'mock') {
    return answerWithBlockchainEngineerMock(request);
  }

  try {
    const promptMessages = buildBudgetedChatPromptMessages({
      systemInstruction: systemInstructionForAssistantMode(
        request.assistantMode,
        request.projectContext,
        request.requestedFocus,
        request.userMessage,
      ),
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
        contractOpsSkillTraceId: skillInvocation?.trace.traceId ?? 'none',
        contractOpsTaskType: skillInvocation?.trace.taskType ?? 'none',
        contractOpsSkillIds: skillInvocation?.trace.skillIds.join(',') ?? 'none',
        ...toPromptBudgetMetadata(promptMessages.diagnostics),
      },
    });

    const content = llmResponse.content.trim();

    if (!content || includesUnsafeProviderText(content) || includesUnsafeContractOpsOutput(content)) {
      return answerWithBlockchainEngineerMock(request);
    }

    return toLlmResponse(request, content, skillInvocation?.trace);
  } catch {
    return answerWithBlockchainEngineerMock(request);
  }
}
