import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { extractProductSetupFactsWithLlm } from '../agents/productSetupExtractorLlm';
import { ProductSetupExtractionRequestSchema } from '../contracts/productSetupExtraction';
import { fail, ok } from '../http/responses';
import { createMila26LlmProviderFromEnv } from '../llm/providerFactory';
import type { Mila26LlmProvider } from '../llm/types';

export type ProductSetupExtractionRouteOptions = {
  llmProvider?: Mila26LlmProvider;
};

function validationDetails(error: ZodError): Record<string, unknown> {
  return {
    fields: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export const productSetupExtractionRoutes: FastifyPluginAsync<ProductSetupExtractionRouteOptions> = async (app, options) => {
  const configuredProvider = options.llmProvider
    ? {
        ok: true as const,
        provider: options.llmProvider,
      }
    : createMila26LlmProviderFromEnv();

  app.post('/product-setup/extract', async (request, reply) => {
    const parsed = ProductSetupExtractionRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .code(400)
        .send(fail('VALIDATION_ERROR', 'Invalid Product Setup extraction request.', validationDetails(parsed.error)));
    }

    const provider = configuredProvider.ok ? configuredProvider.provider : undefined;
    const response = await extractProductSetupFactsWithLlm(parsed.data, provider);
    return reply.send(ok(response));
  });
};
