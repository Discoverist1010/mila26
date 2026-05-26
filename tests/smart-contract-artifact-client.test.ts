import { describe, expect, it, vi } from 'vitest';
import { generateSmartContractArtifact } from '../src/api/smartContractArtifact';
import type {
  SmartContractArtifactRequest,
  SmartContractArtifactResponse,
} from '../server/contracts/smartContractArtifact';
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

const artifactResponse: SmartContractArtifactResponse = {
  artifactPackage: {
    artifactId: 'contract-artifact-smart-contract-artifact-spec-1',
    specId: smartContractArtifactSpec.specId,
    projectId: smartContractArtifactSpec.projectId,
    projectName: smartContractArtifactSpec.projectName,
    status: 'generated',
    generatedFrom: {
      specId: smartContractArtifactSpec.specId,
      tokenStandardProfile: {
        baseStandardCompatibility: 'erc20',
        mila26RestrictionProfile: 'restricted_erc20',
        recommendedProfile: 'restricted_erc20',
      },
    },
    sourceModel: {
      language: 'solidity',
      compilerToolchainStatus: 'not_configured',
      openZeppelinPackageStatus: 'not_installed',
      sourceKind: 'deterministic_preview',
      sourceFiles: [
        {
          path: 'contracts/MILARestrictedIncomeFundToken.preview.sol',
          role: 'primary_contract',
          contentPreview: 'Deterministic preview only - not compiled, not deployed, not audited.',
          contentHash: 'a'.repeat(64),
        },
      ],
    },
    implementedSpecSummary: {
      standardFunctions: ['totalSupply'],
      standardEvents: ['Transfer'],
      customEvents: ['WalletWhitelisted'],
      accessControlFeatures: ['Admin'],
      walletRestrictionFeatures: ['Whitelist required'],
      valuationFeatures: ['ValuationUpdated'],
      distributionFeatures: ['DistributionRecorded'],
      pauseFeatures: ['Pause represented'],
    },
    implementationNotes: ['Preview only.'],
    blockedReasons: [],
    metadata: {
      generatedAt: '2026-05-26T00:00:00.000Z',
      generator: 'deterministic_9b_artifact_generator',
      version: '9b.1',
    },
  },
  checkResult: {
    checkId: 'contract-check-smart-contract-artifact-spec-1',
    artifactId: 'contract-artifact-smart-contract-artifact-spec-1',
    specId: smartContractArtifactSpec.specId,
    status: 'passed',
    checkMode: 'spec_consistency',
    summary: 'Deterministic spec-consistency/static-preview checking passed.',
    checks: [
      {
        id: 'check-spec-id',
        label: 'Spec ID carried forward',
        status: 'passed',
        detail: 'Spec is linked.',
      },
    ],
    boundaryChecks: {
      testnetOnly: true,
      mainnetDisabled: true,
      backendPrivateKeyCustodyDisabled: true,
      userWalletSignsFutureDeployment: true,
      deploymentNotExecuted: true,
      compilerNotConfigured: true,
    },
    blockedReasons: [],
    metadata: {
      generatedAt: '2026-05-26T00:00:00.000Z',
      generator: 'deterministic_9b_check_generator',
      version: '9b.1',
    },
  },
  evidenceLite: {
    evidenceId: 'evidence-lite-smart-contract-artifact-spec-1',
    artifactId: 'contract-artifact-smart-contract-artifact-spec-1',
    specId: smartContractArtifactSpec.specId,
    checkId: 'contract-check-smart-contract-artifact-spec-1',
    status: 'ready',
    evidenceItems: [
      {
        id: 'evidence-spec-profile',
        label: 'Token standard profile',
        source: 'smart_contract_artifact_spec',
        detail: 'ERC-20 compatible.',
      },
    ],
    eventEvidenceRefs: [
      {
        eventName: 'WalletWhitelisted',
        evidencePurpose: 'Evidence pack reference.',
        sourceSpecRef: 'smartContractArtifactSpec.eventModel.eventToEvidenceMapping.WalletWhitelisted',
      },
    ],
    safetyEvidenceRefs: [
      {
        boundary: 'network',
        detail: 'Ethereum testnet only.',
      },
    ],
    metadata: {
      generatedAt: '2026-05-26T00:00:00.000Z',
      generator: 'deterministic_9b_evidence_lite_generator',
      version: '9b.1',
    },
  },
};

describe('smart contract artifact client', () => {
  it('posts the payload to the deterministic artifact route', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse({
        ok: true,
        data: artifactResponse,
      }),
    );
    const request: SmartContractArtifactRequest = { smartContractArtifactSpec };

    const result = await generateSmartContractArtifact(request, { baseUrl: 'http://api.test', fetcher });

    expect(fetcher).toHaveBeenCalledWith('http://api.test/api/smart-contract/artifact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    expect(result).toEqual({
      ok: true,
      data: artifactResponse,
    });
  });

  it('maps backend error envelopes to safe client errors', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      createJsonResponse(
        {
          ok: false,
          error: {
            code: 'SPEC_NOT_READY',
            message: 'Smart Contract Artifact Spec must be ready before artifact package generation.',
          },
        },
        { status: 409 },
      ),
    );

    const result = await generateSmartContractArtifact({ smartContractArtifactSpec } as never, {
      baseUrl: 'http://api.test',
      fetcher,
    });

    expect(result).toEqual({
      ok: false,
      code: 'SPEC_NOT_READY',
      message: 'Smart Contract Artifact Spec must be ready before artifact package generation.',
    });
  });
});
