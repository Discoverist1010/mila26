import type { ContractOpsSkillId, ContractOpsSkillTask } from '../contracts/contractOpsSkills';

export type ContractOpsSkillCard = {
  id: ContractOpsSkillId;
  version: string;
  docPath: string;
  taskTypes: ContractOpsSkillTask[];
  sourceHashes: Record<string, string>;
  promptFragment: string;
  requiredSafetyGates: string[];
  outputSchemas: string[];
};

export const CONTRACT_OPS_SKILL_VERSION = 'mila26-contract-ops-skill-v2';

export const contractOpsSkillCards: Record<ContractOpsSkillId, ContractOpsSkillCard> = {
  'protocol-advisor': {
    id: 'protocol-advisor',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/protocol-advisor.md',
    taskTypes: ['protocol_advice', 'contract_spec_compile'],
    sourceHashes: {
      standards: '734a0bae863ea339b84f57d4e954847f0d19372ca65f214c03e5662eee7e0c6c',
      protocol: '100b87c78a9ef86ecf8af09574b2ec91fd06e83a12ec868ca1cc0820d34ef824',
      ship: 'e13030c1c17d135b5a904347ef3fbd465823079f7e09099c6708fde6a1b254b6',
    },
    promptFragment:
      'Protocol Advisor: respect confirmed user protocol choice; explain ERC tradeoffs; separate architecture target from Sepolia ERC-20-compatible executable prototype.',
    requiredSafetyGates: ['no-protocol-forcing', 'no-unsupported-deploy-claim', 'no-legal-compliance-claim'],
    outputSchemas: ['ContractOpsProtocolAdvice'],
  },
  'contract-spec-compiler': {
    id: 'contract-spec-compiler',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/contract-spec-compiler.md',
    taskTypes: ['contract_spec_compile', 'deployment_readiness'],
    sourceHashes: {
      ship: 'e13030c1c17d135b5a904347ef3fbd465823079f7e09099c6708fde6a1b254b6',
      orchestration: '524ef0810e780eba56d6310c44e6e07346149843878f6dc3c388ae5f2b099a73',
    },
    promptFragment:
      'Spec Compiler: derive contract specs from typed Product Setup state; split deployment blockers from later needs; keep inferred fields unconfirmed.',
    requiredSafetyGates: ['typed-state-required', 'no-chat-only-specs', 'no-later-tab-blocker-inflation'],
    outputSchemas: ['ContractOpsSpecDraft'],
  },
  'solidity-builder': {
    id: 'solidity-builder',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/solidity-builder.md',
    taskTypes: ['solidity_generation_plan'],
    sourceHashes: {
      security: 'dd988d2f417226f02bfec777264edd6c85666515976c28e8c11aa4eb73ca7a65',
      testing: '684eab6b127f83f5a7ae4b8d93993b3d07c2c59587b7a49e8fd569007e58411a',
    },
    promptFragment:
      'Solidity Builder: plan or draft Solidity only from confirmed specs; use OpenZeppelin primitives; generated code remains draft until reviewed.',
    requiredSafetyGates: ['confirmed-spec-only', 'no-runtime-deploy', 'openzeppelin-first'],
    outputSchemas: ['ContractOpsSpecDraft'],
  },
  'solidity-security-reviewer': {
    id: 'solidity-security-reviewer',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/solidity-security-reviewer.md',
    taskTypes: ['solidity_review', 'solidity_generation_plan', 'test_plan'],
    sourceHashes: {
      security: 'dd988d2f417226f02bfec777264edd6c85666515976c28e8c11aa4eb73ca7a65',
      audit: 'f7e2a649a07393707826f3e4352b30b418b00cfe690b40a4b1caf0a5eea627a1',
    },
    promptFragment:
      'Security Reviewer: check access control, zero addresses, CEI/reentrancy, decimals, SafeERC20, pause authority, and evidence events; do not claim formal audit.',
    requiredSafetyGates: ['no-audit-claim', 'no-critical-high-approval', 'no-production-readiness-claim'],
    outputSchemas: ['SecurityReviewFinding'],
  },
  'contract-test-planner': {
    id: 'contract-test-planner',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/contract-test-planner.md',
    taskTypes: ['test_plan', 'solidity_review'],
    sourceHashes: {
      testing: '684eab6b127f83f5a7ae4b8d93993b3d07c2c59587b7a49e8fd569007e58411a',
    },
    promptFragment:
      'Test Planner: cover custom logic, failure paths, access control, events, and invariants; use current Hardhat/viem first.',
    requiredSafetyGates: ['failure-path-required', 'no-foundry-dependency-without-approval'],
    outputSchemas: ['ContractOpsTestPlan'],
  },
  'wallet-deployment-reviewer': {
    id: 'wallet-deployment-reviewer',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/wallet-deployment-reviewer.md',
    taskTypes: ['deployment_readiness', 'deployment_preview', 'qa_review'],
    sourceHashes: {
      wallets: 'ae147e09a230f8c1bccf06eb444adeaa63957841752cb08449e0c7e4f7fb9f0a',
      qa: 'e8ff85b607b9443afe37b4323426432dc6982e5c88dfff35adb860ab66ddf6f8',
    },
    promptFragment:
      'Deployment Reviewer: Sepolia only; user wallet signs; backend holds no private keys; recheck chain/account; no fake evidence.',
    requiredSafetyGates: ['sepolia-only', 'user-wallet-signs', 'no-private-keys', 'provider-evidence-only'],
    outputSchemas: ['ContractOpsDeploymentReadiness'],
  },
  'evidence-indexing-reviewer': {
    id: 'evidence-indexing-reviewer',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/evidence-indexing-reviewer.md',
    taskTypes: ['evidence_plan', 'deployment_preview'],
    sourceHashes: {
      indexing: 'ee8fd23dc448782d317492717e39190fa25f7fcf02b9fd64154e5954f208979e',
    },
    promptFragment:
      'Evidence Reviewer: capture event/provider evidence, redact secrets, version artifacts, and never overwrite prior evidence.',
    requiredSafetyGates: ['no-local-durable-claim', 'no-overwrite', 'redact-sensitive-material'],
    outputSchemas: ['ContractOpsEvidencePlan'],
  },
  'pre-ship-qa-reviewer': {
    id: 'pre-ship-qa-reviewer',
    version: CONTRACT_OPS_SKILL_VERSION,
    docPath: 'docs/skills/mila26-contract-ops/pre-ship-qa-reviewer.md',
    taskTypes: ['qa_review'],
    sourceHashes: {
      qa: 'e8ff85b607b9443afe37b4323426432dc6982e5c88dfff35adb860ab66ddf6f8',
      'frontend-ux': '8cf0d4e051acd4a8b5c86b62ef440d2afd685be519ad99ceff4410cd83ec0648',
    },
    promptFragment:
      'QA Reviewer: one primary wallet action per state; show wrong-network and pending states clearly; right rail stays passive.',
    requiredSafetyGates: ['right-rail-passive', 'no-duplicate-submit', 'plain-user-language'],
    outputSchemas: ['ContractOpsQaReview'],
  },
};

export const contractOpsTaskSkills: Record<ContractOpsSkillTask, ContractOpsSkillId[]> = {
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
