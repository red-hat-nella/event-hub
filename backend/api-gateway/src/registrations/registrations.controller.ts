import {
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type AuthenticatedUser,
} from '../auth/current-user.decorator';
import { RegistrationsService } from './registrations.service';

/**
 * `contracts/api-gateway.md` § Inscripciones (sesión requerida). Se agrupan
 * dos prefijos (`/api/events/:id/registrations` y `/api/registrations/*`)
 * en un único controlador porque comparten `RegistrationsService`.
 */
@Controller()
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('api/events/:id/registrations')
  @HttpCode(201)
  create(
    @Param('id') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.registrationsService.create(user.id, eventId, idempotencyKey);
  }

  @Get('api/registrations/me')
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    return this.registrationsService.findMine(user.id, status);
  }

  @Get('api/registrations/:id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const registration = await this.registrationsService.findOne(id);
    if (user.role !== 'ADMIN' && registration.userId !== user.id) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes permisos para esta acción.',
        },
      });
    }
    return registration;
  }

  @Delete('api/registrations/:id')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.registrationsService.cancel(id, user.id);
  }
}
