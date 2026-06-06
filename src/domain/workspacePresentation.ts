import type { LifecycleParameterStatus, Mila26LifecycleReadModel } from './lifecycleState';

export type WorkspaceTabId =
  | 'overview'
  | 'requirements'
  | 'investor_registry'
  | 'subscription'
  | 'smart_contract'
  | 'asset_servicing'
  | 'redemption'
  | 'maturity'
  | 'evidence';

export type WorkspaceTab = {
  id: WorkspaceTabId;
  label: string;
  purpose: string;
  status: 'in_progress' | 'needs_review' | 'needs_parameters' | 'available' | 'locked_for_later' | 'local_session_only';
};

export type ProductCapabilityStatus = 'available' | 'needs_parameters' | 'locked_for_later' | 'draft' | 'active' | 'local_session_only';

export type ProductCapabilityRow = {
  label: string;
  status: ProductCapabilityStatus;
};

export type LifecycleSnapshotItem = {
  label: string;
  detail: string;
  status: 'ready' | 'needs_review' | 'needs_parameters' | 'wallet_needed' | 'locked' | 'local_session_only';
};

export type ProductVaultItem = {
  label: string;
  status: 'Draft' | 'Pending' | 'Active' | 'Available' | 'Local session';
};

export type WorkspacePresentationInput = {
  hasRequirementBrief: boolean;
  hasEngineeringBrief: boolean;
  hasSmartContractSpec: boolean;
  hasDeploymentEvidence: boolean;
  isWalletWhitelistAvailable: boolean;
  isNavRecordingAvailable: boolean;
  lifecycle: Mila26LifecycleReadModel;
};

export type WorkspacePresentation = {
  tabs: WorkspaceTab[];
  workspaceStatus: ProductCapabilityRow[];
  capabilityStatus: ProductCapabilityRow[];
  productSetup: LifecycleSnapshotItem[];
  lifecycleSnapshot: LifecycleSnapshotItem[];
  productVault: ProductVaultItem[];
  openItems: ProductCapabilityRow[];
};

const baseWorkspaceTabs: WorkspaceTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    purpose: 'Your tokenisation workspace at a glance.',
    status: 'in_progress',
  },
  {
    id: 'requirements',
    label: 'Requirements',
    purpose: 'Capture product, investor, subscription, redemption, and maturity terms.',
    status: 'needs_review',
  },
  {
    id: 'investor_registry',
    label: 'Investor Registry',
    purpose: 'Register up to 50 investor wallet references for whitelisting and later servicing.',
    status: 'needs_parameters',
  },
  {
    id: 'subscription',
    label: 'Subscription',
    purpose: 'Define permitted stablecoins, subscription windows, and payment-per-token terms.',
    status: 'needs_parameters',
  },
  {
    id: 'smart_contract',
    label: 'Smart Contract',
    purpose: 'Review the fund token contract, wallet operations, and template parameters.',
    status: 'available',
  },
  {
    id: 'asset_servicing',
    label: 'Asset Servicing',
    purpose: 'Record NAV, valuation updates, notices, and investor communications.',
    status: 'available',
  },
  {
    id: 'redemption',
    label: 'Redemption',
    purpose: 'Configure redemption windows, delay rules, and payout mechanics.',
    status: 'needs_parameters',
  },
  {
    id: 'maturity',
    label: 'Maturity',
    purpose: 'Prepare final closeout, outstanding tokens, and maturity redemption.',
    status: 'locked_for_later',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    purpose: 'Review local-session wallet evidence and draft project artifacts.',
    status: 'local_session_only',
  },
];

export function workspaceTabsForLifecycle(lifecycle: Mila26LifecycleReadModel): WorkspaceTab[] {
  return baseWorkspaceTabs.map((tab) => {
    if (tab.id === 'investor_registry') {
      return {
        ...tab,
        status:
          lifecycle.investorRegistry.status === 'active'
            ? 'available'
            : lifecycle.investorRegistry.status === 'empty' || lifecycle.investorRegistry.status === 'needs_attention'
              ? 'needs_parameters'
              : 'needs_review',
      };
    }

    if (tab.id === 'subscription') {
      return { ...tab, status: parameterStatusToTabStatus(lifecycle.subscriptionStatus) };
    }

    if (tab.id === 'redemption') {
      return { ...tab, status: parameterStatusToTabStatus(lifecycle.redemptionStatus) };
    }

    if (tab.id === 'maturity') {
      return { ...tab, status: parameterStatusToTabStatus(lifecycle.maturityStatus) };
    }

    return tab;
  });
}

function status(input: WorkspacePresentationInput): ProductCapabilityRow[] {
  const allocationMint = input.lifecycle.allocationMint;
  const allocationMintStatus = parameterStatusToCapabilityStatus(allocationMint.status);
  return [
    { label: 'Current capabilities ready', status: 'available' },
    { label: 'Wallet whitelist available', status: input.isWalletWhitelistAvailable ? 'available' : 'locked_for_later' },
    { label: 'NAV recording available', status: input.isNavRecordingAvailable ? 'available' : 'locked_for_later' },
      { label: 'Allocation / Mint capability', status: allocationMintStatus },
      {
        label:
          allocationMint.status === 'ready'
            ? 'Allocation parameters ready for review'
            : allocationMint.status === 'draft'
              ? 'Allocation setup needs review'
              : 'Allocation setup needs parameters',
        status: allocationMintStatus,
      },
  ];
}

export function toWorkspacePresentation(input: WorkspacePresentationInput): WorkspacePresentation {
  const investorRegistry = input.lifecycle.investorRegistry;
  const subscription = input.lifecycle.subscription;
  const redemption = input.lifecycle.redemption;
  const template = input.lifecycle.subscriptionRedemptionTemplate;
  const allocationMint = input.lifecycle.allocationMint;

  return {
    tabs: workspaceTabsForLifecycle(input.lifecycle),
    workspaceStatus: status(input),
    capabilityStatus: [
      { label: 'Wallet whitelist', status: input.isWalletWhitelistAvailable ? 'available' : 'locked_for_later' },
      { label: 'NAV recording', status: input.isNavRecordingAvailable ? 'available' : 'locked_for_later' },
      { label: 'Allocation / Mint', status: parameterStatusToCapabilityStatus(allocationMint.status) },
      { label: 'Investor registry', status: investorRegistry.status === 'active' || investorRegistry.status === 'ready' ? 'active' : 'needs_parameters' },
      { label: 'Subscription template', status: parameterStatusToCapabilityStatus(subscription.status) },
      { label: 'Redemption template', status: parameterStatusToCapabilityStatus(redemption.status) },
      { label: 'Maturity closeout', status: parameterStatusToCapabilityStatus(input.lifecycle.maturityStatus) },
    ],
    productSetup: [
      { label: 'Requirements', detail: input.hasRequirementBrief ? 'Draft ready' : 'Needs review', status: input.hasRequirementBrief ? 'ready' : 'needs_review' },
      {
        label: 'Investor Wallets',
        detail: investorRegistry.entryCount > 0 ? `${investorRegistry.entryCount}/50 registered` : 'Wallets needed',
        status: investorRegistry.status === 'active' || investorRegistry.status === 'ready' ? 'ready' : 'wallet_needed',
      },
      { label: 'Smart Contract', detail: input.hasSmartContractSpec ? 'Core contract ready' : 'Needs parameters', status: input.hasSmartContractSpec ? 'ready' : 'needs_parameters' },
      { label: 'Evidence', detail: input.hasDeploymentEvidence ? 'Local session only' : 'Not started', status: 'local_session_only' },
    ],
    lifecycleSnapshot: [
      { label: 'Requirements', detail: input.hasRequirementBrief ? 'Draft ready' : 'Needs review', status: input.hasRequirementBrief ? 'ready' : 'needs_review' },
      {
        label: 'Investor Registry',
        detail:
          investorRegistry.entryCount > 0
            ? `${investorRegistry.readyToWhitelistCount} ready, ${investorRegistry.whitelistedCount} whitelisted`
            : 'Wallets needed',
        status: investorRegistry.status === 'active' || investorRegistry.status === 'ready' ? 'ready' : 'wallet_needed',
      },
      {
        label: 'Subscription Template',
        detail: subscription.status === 'ready' ? subscription.statusDetail : parameterStatusDetail(subscription.status),
        status: subscription.status === 'ready' ? 'ready' : 'needs_parameters',
      },
      {
        label: 'Redemption Template',
        detail: redemption.status === 'ready' ? redemption.statusDetail : parameterStatusDetail(redemption.status),
        status: redemption.status === 'ready' ? 'ready' : 'needs_parameters',
      },
      {
        label: 'Allocation / Mint',
        detail: allocationMint.status === 'ready' ? 'Ready for review' : parameterStatusDetail(allocationMint.status),
        status:
          allocationMint.status === 'ready'
            ? 'ready'
            : allocationMint.status === 'locked_for_later'
              ? 'locked'
              : 'needs_parameters',
      },
    ],
    productVault: [
      { label: 'Requirement Brief', status: input.hasRequirementBrief ? 'Draft' : 'Pending' },
      { label: 'Engineering Brief', status: input.hasEngineeringBrief ? 'Draft' : 'Pending' },
      { label: 'Smart Contract Spec', status: input.hasSmartContractSpec ? 'Draft' : 'Pending' },
      { label: 'Contract Template (Sub-Redemption)', status: template.status === 'ready' ? 'Available' : template.status === 'draft' ? 'Draft' : 'Pending' },
      { label: 'Allocation / Mint Parameters', status: allocationMint.status === 'ready' ? 'Available' : allocationMint.status === 'draft' ? 'Draft' : 'Pending' },
      { label: 'Investor Registry', status: investorRegistry.status === 'active' || investorRegistry.status === 'ready' ? 'Active' : 'Pending' },
    ],
    openItems: [
      { label: 'Open questions', status: input.hasRequirementBrief ? 'draft' : 'needs_parameters' },
      { label: 'Subscription parameters', status: parameterStatusToCapabilityStatus(subscription.status) },
      { label: 'Redemption parameters', status: parameterStatusToCapabilityStatus(redemption.status) },
      { label: 'Allocation / Mint parameters', status: parameterStatusToCapabilityStatus(allocationMint.status) },
      { label: 'Maturity parameters', status: parameterStatusToCapabilityStatus(input.lifecycle.maturityStatus) },
      {
        label: 'Investor registry gaps',
        status: investorRegistry.status === 'active' || investorRegistry.status === 'ready' ? 'active' : 'needs_parameters',
      },
    ],
  };
}

function parameterStatusToTabStatus(status: LifecycleParameterStatus): WorkspaceTab['status'] {
  if (status === 'ready') return 'available';
  if (status === 'draft') return 'needs_review';
  if (status === 'locked_for_later') return 'locked_for_later';
  return 'needs_parameters';
}

function parameterStatusToCapabilityStatus(status: LifecycleParameterStatus): ProductCapabilityStatus {
  if (status === 'ready') return 'available';
  if (status === 'draft') return 'draft';
  if (status === 'locked_for_later') return 'locked_for_later';
  return 'needs_parameters';
}

function parameterStatusDetail(status: LifecycleParameterStatus): string {
  if (status === 'ready') return 'Ready';
  if (status === 'draft') return 'Draft parameters';
  if (status === 'locked_for_later') return 'Needs prerequisites';
  return 'Parameters needed';
}
