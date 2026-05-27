/* @vitest-environment node */
import { describe, expect, it, vi } from 'vitest';
import { generateEngineeringBriefMock } from '../server/agents/engineeringBriefMock';
import { createApp, type CreateAppOptions } from '../server/app';
import { EngineeringBriefSchema } from '../server/contracts/engineeringBrief';
import type { Mila26LlmProvider } from '../server/llm/types';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import { toRequirementBriefContract } from '../src/domain/requirementBrief';
import { FundFactsSchema } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createDemoRequirementBriefContract() {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');

  return toRequirementBriefContract(brief, 'approved');
}

async function postEngineeringBrief(payload?: Record<string, unknown>, options?: CreateAppOptions) {
  const app = createApp(options);
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

function createFakeLlmProvider(content: string): Mila26LlmProvider {
  return {
    provider: 'openai',
    model: 'test-model-do-not-leak',
    complete: vi.fn(async () => ({
      content,
      provider: 'openai' as const,
      model: 'test-model-do-not-leak',
      metadata: {
        rawProviderMetadata: 'must-not-leak',
      },
    })),
  };
}

function createThrowingFakeLlmProvider(): Mila26LlmProvider {
  return {
    provider: 'openai',
    model: 'test-model-do-not-leak',
    complete: vi.fn(async () => {
      throw new Error('OPENAI_API_KEY=sk-test-secret stack trace test-model-do-not-leak');
    }),
  };
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

  it('uses an injected non-mock LLM provider and maps safe content into the existing contract', async () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const llmProvider = createFakeLlmProvider(
      JSON.stringify({
        summary: 'LLM refined Engineering Brief summary grounded in the approved Requirement Brief.',
        functionalRequirements: [
          'LLM functional requirement keeps approved investor onboarding reviewable before token operations.',
        ],
        nonFunctionalRequirements: ['LLM non-functional requirement keeps backend-only intelligence isolated.'],
        implementationPlan: ['LLM implementation step prepares schema-safe artifacts before any testnet gate.'],
        testingAndQaPlan: ['LLM QA step validates schema, route behavior, and MVP deployment boundaries.'],
        evidencePackPlan: ['LLM evidence step records source brief ID, assumptions, risks, and QA checks.'],
        risksAndControls: [
          {
            risk: 'LLM risk: generated content could imply execution happened.',
            control: 'LLM control: keep execution, signing, deployment, minting, and uploads explicitly out of scope.',
          },
        ],
        acceptanceCriteria: ['LLM acceptance criterion preserves testnet-only and user-wallet-signs boundaries.'],
      }),
    );

    const response = await postEngineeringBrief(
      { requirementBrief },
      { engineeringBriefLlmProvider: llmProvider },
    );
    const body = response.json();
    const engineeringBrief = EngineeringBriefSchema.parse(body.data);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(engineeringBrief.summary).toContain('LLM refined Engineering Brief summary');
    expect(engineeringBrief.functionalRequirements).toContain(
      'LLM functional requirement keeps approved investor onboarding reviewable before token operations.',
    );
    expect(engineeringBrief.deploymentBoundary.network).toBe('ethereum-testnet-only');
    expect(engineeringBrief.deploymentBoundary.signing).toBe('user-wallet-signs');
    expect(engineeringBrief.deploymentBoundary.backendCustody).toBe('backend-holds-no-private-keys');
    expect(engineeringBrief.metadata).toEqual({
      generator: 'deterministic-track-5b',
      mode: 'llm_assisted',
      llmUsed: true,
      productionAdvice: false,
    });
    expect(JSON.stringify(body)).not.toMatch(/test-model-do-not-leak|rawProviderMetadata|OPENAI_API_KEY|sk-test/i);
    expect(llmProvider.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'engineering_brief_generation',
        maxOutputTokens: 1100,
        reasoningEffort: 'minimal',
      }),
    );
  });

  it('falls back to the deterministic Engineering Brief when the provider throws', async () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const response = await postEngineeringBrief(
      { requirementBrief },
      { engineeringBriefLlmProvider: createThrowingFakeLlmProvider() },
    );
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual(generateEngineeringBriefMock(requirementBrief));
    expect(JSON.stringify(body)).not.toMatch(/OPENAI_API_KEY|sk-test-secret|stack trace|test-model-do-not-leak/i);
  });

  it('falls back to the deterministic Engineering Brief for invalid LLM JSON', async () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const response = await postEngineeringBrief(
      { requirementBrief },
      { engineeringBriefLlmProvider: createFakeLlmProvider('not json') },
    );
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual(generateEngineeringBriefMock(requirementBrief));
  });

  it('falls back to the deterministic Engineering Brief for empty LLM output', async () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const response = await postEngineeringBrief(
      { requirementBrief },
      { engineeringBriefLlmProvider: createFakeLlmProvider('   ') },
    );
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual(generateEngineeringBriefMock(requirementBrief));
  });

  it('falls back safely when provider output includes secret-like or internal text', async () => {
    const requirementBrief = createDemoRequirementBriefContract();
    const response = await postEngineeringBrief(
      { requirementBrief },
      {
        engineeringBriefLlmProvider: createFakeLlmProvider(
          JSON.stringify({
            summary:
              'Unsafe OPENAI_API_KEY=sk-test-secret MILA26_LLM_MODEL=test-model-do-not-leak stack trace raw provider',
          }),
        ),
      },
    );
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toEqual(generateEngineeringBriefMock(requirementBrief));
    expect(JSON.stringify(body)).not.toMatch(
      /OPENAI_API_KEY|MILA26_LLM_MODEL|sk-test-secret|stack trace|raw provider|test-model-do-not-leak/i,
    );
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
