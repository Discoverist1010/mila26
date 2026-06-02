import type { DeploymentEvidenceReadModel } from './deploymentEvidenceReadModel';
import type { ProjectLifecycleReadModel } from './projectLifecycleReadModel';
import type { RecordNavOperationReadModel } from './recordNavOperationReadModel';
import type { WalletWhitelistOperationReadModel } from './walletWhitelistOperationReadModel';

export type SmartContractControlPanelStatus =
  | 'preview'
  | 'blocked'
  | 'ready_for_spec'
  | 'artifact_preview_ready'
  | 'ready_for_checks'
  | 'ready_for_gate';
export type SmartContractControlPanelActionKind = 'core' | 'custom_event' | 'view';

export type SmartContractControlPanelAction = {
  label: string;
  kind: SmartContractControlPanelActionKind;
  enabled: boolean;
  disabledReason?: string;
};

export type SmartContractControlPanelFeature = {
  name: string;
  initiation: 'User initiated' | 'Not user initiated';
  actionLabel: 'Trigger Event' | 'View only';
  enabled: boolean;
  disabledReason?: string;
};

export type SmartContractControlPanelHealthItem = {
  label: string;
  value: string;
  status: 'pending' | 'blocked' | 'ready' | 'disabled';
};

export type SmartContractControlPanelViewModel = {
  status: SmartContractControlPanelStatus;
  statusLabel: string;
  statusDetail: string;
  overview: {
    contractStatus: string;
    contractAddress: string;
    network: 'Ethereum testnet only';
    deployedBy: 'User Wallet';
    contractType: string;
    walletConnection: string;
    readiness: string;
  };
  coreActions: SmartContractControlPanelAction[];
  customFeatures: SmartContractControlPanelFeature[];
  recentEvents: string[];
  healthItems: SmartContractControlPanelHealthItem[];
  boundaryItems: SmartContractControlPanelHealthItem[];
};

export type SmartContractControlPanelGeneratedState = {
  specStatus?: 'draft' | 'ready' | 'blocked';
  artifactStatus?: 'generated' | 'blocked';
  checkStatus?: 'passed' | 'failed' | 'blocked';
  evidenceStatus?: 'ready' | 'blocked';
  localCompileTestStatus?: 'passed' | 'failed' | 'blocked' | 'not_run';
  localCompileTestLabel?: string;
  localCompileTestDetail?: string;
  deploymentGateStatus?: 'blocked' | 'review_ready';
  preDeploymentReadiness?: 'incomplete' | 'complete' | 'blocked';
  deploymentExecutionStatus?: 'blocked';
  walletSigningIntentStatus?: 'blocked' | 'review_ready';
  walletExecutionStatus?: 'not_implemented';
  walletConnectionStatus?: 'not_connected' | 'connecting' | 'connected' | 'wrong_chain' | 'rejected' | 'unsupported' | 'error';
  walletProviderStatus?: 'unknown' | 'available' | 'unsupported';
  walletChainStatus?: 'unknown' | 'sepolia' | 'wrong_chain';
  connectedWalletAddressDisplay?: string;
  walletSignedDeploymentStatus?:
    | 'not_started'
    | 'blocked'
    | 'awaiting_wallet_confirmation'
    | 'submitted'
    | 'confirmed'
    | 'rejected'
    | 'failed';
  deploymentTransactionHash?: string;
  deploymentContractAddress?: string;
  deploymentReceiptStatus?: 'pending' | 'success' | 'failed';
  deploymentLocalSessionOnly?: true;
  deploymentEvidence?: DeploymentEvidenceReadModel;
  recordNavOperation?: RecordNavOperationReadModel;
  walletWhitelistOperation?: WalletWhitelistOperationReadModel;
  customEvents?: string[];
};

const disabledExecutionReason =
  'Operations locked. Deployment status does not enable contract operations until operation authorization and evidence logging are wired.';

const coreActionLabels = ['Mint', 'Distribute', 'Burn', 'Pause/Unpause'] as const;

const customFeatures: SmartContractControlPanelFeature[] = [
  {
    name: 'NAV Updated',
    initiation: 'Not user initiated',
    actionLabel: 'View only',
    enabled: false,
    disabledReason: disabledExecutionReason,
  },
  {
    name: 'Distribution Recorded',
    initiation: 'User initiated',
    actionLabel: 'Trigger Event',
    enabled: false,
    disabledReason: disabledExecutionReason,
  },
  {
    name: 'Redemption Requested',
    initiation: 'User initiated',
    actionLabel: 'Trigger Event',
    enabled: false,
    disabledReason: disabledExecutionReason,
  },
  {
    name: 'Investor Added',
    initiation: 'User initiated',
    actionLabel: 'Trigger Event',
    enabled: false,
    disabledReason: disabledExecutionReason,
  },
  {
    name: 'Investor Removed',
    initiation: 'User initiated',
    actionLabel: 'Trigger Event',
    enabled: false,
    disabledReason: disabledExecutionReason,
  },
];

const userInitiatedCustomEvents = new Set([
  'AllocationMinted',
  'ContractPaused',
  'ContractUnpaused',
  'DistributionRecorded',
  'TransferRestrictionUpdated',
  'WalletWhitelisted',
]);

function toGeneratedCustomFeatures(customEvents?: string[]): SmartContractControlPanelFeature[] {
  if (!customEvents?.length) return customFeatures;

  return customEvents.map((eventName) => {
    const isUserInitiated = userInitiatedCustomEvents.has(eventName);

    return {
      name: eventName,
      initiation: isUserInitiated ? 'User initiated' : 'Not user initiated',
      actionLabel: isUserInitiated ? 'Trigger Event' : 'View only',
      enabled: false,
      disabledReason: disabledExecutionReason,
    };
  });
}

function hasGeneratedArtifactPreview(generatedState?: SmartContractControlPanelGeneratedState): boolean {
  return Boolean(
    generatedState?.specStatus === 'ready' &&
      generatedState.artifactStatus === 'generated' &&
      generatedState.checkStatus === 'passed' &&
      generatedState.evidenceStatus === 'ready',
  );
}

function statusForLifecycle(
  lifecycleReadModel: ProjectLifecycleReadModel,
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelStatus {
  if (hasGeneratedArtifactPreview(generatedState)) return 'artifact_preview_ready';
  if (lifecycleReadModel.readinessStatus === 'blocked') return 'blocked';
  if (lifecycleReadModel.readinessStatus === 'ready_for_artifact_spec') return 'ready_for_spec';
  if (lifecycleReadModel.readinessStatus === 'ready_for_checks') return 'ready_for_checks';
  if (
    lifecycleReadModel.readinessStatus === 'ready_for_deployment_gate' ||
    lifecycleReadModel.readinessStatus === 'deployment_gate_ready'
  ) {
    return 'ready_for_gate';
  }
  return 'preview';
}

function compileTestHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  if (!generatedState?.localCompileTestStatus) {
    return [{ label: 'Compiler/toolchain', value: 'Not configured', status: 'disabled' }];
  }

  if (generatedState.localCompileTestStatus === 'passed') {
    return [
      { label: generatedState.localCompileTestLabel ?? 'Local compile/test foundation', value: 'Passed', status: 'ready' },
      { label: 'Solidity fixture', value: 'Compiles locally', status: 'ready' },
      { label: 'Contract tests', value: 'Passed locally', status: 'ready' },
      {
        label: 'Tested capabilities',
        value: 'ERC-20 basics, whitelist restrictions, issuer mint/allocation, valuation event, distribution event, pause/unpause, access control',
        status: 'ready',
      },
    ];
  }

  if (generatedState.localCompileTestStatus === 'failed') {
    return [
      {
        label: generatedState.localCompileTestLabel ?? 'Local compile/test foundation',
        value: 'Failed locally',
        status: 'blocked',
      },
    ];
  }

  if (generatedState.localCompileTestStatus === 'blocked') {
    return [
      {
        label: generatedState.localCompileTestLabel ?? 'Local compile/test foundation',
        value: 'Blocked',
        status: 'blocked',
      },
    ];
  }

  return [
    {
      label: generatedState.localCompileTestLabel ?? 'Local compile/test foundation',
      value: 'Not run',
      status: 'pending',
    },
  ];
}

function deploymentGateHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  if (!generatedState?.deploymentGateStatus) return [];

  return [
    {
      label: 'Deployment Gate Review',
      value: generatedState.deploymentGateStatus === 'review_ready' ? 'Review-ready' : 'Blocked',
      status: generatedState.deploymentGateStatus === 'review_ready' ? 'ready' : 'blocked',
    },
    {
      label: 'Pre-deployment readiness',
      value:
        generatedState.preDeploymentReadiness === 'complete'
          ? 'Complete'
          : generatedState.preDeploymentReadiness === 'blocked'
            ? 'Blocked'
            : 'Incomplete',
      status: generatedState.preDeploymentReadiness === 'complete' ? 'ready' : 'blocked',
    },
    { label: 'Deployment execution', value: 'Blocked', status: 'disabled' },
  ];
}

function walletSigningHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  if (!generatedState?.walletSigningIntentStatus) return [];

  return [
    {
      label: 'Wallet Signing Intent',
      value: generatedState.walletSigningIntentStatus === 'review_ready' ? 'Review-ready' : 'Blocked',
      status: generatedState.walletSigningIntentStatus === 'review_ready' ? 'ready' : 'blocked',
    },
    { label: 'Wallet execution', value: 'Not implemented', status: 'disabled' },
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
  ];
}

function walletConnectionValue(status?: SmartContractControlPanelGeneratedState['walletConnectionStatus']) {
  if (status === 'connected') return 'Connected';
  if (status === 'wrong_chain') return 'Wrong chain';
  if (status === 'connecting') return 'Connecting';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unsupported') return 'Not detected';
  if (status === 'error') return 'Provider error';
  return 'Not connected';
}

function walletChainValue(status?: SmartContractControlPanelGeneratedState['walletChainStatus']) {
  if (status === 'sepolia') return 'Sepolia';
  if (status === 'wrong_chain') return 'Wrong chain';
  return 'Unknown';
}

function walletConnectionHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  const connectionStatus = generatedState?.walletConnectionStatus;
  const chainStatus = generatedState?.walletChainStatus;
  const addressDisplay = generatedState?.connectedWalletAddressDisplay;

  return [
    {
      label: 'Wallet connection',
      value: walletConnectionValue(connectionStatus),
      status: connectionStatus === 'connected' && chainStatus === 'sepolia' ? 'ready' : connectionStatus === 'wrong_chain' || connectionStatus === 'error' ? 'blocked' : 'disabled',
    },
    {
      label: 'Wallet chain',
      value: walletChainValue(chainStatus),
      status: chainStatus === 'sepolia' ? 'ready' : chainStatus === 'wrong_chain' ? 'blocked' : 'disabled',
    },
    {
      label: 'Connected wallet',
      value: addressDisplay || 'No wallet address',
      status: addressDisplay ? 'ready' : 'disabled',
    },
  ];
}

function walletSignedDeploymentValue(status?: SmartContractControlPanelGeneratedState['walletSignedDeploymentStatus']) {
  if (status === 'awaiting_wallet_confirmation') return 'Awaiting wallet confirmation';
  if (status === 'submitted') return 'Deployment submitted to Sepolia';
  if (status === 'confirmed') return 'Deployment confirmed on Sepolia';
  if (status === 'rejected') return 'Deployment rejected in wallet';
  if (status === 'failed') return 'Deployment failed';
  if (status === 'blocked') return 'Deployment blocked';
  return 'Not started';
}

function walletSignedDeploymentHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  const status = generatedState?.walletSignedDeploymentStatus ?? 'not_started';
  const isSubmitted = status === 'submitted' || status === 'confirmed' || status === 'failed';
  const isConfirmed = status === 'confirmed';
  const transactionHash = generatedState?.deploymentEvidence?.transactionHash ?? generatedState?.deploymentTransactionHash;
  const contractAddress = generatedState?.deploymentEvidence?.contractAddress;

  return [
    {
      label: 'Wallet-signed Sepolia deployment',
      value: walletSignedDeploymentValue(status),
      status: isConfirmed ? 'ready' : status === 'failed' || status === 'rejected' || status === 'blocked' ? 'blocked' : 'pending',
    },
    {
      label: 'Deployment transaction hash',
      value: transactionHash ?? 'No transaction hash',
      status: transactionHash ? 'ready' : 'disabled',
    },
    {
      label: 'Deployment contract address',
      value: contractAddress ?? (isSubmitted ? 'No contract address yet' : 'No contract address'),
      status: contractAddress ? 'ready' : 'disabled',
    },
  ];
}

function deploymentEvidenceHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  const evidence = generatedState?.deploymentEvidence;
  if (!evidence) return [];

  return [
    {
      label: 'Deployment Evidence',
      value: evidence.statusLabel.replace('Deployment Evidence: ', ''),
      status: evidence.evidenceStrength === 'confirmed_receipt' ? 'ready' : evidence.status === 'failed' || evidence.status === 'rejected' || evidence.status === 'blocked' ? 'blocked' : 'pending',
    },
    {
      label: 'Evidence strength',
      value: evidence.evidenceStrengthLabel,
      status: evidence.evidenceStrength === 'none' ? 'disabled' : 'ready',
    },
    {
      label: 'Evidence persistence',
      value: evidence.evidencePersistenceLabel,
      status: 'disabled',
    },
    {
      label: 'Transaction hash source',
      value: evidence.transactionHashSourceLabel,
      status: evidence.transactionHashSource === 'provider_returned' ? 'ready' : 'disabled',
    },
    {
      label: 'Contract address source',
      value: evidence.contractAddressSourceLabel,
      status: evidence.contractAddressSource === 'receipt_returned' ? 'ready' : 'disabled',
    },
    {
      label: 'Operations after deployment',
      value: evidence.evidenceStrength === 'confirmed_receipt' ? 'Record NAV gated; other operations locked' : 'Locked until Track 15A',
      status: 'disabled',
    },
  ];
}

function recordNavOperationHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  const operation = generatedState?.recordNavOperation;
  if (!operation) return [];

  return [
    {
      label: 'Record NAV operation',
      value: operation.statusLabel.replace('Record NAV ', ''),
      status:
        operation.operationStatus === 'confirmed'
          ? 'ready'
          : operation.operationStatus === 'failed' || operation.operationStatus === 'rejected' || operation.operationStatus === 'blocked'
            ? 'blocked'
            : operation.operationStatus === 'not_started'
              ? 'disabled'
              : 'pending',
    },
    {
      label: 'Operation transaction hash source',
      value: operation.operationTransactionHashSourceLabel,
      status: operation.operationTransactionHashSource === 'provider_returned' ? 'ready' : 'disabled',
    },
    {
      label: 'Operation receipt source',
      value: operation.operationReceiptSourceLabel,
      status: operation.operationReceiptSource === 'provider_receipt' ? 'ready' : 'disabled',
    },
    {
      label: 'ValuationUpdated event evidence',
      value: operation.eventEvidenceSourceLabel,
      status: operation.eventEvidenceSource === 'absent' ? 'disabled' : 'ready',
    },
    {
      label: 'Operation evidence persistence',
      value: operation.operationEvidencePersistenceLabel,
      status: 'disabled',
    },
    {
      label: 'Other SCP operations',
      value: 'Locked',
      status: 'disabled',
    },
  ];
}

function walletWhitelistOperationHealthItems(
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  const operation = generatedState?.walletWhitelistOperation;
  if (!operation) return [];

  return [
    {
      label: 'Wallet Whitelist operation',
      value: operation.statusLabel.replace('Wallet whitelist ', ''),
      status:
        operation.operationStatus === 'confirmed'
          ? 'ready'
          : operation.operationStatus === 'failed' || operation.operationStatus === 'rejected' || operation.operationStatus === 'blocked'
            ? 'blocked'
            : operation.operationStatus === 'not_started'
              ? 'disabled'
              : 'pending',
    },
    {
      label: 'Whitelist transaction hash source',
      value: operation.operationTransactionHashSourceLabel,
      status: operation.operationTransactionHashSource === 'provider_returned' ? 'ready' : 'disabled',
    },
    {
      label: 'Whitelist receipt source',
      value: operation.operationReceiptSourceLabel,
      status: operation.operationReceiptSource === 'provider_receipt' ? 'ready' : 'disabled',
    },
    {
      label: 'WalletWhitelisted event evidence',
      value: operation.eventEvidenceStatusLabel,
      status: operation.eventEvidenceStatus === 'not_available' ? 'disabled' : 'ready',
    },
    {
      label: 'Whitelist evidence persistence',
      value: operation.operationEvidencePersistenceLabel,
      status: 'disabled',
    },
    {
      label: 'Contract authorization',
      value: 'Enforced on-chain',
      status: 'disabled',
    },
    {
      label: 'Allocation/Mint',
      value: 'Locked until Track 15C',
      status: 'disabled',
    },
    {
      label: 'Other Smart Contract Operations',
      value: 'Locked',
      status: 'disabled',
    },
  ];
}

function healthStatusFor(
  status: SmartContractControlPanelStatus,
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelHealthItem[] {
  if (status === 'blocked') {
    return [
      { label: 'Lifecycle', value: 'Blocked before contract specification', status: 'blocked' },
      { label: 'Contract artifact', value: 'Not created', status: 'pending' },
      { label: 'Checks', value: 'Not run', status: 'pending' },
      { label: 'Deployment', value: 'Locked', status: 'disabled' },
      { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
    ];
  }

  if (status === 'ready_for_spec') {
    return [
      { label: 'Lifecycle', value: 'Ready for artifact specification', status: 'ready' },
      { label: 'Contract artifact', value: 'Spec pending', status: 'pending' },
      { label: 'Checks', value: 'Not run', status: 'pending' },
      { label: 'Deployment', value: 'Locked', status: 'disabled' },
      { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
    ];
  }

  if (status === 'ready_for_checks') {
    return [
      { label: 'Lifecycle', value: 'Artifact spec ready', status: 'ready' },
      { label: 'Contract artifact', value: 'Pending deterministic artifact', status: 'pending' },
      { label: 'Checks', value: 'Ready to run', status: 'pending' },
      { label: 'Deployment', value: 'Locked', status: 'disabled' },
      { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
    ];
  }

  if (status === 'artifact_preview_ready') {
    return [
      { label: 'Smart Contract Spec', value: 'Generated', status: 'ready' },
      { label: 'Artifact preview', value: 'Generated, not compiled', status: 'ready' },
      { label: 'Check result', value: 'Spec-consistency result available', status: 'ready' },
      { label: 'Evidence-lite', value: 'Available for later evidence pack wiring', status: 'ready' },
      ...compileTestHealthItems(generatedState),
      ...deploymentGateHealthItems(generatedState),
      ...walletSigningHealthItems(generatedState),
      ...walletConnectionHealthItems(generatedState),
      ...walletSignedDeploymentHealthItems(generatedState),
      ...deploymentEvidenceHealthItems(generatedState),
      ...recordNavOperationHealthItems(generatedState),
      ...walletWhitelistOperationHealthItems(generatedState),
      { label: 'Deployment', value: walletSignedDeploymentValue(generatedState?.walletSignedDeploymentStatus), status: generatedState?.walletSignedDeploymentStatus === 'confirmed' ? 'ready' : 'disabled' },
      { label: 'Wallet signing', value: 'Not started', status: 'disabled' },
      { label: 'Audit', value: 'Not audited', status: 'disabled' },
    ];
  }

  if (status === 'ready_for_gate') {
    return [
      { label: 'Lifecycle', value: 'Evidence/check path ready for gate review', status: 'ready' },
      { label: 'Contract artifact', value: 'Tracked by lifecycle placeholders', status: 'ready' },
      { label: 'Checks', value: 'Tracked by lifecycle placeholders', status: 'ready' },
      ...walletConnectionHealthItems(generatedState),
      { label: 'Deployment', value: 'Gate review only', status: 'pending' },
      { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
    ];
  }

  return [
    { label: 'Lifecycle', value: 'Requirements in progress', status: 'pending' },
    { label: 'Contract artifact', value: 'Not created', status: 'pending' },
    { label: 'Checks', value: 'Not run', status: 'pending' },
    { label: 'Deployment', value: 'Locked', status: 'disabled' },
    { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
  ];
}

function statusLabel(status: SmartContractControlPanelStatus) {
  switch (status) {
    case 'blocked':
      return 'Blocked before contract specification';
    case 'ready_for_spec':
      return 'Ready for Smart Contract Spec';
    case 'ready_for_checks':
      return 'Ready for deterministic checks';
    case 'artifact_preview_ready':
      return 'Artifact preview generated';
    case 'ready_for_gate':
      return 'Ready for deployment gate review';
    case 'preview':
      return 'Preview only';
  }
}

function statusDetail(
  status: SmartContractControlPanelStatus,
  lifecycleReadModel: ProjectLifecycleReadModel,
  generatedState?: SmartContractControlPanelGeneratedState,
) {
  if (status === 'blocked') {
    return lifecycleReadModel.blockedReasons[0] ?? 'Resolve blocked lifecycle items before contract planning.';
  }

  if (status === 'ready_for_spec') {
    return 'SCP is ready to reflect the future Smart Contract Artifact Spec, but no contract artifact exists yet.';
  }

  if (status === 'ready_for_checks') {
    return 'SCP can show check readiness once Track 9B adds deterministic artifact and check outputs.';
  }

  if (status === 'artifact_preview_ready') {
    if (generatedState?.localCompileTestStatus === 'passed') {
      if (generatedState.walletSignedDeploymentStatus === 'confirmed') {
        return 'Smart Contract Spec, artifact preview, evidence-lite, local compile/test, and wallet-signed Sepolia deployment evidence are available. Evidence persistence is local session only. Record NAV and Wallet Whitelist are gated SCP operations; Allocation/Mint and other Smart Contract Operations remain locked.';
      }

      return 'Smart Contract Spec, artifact preview, spec-consistency check result, evidence-lite, and local compile/test representation are available. Wallet-signed Sepolia deployment may be requested after wallet connection. This is not audited and Smart Contract Operations remain locked.';
    }

    return 'Smart Contract Spec, artifact preview, spec-consistency check result, and evidence-lite are available. This is not compiled, deployed, audited, signed, or connected to a wallet.';
  }

  if (status === 'ready_for_gate') {
    return 'SCP remains non-executing until a later wallet-signed testnet deployment track.';
  }

  return 'Smart Contract Control stays preview-only while requirements and engineering artifacts are prepared.';
}

function boundaryItems(generatedState?: SmartContractControlPanelGeneratedState): SmartContractControlPanelHealthItem[] {
  const walletAddressValue = generatedState?.connectedWalletAddressDisplay ? generatedState.connectedWalletAddressDisplay : 'Absent';
  const transactionHash = generatedState?.deploymentEvidence?.transactionHash ?? generatedState?.deploymentTransactionHash;
  const contractAddress = generatedState?.deploymentEvidence?.contractAddress;
  const hasTransactionHash = Boolean(transactionHash);
  const hasContractAddress = Boolean(contractAddress);
  const deploymentConfirmed = generatedState?.walletSignedDeploymentStatus === 'confirmed';
  const evidence = generatedState?.deploymentEvidence;
  const recordNavOperation = generatedState?.recordNavOperation;
  const walletWhitelistOperation = generatedState?.walletWhitelistOperation;

  return [
    { label: 'Ethereum testnet', value: 'Only', status: 'ready' },
    { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
    { label: 'Backend private keys', value: 'None held', status: 'disabled' },
    { label: 'Backend never holds private keys', value: 'Enforced', status: 'disabled' },
    { label: 'Future deployment signer', value: 'User wallet', status: 'pending' },
    { label: 'User wallet signing required later', value: 'Required', status: 'pending' },
    { label: 'Wallet signing not implemented', value: 'Not implemented', status: 'disabled' },
    { label: 'Wallet connection', value: walletConnectionValue(generatedState?.walletConnectionStatus), status: 'disabled' },
    { label: 'Wallet address', value: walletAddressValue, status: generatedState?.connectedWalletAddressDisplay ? 'ready' : 'disabled' },
    { label: 'No signed payload', value: 'Absent', status: 'disabled' },
    {
      label: hasTransactionHash ? 'Submitted transaction' : 'No submitted transaction',
      value: hasTransactionHash ? 'Submitted to Sepolia' : 'Absent',
      status: hasTransactionHash ? 'ready' : 'disabled',
    },
    {
      label: deploymentConfirmed ? 'Confirmed transaction' : 'No confirmed transaction',
      value: deploymentConfirmed ? 'Confirmed on Sepolia' : 'Absent',
      status: deploymentConfirmed ? 'ready' : 'disabled',
    },
    {
      label: 'Contract deployment',
      value: deploymentConfirmed ? 'Confirmed on Sepolia' : 'Not executed',
      status: deploymentConfirmed ? 'ready' : 'disabled',
    },
    {
      label: 'Contract address',
      value: contractAddress ?? 'No contract address',
      status: hasContractAddress ? 'ready' : 'disabled',
    },
    {
      label: 'Transaction hash',
      value: transactionHash ?? 'No transaction hash',
      status: hasTransactionHash ? 'ready' : 'disabled',
    },
    { label: 'Deployment Evidence', value: evidence?.statusLabel.replace('Deployment Evidence: ', '') ?? 'Not available', status: evidence?.evidenceStrength === 'confirmed_receipt' ? 'ready' : 'disabled' },
    { label: 'Evidence strength', value: evidence?.evidenceStrengthLabel ?? 'None', status: evidence?.evidenceStrength === 'none' || !evidence ? 'disabled' : 'ready' },
    { label: 'Evidence persistence', value: evidence?.evidencePersistenceLabel ?? 'Local session only', status: 'disabled' },
    { label: 'Transaction hash source', value: evidence?.transactionHashSourceLabel ?? 'Absent', status: evidence?.transactionHashSource === 'provider_returned' ? 'ready' : 'disabled' },
    { label: 'Contract address source', value: evidence?.contractAddressSourceLabel ?? 'Absent', status: evidence?.contractAddressSource === 'receipt_returned' ? 'ready' : 'disabled' },
    { label: 'Record NAV operation', value: recordNavOperation?.statusLabel ?? 'Record NAV operation not started', status: recordNavOperation?.operationStatus === 'confirmed' ? 'ready' : 'disabled' },
    { label: 'Operation evidence persistence', value: recordNavOperation?.operationEvidencePersistenceLabel ?? 'Local session only', status: 'disabled' },
    { label: 'Wallet Whitelist operation', value: walletWhitelistOperation?.statusLabel ?? 'Wallet whitelist not started', status: walletWhitelistOperation?.operationStatus === 'confirmed' ? 'ready' : 'disabled' },
    { label: 'Whitelist evidence persistence', value: walletWhitelistOperation?.operationEvidencePersistenceLabel ?? 'Local session only', status: 'disabled' },
    { label: 'Contract authorization', value: 'Enforced on-chain', status: 'disabled' },
    { label: 'Allocation/Mint', value: 'Locked until Track 15C', status: 'disabled' },
    { label: 'Other Smart Contract Operations', value: 'Locked', status: 'disabled' },
    { label: 'Audit', value: 'Not performed', status: 'disabled' },
  ];
}

export function toSmartContractControlPanelViewModel(
  lifecycleReadModel: ProjectLifecycleReadModel,
  generatedState?: SmartContractControlPanelGeneratedState,
): SmartContractControlPanelViewModel {
  const status = statusForLifecycle(lifecycleReadModel, generatedState);

  return {
    status,
    statusLabel: statusLabel(status),
    statusDetail: statusDetail(status, lifecycleReadModel, generatedState),
    overview: {
      contractStatus:
        generatedState?.walletSignedDeploymentStatus === 'confirmed'
          ? 'Deployment confirmed on Sepolia - Record NAV and Wallet Whitelist gated'
          : status === 'artifact_preview_ready'
            ? 'Artifact preview generated - not deployed'
            : 'Not deployed',
      contractAddress: generatedState?.deploymentEvidence?.contractAddress ?? 'No contract address - not deployed',
      network: 'Ethereum testnet only',
      deployedBy: 'User Wallet',
      contractType: 'ERC-20 + custom',
      walletConnection: walletConnectionValue(generatedState?.walletConnectionStatus),
      readiness: statusLabel(status),
    },
    coreActions: coreActionLabels.map((label) => ({
      label,
      kind: 'core',
      enabled: false,
      disabledReason: disabledExecutionReason,
    })),
    customFeatures: toGeneratedCustomFeatures(generatedState?.customEvents),
    recentEvents: [
      'No wallet-signed testnet events yet',
      ...(generatedState?.deploymentEvidence?.transactionHash ?? generatedState?.deploymentTransactionHash
        ? ['Wallet-signed Sepolia deployment submitted']
        : []),
      ...(generatedState?.deploymentEvidence?.contractAddress ? ['Sepolia deployment receipt confirmed'] : []),
      ...(generatedState?.recordNavOperation?.operationTransactionHash ? ['Record NAV submitted to Sepolia'] : []),
      ...(generatedState?.recordNavOperation?.operationStatus === 'confirmed' ? ['Record NAV receipt confirmed'] : []),
      ...(generatedState?.walletWhitelistOperation?.operationTransactionHash ? ['Wallet whitelist submitted to Sepolia'] : []),
      ...(generatedState?.walletWhitelistOperation?.operationStatus === 'confirmed' ? ['Wallet whitelist receipt confirmed'] : []),
      ...(status === 'artifact_preview_ready'
        ? ['Smart Contract Spec generated', 'Artifact preview generated', 'Evidence-lite available']
        : []),
      lifecycleReadModel.readinessLabel,
      'Smart Contract Operations remain locked for MVP',
    ],
    healthItems: healthStatusFor(status, generatedState),
    boundaryItems: boundaryItems(generatedState),
  };
}
