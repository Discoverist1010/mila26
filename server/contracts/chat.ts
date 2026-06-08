import { z } from 'zod';

export const ChatMessageSchema = z.object({
  messageId: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  createdAt: z.string().min(1),
  agentId: z.string().optional(),
  projectId: z.string().optional(),
  runId: z.string().optional(),
});

export const RequestedFocusSchema = z.enum([
  'protocol_choice',
  'whitelist',
  'valuation_update',
  'deployment',
  'security',
]);

export const AssistantModeSchema = z.enum(['engineering', 'advisor']);

export const BlockchainEngineerChatRequestSchema = z.object({
  projectId: z.string().min(1).optional(),
  runId: z.string().min(1).optional(),
  userMessage: z.string().trim().min(1, 'userMessage is required.'),
  conversationHistory: z.array(ChatMessageSchema).optional(),
  projectContext: z.record(z.unknown()).optional(),
  assistantMode: AssistantModeSchema.default('engineering'),
  requestedFocus: RequestedFocusSchema.optional(),
});

export const SuggestedRequirementUpdateSchema = z.object({
  field: z.string().min(1),
  proposedValue: z.unknown(),
  rationale: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const BlockchainEngineerChatResponseSchema = z.object({
  messageId: z.string().min(1),
  agentId: z.literal('blockchain-engineer'),
  content: z.string().min(1),
  suggestedRequirementUpdates: z.array(SuggestedRequirementUpdateSchema).optional(),
  openQuestions: z.array(z.string()).optional(),
  protocolComparison: z
    .object({
      erc20: z.string().min(1),
      erc4626: z.string().min(1),
      erc3643: z.string().min(1),
      rebasingErc20: z.string().min(1),
      erc721OutOfScope: z.string().min(1).optional(),
      recommendation: z.string().min(1),
    })
    .optional(),
  riskNotes: z.array(z.string()).optional(),
  nextRecommendedAction: z.string().optional(),
  createdAt: z.string().min(1),
});

export type BlockchainEngineerChatRequestInput = z.input<typeof BlockchainEngineerChatRequestSchema>;
export type BlockchainEngineerChatRequest = z.output<typeof BlockchainEngineerChatRequestSchema>;
export type BlockchainEngineerChatResponse = z.infer<typeof BlockchainEngineerChatResponseSchema>;
export type AssistantMode = z.infer<typeof AssistantModeSchema>;
