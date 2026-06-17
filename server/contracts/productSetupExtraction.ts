import { z } from 'zod';

export const ProductSetupExtractionFieldKeySchema = z.enum([
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
  'issuer_owner',
  'product_type',
  'base_currency',
  'income_treatment',
  'protocol_base',
  'expected_investor_count',
  'investor_wallet_rule',
  'whitelisted_wallets_required',
  'subscription_cadence',
  'subscription_payment_method',
  'subscription_stablecoins',
  'subscription_receiving_wallet',
  'redemption_cadence',
  'redemption_payment_method',
  'redemption_stablecoin_type',
  'redemption_schedule',
  'redemption_payout_delay',
  'income_payout_cadence',
  'redemption_payout_cadence',
  'minimum_redemption_amount',
  'p2p_transfer_allowed',
  'compliance_model',
  'evidence_model',
  'duration_months',
  'derived_maturity_date',
  'maturity_description',
  'redemption_wallet',
  'admin_wallet',
  'burn_lock_rule',
  'nav_cadence',
  'nav_upload_method',
  'nav_source',
  'investor_update_rule',
  'initial_distribution_date',
  'initial_investor_register_rule',
  'maturity_date',
  'maturity_closeout_rule',
  'prototype_network',
]);

export const ProductSetupExtractionValueSchema = z.union([
  z.string().trim().min(1).max(500),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().trim().min(1).max(80)).min(1).max(12),
]);

export const ProductSetupExtractionFactSchema = z
  .object({
    fieldKey: ProductSetupExtractionFieldKeySchema,
    value: ProductSetupExtractionValueSchema,
    status: z.enum(['user_stated', 'inferred']).default('user_stated'),
    confidence: z.number().min(0).max(1),
    sourceQuote: z.string().trim().min(1).max(500),
    rationale: z.string().trim().min(1).max(500),
    targetTab: z
      .enum(['product_setup', 'investor_wallets', 'subscription', 'contract_ops', 'asset_servicing', 'redemption', 'maturity'])
      .default('product_setup'),
  })
  .strict();

export const ProductSetupExtractionRequestSchema = z
  .object({
    userMessage: z.string().trim().min(1).max(8000),
    sourceRef: z.string().trim().min(1).max(120),
    productSetupContext: z
      .object({
        selectedProtocolBase: z.string().trim().max(80).nullable().optional(),
        recommendedProtocol: z.string().trim().max(80).nullable().optional(),
        currentExecutablePrototype: z.string().trim().max(240).nullable().optional(),
        canonicalFields: z.record(z.string(), z.unknown()).optional(),
        pendingSuggestedUpdates: z.array(z.unknown()).max(12).optional(),
      })
      .passthrough()
      .optional(),
  })
  .strict();

export const ProductSetupExtractionResponseSchema = z
  .object({
    extractionSource: z.enum(['llm', 'fallback_unavailable']),
    facts: z.array(ProductSetupExtractionFactSchema).max(16),
    warnings: z.array(z.string().trim().min(1).max(240)).max(8),
  })
  .strict();

export type ProductSetupExtractionRequest = z.infer<typeof ProductSetupExtractionRequestSchema>;
export type ProductSetupExtractionResponse = z.infer<typeof ProductSetupExtractionResponseSchema>;
export type ProductSetupExtractionFact = z.infer<typeof ProductSetupExtractionFactSchema>;
