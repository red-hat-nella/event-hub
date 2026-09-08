import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { EventServiceClient } from './event-service.client';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [HttpModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService, EventServiceClient],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
