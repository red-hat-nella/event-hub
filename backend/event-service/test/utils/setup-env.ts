/**
 * Se carga vía `setupFiles` de Jest (test/jest-e2e.json), es decir, ANTES
 * de que cualquier archivo de prueba importe `AppModule`. Esto es
 * indispensable porque `ConfigModule.forRoot({ validate })` se ejecuta en
 * el momento de evaluar el decorador `@Module()` (al importar el módulo),
 * no al instanciarlo — si las variables de entorno se fijaran dentro de
 * `bootstrap-app.ts` (que también importa `AppModule`), llegarían tarde.
 */
export const TEST_INTERNAL_TOKEN = 'test-internal-service-token';

process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://event_service:event_service@localhost:5433/db_events?schema=public';
process.env.INTERNAL_SERVICE_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN ?? TEST_INTERNAL_TOKEN;
process.env.DEFAULT_EVENT_DURATION_HOURS =
  process.env.DEFAULT_EVENT_DURATION_HOURS ?? '3';
