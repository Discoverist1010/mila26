import type { AssistantMode, BlockchainEngineerChatRequest, RequestedFocus } from '../contracts/chat';
import { resolveContractOpsSkillInvocation } from '../contractOpsSkills/registry';

type UnknownRecord = Record<string, unknown>;

const agentIdentity = [
  'You are ZiLi-OS Copilot for MILA26, an asset-manager tokenisation workspace.',
  'Route answers through the right internal lens: Engineering Bot structures requirements and deployment implications; Advisor Bot explains concepts plainly.',
  'Backend never holds private keys. User wallets sign all deployment and operation transactions.',
  'MILA26 execution is Ethereum Sepolia/testnet-only for this prototype. Do not present mainnet or other networks as current execution choices.',
  'Do not claim deployment, minting, signing, audit, legal/compliance approval, or production readiness unless the system actually produced that evidence.',
];

const productSetupIntake = [
  'In Product Setup, act as a conversation-first intake agent before implementation advisor.',
  'For rough notes: replay understanding, list latest user-stated facts, identify missing canonical Product Setup inputs, then ask focused questions.',
  'If the latest message mainly expresses confusion about ERC standards, protocol base, Sepolia, recommended architecture target, or current executable prototype, pause requirement gathering and clarify the concept first.',
  'Usually ask 1-3 questions for readability, but ask more when the user changes direction or crucial setup fields remain unclear.',
  'If the user revises intent, acknowledge it and ask only what keeps the canonical record coherent.',
  'After about three setup Q&A turns, consolidate draft requirements, separate deployment blockers from later workflow gaps, and ask whether to confirm, revise, or defer.',
  'Do not jump to deployment, minting, onboarding, or full implementation plans from early setup notes unless explicitly asked.',
  'Lead toward a downloadable Product Setup PRD built from canonical fields with provenance.',
  'Supported Product Setup PRD downloads are DOCX and Markdown only. Do not offer, attach, preview, or link Product Setup JSON or PDF downloads.',
];

const productSetupDataRules = [
  'Use currentTurnExtractedFacts as the only facts captured from the latest user message.',
  'Treat workspaceDefaults as existing approved/default context, never as facts the user just stated.',
  'Treat canonical fields with system_default or inferred status as assumptions to confirm.',
  'Do not invent or prefill product_name or token_symbol. Ask for them when missing.',
  'Say "recommended architecture target" for inferred protocol recommendations; say "selected protocol base" only after protocol_base is user_confirmed.',
  'If selectedProtocolBase is present, respect it. Do not stage a different protocol_base unless the latest user message changes it.',
  'Prioritize missing Product Setup required fields. Do not ask again for user_stated fields unless ambiguous.',
  'If prdReadinessState is Ready for review, guide the user to review/finalise the PRD; do not re-ask captured fields unless the user asks to edit.',
  'If prdReadinessState is Ready with critical deferrals, ask only about the criticalDeferredInputs before clean finalisation.',
  'If duration_months and product_launch_date are present, derived_maturity_date is calculated; mention weekend adjustment only if it differs from the calendar anniversary.',
];

const protocolRules = [
  'Active protocol bases: ERC-20, ERC-4626, ERC-3643, and custom ERC-20 with rebasing.',
  'ERC-721 may be explained as out of MVP scope, not as an active ZiLi-OS choice.',
  'Always distinguish recommended architecture target from current executable prototype.',
  'Current executable prototype: Sepolia restricted ERC-20-compatible.',
  'If confused about ERC-3643 versus ERC-20, explain ERC-3643 is the architecture target for restricted products, while Sepolia ERC-20-compatible is deployable/testable now.',
  'If the user selected ERC-20 while whitelisting is required, explain the ERC-20 workflow/custom-control tradeoff versus the stronger ERC-3643 permissioning target.',
  'Do not ask the user to choose a protocol in the same reply when they are confused about the distinction; first ask whether the explanation clarifies it.',
  'Before concluding Product Setup, provide protocol fit: recommended architecture target, current executable prototype, and unsupported/custom requirement notes.',
];

const responseStyle = [
  'Use concise sections: My understanding, Captured from your message, Please confirm, Next details to complete Product Setup, and Assumptions to verify when useful.',
  'Combine missing details and questions; avoid repetitive separate Questions sections.',
  'Use beginner-friendly explanations for technical terms when they first matter: protocol base, ERC-3643, Sepolia, wallet, mint, burn, lock, whitelist.',
  'Avoid abrupt instruction copy such as "Answer these"; prefer "You can answer in plain language; I will turn it into the draft Product Setup."',
  'Do not use the phrase "Product Setup protocol-fit view" unless an actual visible UI element has that exact label. Prefer "protocol recommendation" or "protocol base field".',
  'Keep Product Setup answers under 220 words unless the user asks for a detailed document. Do not return one long paragraph.',
  'Naturally ask whether the user wants a concept clarified from time to time; do not use a fixed checkpoint.',
];

const advisorRules = [
  'Advisor Bot explains concepts, lifecycle tabs, evidence, buttons, and next actions in plain business language.',
  'Use just-in-time Product Setup explanations: meaning, purpose, what to provide, and wallet safety where relevant.',
  'Later tabs can use shorter operational language after concepts have been introduced.',
  'When explaining ERC differences, focus on ERC-20, ERC-4626, ERC-3643, and custom rebasing ERC-20. Mention ERC-721 only as out of MVP scope unless asked about other standards.',
  'When the user says they are confused about ERC-3643 versus ERC-20, explain the distinction in plain language, say they do not need to choose while unclear, and end by asking whether it clarifies.',
  'Do not generate code, legal/tax/investment advice, audit conclusions, custody recommendations, or mainnet instructions.',
  'Keep Advisor answers under 180 words unless the user asks for detail.',
];

const engineeringSystemInstruction = [
  ...agentIdentity,
  ...productSetupIntake,
  ...productSetupDataRules,
  ...protocolRules,
  ...responseStyle,
].join(' ');

const advisorSystemInstruction = [
  ...agentIdentity,
  ...advisorRules,
  ...productSetupDataRules.slice(0, 5),
  'If activeTab is Product Setup, answer inside that workflow; do not tell the user to open Product Setup.',
].join(' ');

const canonicalFieldPriority = [
  'product_name',
  'token_symbol',
  'product_launch_date',
  'product_wrapper',
  'underlying_asset_class',
  'product_structure',
  'offering_type',
  'eligible_investor_type',
  'maximum_investor_count',
  'distribution_jurisdiction',
  'product_type',
  'base_currency',
  'income_treatment',
  'protocol_base',
  'expected_investor_count',
  'investor_wallet_rule',
  'whitelisted_wallets_required',
  'p2p_transfer_allowed',
  'subscription_cadence',
  'subscription_payment_method',
  'subscription_stablecoins',
  'redemption_cadence',
  'redemption_payment_method',
  'redemption_stablecoin_type',
  'redemption_schedule',
  'income_payout_cadence',
  'redemption_payout_delay',
  'redemption_payout_cadence',
  'minimum_redemption_amount',
  'burn_lock_rule',
  'nav_cadence',
  'nav_upload_method',
  'nav_source',
  'investor_update_rule',
  'initial_distribution_date',
  'initial_investor_register_rule',
  'duration_months',
  'derived_maturity_date',
  'maturity_date',
  'maturity_description',
  'maturity_closeout_rule',
  'compliance_model',
  'evidence_model',
  'prototype_network',
] as const;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function activeTabLabelFromContext(context: BlockchainEngineerChatRequest['projectContext']): string | undefined {
  const activeTab = isRecord(context?.activeTab) ? context.activeTab : undefined;
  return typeof activeTab?.label === 'string' ? activeTab.label : undefined;
}

function toStringArray(value: unknown, maxItems: number): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  return strings.slice(0, maxItems);
}

function compactField(field: unknown): UnknownRecord | undefined {
  if (!isRecord(field)) return undefined;
  const hasValue = field.value !== null && field.value !== undefined && field.value !== '';
  const status = typeof field.status === 'string' ? field.status : undefined;
  const hasMeaningfulEmptyStatus = status === 'deferred' || status === 'conflicting';
  if (!hasValue && !hasMeaningfulEmptyStatus) return undefined;
  return {
    label: typeof field.label === 'string' ? field.label : undefined,
    value: field.value ?? null,
    status,
    sourceType: typeof field.sourceType === 'string' ? field.sourceType : null,
    confirmedByUser: field.confirmedByUser === true,
  };
}

function compactCanonicalFields(productSetup: UnknownRecord): UnknownRecord {
  const canonicalFields = isRecord(productSetup.canonicalFields) ? productSetup.canonicalFields : {};
  const entries: Array<[string, UnknownRecord]> = [];

  canonicalFieldPriority.forEach((fieldKey) => {
    const compacted = compactField(canonicalFields[fieldKey]);
    if (compacted) entries.push([fieldKey, compacted]);
  });

  return Object.fromEntries(entries);
}

function compactCurrentTurnFacts(context: UnknownRecord): UnknownRecord[] {
  if (!Array.isArray(context.currentTurnExtractedFacts)) return [];
  return context.currentTurnExtractedFacts
    .filter(isRecord)
    .slice(0, 10)
    .map((fact) => ({
      fieldKey: fact.fieldKey,
      label: fact.label,
      value: fact.value,
      confidence: fact.confidence,
      sourceType: fact.sourceType,
    }));
}

function compactPendingUpdates(productSetup: UnknownRecord): UnknownRecord[] {
  if (!Array.isArray(productSetup.pendingSuggestedUpdates)) return [];
  return productSetup.pendingSuggestedUpdates
    .filter(isRecord)
    .slice(0, 8)
    .map((update) => ({
      fieldKey: update.fieldKey,
      field: update.field,
      proposedValue: update.proposedValue,
      confidence: update.confidence,
    }));
}

function compactWorkspaceDefaults(context: UnknownRecord): UnknownRecord | undefined {
  if (!isRecord(context.workspaceDefaults)) return undefined;
  const workspaceDefaults = context.workspaceDefaults;
  const allowedKeys = ['productName', 'tokenSymbol', 'jurisdiction', 'selectedModules'];
  const entries: Array<[string, UnknownRecord]> = [];

  allowedKeys.forEach((key) => {
    const value = workspaceDefaults[key];
    if (!isRecord(value)) return;
    entries.push([
      key,
      {
        value: value.value,
        sourceType: value.sourceType,
        sourceRef: value.sourceRef,
      },
    ]);
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function compactWorkspaceContext(
  context: BlockchainEngineerChatRequest['projectContext'],
): UnknownRecord | undefined {
  if (!isRecord(context)) return undefined;
  const activeTab = isRecord(context.activeTab) ? context.activeTab : undefined;
  const productSetup = isRecord(context.productSetup) ? context.productSetup : {};

  return {
    activeTab: activeTab
      ? {
          id: activeTab.id,
          label: activeTab.label,
        }
      : undefined,
    productSetup: {
      status: productSetup.status,
      selectedProtocolBase: productSetup.selectedProtocolBase ?? null,
      recommendedProtocol: productSetup.recommendedProtocol,
      currentExecutablePrototype: productSetup.currentExecutablePrototype,
      prdReadinessState: productSetup.prdReadinessState,
      criticalDeferredInputs: toStringArray(productSetup.criticalDeferredInputs, 8) ?? [],
      nonCriticalDeferredInputs: toStringArray(productSetup.nonCriticalDeferredInputs, 8) ?? [],
      missingCanonicalInputs: toStringArray(productSetup.missingCanonicalInputs, 12) ?? [],
      pendingSuggestedUpdates: compactPendingUpdates(productSetup),
      canonicalFields: compactCanonicalFields(productSetup),
      protocolRecommendationCaveat: productSetup.protocolRecommendationCaveat,
    },
    currentTurnExtractedFacts: compactCurrentTurnFacts(context),
    workspaceDefaults: compactWorkspaceDefaults(context),
    contextRules: [
      'currentTurnExtractedFacts are latest-message facts only.',
      'workspaceDefaults are prior approved/default context.',
      'inferred/system_default canonical fields are assumptions to confirm.',
    ],
  };
}

export function workspaceContextInstruction(context: BlockchainEngineerChatRequest['projectContext']): string {
  const compactContext = compactWorkspaceContext(context);
  if (!compactContext) return '';
  return `\n\nCurrent workspace context, compact JSON:\n${JSON.stringify(compactContext)}`;
}

export function systemInstructionForAssistantMode(
  assistantMode: AssistantMode,
  context: BlockchainEngineerChatRequest['projectContext'],
  requestedFocus?: RequestedFocus,
  userMessage?: string,
): string {
  const baseInstruction = assistantMode === 'advisor' ? advisorSystemInstruction : engineeringSystemInstruction;
  const skillInvocation = resolveContractOpsSkillInvocation({
    activeTabLabel: activeTabLabelFromContext(context),
    requestedFocus,
    userMessage,
  });
  return `${baseInstruction}${workspaceContextInstruction(context)}${skillInvocation ? `\n\n${skillInvocation.promptInstruction}` : ''}`;
}
