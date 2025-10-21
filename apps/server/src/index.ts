import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from './config/env';
import { healthRoutes } from './routes/health';
import { phaseRoutes } from './routes/phase';
import { childrenRoutes } from './routes/children';
import { checklistRoutes } from './routes/checklist';
import { adminRoutes } from './routes/admin';

async function start() {
  const env = loadEnv();
  const app = Fastify({ logger: { level: env.LOG_LEVEL || 'info' } });
  const allowedOrigins = env.ALLOWED_ORIGIN.split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed'), false);
    },
  });

  const prefix = env.API_PREFIX || '/api/v1';

  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(healthRoutes, { prefix });
  await app.register(phaseRoutes, { prefix });
  await app.register(childrenRoutes, { prefix });
  await app.register(checklistRoutes, { prefix });
  await app.register(adminRoutes, { prefix });
  const port = Number(env.PORT || 3000);
  await app.listen({ port, host: '0.0.0.0' });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
