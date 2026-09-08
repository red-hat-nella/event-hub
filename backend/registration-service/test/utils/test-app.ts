import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';
import { EventServiceClient } from '../../src/registrations/event-service.client';

// Debe coincidir con `test/utils/env.setup.ts` (`setupFiles`), que fija las
// variables de entorno ANTES de que `AppModule` (y su `ConfigModule.forRoot`)
// se importe en cualquier archivo de prueba.
export const TEST_INTERNAL_TOKEN = 'test-internal-token';

export interface MockEventServiceClient {
  reserve: jest.Mock;
  release: jest.Mock;
  getEvent: jest.Mock;
}

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  eventServiceClient: MockEventServiceClient;
}

/**
 * Levanta la aplicación Nest completa (mismos pipes/filtros globales que
 * `main.ts`) con `EventServiceClient` reemplazado por un mock de Jest, per
 * la instrucción de mockear el cliente HTTP de `event-service` en las
 * pruebas de `registration-service` (T083/T091/T113).
 */
export async function createTestApp(): Promise<TestContext> {
  const eventServiceClient: MockEventServiceClient = {
    reserve: jest.fn(),
    release: jest.fn(),
    getEvent: jest.fn(),
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EventServiceClient)
    .useValue(eventServiceClient)
    .compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma, eventServiceClient };
}

export async function cleanDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "registrations", "idempotency_keys" RESTART IDENTITY CASCADE;',
  );
}
