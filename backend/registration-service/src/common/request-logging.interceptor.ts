import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Log estructurado por solicitud: requestId, ruta, status y duración
 * (research.md §18). No cambia la respuesta.
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('http');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const requestId =
      (request.headers['x-request-id'] as string | undefined) ?? randomUUID();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.log(requestId, request, response, start),
        error: () => this.log(requestId, request, response, start),
      }),
    );
  }

  private log(
    requestId: string,
    request: Request,
    response: Response,
    start: number,
  ): void {
    this.logger.log(
      JSON.stringify({
        event: 'http.request',
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Date.now() - start,
      }),
    );
  }
}
