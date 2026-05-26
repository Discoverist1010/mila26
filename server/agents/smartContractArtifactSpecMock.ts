import {
  SmartContractArtifactSpecRequestSchema,
  SmartContractArtifactSpecSchema,
  type SmartContractArtifactSpec,
  type SmartContractArtifactSpecRequest,
} from '../contracts/smartContractArtifactSpec';

export type SmartContractArtifactSpecFailureCode =
  | 'VALIDATION_ERROR'
  | 'MISSING_ENGINEERING_BRIEF'
  | 'CLOSURE_NOT_READY'
  | 'UNSAFE_BOUNDARY';

export type SmartContractArtifactSpecGenerationResult =
  | { ok: true; data: SmartContractArtifactSpec }
  | {
      ok: false;
      code: SmartContractArtifactSpecFailureCode;
      message: string;
      details?: Record<string, unknown>;
    };

const minimumErc20Functions = ['totalSupply', 'balanceOf', 'transfer', 'allowance', 'approve', 'transferFrom'];
const minimumErc20Events = ['Transfer', 'Approval'];
const customEventSpecs = [
  {
    name: 'WalletWhitelisted',
    purpose: 'Record wallet approval for restricted investor access.',
    required: true,
    suggestedParameters: ['wallet', 'operator'],
  },
  {
    name: 'AllocationMinted',
    purpose: 'Record issuer-controlled allocation minting for approved wallets.',
    required: true,
    suggestedParameters: ['wallet', 'amount', 'operator'],
  },
  {
    name: 'ValuationUpdated',
    purpose: 'Record NAV or performance update evidence for the tokenized fund.',
    required: true,
    suggestedParameters: ['valuationReference', 'timestamp', 'operator'],
  },
  {
    name: 'DistributionRecorded',
    purpose: 'Record distribution evidence without executing cash movement.',
    required: true,
    suggestedParameters: ['distributionReference', 'amount', 'operator'],
  },
  {
    name: 'TransferRestrictionUpdated',
    purpose: 'Record updates to whitelist or transfer restriction policy.',
    required: true,
    suggestedParameters: ['enabled', 'operator'],
  },
  {
    name: 'ContractPaused',
    purpose: 'Record emergency pause activation.',
    required: true,
    suggestedParameters: ['operator'],
  },
  {
    name: 'ContractUnpaused',
    purpose: 'Record emergency pause removal.',
    required: true,
    suggestedParameters: ['operator'],
  },
];

function validationDetails(path: string, message: string): Record<string, unknown> {
  return {
    fields: [
      {
        path,
        message,
      },
    ],
  };
}

function eventToEvidenceMapping(eventNames: string[]) {
  return eventNames.map((eventName) => ({
    eventName,
    evidenceUse:
      eventName === 'Transfer' || eventName === 'Approval'
        ? 'Standard token interoperability evidence for later checks.'
        : `${eventName} should appear in the evidence-lite pack and SCP recent events when implemented.`,
    scpSurface: eventName === 'Transfer' || eventName === 'Approval' ? 'Contract Health' : 'Recent Events',
  }));
}

export function generateSmartContractArtifactSpec(
  request: unknown,
): SmartContractArtifactSpecGenerationResult {
  const parsed = SmartContractArtifactSpecRequestSchema.safeParse(request);

  if (!parsed.success) {
    const missingEngineeringBrief = parsed.error.issues.some((issue) => issue.path.join('.') === 'engineeringBrief');
    return {
      ok: false,
      code: missingEngineeringBrief ? 'MISSING_ENGINEERING_BRIEF' : 'VALIDATION_ERROR',
      message: missingEngineeringBrief
        ? 'Engineering Brief is required before Smart Contract Artifact Spec generation.'
        : 'Invalid Smart Contract Artifact Spec request.',
      details: {
        fields: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    };
  }

  return generateParsedSmartContractArtifactSpec(parsed.data);
}

function generateParsedSmartContractArtifactSpec(
  request: SmartContractArtifactSpecRequest,
): SmartContractArtifactSpecGenerationResult {
  const { engineeringBrief, requirementBrief, closureReadiness } = request;

  if (closureReadiness.status !== 'ready') {
    return {
      ok: false,
      code: 'CLOSURE_NOT_READY',
      message: 'Closure readiness must be ready before Smart Contract Artifact Spec generation.',
      details: {
        readinessLabel: closureReadiness.readinessLabel,
        blockedReasons: closureReadiness.blockedReasons,
      },
    };
  }

  if (engineeringBrief.deploymentBoundary.network !== 'ethereum-testnet-only') {
    return {
      ok: false,
      code: 'UNSAFE_BOUNDARY',
      message: 'Smart Contract Artifact Spec requires the Ethereum testnet-only boundary.',
      details: validationDetails('engineeringBrief.deploymentBoundary.network', 'Expected ethereum-testnet-only.'),
    };
  }

  if (engineeringBrief.deploymentBoundary.backendCustody !== 'backend-holds-no-private-keys') {
    return {
      ok: false,
      code: 'UNSAFE_BOUNDARY',
      message: 'Backend private-key custody is not allowed in the MILA26 MVP.',
      details: validationDetails('engineeringBrief.deploymentBoundary.backendCustody', 'Expected backend-holds-no-private-keys.'),
    };
  }

  if (engineeringBrief.deploymentBoundary.signing !== 'user-wallet-signs') {
    return {
      ok: false,
      code: 'UNSAFE_BOUNDARY',
      message: 'Future deployment must remain user-wallet signed.',
      details: validationDetails('engineeringBrief.deploymentBoundary.signing', 'Expected user-wallet-signs.'),
    };
  }

  const standardAndCustomEvents = [...minimumErc20Events, ...customEventSpecs.map((event) => event.name)];
  const spec = SmartContractArtifactSpecSchema.parse({
    specId: `smart-contract-artifact-spec-${engineeringBrief.id}`,
    projectId: engineeringBrief.sourceRequirementBriefId,
    projectName: engineeringBrief.projectContext.projectName,
    status: 'ready',
    generatedFrom: {
      requirementBriefId: requirementBrief?.sourceBriefId ?? engineeringBrief.sourceRequirementBriefId,
      engineeringBriefId: engineeringBrief.id,
      closureLedgerId: closureReadiness.closureLedgerId,
    },
    tokenStandardProfile: {
      baseStandardCompatibility: 'erc20',
      mila26RestrictionProfile: 'restricted_erc20',
      recommendedProfile: 'restricted_erc20',
      rationale:
        'Tokenized income fund units are fungible allocation units, so MILA26 should use an ERC-20-compatible profile with explicit whitelist and transfer restrictions.',
      minimumRequiredFunctions: minimumErc20Functions,
      minimumRequiredEvents: minimumErc20Events,
      openZeppelinAssumptions: {
        useOpenZeppelinContracts: true,
        baseContracts: ['ERC20'],
        extensions: ['AccessControl', 'Pausable'],
        exactPackageVersionDeferredTo: 'track_9b_or_9b_2',
      },
      customEvents: customEventSpecs,
      compatibilityNotes: [
        'restricted_erc20 is a MILA26 implementation profile, not a separate formal ERC standard.',
        'Future Solidity must remain ERC-20-compatible while enforcing wallet whitelist and transfer restrictions.',
        'Exact Solidity signatures and imports are deferred to Track 9B.',
      ],
    },
    contractModel: {
      projectLabel: engineeringBrief.projectContext.projectName,
      fundName: engineeringBrief.projectContext.fundName,
      tokenName: engineeringBrief.projectContext.fundName,
      tokenSymbol: engineeringBrief.projectContext.tokenSymbol,
      decimalsAssumption: 18,
      supplyModel: 'Supply is minted only through issuer-controlled allocation workflows for approved wallets.',
      mintingModel: 'Issuer-controlled minting is allowed only after wallet whitelist checks.',
      issuerControlledAllocations: true,
      transferRestrictionsEnabled: engineeringBrief.walletAndAccessModel.whitelistRequired,
      valuationUpdateModel: 'event_only',
      distributionModel: 'event_only',
    },
    accessControl: {
      ownerRole: 'Contract owner / asset manager administrator',
      adminRole: 'MILA26 admin role controlled by user wallet',
      issuerRole: 'Issuer role for approved allocation operations',
      mintingRole: 'Issuer-controlled minting role',
      whitelistRole: 'Wallet whitelist manager role',
      valuationUpdaterRole: 'Valuation/performance update recorder role',
      distributionRecorderRole: 'Distribution evidence recorder role',
      pauserRole: 'Emergency pause operator role',
      backendPrivateKeyCustody: false,
    },
    walletPolicy: {
      whitelistRequired: engineeringBrief.walletAndAccessModel.whitelistRequired,
      transferPolicy: engineeringBrief.walletAndAccessModel.whitelistRequired
        ? 'Transfers are restricted to permitted or whitelisted wallets.'
        : 'Wallet access rules must be finalized before future deployment.',
      investorWalletCustody: 'user_or_investor_wallets_only',
      deploymentSigning: 'user-wallet-signs',
    },
    valuationPolicy: {
      cadence: engineeringBrief.valuationAndPerformanceUpdates.cadence,
      updateModel: 'manual_upload',
      eventRequirements: ['ValuationUpdated'],
      evidenceRequirements: [
        'Record valuation update references for evidence-lite and later SCP recent events.',
        ...engineeringBrief.valuationAndPerformanceUpdates.assumptions,
      ],
    },
    distributionPolicy: {
      movementScope: 'event_and_evidence_only',
      eventRequirements: ['DistributionRecorded'],
      evidenceRequirements: [
        'Record distribution references without claiming cash movement or token distribution execution.',
      ],
    },
    eventModel: {
      standardEvents: minimumErc20Events,
      customEvents: customEventSpecs.map((event) => event.name),
      eventToEvidenceMapping: eventToEvidenceMapping(standardAndCustomEvents),
      signatureNotes: 'Exact Solidity event signatures are deferred to Track 9B.',
    },
    safetyBoundary: {
      network: 'ethereum-testnet-only',
      mainnetDisabled: true,
      backendCustody: 'backend-holds-no-private-keys',
      deploymentSigning: 'user-wallet-signs',
      deploymentRequiresChecksEvidenceAndGate: true,
      productionLegalComplianceAdvice: false,
      realInvestorOnboardingInMvp: false,
    },
    acceptanceCriteria: [
      'Token standard profile is ERC-20-compatible with MILA26 restricted transfer assumptions.',
      'Future Solidity artifact must implement or justify every required ERC-20 function and event.',
      'Future Solidity artifact must include or justify custom tokenisation events.',
      'Access-control, wallet whitelist, valuation, and distribution assumptions are explicit.',
      'Future checks must verify transfer restrictions, pause behavior, and event coverage.',
      'No mainnet deployment, backend private-key custody, or real investor onboarding is introduced in MVP.',
    ],
    blockedReasons: [],
    metadata: {
      generatedAt: engineeringBrief.generatedAtIso,
      generator: 'deterministic_9a_spec_generator',
      version: '9a.1',
    },
  });

  return {
    ok: true,
    data: spec,
  };
}
