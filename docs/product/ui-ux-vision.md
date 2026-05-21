# MILA26 UI/UX Vision

## Product UX Identity

MILA26 should become a professional AI + blockchain project workspace for asset managers preparing tokenized portfolio products.

Approved near-term UX direction reference:

```text
docs/assets/ux/mila26_dashboard_v2.png
```

This mockup is the canonical near-term direction for layout, tone, and product surface planning. It is not a pixel-perfect implementation mandate.

The interface should feel familiar like an enhanced ChatGPT-style workspace, but it should not become a plain chat clone. MILA26 needs visible project state, workflow gates, agent progress, wallet/deployment controls, evidence packs, and project folders.

Visual identity:

- Professional dark navy, silver-blue, and institutional trust aesthetic.
- Clean, high-trust, slightly futuristic tone.
- Prominent KangLe AI / MILA26 branding.
- Prominent current project name.
- Asset-manager-friendly language and structure.
- Avoid crypto-casino aesthetics, meme-token visuals, neon clutter, or speculative trading energy.

## Core Layout Thesis

- Enhanced ChatGPT-style shell for familiarity.
- F-layout for scanability: left navigation, top project context, central work area, right status panel.
- K-style workflow spine inside the project workspace: requirements -> PRD -> build -> QA/security -> deploy -> distribute -> valuation/evidence.
- Chat-first, but not chat-only.
- State should not be hidden inside chat; important decisions must become structured cards, gates, and status panels.

## Main UI Regions

- Collapsible left sidebar: project folders, recent projects, KangLe AI / MILA26 brand, core navigation.
- Prominent top project bar: current project name, protocol, network, wallet status, and services/cart entry.
- Central chat/workspace: Blockchain Engineering Bot conversation plus structured workspace content.
- Extracted requirement cards: protocol choice, whitelist, allocation, valuation update, deployment model, security gates.
- Contextual slide-over drawer: focused sub-actions such as whitelist configuration, allocation rules, protocol rationale, or valuation upload requirements.
- Collapsible right project panel: project status, next action, agent progress, deployment gate, and evidence status.

## Key UX Principles

- Always show current project context.
- Always show protocol, network, and wallet status.
- Convert chat decisions into structured requirement cards.
- Use drawers for sub-actions so users do not feel lost.
- Use clear next actions and workflow gates.
- Show agent progress visibly.
- Keep financial, legal, deployment, and audit disclaimers clear.
- Keep the experience calm, professional, and funding-demo credible.
- Avoid dashboard clutter; the main surface should prioritize the next decision and current workflow state.

## Branding

Canonical MVP logo asset path:

```text
public/assets/brand/kangle-ai-logo.png
```

Use the logo in the top-left sidebar/header area. The brand should read as a credible AI engineering workspace for tokenized funds, not as a retail trading product.

## Future Paid Services / Cart

Place a services/cart icon after wallet status in the top project bar. Label it as `Services` or `Add Services` rather than only `Shopping Cart`.

Future uses:

- AI smart contract audit.
- External audit handoff.
- Premium evidence pack.
- Deployment support.

Do not implement payment logic yet.
