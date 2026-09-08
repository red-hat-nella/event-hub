import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

interface StructuredErrorBody {
  code?: string;
  message?: string | string[];
  error?: string;
  fields?: Record<string, string>;
}

const DEFAULT_CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.SERVICE_UNAVAILABLE]: 'SERVICE_UNAVAILABLE',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

/**
 * Envolvente de error uniforme (BR-009 / FR-034, `contracts/api-gateway.md`):
 * `{ error: { code, message, fields? } }`. Mismo patrón que el resto de
 * servicios internos de Event Hub (T018).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawBody =
      exception instanceof HttpException ? exception.getResponse() : null;

    let code = DEFAULT_CODE_BY_STATUS[status] ?? 'INTERNAL_ERROR';
    let message = 'Ha ocurrido un error inesperado. Inténtalo nuevamente.';
    let fields: Record<string, string> | undefined;

    if (typeof rawBody === 'string') {
      message = rawBody;
    } else if (rawBody && typeof rawBody === 'object') {
      const body = rawBody as StructuredErrorBody;

      if (body.code) {
        code = body.code;
      }

      if (Array.isArray(body.message)) {
        fields = this.toFieldMap(body.message);
        message = 'Revisa los campos marcados.';
      } else if (typeof body.message === 'string') {
        message = body.message;
      } else if (typeof body.error === 'string') {
        message = body.error;
      }

      if (body.fields) {
        fields = body.fields;
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${status} ${code}: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    });
  }

  private toFieldMap(messages: string[]): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const entry of messages) {
      const [field] = entry.split(' ');
      fields[field] = entry;
    }
    return fields;
  }
}
