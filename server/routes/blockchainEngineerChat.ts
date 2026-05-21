import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { answerWithBlockchainEngineerLlm } from '../agents/blockchainEngineerLlm';
import { BlockchainEngineerChatRequestSchema } from '../contracts/chat';
import { fail, ok } from '../http/responses';
import { createMila26LlmProviderFromEnv } from '../llm/providerFactory';
import type { Mila26LlmProvider } from '../llm/types';

export type BlockchainEngineerChatRouteOptions = {
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

export const blockchainEngineerChatRoutes: FastifyPluginAsync<BlockchainEngineerChatRouteOptions> = async (app, options) => {
  const configuredProvider = options.llmProvider
    ? {
        ok: true as const,
        provider: options.llmProvider,
      }
    : createMila26LlmProviderFromEnv();

  app.post('/chat/blockchain-engineer', async (request, reply) => {
    const parsed = BlockchainEngineerChatRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .code(400)
        .send(fail('VALIDATION_ERROR', 'Invalid Blockchain Engineering Bot chat request.', validationDetails(parsed.error)));
    }

    const provider = configuredProvider.ok ? configuredProvider.provider : undefined;
    const response = await answerWithBlockchainEngineerLlm(parsed.data, provider);
    return reply.send(ok(response));
  });
};
