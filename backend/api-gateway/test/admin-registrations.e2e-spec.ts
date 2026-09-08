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

describe('EventsController — GET /api/events/:id/registrations (e2e, US6)', () => {
  let app: INestApplication;
  let httpServiceMock: HttpServiceMock;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    httpServiceMock = createHttpServiceMock();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpServiceMock)
      .compile();

    app = await initTestApp(moduleFixture);

    adminToken = await signAccessToken({
      sub: 'admin1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    userToken = await signAccessToken({
      sub: 'u1',
      email: 'user@example.com',
      role: 'USER',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('sin sesión -> 401 UNAUTHENTICATED', async () => {
    await request(app.getHttpServer())
      .get('/api/events/e1/registrations')
      .expect(401);
  });

  it('con rol USER -> 403 FORBIDDEN', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events/e1/registrations')
      .set('Cookie', [`access_token=${userToken}`])
      .expect(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('con rol ADMIN -> 200 agrega registration-service + event-service + user-service (lote)', async () => {
    const registrations = [
      {
        id: 'r1',
        userId: 'u1',
        status: 'ACTIVE',
        createdAt: '2026-09-07T12:00:00.000Z',
        cancelledAt: null,
      },
      {
        id: 'r2',
        userId: 'u2',
        status: 'CANCELLED',
        createdAt: '2026-09-06T12:00:00.000Z',
        cancelledAt: '2026-09-06T13:00:00.000Z',
      },
    ];
    const event = {
      id: 'e1',
      name: 'Feria',
      maxCapacity: 10,
      availableSlots: 8,
    };
    const users = [
      {
        id: 'u1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        role: 'USER',
      },
      {
        id: 'u2',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'USER',
      },
    ];

    httpServiceMock.get.mockImplementation((url: string) => {
      if (
        url ===
        'http://registration-service.test/internal/events/e1/registrations'
      ) {
        return of({ data: registrations });
      }
      if (url === 'http://event-service.test/internal/events/e1') {
        return of({ data: event });
      }
      if (url === 'http://user-service.test/internal/users') {
        return of({ data: users });
      }
      throw new Error(`URL inesperada en la prueba: ${url}`);
    });

    const res = await request(app.getHttpServer())
      .get('/api/events/e1/registrations')
      .set('Cookie', [`access_token=${adminToken}`])
      .expect(200);

    expect(res.body).toEqual({
      items: [
        {
          registrationId: 'r1',
          userId: 'u1',
          userName: 'Ada Lovelace',
          userEmail: 'ada@example.com',
          status: 'ACTIVE',
          createdAt: '2026-09-07T12:00:00.000Z',
          cancelledAt: null,
        },
        {
          registrationId: 'r2',
          userId: 'u2',
          userName: 'Grace Hopper',
          userEmail: 'grace@example.com',
          status: 'CANCELLED',
          createdAt: '2026-09-06T12:00:00.000Z',
          cancelledAt: '2026-09-06T13:00:00.000Z',
        },
      ],
      capacity: 10,
      occupied: 2,
      available: 8,
    });

    expect(httpServiceMock.get).toHaveBeenCalledWith(
      'http://user-service.test/internal/users',
      expect.objectContaining({ params: { ids: 'u1,u2' } }),
    );
  });

  it('con lista vacía de inscripciones -> 200 sin llamar a user-service', async () => {
    const event = {
      id: 'e1',
      name: 'Feria',
      maxCapacity: 10,
      availableSlots: 10,
    };

    httpServiceMock.get.mockImplementation((url: string) => {
      if (
        url ===
        'http://registration-service.test/internal/events/e1/registrations'
      ) {
        return of({ data: [] });
      }
      if (url === 'http://event-service.test/internal/events/e1') {
        return of({ data: event });
      }
      throw new Error(`URL inesperada en la prueba: ${url}`);
    });

    const res = await request(app.getHttpServer())
      .get('/api/events/e1/registrations')
      .set('Cookie', [`access_token=${adminToken}`])
      .expect(200);

    expect(res.body).toEqual({
      items: [],
      capacity: 10,
      occupied: 0,
      available: 10,
    });
    expect(httpServiceMock.get).not.toHaveBeenCalledWith(
      'http://user-service.test/internal/users',
      expect.anything(),
    );
  });

  it('evento inexistente -> 404 NOT_FOUND propagado desde event-service', async () => {
    httpServiceMock.get.mockImplementation((url: string) => {
      if (
        url ===
        'http://registration-service.test/internal/events/missing/registrations'
      ) {
        return of({ data: [] });
      }
      if (url === 'http://event-service.test/internal/events/missing') {
        return throwError(() => ({
          response: {
            status: 404,
            data: {
              error: {
                code: 'NOT_FOUND',
                message: 'Este recurso ya no está disponible.',
              },
            },
          },
        }));
      }
      throw new Error(`URL inesperada en la prueba: ${url}`);
    });

    const res = await request(app.getHttpServer())
      .get('/api/events/missing/registrations')
      .set('Cookie', [`access_token=${adminToken}`])
      .expect(404);

    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
