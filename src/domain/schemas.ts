import { z } from 'zod';

export const moduleIds = [
  'erc20-base',
  'whitelist',
  'blacklist',
  'nav-oracle',
  'investor-registry',
  'cash-registry',
  'dividend',
] as const;

export type ModuleId = (typeof moduleIds)[number];

export const FundFactsSchema = z.object({
  fundName: z.string().min(2).max(80),
  tokenSymbol: z.string().min(2).max(12).regex(/^[A-Z0-9]+$/),
  jurisdiction: z.string().min(2).max(80),
  targetInvestors: z.string().min(2).max(120),
  totalSupply: z.number().positive(),
  initialNav: z.number().nonnegative(),
});

export const ServicingModuleSchema = z.object({
  id: z.enum(moduleIds),
  enabled: z.boolean(),
  rationale: z.string().min(1).max(280),
});

export const RequirementBriefSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  fundFacts: FundFactsSchema,
  modules: z.array(ServicingModuleSchema).min(1),
  complianceAssumptions: z.array(z.string()).default([]),
  deploymentTarget: z.enum(['simulation-only', 'testnet-disabled', 'testnet-enabled']),
  securityConstraints: z.array(z.string()).min(1),
  unresolvedQuestions: z.array(z.string()).default([]),
});

export const AgentTaskSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['contract_worker', 'api_worker', 'frontend_worker', 'test_worker']),
  title: z.string().min(1),
  scope: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
});

export const GeneratedArtifactSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['solidity', 'manifest', 'frontend-note', 'api-note', 'test-plan']),
  filename: z.string().min(1),
  content: z.string().min(1),
  sourceTaskId: z.string().min(1),
});

export const AgentResultSchema = z.object({
  taskId: z.string().min(1),
  role: AgentTaskSchema.shape.role,
  summary: z.string().min(1),
  artifacts: z.array(GeneratedArtifactSchema),
  risks: z.array(z.string()).default([]),
  tests: z.array(z.string()).default([]),
});

export const SecurityReviewSchema = z.object({
  approved: z.boolean(),
  findings: z.array(z.string()),
  blockedArtifacts: z.array(z.string()),
});

export const EvidencePackSchema = z.object({
  id: z.string().min(1),
  generatedAt: z.string().min(1),
  markdown: z.string().min(1),
});

export type FundFacts = z.infer<typeof FundFactsSchema>;
export type ServicingModule = z.infer<typeof ServicingModuleSchema>;
export type RequirementBrief = z.infer<typeof RequirementBriefSchema>;
export type AgentTask = z.infer<typeof AgentTaskSchema>;
export type GeneratedArtifact = z.infer<typeof GeneratedArtifactSchema>;
export type AgentResult = z.infer<typeof AgentResultSchema>;
export type SecurityReview = z.infer<typeof SecurityReviewSchema>;
export type EvidencePack = z.infer<typeof EvidencePackSchema>;
