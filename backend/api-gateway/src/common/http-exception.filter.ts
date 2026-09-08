import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

function isErrorEnvelope(body: unknown): body is ErrorEnvelope {
  return (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as { error?: unknown }).error === 'object' &&
    (body as { error?: unknown }).error !== null
  );
}

function defaultCodeForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'VALIDATION_ERROR';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHENTICATED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    case HttpStatus.CONFLICT:
      return 'CONFLICT';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'INTERNAL_ERROR';
  }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'Revisa los campos marcados.';
    case HttpStatus.UNAUTHORIZED:
      return 'Inicia sesión para continuar.';
    case HttpStatus.FORBIDDEN:
      return 'No tienes permisos para esta acción.';
    case HttpStatus.NOT_FOUND:
      return 'Este recurso ya no está disponible.';
    case HttpStatus.SERVICE_UNAVAILABLE:
      return 'El servicio no está disponible temporalmente.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

/**
 * Filtro de excepción global: produce SIEMPRE la envolvente de error
 * uniforme `{ error: { code, message, fields? } }` de
 * `contracts/api-gateway.md`. Preserva `code`/`message`/`fields` cuando la
 * excepción ya viene en ese formato (relanzada desde una llamada a un
 * servicio interno vía `callInternalService`), y genera un `code`/`message`
 * razonable en cualquier otro caso.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // request is available via ctx.getRequest<Request>() if request-scoped
    // logging is ever needed here; not required by the current contract.
    void ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Ocurrió un error inesperado.';
    let fields: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (isErrorEnvelope(body)) {
        code = body.error.code ?? defaultCodeForStatus(status);
        message = body.error.message ?? defaultMessageForStatus(status);
        fields = body.error.fields;
      } else if (typeof body === 'object' && body !== null) {
        const anyBody = body as {
          message?: string | string[];
          error?: string;
        };
        code = defaultCodeForStatus(status);
        message = Array.isArray(anyBody.message)
          ? anyBody.message.join(', ')
          : (anyBody.message ?? defaultMessageForStatus(status));
      } else if (typeof body === 'string' && body.length > 0) {
        code = defaultCodeForStatus(status);
        message = body;
      } else {
        code = defaultCodeForStatus(status);
        message = defaultMessageForStatus(status);
      }
    }

    const payload: ErrorEnvelope = { error: { code, message } };
    if (fields) {
      payload.error.fields = fields;
    }
    response.status(status).json(payload);
  }
}
