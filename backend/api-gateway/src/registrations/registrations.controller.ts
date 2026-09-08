import {
  Controller,
  BadRequestException,
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
import {
  presentRegistration,
  presentRegistrationList,
  invalidRegistrationResponse,
} from './registration.presenter';

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
  async create(
    @Param('id') eventId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return presentRegistration(
      await this.registrationsService.create(user.id, eventId, idempotencyKey),
    );
  }

  @Get('api/registrations/me')
  async findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
  ) {
    if (status !== undefined && !['ACTIVE', 'CANCELLED'].includes(status)) {
      throw new BadRequestException({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Estado de inscripción inválido.',
        },
      });
    }
    const records = await this.registrationsService.findMine(user.id, status);
    if (
      Array.isArray(records) &&
      records.some((record) => record && record.userId !== user.id)
    )
      return invalidRegistrationResponse();
    return presentRegistrationList(records);
  }

  @Get('api/registrations/:id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const registration = await this.registrationsService.findOne(id);
    if (!registration || typeof registration.userId !== 'string')
      return invalidRegistrationResponse();
    if (user.role !== 'ADMIN' && registration.userId !== user.id) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'No tienes permisos para esta acción.',
        },
      });
    }
    return presentRegistration(registration);
  }

  @Delete('api/registrations/:id')
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // El servicio interno autoriza al titular antes de cancelar y liberar cupo.
    const registration = await this.registrationsService.cancel(id, user.id);
    if (registration?.userId !== user.id) return invalidRegistrationResponse();
    return presentRegistration(registration);
  }
}
