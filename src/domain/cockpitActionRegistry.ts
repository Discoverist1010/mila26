import type { Mila26UiActionId, ProjectLifecycleReadModel, ProjectLifecycleStage } from './projectLifecycleReadModel';

export type CockpitActionPlacement = 'engineering_bot' | 'composer_row' | 'brief_preview' | 'scp' | 'panel_toggle';
export type CockpitActionKind = 'workflow' | 'navigation' | 'panel_toggle' | 'placeholder';
export type CockpitActionVariant = 'primary' | 'secondary' | 'ghost';

export type CockpitAction = {
  id: Mila26UiActionId;
  label: string;
  description?: string;
  placement: CockpitActionPlacement;
  enabled: boolean;
  disabledReason?: string;
  stage?: ProjectLifecycleStage;
  kind: CockpitActionKind;
  variant: CockpitActionVariant;
};

export type CockpitActionViewModel = {
  primaryEngineeringBotAction: CockpitAction;
  secondaryEngineeringBotActions: CockpitAction[];
  panelToggleActions: CockpitAction[];
  actions: CockpitAction[];
};

const actionCopy: Record<
  Mila26UiActionId,
  Pick<CockpitAction, 'label' | 'description' | 'placement' | 'kind' | 'variant'>
> = {
  create_requirement_brief: {
    label: 'Create Requirement Doc',
    description: 'Convert the current business intent into a structured Requirement Brief.',
    placement: 'engineering_bot',
    kind: 'workflow',
    variant: 'primary',
  },
  generate_engineering_brief: {
    label: 'Generate Engineering Brief',
    description: 'Generate the backend Engineering Brief artifact from the Requirement Brief.',
    placement: 'engineering_bot',
    kind: 'workflow',
    variant: 'primary',
  },
  review_assumptions: {
    label: 'Review assumptions',
    description: 'Open the Brief Preview to review assumptions and boundaries.',
    placement: 'composer_row',
    kind: 'navigation',
    variant: 'secondary',
  },
  ask_question: {
    label: 'Send',
    description: 'Ask the Engineering Bot a question.',
    placement: 'composer_row',
    kind: 'workflow',
    variant: 'primary',
  },
  open_brief: {
    label: 'Open full brief',
    description: 'Expand the Brief Preview artifact.',
    placement: 'brief_preview',
    kind: 'navigation',
    variant: 'secondary',
  },
  toggle_brief_panel: {
    label: 'Toggle Brief Preview',
    description: 'Show or hide the attached Brief Preview.',
    placement: 'panel_toggle',
    kind: 'panel_toggle',
    variant: 'ghost',
  },
  toggle_left_rail: {
    label: 'Toggle left rail',
    description: 'Show or hide project navigation.',
    placement: 'panel_toggle',
    kind: 'panel_toggle',
    variant: 'ghost',
  },
  toggle_right_rail: {
    label: 'Toggle right rail',
    description: 'Show or hide the ZiLi-OS console.',
    placement: 'panel_toggle',
    kind: 'panel_toggle',
    variant: 'ghost',
  },
  scroll_to_scp: {
    label: 'View Smart Contract Control Panel',
    description: 'Scroll to the preview-only Smart Contract Control Panel.',
    placement: 'scp',
    kind: 'navigation',
    variant: 'secondary',
  },
  review_closure_items: {
    label: 'Review closure items',
    description: 'Review blocked or unresolved closure readiness items before moving forward.',
    placement: 'engineering_bot',
    kind: 'workflow',
    variant: 'primary',
  },
  prepare_smart_contract_spec: {
    label: 'Prepare Smart Contract Spec',
    description: 'Create the typed bridge from Engineering Brief to smart contract artifact planning.',
    placement: 'engineering_bot',
    kind: 'workflow',
    variant: 'primary',
  },
  run_contract_checks: {
    label: 'Toolchain Decision Pending',
    description: 'Decide the future compile/test toolchain before real contract checks are wired.',
    placement: 'engineering_bot',
    kind: 'placeholder',
    variant: 'primary',
  },
  prepare_evidence_pack: {
    label: 'Prepare Evidence',
    description: 'Prepare evidence from generated artifacts and check results.',
    placement: 'engineering_bot',
    kind: 'placeholder',
    variant: 'primary',
  },
  review_deployment_gate: {
    label: 'Review Deployment Gate',
    description: 'Review the testnet-only, user-wallet-signed deployment gate.',
    placement: 'engineering_bot',
    kind: 'placeholder',
    variant: 'primary',
  },
  connect_wallet: {
    label: 'Connect Wallet for Sepolia Check',
    description: 'Connect the user wallet to check provider availability and Sepolia chain status only.',
    placement: 'engineering_bot',
    kind: 'workflow',
    variant: 'primary',
  },
};

const panelToggleActionIds: Mila26UiActionId[] = ['toggle_brief_panel', 'toggle_left_rail', 'toggle_right_rail'];
const secondaryEngineeringBotActionIds: Mila26UiActionId[] = ['review_assumptions'];
const allCockpitActionIds = Object.keys(actionCopy) as Mila26UiActionId[];
const unwiredPlaceholderReasons: Partial<Record<Mila26UiActionId, string>> = {
  run_contract_checks:
    'Deterministic spec-consistency preview is available. A compile/test toolchain decision is required before real contract checks are wired.',
  prepare_evidence_pack: 'Evidence preparation will be wired after contract check results exist.',
  review_deployment_gate: 'Deployment gate review remains a later, testnet-only wallet-signed step.',
};

function createAction(
  actionId: Mila26UiActionId,
  lifecycleReadModel: ProjectLifecycleReadModel,
  overrides: Partial<Pick<CockpitAction, 'placement' | 'variant'>> = {},
): CockpitAction {
  const copy = actionCopy[actionId];
  const placeholderReason = unwiredPlaceholderReasons[actionId];
  const alwaysAvailable = copy.kind === 'panel_toggle' || actionId === 'scroll_to_scp';
  const enabledByLifecycle = lifecycleReadModel.enabledActionIds.includes(actionId);
  const enabled = alwaysAvailable ? true : placeholderReason ? false : enabledByLifecycle;
  const disabledReason = enabled ? undefined : placeholderReason ?? lifecycleReadModel.disabledActionReasons[actionId];

  return {
    id: actionId,
    ...copy,
    ...overrides,
    enabled,
    disabledReason,
    stage: lifecycleReadModel.currentStage,
  };
}

export function toCockpitActionViewModel(lifecycleReadModel: ProjectLifecycleReadModel): CockpitActionViewModel {
  const actions = allCockpitActionIds.map((actionId) => createAction(actionId, lifecycleReadModel));
  const primaryEngineeringBotAction = createAction(lifecycleReadModel.nextRecommendedActionId, lifecycleReadModel, {
    placement: 'engineering_bot',
    variant: 'primary',
  });
  const secondaryEngineeringBotActions = secondaryEngineeringBotActionIds.map((actionId) => {
    const action = createAction(actionId, lifecycleReadModel, {
      placement: 'composer_row',
      variant: 'secondary',
    });
    return action;
  });
  const panelToggleActions = panelToggleActionIds.map((actionId) => createAction(actionId, lifecycleReadModel));

  return {
    primaryEngineeringBotAction,
    secondaryEngineeringBotActions,
    panelToggleActions,
    actions,
  };
}

export function getCockpitAction(actions: CockpitAction[], actionId: Mila26UiActionId): CockpitAction | undefined {
  return actions.find((action) => action.id === actionId);
}

export function getActionsByPlacement(actions: CockpitAction[], placement: CockpitActionPlacement): CockpitAction[] {
  return actions.filter((action) => action.placement === placement);
}

export function isActionEnabled(actions: CockpitAction[], actionId: Mila26UiActionId): boolean {
  return getCockpitAction(actions, actionId)?.enabled ?? false;
}
