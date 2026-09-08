import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  callInternalService,
  internalHeaders,
} from '../common/internal-http.util';

export interface RegistrationRecord {
  id: string;
  userId: string;
  eventId: string;
  status: string;
  createdAt: string;
  cancelledAt: string | null;
  eventNameSnapshot?: string;
  eventStartsAtSnapshot?: string;
  eventLocationSnapshot?: string;
  [key: string]: unknown;
}

/**
 * Cliente HTTP hacia `registration-service`.
 */
@Injectable()
export class RegistrationsService {
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('REGISTRATION_SERVICE_URL') ?? '';
    this.internalToken =
      this.config.get<string>('INTERNAL_SERVICE_TOKEN') ?? '';
  }

  create(
    userId: string,
    eventId: string,
    idempotencyKey?: string,
  ): Promise<RegistrationRecord> {
    const headers: Record<string, string> = internalHeaders(this.internalToken);
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return callInternalService(
      this.http.post(
        `${this.baseUrl}/internal/registrations`,
        { userId, eventId },
        { headers },
      ),
    );
  }

  findMine(userId: string, status?: string): Promise<RegistrationRecord[]> {
    return callInternalService(
      this.http.get(`${this.baseUrl}/internal/registrations`, {
        params: status ? { userId, status } : { userId },
        headers: internalHeaders(this.internalToken),
      }),
    );
  }

  findOne(id: string): Promise<RegistrationRecord> {
    return callInternalService(
      this.http.get(`${this.baseUrl}/internal/registrations/${id}`, {
        headers: internalHeaders(this.internalToken),
      }),
    );
  }

  cancel(id: string, userId: string): Promise<RegistrationRecord> {
    return callInternalService(
      this.http.delete(`${this.baseUrl}/internal/registrations/${id}`, {
        headers: internalHeaders(this.internalToken),
        data: { userId },
      }),
    );
  }
}
