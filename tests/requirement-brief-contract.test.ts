import { describe, expect, it } from 'vitest';
import { createRequirementBrief } from '../src/agents/agentRuntime';
import {
  RequirementBriefContractSchema,
  toRequirementBriefContract,
} from '../src/domain/requirementBrief';
import { FundFactsSchema, type RequirementBrief } from '../src/domain/schemas';
import fundFactsFixture from './fixtures/contracts/fund-facts.json';

function createDemoContract() {
  const facts = FundFactsSchema.parse(fundFactsFixture);
  const brief = createRequirementBrief(facts, 'Launch a tokenized income fund for approved investors.');

  return toRequirementBriefContract(brief);
}

describe('Requirement Brief contract boundary', () => {
  it('creates a valid stable contract from current demo inputs', () => {
    const contract = RequirementBriefContractSchema.parse(createDemoContract());

    expect(contract.id).toMatch(/^requirement-contract-brief-/);
    expect(contract.sourceBriefId).toMatch(/^brief-/);
    expect(contract.projectName).toBe('MILA Income Fund');
    expect(contract.assetProfile.tokenSymbol).toBe('MILA');
    expect(contract.approvalStatus).toBe('ready_for_approval');
  });

  it('preserves selected servicing modules', () => {
    const contract = createDemoContract();

    expect(contract.selectedServicingModules.length).toBeGreaterThan(0);
    expect(contract.selectedServicingModules.every((module) => module.enabled)).toBe(true);
    expect(contract.selectedServicingModules.map((module) => module.id)).toContain('erc20-base');
    expect(contract.selectedServicingModules.map((module) => module.id)).toContain('whitelist');
  });

  it('captures MVP network, signing, and backend custody boundaries', () => {
    const contract = createDemoContract();

    expect(contract.networkBoundary).toBe('ethereum-testnet-only');
    expect(contract.deploymentBoundary.signing).toBe('user-wallet-signs');
    expect(contract.backendCustodyBoundary).toBe('backend-holds-no-private-keys');
    expect(contract.deploymentBoundary.currentTarget).toBe('simulation-only');
  });

  it('preserves valuation and token model assumptions from current modules', () => {
    const contract = createDemoContract();

    expect(contract.tokenModel.standardPreference).toBe('ERC-20');
    expect(contract.tokenModel.assumption).toContain('ERC-20 fund token base');
    expect(contract.valuationPolicy.cadence).toContain('NAV/performance update cadence');
    expect(contract.valuationPolicy.assumptions[0]).toContain('deterministic MVP assumptions');
  });

  it('captures compliance and security assumptions together for future gates', () => {
    const contract = createDemoContract();

    expect(contract.complianceSecurityAssumptions).toContain(
      'Generated artifacts must trace back to an approved RequirementBrief.',
    );
    expect(contract.complianceSecurityAssumptions).toContain(
      'A qualified legal and regulatory advisor must review the product before launch.',
    );
  });

  it('rejects obviously blank critical fields from the source brief', () => {
    const facts = FundFactsSchema.parse(fundFactsFixture);
    const brief = createRequirementBrief(facts, 'Launch a tokenized income fund.') as RequirementBrief;
    const invalidBrief = {
      ...brief,
      fundFacts: {
        ...brief.fundFacts,
        fundName: '',
      },
    };

    expect(() => toRequirementBriefContract(invalidBrief)).toThrow();
  });
});
