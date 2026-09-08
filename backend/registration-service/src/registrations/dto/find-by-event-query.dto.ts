import { RegistrationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class FindByEventQueryDto {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
