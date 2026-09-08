import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Registration } from '@prisma/client';
import { InternalTokenGuard } from '../common/internal-token.guard';
import { CancelRegistrationDto } from './dto/cancel-registration.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { FindByEventQueryDto } from './dto/find-by-event-query.dto';
import { FindRegistrationsQueryDto } from './dto/find-registrations-query.dto';
import { RegistrationsService } from './registrations.service';

/**
 * `/internal/registrations*` y `/internal/events/:eventId/registrations`
 * per `contracts/registration-service.md`. Accesible únicamente desde
 * `api-gateway` (`InternalTokenGuard` + `NetworkPolicy`).
 */
@UseGuards(InternalTokenGuard)
@Controller('internal')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('registrations')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateRegistrationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<Registration> {
    return this.registrationsService.create(
      dto.userId,
      dto.eventId,
      idempotencyKey,
    );
  }

  @Get('registrations')
  findMany(@Query() query: FindRegistrationsQueryDto): Promise<Registration[]> {
    return this.registrationsService.findMany({
      userId: query.userId,
      status: query.status,
    });
  }

  @Get('registrations/:id')
  findOne(@Param('id') id: string): Promise<Registration> {
    return this.registrationsService.findOne(id);
  }

  @Delete('registrations/:id')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelRegistrationDto,
  ): Promise<Registration> {
    return this.registrationsService.cancel(id, dto.userId);
  }

  @Get('events/:eventId/registrations')
  findByEvent(
    @Param('eventId') eventId: string,
    @Query() query: FindByEventQueryDto,
  ) {
    return this.registrationsService.findByEvent(eventId, query.status);
  }
}
