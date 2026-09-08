import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Marca un handler/controlador como restringido a uno o más roles
 * (`@Roles('ADMIN')`). Combinar siempre con `JwtAuthGuard` + `RolesGuard`.
 */
export const Roles = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
