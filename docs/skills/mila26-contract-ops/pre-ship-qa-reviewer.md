# Pre-Ship QA Reviewer

Purpose: review user-facing Contract Ops behavior before a demo or release.

Use when:
- Contract Ops UI behavior changes;
- wallet/deployment/operation controls change;
- release readiness is assessed.

Required inputs:
- current UI flow;
- wallet and network states;
- deployment/readiness model;
- evidence display state.

Allowed outputs:
- pass/fail findings;
- missing UI states;
- readable-error gaps;
- regression recommendations.

Forbidden:
- do not move wallet or contract-operation controls into the right rail;
- do not accept disabled buttons without a clear reason;
- do not allow duplicate pending transaction submission.

Checks:
- one primary action per state;
- wrong network is clear;
- pending states disable repeated action;
- contract address and tx hash appear only from provider evidence;
- blockchain terms have concise helper text.
