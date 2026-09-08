# Modelo de datos

Sin nuevas tablas ni migraciones de esquema. La ampliación de 2026-09-08 añade una migración de datos con 12 eventos Demo e identificadores estables; no sobrescribe datos existentes. User conserva id, name, email único, passwordHash, role y timestamps. Event conserva modelo vigente. Registration mantiene id/userId/eventId, ACTIVE/CANCELLED, createdAt/cancelledAt y snapshots de nombre/fecha/ubicación. Se conservan índice de inscripción activa e idempotencia.

## DTO público Registration

| Campo | Tipo/regla |
|---|---|
| id,eventId | Identificador string obligatorio no vacío |
| status | ACTIVE/CANCELLED; desconocido es error |
| createdAt | Timestamp ISO válido obligatorio |
| cancelledAt | Timestamp válido cuando cancelada, null cuando activa |
| eventName | Snapshot string o null si ausente/vacío/inválido |
| eventStartsAt | Snapshot ISO válido o null |
| eventLocation | Snapshot string o null si ausente/vacío/inválido |

Lista pública `{items: Registration[]}` completa. No userId público; autorización sobre registro interno antes de proyectar. Corrupción esencial invalida respuesta, no vacía colección. Metadata nullable requiere etiquetas explícitas, no valores inventados.

## Estado derivado

activeCount/cancelledCount cuentan todos los registros propios por estado. upcoming filtra activas con fecha conocida futura y ordena fecha/id, máximo3; nextParticipation es primera o null. Colección desconocida implica agregados desconocidos, no cero. Sin fecha válida no ofrecer cancelación basada en fecha.

## Transiciones

- ACTIVE→CANCELLED: reglas actuales de propiedad/fecha, una liberación de cupo, invalidar datos derivados tras éxito.
- Sesión loading→authenticated/anonymous/error recuperable. Cambio/logout/401 vigente incrementa generación y elimina caché; ignorar respuestas anteriores.
- Bootstrap ausente→ADMIN creado; ADMIN→conservado y acceso verificado; USER→conflicto. Colisión concurrente→relectura/verificación; configuración ausente→fallo explícito sin valores sensibles.

Ownership, retención, backups y recuperación existentes permanecen. Rollback de software no borra cuenta admin ni inscripciones.
