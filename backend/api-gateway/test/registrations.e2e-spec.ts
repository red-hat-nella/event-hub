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

describe('RegistrationsController (e2e) — contracts/api-gateway.md § Inscripciones', () => {
  let app: INestApplication;
  let httpServiceMock: HttpServiceMock;
  let userToken: string;
  let otherUserToken: string;
  let adminToken: string;

  beforeAll(async () => {
    httpServiceMock = createHttpServiceMock();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpServiceMock)
      .compile();

    app = await initTestApp(moduleFixture);

    userToken = await signAccessToken({
      sub: 'u1',
      email: 'user@example.com',
      role: 'USER',
    });
    otherUserToken = await signAccessToken({
      sub: 'u2',
      email: 'other@example.com',
      role: 'USER',
    });
    adminToken = await signAccessToken({
      sub: 'admin1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/events/:id/registrations sin sesión -> 401 UNAUTHENTICATED', async () => {
    await request(app.getHttpServer())
      .post('/api/events/e1/registrations')
      .expect(401);
  });

  it('POST /api/events/:id/registrations -> 201 RegistrationDetail, reenvía Idempotency-Key', async () => {
    const registration = {
      id: 'r1',
      userId: 'u1',
      eventId: 'e1',
      status: 'ACTIVE',
      createdAt: '2026-09-07T12:00:00.000Z',
      cancelledAt: null,
    };
    httpServiceMock.post.mockReturnValueOnce(of({ data: registration }));

    const res = await request(app.getHttpServer())
      .post('/api/events/e1/registrations')
      .set('Cookie', [`access_token=${userToken}`])
      .set('Idempotency-Key', 'key-123')
      .expect(201);

    expect(res.body).toEqual(registration);
    expect(httpServiceMock.post).toHaveBeenCalledWith(
      'http://registration-service.test/internal/registrations',
      { userId: 'u1', eventId: 'e1' },
      {
        headers: {
          'X-Internal-Token': 'test-internal-token',
          'Idempotency-Key': 'key-123',
        },
      },
    );
  });

  it('POST /api/events/:id/registrations -> 409 CAPACITY_EXCEEDED propagado', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      throwError(() => ({
        response: {
          status: 409,
          data: {
            error: {
              code: 'CAPACITY_EXCEEDED',
              message: 'El evento alcanzó su capacidad máxima.',
            },
          },
        },
      })),
    );

    const res = await request(app.getHttpServer())
      .post('/api/events/e1/registrations')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(409);

    expect(res.body.error.code).toBe('CAPACITY_EXCEEDED');
  });

  it('POST /api/events/:id/registrations -> 503 SERVICE_UNAVAILABLE si el servicio no responde', async () => {
    httpServiceMock.post.mockReturnValueOnce(
      throwError(() => new Error('ECONNREFUSED')),
    );

    const res = await request(app.getHttpServer())
      .post('/api/events/e1/registrations')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(503);

    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });

  it('GET /api/registrations/me -> 200 con la lista de inscripciones propias', async () => {
    const items = [
      {
        id: 'r1',
        eventId: 'e1',
        eventName: 'Feria de arte urbano',
        eventStartsAt: '2026-10-01T18:00:00.000Z',
        eventLocation: 'Parque Central',
        status: 'ACTIVE',
        createdAt: '2026-09-07T12:00:00.000Z',
      },
    ];
    httpServiceMock.get.mockReturnValueOnce(of({ data: items }));

    const res = await request(app.getHttpServer())
      .get('/api/registrations/me')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(200);

    expect(res.body).toEqual(items);
    expect(httpServiceMock.get).toHaveBeenCalledWith(
      'http://registration-service.test/internal/registrations',
      {
        params: { userId: 'u1' },
        headers: { 'X-Internal-Token': 'test-internal-token' },
      },
    );
  });

  it('GET /api/registrations/:id como propietario -> 200 RegistrationDetail', async () => {
    const registration = {
      id: 'r1',
      userId: 'u1',
      eventId: 'e1',
      status: 'ACTIVE',
      createdAt: '2026-09-07T12:00:00.000Z',
      cancelledAt: null,
    };
    httpServiceMock.get.mockReturnValueOnce(of({ data: registration }));

    const res = await request(app.getHttpServer())
      .get('/api/registrations/r1')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(200);

    expect(res.body).toEqual(registration);
  });

  it('GET /api/registrations/:id como otro usuario (no admin) -> 403 FORBIDDEN', async () => {
    const registration = {
      id: 'r1',
      userId: 'u1',
      eventId: 'e1',
      status: 'ACTIVE',
      createdAt: '2026-09-07T12:00:00.000Z',
      cancelledAt: null,
    };
    httpServiceMock.get.mockReturnValueOnce(of({ data: registration }));

    const res = await request(app.getHttpServer())
      .get('/api/registrations/r1')
      .set('Cookie', [`access_token=${otherUserToken}`])
      .expect(403);

    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/registrations/:id como ADMIN (no propietario) -> 200', async () => {
    const registration = {
      id: 'r1',
      userId: 'u1',
      eventId: 'e1',
      status: 'ACTIVE',
      createdAt: '2026-09-07T12:00:00.000Z',
      cancelledAt: null,
    };
    httpServiceMock.get.mockReturnValueOnce(of({ data: registration }));

    await request(app.getHttpServer())
      .get('/api/registrations/r1')
      .set('Cookie', [`access_token=${adminToken}`])
      .expect(200);
  });

  it('DELETE /api/registrations/:id -> 200 RegistrationDetail con status CANCELLED', async () => {
    const cancelled = {
      id: 'r1',
      userId: 'u1',
      eventId: 'e1',
      status: 'CANCELLED',
      createdAt: '2026-09-07T12:00:00.000Z',
      cancelledAt: '2026-09-07T13:00:00.000Z',
    };
    httpServiceMock.delete.mockReturnValueOnce(of({ data: cancelled }));

    const res = await request(app.getHttpServer())
      .delete('/api/registrations/r1')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(200);

    expect(res.body).toEqual(cancelled);
    expect(httpServiceMock.delete).toHaveBeenCalledWith(
      'http://registration-service.test/internal/registrations/r1',
      {
        headers: { 'X-Internal-Token': 'test-internal-token' },
        data: { userId: 'u1' },
      },
    );
  });

  it('DELETE /api/registrations/:id -> 409 EVENT_ALREADY_STARTED propagado', async () => {
    httpServiceMock.delete.mockReturnValueOnce(
      throwError(() => ({
        response: {
          status: 409,
          data: {
            error: {
              code: 'EVENT_ALREADY_STARTED',
              message: 'Las inscripciones para este evento están cerradas.',
            },
          },
        },
      })),
    );

    const res = await request(app.getHttpServer())
      .delete('/api/registrations/r1')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(409);

    expect(res.body.error.code).toBe('EVENT_ALREADY_STARTED');
  });
});
