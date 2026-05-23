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
    <main className="cockpit-page">
      <section className="cockpit-shell" aria-label="mila26-cockpit2 workspace">
        <aside className="left-rail" aria-label="Project navigation">
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
            <h2>Open Items</h2>
            <ul className="rail-list">
              <li>{brief ? 'Requirement Brief drafted' : 'Requirement Brief pending'}</li>
              <li>{engineeringBrief ? 'Engineering Brief generated' : 'Engineering Brief pending'}</li>
              <li>Wallet-signed deployment gate locked</li>
            </ul>
          </section>

          <a className="rail-help" href="#goal-copilot">
            Help / Ask Chief Engineering Bot
          </a>
        </aside>

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
                <h2>Goal Copilot and Requirement Brief draft preview</h2>
              </div>
              <span className={`gate-badge ${brief ? 'ready' : 'draft'}`}>{approvalGateStatus}</span>
            </div>

            <div className="workbench-grid">
              <section className="copilot-column" aria-label="Goal Copilot">
                <h3>Goal Copilot</h3>
                <p className="muted">Capture the business intent, then ask the Engineering Bot to sharpen constraints.</p>
                <label>
                  Tokenisation goal
                  <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={4} />
                </label>
                <label>
                  Blockchain Engineer Bot question
                  <textarea
                    aria-label="Blockchain Engineer Bot question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    rows={4}
                  />
                </label>
                <div className="action-row">
                  <button disabled={isBotReplyLoading} onClick={askBot}>
                    {isBotReplyLoading ? 'Asking bot...' : 'Ask Blockchain Engineer'}
                  </button>
                </div>
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
                <div className="assistant-response" data-testid="engineer-answer">
                  {isBotReplyLoading ? 'Waiting for Blockchain Engineer Bot...' : engineerAnswer}
                </div>
              </section>

              <section className="brief-column" id="requirement-brief" aria-label="Requirement Brief draft preview">
                <div className="brief-column-header">
                  <div>
                    <h3>Requirement Brief draft preview</h3>
                    <p className="muted">Generated from the copilot conversation and current project inputs.</p>
                  </div>
                  <button onClick={createBrief}>Create Requirement Brief</button>
                </div>

                <div className="fact-grid">
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

                {brief && requirementBriefContract ? (
                  <div className="brief-preview" data-testid="requirement-brief">
                    <div>
                      <span>Asset / fund profile</span>
                      <strong>
                        {requirementBriefContract.assetProfile.fundName} ({requirementBriefContract.assetProfile.tokenSymbol})
                      </strong>
                      <p>
                        {requirementBriefContract.assetProfile.jurisdiction} jurisdiction for{' '}
                        {requirementBriefContract.assetProfile.targetInvestors}.
                      </p>
                    </div>
                    <div>
                      <span>Token model</span>
                      <strong>{requirementBriefContract.tokenModel.standardPreference}</strong>
                      <p>{tokenModelSummary}</p>
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
                      <span>Selected modules</span>
                      <strong>{selectedModules.length || enabledModuleCount} active</strong>
                      <p>{selectedModules[0]?.rationale ?? moduleCatalog[0].plainEnglish}</p>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <strong>Draft brief not created yet</strong>
                    <p className="muted">Use the single primary action above to create the Requirement Brief preview.</p>
                  </div>
                )}

                <div className="approval-gate" id="engineering-brief">
                  <div>
                    <span>Next artifact</span>
                    <strong>{brief ? 'Ready to generate the Engineering Brief artifact.' : 'Create the Requirement Brief first.'}</strong>
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

        <aside className="right-rail" aria-label="Project status">
          <section className="status-panel">
            <p className="eyebrow">Stage Progress</p>
            <h2>{currentGate}</h2>
            <div className="status-meter">
              <span style={{ width: engineeringBrief ? '48%' : brief ? '32%' : '18%' }} />
            </div>
            <p className="muted">Step 1 stays active while setup, assumptions, and constraints are reviewed.</p>
          </section>

          <section className="status-panel">
            <p className="eyebrow">Current Focus</p>
            <h2>Business intent to Requirement Brief</h2>
            <p className="muted">ERC-20 / ERC-721 discussion is allowed. Protocol choice remains reviewable.</p>
          </section>

          <section className="status-panel" id="agent-status">
            <p className="eyebrow">Activity Log</p>
            <div className="agent-status-list">
              {agentStatuses.map((agent) => (
                <div key={agent.label} className="agent-status-row">
                  <span>{agent.label}</span>
                  <strong>{agent.status}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="status-panel">
            <p className="eyebrow">Next Recommended Action</p>
            <h2>{brief ? 'Generate Engineering Brief' : 'Create Requirement Brief'}</h2>
            <p className="muted">
              {brief
                ? 'Review the draft, then create the Engineering Brief artifact from the existing backend route.'
                : 'Confirm project facts and create the Requirement Brief preview.'}
            </p>
          </section>

          <section className="status-panel" id="deployment-gate">
            <p className="eyebrow">Deployment Gate / Safe by design</p>
            <h2>Locked for MVP</h2>
            <p className="muted">User wallet signing comes later. Backend private keys and mainnet deployment are out of scope.</p>
          </section>
        </aside>
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
              <span>Compilation: Later stage</span>
              <span>Audit evidence: Later stage</span>
              <span>Mainnet: Disabled</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
