import Fastify from 'fastify';
import type { HealthResponse } from '../../../shared/contract/src/index.js';

const port = Number(process.env.PORT ?? 8787);
const role = (process.env.ROLE ?? 'all') as HealthResponse['role'];
const app = Fastify({ logger: true });

app.get('/health', async (): Promise<HealthResponse> => ({
  ok: true, role, version: '0.1.0', modes: { sarvam: 'mock', flagsmith: 'mock', contextDev: 'off' },
}));

app.listen({ port, host: '0.0.0.0' }).catch((err: unknown) => {
  app.log.error(err);
  process.exit(1);
});
