# MVP API Contracts

This is an index of existing and planned MVP API contracts. It is documentation only; do not add TypeScript schemas until the implementation track needs them.

| Contract | Purpose | Current status | Needed for track | Likely source file later | Fixture/test status | Notes |
|---|---|---|---|---|---|---|
| `FundFacts` | Captures fund/product setup facts. | Existing. | Current beta / Track 3+. | `src/domain/schemas.ts`. | Fixture and schema test exist. | `FundFactsSchema` exists. |
| `RequirementBrief` | Current structured requirement output. | Existing. | Current beta / Track 4. | `src/domain/schemas.ts`. | Fixture and schema test exist. | May evolve toward PRD-backed flow. |
| `AgentTask` | Worker task contract. | Existing. | Current beta / Track 5. | `src/domain/schemas.ts`. | Fixture and schema test exist. | Current roles are fixed worker roles. |
| `AgentResult` | Worker output contract. | Existing. | Current beta / Track 5. | `src/domain/schemas.ts`. | Fixture and schema test exist. | Includes generated artifacts, risks, and tests. |
| `GeneratedArtifact` | Generated file-like artifact. | Existing. | Current beta / Track 5. | `src/domain/schemas.ts`. | Fixture and schema test exist. | Solidity metadata is planned as a companion contract. |
| `SecurityReview` | Current security decision shape. | Existing. | Current beta / Track 5. | `src/domain/schemas.ts`. | Fixture and schema test exist. | Regex-based today; benchmark status planned. |
| `EvidencePack` | Evidence output contract. | Existing. | Current beta / Track 5+. | `src/domain/schemas.ts`. | Fixture and schema test exist. | Markdown today. |
| `ImplementationBundle` | Aggregate orchestration result. | Existing TypeScript type; schema gap. | Current beta / Track 5. | `src/domain/schemas.ts` or orchestration module. | Fixture exists; constituent schema tests exist. | No aggregate Zod schema yet. |
| `ChatMessage` | One user, assistant, or system chat turn. | Existing server contract. | Track 3B. | `server/contracts/chat.ts`. | JSON fixture and route tests exist. | See `chat-contract.md`. |
| `BlockchainEngineerChatRequest` | Request shape for `POST /api/chat/blockchain-engineer`. | Existing server contract. | Track 3B. | `server/contracts/chat.ts`. | JSON fixture and route validation tests exist. | Rejects empty `userMessage`. |
| `BlockchainEngineerChatResponse` | Schema-shaped assistant response for the Blockchain Engineering Bot. | Existing server contract. | Track 3B. | `server/contracts/chat.ts`. | JSON fixture and route response tests exist. | Mock provider output is mapped into this shape. |
| `SuggestedRequirementUpdate` | Reviewable requirement update proposed by chat. | Existing server contract. | Track 3B / Track 4. | `server/contracts/chat.ts`. | Covered by route response tests where present. | User must review before PRD generation. |
| `LLMProviderInput` / `LLMProviderOutput` | Backend-only provider adapter boundary. | Planned. | Track 3B mock, Track 3C real provider. | Future provider adapter module. | No fixture/test yet. | See `llm-provider-contract.md`; no SDK yet. |
| `ProductRequirementDocument` or `ApprovedPRD` | PRD/enhanced Requirement Brief for approved product design. | Planned. | Track 4. | Future shared domain contract module. | No fixture/test yet. | Should relate to or migrate from `RequirementBrief`. |
| `PRDApproval` | Records user approval and version state. | Planned. | Track 4. | Future shared domain contract module. | No fixture/test yet. | See `prd-approval-contract.md`. |
| `SolidityArtifactMetadata` | Metadata for generated Solidity artifact readiness. | Planned. | Track 5. | Future artifact contract module. | No fixture/test yet. | See `solidity-artifact-contract.md`. |
| `SecurityBenchmarkStatus` | Security benchmark result for generated Solidity. | Planned. | Track 5. | Future security contract module. | No fixture/test yet. | See `security-benchmark-contract.md`. |
| `QABenchmarkStatus` | QA result for PRD conformance and code quality. | Planned. | Track 5. | Future QA/security contract module. | No fixture/test yet. | Can share shape with security benchmark where practical. |
| `DeploymentGateReadiness` | Determines testnet deployment readiness. | Planned. | Track 6. | Future deployment contract module. | No fixture/test yet. | See `deployment-gate-contract.md`. |
| `WalletSignedDeploymentRequest` | Unsigned transaction intent for user wallet signing. | Planned. | Track 6. | Future deployment contract module. | No fixture/test yet. | Backend prepares; frontend wallet signs. |
| `DeploymentTransactionStatus` | Tracks submitted testnet transaction status. | Planned. | Track 6. | Future deployment contract module. | No fixture/test yet. | Should not include private keys. |
| `InvestorWalletRecord` | Off-chain investor name and wallet mapping. | Planned. | Track 7. | Future investor/allocation contract module. | No fixture/test yet. | Real-world names stay off-chain by default. |
| `AllocationPlan` | Wallet allocation percentages and validation state. | Planned. | Track 7. | Future investor/allocation contract module. | No fixture/test yet. | Total allocation must equal 100%. |
| `ValuationUploadSummary` | Validated valuation upload summary. | Planned. | Track 8. | Future valuation contract module. | No fixture/test yet. | Captures performance and gain/loss inputs. |
| `PortfolioPerformanceUpdate` | Token-holder-visible performance update. | Planned. | Track 8. | Future valuation/performance contract module. | No fixture/test yet. | Dashboard display and/or event emission later. |

## Rule

Before backend implementation consumes a planned contract, add or update the source schema/type, fixture, contract test, relevant docs, and runtime producer/consumer if affected.
