import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { answerWithBlockchainEngineerMock } from '../agents/blockchainEngineerMock';
import { BlockchainEngineerChatRequestSchema } from '../contracts/chat';
import { fail, ok } from '../http/responses';

function validationDetails(error: ZodError): Record<string, unknown> {
  return {
    fields: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export const blockchainEngineerChatRoutes: FastifyPluginAsync = async (app) => {
  app.post('/chat/blockchain-engineer', async (request, reply) => {
    const parsed = BlockchainEngineerChatRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .code(400)
        .send(fail('VALIDATION_ERROR', 'Invalid Blockchain Engineering Bot chat request.', validationDetails(parsed.error)));
    }

    const response = answerWithBlockchainEngineerMock(parsed.data);
    return reply.send(ok(response));
  });
};
