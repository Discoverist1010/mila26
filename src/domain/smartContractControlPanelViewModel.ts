import type { ProjectLifecycleReadModel } from './projectLifecycleReadModel';

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
  customEvents?: string[];
};

const disabledExecutionReason = 'Preview only. No wallet signing or blockchain transaction is wired in this MVP stage.';

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
      { label: 'Deployment', value: 'Not executed', status: 'disabled' },
      { label: 'Wallet signing', value: 'Not started', status: 'disabled' },
      { label: 'Audit', value: 'Not audited', status: 'disabled' },
    ];
  }

  if (status === 'ready_for_gate') {
    return [
      { label: 'Lifecycle', value: 'Evidence/check path ready for gate review', status: 'ready' },
      { label: 'Contract artifact', value: 'Tracked by lifecycle placeholders', status: 'ready' },
      { label: 'Checks', value: 'Tracked by lifecycle placeholders', status: 'ready' },
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
      return 'Smart Contract Spec, artifact preview, spec-consistency check result, evidence-lite, and local compile/test representation are available. This is not deployed, audited, signed, or connected to a wallet.';
    }

    return 'Smart Contract Spec, artifact preview, spec-consistency check result, and evidence-lite are available. This is not compiled, deployed, audited, signed, or connected to a wallet.';
  }

  if (status === 'ready_for_gate') {
    return 'SCP remains non-executing until a later wallet-signed testnet deployment track.';
  }

  return 'Smart Contract Control stays preview-only while requirements and engineering artifacts are prepared.';
}

function boundaryItems(): SmartContractControlPanelHealthItem[] {
  return [
    { label: 'Ethereum testnet', value: 'Only', status: 'ready' },
    { label: 'Mainnet', value: 'Disabled', status: 'disabled' },
    { label: 'Backend private keys', value: 'None held', status: 'disabled' },
    { label: 'Future deployment signer', value: 'User wallet', status: 'pending' },
    { label: 'User wallet signing required later', value: 'Required', status: 'pending' },
    { label: 'Wallet signing not implemented', value: 'Not implemented', status: 'disabled' },
    { label: 'Contract deployment', value: 'Not executed', status: 'disabled' },
    { label: 'Contract address absent', value: 'No contract address', status: 'disabled' },
    { label: 'Transaction hash', value: 'None exists', status: 'disabled' },
    { label: 'Transaction hash absent', value: 'No transaction hash', status: 'disabled' },
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
      contractStatus: status === 'artifact_preview_ready' ? 'Artifact preview generated - not deployed' : 'Not deployed',
      contractAddress: 'No contract address - not deployed',
      network: 'Ethereum testnet only',
      deployedBy: 'User Wallet',
      contractType: 'ERC-20 + custom',
      walletConnection: 'Not connected in MVP',
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
      ...(status === 'artifact_preview_ready'
        ? ['Smart Contract Spec generated', 'Artifact preview generated', 'Evidence-lite available']
        : []),
      lifecycleReadModel.readinessLabel,
      'Deployment remains disabled for MVP',
    ],
    healthItems: healthStatusFor(status, generatedState),
    boundaryItems: boundaryItems(),
  };
}
