process.env.USER_SERVICE_URL = 'http://user-service.test';
process.env.EVENT_SERVICE_URL = 'http://event-service.test';
process.env.REGISTRATION_SERVICE_URL = 'http://registration-service.test';
process.env.JWT_SECRET = 'test-secret';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-token';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  createHttpServiceMock,
  HttpServiceMock,
  initTestApp,
  signAccessToken,
} from './utils/setup-test-app';

describe('AuthController (e2e) — contracts/api-gateway.md § Autenticación', () => {
  let app: INestApplication;
  let httpServiceMock: HttpServiceMock;

  beforeAll(async () => {
    httpServiceMock = createHttpServiceMock();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpServiceMock)
      .compile();

    app = await initTestApp(moduleFixture);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/register -> 201 con el usuario creado por user-service', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      of({
        data: {
          id: 'u1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'USER',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'supersecret',
      })
      .expect(201);

    expect(res.body).toEqual({
      id: 'u1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(httpServiceMock.post).toHaveBeenCalledWith(
      'http://user-service.test/internal/users',
      {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'supersecret',
      },
      { headers: { 'X-Internal-Token': 'test-internal-token' } },
    );
  });

  it('POST /api/auth/register -> 409 EMAIL_IN_USE propagado desde user-service', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      throwError(() => ({
        response: {
          status: 409,
          data: {
            error: {
              code: 'EMAIL_IN_USE',
              message: 'Ese correo ya está registrado.',
            },
          },
        },
      })),
    );

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ada@example.com', password: 'supersecret' })
      .expect(409);

    expect(res.body).toEqual({
      error: {
        code: 'EMAIL_IN_USE',
        message: 'Ese correo ya está registrado.',
      },
    });
  });

  it('POST /api/auth/register -> 400 VALIDATION_ERROR generado por el Gateway (campos faltantes)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toBeDefined();
    expect(httpServiceMock.post).not.toHaveBeenCalled();
  });

  it('POST /api/auth/login -> 200 + cookies httpOnly access_token/refresh_token', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      of({
        data: {
          user: {
            id: 'u1',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            role: 'USER',
          },
          accessToken: 'signed.access.jwt',
          refreshToken: 'signed.refresh.jwt',
        },
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'supersecret' })
      .expect(200);

    expect(res.body).toEqual({
      id: 'u1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(Array.isArray(cookies)).toBe(true);
    const accessCookie = cookies.find((c) => c.startsWith('access_token='));
    const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
    expect(accessCookie).toContain('signed.access.jwt');
    expect(accessCookie).toMatch(/HttpOnly/i);
    expect(accessCookie).toMatch(/SameSite=Lax/i);
    expect(refreshCookie).toContain('signed.refresh.jwt');
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  it('POST /api/auth/login -> 401 INVALID_CREDENTIALS propagado desde user-service', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      throwError(() => ({
        response: {
          status: 401,
          data: {
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Correo o contraseña incorrectos.',
            },
          },
        },
      })),
    );

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-password' })
      .expect(401);

    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/refresh sin cookie refresh_token -> 401 SESSION_EXPIRED', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .expect(401);
    expect(res.body.error.code).toBe('SESSION_EXPIRED');
  });

  it('POST /api/auth/refresh con cookie válida -> 200 + cookies rotadas', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      of({
        data: {
          accessToken: 'new.access.jwt',
          refreshToken: 'new.refresh.jwt',
        },
      }),
    );

    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', ['refresh_token=old.refresh.jwt'])
      .expect(200);

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(
      cookies.some((c) => c.startsWith('access_token=new.access.jwt')),
    ).toBe(true);
    expect(
      cookies.some((c) => c.startsWith('refresh_token=new.refresh.jwt')),
    ).toBe(true);
  });

  it('POST /api/auth/logout -> 204 y limpia ambas cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .expect(204);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
    expect(cookies.some((c) => c.startsWith('refresh_token=;'))).toBe(true);
  });

  it('GET /api/auth/me sin sesión -> 401 UNAUTHENTICATED', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('GET /api/auth/me con access_token válido -> 200 perfil', async () => {
    const token = await signAccessToken({
      sub: 'u1',
      email: 'ada@example.com',
      role: 'USER',
    });

    httpServiceMock.get.mockReturnValueOnce(
      of({
        data: {
          id: 'u1',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          role: 'USER',
        },
      }),
    );

    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', [`access_token=${token}`])
      .expect(200);

    expect(res.body).toEqual({
      id: 'u1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'USER',
    });
    expect(httpServiceMock.get).toHaveBeenCalledWith(
      'http://user-service.test/internal/users/u1',
      { headers: { 'X-Internal-Token': 'test-internal-token' } },
    );
  });
});
