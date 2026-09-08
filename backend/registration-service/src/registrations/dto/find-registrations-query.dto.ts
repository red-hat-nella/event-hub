import { RegistrationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FindRegistrationsQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
