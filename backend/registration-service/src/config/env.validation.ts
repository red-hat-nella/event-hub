import { plainToInstance } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

/**
 * Variables de entorno requeridas por registration-service (T014).
 * `ConfigModule.forRoot({ validate })` invoca esta función una única vez al
 * arrancar el proceso; si falta o es inválida alguna variable obligatoria,
 * el servicio falla rápido en el arranque en vez de fallar de forma
 * impredecible en la primera solicitud.
 */
class EnvironmentVariables {
  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  EVENT_SERVICE_URL!: string;

  @IsString()
  @IsNotEmpty()
  INTERNAL_SERVICE_TOKEN!: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(
      `Variables de entorno inválidas para registration-service: ${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('; ')}`,
    );
  }

  return validated;
}
