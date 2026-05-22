import OpenAI from 'openai';
import type {
  Mila26LlmConfig,
  Mila26LlmProvider,
  Mila26LlmReasoningEffort,
  Mila26LlmRequest,
  Mila26LlmResponse,
} from './types';

type OpenAiResponseCreateBody = {
  model: string;
  input: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  instructions?: string;
  max_output_tokens: number;
  temperature?: number;
  reasoning?: {
    effort: Mila26LlmReasoningEffort;
  };
  metadata?: Record<string, string>;
};

type OpenAiResponseCreateOptions = {
  timeout: number;
};

export type Mila26OpenAiResponsesClient = {
  responses: {
    create(body: OpenAiResponseCreateBody, options: OpenAiResponseCreateOptions): Promise<{
      output_text?: string;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
        total_tokens?: number;
      };
    }>;
  };
};

export type CreateMila26OpenAiProviderOptions = {
  config: Mila26LlmConfig;
  apiKey: string;
  client?: Mila26OpenAiResponsesClient;
};

export class Mila26LlmProviderRuntimeError extends Error {
  readonly code = 'OPENAI_PROVIDER_ERROR';

  constructor(message = 'LLM provider request failed.') {
    super(message);
    this.name = 'Mila26LlmProviderRuntimeError';
  }
}

function toSafeMetadata(metadata: Mila26LlmRequest['metadata']): Record<string, string> | undefined {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).slice(0, 16);
  return Object.fromEntries(entries.map(([key, value]) => [key.slice(0, 64), String(value).slice(0, 512)]));
}

function toInstructions(request: Mila26LlmRequest): string | undefined {
  const instructions = request.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n\n');

  return instructions || undefined;
}

function toInput(request: Mila26LlmRequest): OpenAiResponseCreateBody['input'] {
  const input = request.messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: message.content,
    }));

  if (input.length > 0) {
    return input;
  }

  return [{ role: 'user', content: 'Continue from the provided system instructions.' }];
}

function normalizeOpenAiError(): Mila26LlmProviderRuntimeError {
  return new Mila26LlmProviderRuntimeError('OpenAI provider request failed.');
}

function usageFromResponse(response: Awaited<ReturnType<Mila26OpenAiResponsesClient['responses']['create']>>) {
  if (!response.usage) {
    return undefined;
  }

  const inputTokens = response.usage.input_tokens ?? 0;
  const outputTokens = response.usage.output_tokens ?? 0;
  const totalTokens = response.usage.total_tokens ?? inputTokens + outputTokens;

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

function supportsReasoningOptions(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('gpt-5') || normalized.startsWith('o');
}

export function createOpenAiMila26LlmProvider({
  config,
  apiKey,
  client,
}: CreateMila26OpenAiProviderOptions): Mila26LlmProvider {
  const openAiClient =
    client ||
    ({
      responses: new OpenAI({
        apiKey,
        timeout: config.timeoutMs,
        maxRetries: 0,
      }).responses,
    } satisfies Mila26OpenAiResponsesClient);

  return {
    provider: 'openai',
    model: config.model,
    async complete(request): Promise<Mila26LlmResponse> {
      try {
        const response = await openAiClient.responses.create(
          {
            model: config.model,
            input: toInput(request),
            instructions: toInstructions(request),
            max_output_tokens: request.maxOutputTokens ?? config.maxOutputTokens,
            ...(typeof request.temperature === 'number' ? { temperature: request.temperature } : {}),
            ...(request.reasoningEffort && supportsReasoningOptions(config.model)
              ? { reasoning: { effort: request.reasoningEffort } }
              : {}),
            metadata: toSafeMetadata(request.metadata),
          },
          {
            timeout: config.timeoutMs,
          },
        );

        if (!response.output_text?.trim()) {
          throw new Mila26LlmProviderRuntimeError('OpenAI provider returned no text.');
        }

        return {
          content: response.output_text,
          provider: 'openai',
          model: config.model,
          usage: usageFromResponse(response),
          metadata: {
            purpose: request.purpose,
          },
        };
      } catch (error) {
        if (error instanceof Mila26LlmProviderRuntimeError) {
          throw error;
        }

        throw normalizeOpenAiError();
      }
    },
  };
}
