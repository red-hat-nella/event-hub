# Operación en OpenShift

**Estado:** `PENDING_VALIDATION` (despliegue real en clúster) — el código,
los manifiestos y las validaciones locales están completos y verificados.
**Gobernanza:** `1.2.0`

El inventario de workloads es `DECLARED` desde `implement`. Los datos que
dependen del clúster (commit reconciliado, digest, revisión GitOps, URL de
la `Route`, smoke test) se marcan `OBSERVED` por el SDD Orchestrator tras
`converge`, con fecha y contexto.

| Dato | Estado | Valor |
|---|---|---|
| Componente | `DECLARED` | `event-hub` |
| Ambiente | `DECLARED` | `dev` |
| Namespace | `DECLARED` | `event-hub-dev` |
| Commit | `PENDING_VALIDATION` | — (lo fija `sdd-deliver` al publicar) |
| Digest | `PENDING_VALIDATION` | — (lo asigna el orquestador por workload) |
| Revisión GitOps | `PENDING_VALIDATION` | — |
| Workloads | `DECLARED` | ver inventario abajo |
| Route/URL | `PENDING_VALIDATION` | `Route` `event-hub` → `Service` `frontend` (host lo asigna el clúster) |
| Smoke test | `PENDING_VALIDATION` (cluster) / superado en local | ver § Evidencia local |

## Inventario de workloads (`DECLARED`)

| Workload | Tipo | Runtime/Framework | Puerto | Expuesto | Datos propios |
|---|---|---|---|---|---|
| `frontend` | `Deployment` | Nginx (estático, build Vite/React) | 8080 | `Route` `event-hub` (única entrada externa) | — |
| `api-gateway` | `Deployment` | NestJS 10 / Node 20 | 3000 | Interno (solo desde `frontend`) | — |
| `user-service` | `Deployment` | NestJS 10 / Node 20 / Prisma | 3000 | Interno (solo desde `api-gateway`) | `db-users` |
| `event-service` | `Deployment` | NestJS 10 / Node 20 / Prisma | 3000 | Interno (desde `api-gateway` y `registration-service`) | `db-events` |
| `registration-service` | `Deployment` | NestJS 10 / Node 20 / Prisma | 3000 | Interno (solo desde `api-gateway`) | `db-registrations` |
| `db-users` | `StatefulSet` | PostgreSQL 16 | 5432 | Interno (solo `user-service`) | PVC 1Gi |
| `db-events` | `StatefulSet` | PostgreSQL 16 | 5432 | Interno (solo `event-service`) | PVC 1Gi |
| `db-registrations` | `StatefulSet` | PostgreSQL 16 | 5432 | Interno (solo `registration-service`) | PVC 1Gi |

Manifiestos: `deploy/openshift/base/*` + `deploy/openshift/overlays/dev`.
Contrato de workloads: `.sdd/workloads.yaml` (5 workloads, 3 recursos de
datos, 6 secretos gestionados — ver `plan.md §10`).

## Identidades y secretos (referencias, sin valores)

`jwt-signing-key`, `internal-service-token`, `db-users-credentials`,
`db-events-credentials`, `db-registrations-credentials`,
`user-service-seed-admin` — todos gestionados por el almacén aprobado de
la plataforma; ninguno tiene valores literales en este repositorio.

## Flujos de red (`NetworkPolicy`)

`deploy/openshift/base/network-policies/`: deniega todo ingreso por
defecto; permite router→`frontend`, `frontend`→`api-gateway`,
`api-gateway`→{`user-service`,`event-service`,`registration-service`},
`registration-service`→`event-service` (única excepción a "solo vía
Gateway", justificada en `plan.md §2`), y cada servicio→su propia base de
datos.

## Evidencia local (previa al despliegue en clúster)

Validado en esta sesión, contra infraestructura real local (PostgreSQL 16
vía `podman`, sin mocks de base de datos):

- `user-service`: 16/16 pruebas e2e (Jest+Supertest) contra PostgreSQL real.
- `event-service`: 19/19 pruebas e2e, incluida la prueba de concurrencia
  de `reserve` (100 solicitudes paralelas, capacidad nunca excedida — SC-004).
- `registration-service`: 17/17 pruebas e2e, incluida la carrera real del
  índice único parcial `registrations_active_unique`.
- `api-gateway`: 5 pruebas unitarias + 32 pruebas e2e (proxys y agregación
  admin con `HttpService` simulado).
- `frontend`: build de producción (`vite build`) exitoso, lint limpio,
  pruebas de componente (Vitest) en verde.
- Manifiestos: `kubectl kustomize` renderiza `base` y `overlays/dev` sin
  errores; `conftest test --all-namespaces -p policies/conftest` sobre el
  renderizado de `overlays/dev` → **0 failures** (382/390 controles en
  verde, 8 advertencias esperadas de "imagen aún no fijada por digest",
  responsabilidad del orquestador en `publish`).

Actualización 002-account-experience: `tools/run-account-test-stack.mjs`
mantiene los cuatro servicios y el navegador dentro de un proceso supervisor
local. El recorrido integrado real ya se verificó con PostgreSQL y Chromium;
la limitación anterior de procesos separados queda resuelta para pruebas locales.
Esta evidencia no sustituye la verificación del ambiente desplegado.

## Cuenta y administrador inicial — 002-account-experience

La evidencia detallada y fechada reside en
`specs/002-account-experience/verification.md` y `performance-results.md`.
Gateway devuelve `{items}` y proyecta snapshots a DTO público; frontend
valida contratos y separa caché por identidad/generación. No hay tablas nuevas.

`user-service` ejecuta dos initContainers en orden: migrate y seed-admin.
El segundo usa `node dist/bootstrap/seed-admin.js`, la misma imagen que el
servicio y la conexión a db-users; recibe únicamente referencias privadas
`user-service-seed-admin/email` y `user-service-seed-admin/password`.
No se mantienen credenciales de seed en el contenedor HTTP ni ConfigMap.
Localmente ejecutar build antes de db:seed; migrate deploy no ejecuta seed.

Resultados seguros de inicialización:

- ADMIN_CREATED / ADMIN_REUSED: éxito, sin email/hash/password en logs.
- ADMIN_IDENTITY_CONFLICT: correo pertenece a USER; no se modifica su rol.
- ADMIN_ACCESS_NOT_VERIFIED: ADMIN existente no autentica con la configuración;
  no se modifica contraseña/perfil. Recuperación solo por capacidad autorizada.
- ADMIN_CONFIGURATION_REQUIRED: entradas ausentes o inválidas; no hay fallback.
- ADMIN_BOOTSTRAP_FAILED: error operativo genérico; diagnóstico mediante canal
  autorizado, sin volcar objetos que contengan credenciales.

La semántica de email conserva la coincidencia exacta del login existente.
Concurrencia resuelve P2002 releyendo y verificando ganador; no hace upsert
que sustituya rol/hash. Reinicio y rollback de imágenes/configuración no borran
el ADMIN creado, cuentas, eventos ni inscripciones. No hay migración inversa.
Retención/backups vigentes no cambian; nunca limpiar bases existentes para reparar.

### Entrega, smoke y acceso privado

Hook `sdd.deliver`: preflight → publish → watch; Pipelines construye las imágenes
y GitOps reconcilia. No despliegue directo, nuevos operadores ni recursos de CI
en este repositorio. Preservar sondas internas, OpenSSL y upstream frontend:3000.

Tras reconciliación, el broker/orquestador autorizado debe ejecutar smoke con
fixtures identificadas: login de cuenta nueva, alta a evento futuro, dashboard,
lista/detalle, cancelación/cupo y login/operación ADMIN. El runner local no se
usa contra el clúster; Playwright acepta BASE_URL solo para el smoke autorizado.
Limpiar exclusivamente fixtures creadas para la prueba; no capturar campos de
contraseña, cookies, Secrets ni estados de autenticación en artefactos públicos.

El destinatario debe recibir URL de login e identidad/credencial mediante canal
privado aprobado o mecanismo privado autorizado de un solo uso. La disponibilidad
real de esa capacidad es PENDING_VALIDATION; watch no promete entregar passwords.
Una Route saludable o un seed exitoso no acredita FR-014. Registrar fecha,
identificador no sensible de evidencia y confirmación de entrega, nunca valores.
Si no está disponible el canal, registrar bloqueo y propietario de capacidad;
no crear enlaces ficticios ni elevar/resetear cuentas para ocultar el problema.

## Próximos datos `OBSERVED`

El SDD Orchestrator completará, tras `converge`: commit reconciliado,
digest por imagen, revisión GitOps, URL de la `Route` y resultado del
smoke test en clúster, cada uno con fecha y contexto, reemplazando los
valores `PENDING_VALIDATION` de este documento.

Este documento contiene únicamente referencias seguras; tokens,
contraseñas, kubeconfigs y valores de `Secret` permanecen en sus almacenes
administrados.
