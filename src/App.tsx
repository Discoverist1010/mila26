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
  const [facts, setFacts] = useState<FundFacts>(starterFacts);
  const [goal, setGoal] = useState('We want to launch a tokenized income product for approved investors.');
  const [question, setQuestion] = useState('What should we be careful about before generating code?');
  const [brief, setBrief] = useState<RequirementBrief | undefined>();
  const [engineeringBrief, setEngineeringBrief] = useState<EngineeringBrief | undefined>();
  const [engineeringBriefError, setEngineeringBriefError] = useState<string | undefined>();
  const [isEngineeringBriefLoading, setIsEngineeringBriefLoading] = useState(false);
  const [bundle, setBundle] = useState<ImplementationBundle | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [engineerAnswer, setEngineerAnswer] = useState(() => answerAsBlockchainEngineer(question));
  const [engineerAnswerSource, setEngineerAnswerSource] = useState<'local' | 'backend'>('local');
  const [botChatError, setBotChatError] = useState<string | undefined>();
  const [isBotReplyLoading, setIsBotReplyLoading] = useState(false);

  const fallbackEngineerAnswer = useMemo(() => answerAsBlockchainEngineer(question, brief), [question, brief]);
  const requirementBriefContract = useMemo(
    () => (brief ? toRequirementBriefContract(brief, bundle ? 'approved' : 'ready_for_approval') : undefined),
    [brief, bundle],
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
  const agentStatuses = [
    { label: 'Requirement', status: brief ? 'Ready' : 'Drafting' },
    { label: 'Coding', status: bundle ? 'Complete' : brief ? 'Ready' : 'Waiting' },
    { label: 'QA', status: bundle ? 'Checked' : 'Waiting' },
    { label: 'Security', status: bundle ? 'Reviewed' : 'Gate locked' },
    { label: 'Evidence', status: bundle ? 'Available' : 'Waiting' },
    { label: 'Deploy Gate', status: 'Disabled' },
  ];

  function updateFact<K extends keyof FundFacts>(key: K, value: FundFacts[K]) {
    setFacts((current) => ({ ...current, [key]: value }));
  }

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
    <main className="dashboard-shell">
      <aside className="project-rail" aria-label="Project navigation">
        <div className="brand-block">
          <span className="brand-mark">KA</span>
          <div>
            <strong>KangLe AI</strong>
            <span>MILA26</span>
          </div>
        </div>
        <nav className="project-nav" aria-label="MILA26 project folders">
          <a aria-current="page" href="#workspace">
            Tokenized Income Fund
          </a>
          <a href="#requirement-brief">Requirement Brief</a>
          <a href="#agent-status">Agents</a>
          <a href="#deployment-gate">Deployment Gate</a>
        </nav>
        <div className="rail-note">
          <span>Local MVP</span>
          <strong>Testnet only</strong>
        </div>
      </aside>

      <section className="workspace" id="workspace">
        <header className="project-header">
          <div>
            <p className="eyebrow">MILA26 beta workspace</p>
            <h1>Tokenized Income Fund</h1>
            <p className="header-copy">AI + blockchain project cockpit for asset-manager tokenisation prep.</p>
          </div>
          <div className="header-actions" aria-label="Project status">
            <span className="status-pill">Ethereum testnet only</span>
            <span className="status-pill warning">Real deploy disabled</span>
            <span className="status-pill ghost">Services placeholder</span>
          </div>
        </header>

        <section className="metric-strip" aria-label="Current project summary">
          <article>
            <span>Protocol</span>
            <strong>ERC-20 / ERC-721 planning</strong>
          </article>
          <article>
            <span>Network</span>
            <strong>Testnet only</strong>
          </article>
          <article>
            <span>Current gate</span>
            <strong>{currentGate}</strong>
          </article>
          <article>
            <span>Selected modules</span>
            <strong>{enabledModuleCount}</strong>
          </article>
        </section>

        <section className="journey-strip" aria-label="Funding demo journey">
          <article>
            <span>Step 1</span>
            <strong>Define tokenisation requirement</strong>
          </article>
          <article>
            <span>Step 2</span>
            <strong>Generate engineering brief</strong>
          </article>
          <article>
            <span>Step 3</span>
            <strong>Generate implementation artifacts</strong>
          </article>
          <article>
            <span>Step 4</span>
            <strong>Review evidence and deployment gate</strong>
          </article>
        </section>

        <section className="panel setup-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 1</p>
              <h2>Project setup</h2>
              <p className="muted">Define the tokenisation brief inputs for the asset-manager demo.</p>
            </div>
            <span className="status-pill ghost">Local deterministic form</span>
          </div>
          <div className="grid-two">
          <div>
            <label>
              Fund name
              <input value={facts.fundName} onChange={(event) => updateFact('fundName', event.target.value)} />
            </label>
            <label>
              Token symbol
              <input
                value={facts.tokenSymbol}
                onChange={(event) => updateFact('tokenSymbol', event.target.value.toUpperCase())}
              />
            </label>
            <label>
              Jurisdiction
              <input value={facts.jurisdiction} onChange={(event) => updateFact('jurisdiction', event.target.value)} />
            </label>
            <label>
              Target investors
              <input
                value={facts.targetInvestors}
                onChange={(event) => updateFact('targetInvestors', event.target.value)}
              />
            </label>
          </div>
          <div>
            <h3>Tokenisation goal</h3>
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={7} />
            <button onClick={createBrief}>Create Requirement Brief</button>
          </div>
          </div>
        </section>

        <section className="panel">
          <h2>Servicing Modules</h2>
          <div className="module-grid">
            {moduleCatalog.map((module) => (
              <article key={module.id} className="module-card">
                <strong>{module.label}</strong>
                <span>{module.plainEnglish}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel brief-panel" id="requirement-brief">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 2</p>
              <h2>Requirement Brief</h2>
              <p className="muted">Structured engineering brief for review before artifact generation.</p>
            </div>
            <span className={`gate-badge ${brief ? 'ready' : 'draft'}`}>{approvalGateStatus}</span>
          </div>
          {brief && requirementBriefContract ? (
            <div className="brief-layout" data-testid="requirement-brief">
              <article className="brief-card">
                <span>Asset / fund profile</span>
                <strong>
                  {requirementBriefContract.assetProfile.fundName} ({requirementBriefContract.assetProfile.tokenSymbol})
                </strong>
                <p>
                  {requirementBriefContract.assetProfile.jurisdiction} jurisdiction for{' '}
                  {requirementBriefContract.assetProfile.targetInvestors}. Initial NAV{' '}
                  {requirementBriefContract.assetProfile.initialNav.toLocaleString()} and supply{' '}
                  {requirementBriefContract.assetProfile.totalSupply.toLocaleString()}.
                </p>
              </article>
              <article className="brief-card">
                <span>Token model</span>
                <strong>{requirementBriefContract.tokenModel.standardPreference}</strong>
                <p>{tokenModelSummary}</p>
              </article>
              <article className="brief-card">
                <span>Wallet whitelist / investor access</span>
                <strong>{requirementBriefContract.investorAccess.walletWhitelistRequired ? 'Whitelist module enabled' : 'Pending'}</strong>
                <p>{requirementBriefContract.investorAccess.assumptions[0]}</p>
              </article>
              <article className="brief-card">
                <span>Valuation / performance cadence</span>
                <strong>{selectedModules.some((module) => module.id === 'nav-oracle') ? 'NAV module enabled' : 'Pending'}</strong>
                <p>{requirementBriefContract.valuationPolicy.cadence}</p>
              </article>
              <article className="brief-card wide">
                <span>Compliance / security assumptions</span>
                <ul>
                  {brief.complianceAssumptions.map((assumption) => (
                    <li key={assumption}>{assumption}</li>
                  ))}
                </ul>
              </article>
              <article className="brief-card wide">
                <span>Deployment boundary</span>
                <strong>{requirementBriefContract.deploymentBoundary.currentTarget}</strong>
                <p>
                  {requirementBriefContract.networkBoundary}; {requirementBriefContract.deploymentBoundary.signing};{' '}
                  {requirementBriefContract.backendCustodyBoundary}.
                </p>
                <ul>
                  {brief.securityConstraints.map((constraint) => (
                    <li key={constraint}>{constraint}</li>
                  ))}
                </ul>
              </article>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Draft brief</strong>
              <p className="muted">Create a Requirement Brief before code generation.</p>
            </div>
          )}
          <div className="approval-gate">
            <div>
              <span>Approval gate</span>
              <strong>{brief ? 'Ready to generate the Engineering Brief artifact.' : 'Requirement brief required.'}</strong>
            </div>
            <button disabled={!brief || isEngineeringBriefLoading} onClick={createEngineeringBrief}>
              {isEngineeringBriefLoading ? 'Generating Engineering Brief...' : 'Generate Engineering Brief'}
            </button>
          </div>
          {engineeringBriefError && (
            <p className="error-text" role="alert">
              {engineeringBriefError}
            </p>
          )}
        </section>

        {engineeringBrief && (
          <section className="panel engineering-brief-panel" data-testid="engineering-brief-artifact">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Engineering Brief Artifact</h2>
                <p className="muted">Deterministic backend artifact generated from the approved Requirement Brief.</p>
              </div>
              <span className="gate-badge ready">Generated</span>
            </div>
            <div className="engineering-brief-grid">
              <article className="brief-card">
                <span>Project context</span>
                <strong>{engineeringBrief.projectContext.projectName}</strong>
                <p>
                  {engineeringBrief.projectContext.fundName} ({engineeringBrief.projectContext.tokenSymbol}) for{' '}
                  {engineeringBrief.projectContext.targetInvestors} in {engineeringBrief.projectContext.jurisdiction}.
                </p>
              </article>
              <article className="brief-card">
                <span>Token design</span>
                <strong>{engineeringBrief.tokenDesign.standardPreference}</strong>
                <p>{engineeringBrief.tokenDesign.assumptions[0]}</p>
              </article>
              <article className="brief-card">
                <span>Wallet / access model</span>
                <strong>{engineeringBrief.walletAndAccessModel.whitelistRequired ? 'Whitelist required' : 'Whitelist not required'}</strong>
                <p>{engineeringBrief.walletAndAccessModel.assumptions[0]}</p>
              </article>
              <article className="brief-card">
                <span>Deployment boundary</span>
                <strong>{engineeringBrief.deploymentBoundary.network}</strong>
                <p>{engineeringBrief.deploymentBoundary.status}</p>
              </article>
              <article className="brief-card wide">
                <span>Functional requirements</span>
                <ul>
                  {engineeringBrief.functionalRequirements.slice(0, 4).map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </article>
              <article className="brief-card wide">
                <span>QA / evidence plan</span>
                <ul>
                  {[...engineeringBrief.testingAndQaPlan.slice(0, 2), ...engineeringBrief.evidencePackPlan.slice(0, 2)].map(
                    (item) => (
                      <li key={item}>{item}</li>
                    ),
                  )}
                </ul>
              </article>
              <article className="brief-card">
                <span>Risks / controls</span>
                <strong>{engineeringBrief.risksAndControls[0].risk}</strong>
                <p>{engineeringBrief.risksAndControls[0].control}</p>
              </article>
              <article className="brief-card">
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
                <span>Next step</span>
                <strong>Run deterministic implementation artifacts from the approved brief.</strong>
              </div>
              <button disabled={isRunning} onClick={runAgents}>
                {isRunning ? 'Coding Bot running mini-bots...' : 'Approve Brief and Run Coding Bot'}
              </button>
            </div>
          </section>
        )}

        {bundle && (
          <section className="panel" data-testid="artifact-workspace">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 3</p>
                <h2>Generated implementation artifacts</h2>
                <p className="muted">Deterministic beta outputs from the approved Requirement Brief.</p>
              </div>
              <span className="gate-badge ready">Approved</span>
            </div>
            <div className="agent-grid artifact-summary-grid" data-testid="agent-results">
              {bundle.results.map((result) => (
                <article key={result.taskId} className="agent-card">
                  <strong>{result.role}</strong>
                  <span>{result.summary}</span>
                  <small>{result.artifacts.length} artifact(s)</small>
                </article>
              ))}
            </div>
            <div className="review-card">
              <h3>Security Review</h3>
              <p className={bundle.securityReview.approved ? 'approved' : 'blocked'}>
                {bundle.securityReview.approved ? 'Approved for beta artifact release' : 'Blocked'}
              </p>
              <ul>
                {bundle.securityReview.findings.map((finding) => (
                  <li key={finding}>{finding}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {generatedArtifacts.length > 0 && (
          <section className="panel">
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

        {bundle && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Step 4</p>
                <h2>Evidence Pack</h2>
                <p className="muted">Review evidence and deployment-gate context before any future testnet path.</p>
              </div>
            </div>
            <button onClick={() => downloadText('MILA26-Evidence-Pack.md', bundle.evidencePack.markdown)}>
              Download Evidence Pack
            </button>
            <pre className="code-block">{bundle.evidencePack.markdown}</pre>
          </section>
        )}
      </section>

      <aside className="right-panel" aria-label="Project status and assistant">
        <section className="status-panel" id="agent-status">
          <div className="panel-heading">
            <p className="eyebrow">Project status</p>
            <h2>Agent progress</h2>
          </div>
          <div className="agent-status-list">
            {agentStatuses.map((agent) => (
              <div key={agent.label} className="agent-status-row">
                <span>{agent.label}</span>
                <strong>{agent.status}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="status-panel" id="deployment-gate">
          <div className="panel-heading">
            <p className="eyebrow">Deployment gate</p>
            <h2>Locked for MVP</h2>
          </div>
          <p className="muted">User wallet signing comes later. Backend private keys and mainnet deployment are out of scope.</p>
        </section>

        <section className="chat-panel">
          <h2>Blockchain Engineer Bot</h2>
          <p className="muted">Ask plain-language questions. The bot turns goals into engineering requirements.</p>
          <textarea
            aria-label="Blockchain Engineer Bot question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={5}
          />
          <button disabled={isBotReplyLoading} onClick={askBot}>
            {isBotReplyLoading ? 'Asking bot...' : 'Ask Blockchain Engineer'}
          </button>
          {botChatError && (
            <p className="error-text" role="alert">
              {botChatError}
            </p>
          )}
          <p className="chat-status">
            {isBotReplyLoading
              ? 'Calling backend mock route.'
              : engineerAnswerSource === 'backend'
                ? 'Backend response.'
                : 'Local preview shown until a backend response is available.'}
          </p>
          <div className="assistant-response" data-testid="engineer-answer">
            {isBotReplyLoading ? 'Waiting for Blockchain Engineer Bot...' : engineerAnswer}
          </div>
        </section>
      </aside>
    </main>
  );
}
