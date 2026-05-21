import type { Mila26LlmConfig, Mila26LlmProvider, Mila26LlmRequest, Mila26LlmResponse } from './types';

function estimateTokens(value: string): number {
  const words = value.trim().split(/\s+/).filter(Boolean);
  return Math.max(1, words.length);
}

function summarizeMessages(request: Mila26LlmRequest): string {
  return request.messages
    .map((message) => `${message.role}: ${message.content.trim()}`)
    .join('\n')
    .slice(0, 600);
}

export function createMockMila26LlmProvider(config: Mila26LlmConfig): Mila26LlmProvider {
  return {
    provider: 'mock',
    model: config.model,
    async complete(request): Promise<Mila26LlmResponse> {
      const inputText = summarizeMessages(request);
      const content =
        `MILA26 deterministic mock LLM response for ${request.purpose}. ` +
        'No external provider was called. Backend-only provider wiring is available for Track 6B. ' +
        `Input summary: ${inputText || 'No messages supplied.'}`;

      const inputTokens = request.messages.reduce((sum, message) => sum + estimateTokens(message.content), 0);
      const outputTokens = estimateTokens(content);

      return {
        content,
        provider: 'mock',
        model: config.model,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
        },
        metadata: {
          purpose: request.purpose,
          messageCount: request.messages.length,
          mock: true,
        },
      };
    },
  };
}
