/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import { resolveContractOpsSkillInvocation } from '../server/contractOpsSkills/registry';
import { evaluateContractOpsUserTextSafety } from '../server/contractOpsSkills/safety';
import { handleProductSetupWalletInput } from '../src/domain/productSetup';
import {
  contractOpsActionIdsUnderTest,
  contractOpsMockWallets,
  contractOpsTokenisedFundScenarios,
} from './fixtures/contract-ops-scenarios';
import {
  buildContractOpsScenarioReadModel,
  createProductSetupRecordForScenario,
  getReadinessStatus,
  getSnapshotValue,
  getSpecValue,
} from './helpers/productSetupContractOps';

describe('Contract Ops tokenised fund scenarios', () => {
  it.each(contractOpsTokenisedFundScenarios)('builds Contract Ops state from Product Setup for $id', (scenario) => {
    const { readModel } = buildContractOpsScenarioReadModel(scenario);

    expect(getSnapshotValue(readModel, 'product-name')).toBe(String(scenario.productSetup.product_name));
    expect(getSnapshotValue(readModel, 'token-symbol')).toBe(String(scenario.productSetup.token_symbol));
    expect(getSnapshotValue(readModel, 'expected-investors')).toBe(String(scenario.productSetup.expected_investor_count));
    expect(readModel.recommendation.protocol).toBe(scenario.expectedContractOps.recommendedProtocol);
    expect(getSpecValue(readModel, 'selected-erc-protocol')).toBe(
      scenario.expectedContractOps.selectedProtocol ?? scenario.expectedContractOps.recommendedProtocol,
    );
    expect(getSpecValue(readModel, 'contract-template')).toBe(scenario.expectedContractOps.expectedTemplate);

    const selectedOption = readModel.protocolOptions.find((option) => option.id === scenario.expectedContractOps.expectedSelectedProtocolId);
    expect(selectedOption).toMatchObject({ selected: true });

    for (const protocolId of scenario.expectedContractOps.plannedProtocolIds) {
      expect(readModel.protocolOptions.find((option) => option.id === protocolId)).toMatchObject({
        status: 'planned',
        executablePrototype: false,
      });
    }

    for (const blocker of scenario.expectedContractOps.trueBlockersBeforeFix) {
      expect(readModel.launchHud.blockers.join(' ')).toContain(blocker);
    }

    for (const laterNeed of scenario.expectedContractOps.neededLater) {
      expect(readModel.launchHud.laterNeeds.join(' ')).toContain(laterNeed);
    }

    const featureEventText = readModel.featureEventRows
      .map((row) => `${row.productRequirement} ${row.contractFeature} ${row.evidenceRecord} ${row.notes}`)
      .join(' ');
    for (const expectedEvent of scenario.expectedContractOps.expectedEvents) {
      expect(featureEventText).toContain(expectedEvent);
    }
  });

  it('separates deployment blockers from later lifecycle requirements', () => {
    const level3 = contractOpsTokenisedFundScenarios.find((scenario) => scenario.level === 3);
    expect(level3).toBeDefined();
    const { readModel } = buildContractOpsScenarioReadModel(level3!);

    expect(getReadinessStatus(readModel, 'specs')).toBe('needs_input');
    expect(getReadinessStatus(readModel, 'features')).toBe('needs_input');
    expect(getReadinessStatus(readModel, 'admin-wallet')).toBe('ready');
    expect(getReadinessStatus(readModel, 'investor-wallets')).toBe('needed_later');
    expect(readModel.deployButtonEnabled).toBe(false);
  });

  it('enables the Sepolia deploy action only after true readiness blockers are resolved', () => {
    const level3 = contractOpsTokenisedFundScenarios.find((scenario) => scenario.level === 3);
    expect(level3).toBeDefined();

    const before = buildContractOpsScenarioReadModel(level3!, {
      walletConnectedOnSepolia: true,
      canRequestSepoliaDeployment: true,
    }).readModel;
    expect(before.deployButtonEnabled).toBe(false);
    expect(before.launchHud.blockers).toContain('Confirm the smart contract specification.');

    const after = buildContractOpsScenarioReadModel(level3!, {
      specsConfirmed: true,
      featureMappingConfirmed: true,
      walletConnectedOnSepolia: true,
      canRequestSepoliaDeployment: true,
    }).readModel;
    expect(after.deployButtonEnabled).toBe(true);
    expect(after.launchHud.blockers).toEqual([]);
    expect(after.launchHud.statusLabel).toBe('Ready for wallet signature');
  });

  it('keeps deployment evidence and post-deployment operations locked until provider evidence exists', () => {
    const level3 = contractOpsTokenisedFundScenarios.find((scenario) => scenario.level === 3);
    expect(level3).toBeDefined();

    const before = buildContractOpsScenarioReadModel(level3!, {
      specsConfirmed: true,
      featureMappingConfirmed: true,
      walletConnectedOnSepolia: true,
      canRequestSepoliaDeployment: true,
    }).readModel;
    expect(before.evidenceRows.find((row) => row.id === 'deployment-evidence')?.value).toBe('No deployment evidence yet');
    expect(before.postDeploymentCards.every((card) => card.status === 'locked')).toBe(true);

    const after = buildContractOpsScenarioReadModel(level3!, {
      specsConfirmed: true,
      featureMappingConfirmed: true,
      walletConnectedOnSepolia: true,
      canRequestSepoliaDeployment: true,
      deploymentConfirmed: true,
    }).readModel;
    expect(after.evidenceRows.find((row) => row.id === 'contract-address')?.value).toBe(contractOpsMockWallets.deploymentContract);
    expect(after.evidenceRows.find((row) => row.id === 'transaction-hash')?.value).toMatch(/^0x[a-f0-9]{64}$/);
    expect(after.postDeploymentCards.every((card) => card.status === 'current')).toBe(true);
  });

  it('rejects invalid wallet and seed phrase inputs before they enter Product Setup state', () => {
    const record = createProductSetupRecordForScenario(contractOpsTokenisedFundScenarios[0]);

    const invalid = handleProductSetupWalletInput(record, 'admin_wallet', contractOpsMockWallets.invalid);
    expect(invalid.classification).toBe('invalid');
    expect(invalid.record.fields.admin_wallet.status).toBe('missing');

    const unsafe = handleProductSetupWalletInput(record, 'admin_wallet', contractOpsMockWallets.seedPhrase);
    expect(unsafe.classification).toBe('unsafe_secret');
    expect(unsafe.message).toMatch(/Do not paste private keys, seed phrases, or recovery phrases/i);
    expect(unsafe.record.fields.admin_wallet.status).toBe('missing');
  });

  it('keeps ERC-7683 and ERC-1400-style planned-only and unavailable for MVP deployment', () => {
    const { readModel } = buildContractOpsScenarioReadModel(contractOpsTokenisedFundScenarios[4]);

    for (const protocolId of ['erc1400', 'erc7683']) {
      expect(readModel.protocolOptions.find((option) => option.id === protocolId)).toMatchObject({
        status: 'planned',
        selected: false,
        executablePrototype: false,
      });
    }
    expect(readModel.recommendation.plannedOnly).toMatch(/not selectable for the Sepolia MVP/i);
  });

  it('keeps Contract Ops skill routing local, typed, and guarded for protocol, security, QA, and deployment tasks', () => {
    const protocolAdvice = resolveContractOpsSkillInvocation({
      activeTabLabel: 'Contract Ops',
      requestedFocus: 'protocol_choice',
      userMessage: 'Compare ERC-20, ERC-3643, ERC-4626, ERC-1400-style, and ERC-7683.',
    });
    expect(protocolAdvice?.trace.taskType).toBe('protocol_advice');
    expect(protocolAdvice?.trace.skillIds).toContain('protocol-advisor');
    expect(protocolAdvice?.promptInstruction).not.toContain('https://ethskills.com');

    const securityReview = resolveContractOpsSkillInvocation({
      activeTabLabel: 'Contract Ops',
      requestedFocus: 'security',
      userMessage: 'Review the Solidity for access control, pause authority, and audit issues.',
    });
    expect(securityReview?.trace.skillIds).toEqual(['solidity-security-reviewer', 'contract-test-planner']);
    expect(securityReview?.trace.sourceSnapshotHashes.security).toMatch(/^[a-f0-9]{64}$/);
    expect(securityReview?.trace.sourceSnapshotHashes.audit).toMatch(/^[a-f0-9]{64}$/);
    expect(securityReview?.trace.sourceSnapshotHashes.testing).toMatch(/^[a-f0-9]{64}$/);

    const deploymentReview = resolveContractOpsSkillInvocation({
      activeTabLabel: 'Contract Ops',
      requestedFocus: 'deployment',
      userMessage: 'What blocks Sepolia deployment with my wallet?',
    });
    expect(deploymentReview?.trace.skillIds).toEqual(['wallet-deployment-reviewer', 'contract-spec-compiler']);
  });

  it('blocks unsafe Contract Ops user text before specialist invocation', () => {
    const result = evaluateContractOpsUserTextSafety(`Please deploy with my private key ${'0x'.padEnd(66, 'a')}`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.redactedText).toContain('[REDACTED]');
      expect(result.redactedText).not.toContain('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    }
  });

  it('documents the visible Contract Ops action ids expected by the journey test', () => {
    expect(contractOpsActionIdsUnderTest).toContain('select-protocol-erc3643');
    expect(contractOpsActionIdsUnderTest).toContain('confirm-contract-specs');
    expect(contractOpsActionIdsUnderTest).toContain('confirm-feature-event-mapping');
    expect(contractOpsActionIdsUnderTest).toContain('select-protocol-erc7683-disabled');
    expect(new Set(contractOpsActionIdsUnderTest).size).toBe(contractOpsActionIdsUnderTest.length);
  });
});
