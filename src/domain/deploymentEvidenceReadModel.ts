import type {
  WalletSignedDeploymentReceiptStatus,
  WalletSignedDeploymentState,
  WalletSignedDeploymentStatus,
} from './walletSignedDeploymentReadModel';

export type DeploymentEvidenceStatus =
  | 'not_started'
  | 'awaiting_wallet_confirmation'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'failed'
  | 'blocked';

export type DeploymentEvidenceStrength = 'none' | 'provider_transaction_hash' | 'confirmed_receipt';
export type TransactionHashSource = 'provider_returned' | 'absent';
export type ContractAddressSource = 'receipt_returned' | 'absent';
export type EvidencePersistence = 'local_session_only';

export type DeploymentEvidenceArtifactReference = {
  artifactPackageId?: string;
  contractName?: string;
  bytecodeHash?: string;
  compileCheckId?: string;
};

export type DeploymentEvidenceChain = {
  chainId: 11155111;
  networkName: 'Sepolia';
};

export type DeploymentEvidenceItem = {
  id: string;
  label: string;
  status: 'available' | 'not_available' | 'pending' | 'confirmed' | 'blocked';
  detail: string;
};

export type DeploymentEvidenceBoundaryItem = {
  id: string;
  label: string;
  status: 'enforced' | 'locked' | 'local_session_only';
  detail: string;
};

export type BuildDeploymentEvidenceReadModelInput = {
  deploymentState: WalletSignedDeploymentState;
  artifactReference?: DeploymentEvidenceArtifactReference;
  chain?: DeploymentEvidenceChain;
  operationsLocked?: true;
};

export type DeploymentEvidenceReadModel = {
  status: DeploymentEvidenceStatus;
  statusLabel: string;
  statusDetail: string;
  networkName: 'Sepolia';
  chainId: 11155111;
  evidenceStrength: DeploymentEvidenceStrength;
  evidenceStrengthLabel: string;
  transactionHashSource: TransactionHashSource;
  transactionHashSourceLabel: string;
  contractAddressSource: ContractAddressSource;
  contractAddressSourceLabel: string;
  evidencePersistence: EvidencePersistence;
  evidencePersistenceLabel: string;
  transactionHash?: string;
  contractAddress?: string;
  receiptStatus?: WalletSignedDeploymentReceiptStatus;
  sourceAttemptId?: string;
  sourceDeploymentStatus: WalletSignedDeploymentStatus;
  artifactReference?: DeploymentEvidenceArtifactReference;
  evidenceItems: DeploymentEvidenceItem[];
  boundaryItems: DeploymentEvidenceBoundaryItem[];
  blockingReasons: string[];
  nextStep: 'continue_deployment_flow' | 'track_15a_record_nav_event_later';
  operationsLocked: true;
};

const sepoliaChain: DeploymentEvidenceChain = {
  chainId: 11155111,
  networkName: 'Sepolia',
};

function evidenceStrengthLabel(strength: DeploymentEvidenceStrength): string {
  if (strength === 'provider_transaction_hash') return 'Provider transaction hash';
  if (strength === 'confirmed_receipt') return 'Confirmed receipt';
  return 'None';
}

function transactionHashSourceLabel(source: TransactionHashSource): string {
  return source === 'provider_returned' ? 'Provider returned' : 'Absent';
}

function contractAddressSourceLabel(source: ContractAddressSource): string {
  return source === 'receipt_returned' ? 'Receipt returned' : 'Absent';
}

function statusLabel(status: DeploymentEvidenceStatus): string {
  if (status === 'awaiting_wallet_confirmation') return 'Deployment Evidence: Wallet confirmation pending';
  if (status === 'submitted') return 'Deployment Evidence: Transaction submitted';
  if (status === 'confirmed') return 'Deployment Evidence: Confirmed from receipt';
  if (status === 'rejected') return 'Deployment Evidence: Rejected in wallet';
  if (status === 'failed') return 'Deployment Evidence: Failed';
  if (status === 'blocked') return 'Deployment Evidence: Blocked';
  return 'Deployment Evidence: Not available';
}

function statusDetail(status: DeploymentEvidenceStatus): string {
  if (status === 'awaiting_wallet_confirmation') {
    return 'Wallet confirmation was requested. No provider transaction hash or receipt-confirmed contract address is available yet.';
  }
  if (status === 'submitted') {
    return 'The provider returned a Sepolia transaction hash. Contract address remains absent until a successful receipt confirms contract creation.';
  }
  if (status === 'confirmed') {
    return 'Sepolia deployment is confirmed from a successful receipt. Record NAV can be gated by deployment evidence; other Smart Contract Operations remain locked.';
  }
  if (status === 'rejected') {
    return 'Deployment was rejected in the wallet. No confirmed deployment evidence exists.';
  }
  if (status === 'failed') {
    return 'Deployment failed or receipt status failed. Confirmed receipt evidence is not available.';
  }
  if (status === 'blocked') {
    return 'Deployment is blocked by a precondition. No transaction or contract evidence is available.';
  }
  return 'No wallet-signed deployment evidence is available yet.';
}

function blockingReasons(state: WalletSignedDeploymentState): string[] {
  if (state.deploymentStatus !== 'blocked') return [];
  return [state.errorMessage ?? 'Deployment blocked by a precondition.'];
}

function evidenceItems(input: {
  status: DeploymentEvidenceStatus;
  transactionHash?: string;
  contractAddress?: string;
  evidenceStrength: DeploymentEvidenceStrength;
}): DeploymentEvidenceItem[] {
  const { status, transactionHash, contractAddress, evidenceStrength } = input;
  const items: DeploymentEvidenceItem[] = [
    {
      id: 'deployment-evidence-local-session',
      label: 'Deployment Evidence',
      status: evidenceStrength === 'none' ? 'not_available' : evidenceStrength === 'confirmed_receipt' ? 'confirmed' : 'available',
      detail: 'Deployment Evidence: Local session only.',
    },
    {
      id: 'transaction-hash',
      label: 'Transaction hash',
      status: transactionHash ? 'available' : status === 'awaiting_wallet_confirmation' ? 'pending' : 'not_available',
      detail: transactionHash ? `Transaction hash: ${transactionHash}` : status === 'awaiting_wallet_confirmation' ? 'No transaction hash yet.' : 'No transaction hash.',
    },
    {
      id: 'contract-address',
      label: 'Contract address',
      status: contractAddress ? 'confirmed' : status === 'submitted' ? 'pending' : 'not_available',
      detail: contractAddress ? `Contract address: ${contractAddress}` : status === 'submitted' ? 'No contract address yet.' : 'No contract address.',
    },
    {
      id: 'operations-locked',
      label: 'Smart Contract Operations',
      status: 'blocked',
      detail: 'Other Smart Contract Operations: Locked.',
    },
  ];

  if (status === 'rejected') {
    items.push({
      id: 'wallet-rejection',
      label: 'Wallet rejection',
      status: 'blocked',
      detail: 'Deployment rejected in wallet.',
    });
  }

  if (status === 'failed') {
    items.push({
      id: 'deployment-failure',
      label: 'Deployment failure',
      status: 'blocked',
      detail: 'Deployment failed or receipt status failed.',
    });
  }

  return items;
}

function boundaryItems(): DeploymentEvidenceBoundaryItem[] {
  return [
    {
      id: 'local-session-only',
      label: 'Evidence persistence',
      status: 'local_session_only',
      detail: 'Evidence persistence: Local session only.',
    },
    {
      id: 'sepolia-only',
      label: 'Network',
      status: 'enforced',
      detail: 'Network: Sepolia. Mainnet disabled.',
    },
    {
      id: 'backend-private-keys',
      label: 'Backend private keys',
      status: 'enforced',
      detail: 'Backend never holds private keys.',
    },
    {
      id: 'operations-locked',
      label: 'Smart Contract Operations',
      status: 'locked',
      detail: 'Other Smart Contract Operations: Locked.',
    },
  ];
}

export function toDeploymentEvidenceReadModel(
  input: BuildDeploymentEvidenceReadModelInput,
): DeploymentEvidenceReadModel {
  const state = input.deploymentState;
  const status = state.deploymentStatus;
  const hasProviderTransactionHash = Boolean(state.transactionHash);
  const hasConfirmedReceiptContractAddress =
    status === 'confirmed' && state.receiptStatus === 'success' && Boolean(state.contractAddress);
  const transactionHash = hasProviderTransactionHash ? state.transactionHash : undefined;
  const contractAddress = hasConfirmedReceiptContractAddress ? state.contractAddress : undefined;
  const evidenceStrength: DeploymentEvidenceStrength = contractAddress
    ? 'confirmed_receipt'
    : transactionHash
      ? 'provider_transaction_hash'
      : 'none';
  const chain = input.chain ?? sepoliaChain;

  return {
    status,
    statusLabel: statusLabel(status),
    statusDetail: statusDetail(status),
    networkName: chain.networkName,
    chainId: chain.chainId,
    evidenceStrength,
    evidenceStrengthLabel: evidenceStrengthLabel(evidenceStrength),
    transactionHashSource: transactionHash ? 'provider_returned' : 'absent',
    transactionHashSourceLabel: transactionHashSourceLabel(transactionHash ? 'provider_returned' : 'absent'),
    contractAddressSource: contractAddress ? 'receipt_returned' : 'absent',
    contractAddressSourceLabel: contractAddressSourceLabel(contractAddress ? 'receipt_returned' : 'absent'),
    evidencePersistence: 'local_session_only',
    evidencePersistenceLabel: 'Local session only',
    transactionHash,
    contractAddress,
    receiptStatus: state.receiptStatus,
    sourceAttemptId: state.attemptId,
    sourceDeploymentStatus: state.deploymentStatus,
    artifactReference: input.artifactReference,
    evidenceItems: evidenceItems({ status, transactionHash, contractAddress, evidenceStrength }),
    boundaryItems: boundaryItems(),
    blockingReasons: blockingReasons(state),
    nextStep: contractAddress ? 'track_15a_record_nav_event_later' : 'continue_deployment_flow',
    operationsLocked: true,
  };
}
