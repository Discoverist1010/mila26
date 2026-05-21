import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import { generateEngineeringBriefMock } from '../agents/engineeringBriefMock';
import { EngineeringBriefRequestSchema } from '../contracts/engineeringBrief';
import { fail, ok } from '../http/responses';

function validationDetails(error: ZodError): Record<string, unknown> {
  return {
    fields: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export const engineeringBriefRoutes: FastifyPluginAsync = async (app) => {
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

    const engineeringBrief = generateEngineeringBriefMock(parsed.data.requirementBrief);
    return reply.send(ok(engineeringBrief));
  });
};
