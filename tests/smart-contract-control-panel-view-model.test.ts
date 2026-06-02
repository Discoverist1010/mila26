import { describe, expect, it } from 'vitest';
import { toDeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import { createDemoProjectClosureLedger, type ProjectClosureLedger } from '../src/domain/projectClosureLedger';
import { toProjectClosureReadModel } from '../src/domain/projectClosureReadModel';
import { toProjectLifecycleReadModel } from '../src/domain/projectLifecycleReadModel';
import { toRecordNavOperationReadModel } from '../src/domain/recordNavOperationReadModel';
import { toSmartContractControlPanelViewModel } from '../src/domain/smartContractControlPanelViewModel';
import { toWalletWhitelistOperationReadModel } from '../src/domain/walletWhitelistOperationReadModel';

function closureReadiness(overrides: Partial<ProjectClosureLedger> = {}) {
  const base = createDemoProjectClosureLedger();
  return toProjectClosureReadModel({
    ledger: {
      ...base,
      ...overrides,
    },
    hasRequirementBrief: true,
    hasEngineeringBrief: true,
  });
}

describe('Smart Contract Control Panel view model', () => {
  it('derives preview state before Requirement Brief creation', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: false,
      hasEngineeringBrief: false,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel);

    expect(viewModel.status).toBe('preview');
    expect(viewModel.statusLabel).toBe('Preview only');
    expect(viewModel.overview.contractStatus).toBe('Not deployed');
    expect(viewModel.overview.contractAddress).toBe('No contract address - not deployed');
    expect(viewModel.overview.network).toBe('Ethereum testnet only');
    expect(viewModel.overview.deployedBy).toBe('User Wallet');
    expect(viewModel.healthItems).toContainEqual({
      label: 'Deployment',
      value: 'Locked',
      status: 'disabled',
    });
  });

  it('derives blocked state without claiming contract execution', () => {
    const base = createDemoProjectClosureLedger();
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness({
        decisionStatus: 'blocked',
        checks: base.checks.map((check) =>
          check.category === 'security_review' ? { ...check, status: 'blocked' } : check,
        ),
      }),
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel);

    expect(viewModel.status).toBe('blocked');
    expect(viewModel.statusLabel).toBe('Blocked before contract specification');
    expect(viewModel.statusDetail).toMatch(/Security Review/i);
    expect(viewModel.overview.contractStatus).toBe('Not deployed');
    expect(viewModel.recentEvents).toContain('Smart Contract Operations remain locked for MVP');
  });

  it('derives ready-for-spec state after closure is ready', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel);

    expect(viewModel.status).toBe('ready_for_spec');
    expect(viewModel.statusLabel).toBe('Ready for Smart Contract Spec');
    expect(viewModel.healthItems).toContainEqual({
      label: 'Lifecycle',
      value: 'Ready for artifact specification',
      status: 'ready',
    });
    expect(viewModel.healthItems).toContainEqual({
      label: 'Contract artifact',
      value: 'Spec pending',
      status: 'pending',
    });
  });

  it('derives future check and deployment gate placeholder states', () => {
    const readyForChecks = toSmartContractControlPanelViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
      }),
    );
    expect(readyForChecks.status).toBe('ready_for_checks');
    expect(readyForChecks.statusLabel).toBe('Ready for deterministic checks');

    const readyForGate = toSmartContractControlPanelViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
        artifactSpecStatus: 'ready',
        checkStatus: 'passed',
        evidenceStatus: 'ready',
        deploymentGateStatus: 'ready',
      }),
    );
    expect(readyForGate.status).toBe('ready_for_gate');
    expect(readyForGate.statusLabel).toBe('Ready for deployment gate review');
    expect(readyForGate.statusDetail).toMatch(/non-executing/i);
  });

  it('reflects generated spec, artifact preview, check result, and evidence-lite without execution claims', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      customEvents: [
        'WalletWhitelisted',
        'AllocationMinted',
        'ValuationUpdated',
        'DistributionRecorded',
        'TransferRestrictionUpdated',
        'ContractPaused',
        'ContractUnpaused',
      ],
    });

    expect(viewModel.status).toBe('artifact_preview_ready');
    expect(viewModel.statusLabel).toBe('Artifact preview generated');
    expect(viewModel.overview.contractStatus).toBe('Artifact preview generated - not deployed');
    expect(viewModel.overview.contractAddress).toBe('No contract address - not deployed');
    expect(viewModel.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Smart Contract Spec', value: 'Generated', status: 'ready' },
        { label: 'Artifact preview', value: 'Generated, not compiled', status: 'ready' },
        { label: 'Check result', value: 'Spec-consistency result available', status: 'ready' },
        { label: 'Evidence-lite', value: 'Available for later evidence pack wiring', status: 'ready' },
        { label: 'Compiler/toolchain', value: 'Not configured', status: 'disabled' },
        { label: 'Deployment', value: 'Not started', status: 'disabled' },
        { label: 'Wallet signing', value: 'Not started', status: 'disabled' },
        { label: 'Audit', value: 'Not audited', status: 'disabled' },
      ]),
    );
    expect(viewModel.statusDetail).toMatch(/not compiled, deployed, audited, signed/i);
    expect(viewModel.boundaryItems).toEqual(
      expect.arrayContaining([
        { label: 'Ethereum testnet', value: 'Only', status: 'ready' },
        { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
        { label: 'Backend private keys', value: 'None held', status: 'disabled' },
        { label: 'Future deployment signer', value: 'User wallet', status: 'pending' },
        { label: 'Contract deployment', value: 'Not executed', status: 'disabled' },
        { label: 'Transaction hash', value: 'No transaction hash', status: 'disabled' },
        { label: 'Audit', value: 'Not performed', status: 'disabled' },
      ]),
    );
    expect(viewModel.customFeatures).toEqual(
      expect.arrayContaining([
        {
          name: 'ValuationUpdated',
          initiation: 'Not user initiated',
          actionLabel: 'View only',
          enabled: false,
          disabledReason:
            'Operations locked. Deployment status does not enable contract operations until operation authorization and evidence logging are wired.',
        },
        {
          name: 'ContractPaused',
          initiation: 'User initiated',
          actionLabel: 'Trigger Event',
          enabled: false,
          disabledReason:
            'Operations locked. Deployment status does not enable contract operations until operation authorization and evidence logging are wired.',
        },
        {
          name: 'ContractUnpaused',
          initiation: 'User initiated',
          actionLabel: 'Trigger Event',
          enabled: false,
          disabledReason:
            'Operations locked. Deployment status does not enable contract operations until operation authorization and evidence logging are wired.',
        },
      ]),
    );
  });

  it('reflects local compile/test status as lightweight SCP readiness without execution claims', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      localCompileTestStatus: 'passed',
      localCompileTestLabel: 'Local compile/test foundation',
      localCompileTestDetail:
        'Passed locally. This is not deployed, wallet signed, audited, connected to a wallet, or represented by a contract address or transaction hash.',
      deploymentGateStatus: 'review_ready',
      preDeploymentReadiness: 'complete',
      deploymentExecutionStatus: 'blocked',
      walletSigningIntentStatus: 'review_ready',
      walletExecutionStatus: 'not_implemented',
    });

    expect(viewModel.status).toBe('artifact_preview_ready');
    expect(viewModel.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Local compile/test foundation', value: 'Passed', status: 'ready' },
        { label: 'Solidity fixture', value: 'Compiles locally', status: 'ready' },
        { label: 'Contract tests', value: 'Passed locally', status: 'ready' },
        {
          label: 'Tested capabilities',
          value: 'ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, access control',
          status: 'ready',
        },
        { label: 'Deployment Gate Review', value: 'Review-ready', status: 'ready' },
        { label: 'Pre-deployment readiness', value: 'Complete', status: 'ready' },
        { label: 'Deployment execution', value: 'Blocked', status: 'disabled' },
        { label: 'Wallet Signing Intent', value: 'Review-ready', status: 'ready' },
        { label: 'Wallet execution', value: 'Not implemented', status: 'disabled' },
        { label: 'Wallet connection', value: 'Not connected', status: 'disabled' },
        { label: 'Wallet chain', value: 'Unknown', status: 'disabled' },
        { label: 'Connected wallet', value: 'No wallet address', status: 'disabled' },
        { label: 'Smart Contract Operations', value: 'Locked', status: 'disabled' },
        {
          label: 'Operations reason',
          value: 'Operation-specific authorization and evidence logging are not implemented',
          status: 'disabled',
        },
        {
          label: 'Required before operations',
          value:
            'wallet connection, user-signed deployment, deployed testnet contract address, transaction hash, operation authorization model, evidence logging',
          status: 'pending',
        },
        { label: 'Deployment', value: 'Not started', status: 'disabled' },
        { label: 'Wallet signing', value: 'Not started', status: 'disabled' },
        { label: 'Audit', value: 'Not audited', status: 'disabled' },
      ]),
    );
    expect(viewModel.statusDetail).toMatch(/local compile\/test representation/i);
    expect(viewModel.overview.contractAddress).toBe('No contract address - not deployed');
    expect(viewModel.boundaryItems).toEqual(
      expect.arrayContaining([
        { label: 'Transaction hash', value: 'No transaction hash', status: 'disabled' },
        { label: 'Backend never holds private keys', value: 'Enforced', status: 'disabled' },
        { label: 'User wallet signing required later', value: 'Required', status: 'pending' },
        { label: 'Wallet signing not implemented', value: 'Not implemented', status: 'disabled' },
        { label: 'Wallet connection', value: 'Not connected', status: 'disabled' },
        { label: 'Wallet address', value: 'Absent', status: 'disabled' },
        { label: 'No signed payload', value: 'Absent', status: 'disabled' },
        { label: 'No submitted transaction', value: 'Absent', status: 'disabled' },
        { label: 'No confirmed transaction', value: 'Absent', status: 'disabled' },
        { label: 'Contract address', value: 'No contract address', status: 'disabled' },
        { label: 'Transaction hash', value: 'No transaction hash', status: 'disabled' },
        { label: 'Audit', value: 'Not performed', status: 'disabled' },
      ]),
    );
    expect(JSON.stringify(viewModel)).not.toMatch(/wallet address: 0x|signed payload:|submitted transaction:|confirmed transaction:/i);
    expect(JSON.stringify(viewModel)).not.toMatch(/ready to sign|sign now|live|verified|production ready|mainnet ready/i);
  });

  it('represents passive wallet connection states without unlocking execution', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      deploymentGateStatus: 'ready',
    });
    const connected = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      walletConnectionStatus: 'connected',
      walletProviderStatus: 'available',
      walletChainStatus: 'sepolia',
      connectedWalletAddressDisplay: '0x1111...1111',
      walletSigningIntentStatus: 'review_ready',
      walletExecutionStatus: 'not_implemented',
    });
    const wrongChain = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      walletConnectionStatus: 'wrong_chain',
      walletProviderStatus: 'available',
      walletChainStatus: 'wrong_chain',
    });

    expect(connected.overview.walletConnection).toBe('Connected');
    expect(connected.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Wallet connection', value: 'Connected', status: 'ready' },
        { label: 'Wallet chain', value: 'Sepolia', status: 'ready' },
        { label: 'Connected wallet', value: '0x1111...1111', status: 'ready' },
      ]),
    );
    expect(connected.boundaryItems).toContainEqual({
      label: 'Wallet address',
      value: '0x1111...1111',
      status: 'ready',
    });
    expect(connected.coreActions.every((action) => action.enabled === false)).toBe(true);
    expect(connected.overview.contractAddress).toBe('No contract address - not deployed');
    expect(JSON.stringify(connected)).not.toMatch(/transaction hash: 0x|contract address: 0x|signed payload: 0x/i);

    expect(wrongChain.overview.walletConnection).toBe('Wrong chain');
    expect(wrongChain.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Wallet connection', value: 'Wrong chain', status: 'blocked' },
        { label: 'Wallet chain', value: 'Wrong chain', status: 'blocked' },
      ]),
    );
  });

  it('represents wallet-signed Sepolia deployment passively while keeping operations locked', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      deploymentGateStatus: 'ready',
    });
    const submitted = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      walletSignedDeploymentStatus: 'submitted',
      deploymentTransactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      deploymentReceiptStatus: 'pending',
      deploymentLocalSessionOnly: true,
      deploymentEvidence: toDeploymentEvidenceReadModel({
        deploymentState: {
          deploymentStatus: 'submitted',
          transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          receiptStatus: 'pending',
          localSessionOnly: true,
        },
      }),
    });
    const confirmed = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      walletSignedDeploymentStatus: 'confirmed',
      deploymentTransactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      deploymentContractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      deploymentReceiptStatus: 'success',
      deploymentLocalSessionOnly: true,
      deploymentEvidence: toDeploymentEvidenceReadModel({
        deploymentState: {
          deploymentStatus: 'confirmed',
          transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          receiptStatus: 'success',
          localSessionOnly: true,
        },
      }),
    });
    const failedWithMalformedAddress = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      walletSignedDeploymentStatus: 'failed',
      deploymentTransactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      deploymentContractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      deploymentReceiptStatus: 'failed',
      deploymentLocalSessionOnly: true,
      deploymentEvidence: toDeploymentEvidenceReadModel({
        deploymentState: {
          deploymentStatus: 'failed',
          transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          receiptStatus: 'failed',
          localSessionOnly: true,
        },
      }),
    });

    expect(submitted.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Wallet-signed Sepolia deployment', value: 'Deployment submitted to Sepolia', status: 'pending' },
        {
          label: 'Deployment transaction hash',
          value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          status: 'ready',
        },
        { label: 'Deployment contract address', value: 'No contract address yet', status: 'disabled' },
        { label: 'Deployment Evidence', value: 'Transaction submitted', status: 'pending' },
        { label: 'Evidence strength', value: 'Provider transaction hash', status: 'ready' },
        { label: 'Transaction hash source', value: 'Provider returned', status: 'ready' },
        { label: 'Contract address source', value: 'Absent', status: 'disabled' },
      ]),
    );
    expect(submitted.overview.contractAddress).toBe('No contract address - not deployed');
    expect(submitted.coreActions.every((action) => action.enabled === false)).toBe(true);

    expect(confirmed.overview.contractStatus).toBe('Deployment confirmed on Sepolia - Record NAV and Wallet Whitelist gated');
    expect(confirmed.overview.contractAddress).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(confirmed.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Wallet-signed Sepolia deployment', value: 'Deployment confirmed on Sepolia', status: 'ready' },
        { label: 'Deployment', value: 'Deployment confirmed on Sepolia', status: 'ready' },
        { label: 'Deployment Evidence', value: 'Confirmed from receipt', status: 'ready' },
        { label: 'Evidence strength', value: 'Confirmed receipt', status: 'ready' },
        { label: 'Evidence persistence', value: 'Local session only', status: 'disabled' },
      ]),
    );
    expect(confirmed.boundaryItems).toEqual(
      expect.arrayContaining([
        { label: 'Submitted transaction', value: 'Submitted to Sepolia', status: 'ready' },
        { label: 'Confirmed transaction', value: 'Confirmed on Sepolia', status: 'ready' },
        { label: 'Contract deployment', value: 'Confirmed on Sepolia', status: 'ready' },
        {
          label: 'Contract address',
          value: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          status: 'ready',
        },
        {
          label: 'Transaction hash',
          value: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          status: 'ready',
        },
        { label: 'Deployment Evidence', value: 'Confirmed from receipt', status: 'ready' },
        { label: 'Evidence strength', value: 'Confirmed receipt', status: 'ready' },
        { label: 'Evidence persistence', value: 'Local session only', status: 'disabled' },
        { label: 'Transaction hash source', value: 'Provider returned', status: 'ready' },
        { label: 'Contract address source', value: 'Receipt returned', status: 'ready' },
        { label: 'Other Smart Contract Operations', value: 'Locked', status: 'disabled' },
      ]),
    );
    expect(confirmed.coreActions.every((action) => action.enabled === false)).toBe(true);
    expect(JSON.stringify(confirmed)).not.toMatch(/production ready|mainnet ready|audit passed|security approved/i);
    expect(failedWithMalformedAddress.overview.contractAddress).toBe('No contract address - not deployed');
    expect(failedWithMalformedAddress.boundaryItems).toEqual(
      expect.arrayContaining([
        { label: 'Contract address', value: 'No contract address', status: 'disabled' },
        { label: 'Contract address source', value: 'Absent', status: 'disabled' },
      ]),
    );
  });

  it('keeps all SCP actions disabled until later wallet and transaction tracks', () => {
    const viewModel = toSmartContractControlPanelViewModel(
      toProjectLifecycleReadModel({
        hasRequirementBrief: true,
        hasEngineeringBrief: true,
        closureReadiness: closureReadiness(),
      }),
    );

    expect(viewModel.coreActions.every((action) => action.enabled === false)).toBe(true);
    expect(viewModel.coreActions.map((action) => action.label)).toEqual(['Mint', 'Distribute', 'Burn', 'Pause/Unpause']);
    expect(viewModel.customFeatures.every((feature) => feature.enabled === false)).toBe(true);
    expect(viewModel.customFeatures).toContainEqual({
      name: 'Distribution Recorded',
      initiation: 'User initiated',
      actionLabel: 'Trigger Event',
      enabled: false,
      disabledReason:
        'Operations locked. Deployment status does not enable contract operations until operation authorization and evidence logging are wired.',
    });
  });

  it('represents Record NAV operation evidence without unlocking broad SCP operations', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      deploymentGateStatus: 'ready',
    });
    const deploymentEvidence = toDeploymentEvidenceReadModel({
      deploymentState: {
        deploymentStatus: 'confirmed',
        transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        receiptStatus: 'success',
        localSessionOnly: true,
      },
    });
    const recordNavOperation = toRecordNavOperationReadModel({
      deploymentEvidence,
      operationState: {
        operationStatus: 'confirmed',
        operationTransactionHash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        operationReceiptStatus: 'success',
        contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        valuation: 1_050_000n,
        valuationReference: 'MILA26-ALPHA-NAV-001',
        decodedEvent: {
          eventName: 'ValuationUpdated',
          valuation: '1050000',
          valuationReference: 'MILA26-ALPHA-NAV-001',
          operator: '0x1111111111111111111111111111111111111111',
        },
        localSessionOnly: true,
      },
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      walletSignedDeploymentStatus: 'confirmed',
      deploymentEvidence,
      recordNavOperation,
    });

    expect(viewModel.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Record NAV operation', value: 'confirmed on Sepolia', status: 'ready' },
        { label: 'Operation transaction hash source', value: 'Provider returned', status: 'ready' },
        { label: 'Operation receipt source', value: 'Provider receipt', status: 'ready' },
        { label: 'ValuationUpdated event evidence', value: 'Decoded from receipt', status: 'ready' },
        { label: 'Operation evidence persistence', value: 'Local session only', status: 'disabled' },
        { label: 'Other SCP operations', value: 'Locked', status: 'disabled' },
      ]),
    );
    expect(viewModel.coreActions.every((action) => action.enabled === false)).toBe(true);
    expect(JSON.stringify(viewModel)).not.toMatch(/production ready|mainnet ready|audit passed|verified/i);
  });

  it('represents Wallet Whitelist operation evidence separately while keeping allocation and other operations locked', () => {
    const lifecycleReadModel = toProjectLifecycleReadModel({
      hasRequirementBrief: true,
      hasEngineeringBrief: true,
      closureReadiness: closureReadiness(),
      artifactSpecStatus: 'ready',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      deploymentGateStatus: 'ready',
    });
    const deploymentEvidence = toDeploymentEvidenceReadModel({
      deploymentState: {
        deploymentStatus: 'confirmed',
        transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        receiptStatus: 'success',
        localSessionOnly: true,
      },
    });
    const walletWhitelistOperation = toWalletWhitelistOperationReadModel({
      deploymentEvidence,
      walletConnectedOnSepolia: true,
      targetWalletAddress: '0x3333333333333333333333333333333333333333',
      whitelistFunctionAvailable: true,
      operationState: {
        operationStatus: 'confirmed',
        operationTransactionHash: '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
        operationReceiptStatus: 'success',
        contractAddress: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        targetWalletAddress: '0x3333333333333333333333333333333333333333',
        allowed: true,
        decodedEvent: {
          eventName: 'WalletWhitelisted',
          wallet: '0x3333333333333333333333333333333333333333',
          allowed: true,
          operator: '0x1111111111111111111111111111111111111111',
        },
        localSessionOnly: true,
      },
    });
    const viewModel = toSmartContractControlPanelViewModel(lifecycleReadModel, {
      specStatus: 'ready',
      artifactStatus: 'generated',
      checkStatus: 'passed',
      evidenceStatus: 'ready',
      walletSignedDeploymentStatus: 'confirmed',
      deploymentEvidence,
      walletWhitelistOperation,
    });

    expect(viewModel.healthItems).toEqual(
      expect.arrayContaining([
        { label: 'Wallet Whitelist operation', value: 'confirmed on Sepolia', status: 'ready' },
        { label: 'Whitelist transaction hash source', value: 'Provider returned', status: 'ready' },
        { label: 'Whitelist receipt source', value: 'Provider receipt', status: 'ready' },
        { label: 'WalletWhitelisted event evidence', value: 'Decoded from receipt', status: 'ready' },
        { label: 'Whitelist evidence persistence', value: 'Local session only', status: 'disabled' },
        { label: 'Contract authorization', value: 'Enforced on-chain', status: 'disabled' },
        { label: 'Allocation/Mint', value: 'Locked until Track 15C', status: 'disabled' },
        { label: 'Other Smart Contract Operations', value: 'Locked', status: 'disabled' },
      ]),
    );
    expect(viewModel.coreActions.every((action) => action.enabled === false)).toBe(true);
    expect(JSON.stringify(viewModel)).not.toMatch(/KYC approved|investor approved|issuer authorized|wallet authorized|production ready|mainnet ready|audit passed|verified/i);
  });
});
