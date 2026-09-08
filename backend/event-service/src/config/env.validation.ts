/**
 * Validación mínima de variables de entorno obligatorias (T013).
 * `event-service` no puede operar sin conexión a `db-events` ni sin el
 * token de defensa en profundidad usado por `InternalTokenGuard`.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const required = ['DATABASE_URL', 'INTERNAL_SERVICE_TOKEN'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias en event-service: ${missing.join(', ')}`,
    );
  }

  return config;
}
