# Phase 0 Research: Event Hub

**Feature**: `001-event-hub-management` | **Input**: preferencias tecnológicas del desarrollador (React/TS/Vite, Node/TS/NestJS, PostgreSQL, Docker, OpenShift, Tekton, Argo CD) suministradas explícitamente en `plan`.

Todas las decisiones de esta sección tienen procedencia `INFERRED` (derivada de la
especificación + restricciones explícitas del desarrollador) salvo que se
indique lo contrario. No quedan `NEEDS CLARIFICATION` pendientes: el
desarrollador fijó el stack completo en el prompt de `plan`.

## 1. Backend: runtime y framework

- **Decision**: Node.js 20 (LTS) + TypeScript + NestJS para los cuatro
  servicios backend (`api-gateway`, `user-service`, `event-service`,
  `registration-service`).
- **Rationale**: restricción explícita del desarrollador. NestJS aporta
  módulos, guards, pipes de validación (`class-validator`) e interceptores
  listos para usar, lo que reduce código repetido de manejo de errores y
  validación entre los cuatro servicios.
- **Alternatives considered**: Express/Fastify puros (rechazado: exige
  reconstruir manualmente DI, validación y estructura modular sin beneficio
  frente al requisito explícito de NestJS).

## 2. Patrón de API Gateway

- **Decision**: el API Gateway es una aplicación NestJS propia (no un
  proxy de terceros como Kong/NGINX-gateway) que expone `/api/*`, valida
  autenticación/rol, reenvía a los servicios internos mediante `HttpModule`
  (axios) y agrega respuestas cuando una vista lo requiere (p. ej. panel de
  inscripciones de administrador, que combina datos de `registration-service`
  y `user-service`).
- **Rationale**: mantiene una única tecnología (NestJS) en todo el backend,
  reduce piezas de infraestructura adicionales y permite lógica de
  composición/errores centralizada sin operador ni componente extra.
- **Alternatives considered**: gateway declarativo (Kong/Ambassador) —
  rechazado por introducir un componente de plataforma adicional no
  justificado por el alcance; API Gateway "tonto" de solo *reverse proxy* sin
  agregación — rechazado porque el panel de administración (US6) necesita
  combinar datos de dos dominios y hacerlo en el cliente filtraría datos de
  usuario innecesarios al navegador.

## 3. Comunicación entre servicios

- **Decision**: REST síncrono sobre HTTP interno (ClusterIP `Service`) para
  toda comunicación gateway→servicio y para la única llamada
  servicio→servicio necesaria (`registration-service` → `event-service` para
  reservar/liberar cupo). Sin broker de mensajería.
- **Rationale**: todas las capacidades del dominio son transaccionales
  síncronas (ver "Perfil de ejecución" en `spec.md`); no existe
  procesamiento asíncrono, por lotes ni programado que justifique una cola.
  Introducir Kafka/Redis violaría el principio de simplicidad y la
  restricción explícita del desarrollador.
- **Alternatives considered**: eventos de dominio vía broker (Kafka/NATS) —
  rechazado, sin caso de uso asíncrono real; llamada directa a la base de
  datos del otro servicio — prohibido explícitamente por la especificación.

## 4. Consistencia de cupos bajo concurrencia (BR-004, BR-010, SC-004)

- **Decision**: `event-service` es la única fuente de verdad de
  `available_slots` y expone `POST /internal/events/:id/reserve` y
  `POST /internal/events/:id/release`. `reserve` ejecuta una única
  sentencia SQL atómica:
  `UPDATE events SET available_slots = available_slots - 1 WHERE id = $1 AND available_slots > 0 AND starts_at > now() RETURNING available_slots`.
  PostgreSQL serializa las actualizaciones concurrentes sobre la misma fila
  (bloqueo de fila implícito de `UPDATE`), por lo que dos solicitudes
  simultáneas para el último cupo nunca pueden reducir el contador por debajo
  de cero: la segunda sentencia ve `available_slots = 0` y afecta 0 filas.
  `registration-service` solo crea el registro de inscripción **después**
  de que `reserve` confirme éxito, y compensa con `release` si el paso
  posterior falla (patrón *reserve-then-confirm* con compensación, sin
  transacción distribuida). Ver `data-model.md` y
  `contracts/registration-service.md` para el flujo completo.
- **Rationale**: cumple SC-004 (100 intentos concurrentes nunca exceden la
  capacidad) sin introducir Redis, locks distribuidos ni un operador
  adicional. La ventana de inconsistencia posible (reserva exitosa seguida de
  fallo irreversible al crear el registro y al compensar) es rara,
  autorecuperable por reintento, y se documenta como riesgo aceptado en
  `plan.md` § Riesgos.
- **Alternatives considered**: bloqueo optimista con columna `version` y
  reintento en el cliente — más código y no aporta ninguna garantía adicional
  frente al `UPDATE ... WHERE` condicional; caché distribuida (Redis) para
  contadores — introduce infraestructura no justificada por el volumen del
  dominio; transacción distribuida (2PC) entre bases de datos separadas —
  innecesariamente compleja y contraria a "cada microservicio responsable de
  sus propios datos".

## 5. Idempotencia de escrituras críticas

- **Decision**: las inscripciones se crean con una cabecera
  `Idempotency-Key` (UUID generado por el cliente) que `registration-service`
  persiste en una tabla `idempotency_keys` propia (clave, resultado, estado).
  Un reintento con la misma clave devuelve el resultado ya calculado sin
  volver a llamar a `event-service` ni crear una segunda fila.
- **Rationale**: cubre explícitamente el caso límite "el usuario pierde la
  conexión justo después de confirmar" (spec.md, Edge Cases) sin necesitar
  deduplicación en el cliente ni un almacén externo.
- **Alternatives considered**: deduplicación solo por restricción única
  `(user_id, event_id)` — cubre el duplicado de negocio (BR-001) pero no un
  reintento de red del mismo intento, que podría generar una liberación de
  cupo espuria si se interpreta como una segunda solicitud independiente.

## 6. Autenticación y sesión

- **Decision**: JWT firmado con HMAC-SHA256 (secreto compartido en el
  `Secret` `jwt-signing-key`). `user-service` valida credenciales (bcrypt)
  y emite `accessToken` (TTL corto, 30 min) y `refreshToken` (TTL 7 días).
  El API Gateway transforma esos tokens en cookies `httpOnly`, `Secure`,
  `SameSite=Lax` (`access_token`, `refresh_token`) antes de responder al
  navegador; el resto de servicios internos confían en las cabeceras
  `X-User-Id` / `X-User-Role` que el Gateway agrega tras verificar el JWT
  (y elimina de cualquier solicitud entrante para evitar suplantación).
- **Rationale**: sin estado de sesión en base de datos ni Redis (JWT
  autocontenido); cookies `httpOnly` evitan exposición del token a JavaScript
  (XSS) frente a `localStorage`; TTL corto + rotación de refresh cumple
  NFR-015 sin lista de revocación.
- **Alternatives considered**: sesiones de servidor con almacén compartido —
  requiere Redis/DB de sesión adicional; JWT en `localStorage` — más simple
  pero expuesto a robo vía XSS; RS256 con par de claves — añade gestión de
  claves sin beneficio en un sistema de un solo emisor/verificador interno.

## 7. Defensa en profundidad entre servicios internos

- **Decision**: además de `NetworkPolicy` que restringe qué Pods pueden
  llamar a cada servicio, cada servicio interno exige una cabecera
  `X-Internal-Token` que coincide con el `Secret` `internal-service-token`
  compartido únicamente entre Gateway, `registration-service` y los
  servicios que reciben sus llamadas.
- **Rationale**: si una `NetworkPolicy` se configura incorrectamente, un Pod
  arbitrario del namespace no puede invocar los endpoints internos sin el
  token. Costo de implementación mínimo (un `Guard` de NestJS).
- **Alternatives considered**: mTLS entre servicios — requiere gestión de
  certificados y no está justificado por el alcance; confiar únicamente en
  `NetworkPolicy` — rechazado por no dar defensa en profundidad.

## 8. Acceso a datos (ORM)

- **Decision**: Prisma ORM en los tres servicios con base de datos propia
  (`user-service`, `event-service`, `registration-service`), con
  migraciones versionadas (`prisma/migrations`) y `$transaction` /
  `$executeRaw` para la actualización atómica de cupos.
- **Rationale**: migraciones declarativas y auditable por commit (requisito
  de la constitución: "las migraciones DEBEN ser controladas, observables"),
  tipado fuerte generado desde el esquema, y soporte directo de SQL crudo
  para la sentencia condicional de reserva de cupos.
- **Alternatives considered**: TypeORM (integración `@nestjs/typeorm` muy
  extendida, pero migraciones basadas en decoradores son más difíciles de
  auditar); `pg` crudo con *query builder* manual — más control pero repite
  código de validación de esquema en los tres servicios.

## 9. Frontend: build y lenguaje

- **Decision**: React 18 + TypeScript + Vite (restricción explícita).
- **Rationale**: Vite ofrece arranque e HMR rápidos y build de producción
  optimizado sin configuración adicional; compatible con el runtime
  `static` declarado en `.sdd/workloads.yaml` (build produce archivos
  estáticos servidos por Nginx).

## 10. Gestión de estado del frontend

- **Decision**: TanStack Query (`@tanstack/react-query`) para todo el estado
  de servidor (catálogo, detalle, inscripciones), con invalidación/optimismo
  al inscribirse o cancelar; `React Context` ligero solo para sesión de
  usuario (id, nombre, rol) y notificaciones (*toasts*). Sin Redux.
- **Rationale**: la mayor parte del estado de la aplicación es "datos del
  servidor" (eventos, inscripciones); React Query resuelve caché,
  reintentos, estados de carga/error y revalidación sin lógica manual
  repetida en cada pantalla. Redux añadiría *boilerplate* sin necesidad real
  (no hay estado cliente complejo compartido fuera de la sesión).
- **Alternatives considered**: Redux Toolkit + RTK Query — capacidad
  equivalente con más código ceremonial; Zustand global para todo — mezclaría
  estado de servidor y de UI sin las ventajas de caché/invalidación de React
  Query.

## 11. Sistema de diseño y estilos

- **Decision**: Tailwind CSS v3, configurado con los tokens de color,
  tipografía, radios y sombras bohemios definidos en `ux-design.md`
  (paleta tierra/terracota/oliva), más un pequeño set de componentes base
  (`Button`, `Card`, `Badge`, `Input`, `Modal`, `Toast`) en
  `frontend/src/design-system/`.
- **Rationale**: Tailwind acelera la aplicación consistente de la escala de
  espaciado/radio/color en 16 pantallas sin escribir CSS a mano por
  componente; la identidad visual "no genérica" depende de tipografía,
  imágenes, composición editorial y contenido — no del framework de
  utilidades usado para maquetar. Se configura `tailwind.config.ts` con la
  paleta exacta para evitar cualquier apariencia "Bootstrap por defecto".
- **Alternatives considered**: CSS Modules puro — más control pero más
  lento para mantener consistencia en 16 pantallas; styled-components /
  vanilla-extract — añade una capa de *runtime* o *build* adicional sin
  beneficio claro sobre Tailwind + tokens para este alcance.

## 12. Formularios y validación

- **Decision**: React Hook Form + Zod, con esquemas Zod que reflejan
  exactamente las validaciones V-001…V-009 del lado servidor (duplicadas de
  forma intencional en el cliente para feedback inmediato por campo,
  NFR-005), y el error 400 del backend como fuente de verdad final.
- **Rationale**: validación campo a campo sin recargas, mínima repetición de
  código (esquema Zod reutilizable entre formularios de evento
  crear/editar), y tipado TypeScript inferido automáticamente del esquema.

## 13. Enrutamiento y guardas de acceso

- **Decision**: React Router v6 (`createBrowserRouter`), con un
  `ProtectedRoute` (requiere sesión) y un `AdminRoute` (requiere rol
  `ADMIN`) que redirigen a `/login?from=<ruta>` conservando la intención
  original (edge case de sesión expirada / acceso directo sin permisos).

## 14. Estrategia de pruebas

- **Decision**:
  - Backend: Jest (unitarias de servicios/guards con repositorios
    simulados) + Supertest (`@nestjs/testing` + servidor HTTP en memoria)
    para pruebas de contrato por endpoint; una base PostgreSQL efímera vía
    `docker-compose.test.yml` para pruebas de integración que ejercitan el
    flujo de reserva/liberación de cupos con concurrencia real (N
    solicitudes paralelas con `Promise.all`).
  - Frontend: Vitest + React Testing Library para componentes y hooks;
    Playwright para E2E del flujo dorado (explorar → detalle → login →
    inscribirse → confirmación → "mis inscripciones") y de los flujos
    administrativos críticos (crear evento, eliminar con inscripciones
    activas).
  - Contratos: los DTOs de NestJS (`class-validator`) mas `@nestjs/swagger`
    generan un OpenAPI por servicio; se compara contra `contracts/*.md` en
    el paso `inspect` del pipeline para detectar deriva.
- **Rationale**: cubre unitario, integración y E2E sin herramientas
  adicionales de infraestructura; la prueba de concurrencia real en
  `event-service` es la evidencia directa de SC-004.

## 15. Topología de base de datos por servicio

- **Decision**: tres `StatefulSet` de PostgreSQL 16 independientes
  (`db-users`, `db-events`, `db-registrations`), cada uno con su propio
  `PersistentVolumeClaim` y credenciales (`Secret` dedicado), en vez de una
  única instancia compartida con tres esquemas.
- **Rationale**: hace cumplir en tiempo de ejecución (no solo por
  convención de código) la regla "ningún microservicio debe acceder
  directamente a la base de datos de otro": cada servicio recibe
  credenciales que físicamente no pueden alcanzar las otras bases. También
  preserva la desplegabilidad/prueba independiente de cada microservicio
  (se puede reiniciar o migrar `db-events` sin tocar `db-users`).
- **Alternatives considered**: una instancia compartida con tres bases
  lógicas y roles con `GRANT` restringido — más barata en recursos, pero
  acopla el ciclo de vida de las tres bases a una sola instancia y depende
  de la disciplina de permisos en lugar de un límite físico; se documenta
  como *trade-off* en `plan.md` § Complexity Tracking porque consume más
  recursos del clúster en `dev`.

## 16. Punto de entrada externo único

- **Decision**: una sola `Route` de OpenShift (`event-hub`, ya declarada en
  `.sdd/workloads.yaml`) apunta al `Service` de `frontend`. El contenedor
  Nginx del frontend sirve los archivos estáticos del build de Vite y
  reenvía (`proxy_pass`) todo lo que llega a `/api/*` hacia el `Service`
  interno `api-gateway` (sin `Route` propia). `api-gateway`, `user-service`,
  `event-service` y `registration-service` nunca reciben tráfico externo
  directo.
- **Rationale**: satisface literalmente "API Gateway como único punto de
  entrada para el frontend" y "el frontend nunca debe... depender de
  endpoints internos" sin necesitar dos `Route` públicas ni CORS (todo es
  same-origin desde el navegador), y encaja con el contrato de
  `.sdd/workloads.yaml`, que solo admite un `routeName`.
- **Alternatives considered**: `Route` separada para el Gateway con CORS
  habilitado en el frontend — funciona, pero introduce configuración CORS
  y un segundo punto de entrada público sin necesidad real.

## 17. Modelo de entrega en OpenShift

- **Decision**: el repositorio se limita a declarar `.sdd/workloads.yaml`,
  `Containerfile` por workload y manifiestos Kustomize
  (`deploy/openshift/base` + `overlays/dev`) con *placeholders* de imagen.
  No se generan `PipelineRun`, `Pipeline`, `Trigger` ni `Application`
  Argo CD en este repositorio: el perfil de plataforma declara
  `delivery.mode: orchestrated`, por lo que el SDD Orchestrator construye,
  publica por digest y reconcilia GitOps usando ese contrato.
- **Rationale**: obligación explícita de `docs/development/workloads.md` y
  de la constitución § III.7; evita un plano de entrega duplicado.

## 18. Observabilidad

- **Decision**: logging estructurado JSON (Nest `Logger` con formato JSON
  vía `nestjs-pino` o interceptor propio) en los cuatro servicios backend,
  incluyendo `requestId`, `userId` (si autenticado) y resultado de negocio
  en operaciones críticas (inscripción creada/rechazada, cancelación,
  intento administrativo sin permisos). Métricas vía el endpoint de salud y
  contadores simples expuestos como logs estructurados agregables por la
  plataforma (sin Prometheus/Grafana propios: se apoya en las herramientas
  ya publicadas por el perfil de OpenShift).
- **Rationale**: cumple "Observabilidad funcional" de `spec.md` sin añadir
  un stack de métricas propio no solicitado.

## 19. Cuenta administradora inicial

- **Decision**: `user-service` ejecuta, en el arranque de su migración, un
  *seed* idempotente que crea (si no existe) una cuenta `ADMIN` a partir de
  `SEED_ADMIN_EMAIL` (ConfigMap) y `SEED_ADMIN_PASSWORD` (Secret
  `user-service-seed-admin`).
- **Rationale**: la especificación excluye explícitamente la gestión de
  cuentas de otros usuarios por administradores, por lo que no existe un
  flujo en producto para promover el primer administrador. Un *seed*
  idempotente permite ejecutar el *smoke test* (crear evento, inscribir,
  rechazar por cupo, cancelar) sin intervención manual en la base de datos.
  Procedencia: `DEFAULTED`.

## 20. Extensión aditiva del modelo de datos para UX (categoría e imagen)

- **Decision**: `Event` incorpora dos campos opcionales no exigidos por
  `spec.md`: `category` (enum cerrado: `music`, `art`, `food`, `community`,
  `workshop`, `other`) e `imageUrl` (URL opcional; si se omite, el frontend
  usa una ilustración de reemplazo por categoría).
- **Rationale**: el propio prompt de `plan` exige que la tarjeta de evento
  muestre categoría e imagen. Ninguna regla de negocio (BR-001…BR-011) ni
  requisito funcional depende de estos campos; son aditivos, opcionales y
  reversibles, por lo que no requieren `BUSINESS_INPUT_REQUIRED`. Procedencia:
  `INFERRED` (a partir del requisito de UX explícito en la entrada de `plan`).

## 21. Estado temporal visual del evento

- **Decision**: el estado "próximo/en curso/finalizado" que pide
  `spec.md` en `Key Entities` es puramente derivado y cosmético (no
  gobierna ninguna regla de negocio, que solo compara `startsAt` contra
  `now()` per BR-007/BR-008). Se calcula como: `upcoming` si
  `now < startsAt`; `ongoing` si `startsAt <= now < startsAt + 3h`;
  `finished` si `now >= startsAt + 3h`. Las 3 horas son una duración por
  defecto configurable (`DEFAULT_EVENT_DURATION_HOURS`), no un campo que el
  administrador captura.
- **Rationale**: `spec.md` no define una hora de fin de evento; inventar un
  campo obligatorio adicional violaría "no fabricar requisitos". Un valor
  por defecto documentado y reversible resuelve la necesidad de UX sin
  tocar reglas de negocio. Procedencia: `DEFAULTED`.
