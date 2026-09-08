/**
 * Se ejecuta antes de importar cualquier archivo de prueba (`setupFiles` en
 * `jest-e2e.json`), porque `ConfigModule.forRoot({ validate })` lee
 * `process.env` en el momento en que se evalúa el decorador `@Module` de
 * `AppModule` — es decir, al importarlo, antes de que corra cualquier
 * `beforeAll`/`beforeEach` del archivo de prueba.
 */
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:35432/registrations?schema=public';
process.env.EVENT_SERVICE_URL = 'http://event-service.invalid';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';
process.env.PORT = '0';
