import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '../../src/common/http-exception.filter';

/**
 * Replica en las pruebas e2e la configuración de `src/main.ts`
 * (`cookie-parser`, `ValidationPipe` global, filtro de excepción global),
 * que no se ejecuta automáticamente al crear la app desde un
 * `TestingModule`.
 */
export async function initTestApp(
  moduleFixture: TestingModule,
): Promise<INestApplication> {
  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const fields: Record<string, string> = {};
        for (const error of errors) {
          if (error.constraints) {
            fields[error.property] = Object.values(error.constraints)[0];
          }
        }
        return new BadRequestException({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Revisa los campos marcados.',
            fields,
          },
        });
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

export interface HttpServiceMock {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
}

export function createHttpServiceMock(): HttpServiceMock {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
}

/** Firma un `access_token` válido con el mismo secreto usado en las pruebas. */
export function signAccessToken(payload: {
  sub: string;
  email: string;
  role: string;
}): Promise<string> {
  const jwtService = new JwtService({});
  return jwtService.signAsync(payload, { secret: process.env.JWT_SECRET });
}
