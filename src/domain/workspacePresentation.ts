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
  isInvestorRegistryActive: boolean;
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

export const workspaceTabs: WorkspaceTab[] = [
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

function status(input: WorkspacePresentationInput): ProductCapabilityRow[] {
  return [
    { label: 'Current capabilities ready', status: 'available' },
    { label: 'Wallet whitelist available', status: input.isWalletWhitelistAvailable ? 'available' : 'locked_for_later' },
    { label: 'NAV recording available', status: input.isNavRecordingAvailable ? 'available' : 'locked_for_later' },
    { label: 'Next capability: Allocation / Mint', status: 'locked_for_later' },
    { label: 'Locked until required setup is complete', status: 'locked_for_later' },
  ];
}

export function toWorkspacePresentation(input: WorkspacePresentationInput): WorkspacePresentation {
  return {
    tabs: workspaceTabs,
    workspaceStatus: status(input),
    capabilityStatus: [
      { label: 'Wallet whitelist', status: input.isWalletWhitelistAvailable ? 'available' : 'locked_for_later' },
      { label: 'NAV recording', status: input.isNavRecordingAvailable ? 'available' : 'locked_for_later' },
      { label: 'Allocation / Mint', status: 'locked_for_later' },
      { label: 'Subscription template', status: 'needs_parameters' },
      { label: 'Redemption template', status: 'needs_parameters' },
      { label: 'Maturity closeout', status: 'locked_for_later' },
    ],
    productSetup: [
      { label: 'Requirements', detail: input.hasRequirementBrief ? 'Draft ready' : 'Needs review', status: input.hasRequirementBrief ? 'ready' : 'needs_review' },
      { label: 'Investor Wallets', detail: 'Wallets needed', status: 'wallet_needed' },
      { label: 'Smart Contract', detail: input.hasSmartContractSpec ? 'Core contract ready' : 'Needs parameters', status: input.hasSmartContractSpec ? 'ready' : 'needs_parameters' },
      { label: 'Evidence', detail: input.hasDeploymentEvidence ? 'Local session only' : 'Not started', status: 'local_session_only' },
    ],
    lifecycleSnapshot: [
      { label: 'Requirements', detail: input.hasRequirementBrief ? 'Draft ready' : 'Needs review', status: input.hasRequirementBrief ? 'ready' : 'needs_review' },
      { label: 'Investor Registry', detail: input.isInvestorRegistryActive ? 'Active' : 'Wallets needed', status: input.isInvestorRegistryActive ? 'ready' : 'wallet_needed' },
      { label: 'Subscription Template', detail: 'Parameters needed', status: 'needs_parameters' },
      { label: 'Redemption Template', detail: 'Delay not set', status: 'needs_parameters' },
    ],
    productVault: [
      { label: 'Requirement Brief', status: input.hasRequirementBrief ? 'Draft' : 'Pending' },
      { label: 'Engineering Brief', status: input.hasEngineeringBrief ? 'Draft' : 'Pending' },
      { label: 'Smart Contract Spec', status: input.hasSmartContractSpec ? 'Draft' : 'Pending' },
      { label: 'Contract Template (Sub-Redemption)', status: 'Draft' },
      { label: 'Investor Registry', status: input.isInvestorRegistryActive ? 'Active' : 'Pending' },
    ],
    openItems: [
      { label: 'Open questions', status: input.hasRequirementBrief ? 'draft' : 'needs_parameters' },
      { label: 'Subscription parameters', status: 'needs_parameters' },
      { label: 'Redemption parameters', status: 'needs_parameters' },
      { label: 'Maturity parameters', status: 'locked_for_later' },
      { label: 'Investor registry gaps', status: 'needs_parameters' },
    ],
  };
}
