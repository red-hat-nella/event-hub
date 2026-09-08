# Contrato interno: user-service

**Alcance**: solo accesible desde `api-gateway` (NetworkPolicy +
`X-Internal-Token`, ver `research.md §7`). Ningún otro servicio ni el
frontend lo invoca directamente. Base path: `/internal`.

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| POST | `/internal/users` | `{name, email, password}` | `201 {id, name, email, role, createdAt}` | `400 VALIDATION_ERROR`, `409 EMAIL_IN_USE` |
| POST | `/internal/users/authenticate` | `{email, password}` | `200 {user:{id,name,email,role}, accessToken, refreshToken}` | `401 INVALID_CREDENTIALS` |
| POST | `/internal/users/refresh` | `{refreshToken}` | `200 {accessToken, refreshToken}` | `401 SESSION_EXPIRED` |
| GET | `/internal/users/:id` | — | `200 {id, name, email, role}` | `404 NOT_FOUND` |
| GET | `/internal/users?ids=a,b,c` | — | `200 [{id, name, email, role}]` (lote, hasta 100 ids) | `400 VALIDATION_ERROR` |
| GET | `/internal/healthz` | — | `200 {status:"ok"}` | — |
| GET | `/internal/readyz` | — | `200` si conexión a `db-users` activa | `503` |

## Reglas aplicadas por este servicio

- `email` único (índice de base de datos + verificación aplicativa) →
  `409 EMAIL_IN_USE` (FR-003, E-009).
- `password` con longitud mínima razonable (≥ 8, V-007) validada por DTO;
  se hashea con `bcrypt` (cost ≥ 12) antes de persistir; nunca se devuelve
  `passwordHash` en ninguna respuesta (NFR-014).
- `accessToken`: JWT HS256, TTL 30 min, claims `{sub, email, role, iat, exp}`.
- `refreshToken`: JWT HS256, TTL 7 días, claims `{sub, tokenUse:"refresh", iat, exp}`;
  `refresh` emite un par nuevo (rotación) y no mantiene lista de revocación
  (stateless, ver `research.md §6`).
- *Seed* administrador (`research.md §19`): al iniciar, si no existe una
  cuenta con `email = SEED_ADMIN_EMAIL`, se crea con `role=ADMIN` y la
  contraseña de `user-service-seed-admin`. Operación idempotente
  (`INSERT ... ON CONFLICT DO NOTHING`).

## Errores de validación (`400 VALIDATION_ERROR`)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisa los campos marcados.",
    "fields": { "email": "Formato de correo inválido", "password": "Mínimo 8 caracteres" }
  }
}
```
