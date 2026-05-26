import { describe, expect, it } from 'vitest';
import { toBlockchainEngineerResponseViewModel } from '../src/domain/blockchainEngineerResponseViewModel';
import type { BlockchainEngineerChatResponse } from '../server/contracts/chat';

function createResponse(overrides: Partial<BlockchainEngineerChatResponse> = {}): BlockchainEngineerChatResponse {
  return {
    messageId: 'chat-1',
    agentId: 'blockchain-engineer',
    content: 'Use ERC-20 for fungible fund shares unless investor positions require unique metadata.',
    createdAt: '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

describe('Blockchain Engineer response view model', () => {
  it('keeps content-only responses backward compatible', () => {
    const viewModel = toBlockchainEngineerResponseViewModel(createResponse());

    expect(viewModel.summary).toContain('Use ERC-20');
    expect(viewModel.sections).toEqual([]);
  });

  it('renders protocol comparison as a cockpit section', () => {
    const viewModel = toBlockchainEngineerResponseViewModel(
      createResponse({
        protocolComparison: {
          erc20: 'Fungible investor shares with standard wallet support.',
          erc721: 'Unique investor positions with token-specific metadata.',
          recommendation: 'Start with ERC-20 for the MVP unless uniqueness is required.',
        },
      }),
    );

    expect(viewModel.sections).toContainEqual({
      kind: 'protocol_comparison',
      title: 'Protocol comparison',
      items: [
        'ERC-20: Fungible investor shares with standard wallet support.',
        'ERC-721: Unique investor positions with token-specific metadata.',
        'Recommendation: Start with ERC-20 for the MVP unless uniqueness is required.',
      ],
    });
  });

  it('renders suggested requirement updates with readable proposed values', () => {
    const viewModel = toBlockchainEngineerResponseViewModel(
      createResponse({
        suggestedRequirementUpdates: [
          {
            field: 'token.standardPreference',
            proposedValue: 'ERC-20',
            rationale: 'Fungible fund shares fit the default asset manager workflow.',
            confidence: 0.82,
          },
        ],
      }),
    );

    expect(viewModel.sections[0]).toEqual({
      kind: 'suggested_requirement_updates',
      title: 'Suggested requirement updates',
      items: ['token.standardPreference: ERC-20. Fungible fund shares fit the default asset manager workflow.'],
    });
  });

  it('renders open questions and risk notes separately', () => {
    const viewModel = toBlockchainEngineerResponseViewModel(
      createResponse({
        openQuestions: ['Should wallet allowlists be fixed before deployment?'],
        riskNotes: ['Backend must not hold private keys.'],
      }),
    );

    expect(viewModel.sections.map((section) => section.title)).toEqual(['Open questions', 'Risk notes']);
    expect(viewModel.sections[0].items).toEqual(['Should wallet allowlists be fixed before deployment?']);
    expect(viewModel.sections[1].items).toEqual(['Backend must not hold private keys.']);
  });

  it('renders next recommended action without creating empty sections', () => {
    const viewModel = toBlockchainEngineerResponseViewModel(
      createResponse({
        openQuestions: ['   '],
        riskNotes: [],
        nextRecommendedAction: 'Confirm ERC-20 versus ERC-721 before approving the brief.',
      }),
    );

    expect(viewModel.sections).toEqual([
      {
        kind: 'next_recommended_action',
        title: 'Recommended next action',
        items: ['Confirm ERC-20 versus ERC-721 before approving the brief.'],
      },
    ]);
  });
});
