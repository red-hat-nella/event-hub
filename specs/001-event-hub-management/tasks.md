---

description: "Task list for Event Hub — Gestión de Eventos e Inscripciones"
---

# Tasks: Event Hub — Gestión de Eventos e Inscripciones

**Input**: Design documents from `/specs/001-event-hub-management/`
(`plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`,
`quickstart.md`, `ux-design.md`)

**Tests**: incluidas. `research.md §14` y `plan.md §3/§14` piden
explícitamente pruebas de contrato, integración de concurrencia (SC-004) y
E2E; no son opcionales para esta feature.

**Organization**: tareas agrupadas por historia de usuario (US1–US6, según
prioridad P1–P6 de `spec.md`) para permitir implementación y prueba
independientes de cada una.

**Nota sobre el objetivo de despliegue**: el desarrollador pidió
explícitamente que, sea como sea, la aplicación termine desplegada en
OpenShift con una `Route` accesible. Esta lista de tareas construye todo lo
necesario para que eso sea posible (Containerfiles, manifiestos Kustomize,
`NetworkPolicy`, probes, `.sdd/workloads.yaml` ya completado en `plan.md`) y
cierra con la Fase 9, que valida y dispara la entrega. La publicación real
por OpenShift Pipelines/GitOps y la obtención de la `Route` ocurren durante
`/speckit-implement` (su hook obligatorio `sdd.deliver`), no durante esta
fase de planificación de tareas.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin
  dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece (US1…US6)
- Cada tarea incluye la ruta de archivo exacta

## Path Conventions

Aplicación web de microservicios (`plan.md §11`):
`backend/<servicio>/src/...` (4 servicios NestJS independientes),
`frontend/src/...` (React/Vite), `deploy/openshift/{base,overlays/dev}/...`
(Kustomize), `docker-compose.dev.yml` (paridad local).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: inicialización de los 5 workloads, sin dependencias entre sí.

- [X] T001 Crear la estructura raíz `backend/`, `frontend/`,
      `deploy/openshift/base/`, `deploy/openshift/overlays/dev/` per
      `plan.md §11`
- [X] T002 [P] Inicializar proyecto NestJS en `backend/api-gateway`
      (`package.json`, `tsconfig.json`, `nest-cli.json`, `src/main.ts`)
- [X] T003 [P] Inicializar proyecto NestJS con Prisma en
      `backend/user-service` (`package.json`, `tsconfig.json`,
      `nest-cli.json`, `src/main.ts`, `prisma/schema.prisma` placeholder)
- [X] T004 [P] Inicializar proyecto NestJS con Prisma en
      `backend/event-service` (misma estructura que T003)
- [X] T005 [P] Inicializar proyecto NestJS con Prisma en
      `backend/registration-service` (misma estructura que T003)
- [X] T006 [P] Inicializar proyecto Vite + React + TypeScript en `frontend`
      (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`)
- [X] T007 [P] Configurar Tailwind CSS con los tokens de
      `ux-design.md §2` en `frontend/tailwind.config.ts` y
      `frontend/src/index.css`
- [X] T008 [P] Agregar fuentes autoalojadas Fraunces/Inter y reglas
      `@font-face` en `frontend/public/fonts/` y `frontend/src/index.css`
- [X] T009 Crear `docker-compose.dev.yml` en la raíz del repositorio con
      `db-users`, `db-events`, `db-registrations` per `quickstart.md §1`
- [X] T010 [P] Configurar ESLint + Prettier independiente por workload en
      `backend/api-gateway/.eslintrc.cjs`,
      `backend/user-service/.eslintrc.cjs`,
      `backend/event-service/.eslintrc.cjs`,
      `backend/registration-service/.eslintrc.cjs`,
      `frontend/.eslintrc.cjs`

**Checkpoint**: los 5 workloads tienen esqueleto propio e independiente.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: infraestructura transversal que TODAS las historias
necesitan: configuración, manejo de errores uniforme, defensa en
profundidad interna, salud, imágenes de contenedor, manifiestos base de
OpenShift y el *shell* del frontend (design system, routing, sesión).

**⚠️ CRITICAL**: ninguna historia de usuario puede comenzar hasta
completar esta fase.

- [X] T011 [P] Configurar `ConfigModule` con validación de variables de
      entorno en `backend/api-gateway/src/app.module.ts`
- [X] T012 [P] Configurar `ConfigModule` con validación de variables de
      entorno en `backend/user-service/src/app.module.ts`
- [X] T013 [P] Configurar `ConfigModule` con validación de variables de
      entorno en `backend/event-service/src/app.module.ts`
- [X] T014 [P] Configurar `ConfigModule` con validación de variables de
      entorno en `backend/registration-service/src/app.module.ts`
- [X] T015 [P] Implementar el filtro de excepción con envolvente de error
      uniforme (`contracts/api-gateway.md`) en
      `backend/api-gateway/src/common/http-exception.filter.ts`
- [X] T016 [P] Implementar el mismo filtro de excepción en
      `backend/user-service/src/common/http-exception.filter.ts`
- [X] T017 [P] Implementar el mismo filtro de excepción en
      `backend/event-service/src/common/http-exception.filter.ts`
- [X] T018 [P] Implementar el mismo filtro de excepción en
      `backend/registration-service/src/common/http-exception.filter.ts`
- [X] T019 [P] Implementar `InternalTokenGuard` (valida cabecera
      `X-Internal-Token` contra `internal-service-token`) en
      `backend/user-service/src/common/internal-token.guard.ts`
- [X] T020 [P] Implementar `InternalTokenGuard` en
      `backend/event-service/src/common/internal-token.guard.ts`
- [X] T021 [P] Implementar `InternalTokenGuard` en
      `backend/registration-service/src/common/internal-token.guard.ts`
- [X] T022 [P] Implementar controladores `GET /healthz` y `GET /readyz`
      en `backend/api-gateway/src/common/health.controller.ts`
- [X] T023 [P] Implementar `GET /healthz` y `GET /readyz` (verifica
      conexión a `db-users`) en
      `backend/user-service/src/common/health.controller.ts`
- [X] T024 [P] Implementar `GET /healthz` y `GET /readyz` (verifica
      conexión a `db-events`) en
      `backend/event-service/src/common/health.controller.ts`
- [X] T025 [P] Implementar `GET /healthz` y `GET /readyz` (verifica
      conexión a `db-registrations`) en
      `backend/registration-service/src/common/health.controller.ts`
- [X] T026 [P] Escribir `Containerfile` multi-stage (build `node:20-alpine`,
      runtime mínimo no root) en `backend/api-gateway/Containerfile`
- [X] T027 [P] Escribir `Containerfile` multi-stage en
      `backend/user-service/Containerfile`
- [X] T028 [P] Escribir `Containerfile` multi-stage en
      `backend/event-service/Containerfile`
- [X] T029 [P] Escribir `Containerfile` multi-stage en
      `backend/registration-service/Containerfile`
- [X] T030 [P] Escribir `Containerfile` multi-stage (build Vite + runtime
      `nginxinc/nginx-unprivileged`) en `frontend/Containerfile` y la
      plantilla de proxy `/api/*` en `frontend/nginx/nginx.conf.template`
      per `research.md §16`
- [X] T031 Crear `deploy/openshift/base/kustomization.yaml` agregando las
      bases de los 8 componentes (5 workloads + 3 bases de datos)
- [X] T032 [P] Crear
      `deploy/openshift/base/frontend/{deployment.yaml,service.yaml,route.yaml,configmap.yaml}`
      con probes en `/healthz`, `securityContext` no root, `resources`, y
      placeholder de imagen `IMAGE_FRONTEND`
- [X] T033 [P] Crear
      `deploy/openshift/base/api-gateway/{deployment.yaml,service.yaml,configmap.yaml}`
      con probes, `securityContext`, `resources`, placeholder
      `IMAGE_API_GATEWAY`
- [X] T034 [P] Crear
      `deploy/openshift/base/user-service/{deployment.yaml,service.yaml,configmap.yaml}`
      con `initContainer` de `prisma migrate deploy`, placeholder
      `IMAGE_USER_SERVICE`
- [X] T035 [P] Crear
      `deploy/openshift/base/event-service/{deployment.yaml,service.yaml,configmap.yaml}`
      con `initContainer` de migración, placeholder `IMAGE_EVENT_SERVICE`
- [X] T036 [P] Crear
      `deploy/openshift/base/registration-service/{deployment.yaml,service.yaml,configmap.yaml}`
      con `initContainer` de migración, placeholder
      `IMAGE_REGISTRATION_SERVICE`
- [X] T037 [P] Crear
      `deploy/openshift/base/db-users/{statefulset.yaml,service.yaml,pvc.yaml}`
      (PostgreSQL 16, credenciales desde `db-users-credentials`)
- [X] T038 [P] Crear
      `deploy/openshift/base/db-events/{statefulset.yaml,service.yaml,pvc.yaml}`
- [X] T039 [P] Crear
      `deploy/openshift/base/db-registrations/{statefulset.yaml,service.yaml,pvc.yaml}`
- [X] T040 Crear `deploy/openshift/base/network-policies/*.yaml` con las 6
      políticas de `plan.md §10` (`default-deny-ingress`,
      `allow-router-to-frontend`, `allow-frontend-to-gateway`,
      `allow-gateway-to-domain-services`, `allow-registration-to-event`,
      `allow-service-to-own-db`)
- [X] T041 Crear `deploy/openshift/overlays/dev/kustomization.yaml`
      (placeholders de imagen, `replicas=1`, recursos modestos, valores de
      `ConfigMap` de `dev`)
- [X] T042 [P] Construir el *shell* de enrutamiento en
      `frontend/src/app/router.tsx` con el árbol de rutas de
      `ux-design.md §3` (páginas *placeholder*)
- [X] T043 [P] Implementar átomos del sistema de diseño en
      `frontend/src/design-system/atoms/` (`Button`, `Badge`, `Input`,
      `Select`, `Textarea`, `Checkbox`, `Spinner`, `IconButton`, `Avatar`)
      per `ux-design.md §4`
- [X] T044 [P] Implementar moléculas del sistema de diseño en
      `frontend/src/design-system/molecules/` (`FormField`,
      `ConfirmDialog`, `Toast`/`ToastStack`, `EmptyState`, `SkeletonCard`,
      `SkeletonRow`, `Pagination`)
- [X] T045 [P] Configurar el proveedor de TanStack Query en
      `frontend/src/app/providers.tsx`
- [X] T046 [P] Implementar el cliente HTTP tipado (mismo origen `/api/*`,
      parseo de la envolvente de error) en
      `frontend/src/services/api-client.ts`
- [X] T047 [P] Implementar `AuthContext` (sesión: id/nombre/rol,
      `useAuth`) en `frontend/src/app/auth-context.tsx` y los guardas
      `ProtectedRoute`/`AdminRoute` en `frontend/src/app/route-guards.tsx`
- [X] T048 [P] Implementar el layout `AppHeader`/`AppFooter` con
      navegación consciente del rol en
      `frontend/src/design-system/organisms/{AppHeader.tsx,AppFooter.tsx}`
      per `ux-design.md §3`

**Checkpoint**: fundación lista — las historias de usuario pueden
comenzar.

---

## Phase 3: User Story 1 - Descubrir eventos disponibles (Priority: P1) 🎯 MVP

**Goal**: explorar el catálogo, filtrar/buscar y ver el detalle de un
evento sin necesidad de sesión.

**Independent Test**: con un catálogo ya poblado, listar eventos, aplicar
un filtro/búsqueda y abrir el detalle de un evento — sin login y sin
ninguna otra historia implementada.

- [X] T049 [US1] Definir el esquema Prisma de `Event` (campos de
      `data-model.md` § Event, incl. `category`/`imageUrl`) y la
      migración inicial en `backend/event-service/prisma/schema.prisma`
- [X] T050 [US1] Implementar `EventsService.findMany`/`findOne` (filtros
      de `contracts/event-service.md`, `temporalStatus` calculado) en
      `backend/event-service/src/events/events.service.ts`
- [X] T051 [US1] Implementar `GET /internal/events` y
      `GET /internal/events/:id` en
      `backend/event-service/src/events/events.controller.ts`
- [X] T052 [P] [US1] Prueba de contrato para los endpoints de catálogo en
      `backend/event-service/test/events.catalog.e2e-spec.ts`
- [X] T053 [US1] Implementar el proxy `GET /api/events` /
      `GET /api/events/:id` en
      `backend/api-gateway/src/events/events.controller.ts`
- [X] T054 [P] [US1] Prueba de contrato para `GET /api/events*` en
      `backend/api-gateway/test/events.e2e-spec.ts`
- [X] T055 [US1] Implementar los hooks `useEvents`/`useEvent` (TanStack
      Query) en `frontend/src/features/events/hooks.ts`
- [X] T056 [US1] Implementar el organismo `EventCard` (imagen/ilustración
      de reemplazo, categoría, disponibilidad, CTA) en
      `frontend/src/design-system/organisms/EventCard.tsx`
- [X] T057 [US1] Implementar `EventFilterBar` (texto + categoría + fecha +
      ubicación en un paso) en
      `frontend/src/features/events/EventFilterBar.tsx`
- [X] T058 [US1] Implementar la página Home (`/`) en
      `frontend/src/features/events/HomePage.tsx` con estados de
      carga/vacío/error
- [X] T059 [US1] Implementar la página Catálogo/Resultados (`/eventos`) en
      `frontend/src/features/events/CatalogPage.tsx` con grid,
      `Pagination` y ambos vacíos (catálogo global vs. sin resultados de
      filtro)
- [X] T060 [US1] Implementar la página Detalle del evento (`/eventos/:id`)
      en `frontend/src/features/events/EventDetailPage.tsx` con badge de
      agotado (texto + ícono) y estados de carga/error/vacío
- [X] T061 [P] [US1] Pruebas de componente para `EventCard`/`EventFilterBar`
      en `frontend/src/features/events/__tests__/`
- [X] T062 [US1] Conectar las rutas `/`, `/eventos`, `/eventos/:id` en
      `frontend/src/app/router.tsx`
- [X] T063 [P] [US1] E2E Playwright "explorar catálogo, filtrar, ver
      detalle sin sesión" en `frontend/e2e/discover-events.spec.ts`

**Checkpoint**: US1 completamente funcional y demostrable de forma
independiente.

---

## Phase 4: User Story 2 - Crear cuenta e iniciar sesión (Priority: P2)

**Goal**: registro e inicio/cierre de sesión propios, habilitando el resto
de acciones personalizadas.

**Independent Test**: crear una cuenta con datos válidos, cerrar sesión y
volver a iniciar sesión con las mismas credenciales.

- [X] T064 [US2] Definir el esquema Prisma de `User` (índice único de
      `email`) y la migración inicial en
      `backend/user-service/prisma/schema.prisma`
- [X] T065 [US2] Implementar el *seed* administrador idempotente
      (`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`) en
      `backend/user-service/prisma/seed.ts`
- [X] T066 [US2] Implementar `UsersService.create` (bcrypt) y
      `UsersService.authenticate`/`refresh` (JWT HS256) en
      `backend/user-service/src/users/users.service.ts`
- [X] T067 [US2] Implementar los controladores de
      `contracts/user-service.md` en
      `backend/user-service/src/users/users.controller.ts`
- [X] T068 [P] [US2] Pruebas de contrato de autenticación en
      `backend/user-service/test/users.e2e-spec.ts`
- [X] T069 [US2] Implementar `JwtAuthGuard` y `RolesGuard` en
      `backend/api-gateway/src/auth/jwt-auth.guard.ts` y
      `backend/api-gateway/src/auth/roles.guard.ts`
- [X] T070 [US2] Implementar
      `backend/api-gateway/src/auth/auth.controller.ts` (register/login
      con cookies `httpOnly`/refresh/logout/me) per
      `contracts/api-gateway.md`
- [X] T071 [P] [US2] Pruebas de contrato de autenticación del Gateway
      (incl. cookies) en `backend/api-gateway/test/auth.e2e-spec.ts`
- [X] T072 [US2] Implementar `AuthForm` (React Hook Form + Zod) en
      `frontend/src/features/auth/AuthForm.tsx`
- [X] T073 [US2] Implementar la página Login (`/login`, redirección
      `?from=`) en `frontend/src/features/auth/LoginPage.tsx`
- [X] T074 [US2] Implementar la página Registro (`/registro`, auto-login)
      en `frontend/src/features/auth/RegisterPage.tsx`
- [X] T075 [US2] Conectar `AuthContext` a `GET /api/auth/me` y a los
      guardas de ruta reales en `frontend/src/app/auth-context.tsx`
- [X] T076 [US2] Conectar las rutas `/login`, `/registro` en
      `frontend/src/app/router.tsx`
- [X] T077 [P] [US2] E2E Playwright "registro, logout, login" en
      `frontend/e2e/auth.spec.ts`

**Checkpoint**: US1 y US2 funcionan de forma independiente y combinada.

---

## Phase 5: User Story 3 - Inscribirse a un evento (Priority: P3)

**Goal**: inscripción confirmada en un evento con cupo disponible —
transacción central del producto.

**Independent Test**: con un usuario autenticado y un evento futuro con
cupo, inscribirse desde el detalle y verificar confirmación + cupos
actualizados.

- [X] T078 [US3] Implementar `POST /internal/events/:id/reserve` y
      `POST /internal/events/:id/release` (`UPDATE` condicional atómico
      de `contracts/event-service.md`) en
      `backend/event-service/src/events/{events.service.ts,events.controller.ts}`
- [X] T079 [P] [US3] Prueba de integración de concurrencia (100 llamadas
      `reserve` en paralelo, SC-004) en
      `backend/event-service/test/reserve.concurrency.spec.ts`
- [X] T080 [US3] Definir el esquema Prisma de `Registration` +
      `IdempotencyKey` (índice único parcial
      `(user_id,event_id) WHERE status='ACTIVE'`) y migración en
      `backend/registration-service/prisma/schema.prisma`
- [X] T081 [US3] Implementar `RegistrationsService.create` (idempotencia,
      pre-chequeo, `reserve`, inserción con compensación) en
      `backend/registration-service/src/registrations/registrations.service.ts`
      per la secuencia de `contracts/registration-service.md`
- [X] T082 [US3] Implementar `POST /internal/registrations` (lee
      `Idempotency-Key`) en
      `backend/registration-service/src/registrations/registrations.controller.ts`
- [X] T083 [P] [US3] Pruebas de contrato/integración del flujo de
      creación (éxito, `ALREADY_REGISTERED`, `CAPACITY_EXCEEDED`,
      `EVENT_ALREADY_STARTED`, reintento idempotente) en
      `backend/registration-service/test/registrations.create.e2e-spec.ts`
- [X] T084 [US3] Implementar el proxy
      `POST /api/events/:id/registrations` (reenvía `Idempotency-Key`,
      inyecta `userId` autenticado) en
      `backend/api-gateway/src/registrations/registrations.controller.ts`
- [X] T085 [P] [US3] Prueba de contrato de creación en el Gateway en
      `backend/api-gateway/test/registrations.e2e-spec.ts`
- [X] T086 [US3] Implementar la mutación `useCreateRegistration` (genera
      `Idempotency-Key`, invalida la consulta del evento) en
      `frontend/src/features/registrations/hooks.ts`
- [X] T087 [US3] Agregar el CTA de inscripción y estados de confirmación
      (éxito/error, deshabilitado si agotado o sin sesión) en
      `frontend/src/features/events/EventDetailPage.tsx`
- [X] T088 [P] [US3] E2E Playwright flujo dorado "inscribirse desde el
      detalle, ver confirmación" en
      `frontend/e2e/register-for-event.spec.ts`

**Checkpoint**: US1–US3 funcionales; flujo dorado completo hasta la
inscripción confirmada.

---

## Phase 6: User Story 4 - Cancelar inscripción y consultar mis inscripciones (Priority: P4)

**Goal**: gestión propia del ciclo de vida de la inscripción, liberando
cupos para otros usuarios.

**Independent Test**: con al menos una inscripción activa, consultar "Mis
inscripciones" y cancelarla, verificando que desaparece de las activas y
que el cupo del evento aumenta.

- [X] T089 [US4] Implementar `RegistrationsService.cancel` (verificación
      de propiedad, cancelación idempotente, bloqueo si el evento ya
      inició, llamada a `release`) en
      `backend/registration-service/src/registrations/registrations.service.ts`
- [X] T090 [US4] Implementar `DELETE /internal/registrations/:id`,
      `GET /internal/registrations`, `GET /internal/registrations/:id`
      en
      `backend/registration-service/src/registrations/registrations.controller.ts`
- [X] T091 [P] [US4] Pruebas de contrato de cancelación/listado (incl.
      rechazo por propiedad FR-020, doble cancelación idempotente) en
      `backend/registration-service/test/registrations.cancel.e2e-spec.ts`
- [X] T092 [US4] Implementar el proxy `DELETE /api/registrations/:id`,
      `GET /api/registrations/me`, `GET /api/registrations/:id` en
      `backend/api-gateway/src/registrations/registrations.controller.ts`
- [X] T093 [US4] Implementar la página Mis inscripciones
      (`/mi-cuenta/inscripciones`) con `RegistrationRow`, filtro
      Activas/Canceladas y `ConfirmDialog` en
      `frontend/src/features/registrations/MyRegistrationsPage.tsx`
- [X] T094 [US4] Implementar la página Detalle de inscripción
      (`/mi-cuenta/inscripciones/:id`) en
      `frontend/src/features/registrations/RegistrationDetailPage.tsx`
- [X] T095 [US4] Implementar la página Dashboard de usuario (`/mi-cuenta`)
      en `frontend/src/features/dashboard/UserDashboardPage.tsx`
- [X] T096 [US4] Implementar la página Perfil (`/mi-cuenta/perfil`, solo
      lectura) en `frontend/src/features/dashboard/ProfilePage.tsx`
- [X] T097 [US4] Conectar las rutas protegidas `/mi-cuenta`,
      `/mi-cuenta/inscripciones`, `/mi-cuenta/inscripciones/:id`,
      `/mi-cuenta/perfil` en `frontend/src/app/router.tsx`
- [X] T098 [P] [US4] E2E Playwright "cancelar inscripción con
      confirmación, cupo se libera" en
      `frontend/e2e/cancel-registration.spec.ts`

**Checkpoint**: ciclo completo de usuario final (US1–US4) funcional.

---

## Phase 7: User Story 5 - Administrar el catálogo de eventos (Priority: P5)

**Goal**: CRUD completo de eventos, incluida la capacidad máxima.

**Independent Test**: como administrador, crear un evento válido,
consultarlo, actualizar un campo y eliminarlo, verificando el estado del
catálogo en cada paso.

- [X] T099 [US5] Implementar `EventsService.create`/`update`/`remove`
      (validaciones V-001..V-005, BR-007, ajuste de `availableSlots` por
      delta en BR-011) en
      `backend/event-service/src/events/events.service.ts`
- [X] T100 [US5] Implementar `POST`/`PUT`/`DELETE /internal/events*` en
      `backend/event-service/src/events/events.controller.ts`
- [X] T101 [P] [US5] Pruebas de contrato CRUD admin (incl.
      `CAPACITY_BELOW_ACTIVE_REGISTRATIONS`, campos obligatorios, fecha
      pasada) en `backend/event-service/test/events.admin.e2e-spec.ts`
- [X] T102 [US5] Implementar el proxy administrativo de eventos con
      `RolesGuard('ADMIN')` en
      `backend/api-gateway/src/events/events.controller.ts`
- [X] T103 [US5] Implementar el esquema Zod de `EventForm` (espeja
      V-001..V-005) en `frontend/src/features/admin/event-form.schema.ts`
- [X] T104 [US5] Implementar el organismo `EventForm` (crear/editar
      compartido) en `frontend/src/features/admin/EventForm.tsx`
- [X] T105 [US5] Implementar el Dashboard administrativo (`/admin`) con
      tarjetas resumen y vacío de instalación nueva en
      `frontend/src/features/admin/AdminDashboardPage.tsx`
- [X] T106 [US5] Implementar Gestión de eventos (`/admin/eventos`) con
      tabla y `ConfirmDialog` de eliminación (advertencia de inscritos
      activos) en `frontend/src/features/admin/EventsListPage.tsx`
- [X] T107 [US5] Implementar Crear evento (`/admin/eventos/nuevo`) en
      `frontend/src/features/admin/CreateEventPage.tsx`
- [X] T108 [US5] Implementar Editar evento (`/admin/eventos/:id/editar`,
      precargado, maneja `CAPACITY_BELOW_ACTIVE_REGISTRATIONS`) en
      `frontend/src/features/admin/EditEventPage.tsx`
- [X] T109 [US5] Implementar Detalle del evento (vista admin,
      `/admin/eventos/:id`) en
      `frontend/src/features/admin/AdminEventDetailPage.tsx`
- [X] T110 [US5] Conectar las rutas admin (protegidas por `AdminRoute`) en
      `frontend/src/app/router.tsx`
- [X] T111 [P] [US5] E2E Playwright "crear, editar, eliminar evento con
      advertencia de inscritos" en `frontend/e2e/manage-events.spec.ts`

**Checkpoint**: administración del catálogo completamente funcional.

---

## Phase 8: User Story 6 - Consultar inscripciones y cupos como administrador (Priority: P6)

**Goal**: visibilidad administrativa de inscritos y cupos por evento.

**Independent Test**: con un evento con al menos una inscripción activa,
abrir su vista administrativa y verificar que la lista de inscritos y el
conteo de cupos coinciden con el estado real.

- [X] T112 [US6] Implementar `GET /internal/events/:eventId/registrations`
      en
      `backend/registration-service/src/registrations/registrations.controller.ts`
- [X] T113 [P] [US6] Prueba de contrato (incl. estado vacío) en
      `backend/registration-service/test/registrations.admin.e2e-spec.ts`
- [X] T114 [US6] Implementar `GET /api/events/:id/registrations` en
      `backend/api-gateway/src/events/events.controller.ts`, agregando la
      lista de `registration-service` con `GET /internal/users?ids=` de
      `user-service`
- [X] T115 [P] [US6] Prueba de contrato del endpoint de agregación en
      `backend/api-gateway/test/admin-registrations.e2e-spec.ts`
- [X] T116 [US6] Implementar el organismo `AdminRegistrationsTable` en
      `frontend/src/design-system/organisms/AdminRegistrationsTable.tsx`
- [X] T117 [US6] Implementar Gestión de inscripciones
      (`/admin/eventos/:id/inscripciones`, conteo ocupados/disponibles en
      vivo) en `frontend/src/features/admin/EventRegistrationsPage.tsx`
- [X] T118 [US6] Conectar la ruta `/admin/eventos/:id/inscripciones` en
      `frontend/src/app/router.tsx`
- [X] T119 [P] [US6] E2E Playwright "consultar inscripciones de un
      evento, ver conteo actualizado tras cancelación" en
      `frontend/e2e/admin-registrations.spec.ts`

**Checkpoint**: las 6 historias de usuario funcionan de forma
independiente y combinada.

---

## Phase 9: Polish & Despliegue en OpenShift (Cross-Cutting)

**Purpose**: cerrar accesibilidad/observabilidad, validar el contrato de
entrega y disparar la publicación real en OpenShift — el resultado que el
desarrollador pidió explícitamente ("sea como sea debe quedar la
aplicación en OpenShift y debes darme la ruta").

- [X] T120 [P] Pasada de accesibilidad (navegación por teclado, roles ARIA
      en `ConfirmDialog`/`Toast`, retorno de foco) en
      `frontend/src/design-system/` per `ux-design.md §6`
- [X] T121 [P] Logging JSON estructurado (`requestId`, `userId`, eventos
      de negocio críticos) en los 4 servicios backend per
      `research.md §18`
- [X] T122 Verificar que `.sdd/workloads.yaml` (ya completado en
      `plan.md`) no tiene deriva: `technology.runtime`/`framework` de
      cada uno de los 5 workloads coincide con el código realmente
      implementado
- [X] T123 Completar el inventario `DECLARED` en
      `docs/operations/openshift-deployment.md` (workloads, `Service`,
      `Route`, datos, identidades, flujos de red) per `plan.md §13`
- [X] T124 Ejecutar `quickstart.md` de punta a punta en local
      (`docker-compose.dev.yml` + los 5 servicios) y confirmar que el
      *smoke test* § 6 (capacidad=1, 2 usuarios, cancelación) pasa
- [X] T125 Ejecutar `conftest test -p policies/conftest` contra todos los
      manifiestos renderizados de `deploy/openshift/base` y
      `deploy/openshift/overlays/dev`; corregir cualquier `deny`
- [X] T126 Ejecutar `kustomize build deploy/openshift/overlays/dev` y
      validar que no quedan *placeholders* sin resolver salvo las
      imágenes (`IMAGE_*`, reemplazadas por el orquestador)
- [X] T127 Dejar que el hook obligatorio posterior a
      `/speckit-implement` (`sdd.deliver`) publique en `main` y supervise
      la entrega hasta que la `Route` `event-hub` responda `200` en
      `/healthz`; reportar esa URL como resultado final — sin `oc login`
      ni pasos manuales de despliegue, per `AGENTS.md`

**Checkpoint**: aplicación completa, verificada y publicada en OpenShift
con `Route` saludable.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias — puede iniciar de inmediato.
- **Foundational (Fase 2)**: depende de Setup — bloquea todas las
  historias.
- **Historias de usuario (Fase 3+)**: todas dependen de Foundational.
  - US1 (P1) no depende de ninguna otra historia.
  - US2 (P2) no depende de US1, pero comparte `frontend/src/app/router.tsx`
    (mismo archivo, no `[P]` entre US1 y US2 en esa tarea puntual).
  - US3 (P3) depende de que `Event` exista (US1, T049) y de `User`/sesión
    (US2, T064-T075) para tener un `userId` autenticado — inicia después
    de US1+US2.
  - US4 (P4) depende de US3 (opera sobre inscripciones ya creadas).
  - US5 (P5) depende de `Event` (US1, T049) pero no de US2/US3/US4 en el
    backend; en el frontend reutiliza `AdminRoute` (US2).
  - US6 (P6) depende de `Registration` (US3/US4) y de `User` (US2) para
    la agregación.
- **Polish (Fase 9)**: depende de que todas las historias deseadas estén
  completas.

### Parallel Opportunities

- Todas las tareas `[P]` de la Fase 1 (T002-T008, T010) se ejecutan en
  paralelo.
- En la Fase 2, los cuatro bloques repetidos por servicio (`ConfigModule`,
  filtro de error, `InternalTokenGuard`, salud, `Containerfile`,
  manifiestos base) son `[P]` entre sí porque tocan archivos distintos por
  servicio.
- Una vez completada la Fase 2, US1 y US5 pueden avanzar en paralelo en el
  backend (ambas dependen solo de `Event`); US2 puede avanzar en paralelo
  a ambas (dominio `User` independiente).
- Dentro de cada historia, las tareas de prueba marcadas `[P]` corren en
  paralelo a la siguiente tarea de implementación cuando no comparten
  archivo.

## Parallel Example: User Story 1

```bash
# Backend de catálogo y su prueba de contrato en paralelo con el modelo Prisma:
Task: "Definir esquema Prisma de Event en backend/event-service/prisma/schema.prisma"
Task: "Prueba de contrato de catálogo en backend/event-service/test/events.catalog.e2e-spec.ts"

# Frontend: EventCard y EventFilterBar son archivos distintos, en paralelo:
Task: "Implementar EventCard en frontend/src/design-system/organisms/EventCard.tsx"
Task: "Implementar EventFilterBar en frontend/src/features/events/EventFilterBar.tsx"
```

## Implementation Strategy

### MVP primero (User Story 1 únicamente)

1. Completar Fase 1: Setup.
2. Completar Fase 2: Foundational (bloqueante).
3. Completar Fase 3: User Story 1.
4. **DETENER y VALIDAR**: probar US1 de forma independiente
   (`frontend/e2e/discover-events.spec.ts`).
5. Continuar con US2 en cuanto el MVP esté validado.

### Entrega incremental

1. Setup + Foundational → fundación lista.
2. US1 → probar → catálogo público navegable (MVP).
3. US2 → probar → cuentas y sesión.
4. US3 → probar → flujo dorado completo (inscripción).
5. US4 → probar → ciclo de vida completo de usuario final.
6. US5 → probar → catálogo administrable.
7. US6 → probar → supervisión administrativa completa.
8. Polish (Fase 9) → accesibilidad, observabilidad, validación de
   políticas y **entrega real en OpenShift con `Route` saludable**.

### Notas

- `[P]` = archivos distintos, sin dependencias.
- `[Story]` mapea cada tarea a su historia de usuario para trazabilidad.
- Verificar que las pruebas fallan antes de implementar (T052, T054,
  T061, T068, T071, T079, T083, T085, T091, T101, T113, T115 y los E2E).
- Confirmar cada historia en su *checkpoint* antes de avanzar a la
  siguiente.
- Evitar: tareas vagas, conflictos de archivo simultáneos, dependencias
  entre historias que rompan su independencia.
