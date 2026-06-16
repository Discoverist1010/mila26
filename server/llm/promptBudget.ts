import type { Mila26LlmMessage, Mila26LlmPurpose } from './types';

export type Mila26PromptBudgetName = 'blockchain_engineer_chat' | 'engineering_brief_generation' | 'product_setup_extraction';

export type Mila26PromptBudget = {
  name: Mila26PromptBudgetName;
  maxEstimatedInputTokens: number;
};

export type PromptBudgetDiagnostics = {
  budgetName: Mila26PromptBudgetName;
  estimatedInputTokens: number;
  maxEstimatedInputTokens: number;
  historyTurnsIncluded?: number;
  historyTurnsOmitted?: number;
  promptWithinBudget: boolean;
};

export type ChatPromptMessagesInput = {
  systemInstruction: string;
  historyMessages: Mila26LlmMessage[];
  userMessage: string;
  budget?: Mila26PromptBudget;
};

export type ChatPromptMessagesResult =
  | {
      ok: true;
      messages: Mila26LlmMessage[];
      diagnostics: PromptBudgetDiagnostics;
    }
  | {
      ok: false;
      reason: 'required_context_exceeds_budget';
      messages: Mila26LlmMessage[];
      diagnostics: PromptBudgetDiagnostics;
    };

export type PromptBudgetCheckResult =
  | {
      ok: true;
      diagnostics: PromptBudgetDiagnostics;
    }
  | {
      ok: false;
      reason: 'required_context_exceeds_budget';
      diagnostics: PromptBudgetDiagnostics;
    };

export const promptBudgets = {
  blockchainEngineerChat: {
    name: 'blockchain_engineer_chat',
    maxEstimatedInputTokens: 6_000,
  },
  engineeringBriefGeneration: {
    name: 'engineering_brief_generation',
    maxEstimatedInputTokens: 8_000,
  },
  productSetupExtraction: {
    name: 'product_setup_extraction',
    maxEstimatedInputTokens: 3_500,
  },
} as const satisfies Record<string, Mila26PromptBudget>;

export function estimatePromptInputTokens(messages: readonly Mila26LlmMessage[]): number {
  const characterCount = messages.reduce((total, message) => total + message.role.length + message.content.length, 0);
  return Math.ceil(characterCount / 4);
}

function diagnostics(input: {
  budget: Mila26PromptBudget;
  messages: readonly Mila26LlmMessage[];
  historyTurnsIncluded?: number;
  historyTurnsOmitted?: number;
}): PromptBudgetDiagnostics {
  const estimatedInputTokens = estimatePromptInputTokens(input.messages);

  return {
    budgetName: input.budget.name,
    estimatedInputTokens,
    maxEstimatedInputTokens: input.budget.maxEstimatedInputTokens,
    historyTurnsIncluded: input.historyTurnsIncluded,
    historyTurnsOmitted: input.historyTurnsOmitted,
    promptWithinBudget: estimatedInputTokens <= input.budget.maxEstimatedInputTokens,
  };
}

export function toPromptBudgetMetadata(
  diagnostics: PromptBudgetDiagnostics,
): Record<string, string | number | boolean> {
  return {
    promptBudgetName: diagnostics.budgetName,
    estimatedInputTokens: diagnostics.estimatedInputTokens,
    maxEstimatedInputTokens: diagnostics.maxEstimatedInputTokens,
    promptWithinBudget: diagnostics.promptWithinBudget,
    ...(typeof diagnostics.historyTurnsIncluded === 'number'
      ? { historyTurnsIncluded: diagnostics.historyTurnsIncluded }
      : {}),
    ...(typeof diagnostics.historyTurnsOmitted === 'number'
      ? { historyTurnsOmitted: diagnostics.historyTurnsOmitted }
      : {}),
  };
}

export function buildBudgetedChatPromptMessages(input: ChatPromptMessagesInput): ChatPromptMessagesResult {
  const budget = input.budget ?? promptBudgets.blockchainEngineerChat;
  const requiredMessages: Mila26LlmMessage[] = [
    { role: 'system', content: input.systemInstruction },
    { role: 'user', content: input.userMessage },
  ];
  const requiredDiagnostics = diagnostics({
    budget,
    messages: requiredMessages,
    historyTurnsIncluded: 0,
    historyTurnsOmitted: input.historyMessages.length,
  });

  if (!requiredDiagnostics.promptWithinBudget) {
    return {
      ok: false,
      reason: 'required_context_exceeds_budget',
      messages: requiredMessages,
      diagnostics: requiredDiagnostics,
    };
  }

  const includedHistory: Mila26LlmMessage[] = [];
  let omitted = input.historyMessages.length;

  for (let index = input.historyMessages.length - 1; index >= 0; index -= 1) {
    const candidateHistory = [input.historyMessages[index], ...includedHistory];
    const candidateMessages = [
      { role: 'system' as const, content: input.systemInstruction },
      ...candidateHistory,
      { role: 'user' as const, content: input.userMessage },
    ];
    const candidateDiagnostics = diagnostics({
      budget,
      messages: candidateMessages,
      historyTurnsIncluded: candidateHistory.length,
      historyTurnsOmitted: input.historyMessages.length - candidateHistory.length,
    });

    if (!candidateDiagnostics.promptWithinBudget) {
      break;
    }

    includedHistory.unshift(input.historyMessages[index]);
    omitted -= 1;
  }

  const messages = [
    { role: 'system' as const, content: input.systemInstruction },
    ...includedHistory,
    { role: 'user' as const, content: input.userMessage },
  ];

  return {
    ok: true,
    messages,
    diagnostics: diagnostics({
      budget,
      messages,
      historyTurnsIncluded: includedHistory.length,
      historyTurnsOmitted: omitted,
    }),
  };
}

export function checkPromptBudget(input: {
  budget: Mila26PromptBudget;
  messages: Mila26LlmMessage[];
}): PromptBudgetCheckResult {
  const budgetDiagnostics = diagnostics({
    budget: input.budget,
    messages: input.messages,
  });

  if (!budgetDiagnostics.promptWithinBudget) {
    return {
      ok: false,
      reason: 'required_context_exceeds_budget',
      diagnostics: budgetDiagnostics,
    };
  }

  return {
    ok: true,
    diagnostics: budgetDiagnostics,
  };
}

export function promptBudgetForPurpose(purpose: Mila26LlmPurpose): Mila26PromptBudget {
  if (purpose === 'engineering_brief_generation') return promptBudgets.engineeringBriefGeneration;
  return promptBudgets.blockchainEngineerChat;
}
