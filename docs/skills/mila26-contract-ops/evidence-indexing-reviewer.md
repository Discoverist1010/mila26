# Evidence Indexing Reviewer

Purpose: ensure contract actions and generated artifacts can be proven and redownloaded later.

Use when:
- a contract spec adds events;
- deployment or operation evidence is created;
- PRD or generated artifact versions are finalized.

Required inputs:
- event list;
- transaction/evidence record shape;
- Evidence Vault state;
- artifact version metadata.

Allowed outputs:
- evidence plan;
- event gaps;
- versioning requirements;
- storage/provenance notes.

Forbidden:
- do not create durable evidence claims for local-only state;
- do not overwrite previous artifact versions;
- do not store private keys, raw signatures, or unredacted provider objects.
