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

**Limitación conocida de este entorno de desarrollo:** el sandbox de este
agente no permite mantener procesos de servidor en segundo plano entre
comandos (cada proceso en segundo plano es terminado por el supervisor del
entorno al finalizar el comando que lo originó), por lo que el *smoke
test* multi-servicio de `quickstart.md §6` (los 5 servicios corriendo
simultáneamente y consultados vía `curl`) no pudo ejecutarse de punta a
punta en este entorno, aunque cada servicio se validó de forma aislada y
exhaustiva contra su propia base de datos real como se detalla arriba.
Ese *smoke test* multi-servicio es exactamente lo que el pipeline de
`sdd-deliver`/OpenShift Pipelines ejecuta en la etapa `verify` contra el
clúster real, con evidencia `OBSERVED` que reemplazará esta nota.

## Próximos datos `OBSERVED`

El SDD Orchestrator completará, tras `converge`: commit reconciliado,
digest por imagen, revisión GitOps, URL de la `Route` y resultado del
smoke test en clúster, cada uno con fecha y contexto, reemplazando los
valores `PENDING_VALIDATION` de este documento.

Este documento contiene únicamente referencias seguras; tokens,
contraseñas, kubeconfigs y valores de `Secret` permanecen en sus almacenes
administrados.
