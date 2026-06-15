import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';

const heroPills = [
  'AI structures the work',
  'User wallet signs',
  'Evidence stays reviewable',
  'No backend private-key custody',
];

const userOutcomeItems = [
  {
    title: 'Less coordination burden',
    description:
      'Test a tokenisation idea before depending on broader teams or external developers. The workflow keeps sensitive assumptions tighter, reduces avoidable coordination, and makes smart-contract outputs easier to inspect.',
  },
  {
    title: 'Safer technical path',
    description:
      'The app keeps mainnet, custody, audit, legal, and advice claims out of the MVP while real wallet actions remain user-signed on testnet.',
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

const operatingModelItems = [
  {
    title: 'AI turns intent into a buildable workflow',
    description:
      'The asset manager explains the product once. ZiLiOS structures the lifecycle questions, parameters, documents, and next steps.',
    tag: 'Engineering Bot, Requirement Brief, Engineering Brief, and cross-stage next actions.',
  },
  {
    title: 'Blockchain actions stay gated and wallet-signed',
    description:
      'Users can prove the testnet path without giving ZiLiOS private keys or accepting fake transaction evidence.',
    tag: 'MetaMask/EIP-1193, Sepolia-only checks, deployment evidence, NAV, whitelist, and Allocation/Mint operations.',
  },
  {
    title: 'Distribution and servicing are designed in from the start',
    description: 'Tokenisation is treated as an operating lifecycle, not just a contract-generation exercise.',
    tag: 'Investor registry, subscription/redemption parameters, NAV events, servicing tabs, maturity planning, and evidence surfaces.',
  },
];

const productItems = [
  {
    title: 'Know the next step without knowing every blockchain step',
    description:
      'One guided workspace covers requirements, investors, subscription, redemption, servicing, maturity, and evidence.',
    featured: true,
  },
  {
    title: 'Keep distribution tied to named wallet rules',
    description:
      'The MVP registry supports up to 50 wallet addresses with validation, whitelist handoff, and demo wallet setup.',
  },
  {
    title: 'Define cash-flow rules before coding them',
    description:
      'Subscription and redemption inputs capture permitted stablecoins, payment-per-token, redemption wallet, payout asset, and delay settings.',
  },
  {
    title: 'Show technical progress with evidence',
    description:
      'Wallet-signed Sepolia operations produce provider-returned hashes, receipt-derived addresses, and local-session evidence surfaces.',
  },
];

type Expertise = 'blockchain' | 'investments' | 'post_trade' | 'other';

const expertiseLabels: Record<Expertise, string> = {
  blockchain: 'Blockchain',
  investments: 'Investments',
  post_trade: 'Funds/product post-trade',
  other: 'Others: please specify',
};

export function WebsiteLanding() {
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);
  const [expertise, setExpertise] = useState<Expertise>('blockchain');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'ZiLiOS';
  }, []);

  useEffect(() => {
    if (!isBetaModalOpen) {
      return;
    }

    nameInputRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsBetaModalOpen(false);
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isBetaModalOpen]);

  function openBetaModal() {
    setIsBetaModalOpen(true);
  }

  function closeBetaModal() {
    setIsBetaModalOpen(false);
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      closeBetaModal();
    }
  }

  function handleBetaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const selectedExpertise = String(form.get('domain_expertise') ?? '');
    const otherExpertise = String(form.get('other_domain_expertise') ?? '').trim();
    const expertiseLabel =
      selectedExpertise === 'other'
        ? `Others: ${otherExpertise || 'please specify'}`
        : expertiseLabels[selectedExpertise as Expertise] ?? selectedExpertise;

    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Domain expertise: ${expertiseLabel}`,
    ].join('\n');

    window.location.href = `mailto:hello@mila26.ai?subject=${encodeURIComponent(
      'ZiLiOS beta access request',
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main className="zilios-site" aria-label="ZiLiOS company and product website">
      <header className="zilios-hero">
        <svg className="zilios-hero-bg" viewBox="0 0 1280 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path
            className="zilios-trace zilios-trace-1"
            d="M520 80 C 760 40, 900 220, 1180 140 S 1340 260, 1480 200"
            stroke="#5DCAA5"
            strokeWidth="1.5"
            opacity="0.3"
          />
          <path
            className="zilios-trace zilios-trace-2"
            d="M460 320 C 700 380, 880 240, 1100 360 S 1320 320, 1480 420"
            stroke="#5DCAA5"
            strokeWidth="1.5"
            opacity="0.22"
          />
          <path
            className="zilios-trace zilios-trace-3"
            d="M600 540 C 820 480, 980 600, 1180 500 S 1360 560, 1480 520"
            stroke="#EF9F27"
            strokeWidth="1.5"
            opacity="0.22"
          />
          <rect className="zilios-token" x="897" y="217" width="8" height="8" fill="#EF9F27" opacity="0.5" transform="rotate(45 901 221)" />
          <rect className="zilios-token" x="1097" y="357" width="8" height="8" fill="#5DCAA5" opacity="0.5" transform="rotate(45 1101 361)" />
          <rect className="zilios-token" x="977" y="597" width="8" height="8" fill="#EF9F27" opacity="0.5" transform="rotate(45 981 601)" />
        </svg>

        <div className="zilios-page zilios-hero-inner">
          <a className="zilios-brand" href="/site" aria-label="ZiLiOS home">
            <img src="/assets/brand/kangle-ai-logo.png" alt="" aria-hidden="true" />
            <span>ZiLiOS</span>
          </a>
          <div className="zilios-eyebrow">AI tokenisation copilot</div>
          <h1>Tokenise an investment product without building the full technical and ops teams first.</h1>
          <p className="zilios-hero-sub">
            ZiLiOS is an AI-guided system that helps asset managers turn investment ideas into tokenised offerings: from
            requirements, distribution to subscriptions, redemptions, valuation, asset servicing, and blockchain
            execution in one workflow.
          </p>
          <div className="zilios-hero-actions" aria-label="Website access actions">
            <a className="zilios-button zilios-button-primary" href="/">
              Open app workspace
            </a>
            <button className="zilios-button zilios-button-secondary" type="button" onClick={openBetaModal}>
              Request beta access
            </button>
          </div>
          <p className="zilios-hero-note">Controlled MVP access. Ethereum Sepolia/testnet only. User wallet signs.</p>
          <div className="zilios-hero-pills" aria-label="Hero proof points">
            {heroPills.map((pill) => (
              <span className="zilios-pill" key={pill}>
                {pill}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="zilios-page">
        <section className="zilios-company" aria-label="Company positioning">
          <div className="zilios-eyebrow">Company</div>
          <h2>Infrastructure for tokenised investment products, from workflow design to testnet deployment.</h2>
          <blockquote>
            <p>
              ZiLiOS is for builders who want to move tokenised finance forward responsibly — helping asset managers
              launch and adopt tokenised products through AI-guided structuring, blockchain-informed workflows, and
              post-trade domain expertise.
            </p>
          </blockquote>
        </section>
      </div>

      <div className="zilios-page">
        <div className="zilios-spine-wrap">
          <aside className="zilios-spine" aria-hidden="true">
            <div className="zilios-spine-line" />
            <div className="zilios-spine-marker">01</div>
            <div className="zilios-spine-marker">02</div>
            <div className="zilios-spine-marker">03</div>
          </aside>

          <div className="zilios-section-stack">
            <section className="zilios-section" id="user-outcome" aria-label="User outcome">
              <div className="zilios-section-text">
                <div className="zilios-eyebrow">
                  <span>01</span> User outcome
                </div>
                <h2>Less uncertainty between product idea and technical proof</h2>
                <p>
                  Tokenising a product creates practical questions about code safety, effort reuse, investor
                  communications, redemption mechanics, and review evidence. ZiLiOS helps users address those questions
                  before they become expensive.
                </p>
              </div>
              <div className="zilios-card-grid zilios-card-grid-2">
                {userOutcomeItems.map((item) => (
                  <article className="zilios-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="zilios-section zilios-section-full" id="operating-model" aria-label="Operating model">
              <div className="zilios-section-text">
                <div className="zilios-eyebrow">
                  <span>02</span> Operating model
                </div>
                <h2>AI, blockchain, and post-trade operations stay connected</h2>
                <p>
                  A tokenised product usually needs blockchain engineering, investor distribution operations, post-trade
                  servicing, and AI-enabled workflow support. ZiLiOS connects those workstreams so the asset manager can
                  focus on investment decisions.
                </p>
              </div>
              <div className="zilios-card-grid zilios-card-grid-3">
                {operatingModelItems.map((item) => (
                  <article className="zilios-card" key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="zilios-card-tag">{item.tag}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="zilios-section zilios-section-reverse" id="product" aria-label="Product overview">
              <div className="zilios-section-text">
                <div className="zilios-eyebrow">
                  <span>03</span> Product
                </div>
                <h2>One workspace across the tokenised product lifecycle</h2>
                <p>
                  One guided workspace covers requirements, investors, subscription, redemption, servicing, maturity,
                  and evidence — without requiring the asset manager to know every blockchain step.
                </p>
              </div>
              <div className="zilios-card-grid zilios-card-grid-2">
                {productItems.map((item) => (
                  <article className={item.featured ? 'zilios-card zilios-card-featured' : 'zilios-card'} key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="zilios-page zilios-footer">
        <span>ZiLiOS</span>
        <span>Tokenisation, structured.</span>
      </footer>

      {isBetaModalOpen ? (
        <div className="zilios-modal-backdrop" onMouseDown={closeOnBackdrop}>
          <section className="zilios-modal" role="dialog" aria-modal="true" aria-labelledby="zilios-beta-title">
            <button className="zilios-modal-close" type="button" onClick={closeBetaModal} aria-label="Close beta request form">
              ×
            </button>
            <div className="zilios-eyebrow">Controlled beta</div>
            <h2 id="zilios-beta-title">Request beta access</h2>
            <p className="zilios-modal-intro">
              Share a few details so we can understand the right beta conversation. Do not send private keys, seed
              phrases, offering documents, investor lists, or confidential financial files.
            </p>
            <form className="zilios-beta-form" onSubmit={handleBetaSubmit}>
              <label>
                Name
                <input ref={nameInputRef} name="name" type="text" autoComplete="name" required />
              </label>
              <label>
                Email
                <input name="email" type="email" autoComplete="email" required />
              </label>
              <label>
                Domain expertise
                <select
                  name="domain_expertise"
                  value={expertise}
                  onChange={(event) => setExpertise(event.target.value as Expertise)}
                >
                  <option value="blockchain">Blockchain</option>
                  <option value="investments">Investments</option>
                  <option value="post_trade">Funds/product post-trade</option>
                  <option value="other">Others: please specify</option>
                </select>
              </label>
              {expertise === 'other' ? (
                <label>
                  Please specify
                  <input name="other_domain_expertise" type="text" required />
                </label>
              ) : null}
              <button className="zilios-button zilios-button-primary" type="submit">
                Send request
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
