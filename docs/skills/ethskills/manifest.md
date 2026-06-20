# EthSkills Source Manifest

These files are local source snapshots used to distil MILA26 Contract Ops expertise. They are reference material only. Runtime prompts must use the compact MILA26 skill cards in `docs/skills/mila26-contract-ops/`, not these full source files.

Fetched: 2026-06-20

| File | Source URL | SHA-256 | MILA26 use | Limitation |
|---|---|---:|---|---|
| `source/core.md` | `https://ethskills.com/SKILL.md` | `242ccb5fb9e6334f8b5914c612ceaac7687a11f686d0181e3ae0ad875eceb314` | Routing overview for Ethereum skills. | General source, not MILA26-specific. |
| `source/ship.md` | `https://ethskills.com/ship/SKILL.md` | `e13030c1c17d135b5a904347ef3fbd465823079f7e09099c6708fde6a1b254b6` | Delivery discipline: onchain/offchain split, state-transition audit, test before deploy. | Mainnet and multi-chain guidance is out of current MVP scope. |
| `source/orchestration.md` | `https://ethskills.com/orchestration/SKILL.md` | `524ef0810e780eba56d6310c44e6e07346149843878f6dc3c388ae5f2b099a73` | Phase-gated dApp delivery and wallet-flow discipline. | Scaffold-ETH-specific architecture must not be copied into MILA26. |
| `source/security.md` | `https://ethskills.com/security/SKILL.md` | `dd988d2f417226f02bfec777264edd6c85666515976c28e8c11aa4eb73ca7a65` | Solidity defensive coding and pre-deploy security checks. | External analyzers require separate approval before adoption. |
| `source/testing.md` | `https://ethskills.com/testing/SKILL.md` | `684eab6b127f83f5a7ae4b8d93993b3d07c2c59587b7a49e8fd569007e58411a` | Test strategy for custom logic, failure paths, fuzz/property thinking. | Foundry examples are future option; current repo uses Hardhat/viem. |
| `source/audit.md` | `https://ethskills.com/audit/SKILL.md` | `f7e2a649a07393707826f3e4352b30b418b00cfe690b40a4b1caf0a5eea627a1` | Fresh-context EVM audit methodology. | Full 20-skill audit suite is not runtime prompt material. |
| `source/qa.md` | `https://ethskills.com/qa/SKILL.md` | `e8ff85b607b9443afe37b4323426432dc6982e5c88dfff35adb860ab66ddf6f8` | Wallet/action-flow QA, readable errors, duplicate pending protection. | Scaffold-ETH-specific checks must be adapted to MILA26. |
| `source/standards.md` | `https://ethskills.com/standards/SKILL.md` | `734a0bae863ea339b84f57d4e954847f0d19372ca65f214c03e5662eee7e0c6c` | ERC standards context. | Protocol claims may drift; verify before production use. |
| `source/wallets.md` | `https://ethskills.com/wallets/SKILL.md` | `ae147e09a230f8c1bccf06eb444adeaa63957841752cb08449e0c7e4f7fb9f0a` | Wallet safety, no private keys, user signing. | Some wallet ecosystem details may change. |
| `source/frontend-ux.md` | `https://ethskills.com/frontend-ux/SKILL.md` | `8cf0d4e051acd4a8b5c86b62ef440d2afd685be519ad99ceff4410cd83ec0648` | Wallet UX, clear errors, pending states. | Apply within current MILA26 shell only. |
| `source/tools.md` | `https://ethskills.com/tools/SKILL.md` | `6591556f1b4bc5f7b76401b9391a5b761db7ce13d5d8084649c5f4dc2e99ae15` | Tooling landscape. | No new tools without approval. |
| `source/protocol.md` | `https://ethskills.com/protocol/SKILL.md` | `100b87c78a9ef86ecf8af09574b2ec91fd06e83a12ec868ca1cc0820d34ef824` | Current-protocol caution and source-checking discipline. | Verify temporally unstable claims before relying on them. |
| `source/gas.md` | `https://ethskills.com/gas/SKILL.md` | `78d4934247aed38c735c2425ece5af8877b10dac495706c5b821e5000358bbc6` | Gas-estimate caution. | Do not show precise gas unless checked live. |
| `source/indexing.md` | `https://ethskills.com/indexing/SKILL.md` | `ee8fd23dc448782d317492717e39190fa25f7fcf02b9fd64154e5954f208979e` | Event/evidence-first design. | Indexer setup is not part of the first pass. |
