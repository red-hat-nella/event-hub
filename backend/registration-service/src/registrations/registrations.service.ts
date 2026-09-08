import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma, Registration, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventServiceClient } from './event-service.client';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

/**
 * Orquesta el invariante de cupo (BR-001/BR-002) exactamente per la
 * secuencia de `contracts/registration-service.md` § Flujo de creación y
 * § Flujo de cancelación.
 */
@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventServiceClient: EventServiceClient,
  ) {}

  async create(
    userId: string,
    eventId: string,
    idempotencyKey?: string,
  ): Promise<Registration> {
    if (idempotencyKey) {
      const cached = await this.resolveIdempotencyKey(idempotencyKey, userId);
      if (cached) {
        return cached;
      }
    }

    // Paso 2: pre-chequeo de aplicación (ventana de carrera cerrada por el
    // índice único parcial más adelante, paso 5).
    const alreadyActive = await this.prisma.registration.findFirst({
      where: { userId, eventId, status: RegistrationStatus.ACTIVE },
    });

    if (alreadyActive) {
      this.logger.warn(
        JSON.stringify({
          event: 'registration.rejected',
          reason: 'ALREADY_REGISTERED',
          userId,
          eventId,
        }),
      );
      throw new ConflictException({
        code: 'ALREADY_REGISTERED',
        message: 'Ya estás inscrito en este evento.',
      });
    }

    // Paso 3: reserva de cupo en event-service. Si falla, se propaga el
    // mismo código/causa (404 EVENT_NOT_FOUND, 409 CAPACITY_EXCEEDED,
    // 409 EVENT_ALREADY_STARTED) sin tocar la clave de idempotencia: es un
    // resultado determinista, no una falla transitoria.
    await this.eventServiceClient.reserve(eventId);

    try {
      // Paso 4: snapshot desnormalizado (resiliente a borrado del evento).
      const event = await this.eventServiceClient.getEvent(eventId);

      // Paso 5: INSERT protegido por el índice único parcial
      // `registrations_active_unique (user_id, event_id) WHERE status='ACTIVE'`.
      const registration = await this.prisma.registration.create({
        data: {
          userId,
          eventId,
          status: RegistrationStatus.ACTIVE,
          eventNameSnapshot: event.name,
          eventStartsAtSnapshot: new Date(event.startsAt),
          eventLocationSnapshot: event.location,
        },
      });

      // Paso 6: éxito — cachea la respuesta si vino Idempotency-Key.
      if (idempotencyKey) {
        await this.markIdempotencyCompleted(idempotencyKey, registration);
      }

      this.logger.log(
        JSON.stringify({
          event: 'registration.created',
          registrationId: registration.id,
          userId,
          eventId,
        }),
      );

      return registration;
    } catch (error) {
      await this.safeRelease(eventId);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        // Carrera: dos solicitudes simultáneas del mismo (userId, eventId)
        // pasaron el pre-chequeo del paso 2; el índice único parcial es la
        // garantía final de BR-001.
        this.logger.warn(
          JSON.stringify({
            event: 'registration.rejected',
            reason: 'ALREADY_REGISTERED_RACE',
            userId,
            eventId,
          }),
        );
        throw new ConflictException({
          code: 'ALREADY_REGISTERED',
          message: 'Ya estás inscrito en este evento.',
        });
      }

      if (idempotencyKey) {
        await this.markIdempotencyFailed(idempotencyKey);
      }

      this.logger.error(
        'No se pudo completar la inscripción tras reservar cupo; se compensó con release.',
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException({
        code: 'REGISTRATION_FAILED',
        message: 'No se pudo completar la inscripción. Inténtalo nuevamente.',
      });
    }
  }

  async cancel(id: string, userId: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'La inscripción no existe.',
      });
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'No puedes cancelar la inscripción de otro usuario.',
      });
    }

    if (registration.status === RegistrationStatus.CANCELLED) {
      // Cancelación idempotente (doble clic): mismo estado, sin error, sin
      // volver a llamar a `release`.
      return registration;
    }

    if (registration.eventStartsAtSnapshot <= new Date()) {
      throw new ConflictException({
        code: 'EVENT_ALREADY_STARTED',
        message: 'El evento ya comenzó; no es posible cancelar.',
      });
    }

    // UPDATE atómico condicionado a status='ACTIVE': si una solicitud
    // concurrente ya canceló entre nuestra lectura y este UPDATE, afecta 0
    // filas y no volvemos a llamar a `release`.
    const updateResult = await this.prisma.registration.updateMany({
      where: { id, status: RegistrationStatus.ACTIVE },
      data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
    });

    const current = await this.prisma.registration.findUniqueOrThrow({
      where: { id },
    });

    if (updateResult.count === 0) {
      return current;
    }

    await this.eventServiceClient.release(registration.eventId);

    this.logger.log(
      JSON.stringify({
        event: 'registration.cancelled',
        registrationId: id,
        userId,
        eventId: registration.eventId,
      }),
    );

    return current;
  }

  async findMany(filter: {
    userId?: string;
    status?: RegistrationStatus;
  }): Promise<Registration[]> {
    return this.prisma.registration.findMany({
      where: {
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'La inscripción no existe.',
      });
    }

    return registration;
  }

  async findByEvent(
    eventId: string,
    status?: RegistrationStatus,
  ): Promise<
    Array<{
      id: string;
      userId: string;
      status: RegistrationStatus;
      createdAt: Date;
      cancelledAt: Date | null;
    }>
  > {
    return this.prisma.registration.findMany({
      where: {
        eventId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        cancelledAt: true,
      },
    });
  }

  /**
   * Resuelve la cabecera `Idempotency-Key` per
   * `contracts/registration-service.md`: si ya está `COMPLETED`, devuelve
   * la respuesta cacheada sin más efectos. Si está `FAILED`, la reinicia a
   * `PENDING` (permite reintentar). En cualquier otro caso (no existe o
   * sigue `PENDING`), la deja lista para que `create` continúe.
   */
  private async resolveIdempotencyKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<Registration | null> {
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing?.status === 'COMPLETED' && existing.responseBody) {
      return existing.responseBody as unknown as Registration;
    }

    if (!existing) {
      await this.prisma.idempotencyKey.create({
        data: { key: idempotencyKey, userId, status: 'PENDING' },
      });
    } else if (existing.status === 'FAILED') {
      await this.prisma.idempotencyKey.update({
        where: { key: idempotencyKey },
        data: { status: 'PENDING', responseBody: Prisma.JsonNull },
      });
    }

    return null;
  }

  private async markIdempotencyCompleted(
    idempotencyKey: string,
    registration: Registration,
  ): Promise<void> {
    const serializable = JSON.parse(
      JSON.stringify(registration),
    ) as Prisma.InputJsonValue;

    await this.prisma.idempotencyKey.update({
      where: { key: idempotencyKey },
      data: { status: 'COMPLETED', responseBody: serializable },
    });
  }

  private async markIdempotencyFailed(idempotencyKey: string): Promise<void> {
    await this.prisma.idempotencyKey
      .update({
        where: { key: idempotencyKey },
        data: { status: 'FAILED' },
      })
      .catch((error) =>
        this.logger.warn(
          `No se pudo marcar idempotency_key=${idempotencyKey} como FAILED: ${String(error)}`,
        ),
      );
  }

  /** Compensación (`release`) que nunca enmascara el error original. */
  private async safeRelease(eventId: string): Promise<void> {
    try {
      await this.eventServiceClient.release(eventId);
    } catch (error) {
      this.logger.warn(
        `Falló la compensación release(${eventId}): ${String(error)}`,
      );
    }
  }
}
