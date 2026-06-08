import OpenAI from 'openai';
import type {
  Mila26LlmConfig,
  Mila26LlmProvider,
  Mila26LlmReasoningEffort,
  Mila26LlmRequest,
  Mila26LlmResponse,
  Mila26LlmTextFormat,
  Mila26LlmTextVerbosity,
} from './types';

type OpenAiResponseCreateBody = {
  model: string;
  input: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  instructions?: string;
  max_output_tokens: number;
  store: false;
  temperature?: number;
  reasoning?: {
    effort: Mila26LlmReasoningEffort;
  };
  text?: {
    verbosity?: Mila26LlmTextVerbosity;
    format?: Mila26LlmTextFormat;
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
      status?: string;
      error?: unknown;
      incomplete_details?: {
        reason?: string;
      } | null;
      output?: Array<{
        type?: string;
        content?: Array<{
          type?: string;
          text?: string;
          refusal?: string;
        }>;
      }>;
      usage?: {
        input_tokens?: number;
        input_tokens_details?: {
          cached_tokens?: number;
        };
        output_tokens?: number;
        output_tokens_details?: {
          reasoning_tokens?: number;
        };
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
    cachedInputTokens: response.usage.input_tokens_details?.cached_tokens,
    reasoningOutputTokens: response.usage.output_tokens_details?.reasoning_tokens,
  };
}

function supportsReasoningOptions(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return normalized.startsWith('gpt-5') || normalized.startsWith('o');
}

function toTextConfig(request: Mila26LlmRequest): OpenAiResponseCreateBody['text'] {
  const verbosity = request.textVerbosity ?? 'low';

  if (!request.textFormat) {
    return { verbosity };
  }

  return {
    verbosity,
    format: request.textFormat,
  };
}

function responseHasRefusal(
  response: Awaited<ReturnType<Mila26OpenAiResponsesClient['responses']['create']>>,
): boolean {
  return (
    response.output?.some((item) =>
      item.content?.some((contentPart) => contentPart.type === 'refusal' || Boolean(contentPart.refusal)),
    ) ?? false
  );
}

function assertCompletedTextResponse(
  response: Awaited<ReturnType<Mila26OpenAiResponsesClient['responses']['create']>>,
): string {
  if (response.status === 'incomplete') {
    const reason = response.incomplete_details?.reason;
    throw new Mila26LlmProviderRuntimeError(
      reason === 'max_output_tokens'
        ? 'OpenAI provider response was incomplete because max output tokens were reached.'
        : 'OpenAI provider response was incomplete.',
    );
  }

  if (response.status && response.status !== 'completed') {
    throw new Mila26LlmProviderRuntimeError('OpenAI provider response did not complete.');
  }

  if (response.error) {
    throw new Mila26LlmProviderRuntimeError('OpenAI provider returned an error response.');
  }

  if (responseHasRefusal(response)) {
    throw new Mila26LlmProviderRuntimeError('OpenAI provider returned a refusal.');
  }

  const outputText = response.output_text?.trim();

  if (!outputText) {
    throw new Mila26LlmProviderRuntimeError('OpenAI provider returned no text.');
  }

  return outputText;
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
            store: false,
            ...(typeof request.temperature === 'number' ? { temperature: request.temperature } : {}),
            ...(request.reasoningEffort && supportsReasoningOptions(config.model)
              ? { reasoning: { effort: request.reasoningEffort } }
              : {}),
            text: toTextConfig(request),
            metadata: toSafeMetadata(request.metadata),
          },
          {
            timeout: config.timeoutMs,
          },
        );

        const outputText = assertCompletedTextResponse(response);

        return {
          content: outputText,
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
