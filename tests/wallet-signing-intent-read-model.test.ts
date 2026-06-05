import { describe, expect, it } from 'vitest';
import { toDeploymentGateReadModel, type DeploymentGateReadModelInput } from '../src/domain/deploymentGateReadModel';
import { toWalletSigningIntentReadModel } from '../src/domain/walletSigningIntentReadModel';

const completeGateInput: DeploymentGateReadModelInput = {
  hasRequirementBrief: true,
  hasEngineeringBrief: true,
  closureReadinessStatus: 'ready',
  artifactSpecStatus: 'ready',
  artifactPreviewStatus: 'generated',
  checkResultStatus: 'passed',
  evidenceLiteStatus: 'ready',
  localCompileTestStatus: 'passed',
};

function walletIntent(overrides: Partial<DeploymentGateReadModelInput> = {}) {
  return toWalletSigningIntentReadModel(
    toDeploymentGateReadModel({
      ...completeGateInput,
      ...overrides,
    }),
  );
}

function labels(values: Array<{ label: string }>) {
  return values.map((value) => value.label);
}

describe('Wallet Signing Intent Read Model', () => {
  it('blocks wallet signing intent when deployment gate is blocked', () => {
    const intent = walletIntent({ hasRequirementBrief: false });

    expect(intent.intentStatus).toBe('blocked');
    expect(intent.walletExecutionStatus).toBe('not_implemented');
    expect(intent.sourceDeploymentGate.gateStatus).toBe('blocked');
    expect(intent.blockedReasons).toEqual(
      expect.arrayContaining([
        'Wallet signing intent is blocked until Deployment Gate Review is review-ready.',
        'Wallet execution remains blocked because wallet integration is not implemented.',
      ]),
    );
    expect(intent.blockedReasons.join(' ')).toMatch(/Requirement Brief/i);
    expect(intent.requiredReviewItems.every((item) => item.status === 'blocked')).toBe(true);
  });

  it('marks wallet signing intent review-ready only when deployment gate is review-ready', () => {
    const blockedIntent = walletIntent({ checkResultStatus: 'not_started' });
    const readyIntent = walletIntent();

    expect(blockedIntent.intentStatus).toBe('blocked');
    expect(readyIntent.intentStatus).toBe('review_ready');
    expect(readyIntent.sourceDeploymentGate).toEqual({
      gateStatus: 'review_ready',
      preDeploymentReadiness: 'complete',
      deploymentExecutionStatus: 'blocked',
    });
    expect(readyIntent.requiredReviewItems.every((item) => item.status === 'ready')).toBe(true);
  });

  it('keeps wallet execution not implemented even when intent is review-ready', () => {
    const intent = walletIntent();

    expect(intent.intentStatus).toBe('review_ready');
    expect(intent.walletExecutionStatus).toBe('not_implemented');
    expect(intent.blockedReasons).toContain('Wallet execution remains blocked because wallet integration is not implemented.');
  });

  it('includes all required review items', () => {
    const intent = walletIntent();

    expect(labels(intent.requiredReviewItems)).toEqual(
      expect.arrayContaining([
        'Requirement Brief reviewed',
        'Engineering Brief reviewed',
        'Project Closure / Open Items reviewed',
        'Smart Contract Artifact Spec reviewed',
        'Smart Contract Artifact Preview reviewed',
        'Check Result reviewed',
        'Evidence-Lite reviewed',
        'Local Compile/Test result reviewed',
        'Deployment Gate reviewed',
        'Safety boundaries reviewed',
      ]),
    );
  });

  it('includes explicit signing boundaries', () => {
    const intent = walletIntent();

    expect(intent.signingBoundaries).toEqual(
      expect.arrayContaining([
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
      ]),
    );
  });

  it('defines future transaction requirements as descriptive future requirements only', () => {
    const intent = walletIntent();

    expect(labels(intent.futureTransactionRequirements)).toEqual(
      expect.arrayContaining([
        'User-controlled wallet address required later',
        'Browser wallet/provider integration required later',
        'Target Ethereum testnet chain selection required later',
        'Deployable contract artifact required later',
        'Constructor/deployment parameters required later',
        'Explicit wallet confirmation required later',
        'Transaction submission and confirmation tracking model required later',
      ]),
    );
    expect(intent.futureTransactionRequirements.every((item) => item.status === 'future_required')).toBe(true);
  });

  it('does not include executable wallet, transaction, deployment, or mainnet values', () => {
    const intent = walletIntent();
    const serialized = JSON.stringify(intent);

    expect(serialized).not.toMatch(/walletAddress|privateKey|transactionHash|txHash|contractAddress/i);
    expect(serialized).not.toMatch(/signedPayload|submittedTransaction|confirmedTransaction|deploymentReceipt/i);
    expect(serialized).not.toMatch(/mainnetChain|mainnetRpc|ready_for_signature/i);
    expect(serialized).not.toMatch(/"status":"signed"|"status":"submitted"|"status":"confirmed"|"status":"deployed"/i);
    expect(serialized).not.toMatch(/live|verified|production[- ]ready|mainnet[- ]ready/i);
    expect(serialized).not.toMatch(/audit passed|security approved/i);
  });

  it('uses deployment gate output instead of recreating a monolithic lifecycle object', () => {
    const intent = walletIntent({
      hasEngineeringBrief: false,
      localCompileTestStatus: 'not_run',
    });
    const serialized = JSON.stringify(intent);

    expect(intent.sourceDeploymentGate).toEqual({
      gateStatus: 'blocked',
      preDeploymentReadiness: 'incomplete',
      deploymentExecutionStatus: 'blocked',
    });
    expect(intent.blockedReasons.join(' ')).toMatch(/Engineering Brief/i);
    expect(intent.blockedReasons.join(' ')).toMatch(/Local Compile\/Test/i);
    expect(serialized).not.toMatch(/requirementBrief":|engineeringBrief":|closureLedger":|artifactPackage":|evidenceLite":/);
  });
});
