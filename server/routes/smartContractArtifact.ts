import type { FastifyPluginAsync } from 'fastify';
import { generateSmartContractArtifact } from '../agents/smartContractArtifactMock';
import { fail, ok } from '../http/responses';

export const smartContractArtifactRoutes: FastifyPluginAsync = async (app) => {
  app.post('/smart-contract/artifact', async (request, reply) => {
    const result = generateSmartContractArtifact(request.body);

    if (!result.ok) {
      const statusCode = result.code === 'SPEC_NOT_READY' || result.code === 'CHECK_FAILED' ? 409 : 400;
      return reply.code(statusCode).send(fail(result.code, result.message, result.details));
    }

    return reply.send(ok(result.data));
  });
};
