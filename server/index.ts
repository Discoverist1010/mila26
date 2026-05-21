import { createApp } from './app';

const host = process.env.MILA26_API_HOST || '127.0.0.1';
const port = Number(process.env.MILA26_API_PORT || 5174);

const app = createApp();

try {
  await app.listen({ host, port });
  console.warn(`mila26-api listening on http://${host}:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
