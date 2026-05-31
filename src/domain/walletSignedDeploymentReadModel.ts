export type WalletSignedDeploymentStatus =
  | 'not_started'
  | 'blocked'
  | 'awaiting_wallet_confirmation'
  | 'submitted'
  | 'confirmed'
  | 'rejected'
  | 'failed';

export type WalletSignedDeploymentErrorCode =
  | 'provider_unavailable'
  | 'wallet_not_connected'
  | 'wrong_chain'
  | 'account_changed'
  | 'intent_blocked'
  | 'artifact_missing'
  | 'constructor_args_missing'
  | 'duplicate_attempt'
  | 'provider_rejected'
  | 'provider_error'
  | 'receipt_failed';

export type WalletSignedDeploymentReceiptStatus = 'pending' | 'success' | 'failed';

export type WalletSignedDeploymentState = {
  deploymentStatus: WalletSignedDeploymentStatus;
  attemptId?: string;
  transactionHash?: string;
  contractAddress?: string;
  receiptStatus?: WalletSignedDeploymentReceiptStatus;
  errorCode?: WalletSignedDeploymentErrorCode;
  errorMessage?: string;
  localSessionOnly: true;
};

export const initialWalletSignedDeploymentState: WalletSignedDeploymentState = {
  deploymentStatus: 'not_started',
  localSessionOnly: true,
};

export function isDeploymentAttemptInFlight(state: WalletSignedDeploymentState): boolean {
  return state.deploymentStatus === 'awaiting_wallet_confirmation' || state.deploymentStatus === 'submitted';
}

export function formatWalletSignedDeploymentStatus(status: WalletSignedDeploymentStatus): string {
  switch (status) {
    case 'awaiting_wallet_confirmation':
      return 'Awaiting wallet confirmation';
    case 'submitted':
      return 'Deployment submitted to Sepolia';
    case 'confirmed':
      return 'Deployment confirmed on Sepolia';
    case 'rejected':
      return 'Deployment rejected in wallet';
    case 'failed':
      return 'Deployment failed';
    case 'blocked':
      return 'Deployment blocked';
    case 'not_started':
      return 'Deployment execution not started';
  }
}

