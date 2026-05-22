import { answerWithBlockchainEngineerMock } from './blockchainEngineerMock';
import {
  BlockchainEngineerChatResponseSchema,
  type BlockchainEngineerChatRequest,
  type BlockchainEngineerChatResponse,
} from '../contracts/chat';
import type { Mila26LlmMessage, Mila26LlmProvider } from '../llm/types';

const agentId = 'blockchain-engineer' as const;

const blockchainEngineerSystemInstruction = [
  'You are the MILA26 Blockchain Engineering Bot for an asset manager tokenisation workspace.',
  'Keep guidance practical for an Ethereum testnet-only MVP.',
  'ERC-20 and ERC-721 discussion is allowed, but backend private keys are not.',
  'The user wallet signs deployment; the backend must not hold private keys.',
  'Do not recommend mainnet deployment for the MVP.',
  'Frame legal, compliance, tax, audit, and investment points as assumptions, not advice.',
  'Do not claim deployment, minting, signing, execution, audit, or smart contract completion happened unless the system actually did it.',
].join(' ');

function createMessageId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toLlmMessages(request: BlockchainEngineerChatRequest): Mila26LlmMessage[] {
  const history = request.conversationHistory
    ?.filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-6)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  return [
    {
      role: 'system',
      content: blockchainEngineerSystemInstruction,
    },
    ...(history || []),
    {
      role: 'user',
      content: request.userMessage,
    },
  ];
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
    const llmResponse = await provider.complete({
      purpose: 'blockchain_engineer_chat',
      messages: toLlmMessages(request),
      maxOutputTokens: 500,
      reasoningEffort: 'minimal',
      metadata: {
        route: 'blockchain-engineer-chat',
        projectIdPresent: Boolean(request.projectId),
        runIdPresent: Boolean(request.runId),
        requestedFocus: request.requestedFocus || 'none',
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
