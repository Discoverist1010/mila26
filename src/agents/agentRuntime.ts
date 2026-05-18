import { defaultModules } from '../domain/moduleCatalog';
import {
  AgentResultSchema,
  AgentTaskSchema,
  RequirementBriefSchema,
  type AgentResult,
  type AgentTask,
  type EvidencePack,
  type FundFacts,
  type RequirementBrief,
  type SecurityReview,
} from '../domain/schemas';
import { generateDeploymentManifest, generateSolidityArtifact } from '../domain/templates';
import { generateEvidencePack } from './evidence';
import { runSecurityReview } from './security';

export type ImplementationBundle = {
  brief: RequirementBrief;
  tasks: AgentTask[];
  results: AgentResult[];
  securityReview: SecurityReview;
  evidencePack: EvidencePack;
};

const defaultSecurityConstraints = [
  'No hardcoded secrets or credentials.',
  'No private keys, seed phrases, or API keys in chat or storage.',
  'All user and model output must be rendered as escaped text.',
  'Generated artifacts must trace back to an approved RequirementBrief.',
  'Real deployment remains disabled unless environment-enabled.',
];

export function createRequirementBrief(facts: FundFacts, userGoal: string): RequirementBrief {
  const brief = {
    id: `brief-${Date.now()}`,
    createdAt: new Date().toISOString(),
    fundFacts: facts,
    modules: defaultModules(),
    complianceAssumptions: [
      'Engineering outputs are audit-preparation materials, not legal compliance certification.',
      'A qualified legal and regulatory advisor must review the product before launch.',
      `User goal captured: ${userGoal.trim() || 'Launch a tokenized fund product.'}`,
    ],
    deploymentTarget: 'simulation-only' as const,
    securityConstraints: defaultSecurityConstraints,
    unresolvedQuestions: [
      'Confirm exact investor eligibility process.',
      'Confirm target chain and custody provider before any live deployment.',
    ],
  };

  return RequirementBriefSchema.parse(brief);
}

export function answerAsBlockchainEngineer(question: string, brief?: RequirementBrief): string {
  const lower = question.toLowerCase();
  const context = brief
    ? ` For ${brief.fundFacts.fundName}, I will keep the answer tied to ${brief.modules.filter((module) => module.enabled).length} selected modules.`
    : '';

  if (/deploy|mainnet|testnet|wallet/.test(lower)) {
    return `Deployment should stay in simulation mode for beta until requirements, audit evidence, and operational controls are reviewed.${context} Real deployment must remain environment-disabled by default.`;
  }
  if (/audit|security|risk/.test(lower)) {
    return `The safe path is to generate traceable artifacts, run a mandatory security review, then prepare an evidence pack for external audit review.${context}`;
  }
  if (/nav|price|valuation/.test(lower)) {
    return `NAV should be treated as an operational input with clear ownership, update timing, and evidence records. The beta can model this without claiming automated valuation compliance.${context}`;
  }
  return `I will translate the business goal into a Requirement Brief, then the Coding Bot can generate artifacts from that approved brief. I will flag security, audit, and deployment implications in plain language.${context}`;
}

export function decomposeForMiniBots(brief: RequirementBrief): AgentTask[] {
  const moduleCount = brief.modules.filter((module) => module.enabled).length;
  const tasks: AgentTask[] = [
    {
      id: 'task-contracts',
      role: 'contract_worker',
      title: 'Generate Solidity beta scaffold',
      scope: `Create audit-preparation Solidity artifacts from the approved RequirementBrief with ${moduleCount} enabled modules.`,
      acceptanceCriteria: ['Uses selected modules only', 'Includes no secrets', 'Marks output as beta/audit-preparation code'],
    },
    {
      id: 'task-api',
      role: 'api_worker',
      title: 'Specify secure API boundary',
      scope: 'Document API constraints for chat, codegen, audit package, and evidence export.',
      acceptanceCriteria: ['Environment-only secrets', 'Request validation', 'Rate and body-size limits'],
    },
    {
      id: 'task-frontend',
      role: 'frontend_worker',
      title: 'Specify workflow UI behavior',
      scope: 'Define the beta user journey and safe rendering behavior.',
      acceptanceCriteria: ['No raw model HTML', 'Requirement approval before codegen', 'Visible agent progress'],
    },
    {
      id: 'task-tests',
      role: 'test_worker',
      title: 'Create beta test evidence plan',
      scope: 'Define the tests needed to prove generated outputs and agent guardrails.',
      acceptanceCriteria: ['Covers requirements', 'Covers security review', 'Covers evidence export'],
    },
  ];
  return tasks.map((task) => AgentTaskSchema.parse(task));
}

async function runMiniBot(task: AgentTask, brief: RequirementBrief): Promise<AgentResult> {
  if (task.role === 'contract_worker') {
    return AgentResultSchema.parse({
      taskId: task.id,
      role: task.role,
      summary: 'Generated a deterministic Solidity beta scaffold from the RequirementBrief.',
      artifacts: [generateSolidityArtifact(brief, task.id)],
      risks: ['Requires external Solidity audit before production deployment.'],
      tests: ['Validate generated artifact schema', 'Inspect transfer guard behavior'],
    });
  }

  if (task.role === 'api_worker') {
    return AgentResultSchema.parse({
      taskId: task.id,
      role: task.role,
      summary: 'Prepared secure API implementation notes for agent orchestration.',
      artifacts: [
        {
          id: 'artifact-api-notes',
          kind: 'api-note',
          filename: 'api/SECURITY_BOUNDARY.md',
          sourceTaskId: task.id,
          content:
            'Use environment-only secrets, origin allowlists, rate limits, body size limits, schema validation, and fail-closed missing configuration.',
        },
      ],
      risks: [],
      tests: ['Missing env keys fail closed', 'Oversized payloads are rejected'],
    });
  }

  if (task.role === 'frontend_worker') {
    return AgentResultSchema.parse({
      taskId: task.id,
      role: task.role,
      summary: 'Prepared frontend workflow notes for the guided CTO-team beta experience.',
      artifacts: [
        {
          id: 'artifact-frontend-notes',
          kind: 'frontend-note',
          filename: 'frontend/WORKFLOW.md',
          sourceTaskId: task.id,
          content:
            'Show Blockchain Engineer Bot guidance, require RequirementBrief approval, display parallel Mini Coding Bot progress, render code as escaped text, and expose evidence export.',
        },
      ],
      risks: [],
      tests: ['Main workflow renders without console errors'],
    });
  }

  return AgentResultSchema.parse({
    taskId: task.id,
    role: task.role,
    summary: 'Prepared test plan and deployment simulation artifact.',
    artifacts: [
      generateDeploymentManifest(brief, task.id),
      {
        id: 'artifact-test-plan',
        kind: 'test-plan',
        filename: 'tests/BETA_TEST_PLAN.md',
        sourceTaskId: task.id,
        content:
          'Test RequirementBrief creation, parallel mini-bot orchestration, security review blocking rules, evidence pack generation, and deploy simulation.',
      },
    ],
    risks: [],
    tests: ['Unit tests', 'E2E guided workflow smoke test', 'Security guardrail tests'],
  });
}

export async function runCodingBotOrchestration(brief: RequirementBrief): Promise<ImplementationBundle> {
  const parsedBrief = RequirementBriefSchema.parse(brief);
  const tasks = decomposeForMiniBots(parsedBrief);
  const results = await Promise.all(tasks.map((task) => runMiniBot(task, parsedBrief)));
  const securityReview = runSecurityReview(results);
  const evidencePack = generateEvidencePack(parsedBrief, results, securityReview);

  return {
    brief: parsedBrief,
    tasks,
    results,
    securityReview,
    evidencePack,
  };
}
