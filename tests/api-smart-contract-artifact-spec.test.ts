/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { generateEngineeringBriefMock } from '../server/agents/engineeringBriefMock';
import { createApp } from '../server/app';
import { SmartContractArtifactSpecSchema } from '../server/contracts/smartContractArtifactSpec';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import { createDemoProjectClosureLedger } from '../src/domain/projectClosureLedger';
import { toRequirementBriefContract } from '../src/domain/requirementBrief';
import { FundFactsSchema } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createValidPayload() {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');
  const requirementBrief = toRequirementBriefContract(brief, 'approved');
  const engineeringBrief = generateEngineeringBriefMock(requirementBrief);
  const closureLedger = createDemoProjectClosureLedger();

  return {
    requirementBrief,
    engineeringBrief,
    closureReadiness: {
      status: 'ready',
      readinessLabel: 'Ready for artifact specification',
      blockedReasons: [],
      closureLedgerId: closureLedger.id,
      openItemCount: 0,
      blockingOpenItemCount: 0,
      blockedCheckCount: 0,
    },
  };
}

async function postArtifactSpec(payload?: Record<string, unknown>) {
  const app = createApp();
  const response =
    payload === undefined
      ? await app.inject({
          method: 'POST',
          url: '/api/smart-contract/artifact-spec',
        })
      : await app.inject({
          method: 'POST',
          url: '/api/smart-contract/artifact-spec',
          payload,
        });
  await app.close();
  return response;
}

describe('Smart Contract Artifact Spec API', () => {
  it('returns a success envelope and structured spec for valid input', async () => {
    const response = await postArtifactSpec(createValidPayload());
    const body = response.json();
    const spec = SmartContractArtifactSpecSchema.parse(body.data);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(spec.tokenStandardProfile.baseStandardCompatibility).toBe('erc20');
    expect(spec.tokenStandardProfile.mila26RestrictionProfile).toBe('restricted_erc20');
    expect(spec.eventModel.eventToEvidenceMapping.length).toBeGreaterThan(0);
  });

  it('rejects a missing body with a safe error envelope', async () => {
    const response = await postArtifactSpec();
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Smart Contract Artifact Spec request body is required.',
      },
    });
  });

  it('rejects a missing Engineering Brief', async () => {
    const payload = createValidPayload();
    const response = await postArtifactSpec({
      requirementBrief: payload.requirementBrief,
      closureReadiness: payload.closureReadiness,
    });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('MISSING_ENGINEERING_BRIEF');
    expect(body.error.message).toBe('Engineering Brief is required before Smart Contract Artifact Spec generation.');
  });

  it('rejects blocked closure readiness with a safe fail envelope', async () => {
    const payload = createValidPayload();
    const response = await postArtifactSpec({
      ...payload,
      closureReadiness: {
        ...payload.closureReadiness,
        status: 'blocked',
        readinessLabel: 'Closure blocked',
        blockedReasons: ['Security Review is blocked.'],
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('CLOSURE_NOT_READY');
    expect(body.error.details.blockedReasons).toContain('Security Review is blocked.');
  });

  it('rejects mainnet or non-testnet boundaries safely', async () => {
    const payload = createValidPayload();
    const response = await postArtifactSpec({
      ...payload,
      engineeringBrief: {
        ...payload.engineeringBrief,
        deploymentBoundary: {
          ...payload.engineeringBrief.deploymentBoundary,
          network: 'ethereum-mainnet',
        },
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(body)).not.toMatch(/stack trace|OPENAI_API_KEY|test-model/i);
  });

  it('rejects backend private-key custody safely', async () => {
    const payload = createValidPayload();
    const response = await postArtifactSpec({
      ...payload,
      engineeringBrief: {
        ...payload.engineeringBrief,
        deploymentBoundary: {
          ...payload.engineeringBrief.deploymentBoundary,
          backendCustody: 'backend-holds-private-keys',
        },
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/private key value|stack trace|OPENAI_API_KEY|sk-/i);
  });

  it('rejects signing-boundary violations safely', async () => {
    const payload = createValidPayload();
    const response = await postArtifactSpec({
      ...payload,
      engineeringBrief: {
        ...payload.engineeringBrief,
        deploymentBoundary: {
          ...payload.engineeringBrief.deploymentBoundary,
          signing: 'backend-signs',
        },
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(/stack trace|OPENAI_API_KEY|sk-/i);
  });

  it('rejects unknown or deployment-like top-level request fields', async () => {
    const response = await postArtifactSpec({
      ...createValidPayload(),
      privateKey: 'sk-should-not-be-accepted',
      contractAddress: '0x123456',
      txHash: '0xabcdef',
      deployed: true,
    });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(body)).not.toMatch(/sk-should-not-be-accepted|0x123456|0xabcdef|stack trace|OPENAI_API_KEY/i);
  });

  it('does not expose provider, model, API key, secret, or stack text in success responses', async () => {
    const response = await postArtifactSpec(createValidPayload());
    const body = response.json();

    expect(JSON.stringify(body)).not.toMatch(/OPENAI_API_KEY|MILA26_LLM_MODEL|provider|test-model|sk-|stack trace/i);
  });
});
