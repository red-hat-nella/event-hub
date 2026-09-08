import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import type { AuthenticatedUser } from './current-user.decorator';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Exige que `req.user.role` (adjuntado por `JwtAuthGuard`, que debe
 * ejecutarse antes) coincida con alguno de los roles declarados por
 * `@Roles(...)`. Sin metadata de roles, permite el acceso (la restricción
 * de autenticación ya la aplica `JwtAuthGuard`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('security');

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      this.logger.warn(
        JSON.stringify({
          event: 'admin.forbidden',
          userId: user?.id,
          role: user?.role,
          requiredRoles,
          path: request.originalUrl,
        }),
      );
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes permisos para esta acción.',
        },
      });
    }

    return true;
  }
}
