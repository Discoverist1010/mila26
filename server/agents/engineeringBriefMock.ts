import {
  EngineeringBriefSchema,
  type EngineeringBrief,
  type EngineeringBriefRequirementBrief,
} from '../contracts/engineeringBrief';

function moduleLabels(requirementBrief: EngineeringBriefRequirementBrief): string[] {
  return requirementBrief.selectedServicingModules
    .filter((module) => module.enabled)
    .map((module) => `${module.id}: ${module.rationale}`);
}

export function generateEngineeringBriefMock(
  requirementBrief: EngineeringBriefRequirementBrief,
): EngineeringBrief {
  const modules = moduleLabels(requirementBrief);

  return EngineeringBriefSchema.parse({
    id: `engineering-brief-${requirementBrief.sourceBriefId}`,
    generatedAtIso: requirementBrief.createdAt,
    sourceRequirementBriefId: requirementBrief.sourceBriefId,
    title: `${requirementBrief.projectName} Engineering Brief`,
    summary:
      `${requirementBrief.projectName} requires a deterministic MVP engineering plan for an asset-manager tokenisation workspace. ` +
      'This brief is generated locally from the approved Requirement Brief contract and is not production legal, compliance, investment, or audit advice.',
    projectContext: {
      projectName: requirementBrief.projectName,
      fundName: requirementBrief.assetProfile.fundName,
      tokenSymbol: requirementBrief.assetProfile.tokenSymbol,
      jurisdiction: requirementBrief.assetProfile.jurisdiction,
      targetInvestors: requirementBrief.assetProfile.targetInvestors,
    },
    functionalRequirements: [
      `Represent ${requirementBrief.assetProfile.fundName} with the selected token model: ${requirementBrief.tokenModel.standardPreference}.`,
      'Preserve selected servicing modules as explicit implementation scope.',
      'Keep investor access requirements reviewable before any future token operation.',
      'Produce implementation artifacts only after the Requirement Brief approval gate.',
    ],
    nonFunctionalRequirements: [
      'Use deterministic local generation for this route; do not call an LLM provider.',
      'Keep future LLM calls and secrets backend-only when Track 6A introduces a provider adapter.',
      'Render generated content as plain text and keep outputs traceable to the source Requirement Brief.',
      'Do not present generated output as production legal, compliance, investment, or formal audit advice.',
    ],
    tokenDesign: {
      standardPreference: requirementBrief.tokenModel.standardPreference,
      assumptions: [requirementBrief.tokenModel.assumption],
      servicingModules: modules,
    },
    walletAndAccessModel: {
      whitelistRequired: requirementBrief.investorAccess.walletWhitelistRequired,
      assumptions: requirementBrief.investorAccess.assumptions,
    },
    valuationAndPerformanceUpdates: {
      cadence: requirementBrief.valuationPolicy.cadence,
      assumptions: requirementBrief.valuationPolicy.assumptions,
    },
    complianceAndSecurityAssumptions: requirementBrief.complianceSecurityAssumptions,
    deploymentBoundary: {
      network: requirementBrief.networkBoundary,
      noMainnetInMvp: true,
      signing: requirementBrief.deploymentBoundary.signing,
      backendCustody: requirementBrief.backendCustodyBoundary,
      currentTarget: requirementBrief.deploymentBoundary.currentTarget,
      status:
        'Deployment remains disabled unless a later wallet-signed Ethereum testnet track explicitly enables it.',
    },
    implementationPlan: [
      'Use this Engineering Brief as the stable PRD-shaped input for later deterministic or LLM-backed generation.',
      'Generate Solidity, API, frontend, QA, security, and evidence outputs only from approved brief data.',
      'Keep wallet-signed deployment behind a separate testnet-only deployment gate.',
    ],
    testingAndQaPlan: [
      'Validate contract/schema compatibility before generated artifacts are accepted.',
      'Run unit, route, and e2e checks before advancing generated work.',
      'Require QA and security review gates before any deployment-readiness status.',
    ],
    evidencePackPlan: [
      'Trace every generated output back to the source Requirement Brief and Engineering Brief IDs.',
      'Record selected modules, assumptions, risks, QA checks, and deployment-gate status.',
      'Label deterministic/mock generation clearly until real provider tracks are enabled.',
    ],
    openQuestions: requirementBrief.unresolvedQuestions,
    risksAndControls: [
      {
        risk: 'Mainnet or production deployment is implied too early.',
        control: 'State no mainnet deployment in MVP and keep deployment disabled until a later wallet-signed testnet track.',
      },
      {
        risk: 'Backend custody of deployment credentials is introduced.',
        control: 'Require user-wallet signing and keep backend private keys out of scope.',
      },
      {
        risk: 'Generated brief is mistaken for formal legal, compliance, or audit advice.',
        control: 'Label this output as deterministic engineering planning material only.',
      },
    ],
    acceptanceCriteria: [
      'Engineering Brief preserves Ethereum testnet-only boundary.',
      'Engineering Brief preserves user-wallet-signs deployment boundary.',
      'Engineering Brief preserves backend-holds-no-private-keys boundary.',
      'Engineering Brief states no mainnet deployment in MVP.',
      'Engineering Brief remains deterministic and local with no LLM provider call.',
    ],
    metadata: {
      generator: 'deterministic-track-5b',
      mode: 'mock',
      llmUsed: false,
      productionAdvice: false,
    },
  });
}
