import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Defensa en profundidad (research.md §7): exige que la cabecera
 * `X-Internal-Token` coincida con `INTERNAL_SERVICE_TOKEN`. Se aplica a
 * todos los controladores de `/internal/*` salvo `/internal/healthz` y
 * `/internal/readyz`, que deben responder incluso sin el token para que las
 * sondas de la plataforma funcionen.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-internal-token'];
    const expected = process.env.INTERNAL_SERVICE_TOKEN;

    if (!expected || provided !== expected) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Token de servicio interno inválido o ausente.',
      });
    }

    return true;
  }
}
