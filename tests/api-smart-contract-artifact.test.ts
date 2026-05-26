/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { generateEngineeringBriefMock } from '../server/agents/engineeringBriefMock';
import { generateSmartContractArtifactSpec } from '../server/agents/smartContractArtifactSpecMock';
import { createApp } from '../server/app';
import { SmartContractArtifactResponseSchema } from '../server/contracts/smartContractArtifact';
import type { SmartContractArtifactSpec } from '../server/contracts/smartContractArtifactSpec';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import { createDemoProjectClosureLedger } from '../src/domain/projectClosureLedger';
import { toRequirementBriefContract } from '../src/domain/requirementBrief';
import { FundFactsSchema } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createValidSpec(): SmartContractArtifactSpec {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');
  const requirementBrief = toRequirementBriefContract(brief, 'approved');
  const engineeringBrief = generateEngineeringBriefMock(requirementBrief);
  const closureLedger = createDemoProjectClosureLedger();
  const specResult = generateSmartContractArtifactSpec({
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
  });

  if (!specResult.ok) {
    throw new Error(specResult.message);
  }

  return specResult.data;
}

async function postArtifact(payload?: Record<string, unknown>) {
  const app = createApp();
  const response =
    payload === undefined
      ? await app.inject({
          method: 'POST',
          url: '/api/smart-contract/artifact',
        })
      : await app.inject({
          method: 'POST',
          url: '/api/smart-contract/artifact',
          payload,
        });
  await app.close();
  return response;
}

describe('Smart Contract Artifact API', () => {
  it('returns artifact package, check result, and evidence-lite for a valid spec', async () => {
    const response = await postArtifact({ smartContractArtifactSpec: createValidSpec() });
    const body = response.json();
    const data = SmartContractArtifactResponseSchema.parse(body.data);

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(data.artifactPackage.status).toBe('generated');
    expect(data.checkResult.status).toBe('passed');
    expect(data.evidenceLite.status).toBe('ready');
  });

  it('rejects missing body and missing spec with safe fail envelopes', async () => {
    const missingBody = await postArtifact();
    const missingSpec = await postArtifact({});

    expect(missingBody.statusCode).toBe(400);
    expect(missingBody.json()).toEqual({
      ok: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Smart Contract Artifact request body is required.',
      },
    });
    expect(missingSpec.statusCode).toBe(400);
    expect(missingSpec.json().error.code).toBe('MISSING_ARTIFACT_SPEC');
  });

  it('rejects blocked specs with a safe fail envelope', async () => {
    const spec = {
      ...createValidSpec(),
      status: 'blocked' as const,
      blockedReasons: ['Closure readiness is blocked.'],
    };
    const response = await postArtifact({ smartContractArtifactSpec: spec });
    const body = response.json();

    expect(response.statusCode).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('SPEC_NOT_READY');
    expect(body.error.details.blockedReasons).toContain('Closure readiness is blocked.');
  });

  it('rejects unknown, deployment-like, and secret-like top-level fields', async () => {
    const spec = createValidSpec();
    const unknownResponse = await postArtifact({ smartContractArtifactSpec: spec, unexpected: true });
    const secretResponse = await postArtifact({ smartContractArtifactSpec: spec, privateKey: 'sk-test-secret' });
    const deploymentResponse = await postArtifact({ smartContractArtifactSpec: spec, contractAddress: '0x123' });

    expect(unknownResponse.statusCode).toBe(400);
    expect(unknownResponse.json().error.code).toBe('VALIDATION_ERROR');
    expect(secretResponse.statusCode).toBe(400);
    expect(secretResponse.json().error.message).toMatch(/deployment or secret fields/i);
    expect(deploymentResponse.statusCode).toBe(400);
    expect(deploymentResponse.json().error.message).toMatch(/deployment or secret fields/i);
  });

  it('rejects unsafe boundary violations safely', async () => {
    const spec = createValidSpec();
    const response = await postArtifact({
      smartContractArtifactSpec: {
        ...spec,
        safetyBoundary: {
          ...spec.safetyBoundary,
          deploymentSigning: 'backend-signs',
        },
      },
    });
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(body)).not.toMatch(/stack trace|OPENAI_API_KEY|MILA26_LLM_MODEL|sk-test-secret/i);
  });

  it('does not leak provider/model/API key/secret/stack text or claim execution', async () => {
    const response = await postArtifact({ smartContractArtifactSpec: createValidSpec() });
    const bodyText = response.body;

    expect(bodyText).not.toMatch(/OPENAI_API_KEY|MILA26_LLM_MODEL|provider|test-model|sk-|stack trace/i);
    expect(bodyText).not.toMatch(/compiled":true|deployed":true|signed":true|transactionHash|contractAddress/i);
    expect(bodyText).toMatch(/not compiled, not deployed, not audited/i);
  });
});
