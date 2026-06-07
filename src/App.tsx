import { useEffect, useMemo, useRef, useState } from 'react';
import { askBlockchainEngineer } from './api/blockchainEngineerChat';
import { generateEngineeringBrief } from './api/engineeringBrief';
import { generateSmartContractArtifact } from './api/smartContractArtifact';
import { generateSmartContractArtifactSpec } from './api/smartContractArtifactSpec';
import { loadLatestWorkspaceSnapshot, saveWorkspaceSnapshot } from './api/workspacePersistence';
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
import { toRequirementBriefContract } from './domain/requirementBrief';
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
  type ProductCapabilityStatus,
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
import type { BlockchainEngineerChatResponse } from '../server/contracts/chat';
import type { EngineeringBrief } from '../server/contracts/engineeringBrief';
import type {
  SmartContractArtifactCheckResult,
  SmartContractArtifactPackage,
  SmartContractEvidenceLite,
} from '../server/contracts/smartContractArtifact';
import type { SmartContractArtifactSpec } from '../server/contracts/smartContractArtifactSpec';
import type { SmartContractCompileTestResult } from '../server/contracts/smartContractCompileCheck';
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

type EngineerAnswerSource = 'local' | 'backend' | 'generated_artifacts' | 'wallet';

type EngineeringBotConversationTurn =
  | {
      id: string;
      role: 'user';
      content: string;
    }
  | {
      id: string;
      role: 'assistant';
      response: BlockchainEngineerChatResponse;
      source: EngineerAnswerSource;
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
      'Record NAV operation status updated. SCP owns the active operation control; evidence is derived from local-session provider and receipt responses only.',
    riskNotes: [
      `Record NAV operation: ${statusLabel}.`,
      operation.operationTransactionHash ? `Operation transaction hash: ${operation.operationTransactionHash}.` : 'No operation transaction hash.',
      operation.decodedEvent ? 'ValuationUpdated event decoded from receipt.' : 'ValuationUpdated event not decoded.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
      'Other Smart Contract Operations require their own explicit adapters and evidence paths before release.',
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
      'Wallet Whitelist operation status updated. SCP owns the active operation control; evidence is derived from local-session provider and receipt responses only.',
    riskNotes: [
      `Wallet Whitelist operation: ${statusLabel}.`,
      operation.targetWalletAddress ? `Target wallet: ${operation.targetWalletAddress}.` : 'Target wallet address is required.',
      operation.operationTransactionHash ? `Whitelist transaction hash: ${operation.operationTransactionHash}.` : 'No whitelist transaction hash.',
      operation.decodedEvent ? 'WalletWhitelisted event decoded from receipt.' : 'WalletWhitelisted event not decoded.',
      'Contract authorization is enforced on-chain.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
      'Allocation / Mint is available when the selected whitelisted wallet and token amount pass validation.',
      'Other Smart Contract Operations require their own explicit adapters and evidence paths before release.',
    ],
    nextRecommendedAction:
      operation.operationStatus === 'confirmed'
        ? 'Next recommended operation is Allocation/Mint after the subscription and investor registry setup is complete.'
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

function productCapabilityStatusLabel(status: ProductCapabilityStatus) {
  if (status === 'available') return 'Available';
  if (status === 'needs_parameters') return 'Needs parameters';
  if (status === 'locked_for_later') return 'Needs prerequisites';
  if (status === 'local_session_only') return 'Local session only';
  if (status === 'active') return 'Active';
  return 'Draft';
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
    },
  ]);
  const [engineerAnswerSource, setEngineerAnswerSource] = useState<EngineerAnswerSource>('local');
  const [botChatError, setBotChatError] = useState<string | undefined>();
  const [isBotReplyLoading, setIsBotReplyLoading] = useState(false);
  const [isLeftRailOpen, setIsLeftRailOpen] = useState(true);
  const [isRightRailOpen, setIsRightRailOpen] = useState(true);
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
  const shouldShowSmartContractControl = ['overview', 'smart_contract', 'evidence'].includes(activeWorkspaceTab.id);
  const subscriptionRedemptionTemplate = lifecycleReadModel.subscriptionRedemptionTemplate;
  const hasSubscriptionRedemptionTemplateInput = subscriptionRedemptionTemplate.status !== 'needs_parameters';
  const selectedProject = demoProjectFolders.find((project) => project.id === selectedProjectId);
  const activeProjectTitle = selectedProject?.title ?? 'All Projects';
  const tokenModelSummary =
    requirementBriefContract?.tokenModel.assumption ?? 'Token model will be confirmed in the Requirement Brief.';
  const primaryWorkflowAction = cockpitActionViewModel.primaryEngineeringBotAction;
  const secondaryWorkflowActions = cockpitActionViewModel.secondaryEngineeringBotActions;
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
    !isDeploymentAttemptInFlight(walletSignedDeploymentState);
  const deploymentActionDisabledReason = isDeploymentAttemptInFlight(walletSignedDeploymentState)
    ? 'A wallet deployment request is already awaiting confirmation or receipt.'
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
    if (!selectedWhitelistRegistryEntry) return 'Register this wallet in Investor Registry before whitelisting.';
    if (selectedWhitelistTargetAlreadyWhitelisted) return 'Selected wallet is already whitelisted in this local session.';
    if (!selectedWhitelistRegistryEntry.canUseForWhitelist) return 'Resolve this Investor Registry wallet before SCP whitelist.';
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
                'SCP exposes Record NAV Event, Whitelist Wallet, and Allocation / Mint when their wallet, deployment, ABI, parameter, and evidence gates are satisfied. Other operations need explicit adapters before release.',
              source: 'SCP operations boundary',
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

  function publishEngineerResponse(response: BlockchainEngineerChatResponse, source: EngineerAnswerSource) {
    setEngineerAnswerSource(source);
    setEngineeringBotConversation((turns) => [
      ...turns,
      {
        id: nextEngineeringBotConversationTurnId('assistant'),
        role: 'assistant',
        response,
        source,
      },
    ]);
  }

  function renderEngineerResponse(response: BlockchainEngineerChatResponse) {
    const viewModel = toBlockchainEngineerResponseViewModel(response);
    const visibleSections = viewModel.sections.filter((section) => section.kind !== 'risk_notes');

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
      setEngineerAnswerSource('local');
      return;
    }

    setIsBotReplyLoading(true);
    setBotChatError(undefined);
    setEngineeringBotConversation((turns) => [
      ...turns,
      {
        id: nextEngineeringBotConversationTurnId('user'),
        role: 'user',
        content: submittedQuestion,
      },
    ]);

    const result = await askBlockchainEngineer({
      userMessage: submittedQuestion,
      projectContext: brief
        ? {
            fundName: brief.fundFacts.fundName,
            tokenSymbol: brief.fundFacts.tokenSymbol,
            jurisdiction: brief.fundFacts.jurisdiction,
            selectedModules: brief.modules.filter((module) => module.enabled).map((module) => module.id),
          }
        : {
            fundName: facts.fundName,
            tokenSymbol: facts.tokenSymbol,
            jurisdiction: facts.jurisdiction,
          },
    });

    setIsBotReplyLoading(false);

    if (result.ok) {
      publishEngineerResponse(result.data, 'backend');
      setQuestion('');
      return;
    }

    setBotChatError(result.message);
    publishEngineerResponse(createLocalEngineerResponse(answerAsBlockchainEngineer(submittedQuestion, brief)), 'local');
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
  }

  async function saveWorkspaceToBackend() {
    if (selectedProjectId === 'workspace') {
      setWorkspacePersistenceStatus({
        status: 'error',
        message: 'Choose a project before saving a workspace snapshot.',
      });
      return;
    }

    setWorkspacePersistenceStatus({ status: 'saving', message: 'Saving workspace snapshot...' });
    const result = await saveWorkspaceSnapshot({
      projectId: selectedProjectId,
      projectName: activeProjectTitle,
      lifecycleState,
      source: 'user_action',
    });

    if (result.ok) {
      setWorkspacePersistenceStatus({
        status: 'saved',
        message: `Snapshot v${result.data.snapshot.version} saved. Evidence remains local-session only.`,
      });
      return;
    }

    setWorkspacePersistenceStatus({ status: 'error', message: result.message });
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
      const nextLifecycleState = result.data.snapshot.lifecycleState;
      syncInvestorRegistrySequenceFromState(nextLifecycleState);
      setLifecycleState(nextLifecycleState);
      setPermittedStablecoinsInput(nextLifecycleState.subscriptionParameters.permittedStablecoins.join(', '));
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

  function addInvestorRegistryWallet() {
    const walletAddress = investorRegistryDraftWallet.trim();

    if (!lifecycleReadModel.investorRegistry.canAddEntry) {
      setInvestorRegistryError('Investor Registry already has the maximum 50 wallet addresses.');
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
    setTestInvestorWalletPack(pack);
    setTestWalletExportContent(undefined);
    setInvestorRegistryError(undefined);
    setTestWalletLabMessage(
      pack.warnings.length > 0
        ? `${entries.length} generated test investor wallet(s) added. ${pack.warnings.join(' ')}`
        : `${entries.length} generated test investor wallet(s) added to Investor Registry.`,
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
  }

  function updateRedemptionParameters(nextParameters: Partial<RedemptionParameters>) {
    setLifecycleState((current) => ({
      ...current,
      redemptionParameters: {
        ...current.redemptionParameters,
        ...nextParameters,
      },
    }));
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

  return (
    <main className="cockpit-page">
      <section
        className={`cockpit-shell product-workspace-shell ${isLeftRailOpen ? '' : 'left-collapsed'} ${isRightRailOpen ? '' : 'right-collapsed'}`}
        aria-label="MILA26 tokenisation workspace"
      >
        <button
          className="rail-toggle left-toggle"
          data-action-id={uiActions.toggleLeftRail}
          onClick={() => setIsLeftRailOpen((current) => !current)}
          aria-expanded={isLeftRailOpen}
          aria-controls="left-rail"
        >
          {isLeftRailOpen ? 'Hide left rail' : 'Show left rail'}
        </button>
        <button
          className="rail-toggle right-toggle"
          data-action-id={uiActions.toggleRightRail}
          onClick={() => setIsRightRailOpen((current) => !current)}
          aria-expanded={isRightRailOpen}
          aria-controls="right-rail"
        >
          {isRightRailOpen ? 'Hide right rail' : 'Show right rail'}
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
              <button type="button" className="project-nav-button">
                <span>Templates</span>
              </button>
              <button type="button" className="project-nav-button">
                <span>Knowledge Base</span>
              </button>
              <button type="button" className="project-nav-button">
                <span>Activity Log</span>
              </button>
            </nav>

            <nav className="project-nav rail-section" aria-label="Engineering navigation">
              <p className="rail-label">Engineering</p>
              <button type="button" className="project-nav-button" aria-current="page">
                <span>Engineering Bot</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedWorkspaceTab('smart_contract')}>
                <span>Smart Contract Lab</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedWorkspaceTab('evidence')}>
                <span>Deployments</span>
              </button>
              <button type="button" className="project-nav-button" onClick={() => setSelectedWorkspaceTab('evidence')}>
                <span>Evidence Vault</span>
              </button>
            </nav>

            <nav className="project-nav rail-section" aria-label="Settings navigation">
              <p className="rail-label">Settings</p>
              <button type="button" className="project-nav-button">
                <span>Wallet & Network</span>
              </button>
              <button type="button" className="project-nav-button">
                <span>Team</span>
              </button>
              <button type="button" className="project-nav-button">
                <span>Preferences</span>
              </button>
              <button type="button" className="project-nav-button">
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
                <button type="button">Expert</button>
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

            {activeWorkspaceTab.id === 'investor_registry' && (
              <section className="registry-panel" aria-label="Investor Registry workspace">
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

                <div className="registry-summary" aria-label="Investor Registry summary">
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
                  <ul className="registry-warnings" aria-label="Investor Registry blocking items">
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
                            Use for SCP whitelist
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
                      Configure the permitted stablecoins, subscription window, payment destination, and payment-per-token terms
                      for the subscription-redemption smart-contract template. This does not move stablecoins.
                    </p>
                  </div>
                  <span className={`gate-badge ${lifecycleReadModel.subscription.status === 'ready' ? 'ready' : 'draft'}`}>
                    {lifecycleReadModel.subscription.statusLabel}
                  </span>
                </div>

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
                    Payment wallet / contract address
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
                      Configure the redemption window, redemption wallet, payout stablecoin, payout-per-token amount, and
                      liquidation delay before stablecoin payout. This is parameter capture only.
                    </p>
                  </div>
                  <span className={`gate-badge ${lifecycleReadModel.redemption.status === 'ready' ? 'ready' : 'draft'}`}>
                    {lifecycleReadModel.redemption.statusLabel}
                  </span>
                </div>

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
              <section className="parameter-panel" aria-label="Allocation Mint workspace">
                <div className="registry-panel-heading">
                  <div>
                    <h3>Allocation / Mint readiness</h3>
                    <p>
                      Prepare single-investor allocation parameters from Investor Registry and Subscription state. SCP can submit
                      a wallet-signed Sepolia mint after deployment evidence and investor whitelist are confirmed.
                    </p>
                  </div>
                  <span className={`gate-badge ${allocationMint.status === 'ready' ? 'ready' : 'draft'}`}>
                    {allocationMint.statusLabel}
                  </span>
                </div>

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
                    <span>Investor Registry</span>
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
              </section>
            )}

            <section className="bot-workspace ai-workspace" aria-label="Engineering Bot workspace">
              <div className="bot-title-row">
                <div className="bot-identity">
                  <div className="bot-avatar" aria-hidden="true">AI</div>
                  <div>
                    <h3>Engineering Bot</h3>
                    <p>Cross-stage intelligence across requirements, investor registry, subscription, redemption, asset servicing, and evidence.</p>
                  </div>
                </div>
                <button type="button" className="secondary-button" data-action-id={uiActions.askQuestion} onClick={() => void askBot()}>
                  Ask a question
                </button>
              </div>

              <div className="bot-conversation" aria-label="Engineering Bot conversation">
                <div className="assistant-response" data-testid="engineer-answer">
                  <div className="conversation-history">
                    {engineeringBotConversation.map((turn) =>
                      turn.role === 'user' ? (
                        <article className="conversation-turn user-turn" key={turn.id}>
                          <span className="turn-label">You</span>
                          <p>{turn.content}</p>
                        </article>
                      ) : (
                        <article className="conversation-turn assistant-turn" key={turn.id}>
                          <span className="turn-label">Engineering Bot</span>
                          {renderEngineerResponse(turn.response)}
                        </article>
                      ),
                    )}
                    {isBotReplyLoading && (
                      <article className="conversation-turn assistant-turn pending-turn" aria-live="polite">
                        <span className="turn-label">Engineering Bot</span>
                        <p>Waiting for Engineering Bot response...</p>
                      </article>
                    )}
                  </div>
                </div>
              </div>

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

              <label className="chat-composer ai-composer">
                <span className="composer-title">Engineering Bot MILA</span>
                <div className="composer-shell">
                  <textarea
                    aria-label="Engineering Bot MILA"
                    placeholder="Ask MILA26 what to design, configure, or review next..."
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void askBot();
                      }
                    }}
                    rows={2}
                  />
                  <button className="send-button" data-action-id={uiActions.askQuestion} onClick={() => void askBot()} disabled={isBotReplyLoading}>
                    {isBotReplyLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <div className="composer-actions" aria-label="Engineering Bot actions">
                  {secondaryWorkflowActions.map((action) => (
                    <button
                      type="button"
                      className="workflow-button"
                      data-action-id={action.id}
                      disabled={!action.enabled}
                      key={action.id}
                      onClick={() => runCockpitAction(action.id)}
                      title={action.disabledReason}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </label>

              {smartContractGenerationStatus === 'error' && smartContractGenerationError && (
                <p className="error-text" role="alert">
                  {smartContractGenerationError}
                </p>
              )}
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
              <p className="chat-status">
                {isBotReplyLoading
                  ? 'Calling backend route.'
                  : engineerAnswerSource === 'backend'
                    ? 'Backend response.'
                    : engineerAnswerSource === 'generated_artifacts'
                      ? 'Backend artifacts generated.'
                      : engineerAnswerSource === 'wallet'
                        ? 'Wallet status updated.'
                        : 'Local preview shown until a backend response is available.'}
              </p>
            </section>

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
                        <small>Delay before stablecoin payout after token receipt.</small>
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
                  <strong>{requirementBriefContract?.tokenModel.standardPreference ?? 'ERC-20 / ERC-721 under review'}</strong>
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
            <aside className="right-rail mila-right-rail" id="right-rail" aria-label="Project status">
              <section className="status-panel">
                <h2>Workspace Status</h2>
                <ul className="artifact-list">
                  {workspacePresentation.workspaceStatus.map((item) => (
                    <li key={item.label}>
                      <span className={item.status}>{productCapabilityStatusLabel(item.status)}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="status-panel">
                <h2>Capability Status</h2>
                <ul className="artifact-list">
                  {workspacePresentation.capabilityStatus.map((item) => (
                    <li key={item.label}>
                      <span className={item.status}>{productCapabilityStatusLabel(item.status)}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="status-panel">
                <div className="panel-title-row">
                  <h2>Product Vault</h2>
                  <button type="button" className="link-button" onClick={() => setSelectedWorkspaceTab('evidence')}>
                    View all
                  </button>
                </div>
                <ul className="artifact-list">
                  {workspacePresentation.productVault.map((item) => (
                    <li key={item.label}>
                      <span>{item.status}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="status-panel">
                <div className="panel-title-row">
                  <h2>Recent Activity</h2>
                  <button type="button" className="link-button" onClick={() => setSelectedWorkspaceTab('evidence')}>
                    View all
                  </button>
                </div>
                <ul className="artifact-list">
                  <li>
                    <span>{recordNavOperationReadModel.operationStatus === 'confirmed' ? 'Done' : 'Pending'}</span>
                    Record NAV Event
                    <small>{recordNavOperationReadModel.statusLabel}</small>
                  </li>
                  <li>
                    <span>{walletWhitelistOperationReadModel.operationStatus === 'confirmed' ? 'Done' : 'Pending'}</span>
                    Wallet whitelisted
                    <small>{walletWhitelistOperationReadModel.statusLabel}</small>
                  </li>
                  <li>
                    <span>{deploymentEvidenceReadModel.status === 'confirmed' ? 'Done' : 'Pending'}</span>
                    Sepolia deployment
                    <small>{deploymentEvidenceReadModel.statusLabel}</small>
                  </li>
                </ul>
              </section>

              <section className="status-panel">
                <p className="muted">All executable actions are wallet-signed. Backend never holds private keys. Sepolia testnet environment.</p>
              </section>
            </aside>
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
