const REQUIRED_ENV_VARS = [
  'USER_SERVICE_URL',
  'EVENT_SERVICE_URL',
  'REGISTRATION_SERVICE_URL',
  'JWT_SECRET',
  'INTERNAL_SERVICE_TOKEN',
] as const;

/**
 * Validación mínima de variables de entorno requeridas para que
 * `api-gateway` pueda enrutar hacia los tres servicios internos y verificar
 * JWT. Sin dependencia de Joi (no declarada como dependencia del workload).
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(', ')}`,
    );
  }
  return config;
}
