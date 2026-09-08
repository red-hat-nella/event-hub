import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Debe coincidir EXACTAMENTE con el enum `EventCategory` de
 * `event-service` (`prisma/schema.prisma`: MUSIC/ART/FOOD/COMMUNITY/
 * WORKSHOP/OTHER). El Gateway reenvía este valor tal cual; una diferencia
 * de mayúsculas/minúsculas aquí provoca un 400 aguas abajo en
 * `event-service` que el Gateway no puede distinguir de un error propio.
 */
export const EVENT_CATEGORIES = [
  'MUSIC',
  'ART',
  'FOOD',
  'COMMUNITY',
  'WORKSHOP',
  'OTHER',
] as const;

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsISO8601()
  startsAt!: string;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsInt()
  @Min(1)
  maxCapacity!: number;

  @IsOptional()
  @IsIn(EVENT_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
