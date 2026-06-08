import type { BlockchainEngineerChatResponse } from '../../server/contracts/chat';

export type BlockchainEngineerResponseSectionKind =
  | 'protocol_comparison'
  | 'suggested_requirement_updates'
  | 'open_questions'
  | 'risk_notes'
  | 'next_recommended_action';

export type BlockchainEngineerResponseSection = {
  kind: BlockchainEngineerResponseSectionKind;
  title: string;
  items: string[];
};

export type BlockchainEngineerResponseViewModel = {
  summary: string;
  sections: BlockchainEngineerResponseSection[];
};

type SuggestedRequirementUpdate = NonNullable<BlockchainEngineerChatResponse['suggestedRequirementUpdates']>[number];

function stringifyProposedValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  const jsonValue = JSON.stringify(value);
  return jsonValue ?? String(value);
}

function requirementUpdateLabel(update: SuggestedRequirementUpdate): string {
  return `${update.field}: ${stringifyProposedValue(update.proposedValue)}. ${update.rationale}`;
}

function compact(items: Array<string | undefined>): string[] {
  return items.map((item) => item?.trim()).filter((item): item is string => Boolean(item));
}

export function toBlockchainEngineerResponseViewModel(
  response: BlockchainEngineerChatResponse,
): BlockchainEngineerResponseViewModel {
  const sections: BlockchainEngineerResponseSection[] = [];

  if (response.protocolComparison) {
    sections.push({
      kind: 'protocol_comparison',
      title: 'Protocol comparison',
      items: compact([
        `ERC-20: ${response.protocolComparison.erc20}`,
        `ERC-4626: ${response.protocolComparison.erc4626}`,
        `ERC-3643: ${response.protocolComparison.erc3643}`,
        `Custom ERC-20 with rebasing: ${response.protocolComparison.rebasingErc20}`,
        response.protocolComparison.erc721OutOfScope
          ? `ERC-721: ${response.protocolComparison.erc721OutOfScope}`
          : undefined,
        `Recommendation: ${response.protocolComparison.recommendation}`,
      ]),
    });
  }

  if (response.suggestedRequirementUpdates?.length) {
    sections.push({
      kind: 'suggested_requirement_updates',
      title: 'Suggested requirement updates',
      items: response.suggestedRequirementUpdates.map(requirementUpdateLabel),
    });
  }

  if (response.openQuestions?.length) {
    sections.push({
      kind: 'open_questions',
      title: 'Open questions',
      items: compact(response.openQuestions),
    });
  }

  if (response.riskNotes?.length) {
    sections.push({
      kind: 'risk_notes',
      title: 'Risk notes',
      items: compact(response.riskNotes),
    });
  }

  if (response.nextRecommendedAction?.trim()) {
    sections.push({
      kind: 'next_recommended_action',
      title: 'Recommended next action',
      items: [response.nextRecommendedAction.trim()],
    });
  }

  return {
    summary: response.content,
    sections: sections.filter((section) => section.items.length > 0),
  };
}
