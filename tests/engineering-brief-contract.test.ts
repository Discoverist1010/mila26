/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { generateEngineeringBriefMock } from '../server/agents/engineeringBriefMock';
import {
  EngineeringBriefRequestSchema,
  EngineeringBriefSchema,
} from '../server/contracts/engineeringBrief';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import { toRequirementBriefContract } from '../src/domain/requirementBrief';
import { FundFactsSchema } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createDemoRequirementBriefContract() {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');

  return toRequirementBriefContract(brief, 'approved');
}

describe('Engineering Brief contract and deterministic generator', () => {
  it('accepts the Track 5A Requirement Brief contract as the request payload', () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const request = EngineeringBriefRequestSchema.parse({ requirementBrief });

    expect(request.requirementBrief.projectName).toBe('MILA Income Fund');
    expect(request.requirementBrief.networkBoundary).toBe('ethereum-testnet-only');
  });

  it('generates a schema-valid Engineering Brief with clear PRD sections', () => {
    const engineeringBrief = EngineeringBriefSchema.parse(
      generateEngineeringBriefMock(createDemoRequirementBriefContract()),
    );

    expect(engineeringBrief.summary).toMatch(/not production legal, compliance, investment, or audit advice/i);
    expect(engineeringBrief.functionalRequirements.length).toBeGreaterThan(0);
    expect(engineeringBrief.nonFunctionalRequirements.join(' ')).toMatch(/backend-only/i);
    expect(engineeringBrief.tokenDesign.servicingModules.length).toBeGreaterThan(0);
    expect(engineeringBrief.walletAndAccessModel.assumptions.length).toBeGreaterThan(0);
    expect(engineeringBrief.valuationAndPerformanceUpdates.cadence).toMatch(/NAV|Valuation/i);
    expect(engineeringBrief.risksAndControls.length).toBeGreaterThan(0);
  });

  it('preserves fixed MVP boundaries for future deployment gates', () => {
    const engineeringBrief = generateEngineeringBriefMock(createDemoRequirementBriefContract());

    expect(engineeringBrief.deploymentBoundary).toMatchObject({
      network: 'ethereum-testnet-only',
      noMainnetInMvp: true,
      signing: 'user-wallet-signs',
      backendCustody: 'backend-holds-no-private-keys',
    });
    expect(engineeringBrief.deploymentBoundary.status).toMatch(/Deployment remains disabled/i);
  });

  it('is deterministic for the same Requirement Brief contract input', () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const first = generateEngineeringBriefMock(requirementBrief);
    const second = generateEngineeringBriefMock(requirementBrief);

    expect(second).toEqual(first);
    expect(first.metadata).toEqual({
      generator: 'deterministic-track-5b',
      mode: 'mock',
      llmUsed: false,
      productionAdvice: false,
    });
  });
});
