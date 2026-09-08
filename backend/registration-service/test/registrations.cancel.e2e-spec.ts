import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  MockEventServiceClient,
  TEST_INTERNAL_TOKEN,
  cleanDatabase,
  createTestApp,
} from './utils/test-app';

/**
 * T091 — flujo de cancelación de `contracts/registration-service.md`:
 * cancelación exitosa (libera cupo), rechazo por no ser el dueño (403),
 * doble cancelación idempotente (200, sin duplicar `release`) y evento ya
 * iniciado (409, sin mutar el estado).
 */
describe('DELETE /internal/registrations/:id (T091)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventServiceClient: MockEventServiceClient;

  const userId = '33333333-3333-4333-8333-333333333333';
  const eventId = '44444444-4444-4444-8444-444444444444';
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
    eventServiceClient.release.mockResolvedValue({ availableSlots: 10 });
  });

  async function createActiveRegistration(
    eventStartsAtSnapshot: Date = futureDate,
  ) {
    return prisma.registration.create({
      data: {
        userId,
        eventId,
        status: 'ACTIVE',
        eventNameSnapshot: 'Feria de artesanías',
        eventStartsAtSnapshot,
        eventLocationSnapshot: 'Plaza Mayor',
      },
    });
  }

  it('cancela la inscripción del propietario y libera el cupo en event-service (200)', async () => {
    const registration = await createActiveRegistration();

    const response = await request(app.getHttpServer())
      .delete(`/internal/registrations/${registration.id}`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId })
      .expect(200);

    expect(response.body.status).toBe('CANCELLED');
    expect(response.body.cancelledAt).toBeTruthy();
    expect(eventServiceClient.release).toHaveBeenCalledWith(eventId);
    expect(eventServiceClient.release).toHaveBeenCalledTimes(1);
  });

  it('rechaza la cancelación solicitada por alguien distinto al dueño (403 FORBIDDEN)', async () => {
    const registration = await createActiveRegistration();

    const response = await request(app.getHttpServer())
      .delete(`/internal/registrations/${registration.id}`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId: 'otro-usuario-9999' })
      .expect(403);

    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(eventServiceClient.release).not.toHaveBeenCalled();

    const current = await prisma.registration.findUniqueOrThrow({
      where: { id: registration.id },
    });
    expect(current.status).toBe('ACTIVE');
  });

  it('responde 404 NOT_FOUND si la inscripción no existe', async () => {
    const response = await request(app.getHttpServer())
      .delete('/internal/registrations/00000000-0000-4000-8000-000000000000')
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId })
      .expect(404);

    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('la doble cancelación es idempotente: 200 en ambas, sin volver a llamar a release', async () => {
    const registration = await createActiveRegistration();

    const first = await request(app.getHttpServer())
      .delete(`/internal/registrations/${registration.id}`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId })
      .expect(200);

    expect(first.body.status).toBe('CANCELLED');
    expect(eventServiceClient.release).toHaveBeenCalledTimes(1);

    const second = await request(app.getHttpServer())
      .delete(`/internal/registrations/${registration.id}`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId })
      .expect(200);

    expect(second.body.status).toBe('CANCELLED');
    expect(second.body.id).toBe(first.body.id);
    // La segunda llamada no debe compensar de nuevo el cupo.
    expect(eventServiceClient.release).toHaveBeenCalledTimes(1);
  });

  it('rechaza la cancelación si el evento ya comenzó (409 EVENT_ALREADY_STARTED) sin mutar el estado ni llamar a release', async () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000);
    const registration = await createActiveRegistration(pastDate);

    const response = await request(app.getHttpServer())
      .delete(`/internal/registrations/${registration.id}`)
      .set('X-Internal-Token', TEST_INTERNAL_TOKEN)
      .send({ userId })
      .expect(409);

    expect(response.body.error.code).toBe('EVENT_ALREADY_STARTED');
    expect(eventServiceClient.release).not.toHaveBeenCalled();

    const current = await prisma.registration.findUniqueOrThrow({
      where: { id: registration.id },
    });
    expect(current.status).toBe('ACTIVE');
    expect(current.cancelledAt).toBeNull();
  });
});
