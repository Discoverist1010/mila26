import type { DeploymentGateReadModel } from './deploymentGateReadModel';
import type { WalletConnectionReadModel } from './walletConnectionReadModel';
import { SEPOLIA_CHAIN_ID_DECIMAL, SEPOLIA_CHAIN_ID_HEX } from './walletConnectionReadModel';
import type { WalletSigningIntentReadModel } from './walletSigningIntentReadModel';
import type { SmartContractCompileTestStatus } from '../../server/contracts/smartContractCompileCheck';

export type UnsignedDeploymentIntentStatus = 'blocked' | 'review_ready';
export type UnsignedDeploymentExecutionStatus = 'not_implemented';
export type UnsignedDeploymentArtifactStatus = 'available' | 'missing' | 'invalid';
export type UnsignedDeploymentArtifactPartStatus = 'available' | 'missing';
export type UnsignedDeploymentConstructorStatus = 'complete' | 'missing';
export type UnsignedDeploymentReviewItemStatus = 'complete' | 'missing' | 'blocked';
export type UnsignedDeploymentBoundaryStatus = 'enforced' | 'not_implemented' | 'absent';
export type UnsignedDeploymentTargetNetwork = 'ethereum_sepolia' | 'mainnet' | 'unknown';

export type CompiledArtifactReferenceInput = {
  artifactPackageId?: string;
  specId?: string;
  contractName?: string;
  artifactSource?: 'local_compiled_artifact' | 'artifact_package_reference';
  artifactStatus?: UnsignedDeploymentArtifactStatus;
  abiStatus?: UnsignedDeploymentArtifactPartStatus;
  bytecodeStatus?: UnsignedDeploymentArtifactPartStatus;
  bytecodeHash?: string;
  compileCheckId?: string;
  compileTestStatus?: SmartContractCompileTestStatus;
};

export type UnsignedDeploymentConstructorParameter = {
  name: string;
  type: string;
  valuePreview: string;
  source: string;
};

export type UnsignedDeploymentConstructorInput = {
  fields?: UnsignedDeploymentConstructorParameter[];
};

export type UnsignedDeploymentIntentReadModelInput = {
  deploymentGate: DeploymentGateReadModel;
  walletSigningIntent: WalletSigningIntentReadModel;
  walletConnection: WalletConnectionReadModel;
  compiledArtifactReference?: CompiledArtifactReferenceInput;
  constructorParameters?: UnsignedDeploymentConstructorInput;
  requestedNetwork?: UnsignedDeploymentTargetNetwork;
};

export type UnsignedDeploymentReviewItem = {
  id: string;
  label: string;
  status: UnsignedDeploymentReviewItemStatus;
  detail: string;
};

export type UnsignedDeploymentSigningBoundary = {
  id: string;
  label: string;
  status: UnsignedDeploymentBoundaryStatus;
  detail: string;
};

export type AbsentExecutionArtifact = {
  id: string;
  label: string;
  status: 'absent';
  reason: string;
};

export type UnsignedDeploymentIntentReadModel = {
  intentStatus: UnsignedDeploymentIntentStatus;
  deploymentExecutionStatus: UnsignedDeploymentExecutionStatus;
  targetNetwork: {
    networkName: 'Ethereum Sepolia';
    chainIdDecimal: typeof SEPOLIA_CHAIN_ID_DECIMAL;
    chainIdHex: typeof SEPOLIA_CHAIN_ID_HEX;
    mainnetDisabled: true;
  };
  deployer: {
    connectedWalletAddress?: string;
    source: 'user_wallet';
    backendPrivateKeyCustody: 'never';
  };
  compiledArtifactReference: {
    artifactPackageId?: string;
    specId?: string;
    contractName: string;
    artifactSource: 'local_compiled_artifact' | 'artifact_package_reference';
    artifactStatus: UnsignedDeploymentArtifactStatus;
    abiStatus: UnsignedDeploymentArtifactPartStatus;
    bytecodeStatus: UnsignedDeploymentArtifactPartStatus;
    bytecodeHash?: string;
    compileCheckId?: string;
    compileTestStatus: SmartContractCompileTestStatus;
  };
  constructorParameters: {
    status: UnsignedDeploymentConstructorStatus;
    fields: UnsignedDeploymentConstructorParameter[];
  };
  requiredReviewItems: UnsignedDeploymentReviewItem[];
  blockedReasons: string[];
  signingBoundaries: UnsignedDeploymentSigningBoundary[];
  absentExecutionArtifacts: AbsentExecutionArtifact[];
  nextStep: 'wallet_signed_deployment_track_14b';
};

const defaultCompiledArtifactReference: Required<
  Pick<
    UnsignedDeploymentIntentReadModel['compiledArtifactReference'],
    'contractName' | 'artifactSource' | 'artifactStatus' | 'abiStatus' | 'bytecodeStatus' | 'compileTestStatus'
  >
> = {
  contractName: 'Mila26RestrictedFundToken',
  artifactSource: 'local_compiled_artifact',
  artifactStatus: 'missing',
  abiStatus: 'missing',
  bytecodeStatus: 'missing',
  compileTestStatus: 'not_run',
};

const absentExecutionArtifacts: AbsentExecutionArtifact[] = [
  {
    id: 'transaction-hash-absent',
    label: 'No transaction hash',
    status: 'absent',
    reason: 'A transaction hash appears only after real wallet-submitted Sepolia deployment in a later track.',
  },
  {
    id: 'contract-address-absent',
    label: 'No contract address',
    status: 'absent',
    reason: 'A contract address appears only after real deployment confirmation in a later track.',
  },
  {
    id: 'signed-payload-absent',
    label: 'No signed payload',
    status: 'absent',
    reason: 'This review step does not request or store a wallet signature.',
  },
  {
    id: 'submitted-transaction-absent',
    label: 'No submitted transaction',
    status: 'absent',
    reason: 'This review step does not submit transactions.',
  },
  {
    id: 'confirmed-transaction-absent',
    label: 'No confirmed transaction',
    status: 'absent',
    reason: 'Receipt and confirmation tracking belong to a later execution track.',
  },
  {
    id: 'deployment-receipt-absent',
    label: 'No deployment receipt',
    status: 'absent',
    reason: 'No deployment receipt exists before real wallet-signed deployment.',
  },
];

const signingBoundaries: UnsignedDeploymentSigningBoundary[] = [
  {
    id: 'unsigned-intent-only',
    label: 'Unsigned deployment intent only',
    status: 'enforced',
    detail: 'This read model is a review payload only; it is not calldata, not a transaction request, and not a signed payload.',
  },
  {
    id: 'wallet-signing-not-implemented',
    label: 'Wallet signing not implemented',
    status: 'not_implemented',
    detail: 'This review step does not request wallet signatures.',
  },
  {
    id: 'deployment-execution-not-implemented',
    label: 'Deployment execution not implemented',
    status: 'not_implemented',
    detail: 'This review step does not submit, deploy, confirm, or record deployment results.',
  },
  {
    id: 'backend-never-holds-private-keys',
    label: 'Backend never holds private keys',
    status: 'enforced',
    detail: 'The backend never receives, stores, or uses user private keys.',
  },
  {
    id: 'user-wallet-signs-later',
    label: 'User wallet signs later',
    status: 'enforced',
    detail: 'A later track must ask the connected user wallet to sign in the browser.',
  },
  {
    id: 'sepolia-only',
    label: 'Sepolia only',
    status: 'enforced',
    detail: 'The alpha deployment target remains Ethereum Sepolia only.',
  },
  {
    id: 'mainnet-disabled',
    label: 'Mainnet disabled',
    status: 'enforced',
    detail: 'Mainnet is not available in this workspace.',
  },
];

function reviewItem(
  id: string,
  label: string,
  status: UnsignedDeploymentReviewItemStatus,
  detail: string,
): UnsignedDeploymentReviewItem {
  return { id, label, status, detail };
}

function normalizeArtifactReference(
  reference?: CompiledArtifactReferenceInput,
): UnsignedDeploymentIntentReadModel['compiledArtifactReference'] {
  return {
    artifactPackageId: reference?.artifactPackageId,
    specId: reference?.specId,
    contractName: reference?.contractName ?? defaultCompiledArtifactReference.contractName,
    artifactSource: reference?.artifactSource ?? defaultCompiledArtifactReference.artifactSource,
    artifactStatus: reference?.artifactStatus ?? defaultCompiledArtifactReference.artifactStatus,
    abiStatus: reference?.abiStatus ?? defaultCompiledArtifactReference.abiStatus,
    bytecodeStatus: reference?.bytecodeStatus ?? defaultCompiledArtifactReference.bytecodeStatus,
    bytecodeHash: reference?.bytecodeHash,
    compileCheckId: reference?.compileCheckId,
    compileTestStatus: reference?.compileTestStatus ?? defaultCompiledArtifactReference.compileTestStatus,
  };
}

function constructorStatus(fields: UnsignedDeploymentConstructorParameter[]): UnsignedDeploymentConstructorStatus {
  return fields.length > 0 ? 'complete' : 'missing';
}

function buildReviewItems(input: {
  deploymentGate: DeploymentGateReadModel;
  walletSigningIntent: WalletSigningIntentReadModel;
  walletConnection: WalletConnectionReadModel;
  artifact: UnsignedDeploymentIntentReadModel['compiledArtifactReference'];
  constructorParameterStatus: UnsignedDeploymentConstructorStatus;
  requestedNetwork: UnsignedDeploymentTargetNetwork;
}): UnsignedDeploymentReviewItem[] {
  return [
    reviewItem(
      'deployment-gate-review',
      'Deployment Gate Review',
      input.deploymentGate.gateStatus === 'review_ready' ? 'complete' : 'blocked',
      'Deployment Gate must be review-ready before an unsigned deployment intent is review-ready.',
    ),
    reviewItem(
      'wallet-signing-intent-review',
      'Wallet Signing Intent',
      input.walletSigningIntent.intentStatus === 'review_ready' ? 'complete' : 'blocked',
      'Wallet Signing Intent must be review-ready before deployment intent review.',
    ),
    reviewItem(
      'wallet-connection-review',
      'Wallet Connection',
      input.walletConnection.walletConnectionStatus === 'connected' ? 'complete' : 'missing',
      'Connected user wallet is required before the intent can identify the future signer.',
    ),
    reviewItem(
      'sepolia-chain-review',
      'Sepolia chain',
      input.walletConnection.chainStatus === 'sepolia' && input.requestedNetwork === 'ethereum_sepolia'
        ? 'complete'
        : 'blocked',
      'Wallet and requested target must remain Ethereum Sepolia.',
    ),
    reviewItem(
      'compiled-artifact-review',
      'Compiled artifact reference',
      input.artifact.artifactStatus === 'available' ? 'complete' : input.artifact.artifactStatus === 'invalid' ? 'blocked' : 'missing',
      'Compiled artifact reference must be available before unsigned deployment intent review.',
    ),
    reviewItem(
      'artifact-abi-review',
      'Artifact ABI reference',
      input.artifact.abiStatus === 'available' ? 'complete' : 'missing',
      'ABI reference must be available before later wallet-signed deployment work.',
    ),
    reviewItem(
      'artifact-bytecode-review',
      'Artifact bytecode reference',
      input.artifact.bytecodeStatus === 'available' ? 'complete' : 'missing',
      'Bytecode reference must be available before later wallet-signed deployment work.',
    ),
    reviewItem(
      'local-compile-test-review',
      'Local Compile/Test result',
      input.artifact.compileTestStatus === 'passed'
        ? 'complete'
        : input.artifact.compileTestStatus === 'failed' || input.artifact.compileTestStatus === 'blocked'
          ? 'blocked'
          : 'missing',
      'Local compile/test result must be passed before unsigned deployment intent review.',
    ),
    reviewItem(
      'constructor-parameters-review',
      'Constructor parameter summary',
      input.constructorParameterStatus === 'complete' ? 'complete' : 'missing',
      'Reviewable constructor/deployment parameter summary is required before signing can be considered later.',
    ),
  ];
}

function blockedReasonsFor(reviewItems: UnsignedDeploymentReviewItem[]): string[] {
  const reviewReasons = reviewItems
    .filter((item) => item.status !== 'complete')
    .map((item) => `${item.label}: ${item.detail}`);

  return [
    ...reviewReasons,
    'Wallet signing is not implemented in this review step.',
    'Deployment execution is not implemented in this review step.',
    'Unsigned deployment intent is review-only; it is not an executable transaction payload.',
  ];
}

export function createMila26DeploymentConstructorParameters(input: {
  tokenName: string;
  tokenSymbol: string;
  connectedWalletAddressSource: string;
  artifactPackageId: string;
  compileCheckId: string;
}): UnsignedDeploymentConstructorInput {
  return {
    fields: [
      {
        name: 'tokenName',
        type: 'string',
        valuePreview: input.tokenName,
        source: 'approved_requirement_and_engineering_brief',
      },
      {
        name: 'tokenSymbol',
        type: 'string',
        valuePreview: input.tokenSymbol,
        source: 'approved_requirement_and_engineering_brief',
      },
      {
        name: 'initialAdmin',
        type: 'address',
        valuePreview: input.connectedWalletAddressSource,
        source: 'connected_user_wallet_reference',
      },
      {
        name: 'restrictionProfile',
        type: 'string',
        valuePreview: 'restricted_erc20',
        source: 'smart_contract_artifact_spec',
      },
      {
        name: 'targetNetwork',
        type: 'string',
        valuePreview: 'Ethereum Sepolia only',
        source: 'wallet_connection_read_model',
      },
      {
        name: 'artifactPackageId',
        type: 'string',
        valuePreview: input.artifactPackageId,
        source: 'smart_contract_artifact_package',
      },
      {
        name: 'compileCheckId',
        type: 'string',
        valuePreview: input.compileCheckId,
        source: 'local_compile_test_result',
      },
    ],
  };
}

export function toUnsignedDeploymentIntentReadModel(
  input: UnsignedDeploymentIntentReadModelInput,
): UnsignedDeploymentIntentReadModel {
  const requestedNetwork = input.requestedNetwork ?? 'ethereum_sepolia';
  const compiledArtifactReference = normalizeArtifactReference(input.compiledArtifactReference);
  const constructorFields = input.constructorParameters?.fields ?? [];
  const constructorParameterStatus = constructorStatus(constructorFields);
  const requiredReviewItems = buildReviewItems({
    deploymentGate: input.deploymentGate,
    walletSigningIntent: input.walletSigningIntent,
    walletConnection: input.walletConnection,
    artifact: compiledArtifactReference,
    constructorParameterStatus,
    requestedNetwork,
  });
  const intentStatus = requiredReviewItems.every((item) => item.status === 'complete') ? 'review_ready' : 'blocked';

  return {
    intentStatus,
    deploymentExecutionStatus: 'not_implemented',
    targetNetwork: {
      networkName: 'Ethereum Sepolia',
      chainIdDecimal: SEPOLIA_CHAIN_ID_DECIMAL,
      chainIdHex: SEPOLIA_CHAIN_ID_HEX,
      mainnetDisabled: true,
    },
    deployer: {
      connectedWalletAddress: input.walletConnection.connectedWalletAddress,
      source: 'user_wallet',
      backendPrivateKeyCustody: 'never',
    },
    compiledArtifactReference,
    constructorParameters: {
      status: constructorParameterStatus,
      fields: constructorFields,
    },
    requiredReviewItems,
    blockedReasons: blockedReasonsFor(requiredReviewItems),
    signingBoundaries,
    absentExecutionArtifacts,
    nextStep: 'wallet_signed_deployment_track_14b',
  };
}
