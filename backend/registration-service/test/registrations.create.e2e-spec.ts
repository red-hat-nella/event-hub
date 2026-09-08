import {
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  MockEventServiceClient,
  TEST_INTERNAL_TOKEN,
  cleanDatabase,
  createTestApp,
} from './utils/test-app';

/**
 * T083 — flujo de creación de `contracts/registration-service.md`:
 * éxito, ALREADY_REGISTERED (pre-chequeo y por índice único simulando una
 * carrera con dos inserciones directas por Prisma), CAPACITY_EXCEEDED,
 * EVENT_ALREADY_STARTED, EVENT_NOT_FOUND y reintento idempotente.
 */
describe('POST /internal/registrations (T083)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventServiceClient: MockEventServiceClient;

  const userId = '11111111-1111-4111-8111-111111111111';
  const eventId = '22222222-2222-4222-8222-222222222222';
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
    eventServiceClient = ctx.eventServiceClient;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await cleanDatabase(prisma);
    eventServiceClient.reserve.mockResolvedValue({ availableSlots: 9 });
    eventServiceClient.release.mockResolvedValue({ availableSlots: 10 });
    eventServiceClient.getEvent.mockResolvedValue({
      id: eventId,
      name: 'Concierto en el parque',
      startsAt: futureDate.toISOString(),
      location: 'Anfiteatro Central',
    });
  });

  it('crea la inscripción cuando hay cupo disponible (201)', async () => {
    const response = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId, eventId })
      .expect(201);

    expect(response.body).toMatchObject({
      userId,
      eventId,
      status: 'ACTIVE',
      eventNameSnapshot: 'Concierto en el parque',
      eventLocationSnapshot: 'Anfiteatro Central',
    });
    expect(response.body.id).toBeDefined();
    expect(eventServiceClient.reserve).toHaveBeenCalledWith(eventId);
    expect(eventServiceClient.getEvent).toHaveBeenCalledWith(eventId);
    expect(eventServiceClient.release).not.toHaveBeenCalled();
  });

  it('rechaza la solicitud sin X-Internal-Token (401)', async () => {
    await request(app.getHttpServer())
      .post('/internal/registrations')
      .send({ userId, eventId })
      .expect(401);
  });

  it('rechaza una segunda inscripción activa por pre-chequeo de aplicación (409 ALREADY_REGISTERED)', async () => {
    await prisma.registration.create({
      data: {
        userId,
        eventId,
        status: 'ACTIVE',
        eventNameSnapshot: 'Concierto en el parque',
        eventStartsAtSnapshot: futureDate,
        eventLocationSnapshot: 'Anfiteatro Central',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId, eventId })
      .expect(409);

    expect(response.body.error.code).toBe('ALREADY_REGISTERED');
    expect(eventServiceClient.reserve).not.toHaveBeenCalled();
  });

  it('rechaza por el índice único parcial cuando dos inserciones directas compiten por el mismo (userId, eventId) (409 ALREADY_REGISTERED + compensación release)', async () => {
    // Simula la carrera: entre nuestro pre-chequeo (que pasa, sin fila
    // activa) y nuestro propio INSERT, otra solicitud "gana" insertando
    // directamente por Prisma la fila ACTIVE en la ventana que abre el
    // `await` de `getEvent`.
    eventServiceClient.getEvent.mockImplementationOnce(async () => {
      await prisma.registration.create({
        data: {
          userId,
          eventId,
          status: 'ACTIVE',
          eventNameSnapshot: 'Concierto en el parque (solicitud concurrente)',
          eventStartsAtSnapshot: futureDate,
          eventLocationSnapshot: 'Anfiteatro Central',
        },
      });

      return {
        id: eventId,
        name: 'Concierto en el parque',
        startsAt: futureDate.toISOString(),
        location: 'Anfiteatro Central',
      };
    });

    const response = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId, eventId })
      .expect(409);

    expect(response.body.error.code).toBe('ALREADY_REGISTERED');
    expect(eventServiceClient.release).toHaveBeenCalledWith(eventId);

    const activeCount = await prisma.registration.count({
      where: { userId, eventId, status: 'ACTIVE' },
    });
    expect(activeCount).toBe(1);
  });

  it('propaga CAPACITY_EXCEEDED desde event-service tal cual (409)', async () => {
    eventServiceClient.reserve.mockRejectedValueOnce(
      new ConflictException({
        code: 'CAPACITY_EXCEEDED',
        message: 'El evento alcanzó su capacidad máxima.',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId, eventId })
      .expect(409);

    expect(response.body.error.code).toBe('CAPACITY_EXCEEDED');
    expect(eventServiceClient.getEvent).not.toHaveBeenCalled();
  });

  it('propaga EVENT_ALREADY_STARTED desde event-service tal cual (409)', async () => {
    eventServiceClient.reserve.mockRejectedValueOnce(
      new ConflictException({
        code: 'EVENT_ALREADY_STARTED',
        message: 'Las inscripciones para este evento están cerradas.',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId, eventId })
      .expect(409);

    expect(response.body.error.code).toBe('EVENT_ALREADY_STARTED');
  });

  it('propaga EVENT_NOT_FOUND desde event-service tal cual (404)', async () => {
    eventServiceClient.reserve.mockRejectedValueOnce(
      new NotFoundException({
        code: 'EVENT_NOT_FOUND',
        message: 'El evento no existe.',
      }),
    );

    const response = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId, eventId })
      .expect(404);

    expect(response.body.error.code).toBe('EVENT_NOT_FOUND');
  });

  it('un reintento con la misma Idempotency-Key devuelve la respuesta cacheada sin volver a llamar a event-service ni duplicar la fila', async () => {
    const idempotencyKey = 'a4d38f2e-1111-4a11-9a11-abcdefabcdef';

    const first = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .set('Idempotency-Key', idempotencyKey)
      .send({ userId, eventId })
      .expect(201);

    expect(eventServiceClient.reserve).toHaveBeenCalledTimes(1);
    expect(eventServiceClient.getEvent).toHaveBeenCalledTimes(1);

    const second = await request(app.getHttpServer())
      .post('/internal/registrations')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .set('Idempotency-Key', idempotencyKey)
      .send({ userId, eventId })
      .expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(second.body.status).toBe('ACTIVE');
    // Ni reserve ni getEvent deben volver a invocarse: la respuesta se
    // sirvió desde `idempotency_keys` sin más efectos secundarios.
    expect(eventServiceClient.reserve).toHaveBeenCalledTimes(1);
    expect(eventServiceClient.getEvent).toHaveBeenCalledTimes(1);

    const registrationsCount = await prisma.registration.count({
      where: { userId, eventId },
    });
    expect(registrationsCount).toBe(1);
  });
});
