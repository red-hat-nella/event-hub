import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  callInternalService,
  internalHeaders,
} from '../common/internal-http.util';
import type { EventsQueryDto } from './dto/events-query.dto';
import type { CreateEventDto } from './dto/create-event.dto';
import type { UpdateEventDto } from './dto/update-event.dto';

export interface EventRecord {
  id: string;
  maxCapacity: number;
  availableSlots: number;
  [key: string]: unknown;
}

interface AdminRegistrationRaw {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminRegistrationsResult {
  items: Array<{
    registrationId: string;
    userId: string;
    userName: string;
    userEmail: string;
    status: string;
    createdAt: string;
    cancelledAt: string | null;
  }>;
  capacity: number;
  occupied: number;
  available: number;
}

/**
 * Cliente HTTP hacia `event-service` (catálogo/administración) y, para la
 * agregación de inscripciones administrativas (US6), hacia
 * `registration-service` y `user-service`.
 */
@Injectable()
export class EventsService {
  private readonly eventServiceUrl: string;
  private readonly registrationServiceUrl: string;
  private readonly userServiceUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.eventServiceUrl = this.config.get<string>('EVENT_SERVICE_URL') ?? '';
    this.registrationServiceUrl =
      this.config.get<string>('REGISTRATION_SERVICE_URL') ?? '';
    this.userServiceUrl = this.config.get<string>('USER_SERVICE_URL') ?? '';
    this.internalToken =
      this.config.get<string>('INTERNAL_SERVICE_TOKEN') ?? '';
  }

  private headers() {
    return internalHeaders(this.internalToken);
  }

  findMany(query: EventsQueryDto) {
    return callInternalService(
      this.http.get(`${this.eventServiceUrl}/internal/events`, {
        params: query,
        headers: this.headers(),
      }),
    );
  }

  findOne(id: string): Promise<EventRecord> {
    return callInternalService(
      this.http.get(`${this.eventServiceUrl}/internal/events/${id}`, {
        headers: this.headers(),
      }),
    );
  }

  create(dto: CreateEventDto) {
    return callInternalService(
      this.http.post(`${this.eventServiceUrl}/internal/events`, dto, {
        headers: this.headers(),
      }),
    );
  }

  update(id: string, dto: UpdateEventDto) {
    return callInternalService(
      this.http.put(`${this.eventServiceUrl}/internal/events/${id}`, dto, {
        headers: this.headers(),
      }),
    );
  }

  async remove(id: string): Promise<void> {
    await callInternalService(
      this.http.delete(`${this.eventServiceUrl}/internal/events/${id}`, {
        headers: this.headers(),
      }),
    );
  }

  async getAdminRegistrations(
    eventId: string,
    status?: string,
  ): Promise<AdminRegistrationsResult> {
    const [registrations, event] = await Promise.all([
      callInternalService<AdminRegistrationRaw[]>(
        this.http.get(
          `${this.registrationServiceUrl}/internal/events/${eventId}/registrations`,
          {
            params: status ? { status } : {},
            headers: this.headers(),
          },
        ),
      ),
      this.findOne(eventId),
    ]);

    const userIds = Array.from(new Set(registrations.map((r) => r.userId)));
    let users: UserRecord[] = [];
    if (userIds.length > 0) {
      users = await callInternalService<UserRecord[]>(
        this.http.get(`${this.userServiceUrl}/internal/users`, {
          params: { ids: userIds.join(',') },
          headers: this.headers(),
        }),
      );
    }
    const userMap = new Map(users.map((u) => [u.id, u]));

    const items = registrations.map((r) => ({
      registrationId: r.id,
      userId: r.userId,
      userName: userMap.get(r.userId)?.name ?? '',
      userEmail: userMap.get(r.userId)?.email ?? '',
      status: r.status,
      createdAt: r.createdAt,
      cancelledAt: r.cancelledAt,
    }));

    const capacity = event.maxCapacity;
    const available = event.availableSlots;
    const occupied = capacity - available;

    return { items, capacity, occupied, available };
  }
}
