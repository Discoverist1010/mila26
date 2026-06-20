# Contract Spec Compiler

Purpose: convert confirmed Product Setup fields into a deployable Contract Ops specification draft.

Use when:
- Product Setup has enough PRD inputs to create a smart-contract spec preview;
- Contract Ops needs deployment blockers versus later lifecycle needs.

Required inputs:
- canonical Product Setup fields with provenance;
- selected or recommended protocol;
- wallet/admin role assumptions;
- deployment network boundary;
- lifecycle requirements that affect contract features.

Allowed outputs:
- contract spec draft;
- deployment blockers;
- later lifecycle requirements;
- open questions;
- evidence fields needed after deployment.

Forbidden:
- do not reconstruct state from freeform chat when typed Product Setup state exists;
- do not mark inferred fields as confirmed;
- do not treat later-tab details as deployment blockers unless contract deployment truly needs them.

Evaluation fixtures:
- missing admin wallet -> deployment blocker.
- missing redemption wallet -> later requirement unless selected template requires it.
- missing investor CSV -> later lifecycle requirement.
