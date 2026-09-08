import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter';
import { ValidationException } from '../../src/common/app-exception';
import { PrismaService } from '../../src/prisma/prisma.service';

// `./setup-env` fija `process.env.DATABASE_URL`/`INTERNAL_SERVICE_TOKEN` y ya
// se cargó vía `setupFiles` antes de este módulo; se reexporta el token para
// que las pruebas no lo dupliquen.
export { TEST_INTERNAL_TOKEN } from './setup-env';

function buildFieldErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const error of errors) {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      fields[path] = Object.values(error.constraints)[0];
    }

    if (error.children && error.children.length > 0) {
      Object.assign(fields, buildFieldErrors(error.children, path));
    }
  }

  return fields;
}

export async function bootstrapTestApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationException(buildFieldErrors(errors)),
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // `listen(0)` (en vez de `init()`) hace que el servidor HTTP subyacente
  // ya esté escuchando en un puerto efímero antes de que cualquier prueba
  // dispare peticiones. Sin esto, disparar N peticiones concurrentes con
  // `Promise.all` contra un servidor aún no escuchando hace que varias
  // intenten iniciar `listen()` a la vez (supertest lo hace de forma
  // perezosa en la primera petición), lo que produce `ECONNRESET`
  // aleatorios — crítico para que la prueba de concurrencia (T079) sea
  // fiable.
  await app.listen(0);

  const prisma = app.get(PrismaService);

  return { app, prisma };
}

export const internalHeaders = (): Record<string, string> => ({
  'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN as string,
});
