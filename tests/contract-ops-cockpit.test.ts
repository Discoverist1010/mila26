import { describe, expect, it } from 'vitest';
import { toContractOpsCockpitReadModel } from '../src/domain/contractOpsCockpit';
import { toDeploymentEvidenceReadModel } from '../src/domain/deploymentEvidenceReadModel';
import { createInitialProductSetupRecord, toProductSetupReadModel, updateProductSetupField } from '../src/domain/productSetup';
import { toRecordNavOperationReadModel, initialRecordNavOperationState } from '../src/domain/recordNavOperationReadModel';
import { toWalletAllocationMintOperationReadModel, initialWalletAllocationMintOperationState } from '../src/domain/walletAllocationMintOperationReadModel';
import { toWalletConnectionReadModel } from '../src/domain/walletConnectionReadModel';
import { toWalletWhitelistOperationReadModel, initialWalletWhitelistOperationState } from '../src/domain/walletWhitelistOperationReadModel';
import { createInitialMila26LifecycleState, toMila26LifecycleReadModel } from '../src/domain/lifecycleState';
import { initialWalletSignedDeploymentState } from '../src/domain/walletSignedDeploymentReadModel';
import { mila26RestrictedFundTokenDeploymentArtifact } from '../src/contracts/mila26RestrictedFundTokenDeploymentArtifact';

const emptyFacts = {
  fundName: 'Unused',
  tokenSymbol: 'UNUSED',
  jurisdiction: 'Singapore',
  targetInvestors: 'Institutional',
  totalSupply: 0,
  initialNav: 0,
};

function buildReadModel(overrides: { adminWallet?: string; protocol?: 'ERC-20' | 'Customised ERC-20' | 'ERC-3643' | 'ERC-4626' } = {}) {
  let productSetupRecord = createInitialProductSetupRecord(emptyFacts);
  if (overrides.protocol) {
    productSetupRecord = updateProductSetupField(productSetupRecord, {
      fieldKey: 'protocol_base',
      value: overrides.protocol,
      sourceType: 'direct_form_input',
      sourceRef: 'test',
      status: 'user_confirmed',
    });
  }
  if (overrides.adminWallet) {
    productSetupRecord = updateProductSetupField(productSetupRecord, {
      fieldKey: 'admin_wallet',
      value: overrides.adminWallet,
      sourceType: 'direct_form_input',
      sourceRef: 'test',
      status: 'user_confirmed',
    });
  }

  const walletConnection = toWalletConnectionReadModel({
    providerStatus: 'available',
    connectionStatus: 'not_connected',
  });
  const deploymentEvidence = toDeploymentEvidenceReadModel({
    deploymentState: initialWalletSignedDeploymentState,
    artifactReference: {
      contractName: mila26RestrictedFundTokenDeploymentArtifact.contractName,
      bytecodeHash: mila26RestrictedFundTokenDeploymentArtifact.bytecodeHash,
    },
  });
  const lifecycle = toMila26LifecycleReadModel(createInitialMila26LifecycleState());
  const recordNavOperation = toRecordNavOperationReadModel({
    operationState: initialRecordNavOperationState,
    deploymentEvidence,
  });
  const walletWhitelistOperation = toWalletWhitelistOperationReadModel({
    operationState: initialWalletWhitelistOperationState,
    deploymentEvidence,
    walletConnectedOnSepolia: false,
    targetWalletAddress: undefined,
    whitelistFunctionAvailable: true,
  });
  const walletAllocationMintOperation = toWalletAllocationMintOperationReadModel({
    operationState: initialWalletAllocationMintOperationState,
    deploymentEvidence,
    walletConnectedOnSepolia: false,
    allocationMint: lifecycle.allocationMint,
    selectedInvestorWhitelisted: false,
    mintFunctionAvailable: true,
  });

  return toContractOpsCockpitReadModel({
    productSetupRecord,
    productSetupReadModel: toProductSetupReadModel(productSetupRecord),
    walletConnection,
    deploymentEvidence,
    recordNavOperation,
    walletWhitelistOperation,
    walletAllocationMintOperation,
    contractSpecsConfirmed: false,
    featureMappingConfirmed: false,
    adminWalletInput: '',
    canRequestSepoliaDeployment: false,
    deploymentStatusLabel: 'Deployment execution not started',
    walletStatusLabel: 'Not connected',
    chainStatusLabel: 'Unknown',
  });
}

describe('Contract Ops cockpit read model', () => {
  it('shows all protocol choices and keeps non-MVP protocols planned-only', () => {
    const readModel = buildReadModel();

    expect(readModel.protocolOptions.map((option) => option.id)).toEqual([
      'erc20',
      'custom_erc20',
      'erc3643',
      'erc4626',
      'erc1400',
      'erc7683',
    ]);
    for (const protocolId of ['erc1400', 'erc7683']) {
      expect(readModel.protocolOptions.find((option) => option.id === protocolId)).toMatchObject({
        status: 'planned',
        executablePrototype: false,
      });
    }
  });

  it('separates true deployment blockers from later lifecycle needs', () => {
    const readModel = buildReadModel({ protocol: 'ERC-20' });

    expect(readModel.launchHud.blockers).toContain('Confirm the smart contract specification.');
    expect(readModel.launchHud.blockers).toContain('Add a valid public admin wallet address.');
    expect(readModel.launchHud.laterNeeds.join(' ')).toContain('Investor wallet records');
    expect(readModel.snapshotItems.find((item) => item.id === 'redemption-wallet')).toMatchObject({
      status: 'needed_later',
    });
  });

  it('treats user-selected ERC-20 as selected instead of overwriting it with the recommendation', () => {
    const readModel = buildReadModel({ protocol: 'ERC-20' });

    expect(readModel.protocolOptions.find((option) => option.id === 'erc20')).toMatchObject({
      selected: true,
    });
    expect(readModel.specRows.find((row) => row.id === 'selected-erc-protocol')?.value).toBe('ERC-20');
  });
});
