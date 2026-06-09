import { useEffect } from 'react';

const navItems = [
  { label: 'Product', href: '#product' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Evidence', href: '#evidence' },
  { label: 'Quality', href: '#quality' },
  { label: 'Access', href: '#access' },
  { label: 'Contact', href: '#contact' },
];

const domainItems = [
  {
    title: 'AI turns intent into a buildable workflow',
    proof: 'Engineering Bot, Requirement Brief, Engineering Brief, and cross-stage next actions.',
    description:
      'The asset manager explains the product once. ZiLiOS structures the lifecycle questions, parameters, documents, and next steps.',
  },
  {
    title: 'Blockchain actions stay gated and wallet-signed',
    proof: 'MetaMask/EIP-1193, Sepolia-only checks, deployment evidence, NAV, whitelist, and Allocation/Mint operations.',
    description:
      'Users can prove the testnet path without giving ZiLiOS private keys or accepting fake transaction evidence.',
  },
  {
    title: 'Distribution and servicing are designed in from the start',
    proof: 'Investor registry, subscription/redemption parameters, NAV events, servicing tabs, maturity planning, and evidence surfaces.',
    description:
      'Tokenisation is treated as an operating lifecycle, not just a contract-generation exercise.',
  },
];

const lifecycleItems = [
  {
    title: 'Know the next step without knowing every blockchain step',
    description: 'One guided workspace covers requirements, investors, subscription, redemption, servicing, maturity, and evidence.',
  },
  {
    title: 'Keep distribution tied to named wallet rules',
    description: 'The MVP registry supports up to 50 wallet addresses with validation, whitelist handoff, and demo wallet setup.',
  },
  {
    title: 'Define cash-flow rules before coding them',
    description: 'Subscription and redemption inputs capture permitted stablecoins, payment-per-token, redemption wallet, payout asset, and delay settings.',
  },
  {
    title: 'Show technical progress with evidence',
    description: 'Wallet-signed Sepolia operations produce provider-returned hashes, receipt-derived addresses, and local-session evidence surfaces.',
  },
];

const workflowItems = [
  {
    step: '01',
    title: 'Define the product',
    description:
      'Capture product type, investor limits, wallet rules, subscription assets, redemption timing, and open decisions in one Product Setup flow.',
  },
  {
    step: '02',
    title: 'Prepare controlled distribution',
    description:
      'Build a test investor wallet registry, validate up to 50 wallet addresses, and hand approved wallets into whitelist and allocation operations.',
  },
  {
    step: '03',
    title: 'Turn rules into artifacts',
    description:
      'Generate requirement, engineering, contract, check, and evidence surfaces from approved parameters instead of scattered notes.',
  },
  {
    step: '04',
    title: 'Prove the Sepolia path',
    description:
      'Use wallet-signed deployment, NAV, whitelist, and Allocation/Mint operations with provider-returned hashes and receipt-confirmed evidence.',
  },
];

const userMeaningItems = [
  {
    title: 'Less coordination burden',
    description:
      'ZiLiOS brings AI workflow support, blockchain execution planning, and servicing operations into one workspace so fewer details fall between teams.',
  },
  {
    title: 'Safer technical path',
    description:
      'The app keeps mainnet, custody, audit, legal, and advice claims out of the MVP while real wallet actions remain user-signed on Sepolia.',
  },
  {
    title: 'Less throwaway effort',
    description:
      'Requirements, parameters, wallet rules, artifacts, and evidence are structured as reusable project work, not a one-off demo script. Production deployment still requires later review gates.',
  },
  {
    title: 'Clearer proof for stakeholders',
    description:
      'The workspace produces requirement, engineering, contract, and evidence surfaces that can support investor, auditor, and internal review conversations.',
  },
];

const qaItems = [
  'Code, UX, security, Solidity, state/performance, and release review gates reduce brittle implementation risk.',
  'Regression and e2e tests check shared lifecycle state, wallet boundaries, and no-overclaim rules.',
  'Evidence labels distinguish local-session, provider-returned, and receipt-confirmed data.',
  'No mainnet, custody, audit, legal, KYC, or investment-advice claim is made by the MVP.',
];

const statusItems = [
  {
    label: 'Working MVP',
    title: 'Local/Sepolia workflow',
    detail:
      'Guided Product Setup, investor wallet registry, subscription/redemption parameters, wallet-signed Sepolia operations, and backend-backed project/evidence records.',
  },
  {
    label: 'Controlled boundary',
    title: 'Private beta access',
    detail:
      'Invited users can evaluate the workflow and evidence path. The website does not collect lifecycle data or turn the MVP into public production software.',
  },
  {
    label: 'Still gated',
    title: 'Production-grade launch items',
    detail:
      'Mainnet deployment, live subscription/redemption payments, custody, legal/compliance approval, full auth, payments, and production audit remain outside this MVP.',
  },
];

export function WebsiteLanding() {
  useEffect(() => {
    document.title = 'ZiLiOS';
  }, []);

  return (
    <main className="website-page" aria-label="ZiLiOS company and product website">
      <header className="website-topbar">
        <a className="website-brand compact" href="/site" aria-label="ZiLiOS home">
          <img src="/assets/brand/kangle-ai-logo.png" alt="" aria-hidden="true" />
          ZiLiOS
        </a>
        <nav className="website-nav" aria-label="ZiLiOS website navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <a className="nav-cta" href="mailto:hello@mila26.ai?subject=ZiLiOS%20beta%20access">
          Request access
        </a>
      </header>

      <section className="website-hero">
        <div className="website-hero-copy">
          <a className="website-brand" href="/site" aria-label="ZiLiOS home">
            <img src="/assets/brand/kangle-ai-logo.png" alt="" aria-hidden="true" />
            ZiLiOS
          </a>
          <p className="eyebrow">AI tokenisation copilot</p>
          <h1>Tokenise an investment product without building the full technical and ops teams first.</h1>
          <p className="website-lede">
            ZiLiOS is an AI-guided system that helps asset managers turn investment ideas into tokenised offerings: from
            requirements, distribution to subscriptions, redemptions, valuation, asset servicing, and blockchain
            execution in one workflow.
          </p>
          <div className="website-actions" aria-label="Website access actions">
            <a className="primary-link" href="/">
              Open app workspace
            </a>
            <a className="secondary-link" href="mailto:hello@mila26.ai?subject=ZiLiOS%20beta%20access">
              Request beta access
            </a>
          </div>
          <p className="website-boundary">Controlled MVP access. Ethereum Sepolia/testnet only. User wallet signs.</p>
          <div className="website-proof-strip" aria-label="Hero proof points">
            <span>AI structures the work</span>
            <span>User wallet signs</span>
            <span>Evidence stays reviewable</span>
            <span>No backend private-key custody</span>
          </div>
        </div>
        <figure className="website-product-preview">
          <img src="/mila26-product-preview.png" alt="ZiLiOS lifecycle workspace showing redemption parameters and template handoff" />
          <figcaption>Working lifecycle workspace preview</figcaption>
        </figure>
      </section>

      <section className="website-company-band" aria-label="Company positioning">
        <div>
          <p className="eyebrow">Company</p>
          <h2>Purpose-built infrastructure for the next generation of tokenised investment products.</h2>
        </div>
        <div className="website-company-copy">
          <p>
            ZilIOS believes tokenised investment products should be easier to create, test, and launch responsibly. We
            help asset managers, founders, and product teams move from idea to blockchain-aware workflows through
            AI-supported structuring, post-trade operating processes, servicing records, and evidence-ready activity
            trails.
          </p>
          <p>
            ZilIOS is for builders who want to move the next gen of finance forward using blockchain.
          </p>
        </div>
      </section>

      <section className="website-section" aria-label="What ZiLiOS means for users">
        <div>
          <p className="eyebrow">User outcome</p>
          <h2>Less uncertainty between product idea and technical proof.</h2>
          <p className="website-section-copy">
            Tokenising a product creates practical questions about code safety, effort reuse, investor communications,
            redemption mechanics, and review evidence. ZiLiOS makes those questions visible before they become expensive.
          </p>
        </div>
        <div className="website-card-grid">
          {userMeaningItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="website-section" aria-label="Three domain workstreams">
        <div>
          <p className="eyebrow">Operating model</p>
          <h2>AI, blockchain, and post-trade operations stay connected.</h2>
          <p className="website-section-copy">
            A tokenised product usually needs blockchain engineering, investor distribution operations, post-trade
            servicing, and AI-enabled workflow support. ZiLiOS connects those workstreams so the asset manager can focus
            on investment decisions.
          </p>
        </div>
        <div className="website-card-grid three-domain-grid">
          {domainItems.map((item) => (
            <article key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
              <small>{item.proof}</small>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="website-section" aria-label="Product overview">
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

      <section id="workflow" className="website-section workflow-band" aria-label="Workflow path">
        <div>
          <p className="eyebrow">Workflow</p>
          <h2>From product intent to a reviewable Sepolia operation path.</h2>
          <p className="website-section-copy">
            The site should make the path legible before a user enters the app: define the product, prepare wallet
            distribution, generate artifacts, and prove only what the MVP can actually prove.
          </p>
        </div>
        <div className="website-workflow-list">
          {workflowItems.map((item) => (
            <article key={item.step}>
              <span>{item.step}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="evidence" className="website-section" aria-label="Persistence and evidence direction">
        <div>
          <p className="eyebrow">From demo to durable work</p>
          <h2>Designed so useful work does not have to be thrown away.</h2>
        </div>
        <div className="website-proof-list">
          <article>
            <strong>Current MVP boundary</strong>
            <p>
              The app runs as a working local/Sepolia prototype. Durable evidence and generated artifacts now persist
              through the backend; active wallet state remains local-session-only.
            </p>
          </article>
          <article>
            <strong>Persistence decision</strong>
            <p>
              Project, lifecycle, investor registry, artifact, and evidence records sit behind a SQLite-backed local MVP
              storage boundary, so the app can evolve without browser-state lock-in.
            </p>
          </article>
          <article>
            <strong>User meaning</strong>
            <p>
              Requirements, parameters, smart-contract artifacts, and provider-derived evidence can become a reviewable
              project record, instead of remaining screenshots or scattered demo notes.
            </p>
          </article>
        </div>
      </section>

      <section className="website-status-band" aria-label="MVP status and boundaries">
        <div>
          <p className="eyebrow">Status</p>
          <h2>Clear about what works, what is controlled, and what remains gated.</h2>
        </div>
        <div className="website-status-grid">
          {statusItems.map((item) => (
            <article key={item.label}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="quality" className="website-section muted-band" aria-label="Quality assurance">
        <div>
          <p className="eyebrow">Quality Assurance</p>
          <h2>Built to reduce brittle code and unsupported claims.</h2>
          <p className="website-section-copy">
            ZiLiOS uses review gates and drift checks because asset managers, investors, and auditors need to know what
            is implemented, what is evidence-backed, and what still requires approval.
          </p>
        </div>
        <ul className="website-checklist">
          {qaItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="access" className="website-access" aria-label="Access path">
        <div>
          <p className="eyebrow">Access</p>
          <h2>Private MVP path for invited users and beta testers.</h2>
          <p>
            Start in the app workspace for local/Sepolia testing. The website does not store lifecycle data or replace
            the app workspace as the source of truth.
          </p>
        </div>
        <a className="primary-link" href="/">
          Continue to ZiLiOS app
        </a>
      </section>

      <section id="contact" className="website-contact" aria-label="Contact and beta interest">
        <div>
          <p className="eyebrow">Contact</p>
          <h2>Request a beta conversation without sending sensitive documents.</h2>
          <p>
            Share only business contact details and a short description of the product category you want to test. ZiLiOS
            does not need private keys, seed phrases, offering documents, investor lists, or confidential financial files
            through this website.
          </p>
        </div>
        <form
          className="website-contact-form"
          action="mailto:hello@mila26.ai?subject=ZiLiOS%20beta%20interest"
          method="post"
          encType="text/plain"
        >
          <label>
            User type
            <select name="user_type" defaultValue="asset_manager">
              <option value="asset_manager">Asset manager</option>
              <option value="tokenised_product_founder">Tokenised product founder</option>
              <option value="beta_reviewer">Beta reviewer</option>
              <option value="investor_or_stakeholder">Investor or stakeholder</option>
            </select>
          </label>
          <label>
            Organisation
            <input name="organisation" type="text" autoComplete="organization" placeholder="Company or fund name" />
          </label>
          <label>
            Work email
            <input name="email" type="email" autoComplete="email" placeholder="name@company.com" />
          </label>
          <label>
            Product interest
            <textarea
              name="product_interest"
              rows={4}
              placeholder="Briefly describe the tokenised product type or beta review goal."
            />
          </label>
          <button type="submit">Send beta interest</button>
          <p>Submits through your email client; no website database or lifecycle workspace record is created.</p>
        </form>
      </section>
    </main>
  );
}
