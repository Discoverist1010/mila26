const domainItems = [
  {
    title: 'AI Copilot',
    description:
      'Captures product intent, asks missing lifecycle questions, and keeps requirements, parameters, evidence, and next actions aligned.',
  },
  {
    title: 'Blockchain Engineering',
    description:
      'Structures wallet whitelisting, subscription-redemption parameters, smart-contract handoff, and wallet-signed Sepolia evidence.',
  },
  {
    title: 'Distribution & Asset Servicing Ops',
    description:
      'Supports investor registry, subscription and redemption workflows, NAV updates, notices, corporate actions, maturity planning, and evidence surfaces.',
  },
];

const lifecycleItems = [
  {
    title: 'Guided lifecycle workspace',
    description: 'One place to define requirements, investors, subscription, redemption, servicing, maturity, and evidence.',
  },
  {
    title: 'Investor wallet registry for up to 50 wallets',
    description: 'Keeps distribution constrained to registered wallet addresses for the MVP workflow.',
  },
  {
    title: 'Subscription and redemption parameter capture',
    description: 'Captures permitted stablecoins, payment-per-token, redemption wallet, payout asset, and delay settings.',
  },
  {
    title: 'Sepolia wallet-signed evidence path',
    description: 'Shows wallet-signed testnet operations and evidence without backend private-key custody.',
  },
];

const qaItems = [
  'Code, UX, security, Solidity, and release review gates',
  'Tests for shared lifecycle state and wallet boundaries',
  'No mainnet, custody, audit, legal, or advice overclaims',
];

export function WebsiteLanding() {
  return (
    <main className="website-page" aria-label="MILA26 company and product website">
      <section className="website-hero">
        <div className="website-hero-copy">
          <a className="website-brand" href="/site" aria-label="MILA26 home">
            <span>M26</span>
            MILA26
          </a>
          <p className="eyebrow">AI tokenisation copilot</p>
          <h1>AI, blockchain, and asset servicing for tokenised investment products.</h1>
          <p className="website-lede">
            MILA26 helps asset managers turn investment strategies into structured tokenisation workflows. It coordinates
            AI guidance, blockchain execution planning, and distribution/post-trade servicing so the manager can focus on
            portfolio decisions.
          </p>
          <div className="website-actions" aria-label="Website access actions">
            <a className="primary-link" href="/">
              Open app workspace
            </a>
            <a className="secondary-link" href="mailto:hello@mila26.ai?subject=MILA26%20beta%20access">
              Request beta access
            </a>
          </div>
          <p className="website-boundary">Controlled MVP access. Ethereum Sepolia/testnet only. User wallet signs.</p>
        </div>
        <figure className="website-product-preview">
          <img src="/mila26-product-preview.png" alt="MILA26 lifecycle workspace showing redemption parameters and template handoff" />
          <figcaption>Working lifecycle workspace preview</figcaption>
        </figure>
      </section>

      <section className="website-section" aria-label="Three domain workstreams">
        <div>
          <p className="eyebrow">Operating model</p>
          <h2>Three specialist workstreams in one workspace.</h2>
          <p className="website-section-copy">
            A tokenised product usually needs blockchain engineering, investor distribution operations, post-trade
            servicing, and AI-enabled workflow support. MILA26 brings those workstreams into one guided product workspace.
          </p>
        </div>
        <div className="website-card-grid three-domain-grid">
          {domainItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="website-section" aria-label="Product overview">
        <div>
          <p className="eyebrow">Product</p>
          <h2>One workspace across the tokenised product lifecycle.</h2>
        </div>
        <div className="website-card-grid">
          {lifecycleItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="website-section muted-band" aria-label="Quality assurance">
        <div>
          <p className="eyebrow">Quality Assurance</p>
          <h2>Built with explicit review gates and no-overclaim rules.</h2>
        </div>
        <ul className="website-checklist">
          {qaItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="website-access" aria-label="Access path">
        <div>
          <p className="eyebrow">Access</p>
          <h2>Private MVP path for invited users and beta testers.</h2>
          <p>
            Start in the app workspace for local/Sepolia testing. Website access does not store project lifecycle data or
            replace the app workspace.
          </p>
        </div>
        <a className="primary-link" href="/">
          Continue to MILA26 app
        </a>
      </section>
    </main>
  );
}
