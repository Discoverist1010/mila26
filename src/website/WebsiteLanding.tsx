const lifecycleItems = [
  'Guided lifecycle workspace',
  'Investor wallet registry for up to 50 wallets',
  'Subscription and redemption parameter capture',
  'Sepolia wallet-signed evidence path',
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
          <h1>Turn a financial product into a structured tokenisation workflow.</h1>
          <p className="website-lede">
            MILA26 helps an asset manager define product requirements, investor wallet rules, subscription and redemption
            parameters, smart-contract handoff, and Sepolia evidence from one guided workspace.
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

      <section className="website-section" aria-label="Product overview">
        <div>
          <p className="eyebrow">Product</p>
          <h2>One workspace across the tokenised product lifecycle.</h2>
        </div>
        <div className="website-card-grid">
          {lifecycleItems.map((item) => (
            <article key={item}>
              <strong>{item}</strong>
              <p>Designed as shared product state, not separate tab silos.</p>
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
