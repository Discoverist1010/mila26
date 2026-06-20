# Contract Test Planner

Purpose: design focused tests for Solidity and Contract Ops domain behavior.

Use when:
- contract specs change;
- Solidity changes;
- deployment/readiness rules change.

Required inputs:
- contract spec;
- source or planned source;
- current test toolchain;
- known release gates.

Allowed outputs:
- unit tests;
- failure-path tests;
- access-control tests;
- event tests;
- property/invariant test ideas.

Forbidden:
- do not require Foundry as a first-pass dependency;
- do not test OpenZeppelin internals instead of MILA26 logic;
- do not skip failure paths.

Default toolchain:
- Hardhat build;
- Node test with viem;
- future Foundry/fuzzing only after approval.
