import { describe, expect, it } from 'vitest';
import { createRequirementBrief, decomposeForMiniBots, runCodingBotOrchestration } from '../src/agents/agentRuntime';

const facts = {
  fundName: 'MILA Income Fund',
  tokenSymbol: 'MILA',
  jurisdiction: 'Singapore',
  targetInvestors: 'Accredited investors',
  totalSupply: 1_000_000,
  initialNav: 1_000_000,
};

describe('agent runtime', () => {
  it('creates a valid requirement brief', () => {
    const brief = createRequirementBrief(facts, 'Launch a tokenized income fund.');
    expect(brief.fundFacts.fundName).toBe('MILA Income Fund');
    expect(brief.securityConstraints).toContain('No hardcoded secrets or credentials.');
  });

  it('decomposes coding work into parallel mini-bot tasks', () => {
    const brief = createRequirementBrief(facts, 'Launch a tokenized income fund.');
    const tasks = decomposeForMiniBots(brief);
    expect(tasks.map((task) => task.role)).toEqual([
      'contract_worker',
      'api_worker',
      'frontend_worker',
      'test_worker',
    ]);
  });

  it('generates reviewed artifacts and evidence pack', async () => {
    const brief = createRequirementBrief(facts, 'Launch a tokenized income fund.');
    const bundle = await runCodingBotOrchestration(brief);
    expect(bundle.results).toHaveLength(4);
    expect(bundle.securityReview.approved).toBe(true);
    expect(bundle.evidencePack.markdown).toContain('MILA26 Evidence Pack');
  });
});
