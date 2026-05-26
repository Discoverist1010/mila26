/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { generateEngineeringBriefMock } from '../server/agents/engineeringBriefMock';
import { generateSmartContractArtifactSpec } from '../server/agents/smartContractArtifactSpecMock';
import { SmartContractArtifactSpecSchema } from '../server/contracts/smartContractArtifactSpec';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import { createDemoProjectClosureLedger } from '../src/domain/projectClosureLedger';
import { toRequirementBriefContract } from '../src/domain/requirementBrief';
import { FundFactsSchema } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createValidRequest() {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');
  const requirementBrief = toRequirementBriefContract(brief, 'approved');
  const engineeringBrief = generateEngineeringBriefMock(requirementBrief);
  const closureLedger = createDemoProjectClosureLedger();

  return {
    requirementBrief,
    engineeringBrief,
    closureReadiness: {
      status: 'ready' as const,
      readinessLabel: 'Ready for artifact specification',
      blockedReasons: [],
      closureLedgerId: closureLedger.id,
      openItemCount: 0,
      blockingOpenItemCount: 0,
      blockedCheckCount: 0,
    },
  };
}

describe('Smart Contract Artifact Spec generator', () => {
  it('creates a valid restricted ERC-20-compatible spec from Engineering Brief and ready closure', () => {
    const request = createValidRequest();
    const result = generateSmartContractArtifactSpec(request);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);

    const spec = SmartContractArtifactSpecSchema.parse(result.data);
    expect(spec.status).toBe('ready');
    expect(spec.generatedFrom.engineeringBriefId).toBe(request.engineeringBrief.id);
    expect(spec.tokenStandardProfile.baseStandardCompatibility).toBe('erc20');
    expect(spec.tokenStandardProfile.mila26RestrictionProfile).toBe('restricted_erc20');
    expect(spec.tokenStandardProfile.recommendedProfile).toBe('restricted_erc20');
    expect(spec.tokenStandardProfile.compatibilityNotes.join(' ')).toMatch(/not a separate formal ERC standard/i);
  });

  it('includes minimum ERC-20 functions and events', () => {
    const result = generateSmartContractArtifactSpec(createValidRequest());
    if (!result.ok) throw new Error(result.message);

    expect(result.data.tokenStandardProfile.minimumRequiredFunctions).toEqual([
      'totalSupply',
      'balanceOf',
      'transfer',
      'allowance',
      'approve',
      'transferFrom',
    ]);
    expect(result.data.tokenStandardProfile.minimumRequiredEvents).toEqual(['Transfer', 'Approval']);
    expect(result.data.eventModel.standardEvents).toEqual(['Transfer', 'Approval']);
  });

  it('includes custom tokenisation events and event-to-evidence mapping', () => {
    const result = generateSmartContractArtifactSpec(createValidRequest());
    if (!result.ok) throw new Error(result.message);

    expect(result.data.eventModel.customEvents).toEqual(
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
    expect(result.data.eventModel.eventToEvidenceMapping).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventName: 'DistributionRecorded',
          scpSurface: 'Recent Events',
        }),
        expect.objectContaining({
          eventName: 'Transfer',
          scpSurface: 'Contract Health',
        }),
      ]),
    );
  });

  it('includes OpenZeppelin assumptions without requiring packages or imports', () => {
    const result = generateSmartContractArtifactSpec(createValidRequest());
    if (!result.ok) throw new Error(result.message);

    expect(result.data.tokenStandardProfile.openZeppelinAssumptions).toEqual({
      useOpenZeppelinContracts: true,
      baseContracts: ['ERC20'],
      extensions: ['AccessControl', 'Pausable'],
      exactPackageVersionDeferredTo: 'track_9b_or_9b_2',
    });
    expect(JSON.stringify(result.data)).not.toMatch(/@openzeppelin|import\s/i);
  });

  it('includes access, wallet, valuation, distribution, and safety assumptions', () => {
    const result = generateSmartContractArtifactSpec(createValidRequest());
    if (!result.ok) throw new Error(result.message);

    expect(result.data.accessControl.backendPrivateKeyCustody).toBe(false);
    expect(result.data.walletPolicy.whitelistRequired).toBe(true);
    expect(result.data.walletPolicy.deploymentSigning).toBe('user-wallet-signs');
    expect(result.data.valuationPolicy.eventRequirements).toContain('ValuationUpdated');
    expect(result.data.distributionPolicy.eventRequirements).toContain('DistributionRecorded');
    expect(result.data.distributionPolicy.movementScope).toBe('event_and_evidence_only');
    expect(result.data.safetyBoundary).toEqual({
      network: 'ethereum-testnet-only',
      mainnetDisabled: true,
      backendCustody: 'backend-holds-no-private-keys',
      deploymentSigning: 'user-wallet-signs',
      deploymentRequiresChecksEvidenceAndGate: true,
      productionLegalComplianceAdvice: false,
      realInvestorOnboardingInMvp: false,
    });
    expect(result.data.acceptanceCriteria.join(' ')).toMatch(/Future checks must verify/i);
  });

  it('fails safely when Engineering Brief is missing', () => {
    const request = createValidRequest();
    const result = generateSmartContractArtifactSpec({
      requirementBrief: request.requirementBrief,
      closureReadiness: request.closureReadiness,
    });

    expect(result).toMatchObject({
      ok: false,
      code: 'MISSING_ENGINEERING_BRIEF',
    });
  });

  it('fails safely when closure readiness is blocked', () => {
    const request = createValidRequest();
    const result = generateSmartContractArtifactSpec({
      ...request,
      closureReadiness: {
        ...request.closureReadiness,
        status: 'blocked',
        readinessLabel: 'Closure blocked',
        blockedReasons: ['Security Review is blocked.'],
      },
    });

    expect(result).toMatchObject({
      ok: false,
      code: 'CLOSURE_NOT_READY',
    });
  });

  it('rejects unsafe mainnet and backend custody boundaries', () => {
    const request = createValidRequest();
    const mainnetResult = generateSmartContractArtifactSpec({
      ...request,
      engineeringBrief: {
        ...request.engineeringBrief,
        deploymentBoundary: {
          ...request.engineeringBrief.deploymentBoundary,
          network: 'ethereum-mainnet',
        },
      },
    });
    const custodyResult = generateSmartContractArtifactSpec({
      ...request,
      engineeringBrief: {
        ...request.engineeringBrief,
        deploymentBoundary: {
          ...request.engineeringBrief.deploymentBoundary,
          backendCustody: 'backend-holds-private-keys',
        },
      },
    });

    expect(mainnetResult.ok).toBe(false);
    expect(custodyResult.ok).toBe(false);
  });
});
