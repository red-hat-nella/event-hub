import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Event, EventCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CapacityBelowActiveRegistrationsException,
  CapacityExceededException,
  EventAlreadyStartedException,
  NotFoundAppException,
  ValidationException,
} from '../common/app-exception';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { computeTemporalStatus, TemporalStatus } from './temporal-status';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_DURATION_HOURS = 3;
const SORTABLE_FIELDS = [
  'startsAt',
  'name',
  'maxCapacity',
  'availableSlots',
  'createdAt',
] as const;

export interface EventWithStatus extends Event {
  temporalStatus: TemporalStatus;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findMany(query: QueryEventsDto): Promise<Paginated<EventWithStatus>> {
    const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
    const pageSize =
      query.pageSize && query.pageSize > 0 ? query.pageSize : DEFAULT_PAGE_SIZE;

    const where: Prisma.EventWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (query.dateFrom || query.dateTo) {
      where.startsAt = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    const orderBy = this.buildOrderBy(query.sort);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);

    const now = new Date();
    const durationHours = this.getDurationHours();

    return {
      items: rows.map((event) => this.withStatus(event, now, durationHours)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async findOne(id: string): Promise<EventWithStatus> {
    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundAppException();
    }

    return this.withStatus(event, new Date(), this.getDurationHours());
  }

  async create(dto: CreateEventDto): Promise<EventWithStatus> {
    const fields = this.validateEventFields(dto, { partial: false });

    if (Object.keys(fields).length > 0) {
      throw new ValidationException(fields);
    }

    const event = await this.prisma.event.create({
      data: {
        name: dto.name!.trim(),
        description: dto.description!.trim(),
        location: dto.location!.trim(),
        startsAt: new Date(dto.startsAt!),
        maxCapacity: dto.maxCapacity!,
        availableSlots: dto.maxCapacity!,
        category: dto.category ?? EventCategory.OTHER,
        imageUrl: dto.imageUrl,
      },
    });

    return this.withStatus(event, new Date(), this.getDurationHours());
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventWithStatus> {
    const fields = this.validateEventFields(dto, { partial: true });

    if (Object.keys(fields).length > 0) {
      throw new ValidationException(fields);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.event.findUnique({ where: { id } });

      if (!existing) {
        throw new NotFoundAppException();
      }

      const data: Prisma.EventUpdateInput = {};

      if (dto.name !== undefined) data.name = dto.name.trim();
      if (dto.description !== undefined)
        data.description = dto.description.trim();
      if (dto.location !== undefined) data.location = dto.location.trim();
      if (dto.category !== undefined) data.category = dto.category;
      if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
      if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);

      if (
        dto.maxCapacity !== undefined &&
        dto.maxCapacity !== existing.maxCapacity
      ) {
        const activeRegistrations =
          existing.maxCapacity - existing.availableSlots;

        if (dto.maxCapacity < activeRegistrations) {
          throw new CapacityBelowActiveRegistrationsException();
        }

        data.maxCapacity = dto.maxCapacity;
        data.availableSlots =
          existing.availableSlots + (dto.maxCapacity - existing.maxCapacity);
      }

      return tx.event.update({ where: { id }, data });
    });

    return this.withStatus(updated, new Date(), this.getDurationHours());
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.event.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundAppException();
      }

      throw error;
    }
  }

  /**
   * CRÍTICO para SC-004: `UPDATE ... WHERE available_slots > 0 AND starts_at > now()`
   * es la única sentencia que decrementa `available_slots`. Dos ejecuciones
   * concurrentes sobre el mismo `id` se serializan a nivel de fila en
   * PostgreSQL, así que nunca ambas pueden tener éxito si solo queda un cupo.
   */
  async reserve(id: string): Promise<{ availableSlots: number }> {
    const rows = await this.prisma.$queryRaw<
      Array<{ available_slots: number }>
    >`
      UPDATE events SET available_slots = available_slots - 1, updated_at = now()
      WHERE id = ${id} AND available_slots > 0 AND starts_at > now()
      RETURNING available_slots;
    `;

    if (rows.length === 1) {
      return { availableSlots: rows[0].available_slots };
    }

    const event = await this.prisma.event.findUnique({ where: { id } });

    if (!event) {
      throw new NotFoundAppException();
    }

    if (event.startsAt.getTime() <= Date.now()) {
      throw new EventAlreadyStartedException();
    }

    throw new CapacityExceededException();
  }

  async release(id: string): Promise<{ availableSlots: number }> {
    const rows = await this.prisma.$queryRaw<
      Array<{ available_slots: number }>
    >`
      UPDATE events SET available_slots = LEAST(available_slots + 1, max_capacity), updated_at = now()
      WHERE id = ${id}
      RETURNING available_slots;
    `;

    if (rows.length === 0) {
      throw new NotFoundAppException();
    }

    return { availableSlots: rows[0].available_slots };
  }

  private withStatus(
    event: Event,
    now: Date,
    durationHours: number,
  ): EventWithStatus {
    return {
      ...event,
      temporalStatus: computeTemporalStatus(event.startsAt, now, durationHours),
    };
  }

  private getDurationHours(): number {
    const raw = this.config.get<string>('DEFAULT_EVENT_DURATION_HOURS');
    const parsed = raw !== undefined ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_DURATION_HOURS;
  }

  private buildOrderBy(sort?: string): Prisma.EventOrderByWithRelationInput {
    if (!sort) {
      return { startsAt: 'asc' };
    }

    const descending = sort.startsWith('-');
    const field = descending ? sort.slice(1) : sort;
    const direction: Prisma.SortOrder = descending ? 'desc' : 'asc';

    if (!SORTABLE_FIELDS.includes(field as (typeof SORTABLE_FIELDS)[number])) {
      return { startsAt: 'asc' };
    }

    return { [field]: direction } as Prisma.EventOrderByWithRelationInput;
  }

  private validateEventFields(
    dto: CreateEventDto | UpdateEventDto,
    options: { partial: boolean },
  ): Record<string, string> {
    const fields: Record<string, string> = {};
    const isProvided = (value: unknown) => value !== undefined;

    const checkNonEmptyString = (
      key: 'name' | 'description' | 'location',
      value?: string,
    ) => {
      if (!options.partial || isProvided(value)) {
        if (!value || value.trim().length === 0) {
          fields[key] = `El campo ${key} es obligatorio.`;
        }
      }
    };

    checkNonEmptyString('name', dto.name);
    checkNonEmptyString('description', dto.description);
    checkNonEmptyString('location', dto.location);

    if (!options.partial || isProvided(dto.maxCapacity)) {
      if (
        !Number.isInteger(dto.maxCapacity) ||
        (dto.maxCapacity as number) <= 0
      ) {
        fields.maxCapacity =
          'La capacidad máxima debe ser un entero mayor que 0.';
      }
    }

    if (!options.partial || isProvided(dto.startsAt)) {
      const startsAt = dto.startsAt ? new Date(dto.startsAt) : undefined;
      if (
        !startsAt ||
        Number.isNaN(startsAt.getTime()) ||
        startsAt.getTime() <= Date.now()
      ) {
        fields.startsAt =
          'La fecha de inicio debe ser una fecha futura válida.';
      }
    }

    return fields;
  }
}
