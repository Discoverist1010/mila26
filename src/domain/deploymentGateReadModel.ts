import type { ProjectClosureCockpitStatus } from './projectClosureReadModel';

export type DeploymentGatePrerequisiteStatus = 'passed' | 'missing' | 'blocked' | 'failed';
export type DeploymentGateBoundaryStatus = 'enforced' | 'execution_blocked';
export type DeploymentGateStatus = 'blocked' | 'review_ready';
export type PreDeploymentReadiness = 'incomplete' | 'complete' | 'blocked';
export type DeploymentExecutionStatus = 'blocked';

export type DeploymentGateReadModelInput = {
  hasRequirementBrief: boolean;
  hasEngineeringBrief: boolean;
  closureReadinessStatus: ProjectClosureCockpitStatus;
  artifactSpecStatus?: 'not_started' | 'draft' | 'ready' | 'blocked';
  artifactPreviewStatus?: 'not_started' | 'generated' | 'blocked';
  checkResultStatus?: 'not_started' | 'passed' | 'failed' | 'blocked';
  evidenceLiteStatus?: 'not_started' | 'ready' | 'blocked';
  localCompileTestStatus?: 'not_run' | 'passed' | 'failed' | 'blocked';
  safetyBoundary?: Partial<DeploymentGateSafetyBoundaryInput>;
};

export type DeploymentGateSafetyBoundaryInput = {
  network: 'ethereum-testnet-only' | 'mainnet' | 'unknown';
  mainnetDisabled: boolean;
  backendPrivateKeysHeld: boolean;
  userWalletSigningRequired: boolean;
  walletSigningImplemented: boolean;
  deploymentExecuted: boolean;
  contractAddressPresent: boolean;
  transactionHashPresent: boolean;
  auditPerformed: boolean;
};

export type DeploymentGatePrerequisiteCheck = {
  id: string;
  label: string;
  status: DeploymentGatePrerequisiteStatus;
  detail: string;
};

export type DeploymentGateBoundaryCheck = {
  id: string;
  label: string;
  status: DeploymentGateBoundaryStatus;
  detail: string;
};

export type DeploymentGateReadModel = {
  gateStatus: DeploymentGateStatus;
  preDeploymentReadiness: PreDeploymentReadiness;
  deploymentExecutionStatus: DeploymentExecutionStatus;
  readyForDeploymentGateReview: boolean;
  readyForWalletSigningDesign: boolean;
  prerequisiteChecks: DeploymentGatePrerequisiteCheck[];
  boundaryChecks: DeploymentGateBoundaryCheck[];
  blockedReasons: string[];
  remainingGateItems: string[];
};

const defaultSafetyBoundary: DeploymentGateSafetyBoundaryInput = {
  network: 'ethereum-testnet-only',
  mainnetDisabled: true,
  backendPrivateKeysHeld: false,
  userWalletSigningRequired: true,
  walletSigningImplemented: false,
  deploymentExecuted: false,
  contractAddressPresent: false,
  transactionHashPresent: false,
  auditPerformed: false,
};

function prerequisiteCheck(
  id: string,
  label: string,
  status: DeploymentGatePrerequisiteStatus,
  detail: string,
): DeploymentGatePrerequisiteCheck {
  return { id, label, status, detail };
}

function statusFromPresence(present: boolean): DeploymentGatePrerequisiteStatus {
  return present ? 'passed' : 'missing';
}

function statusFromClosure(status: ProjectClosureCockpitStatus): DeploymentGatePrerequisiteStatus {
  if (status === 'ready') return 'passed';
  if (status === 'blocked') return 'blocked';
  return 'missing';
}

function statusFromArtifactSpec(status: DeploymentGateReadModelInput['artifactSpecStatus']): DeploymentGatePrerequisiteStatus {
  if (status === 'ready') return 'passed';
  if (status === 'blocked') return 'blocked';
  return 'missing';
}

function statusFromArtifactPreview(
  status: DeploymentGateReadModelInput['artifactPreviewStatus'],
): DeploymentGatePrerequisiteStatus {
  if (status === 'generated') return 'passed';
  if (status === 'blocked') return 'blocked';
  return 'missing';
}

function statusFromCheck(status: DeploymentGateReadModelInput['checkResultStatus']): DeploymentGatePrerequisiteStatus {
  if (status === 'passed') return 'passed';
  if (status === 'failed') return 'failed';
  if (status === 'blocked') return 'blocked';
  return 'missing';
}

function statusFromEvidence(status: DeploymentGateReadModelInput['evidenceLiteStatus']): DeploymentGatePrerequisiteStatus {
  if (status === 'ready') return 'passed';
  if (status === 'blocked') return 'blocked';
  return 'missing';
}

function statusFromCompileTest(
  status: DeploymentGateReadModelInput['localCompileTestStatus'],
): DeploymentGatePrerequisiteStatus {
  if (status === 'passed') return 'passed';
  if (status === 'failed') return 'failed';
  if (status === 'blocked') return 'blocked';
  return 'missing';
}

function detailFor(status: DeploymentGatePrerequisiteStatus, passedDetail: string, missingDetail: string) {
  if (status === 'passed') return passedDetail;
  if (status === 'failed') return 'Failed result blocks deployment gate review.';
  if (status === 'blocked') return 'Blocked status must be resolved before deployment gate review.';
  return missingDetail;
}

function buildPrerequisiteChecks(input: DeploymentGateReadModelInput): DeploymentGatePrerequisiteCheck[] {
  const requirementStatus = statusFromPresence(input.hasRequirementBrief);
  const engineeringStatus = statusFromPresence(input.hasEngineeringBrief);
  const closureStatus = statusFromClosure(input.closureReadinessStatus);
  const artifactSpecStatus = statusFromArtifactSpec(input.artifactSpecStatus);
  const artifactPreviewStatus = statusFromArtifactPreview(input.artifactPreviewStatus);
  const checkStatus = statusFromCheck(input.checkResultStatus);
  const evidenceStatus = statusFromEvidence(input.evidenceLiteStatus);
  const compileTestStatus = statusFromCompileTest(input.localCompileTestStatus);

  return [
    prerequisiteCheck(
      'requirement-brief',
      'Requirement Brief',
      requirementStatus,
      detailFor(requirementStatus, 'Requirement Brief is present.', 'Create the Requirement Brief before gate review.'),
    ),
    prerequisiteCheck(
      'engineering-brief',
      'Engineering Brief',
      engineeringStatus,
      detailFor(engineeringStatus, 'Engineering Brief is present.', 'Generate the Engineering Brief before gate review.'),
    ),
    prerequisiteCheck(
      'closure-readiness',
      'Project Closure readiness',
      closureStatus,
      detailFor(closureStatus, 'Closure readiness is complete.', 'Complete closure readiness before gate review.'),
    ),
    prerequisiteCheck(
      'smart-contract-artifact-spec',
      'Smart Contract Artifact Spec',
      artifactSpecStatus,
      detailFor(
        artifactSpecStatus,
        'Smart Contract Artifact Spec is ready.',
        'Prepare the Smart Contract Artifact Spec before gate review.',
      ),
    ),
    prerequisiteCheck(
      'artifact-preview',
      'Artifact Preview',
      artifactPreviewStatus,
      detailFor(artifactPreviewStatus, 'Artifact Preview is generated.', 'Generate the Artifact Preview before gate review.'),
    ),
    prerequisiteCheck(
      'check-result',
      'Check Result',
      checkStatus,
      detailFor(checkStatus, 'Check Result has passed.', 'Produce a passing Check Result before gate review.'),
    ),
    prerequisiteCheck(
      'evidence-lite',
      'Evidence-Lite',
      evidenceStatus,
      detailFor(evidenceStatus, 'Evidence-Lite is ready.', 'Prepare Evidence-Lite before gate review.'),
    ),
    prerequisiteCheck(
      'local-compile-test',
      'Local Compile/Test',
      compileTestStatus,
      detailFor(
        compileTestStatus,
        'Local compile/test representation has passed.',
        'Represent a passing local compile/test result before gate review.',
      ),
    ),
  ];
}

function buildBoundaryChecks(input: DeploymentGateReadModelInput): DeploymentGateBoundaryCheck[] {
  const boundary = { ...defaultSafetyBoundary, ...input.safetyBoundary };

  return [
    {
      id: 'ethereum-testnet-only',
      label: 'Ethereum testnet only',
      status: boundary.network === 'ethereum-testnet-only' ? 'enforced' : 'execution_blocked',
      detail:
        boundary.network === 'ethereum-testnet-only'
          ? 'Future deployment remains limited to Ethereum testnet planning.'
          : 'Only Ethereum testnet planning is allowed.',
    },
    {
      id: 'mainnet-disabled',
      label: 'Mainnet disabled',
      status: boundary.mainnetDisabled ? 'enforced' : 'execution_blocked',
      detail: boundary.mainnetDisabled ? 'Mainnet is disabled in the MVP.' : 'Mainnet must remain disabled in the MVP.',
    },
    {
      id: 'backend-private-keys',
      label: 'Backend holds no private keys',
      status: boundary.backendPrivateKeysHeld ? 'execution_blocked' : 'enforced',
      detail: boundary.backendPrivateKeysHeld
        ? 'Backend private-key custody is not allowed.'
        : 'Backend private-key custody remains out of scope.',
    },
    {
      id: 'user-wallet-signing-required',
      label: 'User wallet signing required',
      status: boundary.userWalletSigningRequired ? 'enforced' : 'execution_blocked',
      detail: boundary.userWalletSigningRequired
        ? 'Future deployment requires user wallet signing.'
        : 'Future deployment must require user wallet signing.',
    },
    {
      id: 'wallet-signing-not-implemented',
      label: 'Wallet signing not implemented',
      status: boundary.walletSigningImplemented ? 'execution_blocked' : 'enforced',
      detail: boundary.walletSigningImplemented
        ? 'Wallet signing implementation is outside the current deployment gate review.'
        : 'Wallet signing remains a later implementation track.',
    },
    {
      id: 'deployment-not-executed',
      label: 'Deployment not executed',
      status: boundary.deploymentExecuted ? 'execution_blocked' : 'enforced',
      detail: boundary.deploymentExecuted ? 'Deployment execution is not allowed in the deployment gate review.' : 'No deployment has been executed.',
    },
    {
      id: 'contract-address-absent',
      label: 'Contract address absent',
      status: boundary.contractAddressPresent ? 'execution_blocked' : 'enforced',
      detail: boundary.contractAddressPresent ? 'Contract address must remain absent before deployment.' : 'No contract address exists.',
    },
    {
      id: 'transaction-hash-absent',
      label: 'Transaction hash absent',
      status: boundary.transactionHashPresent ? 'execution_blocked' : 'enforced',
      detail: boundary.transactionHashPresent ? 'Transaction hash must remain absent before deployment.' : 'No transaction hash exists.',
    },
    {
      id: 'audit-not-performed',
      label: 'Audit not performed',
      status: boundary.auditPerformed ? 'execution_blocked' : 'enforced',
      detail: boundary.auditPerformed ? 'Audit completion is not claimed in the deployment gate review.' : 'No audit has been performed.',
    },
  ];
}

function preDeploymentReadinessFor(checks: DeploymentGatePrerequisiteCheck[]): PreDeploymentReadiness {
  if (checks.some((check) => check.status === 'blocked' || check.status === 'failed')) return 'blocked';
  if (checks.every((check) => check.status === 'passed')) return 'complete';
  return 'incomplete';
}

export function toDeploymentGateReadModel(input: DeploymentGateReadModelInput): DeploymentGateReadModel {
  const prerequisiteChecks = buildPrerequisiteChecks(input);
  const boundaryChecks = buildBoundaryChecks(input);
  const preDeploymentReadiness = preDeploymentReadinessFor(prerequisiteChecks);
  const unsafeBoundaryReasons = boundaryChecks
    .filter((check) => check.status === 'execution_blocked')
    .map((check) => check.detail);
  const prerequisiteReasons = prerequisiteChecks
    .filter((check) => check.status !== 'passed')
    .map((check) => `${check.label}: ${check.detail}`);
  const readyForDeploymentGateReview = preDeploymentReadiness === 'complete' && unsafeBoundaryReasons.length === 0;

  return {
    gateStatus: readyForDeploymentGateReview ? 'review_ready' : 'blocked',
    preDeploymentReadiness,
    deploymentExecutionStatus: 'blocked',
    readyForDeploymentGateReview,
    readyForWalletSigningDesign: readyForDeploymentGateReview,
    prerequisiteChecks,
    boundaryChecks,
    blockedReasons: [
      ...prerequisiteReasons,
      ...unsafeBoundaryReasons,
      'Deployment execution remains blocked because wallet signing is not implemented.',
    ],
    remainingGateItems: [
      ...(readyForDeploymentGateReview ? [] : ['Complete all pre-deployment prerequisite checks.']),
      'Design wallet signing before any future Ethereum testnet deployment.',
      'Keep mainnet disabled until explicitly approved in a later production track.',
      'Do not create a contract address or transaction hash before deployment execution exists.',
      'Complete an audit track before making audit claims.',
    ],
  };
}
