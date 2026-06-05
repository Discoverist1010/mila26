import type {
  DeploymentExecutionStatus,
  DeploymentGateReadModel,
  DeploymentGateStatus,
  PreDeploymentReadiness,
} from './deploymentGateReadModel';

export type WalletSigningIntentStatus = 'blocked' | 'review_ready';
export type WalletExecutionStatus = 'not_implemented';
export type WalletSigningReviewItemStatus = 'ready' | 'blocked';
export type WalletSigningBoundaryStatus = 'enforced' | 'not_implemented' | 'absent';
export type FutureTransactionRequirementStatus = 'future_required';

export type WalletSigningReviewItem = {
  id: string;
  label: string;
  status: WalletSigningReviewItemStatus;
  detail: string;
};

export type WalletSigningBoundary = {
  id: string;
  label: string;
  status: WalletSigningBoundaryStatus;
  detail: string;
};

export type FutureTransactionRequirement = {
  id: string;
  label: string;
  status: FutureTransactionRequirementStatus;
  detail: string;
};

export type WalletSigningIntentReadModel = {
  intentStatus: WalletSigningIntentStatus;
  walletExecutionStatus: WalletExecutionStatus;
  sourceDeploymentGate: {
    gateStatus: DeploymentGateStatus;
    preDeploymentReadiness: PreDeploymentReadiness;
    deploymentExecutionStatus: DeploymentExecutionStatus;
  };
  requiredReviewItems: WalletSigningReviewItem[];
  blockedReasons: string[];
  signingBoundaries: WalletSigningBoundary[];
  futureTransactionRequirements: FutureTransactionRequirement[];
};

const reviewItemDefinitions: Array<{ id: string; label: string; detail: string }> = [
  {
    id: 'requirement-brief-reviewed',
    label: 'Requirement Brief reviewed',
    detail: 'User reviews the approved requirement objective, assumptions, and constraints before any signing track.',
  },
  {
    id: 'engineering-brief-reviewed',
    label: 'Engineering Brief reviewed',
    detail: 'User reviews the engineering plan that informed the smart-contract specification.',
  },
  {
    id: 'closure-open-items-reviewed',
    label: 'Project Closure / Open Items reviewed',
    detail: 'User confirms closure blockers and unresolved items have been reviewed.',
  },
  {
    id: 'smart-contract-spec-reviewed',
    label: 'Smart Contract Artifact Spec reviewed',
    detail: 'User reviews the restricted ERC-20-compatible smart-contract specification.',
  },
  {
    id: 'artifact-preview-reviewed',
    label: 'Smart Contract Artifact Preview reviewed',
    detail: 'User reviews the deterministic artifact preview and its preview-only limitations.',
  },
  {
    id: 'check-result-reviewed',
    label: 'Check Result reviewed',
    detail: 'User reviews spec-consistency and local compile/test check results.',
  },
  {
    id: 'evidence-lite-reviewed',
    label: 'Evidence-Lite reviewed',
    detail: 'User reviews the evidence-lite links that explain the artifact and checks.',
  },
  {
    id: 'local-compile-test-reviewed',
    label: 'Local Compile/Test result reviewed',
    detail: 'User reviews the known local Hardhat compile/test result representation.',
  },
  {
    id: 'deployment-gate-reviewed',
    label: 'Deployment Gate reviewed',
    detail: 'User reviews the deployment gate before any later wallet-signing design.',
  },
  {
    id: 'safety-boundaries-reviewed',
    label: 'Safety boundaries reviewed',
    detail: 'User reviews testnet-only, no-backend-private-key, no-mainnet, and no-execution boundaries.',
  },
];

const signingBoundaries: WalletSigningBoundary[] = [
  {
    id: 'backend-never-holds-private-keys',
    label: 'Backend must never hold user private keys',
    status: 'enforced',
    detail: 'MILA26 backend private-key custody remains prohibited.',
  },
  {
    id: 'user-wallet-signs-future-deployment',
    label: 'User wallet signs future deployment transaction',
    status: 'enforced',
    detail: 'Any future deployment transaction must be confirmed by the user wallet.',
  },
  {
    id: 'wallet-signing-not-implemented',
    label: 'Wallet signing is not implemented yet',
    status: 'not_implemented',
    detail: 'This intent review defines signing readiness only and does not make signing executable.',
  },
  {
    id: 'wallet-connection-not-implemented',
    label: 'Wallet connection is not implemented yet',
    status: 'not_implemented',
    detail: 'Browser wallet/provider integration remains a later track.',
  },
  {
    id: 'deployment-execution-not-implemented',
    label: 'Deployment execution is not implemented yet',
    status: 'not_implemented',
    detail: 'No transaction preparation, submission, or deployment execution exists in this readiness step.',
  },
  {
    id: 'ethereum-testnet-only',
    label: 'Ethereum testnet only',
    status: 'enforced',
    detail: 'Future signing work remains limited to Ethereum testnet planning.',
  },
  {
    id: 'mainnet-disabled',
    label: 'Mainnet disabled',
    status: 'enforced',
    detail: 'Mainnet configuration remains disabled in the MVP.',
  },
  {
    id: 'contract-address-absent',
    label: 'No contract address exists',
    status: 'absent',
    detail: 'Contract address remains absent because deployment has not happened.',
  },
  {
    id: 'transaction-hash-absent',
    label: 'No transaction hash exists',
    status: 'absent',
    detail: 'Transaction hash remains absent because no transaction has been submitted.',
  },
  {
    id: 'signed-payload-absent',
    label: 'No signed payload exists',
    status: 'absent',
    detail: 'Signed payload remains absent because wallet signing is not implemented.',
  },
  {
    id: 'submitted-transaction-absent',
    label: 'No submitted transaction exists',
    status: 'absent',
    detail: 'Submitted transaction remains absent because deployment execution is not implemented.',
  },
  {
    id: 'confirmed-transaction-absent',
    label: 'No confirmed transaction exists',
    status: 'absent',
    detail: 'Confirmed transaction remains absent because no deployment transaction exists.',
  },
  {
    id: 'audit-not-performed',
    label: 'Audit not performed',
    status: 'enforced',
    detail: 'No production security audit is claimed by this intent model.',
  },
];

const futureTransactionRequirements: FutureTransactionRequirement[] = [
  {
    id: 'user-controlled-wallet-address',
    label: 'User-controlled wallet address required later',
    status: 'future_required',
    detail: 'A later wallet track must obtain the user wallet address from a browser wallet/provider.',
  },
  {
    id: 'browser-wallet-provider',
    label: 'Browser wallet/provider integration required later',
    status: 'future_required',
    detail: 'A later track must choose and wire a wallet provider boundary before signing can occur.',
  },
  {
    id: 'target-ethereum-testnet-chain',
    label: 'Target Ethereum testnet chain selection required later',
    status: 'future_required',
    detail: 'A later track must define the allowed testnet chain before preparing any transaction.',
  },
  {
    id: 'deployable-contract-artifact',
    label: 'Deployable contract artifact required later',
    status: 'future_required',
    detail: 'A later track must provide compiled bytecode and ABI suitable for testnet deployment.',
  },
  {
    id: 'constructor-deployment-parameters',
    label: 'Constructor/deployment parameters required later',
    status: 'future_required',
    detail: 'A later track must derive deployment parameters from approved artifacts and review them with the user.',
  },
  {
    id: 'explicit-wallet-confirmation',
    label: 'Explicit wallet confirmation required later',
    status: 'future_required',
    detail: 'A later track must require clear user review before the wallet signs any deployment transaction.',
  },
  {
    id: 'transaction-submission-tracking-model',
    label: 'Transaction submission and confirmation tracking model required later',
    status: 'future_required',
    detail: 'A later deployment track must define transaction submission and confirmation state before execution.',
  },
];

function reviewStatusFromGate(deploymentGate: DeploymentGateReadModel): WalletSigningReviewItemStatus {
  return deploymentGate.gateStatus === 'review_ready' ? 'ready' : 'blocked';
}

function blockedReasonsFromGate(deploymentGate: DeploymentGateReadModel): string[] {
  if (deploymentGate.gateStatus === 'review_ready') {
    return ['Wallet execution remains blocked because wallet integration is not implemented.'];
  }

  return [
    'Wallet signing intent is blocked until Deployment Gate Review is review-ready.',
    ...deploymentGate.blockedReasons,
    'Wallet execution remains blocked because wallet integration is not implemented.',
  ];
}

export function toWalletSigningIntentReadModel(deploymentGate: DeploymentGateReadModel): WalletSigningIntentReadModel {
  const intentStatus = deploymentGate.gateStatus === 'review_ready' ? 'review_ready' : 'blocked';
  const reviewStatus = reviewStatusFromGate(deploymentGate);

  return {
    intentStatus,
    walletExecutionStatus: 'not_implemented',
    sourceDeploymentGate: {
      gateStatus: deploymentGate.gateStatus,
      preDeploymentReadiness: deploymentGate.preDeploymentReadiness,
      deploymentExecutionStatus: deploymentGate.deploymentExecutionStatus,
    },
    requiredReviewItems: reviewItemDefinitions.map((item) => ({
      ...item,
      status: reviewStatus,
    })),
    blockedReasons: blockedReasonsFromGate(deploymentGate),
    signingBoundaries,
    futureTransactionRequirements,
  };
}
