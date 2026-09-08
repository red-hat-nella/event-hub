import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthenticatedUser } from './current-user.decorator';

interface RequestWithCookies extends Request {
  cookies: Record<string, string>;
  user?: AuthenticatedUser;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

function unauthenticated(): UnauthorizedException {
  return new UnauthorizedException({
    error: {
      code: 'UNAUTHENTICATED',
      message: 'Inicia sesión para continuar.',
    },
  });
}

/**
 * Lee la cookie `access_token`, la verifica con `JWT_SECRET` y adjunta
 * `req.user = { id, email, role }`. Todas las rutas protegidas del Gateway
 * dependen de este guard (`contracts/api-gateway.md`).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = request.cookies?.['access_token'];

    if (!token) {
      throw unauthenticated();
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(
        token,
        { secret: process.env.JWT_SECRET },
      );
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
      return true;
    } catch {
      throw unauthenticated();
    }
  }
}
