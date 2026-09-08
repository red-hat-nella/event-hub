// Local-only integration runner. Fresh in-memory credentials, isolated databases;
// never executes against the deployment or prints credential values.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../backend/user-service/package.json', import.meta.url));
const { PrismaClient } = require('@prisma/client');
const { bootstrapAdmin } = require('./dist/bootstrap/admin-bootstrap.js');
const env = { ...process.env, NODE_ENV: 'test', ACCOUNT_PRODUCTION_TEST: '1', JWT_SECRET: randomBytes(32).toString('hex'), INTERNAL_SERVICE_TOKEN: randomBytes(32).toString('hex'),
  SEED_ADMIN_EMAIL: `account-${Date.now()}@example.test`, SEED_ADMIN_PASSWORD: randomBytes(24).toString('base64url'),
  ACCOUNT_TEST_DOMAIN: `${randomBytes(10).toString('hex')}.example.test`,
  USER_SERVICE_URL: 'http://localhost:3001', EVENT_SERVICE_URL: 'http://localhost:3002', REGISTRATION_SERVICE_URL: 'http://localhost:3003' };
const database = port => `postgresql://dev:dev@localhost:${port}/account_experience_test?schema=public`;
const prisma = new PrismaClient({ datasources: { db: { url: database(5432) } } });
await bootstrapAdmin(prisma, { email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD });
await bootstrapAdmin(prisma, { email: env.SEED_ADMIN_EMAIL, password: env.SEED_ADMIN_PASSWORD });
const fixture = await prisma.user.findUniqueOrThrow({ where: { email: env.SEED_ADMIN_EMAIL } });
const children = [];
let finished = false;
async function cleanup() {
  if (finished) return; finished = true;
  for (const child of children) child.kill('SIGTERM');
  await prisma.user.delete({ where: { id: fixture.id } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${env.ACCOUNT_TEST_DOMAIN}` } } });
  await prisma.$disconnect();
}
for (const [index, service] of ['user-service', 'event-service', 'registration-service', 'api-gateway'].entries()) {
  children.push(spawn(process.execPath, ['dist/main.js'], { cwd: new URL(`../backend/${service}/`, import.meta.url), env: { ...env, PORT: String(index === 3 ? 8080 : 3001 + index), DATABASE_URL: database(5432 + index) }, stdio: 'ignore' }));
}
try {
  for (const port of [3001, 3002, 3003, 8080]) {
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { ready = (await fetch(`http://localhost:${port}/${port === 8080 ? '' : 'internal/'}healthz`)).ok; } catch {}
      if (ready) break;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error(`Local workload not ready on port ${port}`);
  }
  const test = spawn('npm', ['run', 'test:e2e', '--', ...process.argv.slice(2)], { cwd: new URL('../frontend/', import.meta.url), env, stdio: 'inherit' });
  children.push(test);
  process.exitCode = await new Promise(resolve => test.on('exit', code => resolve(code ?? 1)));
} finally { await cleanup(); }
process.on('SIGTERM', cleanup);
