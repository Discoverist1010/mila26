import type {
  ProductSetupExtractionRequest,
  ProductSetupExtractionResponse,
} from '../../server/contracts/productSetupExtraction';
import { requestJson, type ApiClientResult } from './client';
import type { ProductSetupSuggestedUpdate } from '../domain/productSetup';

const routePath = '/api/product-setup/extract';

export type ProductSetupExtractionClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export type ProductSetupExtractionResult = ApiClientResult<ProductSetupExtractionResponse>;

export async function extractProductSetupFacts(
  request: ProductSetupExtractionRequest,
  options: ProductSetupExtractionClientOptions = {},
): Promise<ProductSetupExtractionResult> {
  if (!request.userMessage.trim()) {
    return { ok: false, code: 'CLIENT_VALIDATION_ERROR', message: 'Enter Product Setup text before extraction.' };
  }

  return requestJson<ProductSetupExtractionResponse>(routePath, request, options);
}

export function toProductSetupSuggestedUpdatesFromExtraction(
  response: ProductSetupExtractionResponse,
  sourceRef: string,
): ProductSetupSuggestedUpdate[] {
  return response.facts.map((fact) => ({
    id: `${fact.fieldKey}-${sourceRef}`,
    fieldKey: fact.fieldKey,
    proposedValue: fact.value,
    rationale: fact.rationale,
    sourceType: fact.status === 'inferred' ? 'assistant_inference' : 'user_message',
    sourceRef,
    confidence: fact.confidence,
  }));
}
