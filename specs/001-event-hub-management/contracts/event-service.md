# Contrato interno: event-service

**Alcance**: lectura/escritura de catálogo accesible desde `api-gateway`.
Los endpoints `reserve`/`release` son accesibles **únicamente** desde
`registration-service` (NetworkPolicy adicional + `X-Internal-Token`).
Base path: `/internal`.

## Catálogo (usado por `api-gateway` para servir `/api/events*`)

| Método | Ruta | Body/Query | Éxito | Errores |
|---|---|---|---|---|
| GET | `/internal/events` | `search, category, location, dateFrom, dateTo, page, pageSize, sort` | `200 {items:[Event], page, pageSize, total, totalPages}` | `400 VALIDATION_ERROR` |
| GET | `/internal/events/:id` | — | `200 Event` (incluye `temporalStatus` calculado) | `404 NOT_FOUND` |
| POST | `/internal/events` | `{name, description, startsAt, location, maxCapacity, category?, imageUrl?}` | `201 Event` (`availableSlots = maxCapacity`) | `400 VALIDATION_ERROR` (V-001..V-005, BR-007) |
| PUT | `/internal/events/:id` | campos parciales | `200 Event` | `400`, `404`, `409 CAPACITY_BELOW_ACTIVE_REGISTRATIONS` |
| DELETE | `/internal/events/:id` | — | `204` | `404` |
| GET | `/internal/healthz` / `/internal/readyz` | — | `200` | `503` |

## Reserva/liberación de cupo (solo `registration-service`)

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| POST | `/internal/events/:id/reserve` | `{}` | `200 {availableSlots}` | `404 NOT_FOUND`, `409 {code: CAPACITY_EXCEEDED \| EVENT_ALREADY_STARTED}` |
| POST | `/internal/events/:id/release` | `{}` | `200 {availableSlots}` | `404 NOT_FOUND` |

### Implementación de `reserve` (garantía de no sobre-cupo — SC-004)

```sql
UPDATE events
SET available_slots = available_slots - 1, updated_at = now()
WHERE id = $1 AND available_slots > 0 AND starts_at > now()
RETURNING available_slots;
```

- 1 fila afectada → `200 {availableSlots}`.
- 0 filas afectadas → el servicio distingue la causa con una segunda
  lectura (fuera de la ruta crítica de escritura) para devolver el código
  correcto: evento no existe → `404`; `starts_at <= now()` → `409
  EVENT_ALREADY_STARTED`; en otro caso → `409 CAPACITY_EXCEEDED`.
- La sentencia es atómica a nivel de fila en PostgreSQL: dos ejecuciones
  concurrentes sobre el mismo `id` se serializan; nunca ambas pueden tener
  éxito si solo queda un cupo.

### Implementación de `release`

```sql
UPDATE events
SET available_slots = LEAST(available_slots + 1, max_capacity), updated_at = now()
WHERE id = $1
RETURNING available_slots;
```

`LEAST(...)` es una protección de defensa en profundidad para que una
compensación duplicada (reintento) nunca haga que `availableSlots` supere
`maxCapacity`.

## Reglas aplicadas por este servicio

- BR-006/V-001..V-005: campos obligatorios y `maxCapacity > 0`.
- BR-007/V-003: `startsAt` debe ser futuro al crear o actualizar.
- BR-011/V-005: al actualizar `maxCapacity`, se exige
  `nuevo ≥ (actual − availableSlots)`; si se cumple, `availableSlots` se
  ajusta por delta en la misma transacción (ver `data-model.md`).
- `DELETE` no verifica inscripciones activas (esa advertencia ocurre en el
  frontend, que primero consulta
  `GET /api/events/:id/registrations` vía el Gateway antes de pedir
  confirmación — FR-030). Las filas de `Registration` no se ven afectadas
  por este servicio (viven en otra base de datos).
