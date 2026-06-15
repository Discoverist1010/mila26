import type { AssistantMode } from '../../server/contracts/chat';

export type ZiLiOSCopilotRouteKind = 'engineering' | 'advisor' | 'mixed';

export type ZiLiOSCopilotRoute = {
  route: ZiLiOSCopilotRouteKind;
  assistantMode: AssistantMode;
  shouldExtractRequirements: boolean;
  labels: string[];
};

const advisorPatterns = [
  /\bwhat\s+(?:is|does|are)\b/i,
  /\bwhy\b/i,
  /\bexplain\b/i,
  /\bmeaning\b/i,
  /\bnot\s+sure\b/i,
  /\bconfused\b/i,
  /\bhelp\s+me\s+understand\b/i,
  /\bhow\s+should\s+i\s+think\b/i,
  /\badmin wallet\b/i,
  /\bredemption wallet\b/i,
  /\bmint\b/i,
  /\bburn\b/i,
  /\block\b/i,
  /\bwhitelist(?:ed)? wallet\b/i,
  /\bprotocol base\b/i,
  /\berc-?(?:20|4626|3643)\b/i,
  /\brebasing\b/i,
];

const productFactPatterns = [
  /\btokenis(?:e|ing|ation)|\btokeniz(?:e|ing|ation)/i,
  /\bwe\s+(?:are|have|want|need)\b/i,
  /\bi\s+(?:am|want|need)\s+(?:to\s+)?(?:tokenis|tokeniz|create|launch|structure|sell)\b/i,
  /\b\d{1,3}\s*(?:-|to)?\s*\d{0,3}\s*investors?\b/i,
  /\busdc\b|\busdt\b|\bstablecoin\b/i,
  /\bsubscription\b/i,
  /\bquarterly\b|\bmonthly\b|\bweekly\b/i,
  /\bwhitelist(?:ed)?\b|\bapproved wallets?\b/i,
  /\bdeploy(?:ment)?\b|\bcontract ops\b|\bsepolia\b/i,
  /\bnav\b|\bvaluation\b/i,
  /\bmaturity\b/i,
  /\bwallet address\b|\b0x[a-fA-F0-9]{6,}/,
];

const protocolConfusionPatterns = [
  /\bconfused\b/i,
  /\bdon'?t\s+understand\b/i,
  /\bnot\s+clear\b/i,
  /\bunclear\b/i,
  /\bwhy\b/i,
  /\bwhat\s+do\s+you\s+mean\b/i,
  /\bclarif(?:y|ication)\b/i,
];

const protocolReferencePatterns = [
  /\berc-?\s*(?:20|4626|3643)\b/i,
  /\berc\b/i,
  /\bprotocol\b/i,
  /\bsepolia\b/i,
  /\bcurrent\s+executable\s+prototype\b/i,
  /\barchitecture\s+target\b/i,
];

const protocolSelectionPatterns = [
  /\b(?:will|would|want\s+to|prefer\s+to|choose|select|use|go\s+with|proceed\s+with)\s+(?:use\s+)?erc-?\s*(?:20|4626|3643)\b/i,
  /\berc-?\s*(?:20|4626|3643)\s+(?:is|as)\s+(?:the\s+)?(?:protocol|target|base|choice)\b/i,
];

function hasAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function routeZiLiOSCopilotMessage(message: string): ZiLiOSCopilotRoute {
  const trimmed = message.trim();
  const hasProtocolConfusion =
    hasAnyPattern(trimmed, protocolConfusionPatterns) && hasAnyPattern(trimmed, protocolReferencePatterns);
  const hasProtocolSelection = hasAnyPattern(trimmed, protocolSelectionPatterns);
  const hasAdvisorIntent = hasAnyPattern(trimmed, advisorPatterns);
  const hasProductFacts = hasAnyPattern(trimmed, productFactPatterns) || hasProtocolSelection;

  if (hasProtocolConfusion) {
    return {
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor Bot'],
    };
  }

  if (hasAdvisorIntent && hasProductFacts) {
    return {
      route: 'mixed',
      assistantMode: 'engineering',
      shouldExtractRequirements: true,
      labels: ['Advisor Bot', 'Engineering Bot'],
    };
  }

  if (hasAdvisorIntent && !hasProductFacts) {
    return {
      route: 'advisor',
      assistantMode: 'advisor',
      shouldExtractRequirements: false,
      labels: ['Advisor Bot'],
    };
  }

  return {
    route: 'engineering',
    assistantMode: 'engineering',
    shouldExtractRequirements: true,
    labels: ['Engineering Bot'],
  };
}
