import { createHash } from 'node:crypto';
import type { RequestedFocus } from '../contracts/chat';
import {
  ContractOpsSkillInvocationTraceSchema,
  type ContractOpsSkillInvocationTrace,
  type ContractOpsSkillTask,
} from '../contracts/contractOpsSkills';
import { contractOpsSkillCards, contractOpsTaskSkills } from './catalog';

export type ContractOpsSkillInvocation = {
  trace: ContractOpsSkillInvocationTrace;
  promptInstruction: string;
};

export type ContractOpsSkillResolutionInput = {
  activeTabLabel?: string;
  requestedFocus?: RequestedFocus;
  userMessage?: string;
  safetyGate?: 'allowed' | 'blocked';
  redactedReason?: string;
};

function inferTask(input: ContractOpsSkillResolutionInput): ContractOpsSkillTask | undefined {
  const message = input.userMessage?.toLowerCase() ?? '';

  if (input.requestedFocus === 'security' || /security|audit|openzeppelin|vulnerab/.test(message)) {
    return 'solidity_review';
  }

  if (/\b(?:generate|write|build|modify|customi[sz]e|implement)\b.{0,80}\b(?:solidity|contract|erc)\b/.test(message)) {
    return 'solidity_generation_plan';
  }

  if (/test|qa|check|coverage|fuzz/.test(message)) {
    return 'test_plan';
  }

  if (/preview|constructor|abi|bytecode/.test(message)) {
    return 'deployment_preview';
  }

  if (/evidence|event|index|vault|artifact|hash/.test(message)) {
    return 'evidence_plan';
  }

  if (input.requestedFocus === 'deployment' || /deploy|sepolia|wallet|admin wallet|sign|readiness|blocker/.test(message)) {
    return 'deployment_readiness';
  }

  if (input.requestedFocus === 'protocol_choice' || /\berc|protocol|3643|4626|1400|7683/.test(message)) {
    return 'protocol_advice';
  }

  if (input.activeTabLabel === 'Contract Ops') {
    return 'contract_spec_compile';
  }

  return undefined;
}

function createTraceId(input: ContractOpsSkillResolutionInput, taskType: ContractOpsSkillTask): string {
  const basis = `${taskType}:${input.activeTabLabel ?? 'none'}:${input.requestedFocus ?? 'none'}:${input.userMessage ?? ''}`;
  return `contract-ops-skill-${createHash('sha256').update(basis).digest('hex').slice(0, 12)}`;
}

export function resolveContractOpsSkillInvocation(
  input: ContractOpsSkillResolutionInput,
): ContractOpsSkillInvocation | undefined {
  const taskType = inferTask(input);
  if (!taskType) return undefined;

  const cards = contractOpsTaskSkills[taskType].map((skillId) => contractOpsSkillCards[skillId]);
  const trace = ContractOpsSkillInvocationTraceSchema.parse({
    traceId: createTraceId(input, taskType),
    activeTab: input.activeTabLabel,
    taskType,
    skillIds: cards.map((card) => card.id),
    skillVersions: Object.fromEntries(cards.map((card) => [card.id, card.version])),
    sourceSnapshotHashes: Object.assign({}, ...cards.map((card) => card.sourceHashes)),
    schemaNames: Array.from(
      new Set(['ContractOpsSkillInvocationTrace', ...cards.flatMap((card) => card.outputSchemas)]),
    ),
    safetyGate: input.safetyGate ?? 'allowed',
    redactedReason: input.redactedReason,
  });

  return {
    trace,
    promptInstruction: [
      'Contract Ops skills:',
      ...cards.map((card) => `- ${card.promptFragment}`),
      'Do not quote EthSkills snapshots.',
    ].join('\n'),
  };
}
