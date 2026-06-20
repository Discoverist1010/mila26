import { createHash } from 'node:crypto';
import type { RequestedFocus } from '../contracts/chat';
import {
  ContractOpsSkillInvocationTraceSchema,
  type ContractOpsSkillId,
  type ContractOpsSkillInvocationTrace,
  type ContractOpsSkillTask,
} from '../contracts/contractOpsSkills';

type SkillCard = {
  id: ContractOpsSkillId;
  version: string;
  sourceHashes: Record<string, string>;
  promptFragment: string;
};

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

const skillCards: Record<ContractOpsSkillId, SkillCard> = {
  'protocol-advisor': {
    id: 'protocol-advisor',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      standards: '734a0bae863ea339b84f57d4e954847f0d19372ca65f214c03e5662eee7e0c6c',
      protocol: '100b87c78a9ef86ecf8af09574b2ec91fd06e83a12ec868ca1cc0820d34ef824',
      ship: 'e13030c1c17d135b5a904347ef3fbd465823079f7e09099c6708fde6a1b254b6',
    },
    promptFragment:
      'Protocol Advisor: respect user-selected protocol; explain ERC tradeoffs; separate architecture target from Sepolia ERC-20-compatible executable prototype.',
  },
  'contract-spec-compiler': {
    id: 'contract-spec-compiler',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      ship: 'e13030c1c17d135b5a904347ef3fbd465823079f7e09099c6708fde6a1b254b6',
      orchestration: '524ef0810e780eba56d6310c44e6e07346149843878f6dc3c388ae5f2b099a73',
    },
    promptFragment:
      'Spec: derive contract specs from typed Product Setup state; split deploy blockers from later needs; keep inferred unconfirmed.',
  },
  'solidity-builder': {
    id: 'solidity-builder',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      security: 'dd988d2f417226f02bfec777264edd6c85666515976c28e8c11aa4eb73ca7a65',
      testing: '684eab6b127f83f5a7ae4b8d93993b3d07c2c59587b7a49e8fd569007e58411a',
    },
    promptFragment:
      'Solidity Builder: generate Solidity only from confirmed specs; use OpenZeppelin; generated code is draft until reviewed.',
  },
  'solidity-security-reviewer': {
    id: 'solidity-security-reviewer',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      security: 'dd988d2f417226f02bfec777264edd6c85666515976c28e8c11aa4eb73ca7a65',
      audit: 'f7e2a649a07393707826f3e4352b30b418b00cfe690b40a4b1caf0a5eea627a1',
    },
    promptFragment:
      'Security Reviewer: check access control, zero addresses, CEI/reentrancy, decimals, SafeERC20, pause authority, events; do not claim formal audit.',
  },
  'contract-test-planner': {
    id: 'contract-test-planner',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      testing: '684eab6b127f83f5a7ae4b8d93993b3d07c2c59587b7a49e8fd569007e58411a',
    },
    promptFragment:
      'Test Planner: cover custom logic, failure paths, access control, events, and properties; use current Hardhat/viem first.',
  },
  'wallet-deployment-reviewer': {
    id: 'wallet-deployment-reviewer',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      wallets: 'ae147e09a230f8c1bccf06eb444adeaa63957841752cb08449e0c7e4f7fb9f0a',
      qa: 'e8ff85b607b9443afe37b4323426432dc6982e5c88dfff35adb860ab66ddf6f8',
    },
    promptFragment:
      'Deployment: Sepolia only; User wallet signs; backend no private keys; recheck chain/account; no fake evidence.',
  },
  'evidence-indexing-reviewer': {
    id: 'evidence-indexing-reviewer',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      indexing: 'ee8fd23dc448782d317492717e39190fa25f7fcf02b9fd64154e5954f208979e',
    },
    promptFragment:
      'Evidence Reviewer: capture event/provider evidence, redact secrets, version artifacts, and never overwrite prior evidence.',
  },
  'pre-ship-qa-reviewer': {
    id: 'pre-ship-qa-reviewer',
    version: 'mila26-contract-ops-skill-v1',
    sourceHashes: {
      qa: 'e8ff85b607b9443afe37b4323426432dc6982e5c88dfff35adb860ab66ddf6f8',
      'frontend-ux': '8cf0d4e051acd4a8b5c86b62ef440d2afd685be519ad99ceff4410cd83ec0648',
    },
    promptFragment:
      'QA Reviewer: one primary wallet action per state; show wrong-network and pending states clearly; right rail stays passive.',
  },
};

const taskSkills: Record<ContractOpsSkillTask, ContractOpsSkillId[]> = {
  protocol_advice: ['protocol-advisor'],
  contract_spec_compile: ['contract-spec-compiler', 'protocol-advisor'],
  solidity_generation_plan: ['solidity-builder', 'solidity-security-reviewer'],
  solidity_review: ['solidity-security-reviewer', 'contract-test-planner'],
  test_plan: ['contract-test-planner', 'solidity-security-reviewer'],
  deployment_readiness: ['wallet-deployment-reviewer', 'contract-spec-compiler'],
  deployment_preview: ['wallet-deployment-reviewer', 'evidence-indexing-reviewer'],
  evidence_plan: ['evidence-indexing-reviewer'],
  qa_review: ['pre-ship-qa-reviewer', 'wallet-deployment-reviewer'],
};

function inferTask(input: ContractOpsSkillResolutionInput): ContractOpsSkillTask | undefined {
  const message = input.userMessage?.toLowerCase() ?? '';

  if (input.requestedFocus === 'protocol_choice' || /\berc|protocol|3643|4626|1400|7683/.test(message)) {
    return 'protocol_advice';
  }

  if (input.requestedFocus === 'security' || /security|audit|openzeppelin|vulnerab/.test(message)) {
    return 'solidity_review';
  }

  if (input.requestedFocus === 'deployment' || /deploy|sepolia|wallet|admin wallet|sign/.test(message)) {
    return 'deployment_readiness';
  }

  if (/test|qa|check|coverage|fuzz/.test(message)) {
    return 'test_plan';
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

  const cards = taskSkills[taskType].map((skillId) => skillCards[skillId]);
  const trace = ContractOpsSkillInvocationTraceSchema.parse({
    traceId: createTraceId(input, taskType),
    activeTab: input.activeTabLabel,
    taskType,
    skillIds: cards.map((card) => card.id),
    skillVersions: Object.fromEntries(cards.map((card) => [card.id, card.version])),
    sourceSnapshotHashes: Object.assign({}, ...cards.map((card) => card.sourceHashes)),
    schemaNames: ['ContractOpsSkillInvocationTrace', 'ContractOpsProtocolAdvice', 'ContractOpsSpecDraft'],
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
