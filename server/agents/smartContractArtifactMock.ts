import { createHash } from 'node:crypto';
import {
  SmartContractArtifactRequestSchema,
  SmartContractArtifactResponseSchema,
  type SmartContractArtifactCheckResult,
  type SmartContractArtifactPackage,
  type SmartContractArtifactResponse,
  type SmartContractEvidenceLite,
} from '../contracts/smartContractArtifact';
import type { SmartContractArtifactSpec } from '../contracts/smartContractArtifactSpec';

export type SmartContractArtifactFailureCode =
  | 'VALIDATION_ERROR'
  | 'MISSING_ARTIFACT_SPEC'
  | 'SPEC_NOT_READY'
  | 'UNSAFE_BOUNDARY'
  | 'CHECK_FAILED';

export type SmartContractArtifactGenerationResult =
  | { ok: true; data: SmartContractArtifactResponse }
  | {
      ok: false;
      code: SmartContractArtifactFailureCode;
      message: string;
      details?: Record<string, unknown>;
    };

const requiredDeploymentLikeFields = [
  'deployedAddress',
  'contractAddress',
  'txHash',
  'privateKey',
  'signerKey',
  'walletPrivateKey',
  'compiled',
  'deployed',
  'signed',
  'mainnet',
];

const requiredErc20Functions = ['totalSupply', 'balanceOf', 'transfer', 'allowance', 'approve', 'transferFrom'];
const requiredErc20Events = ['Transfer', 'Approval'];
const requiredCustomEvents = [
  'WalletWhitelisted',
  'AllocationMinted',
  'ValuationUpdated',
  'DistributionRecorded',
  'TransferRestrictionUpdated',
  'ContractPaused',
  'ContractUnpaused',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validationDetails(fields: Array<{ path: string; message: string }>): Record<string, unknown> {
  return { fields };
}

function hasAll(values: string[], required: string[]): boolean {
  return required.every((value) => values.includes(value));
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function sourcePreviewFor(spec: SmartContractArtifactSpec): string {
  return [
    'Deterministic preview only - not compiled, not deployed, not audited.',
    `Project: ${spec.projectName}`,
    `Profile: ${spec.tokenStandardProfile.baseStandardCompatibility} with MILA26 ${spec.tokenStandardProfile.mila26RestrictionProfile}.`,
    `Contract label: ${spec.contractModel.tokenName} (${spec.contractModel.tokenSymbol}).`,
    `Required ERC-20-style functions: ${spec.tokenStandardProfile.minimumRequiredFunctions.join(', ')}.`,
    `Required standard events: ${spec.eventModel.standardEvents.join(', ')}.`,
    `Required MILA26 events: ${spec.eventModel.customEvents.join(', ')}.`,
    `Access assumptions: ${spec.accessControl.adminRole}; ${spec.accessControl.issuerRole}; ${spec.accessControl.pauserRole}.`,
    `Wallet policy: ${spec.walletPolicy.transferPolicy}`,
    `Valuation policy: ${spec.valuationPolicy.eventRequirements.join(', ')}.`,
    `Distribution policy: ${spec.distributionPolicy.eventRequirements.join(', ')}.`,
    'OpenZeppelin remains an implementation assumption only; no package is installed and no imports are emitted in Track 9B.',
  ].join('\n');
}

function blockedInput(message: string, path: string, code: SmartContractArtifactFailureCode = 'VALIDATION_ERROR') {
  return {
    ok: false as const,
    code,
    message,
    details: validationDetails([{ path, message }]),
  };
}

function validateEligibleSpec(spec: SmartContractArtifactSpec): SmartContractArtifactGenerationResult | undefined {
  if (spec.status !== 'ready') {
    return {
      ok: false,
      code: 'SPEC_NOT_READY',
      message: 'Smart Contract Artifact Spec must be ready before artifact package generation.',
      details: {
        status: spec.status,
        blockedReasons: spec.blockedReasons,
      },
    };
  }

  if (spec.safetyBoundary.network !== 'ethereum-testnet-only' || !spec.safetyBoundary.mainnetDisabled) {
    return blockedInput(
      'Smart Contract Artifact generation requires the Ethereum testnet-only boundary.',
      'smartContractArtifactSpec.safetyBoundary.network',
      'UNSAFE_BOUNDARY',
    );
  }

  if (spec.safetyBoundary.backendCustody !== 'backend-holds-no-private-keys' || spec.accessControl.backendPrivateKeyCustody) {
    return blockedInput(
      'Backend private-key custody is not allowed in the MILA26 MVP.',
      'smartContractArtifactSpec.safetyBoundary.backendCustody',
      'UNSAFE_BOUNDARY',
    );
  }

  if (
    spec.safetyBoundary.deploymentSigning !== 'user-wallet-signs' ||
    spec.walletPolicy.deploymentSigning !== 'user-wallet-signs'
  ) {
    return blockedInput(
      'Future deployment must remain user-wallet signed.',
      'smartContractArtifactSpec.safetyBoundary.deploymentSigning',
      'UNSAFE_BOUNDARY',
    );
  }

  return undefined;
}

function buildArtifactPackage(spec: SmartContractArtifactSpec): SmartContractArtifactPackage {
  const contentPreview = sourcePreviewFor(spec);

  return {
    artifactId: `contract-artifact-${spec.specId}`,
    specId: spec.specId,
    projectId: spec.projectId,
    projectName: spec.projectName,
    status: 'generated',
    generatedFrom: {
      specId: spec.specId,
      tokenStandardProfile: {
        baseStandardCompatibility: spec.tokenStandardProfile.baseStandardCompatibility,
        mila26RestrictionProfile: spec.tokenStandardProfile.mila26RestrictionProfile,
        recommendedProfile: spec.tokenStandardProfile.recommendedProfile,
      },
    },
    sourceModel: {
      language: 'solidity',
      compilerToolchainStatus: 'not_configured',
      openZeppelinPackageStatus: 'not_installed',
      sourceKind: 'deterministic_preview',
      sourceFiles: [
        {
          path: 'contracts/MILARestrictedIncomeFundToken.preview.sol',
          role: 'primary_contract',
          contentPreview,
          contentHash: sha256(contentPreview),
        },
      ],
    },
    implementedSpecSummary: {
      standardFunctions: spec.tokenStandardProfile.minimumRequiredFunctions,
      standardEvents: spec.eventModel.standardEvents,
      customEvents: spec.eventModel.customEvents,
      accessControlFeatures: [
        spec.accessControl.adminRole,
        spec.accessControl.issuerRole,
        spec.accessControl.whitelistRole,
        spec.accessControl.pauserRole,
      ],
      walletRestrictionFeatures: [
        spec.walletPolicy.whitelistRequired ? 'Wallet whitelist required' : 'Wallet whitelist not finalized',
        spec.walletPolicy.transferPolicy,
        'Backend does not custody investor wallets.',
      ],
      valuationFeatures: [
        `${spec.valuationPolicy.updateModel} valuation updates`,
        ...spec.valuationPolicy.eventRequirements,
      ],
      distributionFeatures: [
        `${spec.distributionPolicy.movementScope} distribution scope`,
        ...spec.distributionPolicy.eventRequirements,
      ],
      pauseFeatures: spec.tokenStandardProfile.openZeppelinAssumptions.extensions.includes('Pausable')
        ? ['Emergency pause/unpause represented as preview-only requirements']
        : [],
    },
    implementationNotes: [
      'Artifact package is a deterministic preview package only.',
      'Compiler/toolchain verification is not configured in Track 9B.',
      'OpenZeppelin remains an assumption placeholder; no dependency is installed or imported.',
      'No deployment, wallet signing, transaction hash, or contract address exists.',
    ],
    blockedReasons: [],
    metadata: {
      generatedAt: spec.metadata.generatedAt,
      generator: 'deterministic_9b_artifact_generator',
      version: '9b.1',
    },
  };
}

function checkItem(
  id: string,
  label: string,
  passed: boolean,
  passedDetail: string,
  failedDetail: string,
  evidenceRef?: string,
) {
  return {
    id,
    label,
    status: passed ? ('passed' as const) : ('failed' as const),
    detail: passed ? passedDetail : failedDetail,
    evidenceRef,
  };
}

function buildCheckResult(
  spec: SmartContractArtifactSpec,
  artifactPackage: SmartContractArtifactPackage,
): SmartContractArtifactCheckResult {
  const boundaryChecks = {
    testnetOnly: spec.safetyBoundary.network === 'ethereum-testnet-only',
    mainnetDisabled: spec.safetyBoundary.mainnetDisabled,
    backendPrivateKeyCustodyDisabled:
      spec.safetyBoundary.backendCustody === 'backend-holds-no-private-keys' &&
      spec.accessControl.backendPrivateKeyCustody === false,
    userWalletSignsFutureDeployment:
      spec.safetyBoundary.deploymentSigning === 'user-wallet-signs' &&
      spec.walletPolicy.deploymentSigning === 'user-wallet-signs',
    deploymentNotExecuted: true,
    compilerNotConfigured: artifactPackage.sourceModel.compilerToolchainStatus === 'not_configured',
  };

  const checks = [
    checkItem(
      'check-spec-id',
      'Spec ID carried forward',
      artifactPackage.specId === spec.specId,
      'Artifact package references the source Smart Contract Artifact Spec.',
      'Artifact package does not reference the source Smart Contract Artifact Spec.',
      'evidence-spec-profile',
    ),
    checkItem(
      'check-restricted-erc20-profile',
      'MILA26 restricted ERC-20-compatible profile represented',
      artifactPackage.generatedFrom.tokenStandardProfile.baseStandardCompatibility === 'erc20' &&
        artifactPackage.generatedFrom.tokenStandardProfile.mila26RestrictionProfile === 'restricted_erc20',
      'Artifact package preserves ERC-20 compatibility and MILA26 restriction profile.',
      'Artifact package does not preserve the required ERC-20 compatibility profile.',
      'evidence-spec-profile',
    ),
    checkItem(
      'check-erc20-functions',
      'ERC-20-style functions represented',
      hasAll(artifactPackage.implementedSpecSummary.standardFunctions, requiredErc20Functions),
      'All minimum ERC-20-style functions are represented in the artifact package.',
      'One or more minimum ERC-20-style functions are missing from the artifact package.',
      'evidence-standard-functions',
    ),
    checkItem(
      'check-standard-events',
      'Transfer and Approval events represented',
      hasAll(artifactPackage.implementedSpecSummary.standardEvents, requiredErc20Events),
      'Transfer and Approval are represented in the artifact package.',
      'Transfer or Approval is missing from the artifact package.',
      'evidence-standard-events',
    ),
    checkItem(
      'check-custom-events',
      'MILA26 custom tokenisation events represented',
      hasAll(artifactPackage.implementedSpecSummary.customEvents, requiredCustomEvents),
      'Required MILA26 custom tokenisation events are represented.',
      'One or more required MILA26 custom tokenisation events are missing.',
      'evidence-custom-events',
    ),
    checkItem(
      'check-openzeppelin-assumptions',
      'OpenZeppelin assumptions remain placeholders',
      artifactPackage.sourceModel.openZeppelinPackageStatus === 'not_installed',
      'OpenZeppelin remains an assumption only; no package or import is configured.',
      'Artifact package implies OpenZeppelin installation or import availability.',
      'evidence-artifact-source',
    ),
    checkItem(
      'check-wallet-restrictions',
      'Wallet whitelist and transfer restrictions represented',
      artifactPackage.implementedSpecSummary.walletRestrictionFeatures.length > 0 && spec.walletPolicy.whitelistRequired,
      'Wallet whitelist and transfer restriction assumptions are represented.',
      'Wallet whitelist and transfer restriction assumptions are missing.',
      'evidence-wallet-policy',
    ),
    checkItem(
      'check-valuation-events',
      'Valuation event requirement represented',
      artifactPackage.implementedSpecSummary.valuationFeatures.includes('ValuationUpdated'),
      'ValuationUpdated evidence requirement is represented.',
      'ValuationUpdated evidence requirement is missing.',
      'evidence-valuation-policy',
    ),
    checkItem(
      'check-distribution-events',
      'Distribution event requirement represented',
      artifactPackage.implementedSpecSummary.distributionFeatures.includes('DistributionRecorded'),
      'DistributionRecorded evidence requirement is represented.',
      'DistributionRecorded evidence requirement is missing.',
      'evidence-distribution-policy',
    ),
    checkItem(
      'check-pause-control',
      'Pause control represented when required',
      artifactPackage.implementedSpecSummary.pauseFeatures.length > 0,
      'Pause/unpause requirement is represented as a preview-only implementation note.',
      'Pause/unpause requirement is missing.',
      'evidence-pause-policy',
    ),
    checkItem(
      'check-safety-boundaries',
      'MVP safety boundaries preserved',
      Object.values(boundaryChecks).every(Boolean),
      'Testnet-only, no-mainnet, no-backend-custody, user-wallet-signing, no-deployment, and compiler-not-configured boundaries are preserved.',
      'One or more MVP safety boundaries are not preserved.',
      'evidence-safety-boundaries',
    ),
  ];

  const failedChecks = checks.filter((check) => check.status === 'failed');

  return {
    checkId: `contract-check-${spec.specId}`,
    artifactId: artifactPackage.artifactId,
    specId: spec.specId,
    status: failedChecks.length > 0 ? 'failed' : 'passed',
    checkMode: 'spec_consistency',
    summary:
      failedChecks.length > 0
        ? 'Deterministic spec-consistency/static-preview checking found gaps. This is not a production security audit, compiler result, deployment approval, wallet-signing proof, or legal/compliance opinion.'
        : 'Deterministic spec-consistency/static-preview checking passed. Compiler/toolchain verification is not configured; this is not a production security audit, deployment approval, wallet-signing proof, or legal/compliance opinion.',
    checks,
    boundaryChecks,
    blockedReasons: failedChecks.map((check) => check.detail),
    metadata: {
      generatedAt: spec.metadata.generatedAt,
      generator: 'deterministic_9b_check_generator',
      version: '9b.1',
    },
  };
}

function buildEvidenceLite(
  spec: SmartContractArtifactSpec,
  artifactPackage: SmartContractArtifactPackage,
  checkResult: SmartContractArtifactCheckResult,
): SmartContractEvidenceLite {
  return {
    evidenceId: `evidence-lite-${spec.specId}`,
    artifactId: artifactPackage.artifactId,
    specId: spec.specId,
    checkId: checkResult.checkId,
    status: checkResult.status === 'passed' ? 'ready' : 'blocked',
    evidenceItems: [
      {
        id: 'evidence-spec-profile',
        label: 'Token standard profile',
        source: 'smart_contract_artifact_spec',
        detail: `${spec.tokenStandardProfile.baseStandardCompatibility} compatibility with MILA26 ${spec.tokenStandardProfile.mila26RestrictionProfile} restrictions.`,
      },
      {
        id: 'evidence-standard-functions',
        label: 'Standard functions',
        source: 'smart_contract_artifact_spec',
        detail: spec.tokenStandardProfile.minimumRequiredFunctions.join(', '),
      },
      {
        id: 'evidence-standard-events',
        label: 'Standard events',
        source: 'smart_contract_artifact_spec',
        detail: spec.eventModel.standardEvents.join(', '),
      },
      {
        id: 'evidence-custom-events',
        label: 'Custom tokenisation events',
        source: 'event_to_evidence_mapping',
        detail: spec.eventModel.customEvents.join(', '),
      },
      {
        id: 'evidence-artifact-source',
        label: 'Artifact package preview',
        source: 'contract_artifact_package',
        detail: `Preview source ${artifactPackage.sourceModel.sourceFiles[0]?.path ?? 'not available'} is not compiled, not deployed, and not audited.`,
      },
      {
        id: 'evidence-check-summary',
        label: 'Spec-consistency check result',
        source: 'artifact_check_result',
        detail: checkResult.summary,
      },
    ],
    eventEvidenceRefs: spec.eventModel.eventToEvidenceMapping.map((mapping) => ({
      eventName: mapping.eventName,
      evidencePurpose: mapping.evidenceUse,
      sourceSpecRef: `smartContractArtifactSpec.eventModel.eventToEvidenceMapping.${mapping.eventName}`,
    })),
    safetyEvidenceRefs: [
      {
        boundary: 'network',
        detail: 'Ethereum testnet only; mainnet disabled.',
      },
      {
        boundary: 'private_key_custody',
        detail: 'Backend holds no private keys.',
      },
      {
        boundary: 'deployment_signing',
        detail: 'Future deployment must be signed by the user wallet.',
      },
      {
        boundary: 'execution_status',
        detail: 'No compiler run, deployment, transaction, or wallet signing occurred in Track 9B.',
      },
    ],
    metadata: {
      generatedAt: spec.metadata.generatedAt,
      generator: 'deterministic_9b_evidence_lite_generator',
      version: '9b.1',
    },
  };
}

export function generateSmartContractArtifact(request: unknown): SmartContractArtifactGenerationResult {
  if (!request) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Smart Contract Artifact request body is required.',
    };
  }

  if (!isRecord(request)) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Invalid Smart Contract Artifact request.',
      details: validationDetails([{ path: '', message: 'Expected object.' }]),
    };
  }

  const blockedTopLevelField = requiredDeploymentLikeFields.find((field) => field in request);
  if (blockedTopLevelField) {
    return {
      ok: false,
      code: 'VALIDATION_ERROR',
      message: 'Smart Contract Artifact request contains deployment or secret fields that are not allowed.',
      details: validationDetails([
        {
          path: blockedTopLevelField,
          message: 'Deployment, signing, mainnet, compiled, deployed, and secret fields are not accepted in Track 9B.',
        },
      ]),
    };
  }

  const parsed = SmartContractArtifactRequestSchema.safeParse(request);
  if (!parsed.success) {
    const missingSpec = parsed.error.issues.some((issue) => issue.path.join('.') === 'smartContractArtifactSpec');
    return {
      ok: false,
      code: missingSpec ? 'MISSING_ARTIFACT_SPEC' : 'VALIDATION_ERROR',
      message: missingSpec
        ? 'Smart Contract Artifact Spec is required before artifact package generation.'
        : 'Invalid Smart Contract Artifact request.',
      details: {
        fields: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  }

  const spec = parsed.data.smartContractArtifactSpec;
  const eligibilityFailure = validateEligibleSpec(spec);
  if (eligibilityFailure) {
    return eligibilityFailure;
  }

  const artifactPackage = buildArtifactPackage(spec);
  const checkResult = buildCheckResult(spec, artifactPackage);

  if (checkResult.status === 'failed') {
    return {
      ok: false,
      code: 'CHECK_FAILED',
      message: 'Smart Contract Artifact spec-consistency checks failed.',
      details: {
        blockedReasons: checkResult.blockedReasons,
      },
    };
  }

  const evidenceLite = buildEvidenceLite(spec, artifactPackage, checkResult);

  const response = SmartContractArtifactResponseSchema.parse({
    artifactPackage,
    checkResult,
    evidenceLite,
  });

  return {
    ok: true,
    data: response,
  };
}
