# MILA26 Website MVP Brief

## Purpose

The website exists to make MILA26 credible and understandable before a user enters the app. It should introduce the company/product, explain the controlled MVP path, and route approved users into the tokenisation workspace.

The website is not the product workspace. It should not duplicate the lifecycle app, create a second source of project state, or imply production, mainnet, audit, legal, tax, accounting, KYC/AML, custody, or investment-advice approval.

## Target Users

- asset managers or tokenised-product founders evaluating MILA26;
- beta testers who need controlled access to the app;
- investors or reviewers who need a plain-language understanding of what the product does;
- internal stakeholders preparing September-October 2026 investor and beta rounds.

## MVP Pages

### Home

Goal: explain MILA26 in one first impression.

Must include:

- MILA26 name and product category: AI tokenisation copilot;
- plain-language outcome: structure a financial product into a testnet-ready tokenisation workflow;
- user meaning: less coordination burden, safer code path, less throwaway effort, and clearer evidence for investor/auditor review conversations;
- controlled MVP boundary: Sepolia/testnet and wallet-signed operations only;
- primary action: request access or log in;
- secondary action: view product overview or quality assurance.

Must avoid:

- generic Web3 hype;
- production deployment claims;
- advice, return, compliance, audit, or mainnet claims.

### Product

Goal: explain the app lifecycle without exposing internal implementation tracks.

Must include:

- guided lifecycle workspace;
- Engineering Bot cross-stage support;
- investor wallet registry for up to 50 wallets;
- subscription and redemption parameter capture;
- subscription-redemption smart-contract template handoff;
- asset servicing and evidence surfaces;
- a clear explanation that current local/Sepolia work is structured so it can become durable project records later, while durable Evidence Vault persistence remains a future implementation;
- clear labels for currently working MVP functions versus unavailable capabilities that still need explicit implementation gates.

### Quality Assurance

Goal: show that MILA26 is built with disciplined review and release controls.

Must include:

- code review, UX review, security review, Solidity review, state/performance review, and release gates;
- tests and evidence expectations;
- no-overclaim policy;
- linkable source from `docs/product/quality-assurance.md`.

### Access

Goal: route users into the app without pretending the MVP is open production software.

Must include:

- controlled access/login entry point;
- beta tester or invited user pathway;
- clear testnet-only expectation;
- privacy and wallet boundary summary.

MVP implementation may start with a simple controlled access gate before full authentication, but the app must clearly distinguish invited/beta access from public production availability.

### Contact Or Beta Interest

Goal: capture serious interest for September-October 2026 beta and investor rounds.

Must include:

- contact or waitlist form;
- intended user type;
- organization;
- email;
- optional product interest note.

Do not collect sensitive financial documents through the website in the first website slice.

## App Boundary

The website can route users to the MILA26 app, but product state belongs inside the app:

- project lifecycle state remains in the app;
- wallet connection happens in the app;
- generated artifacts are created in the app;
- evidence surfaces are shown in the app;
- website login/access state must not become a second lifecycle state model.

## First Implementation Slice

The first feasible website coding slice should deliver:

1. a Home/Product page with restrained first-viewport messaging;
2. a Quality Assurance page or section adapted from `docs/product/quality-assurance.md`;
3. an Access page or gate that routes to the local app shell;
4. no backend auth yet unless the app persistence/access design is ready;
5. basic responsive layout and smoke coverage.

## Acceptance Criteria

- Website copy is specific to MILA26 and tokenisation, not generic SaaS filler.
- Website copy translates technical features into practical user meaning.
- Website does not expose internal track labels.
- Website does not make legal, audit, investment-advice, custody, production, or mainnet claims.
- Access flow clearly routes into the app.
- Website and app do not duplicate lifecycle state.
- Responsive layout works on desktop and mobile.
- Tests or smoke checks cover the main route and access link.
