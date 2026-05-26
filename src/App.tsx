import { useMemo, useState } from 'react';
import { askBlockchainEngineer } from './api/blockchainEngineerChat';
import { generateEngineeringBrief } from './api/engineeringBrief';
import {
  answerAsBlockchainEngineer,
  createRequirementBrief,
  runCodingBotOrchestration,
  type ImplementationBundle,
} from './agents/agentRuntime';
import { moduleCatalog } from './domain/moduleCatalog';
import { createDemoProjectClosureLedger } from './domain/projectClosureLedger';
import { toProjectClosureReadModel } from './domain/projectClosureReadModel';
import { toRequirementBriefContract } from './domain/requirementBrief';
import type { EngineeringBrief } from '../server/contracts/engineeringBrief';
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

const customContractFeatures = [
  { name: 'NAV Updated', initiation: 'Not user initiated', action: 'View only' },
  { name: 'Distribution Recorded', initiation: 'User initiated', action: 'Trigger Event' },
  { name: 'Redemption Requested', initiation: 'User initiated', action: 'Trigger Event' },
  { name: 'Investor Added', initiation: 'User initiated', action: 'Trigger Event' },
  { name: 'Investor Removed', initiation: 'User initiated', action: 'Trigger Event' },
];

const recentContractEvents = [
  'No wallet-signed testnet events yet',
  'Engineering Brief required before contract feature finalization',
  'Deployment remains disabled for MVP',
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
} as const;

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [facts] = useState<FundFacts>(starterFacts);
  const [goal] = useState('We want to launch a tokenized income product for approved investors.');
  const [question, setQuestion] = useState('');
  const [brief, setBrief] = useState<RequirementBrief | undefined>();
  const [engineeringBrief, setEngineeringBrief] = useState<EngineeringBrief | undefined>();
  const [engineeringBriefError, setEngineeringBriefError] = useState<string | undefined>();
  const [isEngineeringBriefLoading, setIsEngineeringBriefLoading] = useState(false);
  const [bundle, setBundle] = useState<ImplementationBundle | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [engineerAnswer, setEngineerAnswer] = useState(() => answerAsBlockchainEngineer(initialBotQuestion));
  const [engineerAnswerSource, setEngineerAnswerSource] = useState<'local' | 'backend'>('local');
  const [botChatError, setBotChatError] = useState<string | undefined>();
  const [isBotReplyLoading, setIsBotReplyLoading] = useState(false);
  const [isLeftRailOpen, setIsLeftRailOpen] = useState(true);
  const [isRightRailOpen, setIsRightRailOpen] = useState(true);
  const [isBriefPreviewExpanded, setIsBriefPreviewExpanded] = useState(false);

  const fallbackEngineerAnswer = useMemo(() => answerAsBlockchainEngineer(question || initialBotQuestion, brief), [question, brief]);
  const requirementBriefContract = useMemo(
    () => (brief ? toRequirementBriefContract(brief, bundle ? 'approved' : 'ready_for_approval') : undefined),
    [brief, bundle],
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
  const generatedArtifacts = bundle?.results.flatMap((result) => result.artifacts) ?? [];
  const enabledModuleCount = brief?.modules.filter((module) => module.enabled).length ?? moduleCatalog.length;
  const currentGate = engineeringBrief
    ? 'Engineering Brief generated'
    : brief
      ? 'Engineering Brief generation'
      : 'Requirement brief approval';
  const approvalGateStatus = bundle ? 'Approved' : engineeringBrief ? 'Engineering brief ready' : brief ? 'Brief ready' : 'Draft brief';
  const selectedModules = brief?.modules.filter((module) => module.enabled) ?? [];
  const tokenModelSummary =
    requirementBriefContract?.tokenModel.assumption ?? 'Token model will be confirmed in the Requirement Brief.';
  const activeStepArtifacts = [
    brief ? 'Requirement Brief draft' : 'Requirement Brief draft pending',
    engineeringBrief ? 'Engineering Brief artifact' : 'Engineering Brief pending',
    `Closure readiness: ${projectClosureReadModel.readinessLabel}`,
    'Decision notes local only',
  ];
  const botRecommendation = !brief
    ? {
        primaryLabel: 'Create Requirement Doc',
        primaryActionId: uiActions.createRequirementBrief,
        primaryDisabled: false,
        onPrimary: createBrief,
      }
    : !engineeringBrief
      ? {
          primaryLabel: isEngineeringBriefLoading ? 'Generating Engineering Brief...' : 'Generate Engineering Brief',
          primaryActionId: uiActions.generateEngineeringBrief,
          primaryDisabled: isEngineeringBriefLoading,
          onPrimary: createEngineeringBrief,
        }
      : {
          primaryLabel: isRunning ? 'Coding Bot running mini-bots...' : 'Approve Brief and Run Coding Bot',
          primaryActionId: 'run_coding_bot',
          primaryDisabled: isRunning,
          onPrimary: runAgents,
        };

  function createBrief() {
    const nextBrief = createRequirementBrief(facts, goal);
    setBrief(nextBrief);
    setEngineeringBrief(undefined);
    setEngineeringBriefError(undefined);
    setBundle(undefined);
  }

  async function createEngineeringBrief() {
    if (!brief) return;

    setIsEngineeringBriefLoading(true);
    setEngineeringBriefError(undefined);

    const result = await generateEngineeringBrief({
      requirementBrief: toRequirementBriefContract(brief, 'approved'),
    });

    setIsEngineeringBriefLoading(false);

    if (result.ok) {
      setEngineeringBrief(result.data);
      return;
    }

    setEngineeringBriefError(result.message);
  }

  async function runAgents() {
    if (!brief) return;
    setIsRunning(true);
    try {
      const nextBundle = await runCodingBotOrchestration(brief);
      setBundle(nextBundle);
    } finally {
      setIsRunning(false);
    }
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
      setEngineerAnswer(result.data.content);
      setEngineerAnswerSource('backend');
      return;
    }

    setBotChatError(result.message);
    setEngineerAnswer(fallbackEngineerAnswer);
    setEngineerAnswerSource('local');
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
              <span>Real deploy disabled</span>
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
                      {isBotReplyLoading ? 'Waiting for Blockchain Engineer Bot...' : engineerAnswer}
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
                      data-action-id={botRecommendation.primaryActionId}
                      disabled={botRecommendation.primaryDisabled}
                      onClick={botRecommendation.onPrimary}
                    >
                      {botRecommendation.primaryLabel}
                    </button>
                    <button
                      className="workflow-button"
                      data-action-id={uiActions.reviewAssumptions}
                      onClick={() => setIsBriefPreviewExpanded(true)}
                    >
                      Review assumptions
                    </button>
                  </div>
                </label>
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
              <div className="approval-gate">
                <div>
                  <span>Later stage</span>
                  <strong>Run deterministic implementation artifacts from the approved brief.</strong>
                </div>
                <button disabled={isRunning} onClick={runAgents}>
                  {isRunning ? 'Coding Bot running mini-bots...' : 'Approve Brief and Run Coding Bot'}
                </button>
              </div>
            </section>
          )}

          {bundle && (
            <section className="artifact-panel" data-testid="artifact-workspace">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Step 4</p>
                  <h2>Evidence Pack</h2>
                  <p className="muted">Review evidence before any future testnet path.</p>
                </div>
              </div>
              <button onClick={() => downloadText('MILA26-Evidence-Pack.md', bundle.evidencePack.markdown)}>
                Download Evidence Pack
              </button>
              <pre className="code-block">{bundle.evidencePack.markdown}</pre>
            </section>
          )}

          {generatedArtifacts.length > 0 && (
            <section className="artifact-panel">
              <h2>Generated Artifacts</h2>
              {generatedArtifacts.map((artifact) => (
                <details key={artifact.id} className="artifact-card" open={artifact.kind === 'solidity'}>
                  <summary>{artifact.filename}</summary>
                  <div className="artifact-meta">
                    <span>{artifact.kind}</span>
                    <span>Source: {artifact.sourceTaskId}</span>
                  </div>
                  <pre className="code-block">{artifact.content}</pre>
                </details>
              ))}
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
          <span className="gate-badge draft">Preview only</span>
        </div>

        <div className="contract-overview">
          <article>
            <span>Contract status</span>
            <strong>Not deployed</strong>
          </article>
          <article>
            <span>Contract address</span>
            <strong>0x... pending testnet deployment</strong>
          </article>
          <article>
            <span>Network</span>
            <strong>Ethereum testnet only</strong>
          </article>
          <article>
            <span>Deployed by</span>
            <strong>User Wallet</strong>
          </article>
          <article>
            <span>Contract type</span>
            <strong>ERC-20 + custom</strong>
          </article>
          <article>
            <span>Wallet Connection</span>
            <strong>Not connected in MVP</strong>
          </article>
          <article>
            <span>Closure readiness</span>
            <strong>{projectClosureReadModel.scpReadinessPreview.label}</strong>
          </article>
        </div>

        <div className="contract-grid">
          <section className="contract-section">
            <h3>Core actions</h3>
            <div className="control-actions">
              {['Mint', 'Distribute', 'Burn', 'Pause/Unpause'].map((action) => (
                <button key={action} disabled>
                  {action}
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
                {customContractFeatures.map((feature) => (
                  <tr key={feature.name}>
                    <td>{feature.name}</td>
                    <td>{feature.initiation}</td>
                    <td>
                      <button disabled>{feature.action}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="contract-section">
            <h3>Recent Events</h3>
            <ul className="plain-list">
              {recentContractEvents.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
          </section>

          <section className="contract-section">
            <h3>Contract Health</h3>
            <div className="health-list">
              {projectClosureReadModel.scpReadinessPreview.healthItems.map((item) => (
                <span key={item}>{item}</span>
              ))}
              <span>Compilation: Later stage</span>
            </div>
            <p className="microcopy">{projectClosureReadModel.scpReadinessPreview.detail}</p>
          </section>
        </div>
      </section>
    </main>
  );
}
