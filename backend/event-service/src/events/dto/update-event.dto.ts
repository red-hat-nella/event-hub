import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventCategory } from '@prisma/client';

/** Campos parciales (contracts/event-service.md `PUT /internal/events/:id`). */
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  maxCapacity?: number;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
