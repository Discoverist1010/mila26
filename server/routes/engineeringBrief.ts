import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { generateEngineeringBriefWithLlm } from '../agents/engineeringBriefLlm';
import { EngineeringBriefRequestSchema } from '../contracts/engineeringBrief';
import { fail, ok } from '../http/responses';
import { createMila26LlmProviderFromEnv } from '../llm/providerFactory';
import type { Mila26LlmProvider } from '../llm/types';

export type EngineeringBriefRouteOptions = {
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

export const engineeringBriefRoutes: FastifyPluginAsync<EngineeringBriefRouteOptions> = async (app, options) => {
  app.post('/prd/engineering-brief', async (request, reply) => {
    if (!request.body) {
      return reply.code(400).send(fail('VALIDATION_ERROR', 'Engineering Brief request body is required.'));
    }

    const parsed = EngineeringBriefRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .code(400)
        .send(fail('VALIDATION_ERROR', 'Invalid Engineering Brief generation request.', validationDetails(parsed.error)));
    }

    const configuredProvider = options.llmProvider
      ? { ok: true as const, provider: options.llmProvider }
      : createMila26LlmProviderFromEnv();
    const provider = configuredProvider.ok ? configuredProvider.provider : undefined;
    const engineeringBrief = await generateEngineeringBriefWithLlm(parsed.data.requirementBrief, provider);
    return reply.send(ok(engineeringBrief));
  });
};
