/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { generateEngineeringBriefMock } from '../server/agents/engineeringBriefMock';
import { generateSmartContractArtifact } from '../server/agents/smartContractArtifactMock';
import { generateSmartContractArtifactSpec } from '../server/agents/smartContractArtifactSpecMock';
import {
  SmartContractArtifactCheckResultSchema,
  SmartContractArtifactPackageSchema,
  SmartContractEvidenceLiteSchema,
} from '../server/contracts/smartContractArtifact';
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

function generateFromSpec(spec: SmartContractArtifactSpec) {
  const result = generateSmartContractArtifact({ smartContractArtifactSpec: spec });
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.data;
}

describe('Smart Contract Artifact generator', () => {
  it('creates deterministic artifact, check, and evidence-lite output from a valid spec', () => {
    const spec = createValidSpec();
    const first = generateFromSpec(spec);
    const second = generateFromSpec(spec);

    const artifactPackage = SmartContractArtifactPackageSchema.parse(first.artifactPackage);
    const checkResult = SmartContractArtifactCheckResultSchema.parse(first.checkResult);
    const evidenceLite = SmartContractEvidenceLiteSchema.parse(first.evidenceLite);

    expect(artifactPackage.artifactId).toBe(`contract-artifact-${spec.specId}`);
    expect(checkResult.checkId).toBe(`contract-check-${spec.specId}`);
    expect(evidenceLite.evidenceId).toBe(`evidence-lite-${spec.specId}`);
    expect(artifactPackage.metadata.generatedAt).toBe(spec.metadata.generatedAt);
    expect(first).toEqual(second);
  });

  it('carries forward core spec identity and restricted ERC-20-compatible profile', () => {
    const spec = createValidSpec();
    const { artifactPackage } = generateFromSpec(spec);

    expect(artifactPackage.specId).toBe(spec.specId);
    expect(artifactPackage.projectId).toBe(spec.projectId);
    expect(artifactPackage.projectName).toBe(spec.projectName);
    expect(artifactPackage.generatedFrom.tokenStandardProfile).toEqual({
      baseStandardCompatibility: 'erc20',
      mila26RestrictionProfile: 'restricted_erc20',
      recommendedProfile: 'restricted_erc20',
    });
  });

  it('represents ERC-20-style functions, standard events, and custom MILA26 events', () => {
    const { artifactPackage } = generateFromSpec(createValidSpec());

    expect(artifactPackage.implementedSpecSummary.standardFunctions).toEqual(
      expect.arrayContaining(['totalSupply', 'balanceOf', 'transfer', 'allowance', 'approve', 'transferFrom']),
    );
    expect(artifactPackage.implementedSpecSummary.standardEvents).toEqual(expect.arrayContaining(['Transfer', 'Approval']));
    expect(artifactPackage.implementedSpecSummary.customEvents).toEqual(
      expect.arrayContaining([
        'WalletWhitelisted',
        'AllocationMinted',
        'ValuationUpdated',
        'DistributionRecorded',
        'TransferRestrictionUpdated',
        'ContractPaused',
        'ContractUnpaused',
      ]),
    );
  });

  it('keeps source preview explicit, deterministic, uncompiled, undeployed, and dependency-free', () => {
    const { artifactPackage } = generateFromSpec(createValidSpec());
    const sourceFile = artifactPackage.sourceModel.sourceFiles[0];

    expect(artifactPackage.sourceModel.compilerToolchainStatus).toBe('not_configured');
    expect(artifactPackage.sourceModel.openZeppelinPackageStatus).toBe('not_installed');
    expect(sourceFile.contentPreview).toContain('Deterministic preview only - not compiled, not deployed, not audited.');
    expect(sourceFile.contentPreview).not.toMatch(/import\s+|@openzeppelin/i);
    expect(sourceFile.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(artifactPackage)).not.toMatch(/contractAddress|txHash|deployedAddress/i);
  });

  it('passes spec-consistency checks while preserving compiler and deployment boundaries', () => {
    const { checkResult } = generateFromSpec(createValidSpec());

    expect(checkResult.status).toBe('passed');
    expect(checkResult.summary).toMatch(/not a production security audit/i);
    expect(checkResult.summary).toMatch(/compiler\/toolchain verification is not configured/i);
    expect(checkResult.boundaryChecks).toEqual({
      testnetOnly: true,
      mainnetDisabled: true,
      backendPrivateKeyCustodyDisabled: true,
      userWalletSignsFutureDeployment: true,
      deploymentNotExecuted: true,
      compilerNotConfigured: true,
    });
  });

  it('links spec, artifact, checks, safety boundaries, and event-to-evidence mappings', () => {
    const spec = createValidSpec();
    const { evidenceLite } = generateFromSpec(spec);

    expect(evidenceLite.status).toBe('ready');
    expect(evidenceLite.evidenceItems.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'evidence-spec-profile',
        'evidence-standard-functions',
        'evidence-standard-events',
        'evidence-custom-events',
        'evidence-artifact-source',
        'evidence-check-summary',
      ]),
    );
    expect(evidenceLite.eventEvidenceRefs.map((ref) => ref.eventName)).toEqual(
      expect.arrayContaining(spec.eventModel.eventToEvidenceMapping.map((mapping) => mapping.eventName)),
    );
    expect(evidenceLite.safetyEvidenceRefs.map((ref) => ref.boundary)).toEqual(
      expect.arrayContaining(['network', 'private_key_custody', 'deployment_signing', 'execution_status']),
    );
  });

  it('blocks artifact generation when the upstream spec is not ready', () => {
    const spec = {
      ...createValidSpec(),
      status: 'blocked' as const,
      blockedReasons: ['Closure readiness is blocked.'],
    };
    const result = generateSmartContractArtifact({ smartContractArtifactSpec: spec });

    expect(result).toMatchObject({
      ok: false,
      code: 'SPEC_NOT_READY',
    });
  });

  it('fails safely when required spec-consistency items are missing after generation', () => {
    const spec = {
      ...createValidSpec(),
      eventModel: {
        ...createValidSpec().eventModel,
        customEvents: ['WalletWhitelisted'],
      },
    };
    const result = generateSmartContractArtifact({ smartContractArtifactSpec: spec });

    expect(result).toMatchObject({
      ok: false,
      code: 'CHECK_FAILED',
    });
  });

  it('rejects unsafe mainnet and backend private-key custody boundaries', () => {
    const mainnetSpec = {
      ...createValidSpec(),
      safetyBoundary: {
        ...createValidSpec().safetyBoundary,
        mainnetDisabled: false,
      },
    };
    const custodySpec = {
      ...createValidSpec(),
      accessControl: {
        ...createValidSpec().accessControl,
        backendPrivateKeyCustody: true,
      },
    };

    expect(generateSmartContractArtifact({ smartContractArtifactSpec: mainnetSpec })).toMatchObject({
      ok: false,
      code: 'VALIDATION_ERROR',
    });
    expect(generateSmartContractArtifact({ smartContractArtifactSpec: custodySpec })).toMatchObject({
      ok: false,
      code: 'VALIDATION_ERROR',
    });
  });
});
