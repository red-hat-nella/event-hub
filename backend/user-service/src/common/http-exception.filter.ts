import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Envolvente de error uniforme compartida por todos los servicios de Event
 * Hub: `{ error: { code, message, fields? } }` (ver `contracts/*.md`).
 *
 * Las excepciones lanzadas con un `response` estructurado
 * (`{ code, message, fields? }`), típicamente vía `new ConflictException({ code, message })`,
 * se propagan tal cual. Cualquier otra excepción (incluidas las de NestJS
 * como `NotFoundException` por defecto, o errores no controlados) se mapea a
 * un código genérico derivado del estado HTTP.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${body.code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({ error: body });
  }

  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (
        payload &&
        typeof payload === 'object' &&
        'code' in payload &&
        'message' in payload
      ) {
        const { code, message, fields } = payload as ErrorBody;
        return { status, body: { code, message, fields } };
      }

      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: string | string[] })?.message ??
            exception.message);

      return {
        status,
        body: {
          code: this.defaultCodeForStatus(status),
          message: Array.isArray(message) ? message.join(' ') : message,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrió un error inesperado.',
      },
    };
  }

  private defaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'NOT_READY';
      default:
        return 'INTERNAL_ERROR';
    }
  }
}
