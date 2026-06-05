import { describe, expect, it } from 'vitest';
import { toDeploymentGateReadModel, type DeploymentGateReadModelInput } from '../src/domain/deploymentGateReadModel';
import {
  createMila26DeploymentConstructorParameters,
  toUnsignedDeploymentIntentReadModel,
  type CompiledArtifactReferenceInput,
  type UnsignedDeploymentIntentReadModelInput,
} from '../src/domain/unsignedDeploymentIntentReadModel';
import { SEPOLIA_CHAIN_ID_HEX, toWalletConnectionReadModel } from '../src/domain/walletConnectionReadModel';
import { toWalletSigningIntentReadModel } from '../src/domain/walletSigningIntentReadModel';

const connectedWalletAddress = '0x1111111111111111111111111111111111111111';
const artifactPackageId = 'contract-artifact-smart-contract-artifact-spec-1';
const compileCheckId = `compile-check-${artifactPackageId}`;

const completeDeploymentGateInput: DeploymentGateReadModelInput = {
  hasRequirementBrief: true,
  hasEngineeringBrief: true,
  closureReadinessStatus: 'ready',
  artifactSpecStatus: 'ready',
  artifactPreviewStatus: 'generated',
  checkResultStatus: 'passed',
  evidenceLiteStatus: 'ready',
  localCompileTestStatus: 'passed',
};

const completeCompiledArtifactReference: CompiledArtifactReferenceInput = {
  artifactPackageId,
  specId: 'smart-contract-artifact-spec-1',
  contractName: 'Mila26RestrictedFundToken',
  artifactSource: 'local_compiled_artifact',
  artifactStatus: 'available',
  abiStatus: 'available',
  bytecodeStatus: 'available',
  bytecodeHash: 'sha256-compiled-bytecode-reference',
  compileCheckId,
  compileTestStatus: 'passed',
};

function deploymentGate(overrides: Partial<DeploymentGateReadModelInput> = {}) {
  return toDeploymentGateReadModel({
    ...completeDeploymentGateInput,
    ...overrides,
  });
}

function walletConnection(overrides: Parameters<typeof toWalletConnectionReadModel>[0] = {
  providerStatus: 'available',
  connectionStatus: 'connected',
  connectedWalletAddress,
  chainId: SEPOLIA_CHAIN_ID_HEX,
}) {
  return toWalletConnectionReadModel(overrides);
}

function constructorParameters() {
  return createMila26DeploymentConstructorParameters({
    tokenName: 'MILA Income Fund Unit',
    tokenSymbol: 'MILA',
    connectedWalletAddressSource: 'connected user wallet from WalletConnectionReadModel',
    artifactPackageId,
    compileCheckId,
  });
}

function model(overrides: Partial<UnsignedDeploymentIntentReadModelInput> = {}) {
  const gate = overrides.deploymentGate ?? deploymentGate();
  return toUnsignedDeploymentIntentReadModel({
    deploymentGate: gate,
    walletSigningIntent: overrides.walletSigningIntent ?? toWalletSigningIntentReadModel(gate),
    walletConnection: overrides.walletConnection ?? walletConnection(),
    compiledArtifactReference: overrides.compiledArtifactReference ?? completeCompiledArtifactReference,
    constructorParameters: overrides.constructorParameters ?? constructorParameters(),
    requestedNetwork: overrides.requestedNetwork ?? 'ethereum_sepolia',
  });
}

function reviewStatus(checkId: string, input: Partial<UnsignedDeploymentIntentReadModelInput> = {}) {
  return model(input).requiredReviewItems.find((item) => item.id === checkId)?.status;
}

describe('Unsigned Deployment Intent Read Model', () => {
  it('blocks when deployment gate is blocked', () => {
    const gate = deploymentGate({ hasRequirementBrief: false });
    const readModel = model({
      deploymentGate: gate,
      walletSigningIntent: toWalletSigningIntentReadModel(gate),
    });

    expect(readModel.intentStatus).toBe('blocked');
    expect(reviewStatus('deployment-gate-review', { deploymentGate: gate })).toBe('blocked');
    expect(readModel.blockedReasons.join(' ')).toMatch(/Deployment Gate/i);
  });

  it('blocks when wallet signing intent is blocked', () => {
    const blockedGate = deploymentGate({ checkResultStatus: 'failed' });
    const readModel = model({
      walletSigningIntent: toWalletSigningIntentReadModel(blockedGate),
    });

    expect(readModel.intentStatus).toBe('blocked');
    expect(reviewStatus('wallet-signing-intent-review', { walletSigningIntent: toWalletSigningIntentReadModel(blockedGate) })).toBe(
      'blocked',
    );
  });

  it('blocks when wallet is not connected', () => {
    const readModel = model({
      walletConnection: walletConnection({
        providerStatus: 'available',
        connectionStatus: 'not_connected',
      }),
    });

    expect(readModel.intentStatus).toBe('blocked');
    expect(reviewStatus('wallet-connection-review', { walletConnection: readModelFromNotConnectedWallet() })).toBe('missing');
    expect(readModel.deployer.connectedWalletAddress).toBeUndefined();
  });

  it('blocks when wallet is connected to the wrong chain or the requested network is not Sepolia', () => {
    const wrongChain = model({
      walletConnection: walletConnection({
        providerStatus: 'available',
        connectionStatus: 'connected',
        connectedWalletAddress,
        chainId: '0x1',
      }),
    });
    const mainnetRequested = model({ requestedNetwork: 'mainnet' });

    expect(wrongChain.intentStatus).toBe('blocked');
    expect(wrongChain.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'sepolia-chain-review', status: 'blocked' }),
    );
    expect(mainnetRequested.intentStatus).toBe('blocked');
    expect(mainnetRequested.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'sepolia-chain-review', status: 'blocked' }),
    );
  });

  it('blocks when compiled artifact, ABI, bytecode, or local compile/test are missing or failed', () => {
    const missingArtifact = model({
      compiledArtifactReference: { ...completeCompiledArtifactReference, artifactStatus: 'missing' },
    });
    const missingAbi = model({
      compiledArtifactReference: { ...completeCompiledArtifactReference, abiStatus: 'missing' },
    });
    const missingBytecode = model({
      compiledArtifactReference: { ...completeCompiledArtifactReference, bytecodeStatus: 'missing' },
    });
    const missingCompileTest = model({
      compiledArtifactReference: { ...completeCompiledArtifactReference, compileTestStatus: 'not_run' },
    });
    const failedCompileTest = model({
      compiledArtifactReference: { ...completeCompiledArtifactReference, compileTestStatus: 'failed' },
    });

    expect(missingArtifact.intentStatus).toBe('blocked');
    expect(missingArtifact.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'compiled-artifact-review', status: 'missing' }),
    );
    expect(missingAbi.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'artifact-abi-review', status: 'missing' }),
    );
    expect(missingBytecode.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'artifact-bytecode-review', status: 'missing' }),
    );
    expect(missingCompileTest.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'local-compile-test-review', status: 'missing' }),
    );
    expect(failedCompileTest.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'local-compile-test-review', status: 'blocked' }),
    );
  });

  it('blocks when constructor parameter summary is missing', () => {
    const readModel = model({ constructorParameters: { fields: [] } });

    expect(readModel.intentStatus).toBe('blocked');
    expect(readModel.constructorParameters.status).toBe('missing');
    expect(readModel.requiredReviewItems).toContainEqual(
      expect.objectContaining({ id: 'constructor-parameters-review', status: 'missing' }),
    );
  });

  it('becomes review-ready only when all prerequisites are present', () => {
    const readModel = model();

    expect(readModel.intentStatus).toBe('review_ready');
    expect(readModel.deploymentExecutionStatus).toBe('not_implemented');
    expect(readModel.targetNetwork).toEqual({
      networkName: 'Ethereum Sepolia',
      chainIdDecimal: 11155111,
      chainIdHex: '0xaa36a7',
      mainnetDisabled: true,
    });
    expect(readModel.deployer).toEqual({
      connectedWalletAddress,
      source: 'user_wallet',
      backendPrivateKeyCustody: 'never',
    });
    expect(readModel.compiledArtifactReference).toMatchObject({
      contractName: 'Mila26RestrictedFundToken',
      artifactSource: 'local_compiled_artifact',
      artifactStatus: 'available',
      abiStatus: 'available',
      bytecodeStatus: 'available',
      compileTestStatus: 'passed',
    });
    expect(readModel.constructorParameters.status).toBe('complete');
    expect(readModel.requiredReviewItems.every((item) => item.status === 'complete')).toBe(true);
    expect(readModel.nextStep).toBe('wallet_signed_deployment_track_14b');
  });

  it('keeps private-key, signing, mainnet, and execution boundaries explicit even when review-ready', () => {
    const readModel = model();

    expect(readModel.signingBoundaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'unsigned-intent-only', status: 'enforced' }),
        expect.objectContaining({ id: 'wallet-signing-not-implemented', status: 'not_implemented' }),
        expect.objectContaining({ id: 'deployment-execution-not-implemented', status: 'not_implemented' }),
        expect.objectContaining({ id: 'backend-never-holds-private-keys', status: 'enforced' }),
        expect.objectContaining({ id: 'user-wallet-signs-later', status: 'enforced' }),
        expect.objectContaining({ id: 'sepolia-only', status: 'enforced' }),
        expect.objectContaining({ id: 'mainnet-disabled', status: 'enforced' }),
      ]),
    );
    expect(readModel.blockedReasons).toContain('Wallet signing is not implemented in this review step.');
    expect(readModel.blockedReasons).toContain('Deployment execution is not implemented in this review step.');
  });

  it('keeps execution artifacts absent and does not model transaction lifecycle output', () => {
    const readModel = model();
    const serialized = JSON.stringify(readModel);

    expect(readModel.absentExecutionArtifacts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'transaction-hash-absent', status: 'absent' }),
        expect.objectContaining({ id: 'contract-address-absent', status: 'absent' }),
        expect.objectContaining({ id: 'signed-payload-absent', status: 'absent' }),
        expect.objectContaining({ id: 'submitted-transaction-absent', status: 'absent' }),
        expect.objectContaining({ id: 'confirmed-transaction-absent', status: 'absent' }),
        expect.objectContaining({ id: 'deployment-receipt-absent', status: 'absent' }),
      ]),
    );
    expect(serialized).not.toMatch(/transactionHash|txHash|contractAddress|signedPayload|deploymentReceipt/i);
    expect(serialized).not.toMatch(/"status":"signed"|"status":"submitted"|"status":"confirmed"|"status":"deployed"/i);
    expect(serialized).not.toMatch(/readyToDeploy|deploymentReady|readyForSignature|ready to sign|ready to deploy/i);
    expect(serialized).not.toMatch(/live|verified|audited|production[- ]ready|mainnet[- ]ready/i);
    expect(serialized).not.toMatch(/"(to|from|data|value|gas|nonce|maxFeePerGas|maxPriorityFeePerGas|chain)"\s*:/i);
  });

  it('does not expose fake transaction or contract 0x values', () => {
    const readModel = model();
    const nonWalletText = [
      JSON.stringify(readModel.absentExecutionArtifacts),
      JSON.stringify(readModel.signingBoundaries),
      JSON.stringify(readModel.requiredReviewItems),
    ].join(' ');

    expect(nonWalletText).not.toMatch(/0x[a-fA-F0-9]{6,}/);
  });
});

function readModelFromNotConnectedWallet() {
  return walletConnection({
    providerStatus: 'available',
    connectionStatus: 'not_connected',
  });
}
