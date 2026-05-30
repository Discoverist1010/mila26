import type { ProjectClosureReadModel } from './projectClosureReadModel';

export type Mila26UiActionId =
  | 'create_requirement_brief'
  | 'generate_engineering_brief'
  | 'review_assumptions'
  | 'ask_question'
  | 'open_brief'
  | 'toggle_brief_panel'
  | 'toggle_left_rail'
  | 'toggle_right_rail'
  | 'scroll_to_scp'
  | 'review_closure_items'
  | 'prepare_smart_contract_spec'
  | 'run_contract_checks'
  | 'prepare_evidence_pack'
  | 'review_deployment_gate'
  | 'connect_wallet';

export type ProjectLifecycleStage =
  | 'setup'
  | 'requirement_brief'
  | 'engineering_brief'
  | 'closure_review'
  | 'smart_contract_artifact_spec'
  | 'checks'
  | 'evidence_pack'
  | 'deployment_gate'
  | 'scp_preview';

export type ProjectLifecycleReadinessStatus =
  | 'draft'
  | 'blocked'
  | 'ready_for_requirement_brief'
  | 'ready_for_engineering_brief'
  | 'ready_for_artifact_spec'
  | 'ready_for_checks'
  | 'ready_for_evidence_pack'
  | 'ready_for_deployment_gate'
  | 'deployment_gate_ready';

export type ProjectLifecycleArtifactSpecStatus = 'not_started' | 'draft' | 'ready' | 'blocked';
export type ProjectLifecycleCheckStatus = 'not_started' | 'pending' | 'passed' | 'failed';
export type ProjectLifecycleEvidenceStatus = 'not_started' | 'draft' | 'ready';
export type ProjectLifecycleDeploymentGateStatus = 'not_started' | 'blocked' | 'ready';

export type ProjectLifecycleReadModelInput = {
  hasRequirementBrief: boolean;
  hasEngineeringBrief: boolean;
  closureReadiness: ProjectClosureReadModel;
  artifactSpecStatus?: ProjectLifecycleArtifactSpecStatus;
  checkStatus?: ProjectLifecycleCheckStatus;
  evidenceStatus?: ProjectLifecycleEvidenceStatus;
  deploymentGateStatus?: ProjectLifecycleDeploymentGateStatus;
};

export type ProjectLifecycleSafetyBoundary = {
  network: 'ethereum-testnet-only';
  backendCustody: 'backend-holds-no-private-keys';
  signing: 'user-wallet-signs';
  mainnetAllowed: false;
};

export type ProjectLifecycleReadModel = {
  currentStage: ProjectLifecycleStage;
  readinessStatus: ProjectLifecycleReadinessStatus;
  readinessLabel: string;
  blockedReasons: string[];
  nextRecommendedActionId: Mila26UiActionId;
  enabledActionIds: Mila26UiActionId[];
  disabledActionReasons: Partial<Record<Mila26UiActionId, string>>;
  safetyBoundary: ProjectLifecycleSafetyBoundary;
};

const safetyBoundary: ProjectLifecycleSafetyBoundary = {
  network: 'ethereum-testnet-only',
  backendCustody: 'backend-holds-no-private-keys',
  signing: 'user-wallet-signs',
  mainnetAllowed: false,
};

const workflowActionIds = [
  'create_requirement_brief',
  'generate_engineering_brief',
  'review_assumptions',
  'ask_question',
  'open_brief',
  'review_closure_items',
  'prepare_smart_contract_spec',
  'run_contract_checks',
  'prepare_evidence_pack',
  'review_deployment_gate',
  'connect_wallet',
] as const satisfies Mila26UiActionId[];

function disabledReasonsFor(enabledActionIds: Mila26UiActionId[], reason: string) {
  return Object.fromEntries(
    workflowActionIds
      .filter((actionId) => !enabledActionIds.includes(actionId))
      .map((actionId) => [actionId, reason]),
  ) as Partial<Record<Mila26UiActionId, string>>;
}

function model(params: Omit<ProjectLifecycleReadModel, 'safetyBoundary'>): ProjectLifecycleReadModel {
  return {
    ...params,
    safetyBoundary,
  };
}

export function toProjectLifecycleReadModel(input: ProjectLifecycleReadModelInput): ProjectLifecycleReadModel {
  const artifactSpecStatus = input.artifactSpecStatus ?? 'not_started';
  const checkStatus = input.checkStatus ?? 'not_started';
  const evidenceStatus = input.evidenceStatus ?? 'not_started';
  const deploymentGateStatus = input.deploymentGateStatus ?? 'not_started';

  if (!input.hasRequirementBrief) {
    const enabledActionIds: Mila26UiActionId[] = ['create_requirement_brief', 'ask_question'];
    return model({
      currentStage: 'setup',
      readinessStatus: 'ready_for_requirement_brief',
      readinessLabel: 'Ready to create Requirement Brief',
      blockedReasons: [],
      nextRecommendedActionId: 'create_requirement_brief',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Create the Requirement Brief first.'),
    });
  }

  if (!input.hasEngineeringBrief) {
    const enabledActionIds: Mila26UiActionId[] = [
      'generate_engineering_brief',
      'review_assumptions',
      'ask_question',
      'open_brief',
    ];
    return model({
      currentStage: 'requirement_brief',
      readinessStatus: 'ready_for_engineering_brief',
      readinessLabel: 'Ready to generate Engineering Brief',
      blockedReasons: [],
      nextRecommendedActionId: 'generate_engineering_brief',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Generate the Engineering Brief before this action.'),
    });
  }

  if (input.closureReadiness.status !== 'ready') {
    const enabledActionIds: Mila26UiActionId[] = ['review_closure_items', 'review_assumptions', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'closure_review',
      readinessStatus: 'blocked',
      readinessLabel: input.closureReadiness.readinessLabel,
      blockedReasons:
        input.closureReadiness.blockedReasons.length > 0
          ? input.closureReadiness.blockedReasons
          : [input.closureReadiness.readinessDescription],
      nextRecommendedActionId: 'review_closure_items',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Resolve closure readiness before continuing.'),
    });
  }

  if (artifactSpecStatus === 'blocked') {
    const enabledActionIds: Mila26UiActionId[] = ['prepare_smart_contract_spec', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'smart_contract_artifact_spec',
      readinessStatus: 'blocked',
      readinessLabel: 'Smart Contract Artifact Spec blocked',
      blockedReasons: ['Smart Contract Artifact Spec needs revision before checks can run.'],
      nextRecommendedActionId: 'prepare_smart_contract_spec',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Unblock the Smart Contract Artifact Spec first.'),
    });
  }

  if (artifactSpecStatus !== 'ready') {
    const enabledActionIds: Mila26UiActionId[] = ['prepare_smart_contract_spec', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'smart_contract_artifact_spec',
      readinessStatus: 'ready_for_artifact_spec',
      readinessLabel: 'Ready for Smart Contract Artifact Spec',
      blockedReasons: [],
      nextRecommendedActionId: 'prepare_smart_contract_spec',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Create the Smart Contract Artifact Spec before this action.'),
    });
  }

  if (checkStatus === 'failed') {
    const enabledActionIds: Mila26UiActionId[] = ['run_contract_checks', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'checks',
      readinessStatus: 'blocked',
      readinessLabel: 'Contract checks need attention',
      blockedReasons: ['Contract checks must pass before evidence pack preparation.'],
      nextRecommendedActionId: 'run_contract_checks',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Pass contract checks before continuing.'),
    });
  }

  if (checkStatus !== 'passed') {
    const enabledActionIds: Mila26UiActionId[] = ['run_contract_checks', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'checks',
      readinessStatus: 'ready_for_checks',
      readinessLabel: 'Ready for contract checks',
      blockedReasons: [],
      nextRecommendedActionId: 'run_contract_checks',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Run contract checks before this action.'),
    });
  }

  if (evidenceStatus !== 'ready') {
    const enabledActionIds: Mila26UiActionId[] = ['prepare_evidence_pack', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'evidence_pack',
      readinessStatus: 'ready_for_evidence_pack',
      readinessLabel: 'Ready for evidence pack',
      blockedReasons: [],
      nextRecommendedActionId: 'prepare_evidence_pack',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Prepare the evidence pack before this action.'),
    });
  }

  if (deploymentGateStatus === 'blocked') {
    const enabledActionIds: Mila26UiActionId[] = ['review_deployment_gate', 'ask_question', 'open_brief'];
    return model({
      currentStage: 'deployment_gate',
      readinessStatus: 'blocked',
      readinessLabel: 'Deployment gate blocked',
      blockedReasons: ['Deployment gate review must clear MVP safety boundaries before wallet signing is considered.'],
      nextRecommendedActionId: 'review_deployment_gate',
      enabledActionIds,
      disabledActionReasons: disabledReasonsFor(enabledActionIds, 'Resolve the deployment gate before continuing.'),
    });
  }

  const enabledActionIds: Mila26UiActionId[] =
    deploymentGateStatus === 'ready'
      ? ['connect_wallet', 'review_deployment_gate', 'scroll_to_scp', 'ask_question', 'open_brief']
      : ['review_deployment_gate', 'scroll_to_scp', 'ask_question', 'open_brief'];
  return model({
    currentStage: deploymentGateStatus === 'ready' ? 'scp_preview' : 'deployment_gate',
    readinessStatus: deploymentGateStatus === 'ready' ? 'deployment_gate_ready' : 'ready_for_deployment_gate',
    readinessLabel:
      deploymentGateStatus === 'ready' ? 'Deployment gate ready for wallet connection check' : 'Ready for deployment gate review',
    blockedReasons: [],
    nextRecommendedActionId: deploymentGateStatus === 'ready' ? 'connect_wallet' : 'review_deployment_gate',
    enabledActionIds,
    disabledActionReasons: disabledReasonsFor(
      enabledActionIds,
      'Deployment remains a gated, user-wallet-signed testnet-only future step.',
    ),
  });
}
