export type Mila26LlmProviderName = 'mock' | 'openai';
export type Mila26KnownLlmProviderName = Mila26LlmProviderName;

export type Mila26LlmPurpose = 'blockchain_engineer_chat' | 'engineering_brief_generation';

export type Mila26LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type Mila26LlmUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type Mila26LlmConfig = {
  provider: Mila26LlmProviderName;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
};

export type Mila26LlmRequest = {
  purpose: Mila26LlmPurpose;
  messages: Mila26LlmMessage[];
  temperature?: number;
  maxOutputTokens?: number;
  metadata?: Record<string, string | number | boolean>;
};

export type Mila26LlmResponse = {
  content: string;
  provider: Mila26LlmProviderName;
  model: string;
  usage?: Mila26LlmUsage;
  metadata?: Record<string, string | number | boolean>;
};

export type Mila26LlmProvider = {
  provider: Mila26LlmProviderName;
  model: string;
  complete(request: Mila26LlmRequest): Promise<Mila26LlmResponse>;
};

export type Mila26LlmConfigErrorCode =
  | 'UNSUPPORTED_PROVIDER'
  | 'MISSING_OPENAI_API_KEY'
  | 'MISSING_MILA26_LLM_MODEL';

export type Mila26LlmConfigError = {
  code: Mila26LlmConfigErrorCode;
  message: string;
  details?: Record<string, string | number | boolean>;
};

export type Mila26LlmConfigResult =
  | {
      ok: true;
      config: Mila26LlmConfig;
    }
  | {
      ok: false;
      error: Mila26LlmConfigError;
    };

export type Mila26LlmProviderResult =
  | {
      ok: true;
      provider: Mila26LlmProvider;
    }
  | {
      ok: false;
      error: Mila26LlmConfigError;
    };
