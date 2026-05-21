import { useMemo, useState } from 'react';
import { askBlockchainEngineer } from './api/blockchainEngineerChat';
import {
  answerAsBlockchainEngineer,
  createRequirementBrief,
  runCodingBotOrchestration,
  type ImplementationBundle,
} from './agents/agentRuntime';
import { moduleCatalog } from './domain/moduleCatalog';
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
  const [bundle, setBundle] = useState<ImplementationBundle | undefined>();
  const [isRunning, setIsRunning] = useState(false);
  const [engineerAnswer, setEngineerAnswer] = useState(() => answerAsBlockchainEngineer(question));
  const [engineerAnswerSource, setEngineerAnswerSource] = useState<'local' | 'backend'>('local');
  const [botChatError, setBotChatError] = useState<string | undefined>();
  const [isBotReplyLoading, setIsBotReplyLoading] = useState(false);

  const fallbackEngineerAnswer = useMemo(() => answerAsBlockchainEngineer(question, brief), [question, brief]);
  const generatedArtifacts = bundle?.results.flatMap((result) => result.artifacts) ?? [];
  const enabledModuleCount = brief?.modules.filter((module) => module.enabled).length ?? moduleCatalog.length;
  const currentGate = brief ? 'Brief ready for Coding Bot' : 'Requirement brief approval';
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
    setBundle(undefined);
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

        <section className="panel grid-two">
          <div>
            <h2>Fund Setup</h2>
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
            <h2>Goal</h2>
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} rows={7} />
            <button onClick={createBrief}>Create Requirement Brief</button>
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

        <section className="panel" id="requirement-brief">
          <h2>Requirement Brief</h2>
          {brief ? (
            <pre className="code-block" data-testid="requirement-brief">
              {JSON.stringify(brief, null, 2)}
            </pre>
          ) : (
            <p className="muted">Create a Requirement Brief before code generation.</p>
          )}
          <button disabled={!brief || isRunning} onClick={runAgents}>
            {isRunning ? 'Coding Bot running mini-bots...' : 'Approve Brief and Run Coding Bot'}
          </button>
        </section>

        {bundle && (
          <section className="panel">
            <h2>Agent Run</h2>
            <div className="agent-grid" data-testid="agent-results">
              {bundle.results.map((result) => (
                <article key={result.taskId} className="agent-card">
                  <strong>{result.role}</strong>
                  <span>{result.summary}</span>
                </article>
              ))}
            </div>
            <h3>Security Review</h3>
            <p className={bundle.securityReview.approved ? 'approved' : 'blocked'}>
              {bundle.securityReview.approved ? 'Approved for beta artifact release' : 'Blocked'}
            </p>
            <ul>
              {bundle.securityReview.findings.map((finding) => (
                <li key={finding}>{finding}</li>
              ))}
            </ul>
          </section>
        )}

        {generatedArtifacts.length > 0 && (
          <section className="panel">
            <h2>Generated Artifacts</h2>
            {generatedArtifacts.map((artifact) => (
              <details key={artifact.id} open={artifact.kind === 'solidity'}>
                <summary>{artifact.filename}</summary>
                <pre className="code-block">{artifact.content}</pre>
              </details>
            ))}
          </section>
        )}

        {bundle && (
          <section className="panel">
            <h2>Evidence Pack</h2>
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
                ? 'Backend mock response.'
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
