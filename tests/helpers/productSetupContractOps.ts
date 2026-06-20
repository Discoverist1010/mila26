import { toContractOpsCockpitReadModel, type ContractOpsCockpitReadModel } from '../../src/domain/contractOpsCockpit';
import { mila26RestrictedFundTokenDeploymentArtifact } from '../../src/contracts/mila26RestrictedFundTokenDeploymentArtifact';
import { createInitialMila26LifecycleState, toMila26LifecycleReadModel } from '../../src/domain/lifecycleState';
import { toDeploymentEvidenceReadModel } from '../../src/domain/deploymentEvidenceReadModel';
import { createInitialProductSetupRecord, toProductSetupReadModel, updateProductSetupField } from '../../src/domain/productSetup';
import type {
  ProductSetupFieldKey,
  ProductSetupFieldValue,
  ProductSetupProtocolBase,
  ProductSetupRecord,
} from '../../src/domain/productSetupSchema';
import { initialRecordNavOperationState, toRecordNavOperationReadModel } from '../../src/domain/recordNavOperationReadModel';
import {
  initialWalletAllocationMintOperationState,
  toWalletAllocationMintOperationReadModel,
} from '../../src/domain/walletAllocationMintOperationReadModel';
import { toWalletConnectionReadModel, SEPOLIA_CHAIN_ID_HEX } from '../../src/domain/walletConnectionReadModel';
import { initialWalletSignedDeploymentState, type WalletSignedDeploymentState } from '../../src/domain/walletSignedDeploymentReadModel';
import {
  initialWalletWhitelistOperationState,
  toWalletWhitelistOperationReadModel,
} from '../../src/domain/walletWhitelistOperationReadModel';
import { contractOpsMockWallets, type ContractOpsJourneyScenario } from '../fixtures/contract-ops-scenarios';

export type ContractOpsScenarioBuildOptions = {
  specsConfirmed?: boolean;
  featureMappingConfirmed?: boolean;
  walletConnectedOnSepolia?: boolean;
  canRequestSepoliaDeployment?: boolean;
  deploymentConfirmed?: boolean;
  adminWalletInput?: string;
};

export type BuiltContractOpsScenario = {
  productSetupRecord: ProductSetupRecord;
  readModel: ContractOpsCockpitReadModel;
};

const sourceRef = 'contract_ops_scenario_fixture';

export function createProductSetupRecordForScenario(scenario: ContractOpsJourneyScenario): ProductSetupRecord {
  const baseRecord = createInitialProductSetupRecord({
    fundName: String(scenario.productSetup.product_name ?? scenario.id),
    tokenSymbol: String(scenario.productSetup.token_symbol ?? 'TEST'),
    jurisdiction: 'Singapore',
    targetInvestors: String(scenario.productSetup.expected_investor_count ?? ''),
    totalSupply: 0,
    initialNav: 0,
  });

  let record = Object.entries(scenario.productSetup).reduce((current, [fieldKey, value]) => {
    if (value === undefined || value === null || value === '') return current;
    return updateProductSetupField(current, {
      fieldKey: fieldKey as ProductSetupFieldKey,
      value: value as ProductSetupFieldValue,
      sourceType: 'direct_form_input',
      sourceRef,
      status: 'user_confirmed',
      confidence: 1,
    });
  }, baseRecord);

  if (scenario.selectedProtocol) {
    record = setProductSetupProtocol(record, scenario.selectedProtocol);
  }

  return record;
}

export function setProductSetupProtocol(record: ProductSetupRecord, protocol: ProductSetupProtocolBase): ProductSetupRecord {
  return updateProductSetupField(record, {
    fieldKey: 'protocol_base',
    value: protocol,
    sourceType: 'direct_form_input',
    sourceRef: 'contract_ops_scenario_protocol',
    status: 'user_confirmed',
    confidence: 1,
  });
}

export function buildContractOpsScenarioReadModel(
  scenario: ContractOpsJourneyScenario,
  options: ContractOpsScenarioBuildOptions = {},
): BuiltContractOpsScenario {
  const productSetupRecord = createProductSetupRecordForScenario(scenario);
  const walletConnection = toWalletConnectionReadModel(
    options.walletConnectedOnSepolia
      ? {
          providerStatus: 'available',
          connectionStatus: 'connected',
          chainId: SEPOLIA_CHAIN_ID_HEX,
          connectedWalletAddress: contractOpsMockWallets.connectedSigner,
        }
      : {
          providerStatus: 'available',
          connectionStatus: 'not_connected',
        },
  );

  const deploymentState = options.deploymentConfirmed ? confirmedDeploymentState() : initialWalletSignedDeploymentState;
  const deploymentEvidence = toDeploymentEvidenceReadModel({
    deploymentState,
    artifactReference: {
      contractName: mila26RestrictedFundTokenDeploymentArtifact.contractName,
      bytecodeHash: mila26RestrictedFundTokenDeploymentArtifact.bytecodeHash,
    },
  });
  const lifecycle = toMila26LifecycleReadModel(createInitialMila26LifecycleState());
  const walletConnectedOnSepolia = walletConnection.walletConnectionStatus === 'connected' && walletConnection.chainStatus === 'sepolia';
  const recordNavOperation = toRecordNavOperationReadModel({
    operationState: initialRecordNavOperationState,
    deploymentEvidence,
  });
  const walletWhitelistOperation = toWalletWhitelistOperationReadModel({
    operationState: initialWalletWhitelistOperationState,
    deploymentEvidence,
    walletConnectedOnSepolia,
    targetWalletAddress: contractOpsMockWallets.investor1,
    whitelistFunctionAvailable: true,
  });
  const walletAllocationMintOperation = toWalletAllocationMintOperationReadModel({
    operationState: initialWalletAllocationMintOperationState,
    deploymentEvidence,
    walletConnectedOnSepolia,
    allocationMint: lifecycle.allocationMint,
    selectedInvestorWhitelisted: false,
    mintFunctionAvailable: true,
  });

  const readModel = toContractOpsCockpitReadModel({
    productSetupRecord,
    productSetupReadModel: toProductSetupReadModel(productSetupRecord),
    walletConnection,
    deploymentEvidence,
    recordNavOperation,
    walletWhitelistOperation,
    walletAllocationMintOperation,
    contractSpecsConfirmed: options.specsConfirmed ?? false,
    featureMappingConfirmed: options.featureMappingConfirmed ?? false,
    adminWalletInput: options.adminWalletInput ?? '',
    canRequestSepoliaDeployment: options.canRequestSepoliaDeployment ?? false,
    deploymentStatusLabel: deploymentState.deploymentStatus === 'confirmed' ? 'Deployment confirmed on Sepolia' : 'Deployment execution not started',
    walletStatusLabel: walletConnection.walletConnectionStatus,
    walletAddressDisplay: walletConnection.connectedWalletAddress,
    chainStatusLabel: walletConnection.chainStatus,
  });

  return { productSetupRecord, readModel };
}

export function getSnapshotValue(readModel: ContractOpsCockpitReadModel, itemId: string): string {
  const item = readModel.snapshotItems.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`Missing Contract Ops snapshot item: ${itemId}`);
  return item.value;
}

export function getSpecValue(readModel: ContractOpsCockpitReadModel, rowId: string): string {
  const row = readModel.specRows.find((candidate) => candidate.id === rowId);
  if (!row) throw new Error(`Missing Contract Ops spec row: ${rowId}`);
  return row.value;
}

export function getReadinessStatus(readModel: ContractOpsCockpitReadModel, itemId: string): string {
  const item = readModel.readinessItems.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`Missing Contract Ops readiness item: ${itemId}`);
  return item.status;
}

function confirmedDeploymentState(): WalletSignedDeploymentState {
  return {
    deploymentStatus: 'confirmed',
    attemptId: 'contract-ops-scenario-deployment',
    transactionHash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    contractAddress: contractOpsMockWallets.deploymentContract,
    receiptStatus: 'success',
    localSessionOnly: true,
  };
}
