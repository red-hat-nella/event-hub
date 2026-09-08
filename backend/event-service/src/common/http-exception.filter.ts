import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Envolvente de error uniforme (BR-009, contracts/api-gateway.md):
 * { "error": { "code", "message", "fields"? } }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      code: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado.',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'object' && raw !== null && 'code' in raw) {
        const typed = raw as ErrorBody;
        body = {
          code: typed.code,
          message: typed.message,
          ...(typed.fields ? { fields: typed.fields } : {}),
        };
      } else {
        const rawMessage =
          typeof raw === 'object' && raw !== null && 'message' in raw
            ? (raw as { message: string | string[] }).message
            : String(raw);
        body = {
          code: defaultCodeForStatus(status),
          message: Array.isArray(rawMessage)
            ? rawMessage.join(' ')
            : rawMessage,
        };
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    } else {
      this.logger.error(`Excepción desconocida: ${JSON.stringify(exception)}`);
    }

    response.status(status).json({ error: body });
  }
}

function defaultCodeForStatus(status: number): string {
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
    default:
      return 'INTERNAL_ERROR';
  }
}
