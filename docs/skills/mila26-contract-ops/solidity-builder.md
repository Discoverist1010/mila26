# Solidity Builder

Purpose: plan or generate Solidity changes from a confirmed Contract Ops specification.

Use when:
- a confirmed spec requires Solidity generation or modification;
- a protocol/template selection needs an implementation plan.

Required inputs:
- confirmed contract spec;
- selected protocol/template;
- role model;
- evidence event requirements;
- current Hardhat/OpenZeppelin constraints.

Allowed outputs:
- implementation plan;
- Solidity draft artifact;
- ABI/event requirements;
- migration notes for future adapters.

Forbidden:
- do not deploy generated code;
- do not generate code from unconfirmed chat text;
- do not reinvent ERC primitives when OpenZeppelin covers them;
- do not add upgradeability unless explicitly required.

Evaluation fixtures:
- whitelist + mint + burn + pause -> OpenZeppelin AccessControl/Pausable plan.
- ERC-4626 selected -> state that adapter work is required before deploy if not implemented.
