import {
  INestApplication,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { ValidationError } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Pruebas de contrato de autenticación (T068, `contracts/user-service.md`).
 *
 * Requiere una base PostgreSQL real accesible vía `DATABASE_URL` con el
 * esquema migrado (`npx prisma migrate deploy`). No usa mocks de Prisma
 * porque el contrato depende de comportamiento real de la base de datos
 * (índice único de `email` -> 409 EMAIL_IN_USE).
 */

const INTERNAL_TOKEN =
  process.env.INTERNAL_SERVICE_TOKEN ?? 'test-internal-token';

function buildFieldErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string> {
  return errors.reduce<Record<string, string>>((fields, error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    if (error.constraints) {
      const [firstMessage] = Object.values(error.constraints);
      fields[path] = firstMessage;
    }
    if (error.children && error.children.length > 0) {
      Object.assign(fields, buildFieldErrors(error.children, path));
    }
    return fields;
  }, {});
}

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    process.env.INTERNAL_SERVICE_TOKEN = INTERNAL_TOKEN;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors: ValidationError[]) =>
          new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: 'Revisa los campos marcados.',
            fields: buildFieldErrors(errors),
          }),
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: '@e2e.event-hub.test' } },
    });
    await app.close();
  });

  function authHeader(req: request.Test): request.Test {
    return req.set('X-Internal-Token', INTERNAL_TOKEN);
  }

  describe('POST /internal/users', () => {
    it('registra un usuario nuevo (201)', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Ada Lovelace',
        email: 'ada@e2e.event-hub.test',
        password: 'contrasena-larga',
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: 'Ada Lovelace',
        email: 'ada@e2e.event-hub.test',
        role: 'USER',
      });
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('responde 409 EMAIL_IN_USE si el correo ya existe', async () => {
      await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Duplicado Uno',
        email: 'duplicado@e2e.event-hub.test',
        password: 'contrasena-larga',
      });

      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Duplicado Dos',
        email: 'duplicado@e2e.event-hub.test',
        password: 'otra-contrasena',
      });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('EMAIL_IN_USE');
    });

    it('responde 400 VALIDATION_ERROR con campos si el payload es inválido', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({ name: '', email: 'no-es-un-correo', password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.fields).toBeDefined();
    });

    it('responde 403 si falta X-Internal-Token', async () => {
      const response = await request(app.getHttpServer())
        .post('/internal/users')
        .send({
          name: 'Sin Token',
          email: 'sintoken@e2e.event-hub.test',
          password: 'contrasena-larga',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /internal/users/authenticate', () => {
    beforeAll(async () => {
      await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Grace Hopper',
        email: 'grace@e2e.event-hub.test',
        password: 'contrasena-correcta',
      });
    });

    it('inicia sesión con credenciales correctas (200)', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users/authenticate'),
      ).send({
        email: 'grace@e2e.event-hub.test',
        password: 'contrasena-correcta',
      });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email: 'grace@e2e.event-hub.test',
        role: 'USER',
      });
      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.refreshToken).toEqual(expect.any(String));
      expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('responde 401 INVALID_CREDENTIALS con contraseña incorrecta', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users/authenticate'),
      ).send({
        email: 'grace@e2e.event-hub.test',
        password: 'contrasena-incorrecta',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('responde 401 INVALID_CREDENTIALS con correo inexistente (genérico)', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users/authenticate'),
      ).send({
        email: 'no-existe@e2e.event-hub.test',
        password: 'lo-que-sea1',
      });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /internal/users/refresh', () => {
    it('emite un nuevo par de tokens con un refreshToken válido (200, rotación)', async () => {
      await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Margaret Hamilton',
        email: 'margaret@e2e.event-hub.test',
        password: 'contrasena-larga',
      });

      const loginResponse = await authHeader(
        request(app.getHttpServer()).post('/internal/users/authenticate'),
      ).send({
        email: 'margaret@e2e.event-hub.test',
        password: 'contrasena-larga',
      });

      const { refreshToken } = loginResponse.body;

      // El claim `iat` de un JWT trunca a segundos: si se firma un payload
      // idéntico dentro del mismo segundo el token resultante es
      // byte-idéntico (no es un fallo de rotación). Se espera >1s para que
      // la prueba distinga una rotación real de una coincidencia temporal.
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const refreshResponse = await authHeader(
        request(app.getHttpServer()).post('/internal/users/refresh'),
      ).send({ refreshToken });

      expect(refreshResponse.status).toBe(200);
      expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
      expect(refreshResponse.body.refreshToken).toEqual(expect.any(String));
      expect(refreshResponse.body.refreshToken).not.toBe(refreshToken);
    });

    it('responde 401 SESSION_EXPIRED con un refreshToken inválido', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users/refresh'),
      ).send({ refreshToken: 'token-invalido' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_EXPIRED');
    });

    it('responde 401 SESSION_EXPIRED si se reutiliza un accessToken como refreshToken', async () => {
      const loginResponse = await authHeader(
        request(app.getHttpServer()).post('/internal/users/authenticate'),
      ).send({
        email: 'margaret@e2e.event-hub.test',
        password: 'contrasena-larga',
      });

      const response = await authHeader(
        request(app.getHttpServer()).post('/internal/users/refresh'),
      ).send({ refreshToken: loginResponse.body.accessToken });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('SESSION_EXPIRED');
    });
  });

  describe('GET /internal/users', () => {
    it('devuelve el lote de usuarios solicitado vía ?ids=a,b,c', async () => {
      const first = await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Usuario Lote 1',
        email: 'lote1@e2e.event-hub.test',
        password: 'contrasena-larga',
      });
      const second = await authHeader(
        request(app.getHttpServer()).post('/internal/users'),
      ).send({
        name: 'Usuario Lote 2',
        email: 'lote2@e2e.event-hub.test',
        password: 'contrasena-larga',
      });

      const response = await authHeader(
        request(app.getHttpServer()).get(
          `/internal/users?ids=${first.body.id},${second.body.id}`,
        ),
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((u: { id: string }) => u.id).sort()).toEqual(
        [first.body.id, second.body.id].sort(),
      );
    });

    it('responde 400 VALIDATION_ERROR si ?ids= está vacío', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).get('/internal/users?ids='),
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('responde 400 VALIDATION_ERROR si se piden más de 100 ids', async () => {
      const tooManyIds = Array.from({ length: 101 }, (_, i) => `id-${i}`).join(
        ',',
      );

      const response = await authHeader(
        request(app.getHttpServer()).get(`/internal/users?ids=${tooManyIds}`),
      );

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /internal/users/:id', () => {
    it('responde 404 NOT_FOUND si el usuario no existe', async () => {
      const response = await authHeader(
        request(app.getHttpServer()).get(
          '/internal/users/00000000-0000-0000-0000-000000000000',
        ),
      );

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /internal/healthz y /internal/readyz', () => {
    it('healthz responde 200 sin token', async () => {
      const response = await request(app.getHttpServer()).get(
        '/internal/healthz',
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('readyz responde 200 cuando la base de datos está disponible', async () => {
      const response = await request(app.getHttpServer()).get(
        '/internal/readyz',
      );
      expect(response.status).toBe(200);
    });
  });
});
