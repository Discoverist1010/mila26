import { zodTextFormat } from 'openai/helpers/zod';
import {
  ProductSetupExtractionResponseSchema,
  type ProductSetupExtractionRequest,
  type ProductSetupExtractionResponse,
} from '../contracts/productSetupExtraction';
import {
  checkPromptBudget,
  promptBudgets,
  toPromptBudgetMetadata,
} from '../llm/promptBudget';
import type { Mila26LlmMessage, Mila26LlmProvider } from '../llm/types';

const productSetupExtractionTextFormat = zodTextFormat(
  ProductSetupExtractionResponseSchema.omit({ extractionSource: true }),
  'mila26_product_setup_extraction',
  {
    description:
      'Structured Product Setup facts extracted from the latest user message. Do not include facts not present in the latest message.',
  },
);

const productSetupExtractionSystemInstruction = [
  'You extract Product Setup facts for ZiLi-OS, an asset-manager tokenisation workspace.',
  'Return only facts stated or clearly implied in the latest user message. Do not invent product names, token symbols, dates, currencies, protocol selections, or wallet rules.',
  'Use user_stated when the user explicitly says the fact. Use inferred only when the field is a narrow interpretation of their wording.',
  'A selected protocol base is only user_stated if the user explicitly chooses ERC-20, Customised ERC-20, or ERC-3643.',
  'If the user selects ERC-20, do not return ERC-3643 as protocol_base. ERC-3643 can be discussed later as a tradeoff, but not extracted as a captured fact.',
  'If the user says custom ERC-20, customised ERC-20, customised ERC20, or ERC-20 with extra controls, return protocol_base="Customised ERC-20".',
  'Extract product wrapper, asset class, product structure, offering type, eligible investor type, launch date, duration_months, payment methods, whitelist requirement, P2P setting, and investor cap when stated.',
  'For offering type, phrases like "offering type is private placement", "private placement", or "private offering" should return offering_type, not eligible_investor_type.',
  'For Singapore-only, CSV-only NAV upload, Sepolia testnet, whitelist-based compliance model, and evidence model, do not invent user-stated facts; those are locked app defaults unless the user directly discusses them.',
  'For income: "income distribution yes", "income will be distributed", and "income payout quarterly" mean income_treatment=Distributing. Also extract income_payout_cadence if a cadence is present.',
  'For income timing, "income is distributed one day before redemption" belongs to income_payout_cadence detail. Do not turn it into redemption_payout_delay.',
  'For term/maturity: extract phrases like "it will be for 3 years", "term is 3 years", and "maturity is 3 years after IPO" into duration_months. Return exact maturity dates into maturity_date only when the date is explicitly stated.',
  'For NAV: "NAV is monthly" means nav_cadence=Monthly. "NAV is uploaded monthly" also implies nav_source or nav_upload_method only if the user states who uploads or the upload method. "NAV pushed/sent to investors" means investor_update_rule, not nav_source.',
  'For asset class, do not treat "underlying product is a fund" as an asset class. Use underlying_asset_class only for asset descriptions such as equities, bonds, private credit, money market fund, mixed portfolio, or portfolio when stated as the underlying asset class.',
  'For offchain KYC, do not invent eligible_investor_type. Eligible investor type must be one of retail, high net worth, accredited investor, institutional, or all when the user says it.',
  'Investor type is verified offchain before wallet whitelisting. Do not claim the contract independently verifies retail, high net worth, accredited, or institutional status.',
  'For dates in plain language, normalize exact dates to YYYY-MM-DD only when unambiguous. Keep relative terms like "3 years after IPO date of 8 Nov 2026" as readable text.',
  'For whitelisting: "approved wallets only" or "whitelisted addresses" means whitelisted_wallets_required=true and investor_wallet_rule="Approved wallets only; transfers should stay between approved wallets."',
  'Target operational details to downstream tabs when appropriate, but keep fieldKey as the canonical Product Setup field.',
  'Never return private keys, seed phrases, raw secrets, legal/compliance conclusions, investment advice, audit conclusions, deployment claims, or mainnet instructions.',
].join(' ');

function extractionMessages(request: ProductSetupExtractionRequest): Mila26LlmMessage[] {
  return [
    {
      role: 'system',
      content: productSetupExtractionSystemInstruction,
    },
    {
      role: 'user',
      content: JSON.stringify({
        instruction:
          'Extract Product Setup facts from latestUserMessage only. Use productSetupContext only to avoid conflicting with an existing user-selected value.',
        latestUserMessage: request.userMessage,
        sourceRef: request.sourceRef,
        productSetupContext: request.productSetupContext ?? {},
      }),
    },
  ];
}

function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('EMPTY_LLM_OUTPUT');
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/u, '');
  return JSON.parse(withoutFence);
}

function includesUnsafeProviderText(content: string): boolean {
  return [
    /OPENAI_API_KEY/i,
    /MILA26_LLM_[A-Z0-9_]+/i,
    /VITE_[A-Z0-9_]*LLM[A-Z0-9_]*/i,
    /\bsk-[A-Za-z0-9_-]{6,}/,
    /private\s+key/i,
    /seed\s+phrase/i,
    /recovery\s+phrase/i,
    /stack trace/i,
  ].some((pattern) => pattern.test(content));
}

function fallbackUnavailable(): ProductSetupExtractionResponse {
  return {
    extractionSource: 'fallback_unavailable',
    facts: [],
    warnings: ['Structured extraction unavailable; frontend should use deterministic local fallback.'],
  };
}

export async function extractProductSetupFactsWithLlm(
  request: ProductSetupExtractionRequest,
  provider?: Mila26LlmProvider,
): Promise<ProductSetupExtractionResponse> {
  if (!provider || provider.provider === 'mock') {
    return fallbackUnavailable();
  }

  try {
    const messages = extractionMessages(request);
    const promptBudget = checkPromptBudget({
      budget: promptBudgets.productSetupExtraction,
      messages,
    });

    if (!promptBudget.ok) {
      return fallbackUnavailable();
    }

    const llmResponse = await provider.complete({
      purpose: 'product_setup_extraction',
      messages,
      maxOutputTokens: 900,
      reasoningEffort: 'minimal',
      textVerbosity: 'low',
      textFormat: productSetupExtractionTextFormat,
      metadata: {
        route: 'product-setup-extraction',
        sourceRef: request.sourceRef,
        ...toPromptBudgetMetadata(promptBudget.diagnostics),
      },
    });

    if (includesUnsafeProviderText(llmResponse.content)) {
      return fallbackUnavailable();
    }

    const parsedJson = parseJsonObject(llmResponse.content);
    const parsed = ProductSetupExtractionResponseSchema.omit({ extractionSource: true }).parse(parsedJson);

    return {
      extractionSource: 'llm',
      facts: parsed.facts,
      warnings: parsed.warnings,
    };
  } catch {
    return fallbackUnavailable();
  }
}
