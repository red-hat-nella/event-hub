import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  TEST_INTERNAL_TOKEN,
  cleanDatabase,
  createTestApp,
} from './utils/test-app';

/**
 * T113 — `GET /internal/events/:eventId/registrations` (vista admin, US6):
 * listado por evento con la forma reducida del contrato
 * `{id,userId,status,createdAt,cancelledAt}` y estado vacío.
 */
describe('GET /internal/events/:eventId/registrations (T113)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const eventId = '55555555-5555-4555-8555-555555555555';
  const otherEventId = '66666666-6666-4666-8666-666666666666';
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  it('devuelve una lista vacía si el evento no tiene inscripciones (estado vacío)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/internal/events/${eventId}/registrations`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('lista las inscripciones de un evento con la forma reducida del contrato', async () => {
    await prisma.registration.create({
      data: {
        userId: 'user-a',
        eventId,
        status: 'ACTIVE',
        eventNameSnapshot: 'Taller de cerámica',
        eventStartsAtSnapshot: futureDate,
        eventLocationSnapshot: 'Casa de la Cultura',
      },
    });
    await prisma.registration.create({
      data: {
        userId: 'user-b',
        eventId,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        eventNameSnapshot: 'Taller de cerámica',
        eventStartsAtSnapshot: futureDate,
        eventLocationSnapshot: 'Casa de la Cultura',
      },
    });
    // Inscripción de otro evento: no debe aparecer en el listado.
    await prisma.registration.create({
      data: {
        userId: 'user-c',
        eventId: otherEventId,
        status: 'ACTIVE',
        eventNameSnapshot: 'Otro evento',
        eventStartsAtSnapshot: futureDate,
        eventLocationSnapshot: 'Otro lugar',
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/internal/events/${eventId}/registrations`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .expect(200);

    expect(response.body).toHaveLength(2);
    for (const item of response.body) {
      expect(Object.keys(item).sort()).toEqual(
        ['cancelledAt', 'createdAt', 'id', 'status', 'userId'].sort(),
      );
    }
    expect(
      response.body.map((item: { userId: string }) => item.userId).sort(),
    ).toEqual(['user-a', 'user-b'].sort());
  });

  it('filtra por status=ACTIVE', async () => {
    await prisma.registration.create({
      data: {
        userId: 'user-a',
        eventId,
        status: 'ACTIVE',
        eventNameSnapshot: 'Taller de cerámica',
        eventStartsAtSnapshot: futureDate,
        eventLocationSnapshot: 'Casa de la Cultura',
      },
    });
    await prisma.registration.create({
      data: {
        userId: 'user-b',
        eventId,
        status: 'CANCELLED',
        cancelledAt: new Date(),
        eventNameSnapshot: 'Taller de cerámica',
        eventStartsAtSnapshot: futureDate,
        eventLocationSnapshot: 'Casa de la Cultura',
      },
    });

    const response = await request(app.getHttpServer())
      .get(`/internal/events/${eventId}/registrations?status=ACTIVE`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      userId: 'user-a',
      status: 'ACTIVE',
    });
  });

  it('rechaza la solicitud sin X-Internal-Token (401)', async () => {
    await request(app.getHttpServer())
      .get(`/internal/events/${eventId}/registrations`)
      .expect(401);
  });
});
