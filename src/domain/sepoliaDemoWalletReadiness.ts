import type { WalletConnectionReadModel } from './walletConnectionReadModel';

export type SepoliaDemoWalletReadinessStatus =
  | 'not_started'
  | 'checking'
  | 'ready'
  | 'needs_funding'
  | 'blocked'
  | 'failed';

export type SepoliaDemoWalletReadinessState = {
  checkStatus: SepoliaDemoWalletReadinessStatus;
  checkedWalletAddress?: string;
  signerBalanceWei?: string;
  errorMessage?: string;
  localSessionOnly: true;
};

export type SepoliaDemoWalletReadinessItem = {
  label: string;
  status: 'ready' | 'needs_funding' | 'blocked' | 'pending';
  detail: string;
};

export type SepoliaDemoWalletReadinessReadModel = {
  status: SepoliaDemoWalletReadinessStatus;
  statusLabel: string;
  statusDetail: string;
  canCheckReadiness: boolean;
  disabledReason?: string;
  checkedWalletAddress?: string;
  signerBalanceEth?: string;
  items: SepoliaDemoWalletReadinessItem[];
};

export const initialSepoliaDemoWalletReadinessState: SepoliaDemoWalletReadinessState = {
  checkStatus: 'not_started',
  localSessionOnly: true,
};

export const MINIMUM_DEMO_SIGNER_BALANCE_WEI = 1_000_000_000_000_000n;

export function isSepoliaDemoWalletReadinessInFlight(state: SepoliaDemoWalletReadinessState): boolean {
  return state.checkStatus === 'checking';
}

export function formatWeiAsEth(wei: string | undefined): string | undefined {
  if (!wei) return undefined;

  try {
    const value = BigInt(wei);
    const whole = value / 1_000_000_000_000_000_000n;
    const fractional = (value % 1_000_000_000_000_000_000n).toString().padStart(18, '0').slice(0, 6);
    return `${whole.toString()}.${fractional} ETH`;
  } catch {
    return undefined;
  }
}

export function signerHasMinimumDemoBalance(balanceWei: string | undefined): boolean {
  if (!balanceWei) return false;

  try {
    return BigInt(balanceWei) >= MINIMUM_DEMO_SIGNER_BALANCE_WEI;
  } catch {
    return false;
  }
}

export function toSepoliaDemoWalletReadinessReadModel(input: {
  state: SepoliaDemoWalletReadinessState;
  walletConnection: WalletConnectionReadModel;
  investorWalletCount: number;
  paymentAddress?: string;
  redemptionWalletAddress?: string;
  generatedTestWalletCount: number;
}): SepoliaDemoWalletReadinessReadModel {
  const walletConnectedOnSepolia =
    input.walletConnection.walletConnectionStatus === 'connected' && input.walletConnection.chainStatus === 'sepolia';
  const inFlight = isSepoliaDemoWalletReadinessInFlight(input.state);
  const canCheckReadiness = walletConnectedOnSepolia && !inFlight;
  const signerBalanceEth = formatWeiAsEth(input.state.signerBalanceWei);
  const hasFunding = signerHasMinimumDemoBalance(input.state.signerBalanceWei);
  const disabledReason = inFlight
    ? 'Sepolia wallet readiness check is already running.'
    : walletConnectedOnSepolia
      ? undefined
      : 'Connect a Sepolia wallet before checking demo wallet readiness.';

  const status =
    input.state.checkStatus === 'ready' && !hasFunding
      ? 'needs_funding'
      : input.state.checkStatus;

  return {
    status,
    statusLabel: sepoliaDemoWalletReadinessStatusLabel(status),
    statusDetail: sepoliaDemoWalletReadinessStatusDetail(status, signerBalanceEth, input.state.errorMessage),
    canCheckReadiness,
    disabledReason,
    checkedWalletAddress: input.state.checkedWalletAddress,
    signerBalanceEth,
    items: [
      {
        label: 'Issuer/admin signer',
        status: walletConnectedOnSepolia ? (hasFunding || input.state.checkStatus === 'not_started' ? 'ready' : 'needs_funding') : 'blocked',
        detail: walletConnectedOnSepolia
          ? signerBalanceEth
            ? `Connected on Sepolia with ${signerBalanceEth}.`
            : 'Connected on Sepolia. Balance check not run yet.'
          : 'Connect the issuer/admin wallet on Sepolia.',
      },
      {
        label: 'Investor wallet pack',
        status: input.generatedTestWalletCount > 0 || input.investorWalletCount > 0 ? 'ready' : 'pending',
        detail:
          input.generatedTestWalletCount > 0
            ? `${input.generatedTestWalletCount} generated test investor wallet(s) available.`
            : input.investorWalletCount > 0
              ? `${input.investorWalletCount} investor wallet(s) registered.`
              : 'Generate or register investor wallets.',
      },
      {
        label: 'Payment wallet',
        status: input.paymentAddress ? 'ready' : 'pending',
        detail: input.paymentAddress ?? 'Add payment wallet / contract address in Subscription.',
      },
      {
        label: 'Redemption wallet',
        status: input.redemptionWalletAddress ? 'ready' : 'pending',
        detail: input.redemptionWalletAddress ?? 'Add redemption wallet in Redemption when redemption testing starts.',
      },
      {
        label: 'Funding helper',
        status: hasFunding ? 'ready' : input.state.checkStatus === 'not_started' ? 'pending' : 'needs_funding',
        detail: hasFunding
          ? 'Signer has enough Sepolia ETH for prototype transactions.'
          : 'Fund the signer and selected demo investor wallets with Sepolia ETH before wallet-signed actions.',
      },
    ],
  };
}

function sepoliaDemoWalletReadinessStatusLabel(status: SepoliaDemoWalletReadinessStatus): string {
  if (status === 'checking') return 'Sepolia readiness: Checking';
  if (status === 'ready') return 'Sepolia readiness: Ready';
  if (status === 'needs_funding') return 'Sepolia readiness: Needs funding';
  if (status === 'blocked') return 'Sepolia readiness: Blocked';
  if (status === 'failed') return 'Sepolia readiness: Failed';
  return 'Sepolia readiness: Not checked';
}

function sepoliaDemoWalletReadinessStatusDetail(
  status: SepoliaDemoWalletReadinessStatus,
  signerBalanceEth: string | undefined,
  errorMessage: string | undefined,
): string {
  if (status === 'checking') return 'Checking selected wallet account, Sepolia chain, and signer ETH balance.';
  if (status === 'ready') return `Signer funding check passed${signerBalanceEth ? ` with ${signerBalanceEth}` : ''}.`;
  if (status === 'needs_funding') return `Signer needs more Sepolia ETH before reliable prototype transactions${signerBalanceEth ? `; current balance ${signerBalanceEth}` : ''}.`;
  if (status === 'blocked') return errorMessage ?? 'Sepolia readiness is blocked by wallet connection or chain state.';
  if (status === 'failed') return errorMessage ?? 'Sepolia readiness check failed.';
  return 'Run a readiness check before wallet-signed deployment, whitelist, and allocation/mint actions.';
}
