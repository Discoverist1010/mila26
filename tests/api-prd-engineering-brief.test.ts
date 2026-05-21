/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app';
import { EngineeringBriefSchema } from '../server/contracts/engineeringBrief';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import { toRequirementBriefContract } from '../src/domain/requirementBrief';
import { FundFactsSchema } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createDemoRequirementBriefContract() {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');

  return toRequirementBriefContract(brief, 'approved');
}

async function postEngineeringBrief(payload?: Record<string, unknown>) {
  const app = createApp();
  const response =
    payload === undefined
      ? await app.inject({
          method: 'POST',
          url: '/api/prd/engineering-brief',
        })
      : await app.inject({
          method: 'POST',
          url: '/api/prd/engineering-brief',
          payload,
        });
  await app.close();
  return response;
}

describe('PRD Engineering Brief API', () => {
  it('returns a success envelope and structured Engineering Brief for a valid requirement brief', async () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const response = await postEngineeringBrief({ requirementBrief });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(EngineeringBriefSchema.parse(body.data).sourceRequirementBriefId).toBe(requirementBrief.sourceBriefId);
    expect(body.data.title).toContain(requirementBrief.projectName);
    expect(body.data.functionalRequirements.length).toBeGreaterThan(0);
    expect(body.data.implementationPlan.length).toBeGreaterThan(0);
    expect(body.data.testingAndQaPlan.length).toBeGreaterThan(0);
    expect(body.data.evidencePackPlan.length).toBeGreaterThan(0);
  });

  it('preserves MVP deployment and custody boundaries in the response', async () => {
    const response = await postEngineeringBrief({ requirementBrief: createDemoRequirementBriefContract() });
    const body = response.json();

    expect(body.data.deploymentBoundary.network).toBe('ethereum-testnet-only');
    expect(body.data.deploymentBoundary.signing).toBe('user-wallet-signs');
    expect(body.data.deploymentBoundary.backendCustody).toBe('backend-holds-no-private-keys');
    expect(body.data.deploymentBoundary.noMainnetInMvp).toBe(true);
    expect(body.data.acceptanceCriteria.join(' ')).toMatch(/no mainnet deployment in MVP/i);
  });

  it('rejects a missing body with a safe error envelope', async () => {
    const response = await postEngineeringBrief();
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Engineering Brief request body is required.',
      },
    });
  });

  it('rejects a missing requirementBrief with a safe error envelope', async () => {
    const response = await postEngineeringBrief({});
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.fields).toContainEqual({
      path: 'requirementBrief',
      message: 'Required',
    });
  });

  it('rejects a blank project name', async () => {
    const requirementBrief = {
      ...createDemoRequirementBriefContract(),
      projectName: ' ',
    };
    const response = await postEngineeringBrief({ requirementBrief });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.fields).toContainEqual({
      path: 'requirementBrief.projectName',
      message: 'String must contain at least 2 character(s)',
    });
  });

  it('rejects unsupported mainnet-like network requests', async () => {
    const requirementBrief = {
      ...createDemoRequirementBriefContract(),
      networkBoundary: 'ethereum-mainnet',
    };
    const response = await postEngineeringBrief({ requirementBrief });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.fields).toContainEqual({
      path: 'requirementBrief.networkBoundary',
      message: 'Invalid literal value, expected "ethereum-testnet-only"',
    });
  });

  it('rejects backend private-key custody requests', async () => {
    const requirementBrief = {
      ...createDemoRequirementBriefContract(),
      backendCustodyBoundary: 'backend-holds-private-keys',
    };
    const response = await postEngineeringBrief({ requirementBrief });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.fields).toContainEqual({
      path: 'requirementBrief.backendCustodyBoundary',
      message: 'Invalid literal value, expected "backend-holds-no-private-keys"',
    });
  });
});
