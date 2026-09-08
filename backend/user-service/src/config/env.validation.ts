/**
 * Validación de variables de entorno para `ConfigModule` (T012), sin
 * dependencias adicionales a las ya listadas para este workload. Falla
 * rápido en el arranque (`process.exit`) si falta o es inválida alguna
 * variable requerida por el servicio.
 */
export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  INTERNAL_SERVICE_TOKEN: string;
  SEED_ADMIN_EMAIL?: string;
  SEED_ADMIN_PASSWORD?: string;
  LOG_LEVEL: string;
}

const REQUIRED_STRING_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'INTERNAL_SERVICE_TOKEN',
] as const;

export function validate(config: Record<string, unknown>): EnvConfig {
  const errors: string[] = [];

  for (const key of REQUIRED_STRING_VARS) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      errors.push(`${key} es obligatoria y debe ser una cadena no vacía`);
    }
  }

  let port = 3000;
  if (config.PORT !== undefined && config.PORT !== '') {
    const parsed = Number(config.PORT);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      errors.push('PORT debe ser un entero positivo si se define');
    } else {
      port = parsed;
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuración de entorno inválida en user-service:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    PORT: port,
    DATABASE_URL: config.DATABASE_URL as string,
    JWT_SECRET: config.JWT_SECRET as string,
    INTERNAL_SERVICE_TOKEN: config.INTERNAL_SERVICE_TOKEN as string,
    SEED_ADMIN_EMAIL: config.SEED_ADMIN_EMAIL as string | undefined,
    SEED_ADMIN_PASSWORD: config.SEED_ADMIN_PASSWORD as string | undefined,
    LOG_LEVEL: (config.LOG_LEVEL as string | undefined) ?? 'info',
  };
}
