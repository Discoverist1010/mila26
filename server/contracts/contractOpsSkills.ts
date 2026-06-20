import { z } from 'zod';

export const ContractOpsSkillIdSchema = z.enum([
  'protocol-advisor',
  'contract-spec-compiler',
  'solidity-builder',
  'solidity-security-reviewer',
  'contract-test-planner',
  'wallet-deployment-reviewer',
  'evidence-indexing-reviewer',
  'pre-ship-qa-reviewer',
]);

export const ContractOpsSkillTaskSchema = z.enum([
  'protocol_advice',
  'contract_spec_compile',
  'solidity_generation_plan',
  'solidity_review',
  'test_plan',
  'deployment_readiness',
  'deployment_preview',
  'evidence_plan',
  'qa_review',
]);

export const ContractOpsSafetyGateSchema = z.enum(['allowed', 'blocked']);

export const ContractOpsSkillInvocationTraceSchema = z.object({
  traceId: z.string().min(1),
  activeTab: z.string().min(1).optional(),
  taskType: ContractOpsSkillTaskSchema,
  skillIds: z.array(ContractOpsSkillIdSchema).min(1),
  skillVersions: z.record(z.string().min(1)),
  sourceSnapshotHashes: z.record(z.string().min(1)),
  schemaNames: z.array(z.string().min(1)),
  safetyGate: ContractOpsSafetyGateSchema,
  redactedReason: z.string().optional(),
});

export const ContractOpsProtocolAdviceSchema = z.object({
  recommendedArchitectureTarget: z.enum(['ERC-20', 'Customised ERC-20', 'ERC-3643', 'ERC-4626', 'ERC-1400-style']),
  selectedProtocolBase: z.enum(['ERC-20', 'Customised ERC-20', 'ERC-3643', 'ERC-4626']).nullable(),
  currentExecutablePrototype: z.literal('Sepolia restricted ERC-20-compatible'),
  confidence: z.enum(['high', 'medium', 'low']),
  tradeoffs: z.array(z.string().min(1)),
  blockers: z.array(z.string().min(1)),
  laterRequirements: z.array(z.string().min(1)),
});

export const ContractOpsSpecDraftSchema = z.object({
  selectedProtocol: z.enum(['ERC-20', 'Customised ERC-20', 'ERC-3643', 'ERC-4626']),
  contractTemplate: z.string().min(1),
  deploymentChain: z.literal('Ethereum Sepolia'),
  userWalletSigns: z.literal(true),
  backendHoldsPrivateKeys: z.literal(false),
  deploymentBlockers: z.array(z.string().min(1)),
  laterLifecycleRequirements: z.array(z.string().min(1)),
  evidenceEvents: z.array(z.string().min(1)),
});

export type ContractOpsSkillId = z.infer<typeof ContractOpsSkillIdSchema>;
export type ContractOpsSkillTask = z.infer<typeof ContractOpsSkillTaskSchema>;
export type ContractOpsSkillInvocationTrace = z.infer<typeof ContractOpsSkillInvocationTraceSchema>;
export type ContractOpsProtocolAdvice = z.infer<typeof ContractOpsProtocolAdviceSchema>;
export type ContractOpsSpecDraft = z.infer<typeof ContractOpsSpecDraftSchema>;
