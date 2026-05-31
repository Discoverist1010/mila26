import { useEffect, useMemo, useRef, useState } from 'react';
import { askBlockchainEngineer } from './api/blockchainEngineerChat';
import { generateEngineeringBrief } from './api/engineeringBrief';
import { generateSmartContractArtifact } from './api/smartContractArtifact';
import { generateSmartContractArtifactSpec } from './api/smartContractArtifactSpec';
import {
  answerAsBlockchainEngineer,
  createRequirementBrief,
} from './agents/agentRuntime';
import { toCockpitActionViewModel } from './domain/cockpitActionRegistry';
import { toBlockchainEngineerResponseViewModel } from './domain/blockchainEngineerResponseViewModel';
import { toDeploymentGateReadModel } from './domain/deploymentGateReadModel';
import { moduleCatalog } from './domain/moduleCatalog';
import { createDemoProjectClosureLedger } from './domain/projectClosureLedger';
import { toProjectClosureReadModel } from './domain/projectClosureReadModel';
import { toProjectLifecycleReadModel, type Mila26UiActionId } from './domain/projectLifecycleReadModel';
import { toRequirementBriefContract } from './domain/requirementBrief';
import {
  createKnownLocalCompileTestResult,
  toSmartContractCompileTestPresentation,
} from './domain/smartContractCompileTestPresentation';
import { toSmartContractControlPanelViewModel } from './domain/smartContractControlPanelViewModel';
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

const initialBotQuestion = 'What should we be careful about before generating code?';

const cockpitStages = [
  { step: '1', label: 'Setup / Explore', state: 'Active' },
  { step: '2', label: 'Requirement Brief', state: 'Draft' },
  { step: '3', label: 'Engineering Brief', state: 'Next' },
  { step: '4', label: 'Evidence Pack', state: 'Later' },
  { step: '5', label: 'Deployment Gate', state: 'Locked' },
  { step: '8', label: 'Smart Contract Control', state: 'Preview' },
];

const currentStageActivities = [
  'Goal intake',
  'Project setup',
  'Assumptions',
  'Constraints',
  'Notes & decisions',
  'Artifacts',
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
} as const;

type GeneratedArtifactCard = {
  label: string;
  status: string;
  detail: string;
  source: string;
};

function createLocalEngineerResponse(content: string): BlockchainEngineerChatResponse {
  return {
    messageId: 'local-preview',
    agentId: 'blockchain-engineer',
    content,
    createdAt: new Date(0).toISOString(),
  };
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
    nextRecommendedAction: 'Next milestone remains unsigned deployment intent review after wallet connection and Sepolia status are stable.',
    createdAt: new Date(0).toISOString(),
  };
}

function createDeploymentResponse(deployment: WalletSignedDeploymentState): BlockchainEngineerChatResponse {
  const statusLabel = formatWalletSignedDeploymentStatus(deployment.deploymentStatus);

  return {
    messageId: 'local-wallet-signed-deployment',
    agentId: 'blockchain-engineer',
    content:
      'Wallet-signed Sepolia deployment status updated. This is local-session deployment state only; Track 14C owns evidence linkage.',
    riskNotes: [
      `Deployment status: ${statusLabel}.`,
      deployment.transactionHash ? `Transaction hash: ${deployment.transactionHash}.` : 'No transaction hash.',
      deployment.contractAddress ? `Contract address: ${deployment.contractAddress}.` : 'No contract address.',
      'Backend never holds private keys.',
      'Mainnet remains disabled.',
      'Smart Contract Operations remain locked.',
    ],
    nextRecommendedAction: 'Next milestone is Track 14C deployment status/evidence linkage before any SCP operation is unlocked.',
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

export function App() {
  const [facts] = useState<FundFacts>(starterFacts);
  const [goal] = useState('We want to launch a tokenized income product for approved investors.');
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
  const [smartContractGenerationStatus, setSmartContractGenerationStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [smartContractGenerationError, setSmartContractGenerationError] = useState<string | undefined>();
  const [walletConnectionInput, setWalletConnectionInput] = useState<WalletConnectionReadModelInput>(
    initialWalletConnectionInput,
  );
  const [engineerResponse, setEngineerResponse] = useState(() =>
    createLocalEngineerResponse(answerAsBlockchainEngineer(initialBotQuestion)),
  );
  const [engineerAnswerSource, setEngineerAnswerSource] = useState<'local' | 'backend' | 'generated_artifacts' | 'wallet'>(
    'local',
  );
  const [botChatError, setBotChatError] = useState<string | undefined>();
  const [isBotReplyLoading, setIsBotReplyLoading] = useState(false);
  const [isLeftRailOpen, setIsLeftRailOpen] = useState(true);
  const [isRightRailOpen, setIsRightRailOpen] = useState(true);
  const [isBriefPreviewExpanded, setIsBriefPreviewExpanded] = useState(false);
  const deploymentAttemptSequenceRef = useRef(0);
  const deploymentAttemptIdRef = useRef('');

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
    },
    [],
  );

  const fallbackEngineerAnswer = useMemo(() => answerAsBlockchainEngineer(question || initialBotQuestion, brief), [question, brief]);
  const engineerResponseViewModel = useMemo(
    () => toBlockchainEngineerResponseViewModel(engineerResponse),
    [engineerResponse],
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
    ],
  );
  const enabledModuleCount = brief?.modules.filter((module) => module.enabled).length ?? moduleCatalog.length;
  const currentGate = engineeringBrief
    ? 'Engineering Brief generated'
    : brief
      ? 'Engineering Brief generation'
      : 'Requirement brief approval';
  const approvalGateStatus = engineeringBrief ? 'Engineering brief ready' : brief ? 'Brief ready' : 'Draft brief';
  const selectedModules = brief?.modules.filter((module) => module.enabled) ?? [];
  const tokenModelSummary =
    requirementBriefContract?.tokenModel.assumption ?? 'Token model will be confirmed in the Requirement Brief.';
  const activeStepArtifacts = [
    brief ? 'Requirement Brief draft' : 'Requirement Brief draft pending',
    engineeringBrief ? 'Engineering Brief artifact' : 'Engineering Brief pending',
    `Closure readiness: ${projectClosureReadModel.readinessLabel}`,
    'Decision notes local only',
    smartContractArtifactSpec ? 'Smart Contract Artifact Spec generated' : 'Smart Contract Artifact Spec pending',
    smartContractArtifactPackage ? 'Contract Artifact Preview generated' : 'Contract Artifact Preview pending',
    smartContractCompileTestResult ? 'Local compile/test foundation passed' : 'Local compile/test foundation pending',
    `Deployment Gate Review: ${formatDeploymentGateStatus(deploymentGateReadModel.gateStatus)}`,
  ];
  const primaryWorkflowAction = cockpitActionViewModel.primaryEngineeringBotAction;
  const secondaryWorkflowActions = cockpitActionViewModel.secondaryEngineeringBotActions;
  const isWalletConnectionComplete =
    walletConnectionReadModel.walletConnectionStatus === 'connected' && walletConnectionReadModel.chainStatus === 'sepolia';
  const canRequestSepoliaDeployment =
    smartContractGenerationStatus === 'ready' &&
    unsignedDeploymentIntentReadModel.intentStatus === 'review_ready' &&
    !isDeploymentAttemptInFlight(walletSignedDeploymentState);
  const deploymentActionDisabledReason = isDeploymentAttemptInFlight(walletSignedDeploymentState)
    ? 'A wallet deployment request is already awaiting confirmation or receipt.'
    : unsignedDeploymentIntentReadModel.blockedReasons[0] ?? 'Complete wallet connection and unsigned deployment intent review first.';
  const generatedArtifactCards = useMemo<GeneratedArtifactCard[]>(
    () =>
      smartContractGenerationStatus === 'ready'
        ? [
            {
              label: 'Smart Contract Spec',
              status: 'Generated',
              detail: `${smartContractArtifactSpec?.tokenStandardProfile?.mila26RestrictionProfile ?? 'restricted_erc20'} / ERC-20-compatible profile.`,
              source: 'Track 9A route',
            },
            {
              label: 'Artifact Preview',
              status: 'Preview only',
              detail: `${smartContractArtifactPackage?.sourceModel?.sourceFiles.length ?? 0} deterministic preview file(s). Preview artifact not deployed or audited.`,
              source: 'Track 9B route',
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
              source: 'Track 11A read model',
            },
            {
              label: 'Wallet Signing Intent',
              status: formatWalletSigningIntentStatus(walletSigningIntentReadModel.intentStatus),
              detail:
                'Wallet execution: Not implemented. User wallet signing required later. Backend never holds private keys.',
              source: 'Track 12A read model',
            },
            {
              label: 'Wallet Connection',
              status: formatWalletConnectionStatus(walletConnectionReadModel.walletConnectionStatus),
              detail: `Wallet chain: ${formatWalletChainStatus(walletConnectionReadModel.chainStatus)}. ${walletAddressDisplay ? `Connected wallet: ${walletAddressDisplay}.` : 'No wallet address.'} Connection only; no signing or deployment.`,
              source: 'Track 13B EIP-1193 adapter',
            },
            {
              label: 'Sepolia Deployment',
              status: formatWalletSignedDeploymentStatus(walletSignedDeploymentState.deploymentStatus),
              detail: `${walletSignedDeploymentState.transactionHash ? `Transaction hash: ${walletSignedDeploymentState.transactionHash}.` : 'No transaction hash.'} ${walletSignedDeploymentState.contractAddress ? `Contract address: ${walletSignedDeploymentState.contractAddress}.` : 'No contract address.'} Deployment state is local-session-only until Track 14C evidence linkage.`,
              source: 'Track 14B wallet-signed deployment',
            },
            {
              label: 'Smart Contract Operations',
              status: 'Locked',
              detail:
                'Reason: operation-specific authorization and evidence logging are not implemented. Required before operations: wallet connection, user-signed deployment, deployed testnet contract address, transaction hash, operation authorization model, evidence logging.',
              source: 'SCP operations boundary',
            },
            {
              label: 'Deployment / Signing / Audit',
              status: walletSignedDeploymentState.deploymentStatus === 'confirmed' ? 'Sepolia deployment confirmed' : 'Not executed',
              detail:
                'Not audited. No production approval. Wallet connection alone does not execute deployment. Smart Contract Operations remain locked.',
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
    ],
  );

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
    if (!question.trim()) {
      setBotChatError('Enter a question before asking the bot.');
      setEngineerAnswerSource('local');
      return;
    }

    setIsBotReplyLoading(true);
    setBotChatError(undefined);

    const result = await askBlockchainEngineer({
      userMessage: question,
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
      setEngineerResponse(result.data);
      setEngineerAnswerSource('backend');
      return;
    }

    setBotChatError(result.message);
    setEngineerResponse(createLocalEngineerResponse(fallbackEngineerAnswer));
    setEngineerAnswerSource('local');
  }

  function resetSmartContractGeneration() {
    deploymentAttemptSequenceRef.current += 1;
    deploymentAttemptIdRef.current = '';
    setSmartContractArtifactSpec(undefined);
    setSmartContractArtifactPackage(undefined);
    setSmartContractCheckResult(undefined);
    setSmartContractEvidenceLite(undefined);
    setSmartContractCompileTestResult(undefined);
    setWalletSignedDeploymentState(initialWalletSignedDeploymentState);
    setSmartContractGenerationStatus('idle');
    setSmartContractGenerationError(undefined);
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
    setEngineerResponse(createSmartContractPreparationResponse());
    setEngineerAnswerSource('generated_artifacts');
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
    setEngineerResponse(createWalletConnectionResponse(nextWalletConnectionReadModel));
    setEngineerAnswerSource('wallet');
  }

  async function requestSepoliaDeployment() {
    const provider = getBrowserEthereumProvider();
    const connectedWalletAddress = walletConnectionReadModel.connectedWalletAddress;
    const attemptId = `wallet-signed-sepolia-deployment-${deploymentAttemptSequenceRef.current + 1}`;
    deploymentAttemptSequenceRef.current += 1;
    deploymentAttemptIdRef.current = attemptId;

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
      setEngineerResponse(createDeploymentResponse(result));
      setEngineerAnswerSource('wallet');
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
        className={`cockpit-shell ${isLeftRailOpen ? '' : 'left-collapsed'} ${isRightRailOpen ? '' : 'right-collapsed'}`}
        aria-label="mila26-cockpit2 workspace"
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
        <aside className="left-rail" id="left-rail" aria-label="Project navigation">
          <div className="brand-block">
            <img src="/assets/brand/kangle-ai-logo.png" alt="" />
            <div>
              <strong>KangLe AI</strong>
              <span>MILA26 cockpit</span>
            </div>
          </div>

          <nav className="project-nav" aria-label="MILA26 project folders">
            <a aria-current="page" href="#workspace">
              Project workspace
            </a>
            <a href="#requirement-brief">Requirement Brief</a>
            <a href="#engineering-brief">Engineering Brief</a>
            <a href="#smart-contract-control">Smart Contract Control</a>
          </nav>

          <section className="rail-section" aria-label="Current-stage activities">
            <p className="eyebrow">Current-stage activities</p>
            <h2>Step 1 workspace</h2>
            <ul className="rail-list">
              {currentStageActivities.map((activity) => (
                <li key={activity}>{activity}</li>
              ))}
            </ul>
          </section>

          <section className="rail-section">
            <p className="eyebrow">Project Closure Ledger</p>
            <h2>{projectClosureReadModel.readinessLabel}</h2>
            <ul className="rail-list">
              <li>{projectClosureReadModel.openItemCount} unresolved open item(s)</li>
              <li>{projectClosureReadModel.blockingOpenItemCount} blocking item(s)</li>
              <li>{projectClosureReadModel.deferredItemCount} deferred item(s)</li>
              <li>Wallet-signed deployment gate locked</li>
            </ul>
          </section>

          <a className="rail-help" href="#goal-copilot">
            Need help? Ask the Engineering Bot
          </a>
        </aside>
        )}

        <section className="workspace" id="workspace">
          <header className="cockpit-header">
            <div>
              <p className="eyebrow">mila26-cockpit2</p>
              <h1>MILA Income Fund / Tokenized Income Fund</h1>
              <p className="header-copy">Guided AI + blockchain workspace for asset-manager tokenisation prep.</p>
            </div>
            <div className="safety-badges" aria-label="Project safety badges">
              <span>Ethereum testnet only</span>
              <span>Sepolia deploy gated</span>
            </div>
          </header>

          <section className="stage-progress" aria-label="Top stage progress">
            {cockpitStages.map((stage) => (
              <article key={stage.step} className={stage.step === '1' ? 'active' : stage.step === '8' ? 'downstream' : ''}>
                <span>{stage.step}</span>
                <strong>{stage.label}</strong>
                <small>{stage.state}</small>
              </article>
            ))}
          </section>

          <section className="workbench" id="goal-copilot">
            <div className="workbench-heading">
              <div>
                <p className="eyebrow">Step 1 active</p>
                <h2>Engineering Bot decision workspace</h2>
              </div>
              <span className={`gate-badge ${brief ? 'ready' : 'draft'}`}>{approvalGateStatus}</span>
            </div>

            <div className="workbench-grid">
              <section className="bot-workspace" aria-label="Engineering Bot workspace">
                <div className="bot-title-row">
                  <div>
                    <p className="eyebrow">Chief Engineering Officer</p>
                    <h3>Engineering Bot</h3>
                  </div>
                  <span>Master Orchestrator</span>
                </div>
                <div className="bot-conversation" aria-label="Engineering Bot conversation">
                  <div className="bot-reply">
                    <span>Engineering Bot reply</span>
                    <div className="assistant-response" data-testid="engineer-answer">
                      {isBotReplyLoading ? (
                        'Waiting for Blockchain Engineer Bot...'
                      ) : (
                        <div className="engineer-response-view">
                          <p>{engineerResponseViewModel.summary}</p>
                          {engineerResponseViewModel.sections.map((section) => (
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
                      )}
                    </div>
                  </div>
                </div>
                <label className="chat-composer">
                  <span className="composer-title">Engineering Bot MILA</span>
                  <textarea
                    aria-label="Engineering Bot MILA"
                    placeholder="Engineering Bot MILA"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void askBot();
                      }
                    }}
                    rows={5}
                  />
                  <span>Press Enter to send, Shift+Enter for a new line.</span>
                  <div className="composer-actions" aria-label="Engineering Bot actions">
                    <button className="send-button" data-action-id={uiActions.askQuestion} onClick={askBot} disabled={isBotReplyLoading}>
                      {isBotReplyLoading ? 'Sending...' : 'Send'}
                    </button>
                    <button
                      className="workflow-button"
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
                    {smartContractGenerationStatus === 'ready' && (
                      <button
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
                    {secondaryWorkflowActions.map((action) => (
                      <button
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
                {!primaryWorkflowAction.enabled && primaryWorkflowAction.disabledReason && (
                  <p className="action-disabled-reason">{primaryWorkflowAction.disabledReason}</p>
                )}
                {smartContractGenerationStatus === 'ready' && (
                  <div className="generated-artifacts" aria-label="Generated smart contract artifacts">
                    <div className="generated-artifacts-heading">
                      <div>
                        <p className="eyebrow">Generated artifacts</p>
                        <h3>Smart contract preparation review</h3>
                      </div>
                      <span className="gate-badge ready">Demo-ready preview</span>
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
                <p className="chat-status">
                  {isBotReplyLoading
                    ? 'Calling backend route.'
                    : engineerAnswerSource === 'backend'
                      ? 'Backend response.'
                      : engineerAnswerSource === 'generated_artifacts'
                        ? 'Backend artifacts generated.'
                        : engineerAnswerSource === 'wallet'
                          ? 'Wallet connection status updated.'
                          : 'Local preview shown until a backend response is available.'}
                </p>
              </section>

              <section
                className={`brief-column ${isBriefPreviewExpanded ? 'expanded' : 'compact'}`}
                id="requirement-brief"
                aria-label="Brief Preview"
              >
                <div className="brief-column-header">
                  <div>
                    <p className="eyebrow">Attached artifact</p>
                    <h3>Brief Preview</h3>
                    <p className="muted">Decision-ready summary generated from the Engineering Bot workspace.</p>
                  </div>
                  <button
                    className="secondary-button"
                    data-action-id={uiActions.toggleBriefPanel}
                    onClick={() => setIsBriefPreviewExpanded((current) => !current)}
                  >
                    {isBriefPreviewExpanded ? 'Collapse Brief Preview' : 'Expand Brief Preview'}
                  </button>
                </div>

                {brief && requirementBriefContract ? (
                  <div className="brief-preview" data-testid="requirement-brief">
                    <div>
                      <span>Business objective</span>
                      <strong>{goal}</strong>
                      <p>{facts.fundName} remains bounded to a local MVP planning workflow.</p>
                    </div>
                    <div>
                      <span>Token model</span>
                      <strong>{requirementBriefContract.tokenModel.standardPreference}</strong>
                      <p>{tokenModelSummary}</p>
                    </div>
                    <div>
                      <span>Investor access</span>
                      <strong>
                        {requirementBriefContract.investorAccess.walletWhitelistRequired ? 'Wallet whitelist required' : 'Access model pending'}
                      </strong>
                      <p>{requirementBriefContract.investorAccess.assumptions[0]}</p>
                    </div>
                    <div>
                      <span>Key workflows</span>
                      <strong>{selectedModules.length || enabledModuleCount} programmable modules</strong>
                      <p>{selectedModules[0]?.rationale ?? moduleCatalog[0].plainEnglish}</p>
                    </div>
                    <div>
                      <span>Deployment boundary</span>
                      <strong>{requirementBriefContract.deploymentBoundary.currentTarget}</strong>
                      <p>
                        {requirementBriefContract.networkBoundary}; {requirementBriefContract.deploymentBoundary.signing};{' '}
                        {requirementBriefContract.backendCustodyBoundary}.
                      </p>
                    </div>
                    <div>
                      <span>Open items</span>
                      <strong>{projectClosureReadModel.briefPreviewOpenItemSummary.label}</strong>
                      <p>{projectClosureReadModel.briefPreviewOpenItemSummary.detail}</p>
                    </div>
                  </div>
                ) : (
                  <div className="brief-preview compact-preview" data-testid="requirement-brief">
                    <div>
                      <span>Business objective</span>
                      <strong>{goal}</strong>
                      <p>This will become the core Requirement Brief objective.</p>
                    </div>
                    <div>
                      <span>Token model</span>
                      <strong>ERC-20 / ERC-721 under review</strong>
                      <p>Protocol choice remains reviewable until the Requirement Brief is created.</p>
                    </div>
                    <div>
                      <span>Investor access</span>
                      <strong>Approved investors</strong>
                      <p>Wallet whitelist assumptions will be captured in the brief.</p>
                    </div>
                    {isBriefPreviewExpanded && (
                      <>
                        <div>
                          <span>Key workflows</span>
                          <strong>Goal intake, assumptions, constraints</strong>
                          <p>Programmable servicing modules will be selected after requirement review.</p>
                        </div>
                        <div>
                          <span>Deployment boundary</span>
                          <strong>Ethereum testnet only</strong>
                          <p>User wallet signs; backend holds no private keys; no mainnet in MVP.</p>
                        </div>
                        <div>
                          <span>Open items</span>
                          <strong>{projectClosureReadModel.briefPreviewOpenItemSummary.label}</strong>
                          <p>{projectClosureReadModel.briefPreviewOpenItemSummary.detail}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <button
                  className="view-link-button"
                  data-action-id={uiActions.openBrief}
                  onClick={() => setIsBriefPreviewExpanded(true)}
                >
                  Open full brief
                </button>
                {engineeringBriefError && (
                  <p className="error-text" role="alert">
                    {engineeringBriefError}
                  </p>
                )}
              </section>
            </div>
          </section>

          <section className="module-band" aria-label="Programmable feature preview">
            <div>
              <p className="eyebrow">Programmable features</p>
              <h2>Servicing modules</h2>
            </div>
            <div className="module-grid">
              {moduleCatalog.slice(0, 4).map((module) => (
                <article key={module.id} className="module-card">
                  <strong>{module.label}</strong>
                  <span>{module.plainEnglish}</span>
                </article>
              ))}
            </div>
          </section>

          {engineeringBrief && (
            <section className="artifact-panel" data-testid="engineering-brief-artifact">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Step 3</p>
                  <h2>Engineering Brief Artifact</h2>
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
                  <span>Functional requirements</span>
                  <ul>
                    {engineeringBrief.functionalRequirements.slice(0, 3).map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <span>Wallet / access model</span>
                  <strong>{engineeringBrief.walletAndAccessModel.whitelistRequired ? 'Whitelist required' : 'Whitelist not required'}</strong>
                  <p>{engineeringBrief.walletAndAccessModel.assumptions[0]}</p>
                </article>
                <article>
                  <span>Deployment boundary</span>
                  <strong>{engineeringBrief.deploymentBoundary.network}</strong>
                  <p>{engineeringBrief.deploymentBoundary.status}</p>
                </article>
                <article>
                  <span>QA / evidence plan</span>
                  <ul>
                    {[...engineeringBrief.testingAndQaPlan.slice(0, 2), ...engineeringBrief.evidencePackPlan.slice(0, 2)].map(
                      (item) => (
                        <li key={item}>{item}</li>
                      ),
                    )}
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
            </section>
          )}

        </section>

        {isRightRailOpen && (
        <aside className="right-rail" id="right-rail" aria-label="Project status">
          <section className="status-panel">
            <p className="eyebrow">Stage Progress</p>
            <h2>{currentGate}</h2>
            <div className="status-meter">
              <span style={{ width: engineeringBrief ? '48%' : brief ? '32%' : '18%' }} />
            </div>
            <p className="muted">Step 1 stays active while setup, assumptions, and constraints are reviewed.</p>
          </section>

          <section className="status-panel">
            <p className="eyebrow">About this step</p>
            <h2>Business intent to Requirement Brief</h2>
            <p className="muted">
              Step 1 turns the asset-manager goal into a reviewable brief. Decisions stay with the Engineering Bot in
              the central workspace.
            </p>
          </section>

          <section className="status-panel">
            <p className="eyebrow">Step 1 To-Do Checklist</p>
            <ul className="check-list">
              {projectClosureReadModel.rightRailChecklistItems.map((todo) => (
                <li key={todo.label} className={todo.status === 'done' ? 'done' : ''}>
                  <span>{todo.status === 'done' ? 'Done' : todo.status}</span>
                  {todo.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="status-panel">
            <p className="eyebrow">Step 1 Artifacts</p>
            <ul className="artifact-list">
              {activeStepArtifacts.map((artifact) => (
                <li key={artifact}>{artifact}</li>
              ))}
            </ul>
            <p className="microcopy">{brief || engineeringBrief ? 'View generated artifacts in the center workspace.' : 'Artifacts appear after the Engineering Bot creates them.'}</p>
          </section>

          <section className="status-panel" id="deployment-gate">
            <p className="eyebrow">Safe-by-Design Summary</p>
            <h2>{projectClosureReadModel.readinessLabel}</h2>
            <p className="muted">{projectClosureReadModel.readinessDescription}</p>
            <ul className="artifact-list">
              <li>Deployment Gate Review: {formatDeploymentGateStatus(deploymentGateReadModel.gateStatus)}</li>
              <li>Pre-deployment readiness: {formatPreDeploymentReadiness(deploymentGateReadModel.preDeploymentReadiness)}</li>
              <li>Deployment execution: Blocked</li>
              <li>Wallet Signing Intent: {formatWalletSigningIntentStatus(walletSigningIntentReadModel.intentStatus)}</li>
              <li>Wallet connection: {formatWalletConnectionStatus(walletConnectionReadModel.walletConnectionStatus)}</li>
              <li>Wallet provider: {walletConnectionReadModel.provider.providerStatus === 'available' ? 'Available' : walletConnectionReadModel.provider.providerStatus === 'unsupported' ? 'Not detected' : 'Unknown'}</li>
              <li>Wallet chain: {formatWalletChainStatus(walletConnectionReadModel.chainStatus)}</li>
              <li>{walletAddressDisplay ? `Connected wallet: ${walletAddressDisplay}` : 'No wallet address'}</li>
              <li>Wallet execution: Not implemented</li>
              <li>Wallet-signed Sepolia deployment: {formatWalletSignedDeploymentStatus(walletSignedDeploymentState.deploymentStatus)}</li>
              <li>
                {walletSignedDeploymentState.transactionHash
                  ? `Transaction hash: ${walletSignedDeploymentState.transactionHash}`
                  : 'No transaction hash'}
              </li>
              <li>
                {walletSignedDeploymentState.contractAddress
                  ? `Contract address: ${walletSignedDeploymentState.contractAddress}`
                  : 'No contract address'}
              </li>
              <li>Deployment status is held in this local session. Evidence linkage follows in Track 14C.</li>
              <li>User wallet signing required later</li>
              <li>Backend never holds private keys</li>
              <li>No signed payload</li>
              <li>{walletSignedDeploymentState.transactionHash ? 'Submitted transaction: Submitted to Sepolia' : 'No submitted transaction'}</li>
              <li>{walletSignedDeploymentState.contractAddress ? 'Confirmed transaction: Confirmed on Sepolia' : 'No confirmed transaction'}</li>
            </ul>
            <p className="microcopy">Remaining gate items</p>
            <ul className="artifact-list">
              {deploymentGateReadModel.remainingGateItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="open-count">
              {projectClosureReadModel.openItemCount} unresolved / {projectClosureReadModel.deferredItemCount} deferred item(s)
            </p>
          </section>
        </aside>
        )}
      </section>

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
              {smartContractControlPanel.coreActions.map((action) => (
                <button key={action.label} disabled={!action.enabled} title={action.disabledReason}>
                  {action.label}
                </button>
              ))}
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
                {walletSignedDeploymentState.transactionHash
                  ? `Transaction hash: ${walletSignedDeploymentState.transactionHash}`
                  : 'No transaction hash'}
              </span>
              <span>
                {walletSignedDeploymentState.contractAddress
                  ? `Contract address: ${walletSignedDeploymentState.contractAddress}`
                  : 'No contract address'}
              </span>
            </div>
            <p className="microcopy">
              User wallet signs in browser. Backend never holds private keys. Deployment status is held in this local session; evidence linkage follows in Track 14C.
            </p>
          </section>

          <section className="contract-section">
            <h3>Wallet Signing Readiness</h3>
            <div className="health-list">
              <span>Wallet Signing Intent: {formatWalletSigningIntentStatus(walletSigningIntentReadModel.intentStatus)}</span>
              <span>Wallet connection: {formatWalletConnectionStatus(walletConnectionReadModel.walletConnectionStatus)}</span>
              <span>Wallet chain: {formatWalletChainStatus(walletConnectionReadModel.chainStatus)}</span>
              <span>{walletAddressDisplay ? `Connected wallet: ${walletAddressDisplay}` : 'No wallet address'}</span>
              <span>Wallet execution: Not implemented</span>
              <span>User wallet signing required later</span>
              <span>Backend never holds private keys</span>
              <span>No signed payload</span>
              <span>{walletSignedDeploymentState.transactionHash ? 'Submitted transaction: Submitted to Sepolia' : 'No submitted transaction'}</span>
              <span>{walletSignedDeploymentState.contractAddress ? 'Confirmed transaction: Confirmed on Sepolia' : 'No confirmed transaction'}</span>
              <span>
                {walletSignedDeploymentState.contractAddress
                  ? `Contract address: ${walletSignedDeploymentState.contractAddress}`
                  : 'No contract address'}
              </span>
              <span>
                {walletSignedDeploymentState.transactionHash
                  ? `Transaction hash: ${walletSignedDeploymentState.transactionHash}`
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
              <span>Smart Contract Operations: Locked</span>
              <span>Reason: operation-specific authorization and evidence logging are not implemented</span>
              <span>
                Required before operations: wallet connection, user-signed deployment, deployed testnet contract address,
                transaction hash, operation authorization model, evidence logging
              </span>
            </div>
            <p className="microcopy">
              Operational controls remain unavailable. Mint, burn, pause, resume, NAV, and distribution controls are not
              active in Track 14B.
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
              developer-local foundation result only. Deployment status is local-session-only until Track 14C evidence
              linkage.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
