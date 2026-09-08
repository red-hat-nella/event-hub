import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EventCategory } from '@prisma/client';

/**
 * Los campos se marcan `@IsOptional()` a nivel de tipo/whitelist de Nest;
 * las reglas de negocio (obligatoriedad, `maxCapacity > 0`, `startsAt`
 * futuro) las aplica `EventsService` para producir el mapa `fields` exacto
 * de `400 VALIDATION_ERROR` (V-001..V-005, BR-007).
 */
export class CreateEventDto {
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
