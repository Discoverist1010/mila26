import type { FastifyPluginAsync } from 'fastify';

export const healthPayload = {
  ok: true,
  service: 'mila26-api',
  mode: 'local-dev',
} as const;

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => healthPayload);
};
