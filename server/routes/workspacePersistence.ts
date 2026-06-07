import type { FastifyPluginAsync } from 'fastify';
import { ZodError } from 'zod';
import {
  WorkspacePersistenceLoadRequestSchema,
  WorkspacePersistenceSaveRequestSchema,
} from '../contracts/workspacePersistence';
import { fail, ok } from '../http/responses';
import {
  createFileWorkspacePersistenceRepository,
  WorkspacePersistenceValidationError,
  type WorkspacePersistenceRepository,
} from '../persistence/workspacePersistenceRepository';

export type WorkspacePersistenceRouteOptions = {
  repository?: WorkspacePersistenceRepository;
};

function validationDetails(error: ZodError): Record<string, unknown> {
  return {
    fields: error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    })),
  };
}

export const workspacePersistenceRoutes: FastifyPluginAsync<WorkspacePersistenceRouteOptions> = async (app, options) => {
  const repository = options.repository ?? createFileWorkspacePersistenceRepository();

  if (!options.repository) {
    app.addHook('onClose', async () => {
      repository.close();
    });
  }

  app.post('/workspace/save', async (request, reply) => {
    const parsed = WorkspacePersistenceSaveRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .code(400)
        .send(fail('VALIDATION_ERROR', 'Invalid workspace persistence save request.', validationDetails(parsed.error)));
    }

    try {
      return reply.send(ok(repository.saveWorkspaceSnapshot(parsed.data)));
    } catch (error) {
      if (error instanceof WorkspacePersistenceValidationError) {
        return reply.code(400).send(fail('VALIDATION_ERROR', error.message, error.details));
      }

      throw error;
    }
  });

  app.post('/workspace/load-latest', async (request, reply) => {
    const parsed = WorkspacePersistenceLoadRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply
        .code(400)
        .send(fail('VALIDATION_ERROR', 'Invalid workspace persistence load request.', validationDetails(parsed.error)));
    }

    const record = repository.loadLatestWorkspace(parsed.data.projectId);
    if (!record) {
      return reply.code(404).send(fail('NOT_FOUND', 'No persisted workspace snapshot found for this project.'));
    }

    return reply.send(ok(record));
  });
};
