import { fieldDisplayValue, type ProductSetupField, type ProductSetupReadModel, type ProductSetupRecord } from './productSetup';
import type { DeploymentEvidenceReadModel } from './deploymentEvidenceReadModel';
import type { RecordNavOperationReadModel } from './recordNavOperationReadModel';
import type { WalletAllocationMintOperationReadModel } from './walletAllocationMintOperationReadModel';
import type { WalletConnectionReadModel } from './walletConnectionReadModel';
import type { WalletWhitelistOperationReadModel } from './walletWhitelistOperationReadModel';

export type ContractOpsStatus = 'complete' | 'ready' | 'current' | 'needs_input' | 'needed_later' | 'locked' | 'blocked';

export type ContractOpsProgressStep = {
  id: string;
  label: string;
  status: ContractOpsStatus;
  detail: string;
};

export type ContractOpsSnapshotItem = {
  id: string;
  label: string;
  value: string;
  status: ContractOpsStatus;
  helper: string;
};

export type ContractOpsProtocolId = 'erc20' | 'custom_erc20' | 'erc3643' | 'erc4626' | 'erc1400' | 'erc7683';

export type ContractOpsProtocolOption = {
  id: ContractOpsProtocolId;
  protocolBase?: 'ERC-20' | 'Customised ERC-20' | 'ERC-3643' | 'ERC-4626';
  title: string;
  blurb: string;
  bestFor: string[];
  tradeoff: string;
  status: 'available' | 'planned';
  selected: boolean;
  recommended: boolean;
  executablePrototype: boolean;
  actionId: string;
};

export type ContractOpsSpecRow = {
  id: string;
  label: string;
  value: string;
  status: ContractOpsStatus;
  helper: string;
  editable?: boolean;
};

export type ContractOpsFeatureEventRow = {
  id: string;
  productRequirement: string;
  contractFeature: string;
  evidenceRecord: string;
  status: ContractOpsStatus;
  sourceTab: string;
  notes: string;
  deploymentCritical: boolean;
};

export type ContractOpsReadinessItem = {
  id: string;
  label: string;
  status: ContractOpsStatus;
  explanation: string;
  actionLabel?: string;
};

export type ContractOpsPostDeploymentCard = {
  id: string;
  title: string;
  status: ContractOpsStatus;
  needs: string;
  actionLabel: string;
};

export type ContractOpsCockpitReadModel = {
  progressSteps: ContractOpsProgressStep[];
  snapshotItems: ContractOpsSnapshotItem[];
  protocolOptions: ContractOpsProtocolOption[];
  recommendation: {
    protocol: string;
    confidence: 'High' | 'Medium' | 'Low';
    reasons: string[];
    whyNotPlainErc20: string;
    whenErc4626: string;
    whenErc1400: string;
    plannedOnly: string;
  };
  specRows: ContractOpsSpecRow[];
  featureEventRows: ContractOpsFeatureEventRow[];
  readinessItems: ContractOpsReadinessItem[];
  deploymentSummary: ContractOpsSpecRow[];
  evidenceRows: ContractOpsSpecRow[];
  postDeploymentCards: ContractOpsPostDeploymentCard[];
  launchHud: {
    statusLabel: string;
    blockers: string[];
    laterNeeds: string[];
    evidenceStatus: string;
  };
  deployButtonEnabled: boolean;
};

export type ContractOpsCockpitInput = {
  productSetupRecord: ProductSetupRecord;
  productSetupReadModel: ProductSetupReadModel;
  walletConnection: WalletConnectionReadModel;
  deploymentEvidence: DeploymentEvidenceReadModel;
  recordNavOperation: RecordNavOperationReadModel;
  walletWhitelistOperation: WalletWhitelistOperationReadModel;
  walletAllocationMintOperation: WalletAllocationMintOperationReadModel;
  contractSpecsConfirmed: boolean;
  featureMappingConfirmed: boolean;
  adminWalletInput: string;
  canRequestSepoliaDeployment: boolean;
  deploymentStatusLabel: string;
  walletStatusLabel: string;
  walletAddressDisplay?: string;
  chainStatusLabel: string;
  selectedProtocolOverride?: string;
};

export function toContractOpsCockpitReadModel(input: ContractOpsCockpitInput): ContractOpsCockpitReadModel {
  const selectedProtocol = selectedProtocolLabel(input);
  const recommendedProtocol = input.productSetupReadModel.protocolRecommendation.recommendedProtocol;
  const adminWallet = fieldValue(input.productSetupRecord.fields.admin_wallet) || input.adminWalletInput;
  const hasDeploymentEvidence = input.deploymentEvidence.status === 'confirmed';
  const walletReady = input.walletConnection.walletConnectionStatus === 'connected' && input.walletConnection.chainStatus === 'sepolia';
  const adminWalletReady = isLikelyEvmAddress(adminWallet);
  const templateAvailable = selectedProtocol !== 'ERC-7683' && selectedProtocol !== 'ERC-1400-style';
  const deployReady =
    input.canRequestSepoliaDeployment &&
    input.contractSpecsConfirmed &&
    input.featureMappingConfirmed &&
    adminWalletReady &&
    walletReady &&
    templateAvailable;

  const trueBlockers = [
    !selectedProtocol ? 'Choose a protocol base.' : '',
    !input.contractSpecsConfirmed ? 'Confirm the smart contract specification.' : '',
    !input.featureMappingConfirmed ? 'Confirm the feature and event mapping.' : '',
    !adminWalletReady ? 'Add a valid public admin wallet address.' : '',
    !walletReady ? 'Connect a wallet on Sepolia.' : '',
    !templateAvailable ? 'Choose an available Sepolia MVP contract template.' : '',
  ].filter(Boolean);

  const laterNeeds = [
    fieldValue(input.productSetupRecord.fields.expected_investor_count) ? '' : 'Investor wallet records can be completed in Investor Wallets before whitelist/allocation.',
    fieldValue(input.productSetupRecord.fields.subscription_stablecoins) ? '' : 'Stablecoin details can be completed in Subscription if payment is onchain.',
    fieldValue(input.productSetupRecord.fields.redemption_wallet) ? '' : 'Redemption wallet can be completed before redemption testing.',
    fieldValue(input.productSetupRecord.fields.nav_cadence) ? '' : 'NAV schedule can be completed before Record NAV evidence.',
  ].filter(Boolean);

  return {
    progressSteps: [
      progressStep('product-setup-received', 'Product Setup received', input.productSetupReadModel.completedEssentialCount > 0, 'Product profile and starter handoffs are available.'),
      {
        id: 'protocol-selected',
        label: 'ERC protocol selected',
        status: selectedProtocol ? 'ready' : 'needs_input',
        detail: selectedProtocol ? `${selectedProtocol} selected or recommended.` : 'Select one available protocol target.',
      },
      {
        id: 'specs-confirmed',
        label: 'Contract specs confirmed',
        status: input.contractSpecsConfirmed ? 'ready' : 'current',
        detail: input.contractSpecsConfirmed ? 'Specification accepted for deployment review.' : 'Review token parameters and role assumptions.',
      },
      {
        id: 'features-mapped',
        label: 'Features and events mapped',
        status: input.featureMappingConfirmed ? 'ready' : 'needs_input',
        detail: input.featureMappingConfirmed ? 'Lifecycle features are mapped.' : 'Confirm deployment-critical and evidence-only features.',
      },
      {
        id: 'sepolia-ready',
        label: 'Sepolia ready',
        status: deployReady ? 'ready' : trueBlockers.length > 0 ? 'needs_input' : 'current',
        detail: deployReady ? 'Wallet-signed deployment is available.' : trueBlockers[0] ?? 'Check wallet and readiness state.',
      },
      {
        id: 'deployment-evidence',
        label: 'Deployment evidence',
        status: hasDeploymentEvidence ? 'complete' : 'locked',
        detail: hasDeploymentEvidence ? input.deploymentEvidence.statusLabel : 'Created only after a real provider receipt.',
      },
    ],
    snapshotItems: toSnapshotItems(input),
    protocolOptions: toProtocolOptions(selectedProtocol, recommendedProtocol),
    recommendation: {
      protocol: recommendedProtocol,
      confidence: input.productSetupReadModel.protocolRecommendation.confidence >= 0.8 ? 'High' : 'Medium',
      reasons: input.productSetupReadModel.protocolRecommendation.reasons,
      whyNotPlainErc20:
        'Plain ERC-20 is the simplest fungible-token base, but it needs added controls when transfers must stay within approved wallets.',
      whenErc4626:
        'ERC-4626 is stronger when the product behaves like vault shares with deposit, withdrawal, and share accounting.',
      whenErc1400:
        'ERC-1400-style controls are useful for partitions, tranches, or investor-class mechanics, but are better treated as later enterprise templates.',
      plannedOnly: 'ERC-1400-style and ERC-7683 are not selectable for the Sepolia MVP.',
    },
    specRows: toSpecRows(input, selectedProtocol, adminWallet),
    featureEventRows: toFeatureEventRows(hasDeploymentEvidence),
    readinessItems: toReadinessItems({
      specsConfirmed: input.contractSpecsConfirmed,
      featureMappingConfirmed: input.featureMappingConfirmed,
      selectedProtocol,
      adminWalletReady,
      walletReady,
      templateAvailable,
      evidenceCaptureEnabled: true,
    }),
    deploymentSummary: [
      specRow('selected-protocol', 'Selected protocol', selectedProtocol || 'To be selected', selectedProtocol ? 'ready' : 'needs_input', 'The contract template follows this protocol target.'),
      specRow('chain', 'Chain', 'Ethereum Sepolia', 'locked', 'MVP deployments stay on Sepolia testnet.'),
      specRow('signer-wallet', 'Signer wallet', input.walletAddressDisplay || 'Connect wallet', walletReady ? 'ready' : 'needs_input', 'Your wallet signs the deployment. ZiliOS does not hold private keys.'),
      specRow('admin-wallet', 'Admin wallet', adminWalletReady ? adminWallet : 'Needs valid public address', adminWalletReady ? 'ready' : 'needs_input', 'The admin wallet manages roles and emergency controls.'),
      specRow('backend-key-status', 'Backend key status', 'No private keys held', 'ready', 'Wallet signing stays in the browser wallet.'),
      specRow('evidence-capture', 'Evidence capture', 'Provider receipt and Evidence Vault handoff', 'ready', 'Evidence is created from real provider results.'),
      specRow('deployment-status', 'Deployment status', input.deploymentStatusLabel, hasDeploymentEvidence ? 'complete' : 'current', 'Deployment status comes from the wallet-signed Sepolia adapter.'),
    ],
    evidenceRows: toEvidenceRows(input),
    postDeploymentCards: [
      postDeployCard('whitelist-wallet', 'Whitelist investor wallet', hasDeploymentEvidence, 'Investor wallet record and whitelist target.'),
      postDeployCard('allocation-mint', 'Submit allocation / mint', hasDeploymentEvidence, 'Whitelisted investor wallet, subscription settings, and token amount.'),
      postDeployCard('record-nav', 'Record NAV event', hasDeploymentEvidence, 'NAV payload and confirmed deployment evidence.'),
      postDeployCard('test-redemption', 'Test redemption', hasDeploymentEvidence, 'Redemption parameters and burn/lock rule.'),
      postDeployCard('review-maturity', 'Review maturity setup', hasDeploymentEvidence, 'Maturity date, final redemption assumptions, and closeout rules.'),
    ],
    launchHud: {
      statusLabel: deployReady ? 'Ready for wallet signature' : `${trueBlockers.length} launch blocker(s)`,
      blockers: trueBlockers.slice(0, 4),
      laterNeeds: laterNeeds.slice(0, 3),
      evidenceStatus: input.deploymentEvidence.statusLabel,
    },
    deployButtonEnabled: deployReady,
  };
}

function selectedProtocolLabel(input: ContractOpsCockpitInput): string {
  const selected = input.selectedProtocolOverride || fieldValue(input.productSetupRecord.fields.protocol_base);
  return selected || input.productSetupReadModel.protocolRecommendation.recommendedProtocol;
}

function fieldValue(field: ProductSetupField): string {
  return fieldDisplayValue(field) || field.rolePlaceholder || '';
}

function progressStep(id: string, label: string, ready: boolean, detail: string): ContractOpsProgressStep {
  return { id, label, status: ready ? 'ready' : 'needs_input', detail };
}

function toSnapshotItems(input: ContractOpsCockpitInput): ContractOpsSnapshotItem[] {
  const record = input.productSetupRecord;
  return [
    snapshotItem('product-name', 'Product name', record.fields.product_name, 'Contract name needs a product label.'),
    snapshotItem('token-name', 'Token name', record.fields.product_name, 'Contract Ops can use this as the token name unless edited here.'),
    snapshotItem('token-symbol', 'Token symbol', record.fields.token_symbol, 'Short token symbol used by wallets and explorers.'),
    snapshotItem('product-type', 'Product type', record.fields.product_wrapper, 'Product wrapper informs the template fit.'),
    snapshotItem('expected-investors', 'Expected investors', record.fields.expected_investor_count, 'Investor cap affects whitelist/allocation capacity.', 'needed_later'),
    snapshotItem('investor-wallet-rule', 'Investor wallet rule', record.fields.investor_wallet_rule, 'Whitelist rules drive transfer restrictions.', 'needed_later'),
    snapshotItem('transfer-rule', 'Transfer rule', record.fields.whitelisted_wallets_required, 'Controls whether recipients must be approved wallets.'),
    snapshotItem('subscription-model', 'Subscription model', record.fields.subscription_cadence, 'Used later for mint scheduling.', 'needed_later'),
    snapshotItem('redemption-model', 'Redemption model', record.fields.redemption_cadence, 'Used later for burn/redemption workflow.', 'needed_later'),
    snapshotItem('nav-cadence', 'Valuation / NAV cadence', record.fields.nav_cadence, 'Used later by Record NAV evidence.', 'needed_later'),
    snapshotItem('admin-wallet', 'Admin wallet', record.fields.admin_wallet, 'Deployment blocker: a valid public admin wallet is required.'),
    snapshotItem('issuer-treasury-wallet', 'Issuer / treasury wallet', record.fields.subscription_receiving_wallet, 'Needed when subscription funds are tracked onchain.', 'needed_later'),
    snapshotItem('redemption-wallet', 'Redemption wallet', record.fields.redemption_wallet, 'Needed before redemption testing.', 'needed_later'),
  ];
}

function snapshotItem(
  id: string,
  label: string,
  field: ProductSetupField,
  helper: string,
  emptyStatus: ContractOpsStatus = 'needs_input',
): ContractOpsSnapshotItem {
  const value = fieldValue(field);
  return {
    id,
    label,
    value: value || 'To be filled',
    status: value ? statusFromField(field) : emptyStatus,
    helper,
  };
}

function statusFromField(field: ProductSetupField): ContractOpsStatus {
  if (field.status === 'user_confirmed' || field.status === 'user_stated' || field.status === 'locked' || field.status === 'system_default') {
    return 'ready';
  }
  if (field.status === 'inferred') return 'current';
  if (field.status === 'deferred') return 'needed_later';
  if (field.status === 'conflicting') return 'blocked';
  return 'needs_input';
}

function toProtocolOptions(selectedProtocol: string, recommendedProtocol: string): ContractOpsProtocolOption[] {
  return [
    {
      id: 'erc20',
      protocolBase: 'ERC-20',
      title: 'ERC-20 — Simple fungible token',
      blurb: 'A basic standard for fungible token units.',
      bestFor: ['Simple demo token', 'Open transfer model', 'Minimal lifecycle controls'],
      tradeoff: 'Too permissive for many tokenised investment products unless extended.',
      status: 'available',
      selected: selectedProtocol === 'ERC-20',
      recommended: recommendedProtocol === 'ERC-20',
      executablePrototype: true,
      actionId: 'select-protocol-erc20',
    },
    {
      id: 'custom_erc20',
      protocolBase: 'Customised ERC-20',
      title: 'Customised ERC-20 — MVP controls',
      blurb: 'An ERC-20-compatible path with whitelist, mint, burn, pause, roles, and evidence events.',
      bestFor: ['Sepolia MVP', 'Whitelist-style controls', 'Wallet-signed test deployment'],
      tradeoff: 'It is practical for the current prototype but is not a full ERC-3643 adapter.',
      status: 'available',
      selected: selectedProtocol === 'Customised ERC-20',
      recommended: recommendedProtocol === 'Customised ERC-20',
      executablePrototype: true,
      actionId: 'select-protocol-custom-erc20',
    },
    {
      id: 'erc3643',
      protocolBase: 'ERC-3643',
      title: 'ERC-3643 — Permissioned investment token',
      blurb: 'A permissioned token model for controlled transfers and approved investor wallets.',
      bestFor: ['Tokenised funds', 'Approved investor wallets', 'Restricted transfers'],
      tradeoff: 'Better architecture fit for permissioned products, but full adapter work is beyond the current ERC-20-compatible prototype.',
      status: 'available',
      selected: selectedProtocol === 'ERC-3643',
      recommended: recommendedProtocol === 'ERC-3643',
      executablePrototype: false,
      actionId: 'select-protocol-erc3643',
    },
    {
      id: 'erc4626',
      protocolBase: 'ERC-4626',
      title: 'ERC-4626 — Tokenised vault / fund-share model',
      blurb: 'A vault standard where tokens represent shares in an asset pool.',
      bestFor: ['Vault shares', 'Deposit / withdrawal flows', 'NAV-like share accounting'],
      tradeoff: 'May still need whitelist and transfer restrictions for investment products.',
      status: 'available',
      selected: selectedProtocol === 'ERC-4626',
      recommended: recommendedProtocol === 'ERC-4626',
      executablePrototype: false,
      actionId: 'select-protocol-erc4626',
    },
    {
      id: 'erc1400',
      title: 'ERC-1400-style — Security-token controls',
      blurb: 'A security-token-style approach for partitions, investor classes, and institutional lifecycle controls.',
      bestFor: ['Investor classes', 'Tranches', 'Partitioned securities'],
      tradeoff: 'Powerful but complex. Treat as a later enterprise template unless clearly required.',
      status: 'planned',
      selected: selectedProtocol === 'ERC-1400-style',
      recommended: false,
      executablePrototype: false,
      actionId: 'select-protocol-erc1400-disabled',
    },
    {
      id: 'erc7683',
      title: 'ERC-7683 — Cross-chain intents',
      blurb: 'A planned cross-chain intent layer for future settlement or liquidity routing.',
      bestFor: ['Future cross-chain routing', 'Future liquidity workflows'],
      tradeoff: 'Planned only and not available for the Sepolia MVP.',
      status: 'planned',
      selected: false,
      recommended: false,
      executablePrototype: false,
      actionId: 'select-protocol-erc7683-disabled',
    },
  ];
}

function toSpecRows(input: ContractOpsCockpitInput, selectedProtocol: string, adminWallet: string): ContractOpsSpecRow[] {
  const record = input.productSetupRecord;
  return [
    specRow('selected-erc-protocol', 'Selected ERC protocol', selectedProtocol || 'To be selected', selectedProtocol ? 'ready' : 'needs_input', 'The protocol target drives the contract template and later lifecycle questions.'),
    specRow('contract-template', 'Contract template', templateForProtocol(selectedProtocol), selectedProtocol ? 'ready' : 'needs_input', 'Template availability stays Sepolia/testnet-only in this MVP.'),
    specRow('contract-name', 'Contract name', fieldValue(record.fields.product_name) || 'To be filled', fieldValue(record.fields.product_name) ? 'ready' : 'needs_input', 'Name displayed by downstream contract documentation.'),
    specRow('token-symbol', 'Token symbol', fieldValue(record.fields.token_symbol) || 'To be filled', fieldValue(record.fields.token_symbol) ? 'ready' : 'needs_input', 'Short symbol shown by wallets and explorers.'),
    specRow('decimals', 'Decimals', '18', 'ready', 'Common ERC-20-compatible token precision for the MVP.'),
    specRow('supply-model', 'Supply model', 'Mintable with admin control', 'ready', 'Supply starts at zero and is minted after approved subscriptions/allocation.'),
    specRow('initial-supply', 'Initial supply', '0', 'ready', 'No tokens are created at deployment.'),
    specRow('minting-rule', 'Minting rule', 'Only authorised issuer/admin can mint', 'ready', 'Mint means creating token units and assigning them to a wallet.'),
    specRow('burning-rule', 'Burning / redemption rule', fieldValue(record.fields.burn_lock_rule) || 'Burn on redemption confirmation', fieldValue(record.fields.burn_lock_rule) ? 'ready' : 'needed_later', 'Burn means permanently removing token units after redemption is approved.'),
    specRow('transfer-rule', 'Transfer rule', fieldValue(record.fields.investor_wallet_rule) || 'Only approved wallets can receive or transfer', 'ready', 'Whitelist means only approved public wallet addresses can hold or receive the token.'),
    specRow('admin-wallet', 'Admin wallet', adminWallet || 'Needs input', isLikelyEvmAddress(adminWallet) ? 'ready' : 'needs_input', 'The public wallet allowed to manage contract roles. Never paste private keys.', true),
    specRow('deployment-chain', 'Deployment chain', 'Ethereum Sepolia', 'locked', 'Sepolia testnet only for the MVP.'),
    specRow('upgradeability', 'Upgradeability', 'Disabled for MVP', 'locked', 'Keeps the testnet deployment simpler and easier to inspect.'),
    specRow('pause', 'Pause / emergency stop', 'Enabled in template', 'ready', 'Pause can temporarily stop sensitive contract actions if something goes wrong.'),
    specRow('evidence-capture', 'Evidence capture mode', 'Provider receipts and Evidence Vault handoff', 'ready', 'Evidence is derived from real provider responses, not placeholder hashes.'),
  ];
}

function specRow(
  id: string,
  label: string,
  value: string,
  status: ContractOpsStatus,
  helper: string,
  editable = false,
): ContractOpsSpecRow {
  return { id, label, value, status, helper, editable };
}

function templateForProtocol(protocol: string): string {
  if (protocol === 'ERC-3643') return 'Permissioned Fund Token target';
  if (protocol === 'ERC-4626') return 'Vault Share Token target';
  if (protocol === 'ERC-20') return 'Simple ERC-20-compatible token';
  if (protocol === 'Customised ERC-20') return 'Restricted ERC-20-compatible MVP token';
  return 'Template to be confirmed';
}

function toFeatureEventRows(hasDeploymentEvidence: boolean): ContractOpsFeatureEventRow[] {
  return [
    featureRow('approved-wallets', 'Approved investor wallets only', 'Whitelist / permissioned transfer control', 'InvestorWalletApproved, WalletWhitelisted', 'needed_later', 'Investor Wallets', 'Required before allocation/mint.', true),
    featureRow('subscription-allocation', 'Subscription allocation', 'Controlled mint', 'TokensMinted, AllocationSubmitted', 'needed_later', 'Subscription', 'Requires investor wallet and allocation amount.', false),
    featureRow('nav-updates', 'NAV / valuation updates', 'Offchain evidence event for MVP', 'NavRecorded', 'needed_later', 'Asset Servicing', 'MVP may record NAV as evidence rather than onchain state.', false),
    featureRow('redemption', 'Redemption', 'Burn or lock on redemption', 'RedemptionRequested, TokensBurned', 'needs_input', 'Redemption', 'User must choose burn or lock behaviour.', false),
    featureRow('maturity', 'Maturity', 'Lifecycle status / final redemption evidence', 'MaturityProcessed', 'needed_later', 'Maturity', 'Relevant for fixed-term products.', false),
    featureRow('pause', 'Emergency pause', 'Pausable contract control', 'ContractPaused, ContractUnpaused', 'ready', 'Contract Ops', 'Admin wallet can pause sensitive actions in the testnet template.', true),
    featureRow('deployment-evidence', 'Deployment evidence', 'Deployment receipt capture', 'ContractDeployed', hasDeploymentEvidence ? 'complete' : 'ready', 'Contract Ops', 'Captures address, transaction hash, chain ID, signer, ABI hash, and bytecode hash.', true),
  ];
}

function featureRow(
  id: string,
  productRequirement: string,
  contractFeature: string,
  evidenceRecord: string,
  status: ContractOpsStatus,
  sourceTab: string,
  notes: string,
  deploymentCritical: boolean,
): ContractOpsFeatureEventRow {
  return { id, productRequirement, contractFeature, evidenceRecord, status, sourceTab, notes, deploymentCritical };
}

function toReadinessItems(input: {
  specsConfirmed: boolean;
  featureMappingConfirmed: boolean;
  selectedProtocol: string;
  adminWalletReady: boolean;
  walletReady: boolean;
  templateAvailable: boolean;
  evidenceCaptureEnabled: boolean;
}): ContractOpsReadinessItem[] {
  return [
    readinessItem('product-setup', 'Product setup received', 'ready', 'Contract Ops has access to the Product Setup PRD intake state.'),
    readinessItem('protocol', 'ERC protocol selected', input.selectedProtocol ? 'ready' : 'needs_input', input.selectedProtocol ? `${input.selectedProtocol} is selected for review.` : 'Choose an available protocol.'),
    readinessItem('specs', 'Contract specs confirmed', input.specsConfirmed ? 'ready' : 'needs_input', 'Confirm the specification before deployment.'),
    readinessItem('features', 'Features/events mapping confirmed', input.featureMappingConfirmed ? 'ready' : 'needs_input', 'Confirm what is in-contract versus evidence-only.'),
    readinessItem('admin-wallet', 'Admin wallet provided', input.adminWalletReady ? 'ready' : 'blocked', 'A valid public admin wallet is required.'),
    readinessItem('wallet', 'Wallet connected', input.walletReady ? 'ready' : 'needs_input', 'Connect a wallet on Sepolia.'),
    readinessItem('network', 'Network is Sepolia', input.walletReady ? 'ready' : 'needs_input', 'MVP deployments stay on Sepolia testnet.'),
    readinessItem('template', 'Contract template available', input.templateAvailable ? 'ready' : 'blocked', 'ERC-1400-style and ERC-7683 are not available for Sepolia MVP deployment.'),
    readinessItem('evidence', 'Evidence capture enabled', input.evidenceCaptureEnabled ? 'ready' : 'blocked', 'Deployment evidence will be captured from real provider receipts.'),
    readinessItem('investor-wallets', 'Investor wallets', 'needed_later', 'Needed before whitelist and allocation/mint, not always before base contract deployment.'),
  ];
}

function readinessItem(id: string, label: string, status: ContractOpsStatus, explanation: string): ContractOpsReadinessItem {
  return { id, label, status, explanation };
}

function toEvidenceRows(input: ContractOpsCockpitInput): ContractOpsSpecRow[] {
  if (input.deploymentEvidence.status !== 'confirmed') {
    return [
      specRow('deployment-evidence', 'Deployment evidence', 'No deployment evidence yet', 'locked', 'Evidence appears only after a real Sepolia provider receipt.'),
      specRow('record-nav', 'Record NAV', input.recordNavOperation.statusLabel, 'needed_later', 'Record NAV requires confirmed deployment evidence.'),
      specRow('wallet-whitelist', 'Wallet whitelist', input.walletWhitelistOperation.statusLabel, 'needed_later', 'Whitelist execution requires confirmed deployment evidence and a target wallet.'),
      specRow('allocation-mint', 'Allocation / Mint', input.walletAllocationMintOperation.statusLabel, 'needed_later', 'Allocation/mint requires whitelist and subscription allocation readiness.'),
    ];
  }

  return [
    specRow('contract-address', 'Contract address', input.deploymentEvidence.contractAddress ?? 'Not available', 'complete', 'Receipt-returned address from the Sepolia provider.'),
    specRow('transaction-hash', 'Transaction hash', input.deploymentEvidence.transactionHash ?? 'Not available', 'complete', 'Receipt-linked deployment transaction.'),
    specRow('chain', 'Chain', `${input.deploymentEvidence.networkName} (${input.deploymentEvidence.chainId})`, 'complete', 'Deployment chain from provider evidence.'),
    specRow('evidence-strength', 'Evidence strength', input.deploymentEvidence.evidenceStrengthLabel, 'complete', 'Shows whether evidence came from a confirmed provider receipt.'),
    specRow('record-nav', 'Record NAV', input.recordNavOperation.statusLabel, input.recordNavOperation.operationStatus === 'confirmed' ? 'complete' : 'needed_later', input.recordNavOperation.statusDetail),
    specRow('wallet-whitelist', 'Wallet whitelist', input.walletWhitelistOperation.statusLabel, input.walletWhitelistOperation.operationStatus === 'confirmed' ? 'complete' : 'needed_later', input.walletWhitelistOperation.statusDetail),
    specRow('allocation-mint', 'Allocation / Mint', input.walletAllocationMintOperation.statusLabel, input.walletAllocationMintOperation.operationStatus === 'confirmed' ? 'complete' : 'needed_later', input.walletAllocationMintOperation.statusDetail),
  ];
}

function postDeployCard(id: string, title: string, unlocked: boolean, needs: string): ContractOpsPostDeploymentCard {
  return {
    id,
    title,
    status: unlocked ? 'current' : 'locked',
    needs,
    actionLabel: title,
  };
}

function isLikelyEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim()) && value.toLowerCase() !== '0x0000000000000000000000000000000000000000';
}
