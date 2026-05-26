import Fastify from 'fastify';
import { fail } from './http/responses';
import { blockchainEngineerChatRoutes } from './routes/blockchainEngineerChat';
import { engineeringBriefRoutes } from './routes/engineeringBrief';
import { healthRoutes } from './routes/health';
import { smartContractArtifactRoutes } from './routes/smartContractArtifact';
import { smartContractArtifactSpecRoutes } from './routes/smartContractArtifactSpec';
import type { Mila26LlmProvider } from './llm/types';

const defaultAllowedOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173'];

function parseAllowedOrigins(value: string | undefined): string[] {
  if (!value) {
    return defaultAllowedOrigins;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export type CreateAppOptions = {
  blockchainEngineerLlmProvider?: Mila26LlmProvider;
  engineeringBriefLlmProvider?: Mila26LlmProvider;
};

export function createApp(options: CreateAppOptions = {}) {
  const app = Fastify({ logger: false });
  const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Vary', 'Origin');
      reply.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      reply.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }

    if (request.method === 'OPTIONS') {
      return reply.code(204).send();
    }
  });

  app.register(healthRoutes, { prefix: '/api' });
  app.register(blockchainEngineerChatRoutes, {
    prefix: '/api',
    llmProvider: options.blockchainEngineerLlmProvider,
  });
  app.register(engineeringBriefRoutes, {
    prefix: '/api',
    llmProvider: options.engineeringBriefLlmProvider,
  });
  app.register(smartContractArtifactSpecRoutes, { prefix: '/api' });
  app.register(smartContractArtifactRoutes, { prefix: '/api' });

  app.setNotFoundHandler(async (_request, reply) => {
    return reply.code(404).send(fail('NOT_FOUND', 'Route not found.'));
  });

  app.setErrorHandler(async (_error, _request, reply) => {
    return reply.code(500).send(fail('INTERNAL_ERROR', 'Unexpected server error.'));
  });

  return app;
}
