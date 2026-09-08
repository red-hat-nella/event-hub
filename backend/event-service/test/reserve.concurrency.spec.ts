import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { bootstrapTestApp, internalHeaders } from './utils/bootstrap-app';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * T079 — LA PRUEBA MÁS IMPORTANTE del servicio (SC-004).
 *
 * Garantiza que `POST /internal/events/:id/reserve` nunca sobrevende el
 * cupo de un evento bajo concurrencia real. Requiere una base PostgreSQL
 * real (no se puede mockear la atomicidad de `UPDATE ... WHERE
 * available_slots > 0` con un Prisma Client simulado): el bloqueo de fila
 * implícito de PostgreSQL es lo único que serializa las 100 escrituras
 * concurrentes sobre el mismo registro.
 */
describe('POST /internal/events/:id/reserve — concurrencia (SC-004)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let eventId: string;

  const MAX_CAPACITY = 10;
  const CONCURRENT_REQUESTS = 100;

  beforeAll(async () => {
    const boot = await bootstrapTestApp();
    app = boot.app;
    prisma = boot.prisma;

    const event = await prisma.event.create({
      data: {
        name: 'Evento de prueba de concurrencia',
        description:
          'Verifica que 100 reservas paralelas nunca sobrevendan un cupo de 10',
        startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        location: 'Sala de pruebas',
        maxCapacity: MAX_CAPACITY,
        availableSlots: MAX_CAPACITY,
      },
    });

    eventId = event.id;
  });

  afterAll(async () => {
    await prisma.event.deleteMany({ where: { id: eventId } });
    await app.close();
  });

  it(
    `exactamente ${MAX_CAPACITY} de ${CONCURRENT_REQUESTS} llamadas concurrentes ` +
      'responden 200, el resto 409 CAPACITY_EXCEEDED, y availableSlots final es 0',
    async () => {
      const calls = Array.from({ length: CONCURRENT_REQUESTS }, () =>
        request(app.getHttpServer())
          .post(`/internal/events/${eventId}/reserve`)
          .set(internalHeaders()),
      );

      const responses = await Promise.all(calls);

      const successes = responses.filter((response) => response.status === 200);
      const conflicts = responses.filter((response) => response.status === 409);

      expect(successes).toHaveLength(MAX_CAPACITY);
      expect(conflicts).toHaveLength(CONCURRENT_REQUESTS - MAX_CAPACITY);
      expect(
        conflicts.every(
          (response) => response.body.error.code === 'CAPACITY_EXCEEDED',
        ),
      ).toBe(true);

      // Cada respuesta exitosa debe reportar un `availableSlots` distinto
      // (0..MAX_CAPACITY-1, sin repeticiones), lo que confirma que el
      // `UPDATE ... WHERE available_slots > 0` serializó las escrituras
      // concurrentes en vez de perder actualizaciones (race condition).
      const availableSlotsSeen = successes.map(
        (response) => response.body.availableSlots as number,
      );
      expect(new Set(availableSlotsSeen).size).toBe(MAX_CAPACITY);
      expect(Math.min(...availableSlotsSeen)).toBe(0);
      expect(Math.max(...availableSlotsSeen)).toBe(MAX_CAPACITY - 1);

      const finalEvent = await prisma.event.findUniqueOrThrow({
        where: { id: eventId },
      });
      expect(finalEvent.availableSlots).toBe(0);
    },
    30000,
  );
});
