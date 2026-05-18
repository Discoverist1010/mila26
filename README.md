# MILA26

MILA26 is a clean beta rebuild of the MILA dashboard. It is designed as a compact CTO and developer team for a small asset manager preparing tokenized products.

## Beta Capabilities

- Blockchain Engineer Bot: guides non-technical users and creates a structured requirement brief.
- Coding Bot: coordinates implementation and spawns parallel mini-bots.
- Mini Coding Bots: generate contract, API, frontend, and test artifacts in parallel.
- Security Reviewer Bot: blocks unsafe outputs before release.
- Evidence & Documentation Bot: creates asset-manager-facing evidence packs.
- Deploy Simulation: creates a deployment manifest without enabling live deployment.

## Development

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run check
npm run test:e2e
```

## Security Defaults

- No secrets are committed.
- No API keys, seed phrases, or private keys are accepted into chat.
- Real deployment is disabled unless `ENABLE_REAL_DEPLOY=true`.
- Generated code and model output are rendered as text, not raw HTML.

## Legacy Policy

The previous MILA dashboard repo is reference-only. Do not copy its history, hardcoded proxy files, debug HTML sandboxes, giant HTML entrypoints, or browser secret storage into this repo.
