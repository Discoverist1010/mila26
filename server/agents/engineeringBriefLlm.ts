import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { generateEngineeringBriefMock } from './engineeringBriefMock';
import {
  EngineeringBriefSchema,
  type EngineeringBrief,
  type EngineeringBriefRequirementBrief,
} from '../contracts/engineeringBrief';
import {
  checkPromptBudget,
  promptBudgets,
  toPromptBudgetMetadata,
} from '../llm/promptBudget';
import type { Mila26LlmMessage, Mila26LlmProvider } from '../llm/types';

const llmEngineeringBriefOverlaySchema = z
  .object({
    summary: z.string().trim().min(1).max(1400),
    functionalRequirements: z.array(z.string().trim().min(1).max(420)).min(1).max(8),
    nonFunctionalRequirements: z.array(z.string().trim().min(1).max(420)).min(1).max(8),
    implementationPlan: z.array(z.string().trim().min(1).max(420)).min(1).max(8),
    testingAndQaPlan: z.array(z.string().trim().min(1).max(420)).min(1).max(8),
    evidencePackPlan: z.array(z.string().trim().min(1).max(420)).min(1).max(8),
    openQuestions: z.array(z.string().trim().min(1).max(320)).max(8).nullable(),
    risksAndControls: z
      .array(
        z.object({
          risk: z.string().trim().min(1).max(360),
          control: z.string().trim().min(1).max(420),
        }),
      )
      .min(1)
      .max(8),
    acceptanceCriteria: z.array(z.string().trim().min(1).max(360)).min(1).max(8),
  })
  .strict();

type LlmEngineeringBriefOverlay = z.infer<typeof llmEngineeringBriefOverlaySchema>;

const engineeringBriefOverlayTextFormat = zodTextFormat(
  llmEngineeringBriefOverlaySchema,
  'mila26_engineering_brief_overlay',
  {
    description:
      'Schema-safe overlay fields used to refine the deterministic MILA26 Engineering Brief.',
  },
);

const engineeringBriefSystemInstruction = [
  'You generate compact Engineering Brief content for MILA26, an asset manager tokenisation workspace.',
  'Use only the submitted Requirement Brief facts and keep the output suitable for an Ethereum testnet-only MVP.',
  'Active Product Setup protocol bases are ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing; ERC-721 is out of MVP scope.',
  'The backend must not hold private keys; the user wallet signs deployment.',
  'Do not claim Solidity compilation, deployment, wallet signing, minting, allocation, or valuation upload has happened.',
  'Frame legal, compliance, tax, audit, and investment points as assumptions, not advice.',
  'Use concise strings grounded in the submitted Requirement Brief and leave uncertain items as open questions.',
].join(' ');

export function toEngineeringBriefLlmMessages(requirementBrief: EngineeringBriefRequirementBrief): Mila26LlmMessage[] {
  return [
    {
      role: 'system',
      content: engineeringBriefSystemInstruction,
    },
    {
      role: 'user',
      content: JSON.stringify({
        instruction:
          'Create an Engineering Brief overlay using only the submitted Requirement Brief facts.',
        requirementBrief,
      }),
    },
  ];
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();

  if (!trimmed) {
    throw new Error('EMPTY_LLM_OUTPUT');
  }

  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/u, '');
  return JSON.parse(withoutFence);
}

function includesUnsafeProviderText(content: string): boolean {
  return [
    /OPENAI_API_KEY/i,
    /MILA26_LLM_[A-Z0-9_]+/i,
    /VITE_[A-Z0-9_]*LLM[A-Z0-9_]*/i,
    /\bsk-[A-Za-z0-9_-]{6,}/,
    /stack trace/i,
    /raw provider/i,
  ].some((pattern) => pattern.test(content));
}

function applyOverlay(base: EngineeringBrief, overlay: LlmEngineeringBriefOverlay): EngineeringBrief {
  const candidate = {
    ...base,
    summary: overlay.summary ?? base.summary,
    functionalRequirements: overlay.functionalRequirements ?? base.functionalRequirements,
    nonFunctionalRequirements: overlay.nonFunctionalRequirements ?? base.nonFunctionalRequirements,
    implementationPlan: overlay.implementationPlan ?? base.implementationPlan,
    testingAndQaPlan: overlay.testingAndQaPlan ?? base.testingAndQaPlan,
    evidencePackPlan: overlay.evidencePackPlan ?? base.evidencePackPlan,
    openQuestions: overlay.openQuestions ?? base.openQuestions,
    risksAndControls: overlay.risksAndControls ?? base.risksAndControls,
    acceptanceCriteria: [...overlay.acceptanceCriteria, ...base.acceptanceCriteria],
    metadata: {
      ...base.metadata,
      mode: 'llm_assisted',
      llmUsed: true,
    },
  };

  return EngineeringBriefSchema.parse(candidate);
}

export async function generateEngineeringBriefWithLlm(
  requirementBrief: EngineeringBriefRequirementBrief,
  provider?: Mila26LlmProvider,
): Promise<EngineeringBrief> {
  const base = generateEngineeringBriefMock(requirementBrief);

  if (!provider || provider.provider === 'mock') {
    return base;
  }

  try {
    const messages = toEngineeringBriefLlmMessages(requirementBrief);
    const promptBudget = checkPromptBudget({
      budget: promptBudgets.engineeringBriefGeneration,
      messages,
    });

    if (!promptBudget.ok) {
      return base;
    }

    const llmResponse = await provider.complete({
      purpose: 'engineering_brief_generation',
      messages,
      maxOutputTokens: 1100,
      reasoningEffort: 'minimal',
      textVerbosity: 'low',
      textFormat: engineeringBriefOverlayTextFormat,
      metadata: {
        route: 'prd-engineering-brief',
        sourceRequirementBriefId: requirementBrief.sourceBriefId,
        approvalStatus: requirementBrief.approvalStatus,
        ...toPromptBudgetMetadata(promptBudget.diagnostics),
      },
    });

    if (includesUnsafeProviderText(llmResponse.content)) {
      return base;
    }

    const parsedJson = parseJsonObject(llmResponse.content);
    const overlay = llmEngineeringBriefOverlaySchema.parse(parsedJson);
    const engineeringBrief = applyOverlay(base, overlay);

    if (includesUnsafeProviderText(JSON.stringify(engineeringBrief))) {
      return base;
    }

    return engineeringBrief;
  } catch {
    return base;
  }
}
