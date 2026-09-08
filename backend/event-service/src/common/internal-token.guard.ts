import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { UnauthorizedInternalException } from './app-exception';

/**
 * Defensa en profundidad (research.md §7): exige `X-Internal-Token` igual a
 * `INTERNAL_SERVICE_TOKEN` en todas las rutas `/internal/*` salvo salud.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = process.env.INTERNAL_SERVICE_TOKEN;
    const provided = request.headers['x-internal-token'];

    if (!expected || provided !== expected) {
      throw new UnauthorizedInternalException();
    }

    return true;
  }
}
