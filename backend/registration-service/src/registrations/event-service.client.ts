import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export interface ReserveReleaseResult {
  availableSlots: number;
}

export interface EventSnapshot {
  id: string;
  name: string;
  startsAt: string;
  location: string;
  [key: string]: unknown;
}

/**
 * Único cliente HTTP servicio→servicio de todo Event Hub
 * (`registration-service` → `event-service`, autorizado explícitamente en
 * `contracts/registration-service.md`). Siempre agrega `X-Internal-Token`;
 * si `event-service` responde con un error estructurado
 * (`error.response.data`), lo relanza tal cual (mismo `status`/body) para
 * preservar el código de negocio (`CAPACITY_EXCEEDED`,
 * `EVENT_ALREADY_STARTED`, `NOT_FOUND`).
 */
@Injectable()
export class EventServiceClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async reserve(eventId: string): Promise<ReserveReleaseResult> {
    return this.post<ReserveReleaseResult>(
      `/internal/events/${eventId}/reserve`,
    );
  }

  async release(eventId: string): Promise<ReserveReleaseResult> {
    return this.post<ReserveReleaseResult>(
      `/internal/events/${eventId}/release`,
    );
  }

  async getEvent(eventId: string): Promise<EventSnapshot> {
    return this.get<EventSnapshot>(`/internal/events/${eventId}`);
  }

  private get baseUrl(): string {
    return this.configService.get<string>('EVENT_SERVICE_URL') ?? '';
  }

  private get internalHeaders(): Record<string, string> {
    return {
      'X-Internal-Token':
        this.configService.get<string>('INTERNAL_SERVICE_TOKEN') ?? '',
    };
  }

  private async post<T>(path: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<T>(
          `${this.baseUrl}${path}`,
          {},
          { headers: this.internalHeaders },
        ),
      );
      return response.data;
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private async get<T>(path: string): Promise<T> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(`${this.baseUrl}${path}`, {
          headers: this.internalHeaders,
        }),
      );
      return response.data;
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private toHttpException(error: unknown): HttpException {
    const axiosError = error as AxiosError;

    if (axiosError?.response?.data) {
      return new HttpException(
        axiosError.response.data as Record<string, unknown> | string,
        axiosError.response.status,
      );
    }

    return new ServiceUnavailableException({
      code: 'EVENT_SERVICE_UNAVAILABLE',
      message: 'No se pudo contactar a event-service. Inténtalo nuevamente.',
    });
  }
}
