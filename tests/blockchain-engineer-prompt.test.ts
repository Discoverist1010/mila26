/* @vitest-environment node */
import { describe, expect, it } from 'vitest';
import {
  compactWorkspaceContext,
  systemInstructionForAssistantMode,
  workspaceContextInstruction,
} from '../server/agents/blockchainEngineerPrompt';

describe('blockchain engineer prompt construction', () => {
  it('serializes workspace context as a prioritized compact contract instead of raw sliced JSON', () => {
    const hugeIgnoredValue = 'x'.repeat(20_000);
    const context = {
      activeTab: {
        id: 'requirements',
        label: 'Product Setup',
        ignoredUiShape: hugeIgnoredValue,
      },
      productSetup: {
        status: 'draft',
        selectedProtocolBase: null,
        recommendedProtocol: 'ERC-3643',
        currentExecutablePrototype: 'Sepolia restricted ERC-20-compatible',
        missingCanonicalInputs: Array.from({ length: 30 }, (_, index) => `Missing ${index}`),
        pendingSuggestedUpdates: [
          {
            fieldKey: 'expected_investor_count',
            field: 'Expected investors',
            proposedValue: '24',
            confidence: 0.88,
            rationale: hugeIgnoredValue,
          },
        ],
        canonicalFields: {
          protocol_base: {
            label: 'Protocol base',
            value: null,
            status: 'missing',
            sourceType: null,
            sourceRef: hugeIgnoredValue,
            confirmedByUser: false,
          },
          irrelevant_large_field: hugeIgnoredValue,
        },
        protocolRecommendationCaveat: 'Protocol base is selected only after user confirmation.',
      },
      currentTurnExtractedFacts: [
        {
          fieldKey: 'expected_investor_count',
          label: 'Expected investors',
          value: '24',
          sourceType: 'user_message',
          sourceRef: hugeIgnoredValue,
          confidence: 0.88,
        },
      ],
      workspaceDefaults: {
        productName: {
          value: 'MILA Income Fund',
          sourceType: 'approved_requirement_brief',
          sourceRef: 'brief-1',
          ignored: hugeIgnoredValue,
        },
      },
      unrelatedLargeState: hugeIgnoredValue,
    };

    const compact = compactWorkspaceContext(context);
    const serialized = workspaceContextInstruction(context);

    expect(compact).toMatchObject({
      activeTab: {
        id: 'requirements',
        label: 'Product Setup',
      },
      productSetup: {
        selectedProtocolBase: null,
        recommendedProtocol: 'ERC-3643',
        missingCanonicalInputs: expect.arrayContaining(['Missing 0']),
        canonicalFields: {},
      },
      currentTurnExtractedFacts: [
        expect.objectContaining({
          fieldKey: 'expected_investor_count',
          value: '24',
        }),
      ],
    });
    expect(compact?.productSetup).toHaveProperty('pendingSuggestedUpdates');
    expect(JSON.stringify(compact)).not.toContain(hugeIgnoredValue);
    expect(JSON.stringify(compact?.productSetup)).not.toContain('irrelevant_large_field');
    expect(JSON.stringify((compact?.productSetup as { canonicalFields: unknown }).canonicalFields)).not.toContain('Protocol base');
    expect((compact?.productSetup as { missingCanonicalInputs: string[] }).missingCanonicalInputs).toHaveLength(12);
    expect(serialized).toMatch(/Current workspace context, compact JSON/);
    expect(serialized.length).toBeLessThan(2_500);
  });

  it('keeps the Product Setup prompt policy concise while preserving required guardrails', () => {
    const instruction = systemInstructionForAssistantMode('engineering', {
      activeTab: {
        id: 'requirements',
        label: 'Product Setup',
      },
      productSetup: {
        recommendedProtocol: 'ERC-3643',
        canonicalFields: {},
      },
    });

    expect(instruction).toMatch(/conversation-first intake/i);
    expect(instruction).toMatch(/currentTurnExtractedFacts/i);
    expect(instruction).toMatch(/workspaceDefaults/i);
    expect(instruction).toMatch(/Do not invent or prefill product_name or token_symbol/i);
    expect(instruction).toMatch(/recommended architecture target/i);
    expect(instruction).toMatch(/Current executable prototype/i);
    expect(instruction).toMatch(/backend never holds private keys/i);
    expect(instruction).toMatch(/Sepolia\/testnet-only/i);
    expect(instruction.length).toBeLessThan(6_000);
  });
});
