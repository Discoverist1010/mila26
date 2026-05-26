import { describe, expect, it, vi } from 'vitest';
import { generateSmartContractArtifactSpec } from '../src/api/smartContractArtifactSpec';
import type { SmartContractArtifactSpec } from '../server/contracts/smartContractArtifactSpec';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

const smartContractArtifactSpec: SmartContractArtifactSpec = {
  specId: 'smart-contract-artifact-spec-1',
  projectId: 'brief-1',
  projectName: 'MILA Income Fund',
  status: 'ready',
  generatedFrom: {
    requirementBriefId: 'brief-1',
    engineeringBriefId: 'engineering-brief-1',
    closureLedgerId: 'closure-ledger-1',
  },
  tokenStandardProfile: {
    baseStandardCompatibility: 'erc20',
    mila26RestrictionProfile: 'restricted_erc20',
    recommendedProfile: 'restricted_erc20',
    rationale: 'Fungible fund units need ERC-20 compatibility with MILA26 restrictions.',
    minimumRequiredFunctions: ['totalSupply', 'balanceOf', 'transfer', 'allowance', 'approve', 'transferFrom'],
    minimumRequiredEvents: ['Transfer', 'Approval'],
    openZeppelinAssumptions: {
      useOpenZeppelinContracts: true,
      baseContracts: ['ERC20'],
      extensions: ['AccessControl', 'Pausable'],
      exactPackageVersionDeferredTo: 'track_9b_or_9b_2',
    },
    customEvents: [
      {
        name: 'WalletWhitelisted',
        purpose: 'Record wallet approval.',
        required: true,
        suggestedParameters: ['wallet', 'operator'],
      },
    ],
    compatibilityNotes: ['restricted_erc20 is a MILA26 profile, not a separate ERC standard.'],
  },
  contractModel: {
    projectLabel: 'MILA Income Fund',
    fundName: 'MILA Income Fund',
    tokenName: 'MILA Income Fund',
    tokenSymbol: 'MILA',
    decimalsAssumption: 18,
    supplyModel: 'Issuer controlled.',
    mintingModel: 'Issuer controlled for approved wallets.',
    issuerControlledAllocations: true,
    transferRestrictionsEnabled: true,
    valuationUpdateModel: 'event_only',
    distributionModel: 'event_only',
  },
  accessControl: {
    ownerRole: 'Owner',
    adminRole: 'Admin',
    issuerRole: 'Issuer',
    mintingRole: 'Minter',
    whitelistRole: 'Whitelist manager',
    valuationUpdaterRole: 'Valuation updater',
    distributionRecorderRole: 'Distribution recorder',
    pauserRole: 'Pauser',
    backendPrivateKeyCustody: false,
  },
  walletPolicy: {
    whitelistRequired: true,
    transferPolicy: 'Whitelisted wallets only.',
    investorWalletCustody: 'user_or_investor_wallets_only',
    deploymentSigning: 'user-wallet-signs',
  },
  valuationPolicy: {
    cadence: 'daily',
    updateModel: 'manual_upload',
    eventRequirements: ['ValuationUpdated'],
    evidenceRequirements: ['Record valuation evidence.'],
  },
  distributionPolicy: {
    movementScope: 'event_and_evidence_only',
    eventRequirements: ['DistributionRecorded'],
    evidenceRequirements: ['Record distribution evidence.'],
  },
  eventModel: {
    standardEvents: ['Transfer', 'Approval'],
    customEvents: ['WalletWhitelisted'],
    eventToEvidenceMapping: [
      {
        eventName: 'WalletWhitelisted',
        evidenceUse: 'Evidence pack reference.',
        scpSurface: 'Recent Events',
      },
    ],
    signatureNotes: 'Exact signatures deferred.',
  },
  safetyBoundary: {
    network: 'ethereum-testnet-only',
    mainnetDisabled: true,
    backendCustody: 'backend-holds-no-private-keys',
    deploymentSigning: 'user-wallet-signs',
    deploymentRequiresChecksEvidenceAndGate: true,
    productionLegalComplianceAdvice: false,
    realInvestorOnboardingInMvp: false,
  },
  acceptanceCriteria: ['Future artifact must satisfy the spec.'],
  blockedReasons: [],
  metadata: {
    generatedAt: '2026-05-26T00:00:00.000Z',
    generator: 'deterministic_9a_spec_generator',
    version: '9a.1',
  },
};

describe('smart contract artifact spec client', () => {
  it('posts the payload to the deterministic artifact spec route', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: smartContractArtifactSpec,
      }),
    );
    const request = {
      engineeringBrief: {
        id: 'engineering-brief-1',
      },
      closureReadiness: {
        status: 'ready',
      },
    };

    const result = await generateSmartContractArtifactSpec(request as never, { baseUrl: 'http://api.test', fetcher });

    expect(fetcher).toHaveBeenCalledWith('http://api.test/api/smart-contract/artifact-spec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    expect(result).toEqual({
      ok: true,
      data: smartContractArtifactSpec,
    });
  });

  it('maps backend error envelopes to safe client errors', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          error: {
            code: 'CLOSURE_NOT_READY',
            message: 'Closure readiness must be ready before Smart Contract Artifact Spec generation.',
          },
        },
        { status: 409 },
      ),
    );

    const result = await generateSmartContractArtifactSpec({} as never, {
      baseUrl: 'http://api.test',
      fetcher,
    });

    expect(result).toEqual({
      ok: false,
      code: 'CLOSURE_NOT_READY',
      message: 'Closure readiness must be ready before Smart Contract Artifact Spec generation.',
    });
  });
});
