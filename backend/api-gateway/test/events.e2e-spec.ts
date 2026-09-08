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

describe('EventsController (e2e) — contracts/api-gateway.md § Catálogo / Administración de eventos', () => {
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

  it('GET /api/events -> 200 con passthrough de la lista paginada', async () => {
    const payload = {
      items: [
        {
          id: 'e1',
          name: 'Feria de arte urbano',
          startsAt: '2026-10-01T18:00:00.000Z',
          location: 'Parque Central',
          category: 'art',
          imageUrl: null,
          maxCapacity: 100,
          availableSlots: 40,
          temporalStatus: 'upcoming',
        },
      ],
      page: 1,
      pageSize: 12,
      total: 1,
      totalPages: 1,
    };
    httpServiceMock.get.mockReturnValueOnce(of({ data: payload }));

    const res = await request(app.getHttpServer())
      .get('/api/events')
      .query({ search: 'arte', page: 1, pageSize: 12 })
      .expect(200);

    expect(res.body).toEqual(payload);
    expect(httpServiceMock.get).toHaveBeenCalledWith(
      'http://event-service.test/internal/events',
      expect.objectContaining({
        params: expect.objectContaining({
          search: 'arte',
          page: 1,
          pageSize: 12,
        }),
        headers: { 'X-Internal-Token': 'test-internal-token' },
      }),
    );
  });

  it('GET /api/events/:id -> 200 con el detalle del evento', async () => {
    const event = {
      id: 'e1',
      name: 'Feria de arte urbano',
      description: 'Una feria al aire libre.',
      maxCapacity: 100,
      availableSlots: 40,
    };
    httpServiceMock.get.mockReturnValueOnce(of({ data: event }));

    const res = await request(app.getHttpServer())
      .get('/api/events/e1')
      .expect(200);
    expect(res.body).toEqual(event);
  });

  it('GET /api/events/:id -> 404 NOT_FOUND propagado desde event-service', async () => {
    httpServiceMock.get.mockReturnValueOnce(
      throwError(() => ({
        response: {
          status: 404,
          data: {
            error: {
              code: 'NOT_FOUND',
              message: 'Este recurso ya no está disponible.',
            },
          },
        },
      })),
    );

    const res = await request(app.getHttpServer())
      .get('/api/events/missing')
      .expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('POST /api/events sin sesión -> 401 UNAUTHENTICATED', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/events')
      .send({
        name: 'Nuevo evento',
        description: 'Descripción',
        startsAt: '2026-12-01T10:00:00.000Z',
        location: 'Auditorio',
        maxCapacity: 50,
      })
      .expect(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('POST /api/events con rol USER -> 403 FORBIDDEN', async () => {
    const token = await signAccessToken({
      sub: 'u1',
      email: 'user@example.com',
      role: 'USER',
    });

    const res = await request(app.getHttpServer())
      .post('/api/events')
      .set('Cookie', [`access_token=${token}`])
      .send({
        name: 'Nuevo evento',
        description: 'Descripción',
        startsAt: '2026-12-01T10:00:00.000Z',
        location: 'Auditorio',
        maxCapacity: 50,
      })
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(httpServiceMock.post).not.toHaveBeenCalled();
  });

  it('POST /api/events con rol ADMIN -> 201 EventDetail', async () => {
    const token = await signAccessToken({
      sub: 'admin1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    const created = {
      id: 'e2',
      name: 'Nuevo evento',
      description: 'Descripción',
      startsAt: '2026-12-01T10:00:00.000Z',
      location: 'Auditorio',
      maxCapacity: 50,
      availableSlots: 50,
    };
    httpServiceMock.post.mockReturnValueOnce(of({ data: created }));

    const res = await request(app.getHttpServer())
      .post('/api/events')
      .set('Cookie', [`access_token=${token}`])
      .send({
        name: 'Nuevo evento',
        description: 'Descripción',
        startsAt: '2026-12-01T10:00:00.000Z',
        location: 'Auditorio',
        maxCapacity: 50,
      })
      .expect(201);

    expect(res.body).toEqual(created);
  });

  it('DELETE /api/events/:id con rol ADMIN -> 204', async () => {
    const token = await signAccessToken({
      sub: 'admin1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    httpServiceMock.delete.mockReturnValueOnce(of({ data: undefined }));

    await request(app.getHttpServer())
      .delete('/api/events/e1')
      .set('Cookie', [`access_token=${token}`])
      .expect(204);
  });
});
