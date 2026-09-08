import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Defensa en profundidad (research.md §7): exige la cabecera
 * `X-Internal-Token` en todo endpoint bajo `/internal`, coincidente con el
 * `Secret` `internal-service-token` compartido entre `api-gateway` y
 * `registration-service`. Complementa (no reemplaza) la `NetworkPolicy`
 * que ya restringe qué Pods pueden alcanzar este servicio.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedToken = this.configService.get<string>(
      'INTERNAL_SERVICE_TOKEN',
    );
    const providedToken = request.headers['x-internal-token'];

    if (!expectedToken || providedToken !== expectedToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Token interno inválido o ausente.',
      });
    }

    return true;
  }
}
