import type { FastifyPluginAsync } from 'fastify';
import { generateSmartContractArtifactSpec } from '../agents/smartContractArtifactSpecMock';
import { fail, ok } from '../http/responses';

export const smartContractArtifactSpecRoutes: FastifyPluginAsync = async (app) => {
  app.post('/smart-contract/artifact-spec', async (request, reply) => {
    if (!request.body) {
      return reply.code(400).send(fail('VALIDATION_ERROR', 'Smart Contract Artifact Spec request body is required.'));
    }

    const result = generateSmartContractArtifactSpec(request.body);

    if (!result.ok) {
      const statusCode = result.code === 'CLOSURE_NOT_READY' ? 409 : 400;
      return reply.code(statusCode).send(fail(result.code, result.message, result.details));
    }

    return reply.send(ok(result.data));
  });
};
