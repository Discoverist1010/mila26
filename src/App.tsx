import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { askBlockchainEngineer } from './api/blockchainEngineerChat';
import { generateEngineeringBrief } from './api/engineeringBrief';
import { generateSmartContractArtifact } from './api/smartContractArtifact';
import { generateSmartContractArtifactSpec } from './api/smartContractArtifactSpec';
import {
  listWorkspaceArtifactRecords,
  listWorkspaceEvidenceRecords,
  loadLatestWorkspaceSnapshot,
  saveWorkspaceArtifactRecords,
  saveWorkspaceEvidenceRecords,
  saveWorkspaceSnapshot,
} from './api/workspacePersistence';
import {
  answerAsBlockchainEngineer,
  createRequirementBrief,
} from './agents/agentRuntime';
import { toCockpitActionViewModel } from './domain/cockpitActionRegistry';
import { toBlockchainEngineerResponseViewModel } from './domain/blockchainEngineerResponseViewModel';
import { toDeploymentEvidenceReadModel } from './domain/deploymentEvidenceReadModel';
import { toDeploymentGateReadModel } from './domain/deploymentGateReadModel';
import {
  createInitialMila26LifecycleState,
  createInvestorRegistryEntry,
  markInvestorWalletWhitelisted,
  MAX_INVESTOR_REGISTRY_ENTRIES,
  parsePermittedStablecoins,
  toMila26LifecycleReadModel,
  type AssetServicingParameters,
  type AllocationMintParameters,
  type Mila26LifecycleState,
  type RedemptionParameters,
} from './domain/lifecycleState';
import {
  formatWalletAllocationMintOperationStatus,
  initialWalletAllocationMintOperationState,
  isWalletAllocationMintOperationInFlight,
  toWalletAllocationMintOperationReadModel,
  type WalletAllocationMintOperationState,
} from './domain/walletAllocationMintOperationReadModel';
import { createDemoProjectClosureLedger } from './domain/projectClosureLedger';
import { toProjectClosureReadModel } from './domain/projectClosureReadModel';
import { toProjectLifecycleReadModel, type Mila26UiActionId } from './domain/projectLifecycleReadModel';
import {
  acknowledgeProductSetupDeploymentWarnings,
  confirmProductSetupUpdate,
  createInitialProductSetupRecord,
  createProductSetupPackMarkdown,
  createProductSetupPackPayload,
  createProductSetupPackPrintableHtml,
  createProductSetupSuggestionsFromStructuredUpdates,
  createProductSetupSuggestionsFromText,
  createUnsupportedRequirementDecisionsFromText,
  decideUnsupportedRequirement,
  dismissProductSetupSuggestedUpdate,
  fieldDisplayValue,
  handleProductSetupWalletInput,
  normalizeProductSetupRecord,
  productSetupHandoffTargetLabel,
  reviewProductSetupHandoffNote,
  sendProductSetupHandoffNote,
  setProductSetupSuggestedUpdates,
  setUnsupportedRequirementDecisions,
  toProductSetupReadModel,
  updateProductSetupField,
  type ProductSetupFieldKey,
  type ProductSetupHandoffTarget,
  type ProductSetupRecord,
  type ProductSetupSuggestedUpdate,
} from './domain/productSetup';
import { toRequirementBriefContract } from './domain/requirementBrief';
import { routeZiLiOSCopilotMessage, type ZiLiOSCopilotRouteKind } from './domain/ziliosCopilotRouter';
import {
  defaultRecordNavOperationPayload,
  formatRecordNavOperationStatus,
  initialRecordNavOperationState,
  isRecordNavOperationInFlight,
  isValidNonZeroEvmAddress,
  toRecordNavOperationReadModel,
  type RecordNavOperationState,
} from './domain/recordNavOperationReadModel';
import {
  formatWalletWhitelistOperationStatus,
  initialWalletWhitelistOperationState,
  isWalletWhitelistOperationInFlight,
  normalizeWalletWhitelistTargetAddress,
  toWalletWhitelistOperationReadModel,
  type WalletWhitelistOperationState,
} from './domain/walletWhitelistOperationReadModel';
import {
  createKnownLocalCompileTestResult,
  toSmartContractCompileTestPresentation,
} from './domain/smartContractCompileTestPresentation';
import { toSmartContractControlPanelViewModel } from './domain/smartContractControlPanelViewModel';
import {
  toWorkspacePresentation,
  type WorkspaceTabId,
} from './domain/workspacePresentation';
import {
  createTestInvestorWalletPack,
  createTestInvestorWalletPackExport,
  toInvestorRegistryEntriesFromTestWalletPack,
  toTestInvestorWalletPublicRecords,
  type TestInvestorWalletPack,
} from './domain/testWalletLab';
import {
  initialSepoliaDemoWalletReadinessState,
  isSepoliaDemoWalletReadinessInFlight,
  toSepoliaDemoWalletReadinessReadModel,
  type SepoliaDemoWalletReadinessState,
} from './domain/sepoliaDemoWalletReadiness';
import { mila26RestrictedFundTokenDeploymentArtifact } from './contracts/mila26RestrictedFundTokenDeploymentArtifact';
import {
  createMila26DeploymentConstructorParameters,
  toUnsignedDeploymentIntentReadModel,
} from './domain/unsignedDeploymentIntentReadModel';
import {
  formatWalletAddressForDisplay,
  toWalletConnectionReadModel,
  type WalletConnectionReadModel,
  type WalletConnectionReadModelInput,
} from './domain/walletConnectionReadModel';
import {
  formatWalletSignedDeploymentStatus,
  initialWalletSignedDeploymentState,
  isDeploymentAttemptInFlight,
  type WalletSignedDeploymentState,
} from './domain/walletSignedDeploymentReadModel';
import { toWalletSigningIntentReadModel } from './domain/walletSigningIntentReadModel';
import { getBrowserEthereumProvider } from './wallet/browserEthereumProvider';
import { createEip1193WalletAdapter } from './wallet/eip1193WalletAdapter';
import {
  requestWalletSignedSepoliaDeployment,
  type SepoliaDeploymentProvider,
} from './wallet/sepoliaDeploymentAdapter';
import {
  requestWalletSignedRecordNavOperation,
  type SepoliaRecordNavOperationProvider,
} from './wallet/sepoliaRecordNavOperationAdapter';
import {
  hasSetWalletAllowedFunction,
  requestWalletSignedWhitelistOperation,
  type SepoliaWalletWhitelistOperationProvider,
} from './wallet/sepoliaWalletWhitelistOperationAdapter';
import {
  hasMintAllocationFunction,
  requestWalletSignedAllocationMintOperation,
  type SepoliaAllocationMintOperationProvider,
} from './wallet/sepoliaAllocationMintOperationAdapter';
import {
  checkSepoliaDemoWalletReadiness,
  type SepoliaDemoWalletReadinessProvider,
} from './wallet/sepoliaDemoWalletReadinessAdapter';
import type { AssistantMode, BlockchainEngineerChatResponse } from '../server/contracts/chat';
import type { EngineeringBrief } from '../server/contracts/engineeringBrief';
import type {
  SmartContractArtifactCheckResult,
  SmartContractArtifactPackage,
  SmartContractEvidenceLite,
} from '../server/contracts/smartContractArtifact';
import type { SmartContractArtifactSpec } from '../server/contracts/smartContractArtifactSpec';
import type { SmartContractCompileTestResult } from '../server/contracts/smartContractCompileCheck';
import type {
  WorkspaceArtifactRecord,
  WorkspaceArtifactRecordInput,
  WorkspaceEvidenceRecord,
  WorkspaceEvidenceRecordInput,
} from '../server/contracts/workspacePersistence';
import type { FundFacts, RequirementBrief } from './domain/schemas';

const starterFacts: FundFacts = {
  fundName: 'MILA Income Fund',
  tokenSymbol: 'MILA',
  jurisdiction: 'Singapore',
  targetInvestors: 'Accredited investors',
  totalSupply: 1_000_000,
  initialNav: 1_000_000,
};

const initialBotQuestion = 'I want investors to subscribe with stablecoins and redeem later after a delay.';

type ProjectDirectorySelection = 'workspace' | 'usequities' | 'sgequities' | 'mixedportfolio';

type DemoProjectFolder = {
  id: Exclude<ProjectDirectorySelection, 'workspace'>;
  label: string;
  title: string;
  description: string;
  tokenSymbol: string;
  marketScope: string;
};

type EngineerAnswerSource = 'local' | 'backend' | 'live_model' | 'generated_artifacts' | 'wallet';

type EngineeringBotConversationTurn =
  | {
      id: string;
      role: 'user';
      content: string;
      assistantMode: AssistantMode;
      copilotRoute: ZiLiOSCopilotRouteKind;
    }
  | {
      id: string;
      role: 'assistant';
      response: BlockchainEngineerChatResponse;
      source: EngineerAnswerSource;
      assistantMode: AssistantMode;
      copilotRoute: ZiLiOSCopilotRouteKind;
      routeLabels: string[];
    };

const demoProjectFolders: DemoProjectFolder[] = [
  {
    id: 'usequities',
    label: 'Alpha Income Fund I',
    title: 'Alpha Income Fund I',
    description: 'Tokenised financial product workspace for up to 50 investors.',
    tokenSymbol: 'USEQ',
    marketScope: 'US equities',
  },
  {
    id: 'sgequities',
    label: 'Singapore REIT Token',
    title: 'Singapore REIT Token',
    description: 'Tokenised income workspace for Singapore real estate exposure.',
    tokenSymbol: 'SGEQ',
    marketScope: 'Singapore equities',
  },
  {
    id: 'mixedportfolio',
    label: 'Mixed Portfolio Token',
    title: 'Mixed Portfolio Token',
    description: 'Tokenised portfolio workspace for blended asset exposure.',
    tokenSymbol: 'MIXD',
    marketScope: 'Mixed equities',
  },
];

const uiActions = {
  createRequirementBrief: 'create_requirement_brief',
  generateEngineeringBrief: 'generate_engineering_brief',
  reviewAssumptions: 'review_assumptions',
  askQuestion: 'ask_question',
  openBrief: 'open_brief',
  toggleBriefPanel: 'toggle_brief_panel',
  toggleLeftRail: 'toggle_left_rail',
  toggleRightRail: 'toggle_right_rail',
  scrollToScp: 'scroll_to_scp',
  connectWallet: 'connect_wallet',
  deployToSepolia: 'deploy_to_sepolia',
  recordNavEvent: 'record_nav_event',
  whitelistWallet: 'whitelist_wallet',
  allocationMint: 'allocation_mint',
} as const;

type GeneratedArtifactCard = {
  label: string;
  status: string;
  detail: string;
  source: string;
};

type WorkspacePersistenceStatus = {
  status: 'idle' | 'saving' | 'loading' | 'saved' | 'loaded' | 'error';
  message: string;
};

type DurableRecordStatus = {
  status: 'idle' | 'saving' | 'loading' | 'saved' | 'loaded' | 'error';
  message: string;
};

function createLocalEngineerResponse(content: string): BlockchainEngineerChatResponse {
  return {
    messageId: 'local-preview',
    agentId: 'blockchain-engineer',
    content,
    createdAt: new Date(0).toISOString(),
  };
}

function createInitialEngineerResponse(): BlockchainEngineerChatResponse {
  return createLocalEngineerResponse(answerAsBlockchainEngineer(initialBotQuestion));
}

function createSmartContractPreparationResponse(): BlockchainEngineerChatResponse {
  return {
    messageId: 'local-smart-contract-preparation',
    agentId: 'blockchain-engineer',
    content:
      'Smart contract preparation is complete for demo review: I generated the Smart Contract Spec, deterministic Artifact Preview, spec-consistency Check Result, Evidence-Lite linkage, and represented the known local compile/test foundation as passed.',
    openQuestions: ['Review deployment-gate and wallet-signing design later before any testnet transaction is considered.'],
    riskNotes: [
      'No compile command was run from this UI action.',
      'Not deployed.',
      'Not audited.',
      'Not signed.',
      'No wallet is connected.',
      'No contract address or transaction hash exists.',
    ],
    nextRecommendedAction: 'Deployment Gate and wallet-signing design remain later steps. Local compile/test status does not imply deployment readiness.',
    createdAt: new Date(0).toISOString(),
  };
}

function createWalletConnectionResponse(walletConnection: WalletConnectionReadModel): BlockchainEngineerChatResponse {
  return {
    messageId: 'local-wallet-connection',
    agentId: 'blockchain-engineer',
    content:
      'Wallet connection check updated. This checks whether a user wallet is available and on Sepolia. It does not sign, deploy, submit a transaction, or unlock Smart Contract Operations.',
    riskNotes: [
      `Wallet connection: ${formatWalletConnectionStatus(walletConnection.walletConnectionStatus)}.`,
      `Wallet chain: ${formatWalletChainStatus(walletConnection.chainStatus)}.`,
      'Wallet execution remains not implemented.',
      'Deployment remains not executed.',
      'No contract address or transaction hash exists.',
    ],
    nextRecommendedAction: 'Next milestone is wallet-signed Sepolia deployment from the reviewed unsigned deployment intent.',
    createdAt: new Date(0).toISOString(),
  };
}

function createDeploymentResponse(deployment: WalletSignedDeploymentState): BlockchainEngineerChatResponse {
  const statusLabel = formatWalletSignedDeploymentStatus(deployment.deploymentStatus);

  return {
    messageId: 'local-wallet-signed-deployment',
    agentId: 'blockchain-engineer',
    content:
      'Wallet-signed Sepolia deployment status updated. Deployment evidence is derived from local-session provider and receipt responses only.',
    riskNotes: [
      `Deployment status: ${statusLabel}.`,
      deployment.transactionHash ? `Transaction hash: ${deployment.transactionHash}.` : 'No transaction hash.',
      deployment.contractAddress ? `Contract address: ${deployment.contractAddress}.` : 'No contract address.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
      'Smart Contract Operations are individually gated by deployment evidence, wallet connection, ABI support, and operation-specific parameters.',
    ],
    nextRecommendedAction: 'Next recommended operations are Record NAV Event, Wallet Whitelist, then Allocation / Mint when each gate is satisfied.',
    createdAt: new Date(0).toISOString(),
  };
}

function createRecordNavOperationResponse(operation: RecordNavOperationState): BlockchainEngineerChatResponse {
  const statusLabel = formatRecordNavOperationStatus(operation.operationStatus);

  return {
    messageId: 'local-record-nav-operation',
    agentId: 'blockchain-engineer',
    content:
      'Record NAV operation status updated. Contract Ops owns the active operation control; evidence is derived from local-session provider and receipt responses only.',
    riskNotes: [
      `Record NAV operation: ${statusLabel}.`,
      operation.operationTransactionHash ? `Operation transaction hash: ${operation.operationTransactionHash}.` : 'No operation transaction hash.',
      operation.decodedEvent ? 'ValuationUpdated event decoded from receipt.' : 'ValuationUpdated event not decoded.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
      'Other Contract Ops actions require their own explicit adapters and evidence paths before release.',
    ],
    nextRecommendedAction:
      operation.operationStatus === 'confirmed'
        ? 'Next recommended operation is Wallet Whitelist. Allocation / Mint is available after the selected investor wallet is whitelisted and allocation parameters are ready.'
        : 'Continue only after the wallet-signed Record NAV operation is confirmed or safely retried.',
    createdAt: new Date(0).toISOString(),
  };
}

function createWalletWhitelistOperationResponse(operation: WalletWhitelistOperationState): BlockchainEngineerChatResponse {
  const statusLabel = formatWalletWhitelistOperationStatus(operation.operationStatus);

  return {
    messageId: 'local-wallet-whitelist-operation',
    agentId: 'blockchain-engineer',
    content:
      'Wallet Whitelist operation status updated. Contract Ops owns the active operation control; evidence is derived from local-session provider and receipt responses only.',
    riskNotes: [
      `Wallet Whitelist operation: ${statusLabel}.`,
      operation.targetWalletAddress ? `Target wallet: ${operation.targetWalletAddress}.` : 'Target wallet address is required.',
      operation.operationTransactionHash ? `Whitelist transaction hash: ${operation.operationTransactionHash}.` : 'No whitelist transaction hash.',
      operation.decodedEvent ? 'WalletWhitelisted event decoded from receipt.' : 'WalletWhitelisted event not decoded.',
      'Contract authorization is enforced on-chain.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
      'Allocation / Mint is available when the selected whitelisted wallet and token amount pass validation.',
      'Other Contract Ops actions require their own explicit adapters and evidence paths before release.',
    ],
    nextRecommendedAction:
      operation.operationStatus === 'confirmed'
        ? 'Next recommended operation is Allocation/Mint after the subscription and investor wallet setup is complete.'
        : 'Continue only after the wallet-signed Wallet Whitelist operation is confirmed or safely retried.',
    createdAt: new Date(0).toISOString(),
  };
}

function createAllocationMintOperationResponse(operation: WalletAllocationMintOperationState): BlockchainEngineerChatResponse {
  const statusLabel = formatWalletAllocationMintOperationStatus(operation.operationStatus);

  return {
    messageId: 'local-allocation-mint-operation',
    agentId: 'blockchain-engineer',
    content:
      'Allocation / Mint operation status updated. The action is wallet-signed on Sepolia and evidence is derived from local-session provider and receipt responses only.',
    riskNotes: [
      `Allocation / Mint operation: ${statusLabel}.`,
      operation.targetWalletAddress ? `Target wallet: ${operation.targetWalletAddress}.` : 'Target wallet address is required.',
      operation.tokenAmount ? `Token amount: ${operation.tokenAmount}.` : 'Token allocation amount is required.',
      operation.operationTransactionHash ? `Allocation / Mint transaction hash: ${operation.operationTransactionHash}.` : 'No Allocation / Mint transaction hash.',
      operation.decodedEvent ? 'AllocationMinted event decoded from receipt.' : 'AllocationMinted event not decoded.',
      'Contract authorization is enforced on-chain.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
    ],
    nextRecommendedAction:
      operation.operationStatus === 'confirmed'
        ? 'Next recommended step is to review investor activity evidence and continue asset servicing operations.'
        : 'Continue only after the wallet-signed Allocation / Mint operation is confirmed or safely retried.',
    createdAt: new Date(0).toISOString(),
  };
}

function formatDeploymentGateStatus(status: 'blocked' | 'review_ready') {
  return status === 'review_ready' ? 'Review-ready' : 'Blocked';
}

function formatPreDeploymentReadiness(status: 'incomplete' | 'complete' | 'blocked') {
  if (status === 'complete') return 'Complete';
  if (status === 'blocked') return 'Blocked';
  return 'Incomplete';
}

function formatWalletSigningIntentStatus(status: 'blocked' | 'review_ready') {
  return status === 'review_ready' ? 'Review-ready' : 'Blocked';
}

function formatWalletConnectionStatus(status: string) {
  if (status === 'not_connected') return 'Not connected';
  if (status === 'connecting') return 'Connecting';
  if (status === 'wrong_chain') return 'Wrong chain';
  if (status === 'rejected') return 'Rejected';
  if (status === 'unsupported') return 'Not detected';
  if (status === 'connected') return 'Connected';
  return 'Provider error';
}

function formatWalletChainStatus(status: string) {
  if (status === 'sepolia') return 'Sepolia';
  if (status === 'wrong_chain') return 'Wrong chain';
  return 'Unknown';
}

function tabStatusLabel(status: ReturnType<typeof toWorkspacePresentation>['tabs'][number]['status']) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'needs_review') return 'Needs review';
  if (status === 'needs_parameters') return 'Needs parameters';
  if (status === 'available') return 'Available';
  if (status === 'local_session_only') return 'Local session only';
  return 'Needs prerequisites';
}

function fundingTargetStatusLabel(status: 'ready' | 'needs_funding' | 'blocked' | 'pending') {
  if (status === 'ready') return 'Ready';
  if (status === 'needs_funding') return 'Needs funding';
  if (status === 'blocked') return 'Needs setup';
  return 'Check';
}

function initialWalletConnectionInput(): WalletConnectionReadModelInput {
  return getBrowserEthereumProvider()
    ? {
        providerStatus: 'unknown',
        connectionStatus: 'not_connected',
      }
    : {
        providerStatus: 'unsupported',
        connectionStatus: 'not_connected',
      };
}

function walletConnectionInputsMatch(
  current: WalletConnectionReadModelInput,
  next: WalletConnectionReadModelInput,
) {
  return (
    current.providerStatus === next.providerStatus &&
    current.connectionStatus === next.connectionStatus &&
    current.chainId === next.chainId &&
    current.connectedWalletAddress === next.connectedWalletAddress &&
    current.providerError?.code === next.providerError?.code &&
    current.providerError?.normalizedStatus === next.providerError?.normalizedStatus
  );
}

function applyWalletConnectionInput(next: WalletConnectionReadModelInput) {
  return (current: WalletConnectionReadModelInput) => (walletConnectionInputsMatch(current, next) ? current : next);
}

function walletWhitelistTargetsMatch(left?: string, right?: string) {
  const normalizedLeft = normalizeWalletWhitelistTargetAddress(left);
  const normalizedRight = normalizeWalletWhitelistTargetAddress(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft.toLowerCase() === normalizedRight.toLowerCase());
}

function toChatHistory(turns: EngineeringBotConversationTurn[]) {
  return turns.slice(-6).map((turn) => ({
    messageId: turn.id,
    role: turn.role,
    content: turn.role === 'user' ? turn.content : turn.response.content,
    createdAt: new Date().toISOString(),
    ...(turn.role === 'assistant' ? { agentId: turn.response.agentId } : {}),
  }));
}

export function App() {
  const [facts] = useState<FundFacts>(starterFacts);
  const [goal] = useState('We want to launch a tokenized income product for approved investors.');
  const [selectedProjectId, setSelectedProjectId] = useState<ProjectDirectorySelection>('usequities');
  const [selectedWorkspaceTab, setSelectedWorkspaceTab] = useState<WorkspaceTabId>('overview');
  const [question, setQuestion] = useState('');
  const [brief, setBrief] = useState<RequirementBrief | undefined>();
  const [engineeringBrief, setEngineeringBrief] = useState<EngineeringBrief | undefined>();
  const [engineeringBriefError, setEngineeringBriefError] = useState<string | undefined>();
  const [isEngineeringBriefLoading, setIsEngineeringBriefLoading] = useState(false);
  const [smartContractArtifactSpec, setSmartContractArtifactSpec] = useState<SmartContractArtifactSpec | undefined>();
  const [smartContractArtifactPackage, setSmartContractArtifactPackage] = useState<SmartContractArtifactPackage | undefined>();
  const [smartContractCheckResult, setSmartContractCheckResult] = useState<SmartContractArtifactCheckResult | undefined>();
  const [smartContractEvidenceLite, setSmartContractEvidenceLite] = useState<SmartContractEvidenceLite | undefined>();
  const [smartContractCompileTestResult, setSmartContractCompileTestResult] = useState<SmartContractCompileTestResult | undefined>();
  const [walletSignedDeploymentState, setWalletSignedDeploymentState] = useState<WalletSignedDeploymentState>(
    initialWalletSignedDeploymentState,
  );
  const [recordNavOperationState, setRecordNavOperationState] = useState<RecordNavOperationState>(
    initialRecordNavOperationState,
  );
  const [walletWhitelistOperationState, setWalletWhitelistOperationState] = useState<WalletWhitelistOperationState>(
    initialWalletWhitelistOperationState,
  );
  const [walletAllocationMintOperationState, setWalletAllocationMintOperationState] =
    useState<WalletAllocationMintOperationState>(initialWalletAllocationMintOperationState);
  const [sepoliaDemoWalletReadinessState, setSepoliaDemoWalletReadinessState] =
    useState<SepoliaDemoWalletReadinessState>(initialSepoliaDemoWalletReadinessState);
  const [walletWhitelistTargetWallet, setWalletWhitelistTargetWallet] = useState('');
  const [lifecycleState, setLifecycleState] = useState<Mila26LifecycleState>(() => createInitialMila26LifecycleState());
  const [productSetupRecord, setProductSetupRecord] = useState<ProductSetupRecord>(() =>
    createInitialProductSetupRecord(starterFacts),
  );
  const [investorRegistryDraftWallet, setInvestorRegistryDraftWallet] = useState('');
  const [testWalletCountInput, setTestWalletCountInput] = useState('50');
  const [testInvestorWalletPack, setTestInvestorWalletPack] = useState<TestInvestorWalletPack | undefined>();
  const [testWalletLabMessage, setTestWalletLabMessage] = useState<string | undefined>();
  const [testWalletExportContent, setTestWalletExportContent] = useState<string | undefined>();
  const [fundingHelperMessage, setFundingHelperMessage] = useState<string | undefined>();
  const [workspacePersistenceStatus, setWorkspacePersistenceStatus] = useState<WorkspacePersistenceStatus>({
    status: 'idle',
    message: 'Current session only until saved.',
  });
  const [evidenceVaultStatus, setEvidenceVaultStatus] = useState<DurableRecordStatus>({
    status: 'idle',
    message: 'Durable Evidence Vault is empty until provider-derived records are saved.',
  });
  const [artifactVaultStatus, setArtifactVaultStatus] = useState<DurableRecordStatus>({
    status: 'idle',
    message: 'Generated artifacts are in session until saved.',
  });
  const [productSetupPackGeneratedAtIso, setProductSetupPackGeneratedAtIso] = useState<string | undefined>();
  const [productSetupPackStatus, setProductSetupPackStatus] = useState<string | undefined>();
  const [productSetupWalletMessage, setProductSetupWalletMessage] = useState<string | undefined>();
  const [contractOpsDeploymentWarningMessage, setContractOpsDeploymentWarningMessage] = useState<string | undefined>();
  const [productSetupWalletInputs, setProductSetupWalletInputs] = useState({
    admin_wallet: '',
  });
  const [durableEvidenceRecords, setDurableEvidenceRecords] = useState<WorkspaceEvidenceRecord[]>([]);
  const [durableArtifactRecords, setDurableArtifactRecords] = useState<WorkspaceArtifactRecord[]>([]);
  const [permittedStablecoinsInput, setPermittedStablecoinsInput] = useState('');
  const [investorRegistryError, setInvestorRegistryError] = useState<string | undefined>();
  const [smartContractGenerationStatus, setSmartContractGenerationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [smartContractGenerationError, setSmartContractGenerationError] = useState<string | undefined>();
  const [walletConnectionInput, setWalletConnectionInput] = useState<WalletConnectionReadModelInput>(
    initialWalletConnectionInput,
  );
  const [engineeringBotConversation, setEngineeringBotConversation] = useState<EngineeringBotConversationTurn[]>(() => [
    {
      id: 'assistant-initial',
      role: 'assistant',
      response: createInitialEngineerResponse(),
      source: 'local',
      assistantMode: 'engineering',
      copilotRoute: 'engineering',
      routeLabels: ['Engineering Bot'],
    },
  ]);
  const [botChatError, setBotChatError] = useState<string | undefined>();
  const [isBotReplyLoading, setIsBotReplyLoading] = useState(false);
  const [isLeftRailOpen, setIsLeftRailOpen] = useState(true);
  const [isRightRailOpen, setIsRightRailOpen] = useState(true);
  const [rightRailWidth, setRightRailWidth] = useState(440);
  const [isRightRailResizing, setIsRightRailResizing] = useState(false);
  const [isRightRailReviewExpanded, setIsRightRailReviewExpanded] = useState(false);
  const [isBriefPreviewExpanded, setIsBriefPreviewExpanded] = useState(false);
  const deploymentAttemptSequenceRef = useRef(0);
  const deploymentAttemptIdRef = useRef('');
  const recordNavOperationAttemptSequenceRef = useRef(0);
  const recordNavOperationAttemptIdRef = useRef('');
  const walletWhitelistOperationAttemptSequenceRef = useRef(0);
  const walletWhitelistOperationAttemptIdRef = useRef('');
  const walletAllocationMintOperationAttemptSequenceRef = useRef(0);
  const walletAllocationMintOperationAttemptIdRef = useRef('');
  const investorRegistrySequenceRef = useRef(0);
  const engineeringBotConversationSequenceRef = useRef(0);
  const copilotConversationEndRef = useRef<HTMLDivElement | null>(null);

  const rightRailMinWidth = 360;
  const rightRailDefaultWidth = 440;

  function clampRightRailWidth(width: number) {
    const maxWidth = Math.max(rightRailMinWidth, Math.floor(window.innerWidth * 0.45));
    return Math.min(Math.max(width, rightRailMinWidth), maxWidth);
  }

  useEffect(() => {
    const provider = getBrowserEthereumProvider();
    if (!provider) return undefined;

    const walletAdapter = createEip1193WalletAdapter(provider);
    let isActive = true;

    void walletAdapter.getSnapshot().then((snapshot) => {
      if (isActive) setWalletConnectionInput(applyWalletConnectionInput(snapshot));
    });

    const cleanup = walletAdapter.subscribe((snapshot) => {
      if (isActive) setWalletConnectionInput(applyWalletConnectionInput(snapshot));
    });

    return () => {
      isActive = false;
      cleanup();
    };
  }, []);

  useEffect(
    () => () => {
      deploymentAttemptSequenceRef.current += 1;
      deploymentAttemptIdRef.current = '';
      recordNavOperationAttemptSequenceRef.current += 1;
      recordNavOperationAttemptIdRef.current = '';
      walletWhitelistOperationAttemptSequenceRef.current += 1;
      walletWhitelistOperationAttemptIdRef.current = '';
    },
    [],
  );

  useEffect(() => {
    const anchor = copilotConversationEndRef.current;
    if (!anchor) return;
    anchor.scrollIntoView?.({ block: 'end' });
  }, [engineeringBotConversation.length, isBotReplyLoading]);

  useEffect(() => {
    if (!isRightRailResizing) return undefined;

    const handlePointerMove = (event: PointerEvent) => {
      setRightRailWidth(clampRightRailWidth(window.innerWidth - event.clientX));
    };
    const handlePointerUp = () => {
      setIsRightRailResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isRightRailResizing]);

  const requirementBriefContract = useMemo(
    () => (brief ? toRequirementBriefContract(brief, 'ready_for_approval') : undefined),
    [brief],
  );
  const approvedRequirementBriefContract = useMemo(
    () => (brief ? toRequirementBriefContract(brief, 'approved') : undefined),
    [brief],
  );
  const projectClosureLedger = useMemo(() => createDemoProjectClosureLedger(), []);
  const projectClosureReadModel = useMemo(
    () =>
      toProjectClosureReadModel({
        ledger: projectClosureLedger,
        hasRequirementBrief: Boolean(brief),
        hasEngineeringBrief: Boolean(engineeringBrief),
      }),
    [projectClosureLedger, brief, engineeringBrief],
  );
  const deploymentGateReadModel = useMemo(
    () =>
      toDeploymentGateReadModel({
        hasRequirementBrief: Boolean(brief),
        hasEngineeringBrief: Boolean(engineeringBrief),
        closureReadinessStatus: projectClosureReadModel.status,
        artifactSpecStatus: smartContractArtifactSpec?.status ?? 'not_started',
        artifactPreviewStatus: smartContractArtifactPackage?.status ?? 'not_started',
        checkResultStatus: smartContractCheckResult?.status ?? 'not_started',
        evidenceLiteStatus: smartContractEvidenceLite?.status ?? 'not_started',
        localCompileTestStatus: smartContractCompileTestResult?.status ?? 'not_run',
      }),
    [
      brief,
      engineeringBrief,
      projectClosureReadModel,
      smartContractArtifactSpec,
      smartContractArtifactPackage,
      smartContractCheckResult,
      smartContractEvidenceLite,
      smartContractCompileTestResult,
    ],
  );
  const walletSigningIntentReadModel = useMemo(
    () => toWalletSigningIntentReadModel(deploymentGateReadModel),
    [deploymentGateReadModel],
  );
  const walletConnectionReadModel = useMemo(
    () => toWalletConnectionReadModel(walletConnectionInput),
    [walletConnectionInput],
  );
  const walletAddressDisplay = formatWalletAddressForDisplay(walletConnectionReadModel.connectedWalletAddress);
  const deploymentConstructorParameters = useMemo(
    () =>
      walletConnectionReadModel.connectedWalletAddress && smartContractArtifactPackage && smartContractCompileTestResult
        ? createMila26DeploymentConstructorParameters({
            tokenName: facts.fundName,
            tokenSymbol: facts.tokenSymbol,
            connectedWalletAddressSource: walletConnectionReadModel.connectedWalletAddress,
            artifactPackageId: smartContractArtifactPackage.artifactId,
            compileCheckId: smartContractCompileTestResult.compileCheckId,
          })
        : undefined,
    [facts.fundName, facts.tokenSymbol, smartContractArtifactPackage, smartContractCompileTestResult, walletConnectionReadModel],
  );
  const unsignedDeploymentIntentReadModel = useMemo(
    () =>
      toUnsignedDeploymentIntentReadModel({
        deploymentGate: deploymentGateReadModel,
        walletSigningIntent: walletSigningIntentReadModel,
        walletConnection: walletConnectionReadModel,
        compiledArtifactReference: {
          artifactPackageId: smartContractArtifactPackage?.artifactId,
          specId: smartContractArtifactSpec?.specId,
          contractName: mila26RestrictedFundTokenDeploymentArtifact.contractName,
          artifactSource: 'local_compiled_artifact',
          artifactStatus: smartContractArtifactPackage ? 'available' : 'missing',
          abiStatus: mila26RestrictedFundTokenDeploymentArtifact.abi.length > 0 ? 'available' : 'missing',
          bytecodeStatus: mila26RestrictedFundTokenDeploymentArtifact.bytecode.length > 2 ? 'available' : 'missing',
          bytecodeHash: mila26RestrictedFundTokenDeploymentArtifact.bytecodeHash,
          compileCheckId: smartContractCompileTestResult?.compileCheckId,
          compileTestStatus: smartContractCompileTestResult?.status ?? 'not_run',
        },
        constructorParameters: deploymentConstructorParameters,
      }),
    [
      deploymentGateReadModel,
      walletSigningIntentReadModel,
      walletConnectionReadModel,
      smartContractArtifactPackage,
      smartContractArtifactSpec,
      smartContractCompileTestResult,
      deploymentConstructorParameters,
    ],
  );
  const deploymentEvidenceReadModel = useMemo(
    () =>
      toDeploymentEvidenceReadModel({
        deploymentState: walletSignedDeploymentState,
        artifactReference: {
          artifactPackageId: smartContractArtifactPackage?.artifactId,
          contractName: mila26RestrictedFundTokenDeploymentArtifact.contractName,
          bytecodeHash: mila26RestrictedFundTokenDeploymentArtifact.bytecodeHash,
          compileCheckId: smartContractCompileTestResult?.compileCheckId,
        },
      }),
    [walletSignedDeploymentState, smartContractArtifactPackage, smartContractCompileTestResult],
  );
  const recordNavOperationReadModel = useMemo(
    () =>
      toRecordNavOperationReadModel({
        operationState: recordNavOperationState,
        deploymentEvidence: deploymentEvidenceReadModel,
      }),
    [recordNavOperationState, deploymentEvidenceReadModel],
  );
  const normalizedWhitelistTargetWallet = normalizeWalletWhitelistTargetAddress(walletWhitelistTargetWallet);
  const walletWhitelistOperationReadModel = useMemo(
    () =>
      toWalletWhitelistOperationReadModel({
        operationState: walletWhitelistOperationState,
        deploymentEvidence: deploymentEvidenceReadModel,
        walletConnectedOnSepolia:
          walletConnectionReadModel.walletConnectionStatus === 'connected' && walletConnectionReadModel.chainStatus === 'sepolia',
        targetWalletAddress: normalizedWhitelistTargetWallet,
        whitelistFunctionAvailable: hasSetWalletAllowedFunction(mila26RestrictedFundTokenDeploymentArtifact.abi),
      }),
    [
      walletWhitelistOperationState,
      deploymentEvidenceReadModel,
      walletConnectionReadModel.walletConnectionStatus,
      walletConnectionReadModel.chainStatus,
      normalizedWhitelistTargetWallet,
    ],
  );
  const lifecycleReadModel = useMemo(() => toMila26LifecycleReadModel(lifecycleState), [lifecycleState]);
  const productSetupReadModel = useMemo(() => toProductSetupReadModel(productSetupRecord), [productSetupRecord]);
  const productSetupPendingReviewCount = productSetupRecord.pendingSuggestedUpdates.length;
  const productSetupDraftedProfileRows = productSetupReadModel.profileRows.filter((row) => row.provenanceLabel !== 'Missing');
  const productSetupRowsNeedingReview = productSetupReadModel.profileRows.filter((row) =>
    ['Inferred', 'Assumed', 'Needs review'].includes(row.provenanceLabel),
  );
  const productSetupProgressPercent = Math.round(
    (productSetupDraftedProfileRows.length / Math.max(productSetupReadModel.profileRows.length, 1)) * 100,
  );
  const productSetupProgressLabel =
    `${productSetupDraftedProfileRows.length} of ${productSetupReadModel.profileRows.length} drafted` +
    (productSetupRowsNeedingReview.length > 0 ? ` · ${productSetupRowsNeedingReview.length} need review` : '');
  const allocationMint = lifecycleReadModel.allocationMint;
  const selectedAllocationMintRegistryEntry = useMemo(
    () =>
      lifecycleReadModel.investorRegistry.entries.find((entry) =>
        walletWhitelistTargetsMatch(entry.normalizedWalletAddress, allocationMint.targetWalletAddress),
      ),
    [lifecycleReadModel.investorRegistry.entries, allocationMint.targetWalletAddress],
  );
  const selectedAllocationMintInvestorWhitelisted =
    selectedAllocationMintRegistryEntry?.status === 'whitelisted_local_session_only';
  const walletAllocationMintOperationReadModel = useMemo(
    () =>
      toWalletAllocationMintOperationReadModel({
        operationState: walletAllocationMintOperationState,
        deploymentEvidence: deploymentEvidenceReadModel,
        walletConnectedOnSepolia:
          walletConnectionReadModel.walletConnectionStatus === 'connected' && walletConnectionReadModel.chainStatus === 'sepolia',
        allocationMint,
        selectedInvestorWhitelisted: selectedAllocationMintInvestorWhitelisted,
        mintFunctionAvailable: hasMintAllocationFunction(mila26RestrictedFundTokenDeploymentArtifact.abi),
      }),
    [
      walletAllocationMintOperationState,
      deploymentEvidenceReadModel,
      walletConnectionReadModel.walletConnectionStatus,
      walletConnectionReadModel.chainStatus,
      allocationMint,
      selectedAllocationMintInvestorWhitelisted,
    ],
  );
  const testInvestorWalletPublicRecords = useMemo(
    () => (testInvestorWalletPack ? toTestInvestorWalletPublicRecords(testInvestorWalletPack) : []),
    [testInvestorWalletPack],
  );
  const sepoliaDemoWalletReadinessReadModel = useMemo(
    () =>
      toSepoliaDemoWalletReadinessReadModel({
        state: sepoliaDemoWalletReadinessState,
        walletConnection: walletConnectionReadModel,
        investorWalletCount: lifecycleReadModel.investorRegistry.entryCount,
        paymentAddress: lifecycleState.subscriptionParameters.paymentAddress,
        redemptionWalletAddress: lifecycleState.redemptionParameters.redemptionWalletAddress,
        generatedTestWalletCount: testInvestorWalletPack?.createdCount ?? 0,
        generatedTestInvestorWallets: testInvestorWalletPublicRecords,
      }),
    [
      sepoliaDemoWalletReadinessState,
      walletConnectionReadModel,
      lifecycleReadModel.investorRegistry.entryCount,
      lifecycleState.subscriptionParameters.paymentAddress,
      lifecycleState.redemptionParameters.redemptionWalletAddress,
      testInvestorWalletPack,
      testInvestorWalletPublicRecords,
    ],
  );
  useEffect(() => {
    if (walletWhitelistOperationState.operationStatus !== 'confirmed') return;
    setLifecycleState((current) => markInvestorWalletWhitelisted(current, walletWhitelistOperationState.targetWalletAddress));
  }, [walletWhitelistOperationState.operationStatus, walletWhitelistOperationState.targetWalletAddress]);

  const projectLifecycleReadModel = useMemo(
    () =>
      toProjectLifecycleReadModel({
        hasRequirementBrief: Boolean(brief),
        hasEngineeringBrief: Boolean(engineeringBrief),
        closureReadiness: projectClosureReadModel,
        artifactSpecStatus: smartContractArtifactSpec ? smartContractArtifactSpec.status : 'not_started',
        checkStatus:
          smartContractCompileTestResult?.status === 'passed'
            ? 'passed'
            : smartContractCompileTestResult?.status === 'failed'
              ? 'failed'
              : undefined,
        evidenceStatus: smartContractEvidenceLite?.status === 'ready' ? 'ready' : undefined,
        deploymentGateStatus:
          deploymentGateReadModel.gateStatus === 'review_ready'
            ? 'ready'
            : deploymentGateReadModel.preDeploymentReadiness === 'blocked'
              ? 'blocked'
              : undefined,
      }),
    [
      brief,
      engineeringBrief,
      projectClosureReadModel,
      smartContractArtifactSpec,
      smartContractCompileTestResult,
      smartContractEvidenceLite,
      deploymentGateReadModel,
    ],
  );
  const cockpitActionViewModel = useMemo(
    () => toCockpitActionViewModel(projectLifecycleReadModel),
    [projectLifecycleReadModel],
  );
  const smartContractCompileTestPresentation = useMemo(
    () =>
      smartContractCompileTestResult
        ? toSmartContractCompileTestPresentation(smartContractCompileTestResult)
        : undefined,
    [smartContractCompileTestResult],
  );
  const smartContractControlPanel = useMemo(
    () =>
      toSmartContractControlPanelViewModel(projectLifecycleReadModel, {
        specStatus: smartContractArtifactSpec?.status,
        artifactStatus: smartContractArtifactPackage?.status,
        checkStatus: smartContractCheckResult?.status,
        evidenceStatus: smartContractEvidenceLite?.status,
        ...smartContractCompileTestPresentation?.scpStatus,
        deploymentGateStatus: deploymentGateReadModel.gateStatus,
        preDeploymentReadiness: deploymentGateReadModel.preDeploymentReadiness,
        deploymentExecutionStatus: deploymentGateReadModel.deploymentExecutionStatus,
        walletSigningIntentStatus: walletSigningIntentReadModel.intentStatus,
        walletExecutionStatus: walletSigningIntentReadModel.walletExecutionStatus,
        walletConnectionStatus: walletConnectionReadModel.walletConnectionStatus,
        walletProviderStatus: walletConnectionReadModel.provider.providerStatus,
        walletChainStatus: walletConnectionReadModel.chainStatus,
        connectedWalletAddressDisplay: walletAddressDisplay,
        walletSignedDeploymentStatus: walletSignedDeploymentState.deploymentStatus,
        deploymentTransactionHash: walletSignedDeploymentState.transactionHash,
        deploymentContractAddress: walletSignedDeploymentState.contractAddress,
        deploymentReceiptStatus: walletSignedDeploymentState.receiptStatus,
        deploymentLocalSessionOnly: walletSignedDeploymentState.localSessionOnly,
        deploymentEvidence: deploymentEvidenceReadModel,
        recordNavOperation: recordNavOperationReadModel,
        walletWhitelistOperation: walletWhitelistOperationReadModel,
        walletAllocationMintOperation: walletAllocationMintOperationReadModel,
        customEvents: smartContractArtifactSpec?.eventModel?.customEvents,
      }),
    [
      projectLifecycleReadModel,
      smartContractArtifactSpec,
      smartContractArtifactPackage,
      smartContractCheckResult,
      smartContractEvidenceLite,
      smartContractCompileTestPresentation,
      deploymentGateReadModel,
      walletSigningIntentReadModel,
      walletConnectionReadModel,
      walletAddressDisplay,
      walletSignedDeploymentState,
      deploymentEvidenceReadModel,
      recordNavOperationReadModel,
      walletWhitelistOperationReadModel,
      walletAllocationMintOperationReadModel,
    ],
  );
  const workspacePresentation = useMemo(
    () =>
      toWorkspacePresentation({
        hasRequirementBrief: Boolean(brief),
        hasEngineeringBrief: Boolean(engineeringBrief),
        hasSmartContractSpec: Boolean(smartContractArtifactSpec),
        hasDeploymentEvidence: deploymentEvidenceReadModel.status === 'confirmed',
        isWalletWhitelistAvailable: true,
        isNavRecordingAvailable: true,
        lifecycle: lifecycleReadModel,
      }),
    [
      brief,
      engineeringBrief,
      smartContractArtifactSpec,
      deploymentEvidenceReadModel.status,
      lifecycleReadModel,
    ],
  );
  const activeWorkspaceTab =
    workspacePresentation.tabs.find((tab) => tab.id === selectedWorkspaceTab) ?? workspacePresentation.tabs[0];
  const productSetupChatContext = useMemo(() => {
    const canonicalFieldKeys: ProductSetupFieldKey[] = [
      'product_name',
      'token_symbol',
      'product_type',
      'base_currency',
      'protocol_base',
      'expected_investor_count',
      'investor_wallet_rule',
      'subscription_cadence',
      'redemption_cadence',
      'income_payout_cadence',
      'redemption_payout_cadence',
      'subscription_stablecoins',
      'burn_lock_rule',
      'nav_cadence',
      'nav_source',
      'initial_distribution_date',
      'initial_investor_register_rule',
      'maturity_date',
    ];

    return {
      activeTab: {
        id: activeWorkspaceTab.id,
        label: activeWorkspaceTab.label,
      },
      productSetup: {
        status: productSetupRecord.status,
        selectedProtocolBase: fieldDisplayValue(productSetupRecord.fields.protocol_base) || null,
        recommendedProtocol: productSetupReadModel.protocolRecommendation.recommendedProtocol,
        currentExecutablePrototype: productSetupReadModel.protocolRecommendation.executablePrototypeLabel,
        missingCanonicalInputs: productSetupReadModel.missingEssentials.map((field) => field.label),
        pendingSuggestedUpdates: productSetupRecord.pendingSuggestedUpdates.slice(0, 8).map((update) => ({
          field: productSetupRecord.fields[update.fieldKey].label,
          fieldKey: update.fieldKey,
          proposedValue: Array.isArray(update.proposedValue) ? update.proposedValue.join(', ') : String(update.proposedValue),
          confidence: update.confidence,
        })),
        canonicalFields: Object.fromEntries(
          canonicalFieldKeys.map((fieldKey) => {
            const field = productSetupRecord.fields[fieldKey];
            return [
              fieldKey,
              {
                label: field.label,
                value: fieldDisplayValue(field) || field.rolePlaceholder || null,
                status: field.status,
                sourceType: field.sourceType ?? null,
                sourceRef: field.sourceRef ?? null,
                confirmedByUser: field.confirmedByUser,
              },
            ];
          }),
        ),
        protocolRecommendationSource: 'derived_from_current_canonical_fields',
        protocolRecommendationCaveat:
          'This is a recommendation only. Treat protocol_base as selected only after the user confirms the Protocol base field.',
      },
    };
  }, [activeWorkspaceTab.id, activeWorkspaceTab.label, productSetupReadModel, productSetupRecord]);
  const shouldShowSmartContractControl = false;
  const subscriptionRedemptionTemplate = lifecycleReadModel.subscriptionRedemptionTemplate;
  const hasSubscriptionRedemptionTemplateInput = subscriptionRedemptionTemplate.status !== 'needs_parameters';
  const selectedProject = demoProjectFolders.find((project) => project.id === selectedProjectId);
  const activeProjectTitle = selectedProject?.title ?? 'All Projects';
  const tokenModelSummary =
    requirementBriefContract?.tokenModel.assumption ?? 'Token model will be confirmed in the Requirement Brief.';
  const primaryWorkflowAction = cockpitActionViewModel.primaryEngineeringBotAction;
  const nextBestActionText =
    lifecycleReadModel.investorRegistry.entryCount === 0
      ? 'Start by registering investor wallet addresses so subscription, whitelisting, servicing, and evidence can use the same lifecycle state.'
      : lifecycleReadModel.subscription.status !== 'ready'
        ? 'Define subscription parameters so the subscription-redemption template can use permitted stablecoins, payment address, and payment-per-token terms.'
        : lifecycleReadModel.redemption.status !== 'ready'
          ? 'Define redemption parameters so the template can capture the redemption wallet, payout stablecoin, payout-per-token amount, and delay.'
          : 'Review the subscription-redemption template handoff generated from the current shared lifecycle state.';
  const isWalletConnectionComplete =
    walletConnectionReadModel.walletConnectionStatus === 'connected' && walletConnectionReadModel.chainStatus === 'sepolia';
  const canRequestSepoliaDeployment =
    smartContractGenerationStatus === 'ready' &&
    unsignedDeploymentIntentReadModel.intentStatus === 'review_ready' &&
    walletSignedDeploymentState.deploymentStatus !== 'confirmed' &&
    !isDeploymentAttemptInFlight(walletSignedDeploymentState);
  const deploymentActionDisabledReason = isDeploymentAttemptInFlight(walletSignedDeploymentState)
    ? 'A wallet deployment request is already awaiting confirmation or receipt.'
    : walletSignedDeploymentState.deploymentStatus === 'confirmed'
      ? 'Wallet-signed Sepolia deployment is already confirmed in this local session.'
      : unsignedDeploymentIntentReadModel.blockedReasons[0] ?? 'Complete wallet connection and unsigned deployment intent review first.';
  const canRequestRecordNavOperation =
    smartContractGenerationStatus === 'ready' &&
    isWalletConnectionComplete &&
    deploymentEvidenceReadModel.status === 'confirmed' &&
    deploymentEvidenceReadModel.evidenceStrength === 'confirmed_receipt' &&
    deploymentEvidenceReadModel.contractAddressSource === 'receipt_returned' &&
    Boolean(deploymentEvidenceReadModel.contractAddress) &&
    recordNavOperationState.operationStatus !== 'confirmed' &&
    !isRecordNavOperationInFlight(recordNavOperationState) &&
    !recordNavOperationAttemptIdRef.current;
  const recordNavOperationDisabledReason = isRecordNavOperationInFlight(recordNavOperationState)
    ? 'A Record NAV operation is already awaiting wallet confirmation or receipt.'
    : recordNavOperationState.operationStatus === 'confirmed'
      ? 'Record NAV operation is confirmed for this local session.'
      : deploymentEvidenceReadModel.status !== 'confirmed'
        ? 'Confirm wallet-signed Sepolia deployment evidence before recording NAV.'
        : !isWalletConnectionComplete
          ? 'Connect a Sepolia wallet before recording NAV.'
          : 'Record NAV operation is blocked by a precondition.';
  const whitelistTargetIsValid = isValidNonZeroEvmAddress(normalizedWhitelistTargetWallet);
  const whitelistFunctionAvailable = hasSetWalletAllowedFunction(mila26RestrictedFundTokenDeploymentArtifact.abi);
  const mintFunctionAvailable = hasMintAllocationFunction(mila26RestrictedFundTokenDeploymentArtifact.abi);
  const selectedWhitelistRegistryEntry = lifecycleReadModel.investorRegistry.entries.find((entry) =>
    walletWhitelistTargetsMatch(entry.normalizedWalletAddress, normalizedWhitelistTargetWallet),
  );
  const selectedWhitelistTargetAlreadyWhitelisted =
    selectedWhitelistRegistryEntry?.status === 'whitelisted_local_session_only';
  const selectedWhitelistTargetAlreadyConfirmed =
    walletWhitelistOperationState.operationStatus === 'confirmed' &&
    walletWhitelistTargetsMatch(walletWhitelistOperationState.targetWalletAddress, normalizedWhitelistTargetWallet);
  const canRequestWalletWhitelistOperation =
    smartContractGenerationStatus === 'ready' &&
    isWalletConnectionComplete &&
    deploymentEvidenceReadModel.status === 'confirmed' &&
    deploymentEvidenceReadModel.evidenceStrength === 'confirmed_receipt' &&
    deploymentEvidenceReadModel.contractAddressSource === 'receipt_returned' &&
    Boolean(deploymentEvidenceReadModel.contractAddress) &&
    isValidNonZeroEvmAddress(deploymentEvidenceReadModel.contractAddress) &&
    whitelistFunctionAvailable &&
    whitelistTargetIsValid &&
    Boolean(selectedWhitelistRegistryEntry?.canUseForWhitelist) &&
    !selectedWhitelistTargetAlreadyConfirmed &&
    !isWalletWhitelistOperationInFlight(walletWhitelistOperationState) &&
    !walletWhitelistOperationAttemptIdRef.current;
  const walletWhitelistOperationDisabledReason = (() => {
    if (isWalletWhitelistOperationInFlight(walletWhitelistOperationState)) {
      return 'A Wallet Whitelist operation is already awaiting wallet confirmation or receipt.';
    }
    if (selectedWhitelistTargetAlreadyConfirmed) return 'Selected wallet is whitelisted in this local session.';
    if (deploymentEvidenceReadModel.status !== 'confirmed') {
      return 'Confirm wallet-signed Sepolia deployment evidence before whitelisting a wallet.';
    }
    if (!isWalletConnectionComplete) return 'Connect a Sepolia wallet before whitelisting a wallet.';
    if (!normalizedWhitelistTargetWallet) return 'Enter a target wallet address before whitelisting.';
    if (!whitelistTargetIsValid) return 'Target wallet address must be a valid non-zero EVM address.';
    if (!selectedWhitelistRegistryEntry) return 'Register this wallet in Investor Wallets before whitelisting.';
    if (selectedWhitelistTargetAlreadyWhitelisted) return 'Selected wallet is already whitelisted in this local session.';
    if (!selectedWhitelistRegistryEntry.canUseForWhitelist) return 'Resolve this investor wallet before whitelisting.';
    if (!whitelistFunctionAvailable) return 'setWalletAllowed(address,bool) is missing from the deployment artifact ABI.';
    return 'Contract authorization is enforced on-chain.';
  })();
  const selectedAllocationMintAlreadyConfirmed =
    walletAllocationMintOperationState.operationStatus === 'confirmed' &&
    walletWhitelistTargetsMatch(walletAllocationMintOperationState.targetWalletAddress, allocationMint.targetWalletAddress) &&
    walletAllocationMintOperationState.tokenAmount?.trim() === allocationMint.tokenAmount?.trim();
  const canRequestAllocationMintOperation =
    smartContractGenerationStatus === 'ready' &&
    isWalletConnectionComplete &&
    deploymentEvidenceReadModel.status === 'confirmed' &&
    deploymentEvidenceReadModel.evidenceStrength === 'confirmed_receipt' &&
    deploymentEvidenceReadModel.contractAddressSource === 'receipt_returned' &&
    Boolean(deploymentEvidenceReadModel.contractAddress) &&
    isValidNonZeroEvmAddress(deploymentEvidenceReadModel.contractAddress) &&
    mintFunctionAvailable &&
    allocationMint.canReviewAllocationMint &&
    selectedAllocationMintInvestorWhitelisted &&
    !selectedAllocationMintAlreadyConfirmed &&
    !isWalletAllocationMintOperationInFlight(walletAllocationMintOperationState) &&
    !walletAllocationMintOperationAttemptIdRef.current;
  const allocationMintOperationDisabledReason = (() => {
    if (isWalletAllocationMintOperationInFlight(walletAllocationMintOperationState)) {
      return 'An Allocation / Mint operation is already awaiting wallet confirmation or receipt.';
    }
    if (selectedAllocationMintAlreadyConfirmed) return 'Allocation / Mint is confirmed for this wallet and amount in this local session.';
    if (deploymentEvidenceReadModel.status !== 'confirmed') {
      return 'Confirm wallet-signed Sepolia deployment evidence before Allocation / Mint.';
    }
    if (!isWalletConnectionComplete) return 'Connect a Sepolia wallet before Allocation / Mint.';
    if (!mintFunctionAvailable) return 'mintAllocation(address,uint256) is missing from the deployment artifact ABI.';
    if (!allocationMint.canReviewAllocationMint) return allocationMint.statusDetail;
    if (!selectedAllocationMintRegistryEntry) return 'Select a registered investor wallet before Allocation / Mint.';
    if (!selectedAllocationMintInvestorWhitelisted) return 'Whitelist the selected investor wallet before Allocation / Mint.';
    return 'Contract authorization is enforced on-chain.';
  })();
  const generatedArtifactCards = useMemo<GeneratedArtifactCard[]>(
    () =>
      smartContractGenerationStatus === 'ready'
        ? [
            {
              label: 'Smart Contract Spec',
              status: 'Generated',
              detail: `${smartContractArtifactSpec?.tokenStandardProfile?.mila26RestrictionProfile ?? 'restricted_erc20'} / ERC-20-compatible profile.`,
              source: 'Smart contract spec route',
            },
            {
              label: 'Artifact Preview',
              status: 'Preview only',
              detail: `${smartContractArtifactPackage?.sourceModel?.sourceFiles.length ?? 0} deterministic preview file(s). Preview artifact not deployed or audited.`,
              source: 'Artifact preview route',
            },
            {
              label: 'Check Result',
              status: smartContractCheckResult?.status === 'passed' ? 'Spec-consistency passed' : 'Available',
              detail:
                smartContractCheckResult?.summary ??
                'Spec-consistency result available. Local compile/test foundation is represented separately.',
              source: 'Deterministic static preview',
            },
            {
              label: 'Evidence-Lite',
              status: smartContractEvidenceLite?.status === 'ready' ? 'Draft evidence linked' : 'Available',
              detail: `${smartContractEvidenceLite?.evidenceItems?.length ?? 0} evidence item(s), ${smartContractEvidenceLite?.eventEvidenceRefs?.length ?? 0} event mapping(s).`,
              source: 'Evidence-lite linkage',
            },
            ...(smartContractCompileTestPresentation ? [smartContractCompileTestPresentation.artifactCard] : []),
            {
              label: 'Deployment Gate Review',
              status: formatDeploymentGateStatus(deploymentGateReadModel.gateStatus),
              detail: `Pre-deployment readiness: ${formatPreDeploymentReadiness(deploymentGateReadModel.preDeploymentReadiness)}. Deployment execution: Blocked.`,
              source: 'Deployment gate',
            },
            {
              label: 'Wallet Signing Intent',
              status: formatWalletSigningIntentStatus(walletSigningIntentReadModel.intentStatus),
              detail:
                'Wallet-signed deployment and selected Sepolia operations use the user wallet. Backend never holds private keys.',
              source: 'Wallet signing intent',
            },
            {
              label: 'Wallet Connection',
              status: formatWalletConnectionStatus(walletConnectionReadModel.walletConnectionStatus),
              detail: `Wallet chain: ${formatWalletChainStatus(walletConnectionReadModel.chainStatus)}. ${walletAddressDisplay ? `Connected wallet: ${walletAddressDisplay}.` : 'No wallet address.'} Connection only; no signing or deployment.`,
              source: 'Wallet connection',
            },
            {
              label: 'Sepolia Deployment',
              status: formatWalletSignedDeploymentStatus(walletSignedDeploymentState.deploymentStatus),
              detail: `${walletSignedDeploymentState.transactionHash ? `Transaction hash: ${walletSignedDeploymentState.transactionHash}.` : 'No transaction hash.'} ${walletSignedDeploymentState.contractAddress ? `Contract address: ${walletSignedDeploymentState.contractAddress}.` : 'No contract address.'} Deployment state is local-session-only.`,
              source: 'Wallet-signed deployment',
            },
            {
              label: 'Deployment Evidence',
              status: deploymentEvidenceReadModel.statusLabel,
              detail: `${deploymentEvidenceReadModel.evidencePersistenceLabel}. Evidence strength: ${deploymentEvidenceReadModel.evidenceStrengthLabel}. Transaction hash source: ${deploymentEvidenceReadModel.transactionHashSourceLabel}. Contract address source: ${deploymentEvidenceReadModel.contractAddressSourceLabel}.`,
              source: 'Local-session evidence',
            },
            {
              label: 'Record NAV Operation',
              status: recordNavOperationReadModel.statusLabel,
              detail: `Operation evidence: ${recordNavOperationReadModel.operationEvidencePersistenceLabel}. Transaction hash source: ${recordNavOperationReadModel.operationTransactionHashSourceLabel}. Receipt source: ${recordNavOperationReadModel.operationReceiptSourceLabel}. Event evidence: ${recordNavOperationReadModel.eventEvidenceSourceLabel}.`,
              source: 'Wallet-signed operation',
            },
            {
              label: 'Wallet Whitelist Operation Evidence',
              status: walletWhitelistOperationReadModel.statusLabel,
              detail: `Wallet whitelist evidence: ${walletWhitelistOperationReadModel.operationEvidencePersistenceLabel}. Transaction hash source: ${walletWhitelistOperationReadModel.operationTransactionHashSourceLabel}. Receipt source: ${walletWhitelistOperationReadModel.operationReceiptSourceLabel}. WalletWhitelisted event: ${walletWhitelistOperationReadModel.eventEvidenceStatusLabel}. Contract authorization is enforced on-chain.`,
              source: 'Wallet-signed operation',
            },
            {
              label: 'Allocation / Mint Operation Evidence',
              status: walletAllocationMintOperationReadModel.statusLabel,
              detail: `Allocation / Mint evidence: ${walletAllocationMintOperationReadModel.operationEvidencePersistenceLabel}. Transaction hash source: ${walletAllocationMintOperationReadModel.operationTransactionHashSourceLabel}. Receipt source: ${walletAllocationMintOperationReadModel.operationReceiptSourceLabel}. AllocationMinted event: ${walletAllocationMintOperationReadModel.eventEvidenceStatusLabel}.`,
              source: 'Wallet-signed operation',
            },
            {
              label: 'Sepolia Demo Wallet Readiness',
              status: sepoliaDemoWalletReadinessReadModel.statusLabel,
              detail: sepoliaDemoWalletReadinessReadModel.statusDetail,
              source: 'Wallet readiness check',
            },
            {
              label: 'Smart Contract Operations',
              status: deploymentEvidenceReadModel.status === 'confirmed' ? 'Record NAV, Wallet Whitelist, and Allocation / Mint gated' : 'Waiting for deployment evidence',
              detail:
                'Contract Ops exposes Record NAV Event, Whitelist Wallet, and Allocation / Mint when their wallet, deployment, ABI, parameter, and evidence gates are satisfied. Other operations need explicit adapters before release.',
              source: 'Contract Ops boundary',
            },
            {
              label: 'Deployment / Signing / Audit',
              status: walletSignedDeploymentState.deploymentStatus === 'confirmed' ? 'Sepolia deployment confirmed' : 'Not executed',
              detail:
                'Not audited. No production approval. Wallet connection alone does not execute deployment or operations.',
              source: 'Safety boundary',
            },
          ]
        : [],
    [
      smartContractArtifactPackage,
      smartContractArtifactSpec,
      smartContractCheckResult,
      smartContractCompileTestPresentation,
      smartContractEvidenceLite,
      smartContractGenerationStatus,
      deploymentGateReadModel,
      walletSigningIntentReadModel,
      walletConnectionReadModel,
      walletAddressDisplay,
      walletSignedDeploymentState,
      deploymentEvidenceReadModel,
      recordNavOperationReadModel,
      walletWhitelistOperationReadModel,
      walletAllocationMintOperationReadModel,
      sepoliaDemoWalletReadinessReadModel,
    ],
  );

  function nextEngineeringBotConversationTurnId(prefix: 'user' | 'assistant') {
    engineeringBotConversationSequenceRef.current += 1;
    return `${prefix}-${engineeringBotConversationSequenceRef.current}`;
  }

  function publishEngineerResponse(
    response: BlockchainEngineerChatResponse,
    source: EngineerAnswerSource,
    assistantMode: AssistantMode = 'engineering',
    copilotRoute: ZiLiOSCopilotRouteKind = 'engineering',
    routeLabels: string[] = ['Engineering Bot'],
  ) {
    setEngineeringBotConversation((turns) => [
      ...turns,
      {
        id: nextEngineeringBotConversationTurnId('assistant'),
        role: 'assistant',
        response,
        source,
        assistantMode,
        copilotRoute,
        routeLabels,
      },
    ]);
  }

  function renderEngineerResponse(response: BlockchainEngineerChatResponse) {
    const viewModel = toBlockchainEngineerResponseViewModel(response);
    const suppressResponseNextAction = activeWorkspaceTab.id === 'requirements';
    const visibleSections = viewModel.sections.filter(
      (section) =>
        section.kind !== 'risk_notes' &&
        !(suppressResponseNextAction && section.kind === 'next_recommended_action'),
    );

    return (
      <div className="engineer-response-view">
        <p>{viewModel.summary}</p>
        {visibleSections.map((section) => (
          <section className="engineer-response-section" key={section.kind}>
            <h4>{section.title}</h4>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  function sendProductSetupHandoff(handoffId: string) {
    setProductSetupRecord((current) => sendProductSetupHandoffNote(current, handoffId));
  }

  function reviewProductSetupHandoff(handoffId: string) {
    setProductSetupRecord((current) => reviewProductSetupHandoffNote(current, handoffId));
  }

  function renderProductSetupDraftNotes(target: ProductSetupHandoffTarget) {
    const notes = productSetupRecord.downstreamHandoffNotes.filter(
      (note) => note.target === target && (note.status === 'sent_as_draft_note' || note.status === 'reviewed_in_target_tab'),
    );
    if (notes.length === 0) return null;

    return (
      <section className="product-setup-draft-notes" aria-label={`${productSetupHandoffTargetLabel(target)} Product Setup draft notes`}>
        <div className="registry-panel-heading compact-subsection-heading">
          <div>
            <h4>Product Setup draft notes</h4>
            <p>Review these notes when you are ready. They do not change this tab's confirmed settings until you apply them here.</p>
          </div>
          <span>{notes.length} note(s)</span>
        </div>
        <div className="product-setup-handoff-list">
          {notes.map((note) => (
            <article key={note.id}>
              <div>
                <span>{note.title}</span>
                <p>{note.detail}</p>
                <small>Source: Product Setup PRD · {note.sentAtIso ? `Sent ${note.sentAtIso}` : 'Draft note'}</small>
              </div>
              <button
                type="button"
                className="workflow-button"
                disabled={note.status === 'reviewed_in_target_tab'}
                onClick={() => reviewProductSetupHandoff(note.id)}
              >
                {note.status === 'reviewed_in_target_tab' ? 'Reviewed in this tab' : 'Mark reviewed in this tab'}
              </button>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function createBrief() {
    const nextBrief = createRequirementBrief(facts, goal);
    setBrief(nextBrief);
    setEngineeringBrief(undefined);
    setEngineeringBriefError(undefined);
    resetSmartContractGeneration();
  }

  async function createEngineeringBrief() {
    if (!brief) return;

    setIsEngineeringBriefLoading(true);
    setEngineeringBriefError(undefined);
    resetSmartContractGeneration();

    const result = await generateEngineeringBrief({
      requirementBrief: toRequirementBriefContract(brief, 'approved'),
    });

    setIsEngineeringBriefLoading(false);

    if (result.ok) {
      setEngineeringBrief(result.data);
      resetSmartContractGeneration();
      return;
    }

    setEngineeringBriefError(result.message);
  }

  async function askBot() {
    const submittedQuestion = question.trim();
    if (!submittedQuestion) {
      setBotChatError('Enter a question before asking the bot.');
      return;
    }

    setIsBotReplyLoading(true);
    setBotChatError(undefined);
    const copilotRoute = routeZiLiOSCopilotMessage(submittedQuestion);
    setEngineeringBotConversation((turns) => [
      ...turns,
      {
        id: nextEngineeringBotConversationTurnId('user'),
        role: 'user',
        content: submittedQuestion,
        assistantMode: copilotRoute.assistantMode,
        copilotRoute: copilotRoute.route,
      },
    ]);
    const chatSourceRef = `chat_turn_${Date.now()}`;
    const productSetupSuggestions =
      copilotRoute.shouldExtractRequirements ? createProductSetupSuggestionsFromText(submittedQuestion, chatSourceRef) : [];
    const unsupportedRequirementDecisions =
      copilotRoute.shouldExtractRequirements ? createUnsupportedRequirementDecisionsFromText(submittedQuestion, chatSourceRef) : [];
    const currentTurnExtractedFacts = productSetupSuggestions.map((update) => ({
      fieldKey: update.fieldKey,
      label: productSetupRecord.fields[update.fieldKey].label,
      value: update.proposedValue,
      sourceType: update.sourceType,
      sourceRef: update.sourceRef,
      confidence: update.confidence,
    }));
    if (productSetupSuggestions.length > 0 || unsupportedRequirementDecisions.length > 0) {
      setProductSetupRecord((current) =>
        setUnsupportedRequirementDecisions(setProductSetupSuggestedUpdates(current, productSetupSuggestions), unsupportedRequirementDecisions),
      );
    }

    const workspaceDefaults = brief
      ? {
          productName: {
            value: brief.fundFacts.fundName,
            sourceType: 'approved_requirement_brief',
            sourceRef: brief.id,
          },
          tokenSymbol: {
            value: brief.fundFacts.tokenSymbol,
            sourceType: 'approved_requirement_brief',
            sourceRef: brief.id,
          },
          jurisdiction: {
            value: brief.fundFacts.jurisdiction,
            sourceType: 'approved_requirement_brief',
            sourceRef: brief.id,
          },
          selectedModules: {
            value: brief.modules.filter((module) => module.enabled).map((module) => module.id),
            sourceType: 'approved_requirement_brief',
            sourceRef: brief.id,
          },
        }
      : undefined;

    const result = await askBlockchainEngineer({
      userMessage: submittedQuestion,
      conversationHistory: toChatHistory(engineeringBotConversation),
      assistantMode: copilotRoute.assistantMode,
      projectContext: {
        ...productSetupChatContext,
        currentTurnExtractedFacts,
        workspaceDefaults,
        contextRules: [
          'currentTurnExtractedFacts are the only facts captured from the latest user message.',
          'workspaceDefaults are existing workspace defaults or approved prior artifacts; do not describe them as user-stated unless confirmed.',
          'canonicalFields with status system_default or inferred are assumptions/defaults to confirm, not facts the user just stated.',
        ],
      },
    });

    setIsBotReplyLoading(false);

    if (result.ok) {
      const structuredProductSetupSuggestions = createProductSetupSuggestionsFromStructuredUpdates(
        result.data.suggestedRequirementUpdates,
        chatSourceRef,
      );
      if (structuredProductSetupSuggestions.length > 0) {
        setProductSetupRecord((current) => setProductSetupSuggestedUpdates(current, structuredProductSetupSuggestions));
      }
      publishEngineerResponse(
        result.data,
        result.data.responseSource === 'live_model' ? 'live_model' : 'backend',
        copilotRoute.assistantMode,
        copilotRoute.route,
        copilotRoute.labels,
      );
      setQuestion('');
      return;
    }

    setBotChatError(result.message);
    publishEngineerResponse(
      createLocalEngineerResponse(answerAsBlockchainEngineer(submittedQuestion, brief)),
      'local',
      copilotRoute.assistantMode,
      copilotRoute.route,
      copilotRoute.labels,
    );
    setQuestion('');
  }

  function resetSmartContractGeneration() {
    deploymentAttemptSequenceRef.current += 1;
    deploymentAttemptIdRef.current = '';
    recordNavOperationAttemptSequenceRef.current += 1;
    recordNavOperationAttemptIdRef.current = '';
    walletWhitelistOperationAttemptSequenceRef.current += 1;
    walletWhitelistOperationAttemptIdRef.current = '';
    walletAllocationMintOperationAttemptSequenceRef.current += 1;
    walletAllocationMintOperationAttemptIdRef.current = '';
    setSmartContractArtifactSpec(undefined);
    setSmartContractArtifactPackage(undefined);
    setSmartContractCheckResult(undefined);
    setSmartContractEvidenceLite(undefined);
    setSmartContractCompileTestResult(undefined);
    setWalletSignedDeploymentState(initialWalletSignedDeploymentState);
    setRecordNavOperationState(initialRecordNavOperationState);
    setWalletWhitelistOperationState(initialWalletWhitelistOperationState);
    setWalletAllocationMintOperationState(initialWalletAllocationMintOperationState);
    setSepoliaDemoWalletReadinessState(initialSepoliaDemoWalletReadinessState);
    setWalletWhitelistTargetWallet('');
    setSmartContractGenerationStatus('idle');
    setSmartContractGenerationError(undefined);
  }

  function syncInvestorRegistrySequenceFromState(nextLifecycleState: Mila26LifecycleState) {
    const maxSequence = nextLifecycleState.investorRegistryEntries.reduce((max, entry) => {
      const match = entry.id.match(/(\d+)$/);
      if (!match) return max;
      return Math.max(max, Number(match[1]));
    }, 0);
    investorRegistrySequenceRef.current = maxSequence;
  }

  function clearLocalOnlyWorkspaceArtifactsAfterLoad() {
    resetSmartContractGeneration();
    setTestInvestorWalletPack(undefined);
    setTestWalletExportContent(undefined);
    setTestWalletLabMessage(undefined);
    setFundingHelperMessage(undefined);
    setInvestorRegistryDraftWallet('');
    setInvestorRegistryError(undefined);
    setWalletWhitelistTargetWallet('');
    setProductSetupPackGeneratedAtIso(undefined);
  }

  async function saveWorkspaceToBackend() {
    const result = await saveWorkspaceSnapshotForPersistence();

    if (result) {
      setWorkspacePersistenceStatus({
        status: 'saved',
        message: `Snapshot v${result.snapshot.version} saved. Evidence remains local-session only.`,
      });
    }
  }

  async function saveWorkspaceSnapshotForPersistence() {
    if (selectedProjectId === 'workspace') {
      setWorkspacePersistenceStatus({
        status: 'error',
        message: 'Choose a project before saving a workspace snapshot.',
      });
      return undefined;
    }

    setWorkspacePersistenceStatus({ status: 'saving', message: 'Saving workspace snapshot...' });
    const result = await saveWorkspaceSnapshot({
      projectId: selectedProjectId,
      projectName: activeProjectTitle,
      lifecycleState,
      productSetupRecord,
      source: 'user_action',
    });

    if (result.ok) {
      return result.data;
    }

    setWorkspacePersistenceStatus({ status: 'error', message: result.message });
    return undefined;
  }

  async function loadLatestWorkspaceFromBackend() {
    if (selectedProjectId === 'workspace') {
      setWorkspacePersistenceStatus({
        status: 'error',
        message: 'Choose a project before loading a workspace snapshot.',
      });
      return;
    }

    setWorkspacePersistenceStatus({ status: 'loading', message: 'Loading latest workspace snapshot...' });
    const result = await loadLatestWorkspaceSnapshot({ projectId: selectedProjectId });

    if (result.ok) {
      const nextLifecycleState: Mila26LifecycleState = {
        ...result.data.snapshot.lifecycleState,
        assetServicingParameters: result.data.snapshot.lifecycleState.assetServicingParameters ?? {},
      };
      syncInvestorRegistrySequenceFromState(nextLifecycleState);
      setLifecycleState(nextLifecycleState);
      const loadedProductSetupRecord = normalizeProductSetupRecord(
        result.data.snapshot.productSetupRecord ?? createInitialProductSetupRecord(starterFacts),
      );
      setProductSetupRecord(loadedProductSetupRecord);
      setPermittedStablecoinsInput(nextLifecycleState.subscriptionParameters.permittedStablecoins.join(', '));
      setProductSetupWalletInputs({
        admin_wallet: fieldDisplayValue(loadedProductSetupRecord.fields.admin_wallet) || loadedProductSetupRecord.fields.admin_wallet.rolePlaceholder || '',
      });
      clearLocalOnlyWorkspaceArtifactsAfterLoad();
      setSelectedWorkspaceTab('overview');
      setWorkspacePersistenceStatus({
        status: 'loaded',
        message: `Snapshot v${result.data.snapshot.version} loaded. Local-only wallet evidence was reset.`,
      });
      return;
    }

    setWorkspacePersistenceStatus({ status: 'error', message: result.message });
  }

  function buildEvidenceRecords(lifecycleSnapshotVersion: number): WorkspaceEvidenceRecordInput[] {
    const records: WorkspaceEvidenceRecordInput[] = [];

    if (deploymentEvidenceReadModel.transactionHash) {
      records.push({
        evidenceType: 'deployment',
        sourcePersistence: 'local_session_only',
        sourceAttemptId: deploymentEvidenceReadModel.sourceAttemptId,
        lifecycleSnapshotVersion,
        status: deploymentEvidenceReadModel.status === 'confirmed' ? 'confirmed' : 'submitted',
        chainId: deploymentEvidenceReadModel.chainId,
        networkName: deploymentEvidenceReadModel.networkName,
        transactionHash: deploymentEvidenceReadModel.transactionHash,
        transactionHashSource: 'provider_returned',
        receiptSource: deploymentEvidenceReadModel.receiptStatus ? 'provider_receipt' : 'absent',
        receiptStatus: deploymentEvidenceReadModel.receiptStatus,
        contractAddress: deploymentEvidenceReadModel.contractAddress,
        contractAddressSource: deploymentEvidenceReadModel.contractAddressSource,
        eventEvidenceSource: 'absent',
        artifactPackageId: smartContractArtifactPackage?.artifactId,
        compileCheckId: smartContractCompileTestResult?.compileCheckId,
      });
    }

    if (recordNavOperationReadModel.operationTransactionHash) {
      records.push({
        evidenceType: 'record_nav',
        sourcePersistence: 'local_session_only',
        sourceAttemptId: recordNavOperationReadModel.sourceAttemptId,
        lifecycleSnapshotVersion,
        status: recordNavOperationReadModel.operationStatus === 'confirmed' ? 'confirmed' : 'submitted',
        chainId: recordNavOperationReadModel.chainId,
        networkName: recordNavOperationReadModel.networkName,
        transactionHash: recordNavOperationReadModel.operationTransactionHash,
        transactionHashSource: 'provider_returned',
        receiptSource: recordNavOperationReadModel.operationReceiptSource,
        receiptStatus: recordNavOperationReadModel.operationReceiptStatus,
        contractAddress: recordNavOperationReadModel.contractAddress,
        contractAddressSource: recordNavOperationReadModel.contractAddress ? 'confirmed_deployment_evidence' : 'absent',
        eventEvidenceSource: recordNavOperationReadModel.eventEvidenceSource,
        eventName: 'ValuationUpdated',
        valuation: recordNavOperationReadModel.valuation,
        valuationReference: recordNavOperationReadModel.valuationReference,
      });
    }

    if (walletWhitelistOperationReadModel.operationTransactionHash) {
      records.push({
        evidenceType: 'wallet_whitelist',
        sourcePersistence: 'local_session_only',
        sourceAttemptId: walletWhitelistOperationReadModel.sourceAttemptId,
        lifecycleSnapshotVersion,
        status: walletWhitelistOperationReadModel.operationStatus === 'confirmed' ? 'confirmed' : 'submitted',
        chainId: walletWhitelistOperationReadModel.chainId,
        networkName: walletWhitelistOperationReadModel.networkName,
        transactionHash: walletWhitelistOperationReadModel.operationTransactionHash,
        transactionHashSource: 'provider_returned',
        receiptSource: walletWhitelistOperationReadModel.operationReceiptSource,
        receiptStatus: walletWhitelistOperationReadModel.operationReceiptStatus,
        contractAddress: walletWhitelistOperationReadModel.contractAddress,
        contractAddressSource: walletWhitelistOperationReadModel.contractAddress ? 'confirmed_deployment_evidence' : 'absent',
        eventEvidenceSource:
          walletWhitelistOperationReadModel.eventEvidenceStatus === 'not_available'
            ? 'absent'
            : walletWhitelistOperationReadModel.eventEvidenceStatus,
        eventName: 'WalletWhitelisted',
        targetWalletAddress: walletWhitelistOperationReadModel.targetWalletAddress,
      });
    }

    if (walletAllocationMintOperationReadModel.operationTransactionHash) {
      records.push({
        evidenceType: 'allocation_mint',
        sourcePersistence: 'local_session_only',
        sourceAttemptId: walletAllocationMintOperationReadModel.sourceAttemptId,
        lifecycleSnapshotVersion,
        status: walletAllocationMintOperationReadModel.operationStatus === 'confirmed' ? 'confirmed' : 'submitted',
        chainId: walletAllocationMintOperationReadModel.chainId,
        networkName: walletAllocationMintOperationReadModel.networkName,
        transactionHash: walletAllocationMintOperationReadModel.operationTransactionHash,
        transactionHashSource: 'provider_returned',
        receiptSource: walletAllocationMintOperationReadModel.operationReceiptSource,
        receiptStatus: walletAllocationMintOperationReadModel.operationReceiptStatus,
        contractAddress: walletAllocationMintOperationReadModel.contractAddress,
        contractAddressSource: walletAllocationMintOperationReadModel.contractAddress ? 'confirmed_deployment_evidence' : 'absent',
        eventEvidenceSource:
          walletAllocationMintOperationReadModel.eventEvidenceStatus === 'not_available'
            ? 'absent'
            : walletAllocationMintOperationReadModel.eventEvidenceStatus,
        eventName: 'AllocationMinted',
        targetWalletAddress: walletAllocationMintOperationReadModel.targetWalletAddress,
        tokenAmount: walletAllocationMintOperationReadModel.tokenAmount,
        tokenAmountUnits: walletAllocationMintOperationReadModel.tokenAmountUnits,
      });
    }

    return records;
  }

  function buildArtifactRecords(lifecycleSnapshotVersion: number): WorkspaceArtifactRecordInput[] {
    const records: WorkspaceArtifactRecordInput[] = [];

    if (productSetupPackGeneratedAtIso) {
      const productSetupPackPayload = createProductSetupPackPayload(productSetupRecord, productSetupReadModel);
      records.push({
        artifactType: 'product_setup_pack',
        artifactPayload: productSetupPackPayload,
        lifecycleSnapshotVersion,
      });
    }

    if (approvedRequirementBriefContract) {
      records.push({
        artifactType: 'requirement_brief',
        artifactPayload: approvedRequirementBriefContract,
        lifecycleSnapshotVersion,
      });
    }
    if (engineeringBrief) {
      records.push({
        artifactType: 'engineering_brief',
        artifactPayload: engineeringBrief,
        lifecycleSnapshotVersion,
      });
    }
    if (smartContractArtifactSpec) {
      records.push({
        artifactType: 'smart_contract_spec',
        artifactPayload: smartContractArtifactSpec,
        lifecycleSnapshotVersion,
      });
    }
    if (smartContractArtifactPackage) {
      records.push({
        artifactType: 'artifact_preview',
        artifactPayload: smartContractArtifactPackage,
        lifecycleSnapshotVersion,
      });
    }
    if (smartContractCheckResult) {
      records.push({
        artifactType: 'check_result',
        artifactPayload: smartContractCheckResult,
        lifecycleSnapshotVersion,
      });
    }
    if (smartContractEvidenceLite) {
      records.push({
        artifactType: 'evidence_lite',
        artifactPayload: smartContractEvidenceLite,
        lifecycleSnapshotVersion,
      });
    }

    return records;
  }

  async function saveEvidenceVaultRecords() {
    const workspaceRecord = await saveWorkspaceSnapshotForPersistence();
    if (!workspaceRecord) {
      setEvidenceVaultStatus({ status: 'error', message: 'Save the workspace snapshot before storing evidence.' });
      return;
    }

    const records = buildEvidenceRecords(workspaceRecord.snapshot.version);
    if (records.length === 0) {
      setEvidenceVaultStatus({
        status: 'error',
        message: 'No provider-derived transaction evidence is available to store yet.',
      });
      return;
    }

    setEvidenceVaultStatus({ status: 'saving', message: 'Saving durable evidence records...' });
    const result = await saveWorkspaceEvidenceRecords({
      projectId: workspaceRecord.project.id,
      records,
    });

    if (result.ok) {
      setDurableEvidenceRecords(result.data.evidenceRecords);
      setEvidenceVaultStatus({
        status: 'saved',
        message: `${result.data.evidenceRecords.length} durable evidence record(s) saved.`,
      });
      return;
    }

    setEvidenceVaultStatus({ status: 'error', message: result.message });
  }

  async function loadEvidenceVaultRecords() {
    if (selectedProjectId === 'workspace') {
      setEvidenceVaultStatus({ status: 'error', message: 'Choose a project before loading durable evidence.' });
      return;
    }

    setEvidenceVaultStatus({ status: 'loading', message: 'Loading durable evidence records...' });
    const result = await listWorkspaceEvidenceRecords({ projectId: selectedProjectId });
    if (result.ok) {
      setDurableEvidenceRecords(result.data.evidenceRecords);
      setEvidenceVaultStatus({
        status: 'loaded',
        message: `${result.data.evidenceRecords.length} durable evidence record(s) loaded.`,
      });
      return;
    }

    setEvidenceVaultStatus({ status: 'error', message: result.message });
  }

  async function saveGeneratedArtifactRecords() {
    const workspaceRecord = await saveWorkspaceSnapshotForPersistence();
    if (!workspaceRecord) {
      setArtifactVaultStatus({ status: 'error', message: 'Save the workspace snapshot before storing artifacts.' });
      return;
    }

    const records = buildArtifactRecords(workspaceRecord.snapshot.version);
    if (records.length === 0) {
      setArtifactVaultStatus({
        status: 'error',
        message: 'No generated artifacts are available to store yet.',
      });
      return;
    }

    setArtifactVaultStatus({ status: 'saving', message: 'Saving generated artifact records...' });
    const result = await saveWorkspaceArtifactRecords({
      projectId: workspaceRecord.project.id,
      records,
    });

    if (result.ok) {
      setDurableArtifactRecords(result.data.artifactRecords);
      setArtifactVaultStatus({
        status: 'saved',
        message: `${result.data.artifactRecords.length} generated artifact record(s) saved.`,
      });
      return;
    }

    setArtifactVaultStatus({ status: 'error', message: result.message });
  }

  async function loadGeneratedArtifactRecords() {
    if (selectedProjectId === 'workspace') {
      setArtifactVaultStatus({ status: 'error', message: 'Choose a project before loading generated artifacts.' });
      return;
    }

    setArtifactVaultStatus({ status: 'loading', message: 'Loading generated artifact records...' });
    const result = await listWorkspaceArtifactRecords({ projectId: selectedProjectId });
    if (result.ok) {
      setDurableArtifactRecords(result.data.artifactRecords);
      setArtifactVaultStatus({
        status: 'loaded',
        message: `${result.data.artifactRecords.length} generated artifact record(s) loaded.`,
      });
      return;
    }

    setArtifactVaultStatus({ status: 'error', message: result.message });
  }

  function addInvestorRegistryWallet() {
    const walletAddress = investorRegistryDraftWallet.trim();

    if (!lifecycleReadModel.investorRegistry.canAddEntry) {
      setInvestorRegistryError('Investor Wallets already has the maximum 50 wallet addresses.');
      return;
    }

    investorRegistrySequenceRef.current += 1;
    const entry = createInvestorRegistryEntry({
      id: `investor-wallet-${investorRegistrySequenceRef.current}`,
      walletAddress,
      existingEntries: lifecycleState.investorRegistryEntries,
    });

    setLifecycleState((current) => ({
      ...current,
      investorRegistryEntries: [...current.investorRegistryEntries, entry],
    }));
    updateProductSetupFieldFromTab(
      'expected_investor_count',
      lifecycleState.investorRegistryEntries.length + 1,
      'edited_in_investor_wallets_tab',
      { onlyWhenMissing: true },
    );
    setInvestorRegistryDraftWallet('');
    setInvestorRegistryError(undefined);
  }

  function generateTestInvestorWalletPackForRegistry() {
    const pack = createTestInvestorWalletPack({
      requestedCount: Number(testWalletCountInput),
      existingEntries: lifecycleState.investorRegistryEntries,
    });
    const entries = toInvestorRegistryEntriesFromTestWalletPack({
      pack,
      existingEntries: lifecycleState.investorRegistryEntries,
      startingSequence: investorRegistrySequenceRef.current + 1,
    });

    if (entries.length === 0) {
      setTestInvestorWalletPack(pack);
      setTestWalletExportContent(undefined);
      setTestWalletLabMessage(pack.warnings[0] ?? 'No new test investor wallets were generated.');
      return;
    }

    investorRegistrySequenceRef.current += entries.length;
    setLifecycleState((current) => ({
      ...current,
      investorRegistryEntries: [...current.investorRegistryEntries, ...entries],
    }));
    updateProductSetupFieldFromTab(
      'expected_investor_count',
      lifecycleState.investorRegistryEntries.length + entries.length,
      'edited_in_investor_wallets_tab',
      { onlyWhenMissing: true },
    );
    setTestInvestorWalletPack(pack);
    setTestWalletExportContent(undefined);
    setInvestorRegistryError(undefined);
    setTestWalletLabMessage(
      pack.warnings.length > 0
        ? `${entries.length} generated test investor wallet(s) added. ${pack.warnings.join(' ')}`
        : `${entries.length} generated test investor wallet(s) added to Investor Wallets.`,
    );
  }

  function prepareTestWalletExport() {
    if (!testInvestorWalletPack) {
      setTestWalletLabMessage('Generate a test investor wallet pack before preparing the export file.');
      return;
    }

    setTestWalletExportContent(createTestInvestorWalletPackExport(testInvestorWalletPack));
    setTestWalletLabMessage('Test-only export prepared. Import selected demo actor wallets into a separate MetaMask profile.');
  }

  async function copyFundingTarget(label: string, value?: string) {
    const normalizedValue = value?.trim();
    if (!normalizedValue) {
      setFundingHelperMessage(`${label} is not available yet.`);
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable.');
      await navigator.clipboard.writeText(normalizedValue);
      setFundingHelperMessage(`${label} copied.`);
    } catch {
      setFundingHelperMessage(`Copy unavailable. Select and copy ${label} manually.`);
    }
  }

  function updateSubscriptionParameters(nextParameters: Partial<Mila26LifecycleState['subscriptionParameters']>) {
    setLifecycleState((current) => ({
      ...current,
      subscriptionParameters: {
        ...current.subscriptionParameters,
        ...nextParameters,
      },
    }));
    if (nextParameters.subscriptionCadence !== undefined) {
      updateProductSetupFieldFromTab('subscription_cadence', nextParameters.subscriptionCadence, 'edited_in_subscription_tab');
    }
    if (nextParameters.permittedStablecoins) {
      updateProductSetupFieldFromTab('subscription_stablecoins', nextParameters.permittedStablecoins, 'edited_in_subscription_tab');
    }
    if (nextParameters.paymentAddress !== undefined) {
      updateProductSetupFieldFromTab('subscription_receiving_wallet', nextParameters.paymentAddress, 'edited_in_subscription_tab');
    }
  }

  function updateRedemptionParameters(nextParameters: Partial<RedemptionParameters>) {
    setLifecycleState((current) => ({
      ...current,
      redemptionParameters: {
        ...current.redemptionParameters,
        ...nextParameters,
      },
    }));
    if (nextParameters.redemptionCadence !== undefined) {
      updateProductSetupFieldFromTab('redemption_cadence', nextParameters.redemptionCadence, 'edited_in_redemption_tab');
    }
    if (nextParameters.redemptionWindow !== undefined) {
      updateProductSetupFieldFromTab('redemption_schedule', nextParameters.redemptionWindow, 'edited_in_redemption_tab');
    }
    if (nextParameters.redemptionPayoutCadence !== undefined) {
      updateProductSetupFieldFromTab(
        'redemption_payout_cadence',
        nextParameters.redemptionPayoutCadence,
        'edited_in_redemption_tab',
      );
    }
    if (nextParameters.redemptionDelayValue !== undefined || nextParameters.redemptionDelayUnit !== undefined) {
      const nextDelayValue = nextParameters.redemptionDelayValue ?? lifecycleState.redemptionParameters.redemptionDelayValue;
      const nextDelayUnit = nextParameters.redemptionDelayUnit ?? lifecycleState.redemptionParameters.redemptionDelayUnit;
      updateProductSetupFieldFromTab(
        'redemption_payout_delay',
        nextDelayValue && nextDelayUnit ? `${nextDelayValue} ${nextDelayUnit}` : undefined,
        'edited_in_redemption_tab',
      );
    }
    if (nextParameters.redemptionWalletAddress !== undefined) {
      updateProductSetupFieldFromTab('redemption_wallet', nextParameters.redemptionWalletAddress, 'edited_in_redemption_tab');
    }
    if (nextParameters.redemptionHandlingRule !== undefined) {
      updateProductSetupFieldFromTab('burn_lock_rule', nextParameters.redemptionHandlingRule, 'edited_in_redemption_tab');
    }
  }

  function updateAssetServicingParameters(nextParameters: Partial<AssetServicingParameters>) {
    setLifecycleState((current) => ({
      ...current,
      assetServicingParameters: {
        ...current.assetServicingParameters,
        ...nextParameters,
      },
    }));
    if (nextParameters.navCadence !== undefined) {
      updateProductSetupFieldFromTab('nav_cadence', nextParameters.navCadence, 'edited_in_asset_servicing_tab');
    }
    if (nextParameters.navSource !== undefined) {
      updateProductSetupFieldFromTab('nav_source', nextParameters.navSource, 'edited_in_asset_servicing_tab');
    }
    if (nextParameters.incomePayoutCadence !== undefined) {
      updateProductSetupFieldFromTab(
        'income_payout_cadence',
        nextParameters.incomePayoutCadence,
        'edited_in_asset_servicing_tab',
      );
    }
    if (nextParameters.investorUpdateRule !== undefined) {
      updateProductSetupFieldFromTab('investor_update_rule', nextParameters.investorUpdateRule, 'edited_in_asset_servicing_tab');
    }
  }

  function updateMaturityParameters(nextParameters: Partial<Mila26LifecycleState['maturityParameters']>) {
    setLifecycleState((current) => ({
      ...current,
      maturityParameters: {
        ...current.maturityParameters,
        ...nextParameters,
      },
    }));
    if (nextParameters.maturityDate !== undefined) {
      updateProductSetupFieldFromTab('maturity_date', nextParameters.maturityDate, 'edited_in_maturity_tab');
    }
    if (nextParameters.closeoutMethod !== undefined) {
      updateProductSetupFieldFromTab('maturity_closeout_rule', nextParameters.closeoutMethod, 'edited_in_maturity_tab');
    }
  }

  function updateAllocationMintParameters(nextParameters: Partial<AllocationMintParameters>) {
    const currentTarget = lifecycleState.allocationMintParameters.targetWalletAddress ?? '';
    const currentAmount = lifecycleState.allocationMintParameters.tokenAmount ?? '';
    const nextTarget = nextParameters.targetWalletAddress ?? currentTarget;
    const nextAmount = nextParameters.tokenAmount ?? currentAmount;
    const targetChanged = !walletWhitelistTargetsMatch(currentTarget, nextTarget);
    const amountChanged = currentAmount.trim() !== nextAmount.trim();
    const canResetOperationForInput =
      walletAllocationMintOperationState.operationStatus !== 'not_started' &&
      !isWalletAllocationMintOperationInFlight(walletAllocationMintOperationState);

    if ((targetChanged || amountChanged) && canResetOperationForInput) {
      walletAllocationMintOperationAttemptSequenceRef.current += 1;
      walletAllocationMintOperationAttemptIdRef.current = '';
      setWalletAllocationMintOperationState(initialWalletAllocationMintOperationState);
    }

    setLifecycleState((current) => ({
      ...current,
      allocationMintParameters: {
        ...current.allocationMintParameters,
        ...nextParameters,
      },
    }));
  }

  function updateWalletWhitelistTargetWallet(walletAddress: string) {
    const nextTarget = normalizeWalletWhitelistTargetAddress(walletAddress);
    const currentOperationTarget = normalizeWalletWhitelistTargetAddress(walletWhitelistOperationState.targetWalletAddress);
    const targetChanged =
      Boolean(nextTarget || currentOperationTarget) && !walletWhitelistTargetsMatch(nextTarget, currentOperationTarget);
    const canResetOperationForTarget =
      walletWhitelistOperationState.operationStatus !== 'not_started' && !isWalletWhitelistOperationInFlight(walletWhitelistOperationState);

    if (targetChanged && canResetOperationForTarget) {
      walletWhitelistOperationAttemptSequenceRef.current += 1;
      walletWhitelistOperationAttemptIdRef.current = '';
      setWalletWhitelistOperationState(initialWalletWhitelistOperationState);
    }

    setWalletWhitelistTargetWallet(walletAddress);
  }

  function selectInvestorWalletForWhitelist(walletAddress: string) {
    updateWalletWhitelistTargetWallet(walletAddress);
    setSelectedWorkspaceTab('smart_contract');
  }

  function selectInvestorWalletForAllocationMint(walletAddress: string) {
    updateAllocationMintParameters({ targetWalletAddress: walletAddress });
    setSelectedWorkspaceTab('smart_contract');
  }

  async function prepareSmartContractSpec() {
    if (!engineeringBrief) return;

    setSmartContractGenerationStatus('loading');
    setSmartContractGenerationError(undefined);

    const specResult = await generateSmartContractArtifactSpec({
      requirementBrief: approvedRequirementBriefContract,
      engineeringBrief,
      closureReadiness: {
        status: projectClosureReadModel.status,
        readinessLabel: projectClosureReadModel.readinessLabel,
        blockedReasons: projectClosureReadModel.blockedReasons,
        closureLedgerId: projectClosureLedger.id,
        openItemCount: projectClosureReadModel.openItemCount,
        blockingOpenItemCount: projectClosureReadModel.blockingOpenItemCount,
        blockedCheckCount: projectClosureReadModel.blockedCheckCount,
      },
    });

    if (!specResult.ok) {
      setSmartContractGenerationStatus('error');
      setSmartContractGenerationError(specResult.message);
      return;
    }

    const artifactResult = await generateSmartContractArtifact({
      smartContractArtifactSpec: specResult.data,
    });

    if (!artifactResult.ok) {
      setSmartContractGenerationStatus('error');
      setSmartContractGenerationError(artifactResult.message);
      return;
    }

    setSmartContractArtifactSpec(specResult.data);
    setSmartContractArtifactPackage(artifactResult.data.artifactPackage);
    setSmartContractCheckResult(artifactResult.data.checkResult);
    setSmartContractEvidenceLite(artifactResult.data.evidenceLite);
    setSmartContractCompileTestResult(
      createKnownLocalCompileTestResult({
        artifactId: artifactResult.data.artifactPackage.artifactId,
        specId: specResult.data.specId,
        generatedAt: specResult.data.metadata?.generatedAt,
      }),
    );
    setSmartContractGenerationStatus('ready');
    publishEngineerResponse(createSmartContractPreparationResponse(), 'generated_artifacts');
  }

  async function connectWallet() {
    setWalletConnectionInput((current) => ({
      ...current,
      providerStatus: current.providerStatus === 'unknown' ? 'available' : current.providerStatus,
      connectionStatus: 'connecting',
      providerError: undefined,
    }));

    const walletAdapter = createEip1193WalletAdapter(getBrowserEthereumProvider());
    const snapshot = await walletAdapter.connect();
    const nextWalletConnectionReadModel = toWalletConnectionReadModel(snapshot);
    setWalletConnectionInput(snapshot);
    publishEngineerResponse(createWalletConnectionResponse(nextWalletConnectionReadModel), 'wallet');
  }

  async function checkSepoliaWalletReadiness() {
    if (isSepoliaDemoWalletReadinessInFlight(sepoliaDemoWalletReadinessState)) return;

    setSepoliaDemoWalletReadinessState({
      checkStatus: 'checking',
      checkedWalletAddress: walletConnectionReadModel.connectedWalletAddress,
      localSessionOnly: true,
    });

    const result = await checkSepoliaDemoWalletReadiness({
      provider: getBrowserEthereumProvider() as SepoliaDemoWalletReadinessProvider | undefined,
      connectedWalletAddress: walletConnectionReadModel.connectedWalletAddress,
    });

    setSepoliaDemoWalletReadinessState(result);
    publishEngineerResponse(
      createLocalEngineerResponse(
        `${result.checkStatus === 'ready' ? 'Sepolia wallet readiness check passed.' : 'Sepolia wallet readiness check needs attention.'} ${
          result.signerBalanceWei ? `Signer balance: ${result.signerBalanceWei} wei.` : result.errorMessage ?? ''
        }`,
      ),
      'wallet',
    );
  }

  async function requestSepoliaDeployment() {
    if (productSetupReadModel.hasUnacknowledgedDeploymentWarnings) {
      setContractOpsDeploymentWarningMessage('Review Product Setup deployment warnings and record your proceed decision before requesting wallet signature.');
      return;
    }

    const provider = getBrowserEthereumProvider();
    const connectedWalletAddress = walletConnectionReadModel.connectedWalletAddress;
    const attemptId = `wallet-signed-sepolia-deployment-${deploymentAttemptSequenceRef.current + 1}`;
    deploymentAttemptSequenceRef.current += 1;
    deploymentAttemptIdRef.current = attemptId;
    recordNavOperationAttemptSequenceRef.current += 1;
    recordNavOperationAttemptIdRef.current = '';
    walletWhitelistOperationAttemptSequenceRef.current += 1;
    walletWhitelistOperationAttemptIdRef.current = '';
    walletAllocationMintOperationAttemptSequenceRef.current += 1;
    walletAllocationMintOperationAttemptIdRef.current = '';
    setRecordNavOperationState(initialRecordNavOperationState);
    setWalletWhitelistOperationState(initialWalletWhitelistOperationState);
    setWalletAllocationMintOperationState(initialWalletAllocationMintOperationState);

    const constructorArgs =
      connectedWalletAddress && deploymentConstructorParameters
        ? ([facts.fundName, facts.tokenSymbol, connectedWalletAddress] as const)
        : undefined;

    const immediateState: WalletSignedDeploymentState = {
      deploymentStatus: 'awaiting_wallet_confirmation',
      attemptId,
      receiptStatus: 'pending',
      localSessionOnly: true,
    };
    setWalletSignedDeploymentState(immediateState);

    const result = await requestWalletSignedSepoliaDeployment({
      provider: provider as SepoliaDeploymentProvider | undefined,
      connectedWalletAddress,
      unsignedDeploymentIntent: unsignedDeploymentIntentReadModel,
      deploymentArtifact: mila26RestrictedFundTokenDeploymentArtifact,
      constructorArgs,
      currentDeploymentState: walletSignedDeploymentState,
      attemptId,
      pollOptions: {
        maxAttempts: 8,
        intervalMs: 1_500,
      },
      shouldContinue: (candidateAttemptId) => deploymentAttemptIdRef.current === candidateAttemptId,
      onStateChange: (nextState) => {
        if (deploymentAttemptIdRef.current === nextState.attemptId) {
          setWalletSignedDeploymentState(nextState);
        }
      },
    });

    if (deploymentAttemptIdRef.current === attemptId) {
      setWalletSignedDeploymentState(result);
      publishEngineerResponse(createDeploymentResponse(result), 'wallet');
    }
  }

  async function requestRecordNavOperation() {
    if (recordNavOperationAttemptIdRef.current || isRecordNavOperationInFlight(recordNavOperationState)) return;

    const provider = getBrowserEthereumProvider();
    const connectedWalletAddress = walletConnectionReadModel.connectedWalletAddress;
    const attemptId = `record-nav-operation-${recordNavOperationAttemptSequenceRef.current + 1}`;
    recordNavOperationAttemptSequenceRef.current += 1;
    recordNavOperationAttemptIdRef.current = attemptId;

    const immediateState: RecordNavOperationState = {
      operationStatus: 'awaiting_wallet_confirmation',
      attemptId,
      contractAddress: deploymentEvidenceReadModel.contractAddress,
      operationReceiptStatus: 'pending',
      valuation: defaultRecordNavOperationPayload.valuation,
      valuationReference: defaultRecordNavOperationPayload.valuationReference,
      localSessionOnly: true,
    };
    setRecordNavOperationState(immediateState);

    const result = await requestWalletSignedRecordNavOperation({
      provider: provider as SepoliaRecordNavOperationProvider | undefined,
      connectedWalletAddress,
      deploymentEvidence: deploymentEvidenceReadModel,
      contractAbi: mila26RestrictedFundTokenDeploymentArtifact.abi,
      payload: defaultRecordNavOperationPayload,
      currentOperationState: recordNavOperationState,
      attemptId,
      pollOptions: {
        maxAttempts: 8,
        intervalMs: 1_500,
      },
      shouldContinue: (candidateAttemptId) => recordNavOperationAttemptIdRef.current === candidateAttemptId,
      onStateChange: (nextState) => {
        if (recordNavOperationAttemptIdRef.current === nextState.attemptId) {
          setRecordNavOperationState(nextState);
        }
      },
    });

    if (recordNavOperationAttemptIdRef.current === attemptId) {
      setRecordNavOperationState(result);
      publishEngineerResponse(createRecordNavOperationResponse(result), 'wallet');
      recordNavOperationAttemptIdRef.current = '';
    }
  }

  async function requestWalletWhitelistOperation() {
    if (walletWhitelistOperationAttemptIdRef.current || isWalletWhitelistOperationInFlight(walletWhitelistOperationState)) return;

    const provider = getBrowserEthereumProvider();
    const connectedWalletAddress = walletConnectionReadModel.connectedWalletAddress;
    const targetWalletAddress = normalizeWalletWhitelistTargetAddress(walletWhitelistTargetWallet);
    const attemptId = `wallet-whitelist-operation-${walletWhitelistOperationAttemptSequenceRef.current + 1}`;
    walletWhitelistOperationAttemptSequenceRef.current += 1;
    walletWhitelistOperationAttemptIdRef.current = attemptId;

    const immediateState: WalletWhitelistOperationState = {
      operationStatus: 'awaiting_wallet_confirmation',
      attemptId,
      contractAddress: deploymentEvidenceReadModel.contractAddress,
      targetWalletAddress,
      allowed: true,
      operationReceiptStatus: 'pending',
      localSessionOnly: true,
    };
    setWalletWhitelistOperationState(immediateState);

    const result = await requestWalletSignedWhitelistOperation({
      provider: provider as SepoliaWalletWhitelistOperationProvider | undefined,
      connectedWalletAddress,
      deploymentEvidence: deploymentEvidenceReadModel,
      contractAbi: mila26RestrictedFundTokenDeploymentArtifact.abi,
      targetWalletAddress,
      currentOperationState: walletWhitelistOperationState,
      attemptId,
      pollOptions: {
        maxAttempts: 8,
        intervalMs: 1_500,
      },
      shouldContinue: (candidateAttemptId) => walletWhitelistOperationAttemptIdRef.current === candidateAttemptId,
      onStateChange: (nextState) => {
        if (walletWhitelistOperationAttemptIdRef.current === nextState.attemptId) {
          setWalletWhitelistOperationState(nextState);
        }
      },
    });

    if (walletWhitelistOperationAttemptIdRef.current === attemptId) {
      setWalletWhitelistOperationState(result);
      publishEngineerResponse(createWalletWhitelistOperationResponse(result), 'wallet');
      walletWhitelistOperationAttemptIdRef.current = '';
    }
  }

  async function requestAllocationMintOperation() {
    if (
      walletAllocationMintOperationAttemptIdRef.current ||
      isWalletAllocationMintOperationInFlight(walletAllocationMintOperationState)
    ) {
      return;
    }

    const provider = getBrowserEthereumProvider();
    const connectedWalletAddress = walletConnectionReadModel.connectedWalletAddress;
    const attemptId = `allocation-mint-operation-${walletAllocationMintOperationAttemptSequenceRef.current + 1}`;
    walletAllocationMintOperationAttemptSequenceRef.current += 1;
    walletAllocationMintOperationAttemptIdRef.current = attemptId;

    const immediateState: WalletAllocationMintOperationState = {
      operationStatus: 'awaiting_wallet_confirmation',
      attemptId,
      contractAddress: deploymentEvidenceReadModel.contractAddress,
      targetWalletAddress: allocationMint.targetWalletAddress,
      tokenAmount: allocationMint.tokenAmount,
      operationReceiptStatus: 'pending',
      localSessionOnly: true,
    };
    setWalletAllocationMintOperationState(immediateState);

    const result = await requestWalletSignedAllocationMintOperation({
      provider: provider as SepoliaAllocationMintOperationProvider | undefined,
      connectedWalletAddress,
      deploymentEvidence: deploymentEvidenceReadModel,
      contractAbi: mila26RestrictedFundTokenDeploymentArtifact.abi,
      allocationMint,
      selectedInvestorWhitelisted: selectedAllocationMintInvestorWhitelisted,
      currentOperationState: walletAllocationMintOperationState,
      attemptId,
      pollOptions: {
        maxAttempts: 8,
        intervalMs: 1_500,
      },
      shouldContinue: (candidateAttemptId) => walletAllocationMintOperationAttemptIdRef.current === candidateAttemptId,
      onStateChange: (nextState) => {
        if (walletAllocationMintOperationAttemptIdRef.current === nextState.attemptId) {
          setWalletAllocationMintOperationState(nextState);
        }
      },
    });

    if (walletAllocationMintOperationAttemptIdRef.current === attemptId) {
      setWalletAllocationMintOperationState(result);
      publishEngineerResponse(createAllocationMintOperationResponse(result), 'wallet');
      walletAllocationMintOperationAttemptIdRef.current = '';
    }
  }

  function runCockpitAction(actionId: Mila26UiActionId) {
    switch (actionId) {
      case 'create_requirement_brief':
        createBrief();
        return;
      case 'generate_engineering_brief':
        void createEngineeringBrief();
        return;
      case 'prepare_smart_contract_spec':
        void prepareSmartContractSpec();
        return;
      case 'connect_wallet':
        void connectWallet();
        return;
      case 'review_assumptions':
      case 'open_brief':
      case 'toggle_brief_panel':
        setIsBriefPreviewExpanded(true);
        return;
      case 'ask_question':
        void askBot();
        return;
      default:
        return;
    }
  }

  function cockpitActionLabel(actionId: Mila26UiActionId, fallbackLabel: string) {
    if (actionId === 'generate_engineering_brief' && isEngineeringBriefLoading) return 'Generating Engineering Brief...';
    if (actionId === 'prepare_smart_contract_spec' && smartContractGenerationStatus === 'loading') {
      return 'Preparing Smart Contract Spec...';
    }
    if (actionId === 'connect_wallet') {
      if (walletConnectionReadModel.walletConnectionStatus === 'connecting') return 'Connecting Wallet...';
      if (walletConnectionReadModel.walletConnectionStatus === 'connected' && walletConnectionReadModel.chainStatus === 'sepolia') {
        return 'Wallet Connected on Sepolia';
      }
      if (walletConnectionReadModel.walletConnectionStatus === 'wrong_chain') return 'Recheck Wallet Chain';
    }
    if (actionId === 'ask_question' && isBotReplyLoading) return 'Sending...';
    return fallbackLabel;
  }

  function confirmProductSetupSuggestion(update: ProductSetupSuggestedUpdate) {
    setProductSetupRecord((current) => confirmProductSetupUpdate(current, update.id));
  }

  function dismissProductSetupSuggestion(update: ProductSetupSuggestedUpdate) {
    setProductSetupRecord((current) => dismissProductSetupSuggestedUpdate(current, update.id));
  }

  function updateProductSetupFieldFromTab(
    fieldKey: ProductSetupFieldKey,
    value: string | number | boolean | string[] | undefined,
    sourceRef: string,
    options: { onlyWhenMissing?: boolean } = {},
  ) {
    setProductSetupRecord((current) => {
      if (options.onlyWhenMissing && current.fields[fieldKey].status !== 'missing') return current;
      return updateProductSetupField(current, {
        fieldKey,
        value,
        sourceType: 'direct_form_input',
        sourceRef,
      });
    });
  }

  function updateProductSetupWalletField(fieldKey: Extract<ProductSetupFieldKey, 'admin_wallet'>, value: string) {
    const resultRef = `product_setup_${fieldKey}_input`;
    const result = handleProductSetupWalletInput(productSetupRecord, fieldKey, value, resultRef);
    setProductSetupRecord(result.record);
    setProductSetupWalletMessage(result.message);
  }

  function generateProductSetupPack(format: 'markdown' | 'json' | 'pdf') {
    setProductSetupPackGeneratedAtIso(new Date().toISOString());
    const baseName = `${productSetupRecord.id}-${format}`;
    const content =
      format === 'markdown'
        ? createProductSetupPackMarkdown(productSetupRecord)
        : format === 'json'
          ? JSON.stringify(createProductSetupPackPayload(productSetupRecord, productSetupReadModel), null, 2)
          : createProductSetupPackPrintableHtml(productSetupRecord);
    const mimeType = format === 'json' ? 'application/json' : format === 'markdown' ? 'text/markdown' : 'text/html';
    const extension = format === 'json' ? 'json' : format === 'markdown' ? 'md' : 'html';

    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}.${extension}`;
      link.click();
      URL.revokeObjectURL(url);
      setProductSetupPackStatus(
        format === 'pdf'
          ? 'PDF-readable Product Setup Pack downloaded as HTML. Open it and print or save as PDF.'
          : `${format.toUpperCase()} Product Setup Pack downloaded.`,
      );
    } catch {
      setProductSetupPackStatus('Product Setup Pack is ready in session. Browser download was unavailable.');
    }

    setArtifactVaultStatus({
      status: 'idle',
      message: 'Draft Product Setup Pack is ready in session. Save generated artifacts to persist it.',
    });
  }

  function acknowledgeDeploymentWarnings() {
    setProductSetupRecord((current) => acknowledgeProductSetupDeploymentWarnings(current));
    setContractOpsDeploymentWarningMessage('Proceed-with-warnings decision recorded in Product Setup.');
  }

  const unsentProductSetupHandoffs = productSetupReadModel.downstreamHandoffs.filter(
    (handoff) => handoff.status !== 'sent_as_draft_note' && handoff.status !== 'reviewed_in_target_tab',
  );
  const rightRailReviewCount = productSetupRecord.pendingSuggestedUpdates.length + unsentProductSetupHandoffs.length;
  const visibleReviewLimit = isRightRailReviewExpanded ? rightRailReviewCount : 3;
  const visibleReviewUpdates = isRightRailReviewExpanded
    ? productSetupRecord.pendingSuggestedUpdates
    : productSetupRecord.pendingSuggestedUpdates.slice(0, Math.min(2, visibleReviewLimit));
  const visibleReviewHandoffs = isRightRailReviewExpanded
    ? unsentProductSetupHandoffs
    : unsentProductSetupHandoffs.slice(0, Math.max(0, visibleReviewLimit - visibleReviewUpdates.length));
  const hiddenReviewCount = Math.max(0, rightRailReviewCount - visibleReviewUpdates.length - visibleReviewHandoffs.length);
  const shellStyle = isRightRailOpen
    ? ({ '--mila-right-rail-width': `${rightRailWidth}px` } as CSSProperties)
    : undefined;

  function formatReviewValue(value: ProductSetupSuggestedUpdate['proposedValue']) {
    return Array.isArray(value) ? value.join(', ') : String(value);
  }

  function productSetupProfileProvenanceLabel(label: (typeof productSetupReadModel.profileRows)[number]['provenanceLabel']) {
    return label === 'Missing' ? 'To be filled' : label;
  }

  function userFacingCopilotRouteLabel(label: string) {
    const normalized = label.toLowerCase();
    if (normalized.includes('advisor')) return 'Explainer';
    if (normalized.includes('engineering')) return 'Engineering';
    return label.replace(/\s*Bot$/u, '');
  }

  return (
    <main className="cockpit-page">
      <section
        className={`cockpit-shell product-workspace-shell ${isLeftRailOpen ? '' : 'left-collapsed'} ${isRightRailOpen ? '' : 'right-collapsed'}`}
        style={shellStyle}
        aria-label="MILA26 tokenisation workspace"
      >
        <button
          className="rail-toggle left-toggle"
          data-action-id={uiActions.toggleLeftRail}
          onClick={() => setIsLeftRailOpen((current) => !current)}
          aria-expanded={isLeftRailOpen}
          aria-controls="left-rail"
          aria-label={isLeftRailOpen ? 'Hide left navigation' : 'Show left navigation'}
          title={isLeftRailOpen ? 'Hide left navigation' : 'Show left navigation'}
        >
          <span aria-hidden="true">{isLeftRailOpen ? '<' : '>'}</span>
        </button>
        <button
          className="rail-toggle right-toggle"
          data-action-id={uiActions.toggleRightRail}
          onClick={() => setIsRightRailOpen((current) => !current)}
          aria-expanded={isRightRailOpen}
          aria-controls="right-rail"
          aria-label={isRightRailOpen ? 'Hide right context' : 'Show right context'}
          title={isRightRailOpen ? 'Hide right context' : 'Show right context'}
        >
          <span aria-hidden="true">{isRightRailOpen ? '>' : '<'}</span>
        </button>

        {isLeftRailOpen && (
          <aside className="left-rail mila-left-rail" id="left-rail" aria-label="Project navigation">
            <div className="brand-block mila-brand">
              <div className="brand-mark" aria-hidden="true">M</div>
              <div>
                <strong>MILA26</strong>
                <span>AI Tokenisation Copilot</span>
              </div>
            </div>

            <nav className="project-nav project-directory" aria-label="MILA26 project folders">
              <p className="rail-label">Project</p>
              {demoProjectFolders.map((project) => (
                <button
                  type="button"
                  className="project-nav-button"
                  aria-current={selectedProjectId === project.id ? 'page' : undefined}
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  <span>{project.label}</span>
                  <small>{project.marketScope}</small>
                </button>
              ))}
            </nav>

            <nav className="project-nav rail-section" aria-label="Workspace navigation">
              <p className="rail-label">Workspace</p>
              <button type="button" className="project-nav-button" aria-current="page" onClick={() => setSelectedWorkspaceTab('overview')}>
                <span>Overview</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedProjectId('workspace')}>
                <span>All Projects</span>
              </button>
              <button type="button" className="project-nav-button" disabled title="Templates will be connected in a later workspace sprint.">
                <span>Templates</span>
              </button>
              <button type="button" className="project-nav-button" disabled title="Knowledge Base will be connected in a later workspace sprint.">
                <span>Knowledge Base</span>
              </button>
              <button type="button" className="project-nav-button" disabled title="Activity Log will be connected in a later workspace sprint.">
                <span>Activity Log</span>
              </button>
            </nav>

            <nav className="project-nav rail-section" aria-label="Engineering navigation">
              <p className="rail-label">Engineering</p>
              <button type="button" className="project-nav-button" aria-current="page">
                <span>ZiLi-OS Copilot</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedWorkspaceTab('smart_contract')}>
                <span>Contract Ops</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedWorkspaceTab('evidence')}>
                <span>Deployment Evidence</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedWorkspaceTab('evidence')}>
                <span>Evidence Vault</span>
              </button>
            </nav>

            <nav className="project-nav rail-section" aria-label="Settings navigation">
              <p className="rail-label">Settings</p>
              <button type="button" className="project-nav-button" disabled title="Wallet settings will be connected in a later workspace sprint.">
                <span>Wallet & Network</span>
              </button>
              <button type="button" className="project-nav-button" disabled title="Team settings will be connected in a later workspace sprint.">
                <span>Team</span>
              </button>
              <button type="button" className="project-nav-button" disabled title="Preferences will be connected in a later workspace sprint.">
                <span>Preferences</span>
              </button>
              <button type="button" className="project-nav-button" disabled title="Audit Trail will be connected in a later workspace sprint.">
                <span>Audit Trail</span>
              </button>
            </nav>

            <section className="left-status-card" aria-label="Product setup status">
              <h2>Product Setup</h2>
              <ul className="compact-status-list">
                {workspacePresentation.productSetup.map((item) => (
                  <li key={item.label}>
                    <span className={`status-dot ${item.status}`} aria-hidden="true" />
                    <span>{item.label}</span>
                    <small>{item.detail}</small>
                  </li>
                ))}
              </ul>
              <div className="workspace-persistence-actions" aria-label="Workspace snapshot actions">
                <button
                  type="button"
                  onClick={() => void saveWorkspaceToBackend()}
                  disabled={workspacePersistenceStatus.status === 'saving' || workspacePersistenceStatus.status === 'loading'}
                >
                  {workspacePersistenceStatus.status === 'saving' ? 'Saving...' : 'Save snapshot'}
                </button>
                <button
                  type="button"
                  onClick={() => void loadLatestWorkspaceFromBackend()}
                  disabled={workspacePersistenceStatus.status === 'saving' || workspacePersistenceStatus.status === 'loading'}
                >
                  {workspacePersistenceStatus.status === 'loading' ? 'Loading...' : 'Load latest'}
                </button>
              </div>
              <p className={`workspace-persistence-message ${workspacePersistenceStatus.status}`} aria-label="Workspace persistence status">
                {workspacePersistenceStatus.message}
              </p>
            </section>

            <a className="rail-help" href="#workspace">Help & Support</a>
          </aside>
        )}

        <section className="workspace" id="workspace">
          <header className="project-topbar">
            <div className="project-title-block">
              <div className="project-icon" aria-hidden="true">SC</div>
              <div>
                <h1>{activeProjectTitle}</h1>
                <p>
                  Tokenised Financial Product <span>Up to 50 investors</span>
                </p>
              </div>
            </div>
            <div className="topbar-controls" aria-label="Workspace controls">
              <span className="topbar-pill">Sepolia Testnet</span>
              <span className="topbar-pill">
                {walletAddressDisplay ? walletAddressDisplay : 'Wallet not connected'}
              </span>
              <span className="mode-toggle" aria-label="Mode selector">
                <button type="button" aria-current="true">Guided</button>
                <button type="button" disabled title="Expert mode will be wired after the guided lifecycle is stable.">Expert</button>
              </span>
              <span className="topbar-pill safety">Safety Status</span>
            </div>
          </header>

          <nav className="workspace-tabs" aria-label="Tokenisation lifecycle tabs">
            {workspacePresentation.tabs.map((tab, index) => (
              <button
                type="button"
                key={tab.id}
                aria-current={activeWorkspaceTab.id === tab.id ? 'page' : undefined}
                onClick={() => setSelectedWorkspaceTab(tab.id)}
                title={tab.purpose}
              >
                <span>{index + 1}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          <section className="workspace-stage" id="goal-copilot">
            <div className="stage-header">
              <div>
                <h2>{activeWorkspaceTab.label}</h2>
                <p>{activeWorkspaceTab.purpose}</p>
              </div>
              <span className={`gate-badge ${activeWorkspaceTab.status === 'available' ? 'ready' : 'draft'}`}>
                {tabStatusLabel(activeWorkspaceTab.status)}
              </span>
            </div>

            {activeWorkspaceTab.id === 'requirements' && (
              <section className="product-setup-prd-header" aria-label="Product Setup workspace">
                <div>
                  <span className="section-kicker">Product PRD</span>
                  <h3>Product setup</h3>
                  <p>ZiLi-OS drafts the product brief first, then stages operational details as draft notes for the focused tabs.</p>
                </div>
                <div className="product-setup-progress" aria-label="Product Setup PRD progress">
                  <div>
                    <span>{productSetupProgressLabel}</span>
                    {productSetupPendingReviewCount > 0 && <strong>{productSetupPendingReviewCount} captured detail(s) pending</strong>}
                  </div>
                  <div className="product-setup-progress-track" aria-hidden="true">
                    <span style={{ width: `${productSetupProgressPercent}%` }} />
                  </div>
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'investor_registry' && (
              <section className="registry-panel" aria-label="Investor Wallets workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Investor wallet registry</h3>
                    <p>
                      Register up to {MAX_INVESTOR_REGISTRY_ENTRIES} investor wallet addresses for whitelisting. This is not KYC,
                      investor eligibility approval, or legal approval.
                    </p>
                  </div>
                  <span className="gate-badge draft">{lifecycleReadModel.investorRegistry.statusLabel}</span>
                </div>
                {renderProductSetupDraftNotes('investor_wallets')}

                <div className="registry-summary" aria-label="Investor Wallets summary">
                  <article>
                    <span>Registered</span>
                    <strong>{lifecycleReadModel.investorRegistry.entryCount}/50</strong>
                  </article>
                  <article>
                    <span>Ready to whitelist</span>
                    <strong>{lifecycleReadModel.investorRegistry.readyToWhitelistCount}</strong>
                  </article>
                  <article>
                    <span>Whitelisted</span>
                    <strong>{lifecycleReadModel.investorRegistry.whitelistedCount}</strong>
                  </article>
                  <article>
                    <span>Remaining slots</span>
                    <strong>{lifecycleReadModel.investorRegistry.remainingSlots}</strong>
                  </article>
                </div>

                <section className="test-wallet-lab" aria-label="Test Wallet Lab">
                  <div className="test-wallet-lab-copy">
                    <div>
                      <h4>Test Wallet Lab</h4>
                      <p>
                        Generate test-only investor wallets for prototype demos. Use a separate MetaMask profile and import only
                        selected demo actor wallets; MILA26 remains the console for all 50 investors.
                      </p>
                    </div>
                    <span className="gate-badge draft">Testnet only</span>
                  </div>

                  <div className="test-wallet-controls">
                    <label htmlFor="test-wallet-count">
                      Test investors
                      <input
                        id="test-wallet-count"
                        value={testWalletCountInput}
                        onChange={(event) => setTestWalletCountInput(event.target.value)}
                        inputMode="numeric"
                        placeholder="50"
                      />
                    </label>
                    <button
                      type="button"
                      className="workflow-button primary-action"
                      onClick={generateTestInvestorWalletPackForRegistry}
                      disabled={!lifecycleReadModel.investorRegistry.canAddEntry}
                    >
                      Generate test wallet pack
                    </button>
                    <button
                      type="button"
                      className="workflow-button"
                      onClick={prepareTestWalletExport}
                      disabled={!testInvestorWalletPack}
                    >
                      Prepare test-only export
                    </button>
                  </div>

                  <div className="test-wallet-guidance">
                    <span>Separate test-only MetaMask profile</span>
                    <span>Import 3-5 demo actors, not all 50 by default</span>
                    <span>Private keys hidden until explicit export</span>
                  </div>

                  {testWalletLabMessage && <p className="test-wallet-message">{testWalletLabMessage}</p>}

                  {testInvestorWalletPublicRecords.length > 0 && (
                    <div className="test-wallet-preview" aria-label="Generated test wallet public preview">
                      <strong>{testInvestorWalletPublicRecords.length} generated test wallet(s)</strong>
                      <p>
                        {testInvestorWalletPublicRecords
                          .slice(0, 3)
                          .map((wallet) => `${wallet.label}: ${wallet.walletAddress}`)
                          .join(' | ')}
                      </p>
                    </div>
                  )}

                  {testWalletExportContent && (
                    <label className="test-wallet-export" htmlFor="test-wallet-export">
                      Test-only wallet export
                      <textarea id="test-wallet-export" readOnly value={testWalletExportContent} rows={6} />
                    </label>
                  )}
                </section>

                <div className="registry-form">
                  <label htmlFor="investor-registry-wallet">
                    Investor wallet address
                    <input
                      id="investor-registry-wallet"
                      value={investorRegistryDraftWallet}
                      onChange={(event) => setInvestorRegistryDraftWallet(event.target.value)}
                      placeholder="0x..."
                      autoComplete="off"
                    />
                  </label>
                  <button
                    type="button"
                    className="workflow-button primary-action"
                    onClick={addInvestorRegistryWallet}
                    disabled={!lifecycleReadModel.investorRegistry.canAddEntry}
                  >
                    Add wallet
                  </button>
                </div>

                {investorRegistryError && (
                  <p className="error-text" role="alert">
                    {investorRegistryError}
                  </p>
                )}

                {lifecycleReadModel.investorRegistry.blockingReasons.length > 0 && (
                  <ul className="registry-warnings" aria-label="Investor Wallets blocking items">
                    {lifecycleReadModel.investorRegistry.blockingReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}

                <div className="registry-table" role="table" aria-label="Investor wallet entries">
                  <div className="registry-row registry-header" role="row">
                    <span role="columnheader">Investor</span>
                    <span role="columnheader">Wallet</span>
                    <span role="columnheader">Registry status</span>
                    <span role="columnheader">Activity console</span>
                    <span role="columnheader">Handoffs</span>
                  </div>
                  {lifecycleReadModel.investorRegistry.entries.length === 0 ? (
                    <p className="empty-registry">No investor wallets registered yet.</p>
                  ) : (
                    lifecycleReadModel.investorRegistry.entries.map((entry) => (
                      <div className="registry-row" role="row" key={entry.id}>
                        <span role="cell">
                          <strong>{entry.displayLabel}</strong>
                          <small>{entry.sourceLabel}</small>
                        </span>
                        <span role="cell">{entry.walletAddress || 'Wallet address missing'}</span>
                        <span role="cell">{entry.statusLabel}</span>
                        <span role="cell">
                          {entry.validationMessages.length > 0 ? (
                            entry.validationMessages.join(' ')
                          ) : (
                            <>
                              Valid wallet address
                              <small>{entry.activityStatusLabel}</small>
                            </>
                          )}
                        </span>
                        <span role="cell" className="registry-actions">
                          <button
                            type="button"
                            className="workflow-button"
                            disabled={!entry.canUseForWhitelist}
                            onClick={() => selectInvestorWalletForWhitelist(entry.walletAddress)}
                          >
                            Use for wallet whitelist
                          </button>
                          <button
                            type="button"
                            className="workflow-button"
                            disabled={!entry.canUseForAllocationMint}
                            onClick={() => selectInvestorWalletForAllocationMint(entry.walletAddress)}
                          >
                            Use for Allocation / Mint
                          </button>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'subscription' && (
              <section className="parameter-panel" aria-label="Subscription workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Subscription parameters</h3>
                    <p>
                      Configure the permitted stablecoins, subscription window, public subscription receiving wallet, and
                      payment-per-token terms for the subscription-redemption smart-contract template. This does not move
                      stablecoins.
                    </p>
                  </div>
                  <span className={`gate-badge ${lifecycleReadModel.subscription.status === 'ready' ? 'ready' : 'draft'}`}>
                    {lifecycleReadModel.subscription.statusLabel}
                  </span>
                </div>
                {renderProductSetupDraftNotes('subscription')}

                <div className="parameter-grid">
                  <label htmlFor="subscription-stablecoins">
                    Permitted stablecoins
                    <input
                      id="subscription-stablecoins"
                      value={permittedStablecoinsInput}
                      onChange={(event) => {
                        setPermittedStablecoinsInput(event.target.value);
                        updateSubscriptionParameters({
                          permittedStablecoins: parsePermittedStablecoins(event.target.value),
                        });
                      }}
                      placeholder="USDC, USDT"
                      autoComplete="off"
                    />
                  </label>
                  <label htmlFor="subscription-window">
                    Subscription window
                    <input
                      id="subscription-window"
                      value={lifecycleState.subscriptionParameters.subscriptionWindow ?? ''}
                      onChange={(event) => updateSubscriptionParameters({ subscriptionWindow: event.target.value })}
                      placeholder="e.g. Monthly, first 5 business days"
                    />
                  </label>
                  <label htmlFor="minimum-subscription">
                    Minimum subscription amount
                    <input
                      id="minimum-subscription"
                      value={lifecycleState.subscriptionParameters.minimumSubscriptionAmount ?? ''}
                      onChange={(event) => updateSubscriptionParameters({ minimumSubscriptionAmount: event.target.value })}
                      inputMode="decimal"
                      placeholder="25000"
                    />
                  </label>
                  <label htmlFor="subscription-payment-address">
                    Subscription receiving wallet address
                    <input
                      id="subscription-payment-address"
                      value={lifecycleState.subscriptionParameters.paymentAddress ?? ''}
                      onChange={(event) => updateSubscriptionParameters({ paymentAddress: event.target.value })}
                      placeholder="0x..."
                      autoComplete="off"
                    />
                  </label>
                  <label htmlFor="payment-per-token">
                    Payment per token
                    <input
                      id="payment-per-token"
                      value={lifecycleState.subscriptionParameters.paymentPerToken ?? ''}
                      onChange={(event) => updateSubscriptionParameters({ paymentPerToken: event.target.value })}
                      inputMode="decimal"
                      placeholder="1.025"
                    />
                  </label>
                </div>

                <div className="parameter-status" aria-label="Subscription validation status">
                  <p>{lifecycleReadModel.subscription.statusDetail}</p>
                  {lifecycleReadModel.subscription.validationMessages.length > 0 ? (
                    <ul>
                      {lifecycleReadModel.subscription.validationMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Subscription parameters are ready for template handoff.</p>
                  )}
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'redemption' && (
              <section className="parameter-panel" aria-label="Redemption workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Redemption parameters</h3>
                    <p>
                      Configure the redemption window, public redemption wallet, payout stablecoin, payout-per-token amount, and
                      liquidation delay before stablecoin payout. This is parameter capture only.
                    </p>
                  </div>
                  <span className={`gate-badge ${lifecycleReadModel.redemption.status === 'ready' ? 'ready' : 'draft'}`}>
                    {lifecycleReadModel.redemption.statusLabel}
                  </span>
                </div>
                {renderProductSetupDraftNotes('redemption')}

                <div className="parameter-grid">
                  <label htmlFor="redemption-window">
                    Redemption window / date
                    <input
                      id="redemption-window"
                      value={lifecycleState.redemptionParameters.redemptionWindow ?? ''}
                      onChange={(event) => updateRedemptionParameters({ redemptionWindow: event.target.value })}
                      placeholder="e.g. Quarterly redemption date"
                    />
                  </label>
                  <label htmlFor="redemption-delay-unit">
                    Redemption delay unit
                    <select
                      id="redemption-delay-unit"
                      value={lifecycleState.redemptionParameters.redemptionDelayUnit ?? ''}
                      onChange={(event) =>
                        updateRedemptionParameters({
                          redemptionDelayUnit: event.target.value
                            ? (event.target.value as RedemptionParameters['redemptionDelayUnit'])
                            : undefined,
                        })
                      }
                    >
                      <option value="">Choose unit</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </label>
                  <label htmlFor="redemption-delay-value">
                    Redemption delay duration
                    <input
                      id="redemption-delay-value"
                      value={lifecycleState.redemptionParameters.redemptionDelayValue ?? ''}
                      onChange={(event) =>
                        updateRedemptionParameters({
                          redemptionDelayValue: event.target.value ? Number(event.target.value) : undefined,
                        })
                      }
                      inputMode="numeric"
                      placeholder="14"
                    />
                  </label>
                  <label htmlFor="redemption-wallet">
                    Redemption wallet address
                    <input
                      id="redemption-wallet"
                      value={lifecycleState.redemptionParameters.redemptionWalletAddress ?? ''}
                      onChange={(event) => updateRedemptionParameters({ redemptionWalletAddress: event.target.value })}
                      placeholder="0x..."
                      autoComplete="off"
                    />
                  </label>
                  <label htmlFor="payout-stablecoin">
                    Payout stablecoin
                    <input
                      id="payout-stablecoin"
                      value={lifecycleState.redemptionParameters.payoutStablecoin ?? ''}
                      onChange={(event) => updateRedemptionParameters({ payoutStablecoin: event.target.value })}
                      placeholder="USDC"
                    />
                  </label>
                  <label htmlFor="payout-per-token">
                    Payout per token
                    <input
                      id="payout-per-token"
                      value={lifecycleState.redemptionParameters.payoutPerToken ?? ''}
                      onChange={(event) => updateRedemptionParameters({ payoutPerToken: event.target.value })}
                      inputMode="decimal"
                      placeholder="1.01"
                    />
                  </label>
                  <label htmlFor="redemption-handling-rule">
                    Redemption handling
                    <select
                      id="redemption-handling-rule"
                      value={lifecycleState.redemptionParameters.redemptionHandlingRule ?? ''}
                      onChange={(event) => updateRedemptionParameters({ redemptionHandlingRule: event.target.value || undefined })}
                    >
                      <option value="">Choose handling</option>
                      <option value="Burn after tokens are received">Burn after tokens are received</option>
                      <option value="Lock until stablecoin payout is complete, then burn">Lock until payout, then burn</option>
                      <option value="Burn only after payout is complete">Burn only after payout is complete</option>
                      <option value="Do not automate this for MVP">Do not automate for MVP</option>
                    </select>
                  </label>
                </div>

                <div className="parameter-status" aria-label="Redemption validation status">
                  <p>{lifecycleReadModel.redemption.statusDetail}</p>
                  {lifecycleReadModel.redemption.validationMessages.length > 0 ? (
                    <ul>
                      {lifecycleReadModel.redemption.validationMessages.map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Redemption parameters are ready for template handoff.</p>
                  )}
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'smart_contract' && (
              <section className="parameter-panel contract-ops-workspace" aria-label="Contract Ops workspace" data-testid="smart-contract-control">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Contract operations</h3>
                    <p>
                      Review and run the wallet-signed Sepolia operations that are actually available from the current shared lifecycle state.
                    </p>
                  </div>
                  <span className={`gate-badge ${smartContractControlPanel.status === 'ready_for_spec' ? 'ready' : 'draft'}`}>
                    {smartContractControlPanel.statusLabel}
                  </span>
                </div>
                {renderProductSetupDraftNotes('contract_ops')}

                <section className="product-setup-blockers" aria-label="Contract Ops Product Setup warnings">
                  <div>
                    <h4>Product Setup deployment warnings</h4>
                    {productSetupReadModel.deploymentWarnings.length > 0 ? (
                      <ul className="registry-warnings">
                        {productSetupReadModel.deploymentWarnings.map((warning) => (
                          <li key={warning.fieldKey}>
                            {warning.message} Likely error: {warning.likelyError}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Product Setup has no open deployment warnings.</p>
                    )}
                    {contractOpsDeploymentWarningMessage && <p className="chat-status">{contractOpsDeploymentWarningMessage}</p>}
                  </div>
                  {productSetupReadModel.hasUnacknowledgedDeploymentWarnings && (
                    <button type="button" className="workflow-button" onClick={acknowledgeDeploymentWarnings}>
                      Proceed with warnings
                    </button>
                  )}
                </section>

                <section className="contract-ops-role-panel" aria-label="Contract Ops deployment roles">
                  <div className="registry-panel-heading compact-subsection-heading">
                    <div>
                      <h4>Deployment role wallet</h4>
                      <p>
                        Save the public admin wallet address or a role placeholder. Never paste private keys, seed phrases, or
                        recovery phrases.
                      </p>
                    </div>
                  </div>
                  <div className="parameter-grid">
                    <label htmlFor="contract-ops-admin-wallet">
                      Admin wallet
                      <input
                        id="contract-ops-admin-wallet"
                        value={productSetupWalletInputs.admin_wallet}
                        onChange={(event) =>
                          setProductSetupWalletInputs((current) => ({
                            ...current,
                            admin_wallet: event.target.value,
                          }))
                        }
                        placeholder="0x... or issuer operations wallet"
                        autoComplete="off"
                      />
                    </label>
                    <button
                      type="button"
                      className="workflow-button primary-action"
                      onClick={() => updateProductSetupWalletField('admin_wallet', productSetupWalletInputs.admin_wallet)}
                    >
                      Save admin wallet
                    </button>
                  </div>
                  {productSetupWalletMessage && <p className="chat-status">{productSetupWalletMessage}</p>}
                </section>

                <div className="contract-ops-summary" aria-label="Contract Ops summary">
                  <article>
                    <span>Deployment</span>
                    <strong>{formatWalletSignedDeploymentStatus(walletSignedDeploymentState.deploymentStatus)}</strong>
                    <p>{deploymentEvidenceReadModel.contractAddress ?? 'No receipt-returned contract address yet.'}</p>
                  </article>
                  <article>
                    <span>Wallet</span>
                    <strong>{formatWalletConnectionStatus(walletConnectionReadModel.walletConnectionStatus)}</strong>
                    <p>{walletAddressDisplay ? `${walletAddressDisplay} / ${formatWalletChainStatus(walletConnectionReadModel.chainStatus)}` : 'Connect a Sepolia wallet.'}</p>
                  </article>
                  <article>
                    <span>Operations</span>
                    <strong>{deploymentEvidenceReadModel.status === 'confirmed' ? 'Gated operations available' : 'Waiting for deployment evidence'}</strong>
                    <p>Record NAV, Whitelist Wallet, and Allocation / Mint are released operation-by-operation.</p>
                  </article>
                </div>

                <div className="contract-ops-actions" aria-label="Contract Ops actions">
                  <button
                    type="button"
                    className="workflow-button primary-action"
                    data-action-id={uiActions.deployToSepolia}
                    disabled={!canRequestSepoliaDeployment}
                    onClick={() => void requestSepoliaDeployment()}
                    title={canRequestSepoliaDeployment ? undefined : deploymentActionDisabledReason}
                  >
                    {walletSignedDeploymentState.deploymentStatus === 'awaiting_wallet_confirmation'
                      ? 'Awaiting Wallet Confirmation...'
                      : walletSignedDeploymentState.deploymentStatus === 'submitted'
                        ? 'Deployment Submitted to Sepolia'
                        : walletSignedDeploymentState.deploymentStatus === 'confirmed'
                          ? 'Deployment Confirmed on Sepolia'
                          : 'Deploy to Sepolia with Wallet'}
                  </button>
                  <button
                    type="button"
                    className="workflow-button"
                    data-action-id={uiActions.recordNavEvent}
                    disabled={!canRequestRecordNavOperation}
                    onClick={() => void requestRecordNavOperation()}
                    title={canRequestRecordNavOperation ? undefined : recordNavOperationDisabledReason}
                  >
                    {recordNavOperationState.operationStatus === 'awaiting_wallet_confirmation'
                      ? 'Awaiting Wallet Confirmation...'
                      : recordNavOperationState.operationStatus === 'submitted'
                        ? 'Record NAV Submitted to Sepolia'
                        : recordNavOperationState.operationStatus === 'confirmed'
                          ? 'Record NAV Confirmed on Sepolia'
                          : 'Record NAV Event'}
                  </button>
                  <label className="field-label compact-operation-field" htmlFor="wallet-whitelist-target">
                    Whitelist target wallet
                    <input
                      id="wallet-whitelist-target"
                      value={walletWhitelistTargetWallet}
                      onChange={(event) => updateWalletWhitelistTargetWallet(event.target.value)}
                      placeholder="0x..."
                      autoComplete="off"
                      disabled={isWalletWhitelistOperationInFlight(walletWhitelistOperationState)}
                    />
                  </label>
                  <button
                    type="button"
                    className="workflow-button"
                    data-action-id={uiActions.whitelistWallet}
                    disabled={!canRequestWalletWhitelistOperation}
                    onClick={() => void requestWalletWhitelistOperation()}
                    title={canRequestWalletWhitelistOperation ? undefined : walletWhitelistOperationDisabledReason}
                  >
                    {walletWhitelistOperationState.operationStatus === 'awaiting_wallet_confirmation'
                      ? 'Wallet whitelist status: Awaiting wallet confirmation'
                      : walletWhitelistOperationState.operationStatus === 'submitted'
                        ? 'Wallet whitelist submitted to Sepolia'
                        : selectedWhitelistTargetAlreadyConfirmed
                          ? 'Wallet whitelist confirmed on Sepolia'
                          : 'Whitelist Wallet'}
                  </button>
                  <button
                    type="button"
                    className="workflow-button"
                    data-action-id={uiActions.allocationMint}
                    disabled={!canRequestAllocationMintOperation}
                    onClick={() => void requestAllocationMintOperation()}
                    title={canRequestAllocationMintOperation ? undefined : allocationMintOperationDisabledReason}
                  >
                    {walletAllocationMintOperationState.operationStatus === 'awaiting_wallet_confirmation'
                      ? 'Allocation / Mint awaiting wallet confirmation'
                      : walletAllocationMintOperationState.operationStatus === 'submitted'
                        ? 'Allocation / Mint submitted to Sepolia'
                        : selectedAllocationMintAlreadyConfirmed
                          ? 'Allocation / Mint confirmed on Sepolia'
                          : 'Submit Allocation / Mint'}
                  </button>
                </div>

                <div className="contract-ops-evidence" aria-label="Contract Ops evidence summary">
                  <span>Deployment evidence: {deploymentEvidenceReadModel.statusLabel}</span>
                  <span>Record NAV: {recordNavOperationReadModel.statusLabel}</span>
                  <span>Wallet whitelist: {walletWhitelistOperationReadModel.statusLabel}</span>
                  <span>Allocation / Mint: {walletAllocationMintOperationReadModel.statusLabel}</span>
                  <span>Safety: user wallet signs, backend holds no private keys, Sepolia only.</span>
                </div>

                <div className="registry-panel-heading compact-subsection-heading">
                  <div>
                    <h3>Allocation / Mint setup</h3>
                    <p>
                      Prepare single-investor allocation parameters from Investor Wallets and Subscription state before submitting the wallet-signed mint.
                    </p>
                  </div>
                  <span className={`gate-badge ${allocationMint.status === 'ready' ? 'ready' : 'draft'}`}>
                    {allocationMint.statusLabel}
                  </span>
                </div>

                <div className="allocation-mint-workspace" aria-label="Allocation Mint workspace">
                <div className="parameter-grid">
                  <label htmlFor="allocation-target-wallet">
                    Allocation target wallet
                    <select
                      id="allocation-target-wallet"
                      value={lifecycleState.allocationMintParameters.targetWalletAddress ?? ''}
                      onChange={(event) => updateAllocationMintParameters({ targetWalletAddress: event.target.value || undefined })}
                    >
                      <option value="">Choose registered investor wallet</option>
                      {lifecycleReadModel.investorRegistry.entries
                        .filter((entry) => entry.canUseForAllocationMint)
                        .map((entry) => (
                          <option key={entry.id} value={entry.walletAddress}>
                            {entry.walletAddress}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label htmlFor="allocation-token-amount">
                    Token allocation amount
                    <input
                      id="allocation-token-amount"
                      value={lifecycleState.allocationMintParameters.tokenAmount ?? ''}
                      onChange={(event) => updateAllocationMintParameters({ tokenAmount: event.target.value })}
                      inputMode="decimal"
                      placeholder="1000"
                    />
                  </label>
                </div>

                <div className="allocation-context" aria-label="Allocation Mint dependencies">
                  <article>
                    <span>Investor Wallets</span>
                    <strong>{lifecycleReadModel.investorRegistry.statusLabel}</strong>
                    <p>{lifecycleReadModel.investorRegistry.statusDetail}</p>
                  </article>
                  <article>
                    <span>Subscription</span>
                    <strong>{lifecycleReadModel.subscription.statusLabel}</strong>
                    <p>{lifecycleReadModel.subscription.statusDetail}</p>
                  </article>
                  <article>
                    <span>Template reference</span>
                    <strong>
                      {lifecycleReadModel.subscription.normalizedPermittedStablecoins.length > 0
                        ? lifecycleReadModel.subscription.normalizedPermittedStablecoins.join(', ')
                        : 'Stablecoin not set'}
                    </strong>
                    <p>Payment per token: {lifecycleState.subscriptionParameters.paymentPerToken ?? 'Not set'}</p>
                  </article>
                  <article>
                    <span>Investor whitelist</span>
                    <strong>{selectedAllocationMintInvestorWhitelisted ? 'Whitelisted locally' : 'Whitelist required'}</strong>
                    <p>{selectedAllocationMintInvestorWhitelisted ? 'Selected wallet can receive minted allocation.' : 'Use Wallet Whitelist before minting.'}</p>
                  </article>
                </div>

                <div className="parameter-status" aria-label="Allocation Mint validation status">
                  <p>{allocationMint.statusDetail}</p>
                  {allocationMint.blockingReasons.length > 0 || allocationMint.validationMessages.length > 0 ? (
                    <ul>
                      {[...allocationMint.blockingReasons, ...allocationMint.validationMessages]
                        .filter((message) => message !== allocationMint.statusDetail)
                        .map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                    </ul>
                  ) : (
                    <p>Allocation / Mint parameters are ready for review.</p>
                  )}
                  <p>{walletAllocationMintOperationReadModel.statusDetail}</p>
                </div>

                <div className="parameter-status" aria-label="Sepolia demo wallet readiness">
                  <div className="status-row">
                    <p>{sepoliaDemoWalletReadinessReadModel.statusDetail}</p>
                    <button
                      type="button"
                      className="workflow-button"
                      onClick={() => void checkSepoliaWalletReadiness()}
                      disabled={!sepoliaDemoWalletReadinessReadModel.canCheckReadiness}
                      title={sepoliaDemoWalletReadinessReadModel.disabledReason}
                    >
                      {sepoliaDemoWalletReadinessState.checkStatus === 'checking' ? 'Checking Sepolia Readiness...' : 'Check Sepolia Readiness'}
                    </button>
                  </div>
                  <div className="readiness-list">
                    {sepoliaDemoWalletReadinessReadModel.items.map((item) => (
                      <span key={item.label}>
                        <strong>{item.label}</strong>
                        {item.detail}
                      </span>
                    ))}
                  </div>
                  <div className="funding-helper" aria-label="Sepolia funding helper">
                    <div className="funding-helper-heading">
                      <div>
                        <strong>Funding helper</strong>
                        <p>Copy the wallets that need test funds. MILA26 does not auto-fund wallets or hold private keys.</p>
                      </div>
                      <span>{sepoliaDemoWalletReadinessReadModel.fundingTargets.length} target(s)</span>
                    </div>
                    <div className="funding-target-list">
                      {sepoliaDemoWalletReadinessReadModel.fundingTargets.map((target) => (
                        <article className="funding-target" key={target.id}>
                          <div>
                            <div className="funding-target-title">
                              <strong>{target.label}</strong>
                              <span className={`funding-status ${target.status}`}>{fundingTargetStatusLabel(target.status)}</span>
                            </div>
                            <small>{target.role}</small>
                            <p>{target.detail}</p>
                            {target.address && <code>{target.address}</code>}
                          </div>
                          <button
                            type="button"
                            className="workflow-button compact"
                            onClick={() => void copyFundingTarget(target.label, target.copyValue)}
                            disabled={!target.copyValue}
                          >
                            Copy
                          </button>
                        </article>
                      ))}
                    </div>
                    {fundingHelperMessage && <p className="funding-helper-message">{fundingHelperMessage}</p>}
                  </div>
                </div>
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'asset_servicing' && (
              <section className="parameter-panel" aria-label="Asset Servicing workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Asset servicing parameters</h3>
                    <p>
                      Capture NAV cadence, source, and investor update assumptions. Record NAV execution remains a gated Contract Ops action.
                    </p>
                  </div>
                  <span className="gate-badge draft">Parameter setup</span>
                </div>
                {renderProductSetupDraftNotes('asset_servicing')}

                <div className="parameter-grid">
                  <label htmlFor="asset-servicing-nav-cadence">
                    NAV cadence
                    <input
                      id="asset-servicing-nav-cadence"
                      value={lifecycleState.assetServicingParameters.navCadence ?? ''}
                      onChange={(event) => updateAssetServicingParameters({ navCadence: event.target.value })}
                      placeholder="e.g. Quarterly"
                    />
                  </label>
                  <label htmlFor="asset-servicing-nav-source">
                    NAV source
                    <input
                      id="asset-servicing-nav-source"
                      value={lifecycleState.assetServicingParameters.navSource ?? ''}
                      onChange={(event) => updateAssetServicingParameters({ navSource: event.target.value })}
                      placeholder="e.g. Uploaded valuation file"
                    />
                  </label>
                  <label htmlFor="asset-servicing-investor-update-rule">
                    Investor update rule
                    <input
                      id="asset-servicing-investor-update-rule"
                      value={lifecycleState.assetServicingParameters.investorUpdateRule ?? ''}
                      onChange={(event) => updateAssetServicingParameters({ investorUpdateRule: event.target.value })}
                      placeholder="e.g. Quarterly investor update records"
                    />
                  </label>
                </div>

                <div className="parameter-status" aria-label="Asset Servicing status">
                  <p>
                    NAV operation status: {recordNavOperationReadModel.statusLabel}. Use Contract Ops for wallet-signed Record NAV.
                  </p>
                  <p>
                    Product Setup provenance: edits here update NAV cadence, NAV source, and investor update rule in the canonical record.
                  </p>
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'maturity' && (
              <section className="parameter-panel" aria-label="Maturity workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Maturity parameters</h3>
                    <p>
                      Capture closeout assumptions for final redemption planning. This does not execute maturity redemption.
                    </p>
                  </div>
                  <span className={`gate-badge ${lifecycleReadModel.maturityStatus === 'draft' ? 'draft' : 'locked'}`}>
                    {lifecycleReadModel.maturityStatus === 'draft' ? 'Maturity draft' : 'Maturity parameters needed'}
                  </span>
                </div>
                {renderProductSetupDraftNotes('maturity')}

                <div className="parameter-grid">
                  <label htmlFor="maturity-date">
                    Maturity date
                    <input
                      id="maturity-date"
                      value={lifecycleState.maturityParameters.maturityDate ?? ''}
                      onChange={(event) => updateMaturityParameters({ maturityDate: event.target.value })}
                      placeholder="e.g. 2028-12-31"
                    />
                  </label>
                  <label htmlFor="maturity-closeout-method">
                    Closeout method
                    <input
                      id="maturity-closeout-method"
                      value={lifecycleState.maturityParameters.closeoutMethod ?? ''}
                      onChange={(event) => updateMaturityParameters({ closeoutMethod: event.target.value })}
                      placeholder="e.g. Final NAV redemption and token burn"
                    />
                  </label>
                </div>

                <div className="parameter-status" aria-label="Maturity status">
                  <p>
                    Maturity stays parameter-only until redemption/maturity execution adapters and evidence contracts are designed.
                  </p>
                  <p>Product Setup provenance: edits here update maturity date and closeout rule in the canonical record.</p>
                </div>
              </section>
            )}

            {activeWorkspaceTab.id === 'evidence' && (
              <section className="parameter-panel durable-records-panel" aria-label="Evidence Vault workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Durable evidence and artifact records</h3>
                    <p>
                      Save provider-derived Sepolia evidence and generated artifacts against the current workspace snapshot.
                      Loading these records does not restore local wallet session state.
                    </p>
                  </div>
                  <span className="gate-badge draft">Durable storage foundation</span>
                </div>

                <div className="durable-record-grid">
                  <article>
                    <div>
                      <span>Evidence Vault</span>
                      <strong>{durableEvidenceRecords.length} record(s)</strong>
                      <p>{evidenceVaultStatus.message}</p>
                    </div>
                    <div className="durable-record-actions">
                      <button
                        type="button"
                        className="workflow-button primary-action"
                        onClick={() => void saveEvidenceVaultRecords()}
                        disabled={evidenceVaultStatus.status === 'saving' || workspacePersistenceStatus.status === 'saving'}
                      >
                        {evidenceVaultStatus.status === 'saving' ? 'Saving evidence...' : 'Save evidence records'}
                      </button>
                      <button
                        type="button"
                        className="workflow-button"
                        onClick={() => void loadEvidenceVaultRecords()}
                        disabled={evidenceVaultStatus.status === 'loading'}
                      >
                        {evidenceVaultStatus.status === 'loading' ? 'Loading evidence...' : 'Load Evidence Vault'}
                      </button>
                    </div>
                    {durableEvidenceRecords.length > 0 && (
                      <ul className="durable-record-list" aria-label="Durable evidence records">
                        {durableEvidenceRecords.slice(0, 4).map((record) => (
                          <li key={record.id}>
                            <strong>{record.evidenceType}</strong>
                            <span>{record.lifecycleContextStatus === 'current_context' ? 'Current snapshot' : 'Historical snapshot'}</span>
                            <small>{record.transactionHash}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>

                  <article>
                    <div>
                      <span>Generated Artifacts</span>
                      <strong>{durableArtifactRecords.length} record(s)</strong>
                      <p>{artifactVaultStatus.message}</p>
                    </div>
                    <div className="durable-record-actions">
                      <button
                        type="button"
                        className="workflow-button primary-action"
                        onClick={() => void saveGeneratedArtifactRecords()}
                        disabled={artifactVaultStatus.status === 'saving' || workspacePersistenceStatus.status === 'saving'}
                      >
                        {artifactVaultStatus.status === 'saving' ? 'Saving artifacts...' : 'Save generated artifacts'}
                      </button>
                      <button
                        type="button"
                        className="workflow-button"
                        onClick={() => void loadGeneratedArtifactRecords()}
                        disabled={artifactVaultStatus.status === 'loading'}
                      >
                        {artifactVaultStatus.status === 'loading' ? 'Loading artifacts...' : 'Load artifacts'}
                      </button>
                    </div>
                    {durableArtifactRecords.length > 0 && (
                      <ul className="durable-record-list" aria-label="Generated artifact records">
                        {durableArtifactRecords.slice(0, 5).map((record) => (
                          <li key={record.id}>
                            <strong>{record.artifactType}</strong>
                            <span>{record.lifecycleContextStatus === 'current_context' ? 'Current snapshot' : 'Stale snapshot'}</span>
                            <small>{record.contentHash}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </div>
              </section>
            )}

            <section className="center-work-artifact" aria-label="Active tab work artifact">
              {activeWorkspaceTab.id === 'requirements' && (
                <section className="product-setup-artifact" aria-label="Product Setup PRD artifact">
                  <section className="product-setup-profile" aria-label="What is this product">
                    <div className="registry-panel-heading compact-subsection-heading">
                      <div>
                        <span className="section-kicker">What is this product</span>
                        <h3>Product profile</h3>
                      </div>
                    </div>
                    <div className="product-profile-list">
                      {productSetupReadModel.profileRows.map((row) => (
                        <article key={row.id}>
                          <span>{row.label}</span>
                          <strong>{row.value}</strong>
                          <small className={`product-setup-chip ${row.provenanceLabel.toLowerCase().replaceAll(' ', '-')}`}>
                            {productSetupProfileProvenanceLabel(row.provenanceLabel)}
                          </small>
                          {row.whyItMatters && <p>{row.whyItMatters}</p>}
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="product-setup-handoffs" aria-label="Product Setup downstream handoffs">
                    <div className="registry-panel-heading compact-subsection-heading">
                      <div>
                        <h3>Downstream handoffs</h3>
                        <p>Operational details stay as draft notes until the focused tab confirms them.</p>
                      </div>
                    </div>
                    {productSetupReadModel.downstreamHandoffs.length === 0 ? (
                      <p className="empty-registry">No downstream details captured yet.</p>
                    ) : (
                      <div className="product-setup-handoff-list">
                        {productSetupReadModel.downstreamHandoffs.map((handoff) => (
                          <article key={handoff.id}>
                            <div>
                              <span>{handoff.title}</span>
                              <strong>{productSetupHandoffTargetLabel(handoff.target)}</strong>
                              <p>{handoff.detail}</p>
                              <small>Status: {handoff.status.replaceAll('_', ' ')}</small>
                            </div>
                            <button
                              type="button"
                              className="workflow-button"
                              disabled={handoff.status === 'sent_as_draft_note'}
                              onClick={() => sendProductSetupHandoff(handoff.id)}
                            >
                              {handoff.status === 'sent_as_draft_note'
                                ? 'Draft note sent'
                                : `Send to ${productSetupHandoffTargetLabel(handoff.target)}`}
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>

                  {productSetupReadModel.unsupportedRequirementDecisions.length > 0 && (
                    <section
                      className="product-setup-review"
                      id="product-setup-unsupported-requirements"
                      tabIndex={-1}
                      aria-label="Product Setup unsupported requirements"
                    >
                      <div className="registry-panel-heading compact-subsection-heading">
                        <div>
                          <h3>Unsupported or custom requirements</h3>
                          <p>ZiLi-OS can document these, propose a nearest equivalent, or exclude them from MVP execution.</p>
                        </div>
                        <span>{productSetupReadModel.unsupportedRequirementDecisions.length} item(s)</span>
                      </div>
                      <div className="product-setup-update-list">
                        {productSetupReadModel.unsupportedRequirementDecisions.map((item) => (
                          <article key={item.id}>
                            <div>
                              <span>{item.requirement}</span>
                              <strong>{item.decision.replaceAll('_', ' ')}</strong>
                              <p>{item.mismatchReason}</p>
                              {item.nearestEquivalent && <small>Nearest equivalent: {item.nearestEquivalent}</small>}
                            </div>
                            <div className="registry-actions">
                              <button
                                type="button"
                                className="workflow-button"
                                onClick={() => setProductSetupRecord((current) => decideUnsupportedRequirement(current, item.id, 'accepted_equivalent'))}
                              >
                                Accept equivalent
                              </button>
                              <button
                                type="button"
                                className="workflow-button"
                                onClick={() => setProductSetupRecord((current) => decideUnsupportedRequirement(current, item.id, 'rejected_equivalent'))}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="workflow-button"
                                onClick={() => setProductSetupRecord((current) => decideUnsupportedRequirement(current, item.id, 'excluded_from_mvp'))}
                              >
                                Exclude from MVP
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="product-setup-pack" aria-label="Product Setup Pack">
                    <div>
                      <h4>Product Setup Pack</h4>
                      <p>{productSetupReadModel.packPreview.warning}</p>
                      <ul className="artifact-list">
                        {productSetupReadModel.packPreview.includedDocuments.map((document) => (
                          <li key={document}>
                            <span>Included</span>
                            {document}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button
                      type="button"
                      className="workflow-button primary-action"
                      onClick={() => generateProductSetupPack('markdown')}
                    >
                      Download Product Setup Pack
                    </button>
                    <button
                      type="button"
                      className="workflow-button"
                      onClick={() => generateProductSetupPack('json')}
                    >
                      Download JSON
                    </button>
                    <button
                      type="button"
                      className="workflow-button"
                      onClick={() => generateProductSetupPack('pdf')}
                    >
                      Download PDF-readable
                    </button>
                    {productSetupPackGeneratedAtIso && (
                      <p className="chat-status">Draft Product Setup Pack generated in session. Save generated artifacts to persist it.</p>
                    )}
                    {productSetupPackStatus && <p className="chat-status">{productSetupPackStatus}</p>}
                  </section>
                </section>
              )}

              {activeWorkspaceTab.id !== 'requirements' && (
                <section className="next-action-panel" aria-label="Next suggested action">
                  <h3>Next best action</h3>
                  <p>{nextBestActionText}</p>
                  <div className="suggested-action-row">
                    <button
                      type="button"
                      className="workflow-button primary-action"
                      data-action-id={primaryWorkflowAction.id}
                      disabled={
                        !primaryWorkflowAction.enabled ||
                        isEngineeringBriefLoading ||
                        smartContractGenerationStatus === 'loading' ||
                        walletConnectionReadModel.walletConnectionStatus === 'connecting' ||
                        (primaryWorkflowAction.id === 'connect_wallet' && isWalletConnectionComplete)
                      }
                      onClick={() => runCockpitAction(primaryWorkflowAction.id)}
                      title={primaryWorkflowAction.disabledReason}
                    >
                      {cockpitActionLabel(primaryWorkflowAction.id, primaryWorkflowAction.label)}
                    </button>
                    <button type="button" className="workflow-button" onClick={() => setSelectedWorkspaceTab('subscription')}>
                      Define permitted stablecoins
                    </button>
                    <button type="button" className="workflow-button" onClick={() => setSelectedWorkspaceTab('redemption')}>
                      Set redemption delay
                    </button>
                    <button type="button" className="workflow-button" onClick={() => setSelectedWorkspaceTab('investor_registry')}>
                      Review investor wallet registry
                    </button>
                    {smartContractGenerationStatus === 'ready' && (
                      <button
                        type="button"
                        className="workflow-button"
                        data-action-id={uiActions.deployToSepolia}
                        disabled={!canRequestSepoliaDeployment}
                        onClick={() => void requestSepoliaDeployment()}
                        title={canRequestSepoliaDeployment ? undefined : deploymentActionDisabledReason}
                      >
                        {walletSignedDeploymentState.deploymentStatus === 'awaiting_wallet_confirmation'
                          ? 'Awaiting Wallet Confirmation...'
                          : walletSignedDeploymentState.deploymentStatus === 'submitted'
                            ? 'Deployment Submitted to Sepolia'
                            : walletSignedDeploymentState.deploymentStatus === 'confirmed'
                              ? 'Deployment Confirmed on Sepolia'
                              : 'Deploy to Sepolia with Wallet'}
                      </button>
                    )}
                  </div>
                  {!primaryWorkflowAction.enabled && primaryWorkflowAction.disabledReason && (
                    <p className="action-disabled-reason">{primaryWorkflowAction.disabledReason}</p>
                  )}
                </section>
              )}

              {smartContractGenerationStatus === 'error' && smartContractGenerationError && (
                <p className="error-text" role="alert">
                  {smartContractGenerationError}
                </p>
              )}
            </section>

            {activeWorkspaceTab.id !== 'requirements' && (
              <section className="lifecycle-snapshot" aria-label="Lifecycle snapshot">
                <h3>Lifecycle snapshot</h3>
                <div>
                  {workspacePresentation.lifecycleSnapshot.map((item) => (
                    <article key={item.label}>
                      <span className={`status-dot ${item.status}`} aria-hidden="true" />
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {(smartContractGenerationStatus === 'ready' || engineeringBrief || hasSubscriptionRedemptionTemplateInput) && (
              <section className="artifact-panel compact-artifact-panel" aria-label="Workspace artifacts">
                {hasSubscriptionRedemptionTemplateInput && (
                  <div className="generated-artifacts" aria-label="Subscription redemption template handoff">
                    <div className="generated-artifacts-heading">
                      <div>
                        <h3>Subscription-Redemption Template Handoff</h3>
                        <p className="muted">
                          Generated from current subscription and redemption lifecycle parameters. This is not live stablecoin execution.
                        </p>
                      </div>
                      <span className={`gate-badge ${subscriptionRedemptionTemplate.status === 'ready' ? 'ready' : 'draft'}`}>
                        {subscriptionRedemptionTemplate.statusLabel}
                      </span>
                    </div>
                    <div className="generated-artifact-grid">
                      <article>
                        <span>Permitted stablecoins</span>
                        <strong>
                          {subscriptionRedemptionTemplate.parameterSummary.permittedStablecoins.length > 0
                            ? subscriptionRedemptionTemplate.parameterSummary.permittedStablecoins.join(', ')
                            : 'Not set'}
                        </strong>
                        <p>Subscription payment assets allowed by the template parameters.</p>
                        <small>Shared lifecycle state</small>
                      </article>
                      <article>
                        <span>Subscription payment</span>
                        <strong>{subscriptionRedemptionTemplate.parameterSummary.paymentPerToken ?? 'Not set'}</strong>
                        <p>{subscriptionRedemptionTemplate.parameterSummary.paymentAddress ?? 'Payment address not set.'}</p>
                        <small>{subscriptionRedemptionTemplate.parameterSummary.subscriptionWindow ?? 'Subscription window not set.'}</small>
                      </article>
                      <article>
                        <span>Redemption payout</span>
                        <strong>{subscriptionRedemptionTemplate.parameterSummary.payoutPerToken ?? 'Not set'}</strong>
                        <p>{subscriptionRedemptionTemplate.parameterSummary.redemptionWalletAddress ?? 'Redemption wallet not set.'}</p>
                        <small>{subscriptionRedemptionTemplate.parameterSummary.payoutStablecoin ?? 'Payout stablecoin not set.'}</small>
                      </article>
                      <article>
                        <span>Redemption delay</span>
                        <strong>{subscriptionRedemptionTemplate.parameterSummary.redemptionDelay ?? 'Not set'}</strong>
                        <p>{subscriptionRedemptionTemplate.parameterSummary.redemptionWindow ?? 'Redemption window not set.'}</p>
                        <small>
                          {subscriptionRedemptionTemplate.parameterSummary.redemptionHandlingRule ??
                            'Token burn/lock handling not set.'}
                        </small>
                      </article>
                    </div>
                    {subscriptionRedemptionTemplate.validationMessages.length > 0 && (
                      <ul className="registry-warnings" aria-label="Template handoff blocking items">
                        {subscriptionRedemptionTemplate.validationMessages.map((message) => (
                          <li key={message}>{message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {smartContractGenerationStatus === 'ready' && (
                  <div className="generated-artifacts" aria-label="Generated smart contract artifacts">
                    <div className="generated-artifacts-heading">
                      <div>
                        <h3>Smart contract preparation review</h3>
                        <p className="muted">Generated from the shared lifecycle state, not from a single tab.</p>
                      </div>
                      <span className="gate-badge ready">Preview</span>
                    </div>
                    <div className="generated-artifact-grid">
                      {generatedArtifactCards.map((card) => (
                        <article key={card.label}>
                          <span>{card.label}</span>
                          <strong>{card.status}</strong>
                          <p>{card.detail}</p>
                          <small>{card.source}</small>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
                {engineeringBrief && (
                  <div data-testid="engineering-brief-artifact">
                    <div className="generated-artifacts-heading">
                      <div>
                        <h3>Engineering Brief Artifact</h3>
                        <p className="muted">Backend artifact generated from the approved Requirement Brief.</p>
                      </div>
                      <span className="gate-badge ready">Generated</span>
                    </div>
                    <div className="artifact-grid">
                      <article>
                        <span>Project context</span>
                        <strong>{engineeringBrief.projectContext.projectName}</strong>
                        <p>
                          {engineeringBrief.projectContext.fundName} ({engineeringBrief.projectContext.tokenSymbol}) for{' '}
                          {engineeringBrief.projectContext.targetInvestors}.
                        </p>
                      </article>
                      <article>
                        <span>Wallet / access model</span>
                        <strong>{engineeringBrief.walletAndAccessModel.whitelistRequired ? 'Whitelist required' : 'Whitelist not required'}</strong>
                        <p>{engineeringBrief.walletAndAccessModel.assumptions[0]}</p>
                      </article>
                      <article>
                        <span>Functional requirements</span>
                        <ul>
                          {engineeringBrief.functionalRequirements.slice(0, 3).map((requirement) => (
                            <li key={requirement}>{requirement}</li>
                          ))}
                        </ul>
                      </article>
                      <article>
                        <span>Deployment boundary</span>
                        <strong>{engineeringBrief.deploymentBoundary.network}</strong>
                        <p>{engineeringBrief.deploymentBoundary.status}</p>
                      </article>
                      <article>
                        <span>QA / evidence plan</span>
                        <ul>
                          {[...engineeringBrief.testingAndQaPlan.slice(0, 2), ...engineeringBrief.evidencePackPlan.slice(0, 2)].map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                      <article>
                        <span>Risks / controls</span>
                        <strong>{engineeringBrief.risksAndControls[0].risk}</strong>
                        <p>{engineeringBrief.risksAndControls[0].control}</p>
                      </article>
                      <article>
                        <span>Acceptance criteria</span>
                        <ul>
                          {engineeringBrief.acceptanceCriteria.slice(0, 3).map((criterion) => (
                            <li key={criterion}>{criterion}</li>
                          ))}
                        </ul>
                      </article>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className={`brief-column hidden-brief ${isBriefPreviewExpanded ? 'expanded' : 'compact'}`} id="requirement-brief" aria-label="Brief Preview">
              <div className="brief-preview compact-preview" data-testid="requirement-brief">
                <div>
                  <span>Business objective</span>
                  <strong>{goal}</strong>
                  <p>{brief ? `${facts.fundName} has a reviewable Requirement Brief.` : 'This will become the core Requirement Brief objective.'}</p>
                </div>
                <div>
                  <span>Token model</span>
                  <strong>{requirementBriefContract?.tokenModel.standardPreference ?? 'Protocol base under Product Setup review'}</strong>
                  <p>{requirementBriefContract ? tokenModelSummary : 'Protocol choice remains reviewable until the Requirement Brief is created.'}</p>
                </div>
                <div>
                  <span>Investor access</span>
                  <strong>
                    {requirementBriefContract?.investorAccess.walletWhitelistRequired ? 'Wallet whitelist required' : 'Approved investors'}
                  </strong>
                  <p>{requirementBriefContract?.investorAccess.assumptions[0] ?? 'Wallet whitelist assumptions will be captured in the brief.'}</p>
                </div>
              </div>
            </section>
          </section>
        </section>

          {isRightRailOpen && (
            <>
              <div
                className={`right-rail-resize-handle ${isRightRailResizing ? 'active' : ''}`}
                role="separator"
                aria-label="Resize right rail"
                aria-orientation="vertical"
                aria-valuemin={rightRailMinWidth}
                aria-valuemax={Math.max(rightRailMinWidth, Math.floor(window.innerWidth * 0.45))}
                aria-valuenow={rightRailWidth}
                tabIndex={0}
                onPointerDown={(event) => {
                  event.preventDefault();
                  setIsRightRailResizing(true);
                }}
                onDoubleClick={() => setRightRailWidth(rightRailDefaultWidth)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowLeft') {
                    event.preventDefault();
                    setRightRailWidth((current) => clampRightRailWidth(current + 24));
                  }
                  if (event.key === 'ArrowRight') {
                    event.preventDefault();
                    setRightRailWidth((current) => clampRightRailWidth(current - 24));
                  }
                  if (event.key === 'Home') {
                    event.preventDefault();
                    setRightRailWidth(rightRailMinWidth);
                  }
                  if (event.key === 'End') {
                    event.preventDefault();
                    setRightRailWidth(rightRailDefaultWidth);
                  }
                }}
              />
              <aside className="right-rail mila-right-rail zilio-console" id="right-rail" aria-label="ZiLi-OS console">
                <section className="zilio-review-queue" aria-label="Needs your review">
                  <div className="zilio-console-heading">
                    <div>
                      <span className="section-kicker">Needs your review</span>
                      <h2>{rightRailReviewCount === 0 ? 'Nothing waiting' : `${rightRailReviewCount} item(s) waiting`}</h2>
                    </div>
                    {hiddenReviewCount > 0 || isRightRailReviewExpanded ? (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => setIsRightRailReviewExpanded((current) => !current)}
                      >
                        {isRightRailReviewExpanded ? 'Show less' : 'Review all'}
                      </button>
                    ) : null}
                  </div>
                  {rightRailReviewCount === 0 ? (
                    <p className="empty-registry">Nothing waiting for review.</p>
                  ) : (
                    <div className="zilio-review-list">
                      {visibleReviewUpdates.map((update) => (
                        <article key={update.id}>
                          <span>Captured fact</span>
                          <strong>{productSetupRecord.fields[update.fieldKey].label}</strong>
                          <p>{formatReviewValue(update.proposedValue)}</p>
                          <small>{Math.round(update.confidence * 100)}% confidence · {update.sourceType}</small>
                          <div className="zilio-review-actions">
                            <button type="button" className="workflow-button primary-action compact" onClick={() => confirmProductSetupSuggestion(update)}>
                              Confirm
                            </button>
                            <button type="button" className="workflow-button compact" onClick={() => dismissProductSetupSuggestion(update)}>
                              Dismiss
                            </button>
                          </div>
                        </article>
                      ))}
                      {visibleReviewHandoffs.map((handoff) => (
                        <article key={handoff.id}>
                          <span>Operational handoff</span>
                          <strong>{productSetupHandoffTargetLabel(handoff.target)}</strong>
                          <p>{handoff.detail}</p>
                          <small>{handoff.status.replaceAll('_', ' ')}</small>
                          <div className="zilio-review-actions">
                            <button type="button" className="workflow-button compact" onClick={() => sendProductSetupHandoff(handoff.id)}>
                              Send draft
                            </button>
                          </div>
                        </article>
                      ))}
                      {hiddenReviewCount > 0 && (
                        <p className="zilio-review-more">{hiddenReviewCount} more item(s) hidden. Use Review all to expand.</p>
                      )}
                    </div>
                  )}
                </section>

                <section className="zilio-chat-console" aria-label="Ask ZiLi-OS">
                  <div className="zilio-console-heading compact">
                    <div>
                      <span className="section-kicker">Ask ZiLi-OS</span>
                      <p className="zilio-active-tab-label">{activeWorkspaceTab.label}</p>
                    </div>
                  </div>
                  <div className="bot-conversation zilio-chat-scroll" aria-label="ZiLi-OS Copilot conversation">
                    <div className="assistant-response" data-testid="engineer-answer">
                      <div className="conversation-history">
                        {activeWorkspaceTab.id === 'requirements' &&
                          engineeringBotConversation.every((turn) => turn.id === 'assistant-initial') && (
                            <article className="conversation-turn assistant-turn product-setup-empty-turn">
                              <span className="turn-label">ZiLi-OS</span>
                              <p>
                                Start with rough notes, a question, or pasted requirements. ZiLi-OS will draft the product profile
                                and route operational details to the right tab.
                              </p>
                            </article>
                          )}
                        {engineeringBotConversation
                          .filter((turn) => activeWorkspaceTab.id !== 'requirements' || turn.id !== 'assistant-initial')
                          .map((turn) =>
                            turn.role === 'user' ? (
                              <article className="conversation-turn user-turn" key={turn.id}>
                                <span className="turn-label">You</span>
                                <p>{turn.content}</p>
                              </article>
                            ) : (
                              <article className="conversation-turn assistant-turn" key={turn.id}>
                                <span className="turn-label">ZiLi-OS</span>
                                <div className="copilot-turn-meta">
                                  <div className="copilot-route-labels" aria-label="ZiLi-OS routing">
                                    {turn.routeLabels.map((label) => (
                                      <span key={label}>{userFacingCopilotRouteLabel(label)}</span>
                                    ))}
                                  </div>
                                </div>
                                {renderEngineerResponse(turn.response)}
                              </article>
                            ),
                          )}
                        {isBotReplyLoading && (
                          <article className="conversation-turn assistant-turn pending-turn" aria-live="polite">
                            <span className="turn-label">ZiLi-OS</span>
                            <p>Routing your message with the current {activeWorkspaceTab.label} context...</p>
                          </article>
                        )}
                        <div ref={copilotConversationEndRef} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <section className="chat-composer ai-composer zilio-console-composer" aria-label="ZiLi-OS Copilot composer">
                    <label className="composer-title" htmlFor="zilios-copilot-composer">
                      {activeWorkspaceTab.id === 'requirements' ? 'Product Setup chat' : 'ZiLi-OS Copilot'}
                    </label>
                    <div className="composer-shell">
                      <textarea
                        id="zilios-copilot-composer"
                        aria-label={activeWorkspaceTab.id === 'requirements' ? 'Product Setup chat' : 'ZiLi-OS Copilot'}
                        placeholder={
                          activeWorkspaceTab.id === 'requirements'
                            ? 'Refine a PRD section, paste requirements, or ask a question...'
                            : `Ask about ${activeWorkspaceTab.label} or paste details for this stage...`
                        }
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            void askBot();
                          }
                        }}
                        rows={3}
                      />
                      <button className="send-button" data-action-id={uiActions.askQuestion} onClick={() => void askBot()} disabled={isBotReplyLoading}>
                        {isBotReplyLoading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                    {botChatError && (
                      <p className="error-text" role="alert">
                        {botChatError}
                      </p>
                    )}
                    {engineeringBriefError && (
                      <p className="error-text" role="alert">
                        {engineeringBriefError}
                      </p>
                    )}
                  </section>
                </section>
              </aside>
            </>
          )}
      </section>

      {shouldShowSmartContractControl && (
      <section className="smart-contract-panel" id="smart-contract-control" data-testid="smart-contract-control">
        <div className="smart-contract-heading">
          <div>
            <p className="eyebrow">Step 8 preview</p>
            <h2>Smart Contract Control Panel</h2>
            <p>
              The Smart Contract Control Panel will dynamically reflect the events, features, and permissions defined in
              your contract as you progress through the earlier stages.
            </p>
          </div>
          <span className={`gate-badge ${smartContractControlPanel.status === 'ready_for_spec' ? 'ready' : 'draft'}`}>
            {smartContractControlPanel.statusLabel}
          </span>
        </div>

        <div className="contract-overview">
          <article>
            <span>Contract status</span>
            <strong>{smartContractControlPanel.overview.contractStatus}</strong>
          </article>
          <article>
            <span>Contract address</span>
            <strong>{smartContractControlPanel.overview.contractAddress}</strong>
          </article>
          <article>
            <span>Network</span>
            <strong>{smartContractControlPanel.overview.network}</strong>
          </article>
          <article>
            <span>Deployed by</span>
            <strong>{smartContractControlPanel.overview.deployedBy}</strong>
          </article>
          <article>
            <span>Contract type</span>
            <strong>{smartContractControlPanel.overview.contractType}</strong>
          </article>
          <article>
            <span>Wallet Connection</span>
            <strong>{smartContractControlPanel.overview.walletConnection}</strong>
          </article>
          <article>
            <span>SCP readiness</span>
            <strong>{smartContractControlPanel.overview.readiness}</strong>
          </article>
        </div>

        <div className="contract-grid">
          <section className="contract-section">
            <h3>Core actions</h3>
            <div className="control-actions">
              {smartContractControlPanel.coreActions.map((action) => {
                const isMintAction = action.label === 'Mint';
                return (
                  <button
                    key={action.label}
                    disabled={isMintAction ? !canRequestAllocationMintOperation : !action.enabled}
                    title={
                      isMintAction
                        ? canRequestAllocationMintOperation
                          ? undefined
                          : allocationMintOperationDisabledReason
                        : action.disabledReason
                    }
                    onClick={isMintAction ? () => void requestAllocationMintOperation() : undefined}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="contract-section wide">
            <h3>Custom Events & Features</h3>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Initiation</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {smartContractControlPanel.customFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <td>{feature.name}</td>
                    <td>{feature.initiation}</td>
                    <td>
                      <button disabled={!feature.enabled} title={feature.disabledReason}>
                        {feature.actionLabel}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="contract-section">
            <h3>Recent Events</h3>
            <ul className="plain-list">
              {smartContractControlPanel.recentEvents.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </section>

          <section className="contract-section">
            <h3>Contract Health</h3>
            <div className="health-list">
              {smartContractControlPanel.healthItems.map((item) => (
                <span key={item.label}>
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
            <p className="microcopy">{smartContractControlPanel.statusDetail}</p>
          </section>

          <section className="contract-section">
            <h3>Deployment Gate Review</h3>
            <div className="health-list">
              <span>Deployment Gate Review: {formatDeploymentGateStatus(deploymentGateReadModel.gateStatus)}</span>
              <span>Pre-deployment readiness: {formatPreDeploymentReadiness(deploymentGateReadModel.preDeploymentReadiness)}</span>
              <span>Deployment execution: {formatWalletSignedDeploymentStatus(walletSignedDeploymentState.deploymentStatus)}</span>
              <span>Wallet-signed Sepolia deployment: {formatWalletSignedDeploymentStatus(walletSignedDeploymentState.deploymentStatus)}</span>
              <span>
                {deploymentEvidenceReadModel.transactionHash
                  ? `Transaction hash: ${deploymentEvidenceReadModel.transactionHash}`
                  : 'No transaction hash'}
              </span>
              <span>
                {deploymentEvidenceReadModel.contractAddress
                  ? `Contract address: ${deploymentEvidenceReadModel.contractAddress}`
                  : 'No contract address'}
              </span>
            </div>
            <p className="microcopy">
              User wallet signs in browser. Backend never holds private keys. Deployment evidence is derived from local-session provider and receipt responses only.
            </p>
          </section>

          <section className="contract-section">
            <h3>Deployment Evidence</h3>
            <div className="health-list">
              <span>{deploymentEvidenceReadModel.statusLabel}</span>
              <span>Evidence strength: {deploymentEvidenceReadModel.evidenceStrengthLabel}</span>
              <span>Evidence persistence: {deploymentEvidenceReadModel.evidencePersistenceLabel}</span>
              <span>Transaction hash source: {deploymentEvidenceReadModel.transactionHashSourceLabel}</span>
              <span>Contract address source: {deploymentEvidenceReadModel.contractAddressSourceLabel}</span>
              <span>Network: {deploymentEvidenceReadModel.networkName}</span>
              <span>
                {deploymentEvidenceReadModel.transactionHash
                  ? `Transaction hash: ${deploymentEvidenceReadModel.transactionHash}`
                  : 'No transaction hash'}
              </span>
              <span>
                {deploymentEvidenceReadModel.contractAddress
                  ? `Contract address: ${deploymentEvidenceReadModel.contractAddress}`
                  : 'No contract address'}
              </span>
              <span>
                {deploymentEvidenceReadModel.status === 'confirmed'
                  ? 'Record NAV Event: Gated in SCP'
                  : 'Smart Contract Operations: Locked until deployment evidence is confirmed'}
              </span>
            </div>
            <p className="microcopy">
              Deployment Evidence: Local session only. Evidence Pack handoff remains a later track.
            </p>
          </section>

          <section className="contract-section">
            <h3>Wallet Signing Readiness</h3>
            <div className="health-list">
              <span>Wallet Signing Intent: {formatWalletSigningIntentStatus(walletSigningIntentReadModel.intentStatus)}</span>
              <span>Wallet connection: {formatWalletConnectionStatus(walletConnectionReadModel.walletConnectionStatus)}</span>
              <span>Wallet chain: {formatWalletChainStatus(walletConnectionReadModel.chainStatus)}</span>
              <span>{walletAddressDisplay ? `Connected wallet: ${walletAddressDisplay}` : 'No wallet address'}</span>
              <span>Wallet execution: Deployment, Record NAV, Wallet Whitelist, and Allocation / Mint use wallet-signed Sepolia requests</span>
              <span>User wallet signing required for each transaction</span>
              <span>Backend never holds private keys</span>
              <span>No signed payload</span>
              <span>{deploymentEvidenceReadModel.transactionHash ? 'Submitted transaction: Submitted to Sepolia' : 'No submitted transaction'}</span>
              <span>{deploymentEvidenceReadModel.contractAddress ? 'Confirmed transaction: Confirmed on Sepolia' : 'No confirmed transaction'}</span>
              <span>
                {deploymentEvidenceReadModel.contractAddress
                  ? `Contract address: ${deploymentEvidenceReadModel.contractAddress}`
                  : 'No contract address'}
              </span>
              <span>
                {deploymentEvidenceReadModel.transactionHash
                  ? `Transaction hash: ${deploymentEvidenceReadModel.transactionHash}`
                  : 'No transaction hash'}
              </span>
            </div>
            <p className="microcopy">
              Wallet connection checks whether a user wallet is available and on Sepolia. Deployment uses an explicit
              wallet-signed Sepolia request only. Signed payloads are not stored by MILA26.
            </p>
          </section>

          <section className="contract-section">
            <h3>Smart Contract Operations</h3>
            <div className="health-list">
              <span>Record NAV operation: {formatRecordNavOperationStatus(recordNavOperationState.operationStatus)}</span>
              <span>Operation evidence: {recordNavOperationReadModel.operationEvidencePersistenceLabel}</span>
              <span>Operation transaction hash source: {recordNavOperationReadModel.operationTransactionHashSourceLabel}</span>
              <span>Operation receipt source: {recordNavOperationReadModel.operationReceiptSourceLabel}</span>
              <span>ValuationUpdated event evidence: {recordNavOperationReadModel.eventEvidenceSourceLabel}</span>
              <span>Valuation payload: {defaultRecordNavOperationPayload.valuation.toString()}</span>
              <span>Valuation reference: {defaultRecordNavOperationPayload.valuationReference}</span>
              {recordNavOperationReadModel.operationTransactionHash ? (
                <span>Operation transaction hash: {recordNavOperationReadModel.operationTransactionHash}</span>
              ) : (
                <span>No operation transaction hash</span>
              )}
              {recordNavOperationReadModel.decodedEvent ? (
                <span>ValuationUpdated event: Decoded from receipt</span>
              ) : (
                <span>ValuationUpdated event: Not decoded</span>
              )}
              <span>Wallet Whitelist operation: {formatWalletWhitelistOperationStatus(walletWhitelistOperationReadModel.operationStatus)}</span>
              <span>Wallet whitelist evidence: {walletWhitelistOperationReadModel.operationEvidencePersistenceLabel}</span>
              <span>Whitelist transaction hash source: {walletWhitelistOperationReadModel.operationTransactionHashSourceLabel}</span>
              <span>Whitelist receipt source: {walletWhitelistOperationReadModel.operationReceiptSourceLabel}</span>
              <span>WalletWhitelisted event: {walletWhitelistOperationReadModel.eventEvidenceStatusLabel}</span>
              {walletWhitelistOperationReadModel.operationTransactionHash ? (
                <span>Whitelist transaction hash: {walletWhitelistOperationReadModel.operationTransactionHash}</span>
              ) : (
                <span>No whitelist transaction hash</span>
              )}
              <span>Target wallet: {normalizedWhitelistTargetWallet ?? 'Target wallet address required'}</span>
              <span>allowed: true</span>
              <span>Allocation / Mint operation: {formatWalletAllocationMintOperationStatus(walletAllocationMintOperationReadModel.operationStatus)}</span>
              <span>Allocation / Mint evidence: {walletAllocationMintOperationReadModel.operationEvidencePersistenceLabel}</span>
              <span>Allocation / Mint transaction hash source: {walletAllocationMintOperationReadModel.operationTransactionHashSourceLabel}</span>
              <span>Allocation / Mint receipt source: {walletAllocationMintOperationReadModel.operationReceiptSourceLabel}</span>
              <span>AllocationMinted event: {walletAllocationMintOperationReadModel.eventEvidenceStatusLabel}</span>
              <span>Allocation target wallet: {allocationMint.targetWalletAddress ?? 'Target wallet address required'}</span>
              <span>Allocation token amount: {allocationMint.tokenAmount ?? 'Token amount required'}</span>
              {walletAllocationMintOperationReadModel.operationTransactionHash ? (
                <span>Allocation / Mint transaction hash: {walletAllocationMintOperationReadModel.operationTransactionHash}</span>
              ) : (
                <span>No Allocation / Mint transaction hash</span>
              )}
              <span>Contract authorization is enforced on-chain</span>
              <span>Allocation/Mint: Released behind explicit wallet, deployment, whitelist, ABI, parameter, and evidence gates</span>
              <span>Other Smart Contract Operations: Require explicit adapters and evidence paths before release</span>
            </div>
            {deploymentEvidenceReadModel.status === 'confirmed' && (
              <div className="operation-controls">
                <button
                  className="workflow-button"
                  data-action-id={uiActions.recordNavEvent}
                  disabled={!canRequestRecordNavOperation}
                  onClick={() => void requestRecordNavOperation()}
                  title={canRequestRecordNavOperation ? undefined : recordNavOperationDisabledReason}
                >
                  {recordNavOperationState.operationStatus === 'awaiting_wallet_confirmation'
                    ? 'Awaiting Wallet Confirmation...'
                    : recordNavOperationState.operationStatus === 'submitted'
                      ? 'Record NAV Submitted to Sepolia'
                      : recordNavOperationState.operationStatus === 'confirmed'
                        ? 'Record NAV Confirmed on Sepolia'
                        : 'Record NAV Event'}
                </button>
                <label className="field-label" htmlFor="wallet-whitelist-target">
                  Whitelist target wallet
                  <input
                    id="wallet-whitelist-target"
                    value={walletWhitelistTargetWallet}
                    onChange={(event) => updateWalletWhitelistTargetWallet(event.target.value)}
                    placeholder="0x..."
                    autoComplete="off"
                    disabled={isWalletWhitelistOperationInFlight(walletWhitelistOperationState)}
                  />
                </label>
                <button
                  className="workflow-button"
                  data-action-id={uiActions.whitelistWallet}
                  disabled={!canRequestWalletWhitelistOperation}
                  onClick={() => void requestWalletWhitelistOperation()}
                  title={canRequestWalletWhitelistOperation ? undefined : walletWhitelistOperationDisabledReason}
                >
                  {walletWhitelistOperationState.operationStatus === 'awaiting_wallet_confirmation'
                    ? 'Wallet whitelist status: Awaiting wallet confirmation'
                    : walletWhitelistOperationState.operationStatus === 'submitted'
                      ? 'Wallet whitelist submitted to Sepolia'
                      : selectedWhitelistTargetAlreadyConfirmed
                        ? 'Wallet whitelist confirmed on Sepolia'
                        : 'Whitelist Wallet'}
                </button>
                <button
                  className="workflow-button"
                  data-action-id={uiActions.allocationMint}
                  disabled={!canRequestAllocationMintOperation}
                  onClick={() => void requestAllocationMintOperation()}
                  title={canRequestAllocationMintOperation ? undefined : allocationMintOperationDisabledReason}
                >
                  {walletAllocationMintOperationState.operationStatus === 'awaiting_wallet_confirmation'
                    ? 'Allocation / Mint awaiting wallet confirmation'
                    : walletAllocationMintOperationState.operationStatus === 'submitted'
                      ? 'Allocation / Mint submitted to Sepolia'
                      : selectedAllocationMintAlreadyConfirmed
                        ? 'Allocation / Mint confirmed on Sepolia'
                        : 'Submit Allocation / Mint'}
                </button>
              </div>
            )}
            <p className="microcopy">
              SCP exposes wallet-signed Record NAV Event, Whitelist Wallet, and Allocation / Mint after confirmed deployment
              evidence and operation-specific prerequisites. Burn, pause, resume, transfer, role administration, and
              distribution controls need explicit adapters and evidence paths before release.
            </p>
          </section>

          <section className="contract-section">
            <h3>Safety Boundaries</h3>
            <div className="health-list">
              {smartContractControlPanel.boundaryItems.map((item) => (
                <span key={item.label}>
                  {item.label}: {item.value}
                </span>
              ))}
            </div>
            <p className="microcopy">
              Deployment identifiers appear only after provider responses. Local compile/test status is a known
              developer-local foundation result only. Evidence persistence: Local session only.
            </p>
          </section>
        </div>
      </section>
      )}
    </main>
  );
}
