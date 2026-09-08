# Tasks: Cuenta confiable, dashboard y administrador inicial

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/account-api.md](contracts/account-api.md), [contracts/admin-bootstrap.md](contracts/admin-bootstrap.md), [ux-design.md](ux-design.md) y [quickstart.md](quickstart.md).

**Organización**: Setup → fundamentos → US1 (P1, MVP) → US3 (P1) → US2 (P2) → validación transversal. Se conservan los números originales de las historias aunque cambie su orden por prioridad.

**Pruebas**: Requeridas por FR-015 y SC-001–007. Escribir primero las regresiones y comprobar que fallan por el defecto esperado, no por configuración. No marcar tareas verificadas sin evidencia. Rutas relativas a la raíz del repositorio; los archivos nuevos se crean donde se indica.

**Formato**: `- [ ] Tnnn [P]? [USn]? Acción y ruta`. `[P]` permite trabajo simultáneo solo dentro del grupo y después de sus prerrequisitos; no autoriza saltarse dependencias ni lanzar subagentes automáticamente.

## Fase 1: Setup

**Objetivo**: Preparar la verificación sin cambiar frameworks, datos existentes ni infraestructura compartida.

- [X] T001 Registrar baseline, comandos disponibles y matriz FR-001–015/SC-001–007 con estado inicial PENDING_VALIDATION en `specs/002-account-experience/verification.md`; preservar cambios existentes y comprobar versiones de los cinco workloads contra `.sdd/workloads.yaml` y sus lockfiles.
- [X] T002 Preparar y documentar bases locales exclusivamente desechables y configuración de pruebas en `specs/002-account-experience/quickstart.md`, usando `docker-compose.dev.yml`, DATABASE_URL explícita por servicio y ejecución separada de migraciones/seed; no imprimir secretos ni ejecutar suites destructivas contra desarrollo desplegado.

## Fase 2: Fundamentos de verificación

**Objetivo**: Disponer de fixtures fieles al servicio y un runner que distinga pruebas locales/remotas. Completar esta fase antes de las historias.

- [X] T003 [P] Crear fixtures internas de inscripción con campos Snapshot, registros válidos, metadata inválida y corrupción esencial en `backend/api-gateway/test/fixtures/registration-records.ts`, y ejemplos públicos equivalentes para frontend en `frontend/src/test/fixtures/account.ts`; cubrir 0/1/21/100 registros sin información personal real.
- [X] T004 [P] Parametrizar destino Playwright mediante BASE_URL en `frontend/playwright.config.ts`, conservar localhost por defecto, desactivar webServer solo para destino remoto y evitar capturas/traces de secretos; documentar selección de smoke no destructivo en `specs/002-account-experience/quickstart.md`.

**Checkpoint**: Los fixtures reflejan snapshots reales; los runners no dependen accidentalmente de otra base ni arrancan un frontend local al validar remoto.

## Fase 3: US1 — Cuenta e inscripciones sin bloqueos (P1, MVP)

**Objetivo**: Corregir el contrato, recuperar errores y aislar datos privados conservando filtros, permisos y cancelación.

**Prueba independiente**: Cuenta nueva y cuenta con inscripciones pueden abrir cuenta/perfil/lista/detalle por enlace directo y navegación; [] muestra vacío, envolvente corrupta muestra error recuperable, metadata inválida muestra etiquetas. Retry mantiene filtro; 401 redirige de forma segura, 403 no cierra sesión, A→B no filtra datos. Alta/cancelación confirmadas actualizan vistas y un error no simula éxito.

### Pruebas primero

- [X] T005 [P] [US1] Corregir mocks y añadir pruebas HTTP para lista `{items}`, alta, detalle y cancelación en `backend/api-gateway/test/registrations.e2e-spec.ts`; usar T003, verificar snapshots→DTO, filtro inválido 400, permisos antes de proyección, ausencia de userId público, metadata nullable y corrupción upstream 502 sin cuerpo interno ni N+1 al catálogo.
- [X] T006 [P] [US1] Añadir pruebas de Zod/cliente en `frontend/src/services/__tests__/account-contracts.test.ts` y `frontend/src/services/__tests__/api-client.test.ts`: null/array desnudo/items inválido, core y fechas de estado corruptos, metadata nullable, JSON malformado, [] válido, abort y límite de 8 s.
- [X] T007 [P] [US1] Añadir regresiones de sesión/caché y destino de retorno en `frontend/src/app/__tests__/account-session.test.tsx`: logout→login B con respuestas/mutaciones tardías de A, 401 vigente/antiguo, 403, fallo inicial de red recuperable y rechazo de from externo, barras invertidas y doble decodificación.
- [X] T008 [P] [US1] Añadir pruebas de vistas/formatos en `frontend/src/features/registrations/__tests__/account-recovery.test.tsx` y `frontend/src/design-system/__tests__/safe-account-display.test.tsx`: carga/vacío/error/contenido, nombres/fechas ausentes, retry con filtro conservado, cancelar pendiente/fallida, perfil y administración con datos parciales y boundary sin stack visible.
- [X] T009 [P] [US1] Crear aceptación de navegación y errores en `frontend/e2e/account-recovery.spec.ts`, incluyendo URLs privadas directas, atrás/adelante, inscripción ajena, 404, sesión vencida, excepción de render y recuperación sin pantalla blanca; usar intercepciones solo en los casos de fallo simulado.

### Implementación

- [X] T010 [P] [US1] Crear validador/presenter de registros internos en `backend/api-gateway/src/registrations/registration.presenter.ts`: validar campos esenciales, normalizar metadata a null y producir DTO público según `specs/002-account-experience/contracts/account-api.md`, con error controlado INVALID_UPSTREAM_RESPONSE.
- [X] T011 [P] [US1] Crear schemas Zod de cuenta, inscripción, lista y agregación administrativa en `frontend/src/services/account-schemas.ts`, separando corrupción esencial de metadata desconocida y derivando tipos públicos nullable; no convertir respuestas ausentes en colecciones vacías.
- [X] T012 [US1] Integrar presenter en `backend/api-gateway/src/registrations/registrations.service.ts` y `backend/api-gateway/src/registrations/registrations.controller.ts`, proyectando lista/alta/detalle/cancelación después de comprobar propiedad/rol sobre el registro interno; conservar idempotencia y códigos de dominio.
- [X] T013 [US1] Integrar schemas y tipos en `frontend/src/services/api-client.ts`, aceptar AbortSignal, limitar cada intento a 8 s, distinguir abort voluntario/timeout/JSON inválido y emitir errores españoles seguros; mantener cookies same-origin y distinguir 401 privado de login fallido.
- [X] T014 [US1] Implementar generación de sesión, claves privadas y limpieza/cancelación en `frontend/src/app/private-query-keys.ts`, `frontend/src/app/auth-context.tsx` y `frontend/src/app/providers.tsx`; habilitar consultas solo autenticado, ignorar resultados antiguos y ofrecer recuperación de la consulta inicial de sesión sin convertir fallo de red en logout.
- [X] T015 [US1] Corregir guards y destino de retorno en `frontend/src/app/route-guards.tsx`, `frontend/src/app/safe-return-path.ts` y `frontend/src/features/auth/LoginPage.tsx`; 401 vigente invalida sesión, 403 conserva identidad y from solo permite rutas internas validadas sin doble decodificación.
- [X] T016 [US1] Adaptar consultas y mutaciones privadas en `frontend/src/features/registrations/hooks.ts` y `frontend/src/features/admin/hooks.ts` a identidad/generación y AbortSignal, retry automático desactivado y retry manual cancelable; invalidar lista/detalle/resumen/evento solo tras éxito vigente y descartar toasts/callbacks de otra sesión.
- [X] T017 [US1] Añadir formateadores seguros en `frontend/src/design-system/account-formatters.ts` y endurecer `frontend/src/design-system/atoms/Avatar.tsx`; nombres vacíos y fechas inválidas deben producir etiquetas comprensibles, no llamadas inseguras a trim/slice/Intl.
- [X] T018 [US1] Implementar error recuperable reutilizable en `frontend/src/design-system/molecules/QueryErrorState.tsx` y estados explícitos en `frontend/src/features/registrations/MyRegistrationsPage.tsx` y `frontend/src/features/registrations/RegistrationDetailPage.tsx`; conservar filtro/confirmación, bloquear doble envío y acciones dependientes de fecha desconocida y ofrecer salida ante 403/404.
- [X] T019 [US1] Corregir acceso a items y renderizado de perfil/dashboard actuales en `frontend/src/features/dashboard/UserDashboardPage.tsx` y `frontend/src/features/dashboard/ProfilePage.tsx`, usando estados/formatos seguros sin esperar al rediseño US2 y sin mostrar cero ante datos desconocidos.
- [X] T020 [US1] Endurecer `frontend/src/features/admin/EventRegistrationsPage.tsx`, `frontend/src/features/admin/AdminDashboardPage.tsx` y `frontend/src/design-system/organisms/AdminRegistrationsTable.tsx` contra arrays/metadata/fechas inválidos; conservar agregación administrativa y acciones por rol, sin ocultar corrupción como vacío.
- [X] T021 [US1] Crear fallback seguro en `frontend/src/app/RouteErrorBoundary.tsx` y conectarlo en `frontend/src/app/router.tsx`; boundaries hijos conservan shell y secciones independientes, raíz funciona sin proveedores afectados y ninguna traza técnica se presenta al usuario.
- [X] T022 [US1] Crear recorrido real en `frontend/e2e/account-lifecycle.spec.ts`: fixture administrativa crea evento futuro, usuario se inscribe, abre cuenta/lista/detalle, cancela y comprueba resumen/cupo, con reintento/doble pulsación sin efectos duplicados y aislamiento de otra cuenta; limpiar exclusivamente fixtures identificadas.
- [X] T023 [US1] Ejecutar pruebas T005–T009/T022 y regresiones de cupos/cancelación en `backend/event-service/test/` y `backend/registration-service/test/` sobre bases desechables; registrar comandos, resultados y cobertura US1.1–8 en `specs/002-account-experience/verification.md`.
- [X] T024 [US1] Revisar y cerrar FR-001–005/008 y aislamiento de FR-003/011 en `specs/002-account-experience/verification.md`, contrastando respuestas reales Gateway con schemas frontend y confirmando que no se modificaron reglas de propiedad, cupos ni snapshots persistidos.

**Checkpoint MVP**: US1 funciona sin depender de la nueva composición visual ni del seed desplegado; la prueba local puede usar una identidad sintética ADMIN preparada de manera segura.

## Fase 4: US3 — Administrador inicial operativo (P1)

**Objetivo**: Inicialización explícita, idempotente y verificable sin sobrescribir identidades ni publicar credenciales.

**Prueba independiente**: Base desechable: creación, repetición y concurrencia dejan un solo ADMIN; perfil/hash existente intactos; USER coincidente, contraseña desalineada o configuración ausente fallan con códigos seguros. Login y operación ADMIN funcionan con acceso configurado. La entrega privada real se verifica tras el hook, no se presume a partir del seed.

### Pruebas primero

- [X] T025 [P] [US3] Crear pruebas de bootstrap en `backend/user-service/test/seed-admin.e2e-spec.ts` para creación/repetición/concurrencia P2002, unicidad, preservación de perfil/hash, USER conflictivo, password desalineada y config inválida/ausente; verificar que stdout/stderr no contienen email, contraseña ni hash.
- [X] T026 [P] [US3] Añadir escenario de acceso inicial en `frontend/e2e/admin-bootstrap.spec.ts`: credenciales inyectadas privadamente, login y creación/modificación de evento sintético, rechazo de operación por USER y limpieza solo de fixture; desactivar artefactos que capturen credenciales.

### Implementación

- [X] T027 [US3] Implementar lógica compartida en `backend/user-service/src/bootstrap/admin-bootstrap.ts`, normalizando email como autenticación, validando reglas existentes, bcrypt con coste vigente y creación ADMIN; preservar ADMIN existente verificando password, rechazar USER, resolver P2002 releyendo y emitir solo códigos del contrato sin valores sensibles.
- [X] T028 [US3] Crear CLI compilable en `backend/user-service/src/bootstrap/seed-admin.ts` y reutilizarla desde `backend/user-service/prisma/seed.ts`; finalizar conexión/exit codes correctamente y conservar `db:seed` en `backend/user-service/package.json` sin asumir seed implícito en migrate deploy.
- [X] T029 [US3] Verificar y ajustar si es necesario `backend/user-service/Containerfile` y `backend/user-service/tsconfig.build.json` para incluir `dist/bootstrap/seed-admin.js` y Prisma en runtime; probar el ejecutable con UID arbitrario, conservar OpenSSL y no incluir valores de configuración privada en capas.
- [X] T030 [US3] Añadir segundo initContainer después de migrate en `deploy/openshift/base/user-service/deployment.yaml`, misma IMAGE_USER_SERVICE y DATABASE_URL por referencia; email/password desde `user-service-seed-admin`, runAsNonRoot, sin escalada, drop ALL y recursos 100m/128Mi–500m/256Mi; retirar credenciales seed del contenedor HTTP si no son necesarias.
- [X] T031 [US3] Reconciliar referencias y tecnología real en `.sdd/workloads.yaml` y configuración seed en `deploy/openshift/base/user-service/configmap.yaml`, verificando primero la ruta real del ConfigMap; conservar cinco imágenes, tres bases y Route, sin Job/servicios/Pipelines nuevos ni identidad admin en configuración pública.
- [X] T032 [US3] Documentar bootstrap, códigos, preservación de datos, rollback y procedimiento de verificación/handoff en `docs/operations/openshift-deployment.md`; identificar la capacidad autorizada del broker/orquestador y registrar disponibilidad como PENDING_VALIDATION si no hay evidencia, sin inventar enlaces ni leer Secrets con oc.
- [X] T033 [US3] Ejecutar T025/T026 localmente y verificar dos ejecuciones más concurrencia, login y operación ADMIN con fixtures en base desechable; registrar evidencia no sensible en `specs/002-account-experience/verification.md`, sin presentar credenciales locales como acceso desplegado.
- [X] T034 [US3] Validar imagen/initContainer y separación de configuración contra `specs/002-account-experience/contracts/admin-bootstrap.md`, dejando en `specs/002-account-experience/verification.md` el gate post-entrega FR-014 explícitamente pendiente hasta acceso y canal privado reales verificados.

**Checkpoint**: Bootstrap y acceso local verificados; ningún usuario promovido ni contraseña reseteada. Este checkpoint no acredita aún credenciales entregadas al solicitante.

## Fase 5: US2 — Dashboard atractivo y útil (P2)

**Objetivo**: Composición cálida y accesible con métricas completas, próxima participación y acciones según rol.

**Prueba independiente**: 0/1/21/100 registros mixtos producen conteos exactos; top 3 solo activas futuras conocidas, orden fecha/id. Detalle en ≤2 acciones y catálogo vacío en 1. Validar teclado, 360/768/1440, zoom 200 %, reduced-motion y contraste normal ≥4,5:1; ADMIN ve acceso administrativo y USER no.

### Pruebas primero

- [X] T035 [P] [US2] Crear pruebas del selector en `frontend/src/features/dashboard/__tests__/account-summary.test.ts`: colección completa, activas pasadas incluidas en conteo, canceladas excluidas de próximas, fechas inválidas, empates fecha/id, máximo tres y cambio temporal al actualizar, sin ceros para estado desconocido.
- [X] T036 [P] [US2] Crear pruebas de composición en `frontend/src/features/dashboard/__tests__/UserDashboardPage.test.tsx`: saludo fallback, métricas, próxima participación, accesos/roles, carga/error/vacío separados, actualización tras mutación y nombre largo sin pérdida de acciones.
- [X] T037 [P] [US2] Crear aceptación visual y de teclado en `frontend/e2e/account-dashboard.spec.ts` con capturas de vacío/contenido/error a 360/768/1440, zoom 200 %, reduced-motion, foco/nombres accesibles, no overflow y presupuesto de acciones SC-003.

### Implementación

- [X] T038 [US2] Implementar selector puro en `frontend/src/features/dashboard/account-summary.ts`, recibiendo colección validada y reloj inyectable para conteos completos y próximas ordenadas fecha/id; no añadir tablas, endpoint resumen ni consultas N+1.
- [X] T039 [US2] Crear navegación de cuenta en `frontend/src/features/dashboard/AccountNavigation.tsx` y conectarla en `frontend/src/app/router.tsx` donde corresponda, conservando AppHeader/Footer, navegación lateral 208px en escritorio y enlaces con wrap en móvil, destinos activos y acceso ADMIN condicionado por rol.
- [X] T040 [US2] Crear tarjetas semánticas de métricas y próxima participación en `frontend/src/features/dashboard/AccountSummaryCards.tsx` y `frontend/src/features/dashboard/UpcomingRegistrations.tsx`; aplicar `ux-design.md`, formateadores de US1, estados desconocidos explícitos y CTA al detalle/catálogo.
- [X] T041 [US2] Componer dashboard en `frontend/src/features/dashboard/UserDashboardPage.tsx` con saludo, dos métricas, próxima destacada, hasta tres próximas y accesos Perfil/Inscripciones/Catálogo/ADMIN; consultar todos los estados, recalcular al actualizar y mantener navegación usable durante fallos de datos.
- [X] T042 [US2] Ajustar estilos del dashboard en `frontend/src/features/dashboard/AccountNavigation.tsx`, `frontend/src/features/dashboard/AccountSummaryCards.tsx`, `frontend/src/features/dashboard/UpcomingRegistrations.tsx` y `frontend/src/features/dashboard/UserDashboardPage.tsx`, reutilizando tokens de `frontend/tailwind.config.ts`: ancho 1152px, espaciado coherente, targets 44px, foco visible y colores con contraste verificado, sin fuentes ni gráficos nuevos.
- [X] T043 [US2] Ejecutar T035–T037 y revisar manualmente capturas/teclado/contraste y estados con metadata incompleta; registrar medidas y evidencias SC-002–004 en `specs/002-account-experience/verification.md` y corregir defectos dentro de los componentes de esta fase.
- [X] T044 [US2] Repetir el recorrido `frontend/e2e/account-lifecycle.spec.ts` sobre el dashboard nuevo y comprobar actualización de conteos/próximas tras alta y cancelación y accesos por rol; cerrar US2.1–6 en `specs/002-account-experience/verification.md`.

**Checkpoint**: Dashboard terminado con datos reales y experiencia responsive verificada; US1 sigue pasando.

## Fase 6: Verificación transversal y preparación de entrega

- [X] T045 [P] Añadir y ejecutar medición reproducible en `frontend/e2e/account-performance.spec.ts`: 20 aperturas por vista principal de cuenta, hasta 100 inscripciones, 10 Mbps/100 ms, al menos 19 <3 s; medir hasta contenido/vacío confirmado y comprobar error recuperable al límite de 8 s, registrando muestras sin datos privados en `specs/002-account-experience/performance-results.md`.
- [X] T046 [P] Actualizar guía local en `specs/002-account-experience/quickstart.md` y manual operativo en `docs/operations/openshift-deployment.md` con comandos realmente usados, seed explícito, suites test:e2e separadas de Jest src, fixtures seguras, rollback sin borrado y procedimiento de humo remoto.
- [X] T047 Ejecutar lint/build/tests de workloads modificados y suites de regresión frontend/backend, incluidos los tests de `backend/user-service/test/`; registrar resultados y resolver fallos atribuibles al repositorio en `specs/002-account-experience/verification.md`, sin considerar passWithNoTests como cobertura de integración.
- [X] T048 Renderizar `deploy/openshift/base/kustomization.yaml` y `deploy/openshift/overlays/dev/kustomization.yaml`, ejecutar `policies/conftest/openshift.rego` y validar `.sdd/workloads.yaml`; comprobar initContainer, recursos, UID arbitrario, red, placeholders/digests no duplicados, OpenSSL y probes existentes, ausencia de Secret/valores privados y topología intacta.
- [X] T049 Auditar cambios y artefactos contra `specs/002-account-experience/spec.md` y `specs/002-account-experience/plan.md`; completar en `specs/002-account-experience/verification.md` trazabilidad FR/SC, resultados locales, riesgos y gates remotos pendientes, revisando que logs/capturas/reportes no filtren credenciales.
- [X] T050 Preparar aceptación post-entrega en `specs/002-account-experience/verification.md` con secciones para commit/digests/revisión GitOps/fecha/Route, workloads saludables, recorrido remoto real SC-007 y handoff FR-014; comprobar que `tools/sdd-deliver.sh` y `.specify/extensions.yml` conservan el hook obligatorio sin rebajar controles ni afirmar resultados remotos todavía.

## Entrega obligatoria después de implementar

No es una fase opcional ni queda satisfecha al marcar T050. Los checkboxes anteriores representan trabajo de implementación/preparación; la aceptación desplegada se registra después del hook para no declarar resultados futuros ni crear una dependencia circular con preflight.

Al terminar `speckit-implement`, usar la skill `sdd-deliver` y ejecutar el hook `sdd.deliver` obligatorio: validar, publicar y observar la entrega administrada en esta misma sesión. Seguir sus instrucciones vigentes; no desplegar con oc/kubectl, modificar plataforma ni pedir credenciales de clúster. Ante fallo, solo cambiar repositorio con evidencia de defecto propio; reintentos de infraestructura corresponden al orquestador.

| Gate post-hook | Evidencia requerida en verification.md | Estado inicial |
|---|---|---|
| Entrega administrada | Commit, digests, revisión GitOps, fecha, todos los workloads requeridos, Route y salud | PENDING_VALIDATION |
| SC-007 | Smoke remoto de cuenta nueva, alta, dashboard/lista/detalle, cancelación y operación ADMIN; datos previos preservados | PENDING_VALIDATION |
| FR-014 / SC-006 desplegado | Login ADMIN y operación autorizada comprobados; entrega al destinatario mediante canal privado aprobado, sin valores en evidencia | PENDING_VALIDATION |

Si falta el canal privado o la contraseña configurada no autentica, no declarar feature completa, no resetear ni promocionar usuarios y no inventar un enlace de recuperación. Registrar el bloqueo operativo con evidencia no sensible y propietario/capacidad autorizada conforme a gobernanza. Una Route saludable por sí sola no cierra estos gates.

## Dependencias y orden de ejecución

```text
T001 → T002 → [T003 || T004] → fundamentos completos
  ├─ US1: T005–T009 → [T010 || T011] → T012–T024 → US2: T035–T044
  └─ US3: [T025 || T026] → T027–T034
US1 + US3 + US2 → [T045 || T046] → T047–T050 → hook → gates remotos
```

- Orden secuencial recomendado: US1 → US3 → US2 (P1 antes de P2).
- US3 no depende del rediseño ni del presenter de US1; puede avanzar tras fundamentos. Sus fixtures locales de acceso no requieren el seed del clúster.
- US2 integra US1: esperar T024 antes de cambiar dashboard/router. Sus pruebas de selector pueden diseñarse anticipadamente, pero no se considera la historia integrada hasta US1.
- T010/T011 esperan regresiones T005–T009; T012 consume T010, T013 consume T011; sesión T014 consume cliente T013; hooks T016 consumen T014/T015; vistas T018–T021 consumen tipos/hooks/formatos. T022–T024 esperan toda implementación US1.
- T027 espera T025/T026; T028 depende de T027; T029–T031 verifican sucesivamente empaquetado, init y contrato; T033 espera runner/configuración y T027–T032.
- T038–T042 esperan T035–T037; composición T041 depende de selector/componentes/navegación; estilos T042 y aceptación T043/T044 son posteriores.
- No editar en paralelo `api-client.ts`, router, dashboard, quickstart o verification desde tareas distintas. La evidencia se consolida secuencialmente; pruebas y código solo pasan a verde después de observar el fallo esperado.

## Ejemplos de paralelismo

- Setup/fundamentos: T003 (fixtures) y T004 (runner) después de T002.
- US1: T005 (Gateway), T006 (cliente), T007 (sesión), T008 (vistas) y T009 (E2E) en archivos separados; después, T010 (presenter) y T011 (schemas).
- US3: T025 (DB/seed) y T026 (aceptación navegador) después de fundamentos. Desarrollo de bootstrap puede convivir con US1, sin escribir simultáneamente el reporte compartido.
- US2: T035 (selector), T036 (componentes) y T037 (aceptación responsive) tras US1 y antes de implementación visual.
- Final: T045 (medición) y T046 (documentación); los resultados se integran en T047–T050.

## Estrategia y trazabilidad

1. MVP: fases 1–3 (T001–T024) corrigen el bloqueo real y permiten validar US1 sin depender del rediseño.
2. Añadir US3 y validar bootstrap local seguro; mantener acceso/handoff desplegado explícitamente pendiente.
3. Añadir US2 sobre contratos y sesiones ya fiables; verificar estética, accesibilidad y datos completos.
4. Ejecutar validación transversal y hook obligatorio, luego cerrar gates remotos con evidencia. El alcance completo solicitado incluye las tres historias, no solo el MVP.

| Requisitos | Tareas principales |
|---|---|
| FR-001/002/005, SC-001 | T005–T013, T017–T024 |
| FR-003/011 | T007, T014–T016, T020, T022–T024, T026, T036, T039, T044 |
| FR-004/008 | T005, T012, T016, T018, T022–T024, T044 |
| FR-006/007, SC-002/003 | T035–T041, T043–T044 |
| FR-009/010, SC-004 | T036–T037, T039–T043 |
| FR-012/013, SC-006 local | T025–T034 |
| FR-014, SC-006 desplegado | T026, T032–T034, T050 + gate privado post-hook |
| FR-015, SC-005/007 | T022–T024, T033, T043–T050 + smoke remoto post-hook |

**Inventario**: 50 tareas; 20 US1, 10 US3, 10 US2 y 10 compartidas. 16 tareas `[P]`. Todos los checkboxes comienzan pendientes: generar este documento no implementa código, crea credenciales ni despliega la feature.
