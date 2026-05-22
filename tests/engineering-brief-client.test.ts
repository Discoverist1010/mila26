import { describe, expect, it, vi } from 'vitest';
import { generateEngineeringBrief } from '../src/api/engineeringBrief';
import type { EngineeringBrief } from '../server/contracts/engineeringBrief';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

const engineeringBrief: EngineeringBrief = {
  id: 'engineering-brief-1',
  generatedAtIso: '2026-05-22T00:00:00.000Z',
  sourceRequirementBriefId: 'brief-1',
  title: 'MILA Income Fund Engineering Brief',
  summary: 'Deterministic Engineering Brief summary.',
  projectContext: {
    projectName: 'MILA Income Fund',
    fundName: 'MILA Income Fund',
    tokenSymbol: 'MILA',
    jurisdiction: 'Singapore',
    targetInvestors: 'Accredited investors',
  },
  functionalRequirements: ['Capture tokenized fund requirements.'],
  nonFunctionalRequirements: ['Keep backend secrets out of frontend code.'],
  tokenDesign: {
    standardPreference: 'ERC-20',
    assumptions: ['Fungible portfolio shares are the MVP default.'],
    servicingModules: ['Fund Token Base'],
  },
  walletAndAccessModel: {
    whitelistRequired: true,
    assumptions: ['Investor wallets are whitelisted before distribution.'],
  },
  valuationAndPerformanceUpdates: {
    cadence: 'daily',
    assumptions: ['Valuations are uploaded off-chain.'],
  },
  complianceAndSecurityAssumptions: ['Engineering output is not legal advice.'],
  deploymentBoundary: {
    network: 'ethereum-testnet-only',
    noMainnetInMvp: true,
    signing: 'user-wallet-signs',
    backendCustody: 'backend-holds-no-private-keys',
    currentTarget: 'simulation-only',
    status: 'Deployment remains disabled for MVP.',
  },
  implementationPlan: ['Generate deterministic implementation artifacts after approval.'],
  testingAndQaPlan: ['Run contract and API tests before demo readiness.'],
  evidencePackPlan: ['Record source Requirement Brief and Engineering Brief IDs.'],
  openQuestions: [],
  risksAndControls: [
    {
      risk: 'Generated brief is mistaken for legal advice.',
      control: 'Mark output as engineering planning only.',
    },
  ],
  acceptanceCriteria: ['Engineering Brief preserves no mainnet deployment in MVP.'],
  metadata: {
    generator: 'deterministic-track-5b',
    mode: 'mock',
    llmUsed: false,
    productionAdvice: false,
  },
};

describe('engineering brief client', () => {
  it('posts the requirement brief payload to the deterministic PRD route', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: engineeringBrief,
      }),
    );
    const request = {
      requirementBrief: {
        id: 'contract-1',
        sourceBriefId: 'brief-1',
      },
    };

    const result = await generateEngineeringBrief(request as never, { baseUrl: 'http://api.test', fetcher });

    expect(fetcher).toHaveBeenCalledWith('http://api.test/api/prd/engineering-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    expect(result).toEqual({
      ok: true,
      data: engineeringBrief,
    });
  });

  it('maps backend error envelopes to safe client errors', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid Engineering Brief generation request.',
          },
        },
        { status: 400 },
      ),
    );

    const result = await generateEngineeringBrief({ requirementBrief: {} } as never, {
      baseUrl: 'http://api.test',
      fetcher,
    });

    expect(result).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid Engineering Brief generation request.',
    });
  });
});
