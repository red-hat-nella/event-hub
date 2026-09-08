# Contrato público: API Gateway

**Base path**: `/api` (mismo origen que el frontend; sin CORS). Único
contrato que el frontend consume — nunca llama directamente a
`user-service`, `event-service` ni `registration-service`.

## Convenciones

- Autenticación: cookies `httpOnly` `access_token` / `refresh_token`
  emitidas por `POST /api/auth/login`. Rutas protegidas exigen
  `access_token` válido; rutas administrativas exigen además `role=ADMIN`.
- Envolvente de error uniforme (BR-009, FR-034):
  ```json
  { "error": { "code": "CAPACITY_EXCEEDED", "message": "El evento alcanzó su capacidad máxima.", "fields": {} } }
  ```
  `fields` solo aparece en errores de validación (`400 VALIDATION_ERROR`) y
  mapea nombre de campo → mensaje específico.
- Idempotencia: `POST /api/events/:id/registrations` acepta cabecera
  `Idempotency-Key` (UUID). Recomendada para reintentos seguros tras fallo
  de red (E-007).
- Todas las fechas en ISO-8601 UTC.

## Autenticación

| Método | Ruta | Auth | Body | Éxito | Errores |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | pública | `{name, email, password}` | `201 {id,name,email,role,createdAt}` | `400 VALIDATION_ERROR`, `409 EMAIL_IN_USE` |
| POST | `/api/auth/login` | pública | `{email, password}` | `200 {id,name,email,role}` + cookies | `401 INVALID_CREDENTIALS` |
| POST | `/api/auth/refresh` | cookie `refresh_token` | — | `200` + cookies rotadas | `401 SESSION_EXPIRED` |
| POST | `/api/auth/logout` | sesión | — | `204` (limpia cookies) | — |
| GET | `/api/auth/me` | sesión | — | `200 {id,name,email,role}` | `401 UNAUTHENTICATED` |

## Catálogo y detalle de eventos (lectura pública)

| Método | Ruta | Auth | Query/Body | Éxito | Errores |
|---|---|---|---|---|---|
| GET | `/api/events` | pública | `search, category, location, dateFrom, dateTo, page=1, pageSize=12, sort` | `200 {items:[EventSummary], page, pageSize, total, totalPages}` | `400 VALIDATION_ERROR` |
| GET | `/api/events/:id` | pública | — | `200 EventDetail` | `404 NOT_FOUND` |

`EventSummary`: `{id, name, startsAt, location, category, imageUrl, maxCapacity, availableSlots, temporalStatus}`.
`EventDetail`: `EventSummary` + `{description}`.

## Administración de eventos (`role=ADMIN`)

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/events` | `{name, description, startsAt, location, maxCapacity, category?, imageUrl?}` | `201 EventDetail` | `400 VALIDATION_ERROR`, `403 FORBIDDEN` |
| PUT | `/api/events/:id` | mismos campos (parcial permitido) | `200 EventDetail` | `400`, `403`, `404 NOT_FOUND`, `409 CAPACITY_BELOW_ACTIVE_REGISTRATIONS` |
| DELETE | `/api/events/:id` | — | `204` | `403`, `404` |
| GET | `/api/events/:id/registrations` | `?status=ACTIVE\|CANCELLED` | `200 {items:[AdminRegistration], capacity, occupied, available}` | `403`, `404` |

`AdminRegistration`: `{registrationId, userId, userName, userEmail, status, createdAt, cancelledAt}`
— el Gateway lo construye combinando `registration-service` (lista +
estado) con `user-service` (nombre/correo por lote), sin que
`registration-service` almacene datos personales del usuario.

## Inscripciones (sesión requerida)

| Método | Ruta | Headers/Body | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/events/:id/registrations` | `Idempotency-Key` (recomendado) | `201 RegistrationDetail` | `401`, `404 NOT_FOUND`, `409 {ALREADY_REGISTERED\|CAPACITY_EXCEEDED\|EVENT_ALREADY_STARTED}` |
| GET | `/api/registrations/me` | `?status=ACTIVE\|CANCELLED` | `200 {items:[RegistrationSummary]}` | `401` |
| GET | `/api/registrations/:id` | — (propietario o admin) | `200 RegistrationDetail` | `401`, `403 FORBIDDEN`, `404` |
| DELETE | `/api/registrations/:id` | — | `200 RegistrationDetail` (status `CANCELLED`) | `401`, `403`, `404`, `409 EVENT_ALREADY_STARTED` |

`RegistrationSummary`: `{id, eventId, eventName, eventStartsAt, eventLocation, status, createdAt}`
(usa el snapshot desnormalizado de `registration-service`, resiliente a
eliminación del evento — ver `data-model.md`).
`RegistrationDetail`: `RegistrationSummary` + `{cancelledAt}`.

## Mapeo de códigos de error → mensaje (BR-009)

| `code` | HTTP | Mensaje al usuario |
|---|---|---|
| `VALIDATION_ERROR` | 400 | "Revisa los campos marcados." (+ detalle por campo) |
| `UNAUTHENTICATED` | 401 | "Inicia sesión para continuar." |
| `INVALID_CREDENTIALS` | 401 | "Correo o contraseña incorrectos." |
| `SESSION_EXPIRED` | 401 | "Tu sesión expiró, vuelve a iniciar sesión." |
| `FORBIDDEN` | 403 | "No tienes permisos para esta acción." |
| `NOT_FOUND` | 404 | "Este recurso ya no está disponible." |
| `EMAIL_IN_USE` | 409 | "Ese correo ya está registrado." |
| `ALREADY_REGISTERED` | 409 | "Ya estás inscrito en este evento." |
| `CAPACITY_EXCEEDED` | 409 | "El evento alcanzó su capacidad máxima." |
| `EVENT_ALREADY_STARTED` | 409 | "Las inscripciones para este evento están cerradas." |
| `CAPACITY_BELOW_ACTIVE_REGISTRATIONS` | 409 | "La nueva capacidad es menor que los inscritos activos." |
