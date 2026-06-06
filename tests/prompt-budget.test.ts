/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  buildBudgetedChatPromptMessages,
  checkPromptBudget,
  estimatePromptInputTokens,
  promptBudgets,
  toPromptBudgetMetadata,
} from '../server/llm/promptBudget';

describe('LLM prompt budget helpers', () => {
  it('estimates prompt input size deterministically', () => {
    expect(
      estimatePromptInputTokens([
        { role: 'system', content: 'abcd' },
        { role: 'user', content: 'abcdefgh' },
      ]),
    ).toBe(6);
  });

  it('keeps required chat context and omits oldest optional history first', () => {
    const result = buildBudgetedChatPromptMessages({
      systemInstruction: 'system instruction',
      userMessage: 'current user message',
      budget: {
        name: 'blockchain_engineer_chat',
        maxEstimatedInputTokens: 30,
      },
      historyMessages: [
        { role: 'user', content: 'old history that should not fit into the budget' },
        { role: 'assistant', content: 'recent answer' },
      ],
    });

    expect(result.ok).toBe(true);
    expect(result.messages.at(-1)).toEqual({ role: 'user', content: 'current user message' });
    expect(result.messages).toContainEqual({ role: 'assistant', content: 'recent answer' });
    expect(result.messages).not.toContainEqual({ role: 'user', content: 'old history that should not fit into the budget' });
    expect(result.diagnostics.historyTurnsIncluded).toBe(1);
    expect(result.diagnostics.historyTurnsOmitted).toBe(1);
  });

  it('does not truncate a current user message that exceeds budget', () => {
    const longUserMessage = 'x'.repeat(2_000);
    const result = buildBudgetedChatPromptMessages({
      systemInstruction: 'system instruction',
      userMessage: longUserMessage,
      budget: {
        name: 'blockchain_engineer_chat',
        maxEstimatedInputTokens: 30,
      },
      historyMessages: [{ role: 'assistant', content: 'recent answer' }],
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected oversized required chat context to exceed prompt budget.');
    expect(result.reason).toBe('required_context_exceeds_budget');
    expect(result.messages.at(-1)).toEqual({ role: 'user', content: longUserMessage });
    expect(result.diagnostics.historyTurnsIncluded).toBe(0);
  });

  it('rejects oversized all-or-nothing prompts without mutating messages', () => {
    const messages = [
      { role: 'system' as const, content: 'system instruction' },
      { role: 'user' as const, content: 'x'.repeat(40_000) },
    ];
    const result = checkPromptBudget({
      budget: promptBudgets.engineeringBriefGeneration,
      messages,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected oversized required prompt context to exceed prompt budget.');
    expect(result.reason).toBe('required_context_exceeds_budget');
    expect(messages[1]?.content).toHaveLength(40_000);
  });

  it('exports safe metadata without prompt content', () => {
    const metadata = toPromptBudgetMetadata({
      budgetName: 'blockchain_engineer_chat',
      estimatedInputTokens: 42,
      maxEstimatedInputTokens: 6_000,
      historyTurnsIncluded: 2,
      historyTurnsOmitted: 1,
      promptWithinBudget: true,
    });

    expect(metadata).toEqual({
      promptBudgetName: 'blockchain_engineer_chat',
      estimatedInputTokens: 42,
      maxEstimatedInputTokens: 6000,
      promptWithinBudget: true,
      historyTurnsIncluded: 2,
      historyTurnsOmitted: 1,
    });
    expect(JSON.stringify(metadata)).not.toContain('system instruction');
  });
});
