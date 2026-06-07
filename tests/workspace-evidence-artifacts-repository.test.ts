/* @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest';
import type { SmartContractArtifactPackage } from '../server/contracts/smartContractArtifact';
import type { SmartContractArtifactSpec } from '../server/contracts/smartContractArtifactSpec';
import {
  createInMemoryWorkspacePersistenceRepository,
  WorkspacePersistenceValidationError,
  type WorkspacePersistenceRepository,
} from '../server/persistence/workspacePersistenceRepository';
import { createInitialMila26LifecycleState, createInvestorRegistryEntry } from '../src/domain/lifecycleState';

const transactionHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const contractAddress = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const investorWallet = '0x1111111111111111111111111111111111111111';

let repositories: WorkspacePersistenceRepository[] = [];

function createRepository() {
  const repository = createInMemoryWorkspacePersistenceRepository();
  repositories.push(repository);
  return repository;
}

function saveBaseWorkspace(repository: WorkspacePersistenceRepository) {
  return repository.saveWorkspaceSnapshot({
    projectId: 'alpha-income-fund',
    projectName: 'Alpha Income Fund I',
    source: 'user_action',
    lifecycleState: {
      ...createInitialMila26LifecycleState(),
      investorRegistryEntries: [
        createInvestorRegistryEntry({
          id: 'investor-wallet-1',
          walletAddress: investorWallet,
        }),
      ],
    },
  });
}

function createSmartContractSpec(): SmartContractArtifactSpec {
  return {
    specId: 'spec-1',
    projectId: 'alpha-income-fund',
    projectName: 'Alpha Income Fund I',
    status: 'ready',
    generatedFrom: {
      engineeringBriefId: 'engineering-brief-1',
    },
    tokenStandardProfile: {
      baseStandardCompatibility: 'erc20',
      mila26RestrictionProfile: 'restricted_erc20',
      recommendedProfile: 'restricted_erc20',
      rationale: 'Fungible fund units are the current alpha path.',
      minimumRequiredFunctions: ['transfer(address,uint256)'],
      minimumRequiredEvents: ['Transfer(address,address,uint256)'],
      openZeppelinAssumptions: {
        useOpenZeppelinContracts: true,
        baseContracts: ['ERC20'],
        extensions: ['AccessControl'],
        exactPackageVersionDeferredTo: 'track_9b_or_9b_2',
      },
      customEvents: [
        {
          name: 'ValuationUpdated',
          purpose: 'Record valuation evidence.',
          required: true,
          suggestedParameters: ['uint256 valuation', 'string valuationReference'],
        },
      ],
      compatibilityNotes: ['Restricted ERC-20-compatible profile.'],
    },
    contractModel: {
      projectLabel: 'Alpha Income Fund I',
      fundName: 'Alpha Income Fund I',
      tokenName: 'Alpha Income Fund I',
      tokenSymbol: 'AIF',
      decimalsAssumption: 18,
      supplyModel: 'Issuer-controlled minting.',
      mintingModel: 'Mint allocations to whitelisted wallets.',
      issuerControlledAllocations: true,
      transferRestrictionsEnabled: true,
      valuationUpdateModel: 'event_only',
      distributionModel: 'event_only',
    },
    accessControl: {
      ownerRole: 'DEFAULT_ADMIN_ROLE',
      adminRole: 'ADMIN_ROLE',
      issuerRole: 'ISSUER_ROLE',
      mintingRole: 'MINTER_ROLE',
      whitelistRole: 'WHITELIST_ROLE',
      valuationUpdaterRole: 'VALUATION_UPDATER_ROLE',
      distributionRecorderRole: 'DISTRIBUTION_RECORDER_ROLE',
      pauserRole: 'PAUSER_ROLE',
      backendPrivateKeyCustody: false,
    },
    walletPolicy: {
      whitelistRequired: true,
      expectedWhitelistedWalletCount: 50,
      transferPolicy: 'Whitelisted wallets only.',
      investorWalletCustody: 'user_or_investor_wallets_only',
      deploymentSigning: 'user-wallet-signs',
    },
    valuationPolicy: {
      cadence: 'Manual',
      updateModel: 'manual_upload',
      eventRequirements: ['ValuationUpdated'],
      evidenceRequirements: ['Provider receipt'],
    },
    distributionPolicy: {
      movementScope: 'event_and_evidence_only',
      eventRequirements: ['DistributionRecorded'],
      evidenceRequirements: ['Provider receipt'],
    },
    eventModel: {
      standardEvents: ['Transfer'],
      customEvents: ['ValuationUpdated'],
      eventToEvidenceMapping: [
        {
          eventName: 'ValuationUpdated',
          evidenceUse: 'NAV evidence',
          scpSurface: 'Asset servicing',
        },
      ],
      signatureNotes: 'Exact signatures are source controlled in the deployment artifact.',
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
    acceptanceCriteria: ['No backend private-key custody.'],
    blockedReasons: [],
    metadata: {
      generatedAt: '2026-06-07T00:00:00.000Z',
      generator: 'deterministic_9a_spec_generator',
      version: '1',
    },
  };
}

function createArtifactPackage(spec: SmartContractArtifactSpec): SmartContractArtifactPackage {
  return {
    artifactId: 'artifact-1',
    specId: spec.specId,
    projectId: spec.projectId,
    projectName: spec.projectName,
    status: 'generated',
    generatedFrom: {
      specId: spec.specId,
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
          contentHash: 'sha256-preview',
        },
      ],
    },
    implementedSpecSummary: {
      standardFunctions: ['transfer'],
      standardEvents: ['Transfer'],
      customEvents: ['ValuationUpdated'],
      accessControlFeatures: ['AccessControl'],
      walletRestrictionFeatures: ['Whitelist'],
      valuationFeatures: ['ValuationUpdated'],
      distributionFeatures: ['DistributionRecorded'],
      pauseFeatures: ['Pausable'],
    },
    implementationNotes: ['Preview only.'],
    blockedReasons: [],
    metadata: {
      generatedAt: '2026-06-07T00:00:00.000Z',
      generator: 'deterministic_9b_artifact_generator',
      version: '1',
    },
  };
}

afterEach(() => {
  repositories.forEach((repository) => repository.close());
  repositories = [];
});

describe('workspace evidence and artifact persistence repository', () => {
  it('stores provider-derived evidence as durable records tied to the current lifecycle snapshot', () => {
    const repository = createRepository();
    const workspaceRecord = saveBaseWorkspace(repository);

    const saved = repository.saveEvidenceRecords({
      projectId: workspaceRecord.project.id,
      records: [
        {
          evidenceType: 'deployment',
          sourcePersistence: 'local_session_only',
          sourceAttemptId: 'deployment-attempt-1',
          lifecycleSnapshotVersion: workspaceRecord.snapshot.version,
          status: 'confirmed',
          chainId: 11155111,
          networkName: 'Sepolia',
          transactionHash,
          transactionHashSource: 'provider_returned',
          receiptSource: 'provider_receipt',
          receiptStatus: 'success',
          contractAddress,
          contractAddressSource: 'receipt_returned',
          eventEvidenceSource: 'absent',
          artifactPackageId: 'artifact-1',
        },
      ],
    });

    expect(saved.evidenceRecords).toHaveLength(1);
    expect(saved.evidenceRecords[0]).toMatchObject({
      evidenceType: 'deployment',
      persistence: 'durable',
      sourcePersistence: 'local_session_only',
      lifecycleContextStatus: 'current_context',
      transactionHash,
      contractAddress,
    });
  });

  it('rejects evidence that lacks provider-derived transaction provenance', () => {
    const repository = createRepository();
    const workspaceRecord = saveBaseWorkspace(repository);

    expect(() =>
      repository.saveEvidenceRecords({
        projectId: workspaceRecord.project.id,
        records: [
          {
            evidenceType: 'deployment',
            sourcePersistence: 'local_session_only',
            lifecycleSnapshotVersion: workspaceRecord.snapshot.version,
            status: 'confirmed',
            chainId: 11155111,
            networkName: 'Sepolia',
            transactionHash: 'not-a-transaction-hash',
            transactionHashSource: 'provider_returned',
            receiptSource: 'provider_receipt',
            receiptStatus: 'success',
            contractAddress,
            contractAddressSource: 'receipt_returned',
            eventEvidenceSource: 'absent',
          },
        ],
      }),
    ).toThrow();
  });

  it('stores generated artifacts and marks them stale after a later lifecycle snapshot', () => {
    const repository = createRepository();
    const workspaceRecord = saveBaseWorkspace(repository);
    const spec = createSmartContractSpec();
    const artifactPackage = createArtifactPackage(spec);

    const saved = repository.saveArtifactRecords({
      projectId: workspaceRecord.project.id,
      records: [
        {
          artifactType: 'smart_contract_spec',
          artifactPayload: spec,
          lifecycleSnapshotVersion: workspaceRecord.snapshot.version,
        },
        {
          artifactType: 'artifact_preview',
          artifactPayload: artifactPackage,
          lifecycleSnapshotVersion: workspaceRecord.snapshot.version,
        },
      ],
    });

    expect(saved.artifactRecords).toHaveLength(2);
    expect(saved.artifactRecords.map((record) => record.lifecycleContextStatus)).toEqual([
      'current_context',
      'current_context',
    ]);
    expect(saved.artifactRecords[0].contentHash).toMatch(/^[a-f0-9]{64}$/);

    repository.saveWorkspaceSnapshot({
      projectId: workspaceRecord.project.id,
      projectName: workspaceRecord.project.name,
      source: 'user_action',
      lifecycleState: {
        ...createInitialMila26LifecycleState(),
        investorRegistryEntries: [
          createInvestorRegistryEntry({
            id: 'investor-wallet-2',
            walletAddress: '0x2222222222222222222222222222222222222222',
          }),
        ],
      },
    });

    const loaded = repository.listArtifactRecords(workspaceRecord.project.id);
    expect(loaded.latestSnapshotVersion).toBe(2);
    expect(loaded.artifactRecords.map((record) => record.lifecycleContextStatus)).toEqual([
      'stale_context',
      'stale_context',
    ]);
  });

  it('requires a saved workspace snapshot before durable evidence or artifacts can be stored', () => {
    const repository = createRepository();
    const spec = createSmartContractSpec();

    expect(() =>
      repository.saveArtifactRecords({
        projectId: 'missing-project',
        records: [{ artifactType: 'smart_contract_spec', artifactPayload: spec }],
      }),
    ).toThrow(WorkspacePersistenceValidationError);
    expect(() =>
      repository.saveEvidenceRecords({
        projectId: 'missing-project',
        records: [
          {
            evidenceType: 'deployment',
            sourcePersistence: 'local_session_only',
            status: 'submitted',
            chainId: 11155111,
            networkName: 'Sepolia',
            transactionHash,
            transactionHashSource: 'provider_returned',
            receiptSource: 'absent',
            contractAddressSource: 'absent',
            eventEvidenceSource: 'absent',
          },
        ],
      }),
    ).toThrow(WorkspacePersistenceValidationError);
  });
});
