# Administrador inicial

## Ejecución

Proceso interno, sin endpoint público. Segundo initContainer de user-service tras migrate, imagen IMAGE_USER_SERVICE, comando `node dist/bootstrap/seed-admin.js`. Implementar lógica en src/bootstrap y compartir con CLI db:seed.

Entradas: DATABASE_URL de referencias existentes; SEED_ADMIN_EMAIL/PASSWORD de `user-service-seed-admin` claves email/password. Validar email y reglas de contraseña existentes antes de escribir. No valores en Git.

## Resultados

- Exit0 ADMIN_CREATED o ADMIN_REUSED, sin email/password/hash en logs.
- ADMIN existente: conservar perfil/hash y comprobar password configurada antes de declarar acceso verificable.
- USER existente: fallo ADMIN_IDENTITY_CONFLICT, sin elevar rol.
- Password desalineada: fallo ADMIN_ACCESS_NOT_VERIFIED, sin reset automático.
- Entradas ausentes: ADMIN_CONFIGURATION_REQUIRED, solo nombres de campos.
- Carrera de creación: unicidad de email, capturar colisión, releer y validar ganador. No upsert que actualice rol/hash.

## Handoff

Broker/orquestador con identidad autorizada prueba login y acción ADMIN, entrega URL/identificador/credencial al solicitante por canal privado aprobado. No password/cookies/Secret en logs, capturas, resultados ni reporte público. Agente conserva evidencia no sensible.

Gate operativo: comprobar disponibilidad real del canal privado al destinatario; mientras falte, FR-014 no está completo aunque aplicación esté saludable. No inventar link de recuperación ni suponer que watch entrega contraseñas. Password desalineada requiere recuperación autorizada.

## Validación

DB desechable: creación/repetición/concurrencia/USER/conflicto password/configuración ausente. Entrega administrada: login y acción ADMIN con fixture sintético, limpieza solo fixture. No pruebas que impriman valores. Reinicio/rollback no borra ni repone datos.
