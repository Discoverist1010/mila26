import { describe, expect, it } from 'vitest';
import {
  createRequirementBrief,
  decomposeForMiniBots,
  runCodingBotOrchestration,
  type ImplementationBundle,
} from '../src/agents/agentRuntime';
import { generateEvidencePack } from '../src/agents/evidence';
import { runSecurityReview } from '../src/agents/security';
import { defaultModules, moduleCatalog } from '../src/domain/moduleCatalog';
import {
  AgentResultSchema,
  AgentTaskSchema,
  EvidencePackSchema,
  FundFactsSchema,
  GeneratedArtifactSchema,
  RequirementBriefSchema,
  SecurityReviewSchema,
} from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';
import requirementBriefFixture from './fixtures/contracts/requirement-brief.json';
import agentTaskFixture from './fixtures/contracts/agent-task.json';
import generatedArtifactFixture from './fixtures/contracts/generated-artifact.json';
import agentResultFixture from './fixtures/contracts/agent-result.json';
import securityReviewFixture from './fixtures/contracts/security-review.json';
import evidencePackFixture from './fixtures/contracts/evidence-pack.json';
import implementationBundleFixture from './fixtures/contracts/implementation-bundle.json';

const expectedArtifactKinds = ['api-note', 'frontend-note', 'manifest', 'solidity', 'test-plan'];

function expectEvidencePackSections(markdown: string) {
  expect(markdown).toContain('# MILA26 Evidence Pack');
  expect(markdown).toContain('## Requirement Summary');
  expect(markdown).toContain('## Generated Artifact Inventory');
  expect(markdown).toContain('## Security Review');
  expect(markdown).toContain('## Work Evidence');
  expect(markdown).toContain('## Notes');
}

function parseImplementationBundleLike(bundle: unknown): ImplementationBundle {
  const candidate = bundle as ImplementationBundle;
  return {
    brief: RequirementBriefSchema.parse(candidate.brief),
    tasks: candidate.tasks.map((task) => AgentTaskSchema.parse(task)),
    results: candidate.results.map((result) => AgentResultSchema.parse(result)),
    securityReview: SecurityReviewSchema.parse(candidate.securityReview),
    evidencePack: EvidencePackSchema.parse(candidate.evidencePack),
  };
}

describe('contract golden fixtures', () => {
  it('parses every schema-backed fixture', () => {
    expect(FundFactsSchema.parse(fundFactsFixture).fundName).toBe('MILA Income Fund');
    expect(RequirementBriefSchema.parse(requirementBriefFixture).deploymentTarget).toBe('simulation-only');
    expect(AgentTaskSchema.parse(agentTaskFixture).role).toBe('contract_worker');
    expect(GeneratedArtifactSchema.parse(generatedArtifactFixture).kind).toBe('solidity');
    expect(AgentResultSchema.parse(agentResultFixture).artifacts).toHaveLength(1);
    expect(SecurityReviewSchema.parse(securityReviewFixture).approved).toBe(true);
    expect(EvidencePackSchema.parse(evidencePackFixture).markdown).toContain('MILA26 Evidence Pack');
  });

  it('validates the current ImplementationBundle-like fixture through closest existing schemas', () => {
    const bundle = parseImplementationBundleLike(implementationBundleFixture);

    expect(bundle.brief.id).toBe('brief-golden');
    expect(bundle.tasks).toHaveLength(1);
    expect(bundle.results).toHaveLength(1);
    expect(bundle.results.flatMap((result) => result.artifacts)).toHaveLength(1);
    expect(bundle.securityReview.approved).toBe(true);
    expectEvidencePackSections(bundle.evidencePack.markdown);
  });

  it('captures required FundFacts fields', () => {
    const facts = FundFactsSchema.parse(fundFactsFixture);

    expect(facts.fundName).toBeTruthy();
    expect(facts.tokenSymbol).toMatch(/^[A-Z0-9]+$/);
    expect(facts.jurisdiction).toBeTruthy();
    expect(facts.targetInvestors).toBeTruthy();
  });

  it('captures current RequirementBrief shape and selected modules', () => {
    const brief = RequirementBriefSchema.parse(requirementBriefFixture);

    expect(brief.fundFacts.fundName).toBe(fundFactsFixture.fundName);
    expect(brief.modules.length).toBeGreaterThan(0);
    expect(brief.modules.every((module) => module.enabled)).toBe(true);
    expect(brief.securityConstraints).toContain('Generated artifacts must trace back to an approved RequirementBrief.');
  });

  it('captures current AgentTask and worker role shape', () => {
    const task = AgentTaskSchema.parse(agentTaskFixture);

    expect(task.id).toBe('task-contracts');
    expect(task.role).toBe('contract_worker');
    expect(task.title).toContain('Solidity');
    expect(task.scope).toContain('RequirementBrief');
    expect(task.acceptanceCriteria.length).toBeGreaterThan(0);
  });

  it('captures current GeneratedArtifact shape', () => {
    const artifact = GeneratedArtifactSchema.parse(generatedArtifactFixture);

    expect(artifact.kind).toBe('solidity');
    expect(artifact.filename).toMatch(/^contracts\/.+\.sol$/);
    expect(artifact.content).toContain('contract MILAIncomeFundFundToken');
    expect(artifact.sourceTaskId).toBe('task-contracts');
  });

  it('captures current AgentResult shape', () => {
    const result = AgentResultSchema.parse(agentResultFixture);

    expect(result.role).toBe('contract_worker');
    expect(result.summary).toContain('Solidity');
    expect(result.artifacts.map((artifact) => artifact.kind)).toEqual(['solidity']);
    expect(result.risks).toEqual(expect.any(Array));
    expect(result.tests).toEqual(expect.any(Array));
  });

  it('captures current SecurityReview decision and unsafe-content behavior', () => {
    const review = SecurityReviewSchema.parse(securityReviewFixture);
    expect(review.approved).toBe(true);
    expect(review.findings.length).toBeGreaterThan(0);

    const unsafeReview = runSecurityReview([
      {
        taskId: 'task-api',
        role: 'api_worker',
        summary: 'Unsafe generated output',
        artifacts: [
          {
            id: 'unsafe-artifact',
            kind: 'api-note',
            filename: 'api/example.md',
            content: 'This generated output includes a private key handling path.',
            sourceTaskId: 'task-api',
          },
        ],
        risks: [],
        tests: [],
      },
    ]);

    expect(SecurityReviewSchema.parse(unsafeReview).approved).toBe(false);
    expect(unsafeReview.blockedArtifacts).toContain('unsafe-artifact');
    expect(unsafeReview.findings.some((finding) => finding.includes('private key handling'))).toBe(true);
  });

  it('captures current EvidencePack markdown structure without overfitting prose', () => {
    const evidencePack = EvidencePackSchema.parse(evidencePackFixture);

    expectEvidencePackSections(evidencePack.markdown);
    expect(evidencePack.markdown).toContain('MILA Income Fund');
    expect(evidencePack.markdown).toContain('contracts/MILAIncomeFundFundToken.sol');
    expect(evidencePack.markdown).toContain('Approved: Yes');
  });
});

describe('module catalog contracts', () => {
  it('keeps module IDs unique and convention-compatible', () => {
    const ids = moduleCatalog.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))).toBe(true);
  });

  it('keeps required module catalog fields present', () => {
    for (const module of moduleCatalog) {
      expect(module.id).toBeTruthy();
      expect(module.label).toBeTruthy();
      expect(module.plainEnglish).toBeTruthy();
      expect(module.defaultRationale).toBeTruthy();
    }
  });

  it('keeps default module IDs valid catalog entries', () => {
    const catalogIds = new Set(moduleCatalog.map((module) => module.id));
    const defaults = defaultModules();

    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.every((module) => catalogIds.has(module.id))).toBe(true);
    expect(defaults.every((module) => module.enabled)).toBe(true);
  });
});

describe('runtime contract behavior', () => {
  it('creates a schema-valid RequirementBrief from FundFacts and user goal', () => {
    const facts = FundFactsSchema.parse(fundFactsFixture);
    const brief = RequirementBriefSchema.parse(createRequirementBrief(facts, 'Launch a tokenized income fund.'));

    expect(brief.id).toMatch(/^brief-/);
    expect(brief.fundFacts).toEqual(facts);
    expect(brief.modules.length).toBeGreaterThan(0);
    expect(brief.deploymentTarget).toBe('simulation-only');
  });

  it('decomposes mini-bot work into schema-valid AgentTask items', () => {
    const brief = RequirementBriefSchema.parse(requirementBriefFixture);
    const tasks = decomposeForMiniBots(brief);

    expect(tasks.map((task) => AgentTaskSchema.parse(task).role)).toEqual([
      'contract_worker',
      'api_worker',
      'frontend_worker',
      'test_worker',
    ]);
    expect(tasks.every((task) => task.acceptanceCriteria.length > 0)).toBe(true);
  });

  it('returns the current ImplementationBundle-like structure from orchestration', async () => {
    const brief = RequirementBriefSchema.parse(requirementBriefFixture);
    const bundle = parseImplementationBundleLike(await runCodingBotOrchestration(brief));
    const artifacts = bundle.results.flatMap((result) => result.artifacts);

    expect(bundle.brief.id).toBe(brief.id);
    expect(bundle.tasks).toHaveLength(4);
    expect(bundle.results).toHaveLength(4);
    expect(bundle.securityReview.approved).toBe(true);
    expectEvidencePackSections(bundle.evidencePack.markdown);
    expect([...new Set(artifacts.map((artifact) => artifact.kind))].sort()).toEqual(expectedArtifactKinds);
  });

  it('generates a schema-valid EvidencePack from runtime outputs', async () => {
    const brief = RequirementBriefSchema.parse(requirementBriefFixture);
    const bundle = await runCodingBotOrchestration(brief);
    const evidencePack = EvidencePackSchema.parse(generateEvidencePack(brief, bundle.results, bundle.securityReview));

    expectEvidencePackSections(evidencePack.markdown);
    expect(evidencePack.markdown).toContain(brief.id);
    expect(evidencePack.markdown).toContain('contracts/MILAIncomeFundFundToken.sol');
  });
});
