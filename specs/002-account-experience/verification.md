# Evidencia de implementación — 002-account-experience

Baseline: 50d46d2f3ec420d6e3e4b5c5baf86dfc7460cb18, main, 2026-09-07. Cambios previos: feature.json, AGENTS.md y documentos de esta feature; se conservan. Runtime local Node 22.22.2; imágenes backend Node 20 según contrato, a verificar en contenedor. Sin cambio de frameworks.

## Preparación

- Checklist requirements: 16/16 PASS documental.
- Docker no está instalado; Podman disponible con las tres bases compose saludables. Se crearon bases separadas `account_experience_test` en cada instancia; no se reutilizan tablas de users/events/registrations para suites destructivas.
- Comandos: npm run lint/build/test por workload; Gateway y user-service requieren además test:e2e; frontend Playwright separado de Vitest. DATABASE_URL de pruebas apunta exclusivamente a account_experience_test.
- Diseño: ui-ux-pro-max orienta foco, contraste, feedback y targets; se conserva ux-design.md y React web, no su landing/paleta/stack móvil genéricos.

## Matriz de aceptación

| Requisitos | Evidencia prevista | Estado |
|---|---|---|
| FR-001/002/005, SC-001 | Contratos, formatos, recuperación y boundaries | PASS local |
| FR-003/011 | Sesión A→B, 401/403, propiedad y roles | PASS local |
| FR-004/008 | Alta/lista/detalle/cancelación, cupos e invalidación | PASS local |
| FR-006/007, SC-002/003 | Colección completa y top3, acciones | PASS local |
| FR-009/010, SC-004 | Responsive/teclado/contraste | PASS local |
| FR-012/013, SC-006 | Seed repetido/concurrente y acceso local | PASS local; dev pendiente |
| FR-014 | Acceso y handoff privado desplegados | PENDING_VALIDATION |
| FR-015, SC-005/007 | Integración real, rendimiento y smoke remoto | PASS local; smoke remoto pendiente |

## Gates post-hook

## US1 — ejecución local

- Regresión previa: Gateway 10 fallos de contrato esperados (array desnudo, metadata, core y filtro). Tras presenter: 21/21 Gateway + agregación administrativa PASS.
- Frontend: build PASS; Vitest 33/33 PASS; lint sin errores, siete advertencias de Fast Refresh. Primitivas de sesión y transición real A→B/caché/401 antiguo/403/401 vigente verificadas.
- Chromium: 3/3 PASS (recuperación conservando filtro, sesión vencida y lifecycle real con PostgreSQL y los cuatro servicios). Browser de pruebas instalado porque faltaba binario.
- Event-service: 19/19 PASS; registration-service: 17/17 PASS, DATABASE_URL explícitas de bases desechables.
- No schema migration nueva ni cambios a reglas internas de cupos/cancelación. El Gateway autoriza detalle antes de proyectar y cancelación conserva autorización interna.
- Cobertura ampliada: 43 Vitest PASS, incluyendo fallo inicial de sesión recuperable, callback/toast de cancelación tardía descartado y excepción real de render atrapada preservando shell. Chromium verifica metadata inválida sin acciones inseguras, 404, atrás, cancelación fallida sin falso éxito y perfil sin nombre.

## US3 y entrega declarativa

- User-service: 23/23 Jest e2e PASS con PostgreSQL real, siete casos de bootstrap incluyendo CLI con stdout limitado a código, repetición, concurrencia y conflictos. Credenciales aleatorias en memoria, no en reportes.
- Build de imagen Node20/Alpine con OpenSSL PASS; ejecución `node dist/bootstrap/seed-admin.js` con UID 100123:0 funciona y termina con ADMIN_CONFIGURATION_REQUIRED cuando faltan entradas (fallo esperado, sin valores). Runtime incluye ejecutable compilado y Prisma; db:seed usa el ejecutable compilado.
- Corregido defecto reproducible de build incremental local: Nest eliminaba dist, pero tsbuildinfo externo omitía regenerar main.js. tsconfig.build.json de user-service desactiva incremental; build repetido vuelve a emitir entrada principal.
- Segundo init después de migrate; email/password exclusivamente secretKeyRef; credenciales seed retiradas del HTTP/ConfigMap. WorkloadSet reconciliado por inspección, sin delta de topología/tecnología ni edición innecesaria del contrato.
- Kustomize base/dev + Conftest --all-namespaces: 390 controles cada uno, 382 PASS, 8 WARN por imágenes aún sin digest, 0 fallos. Una primera invocación sin namespace ejecutó 0 controles y no se consideró validación.

## US2 y calidad visual

- Selector: colecciones 0/1/21/100, fechas inválidas/pasadas, empates y avance del reloj PASS. Dashboard calcula 14 activas/7 canceladas para fixture21 y top3 correcto.
- Chromium producción: vacío/contenido/error a 360/768/1440 PASS; capturas inspeccionadas en escritorio y móvil. Sin desbordamiento, zoom de fuente200% y reduced-motion; pruebas de targets principales ≥44px y navegación por teclado.
- Contraste calculado: principal/canvas12,70:1; secundario/surface7,27:1; terracota oscura/canvas5,29:1; oliva oscura/canvas6,17:1; secundario/surface-alt6,59:1. Botones y avatar ajustados a variantes oscuras; foco3px global.
- Lifecycle real repetido con dashboard nuevo, resumen tras cancelación y acceso ADMIN verificados localmente. No acredita handoff desplegado.
- SC-005: 80/80 aperturas locales bajo3s; metodología y muestras en performance-results.md. Fixtures HTTP para aislar navegador; la medición no sustituye smoke remoto.

## Riesgos conservados

## Regresión ampliada de formularios

La suite histórica E2E usa selectores exactos de contraseña. El asterisco obligatorio del FormField se incluía en el nombre accesible; se marcó como decorativo y se añadió aria-required al control. La primera corrida ampliada se detuvo tras confirmar esta causa para evitar repetir timeouts; se vuelve a ejecutar antes de cerrar T047.

Se separó finalmente el marcador fuera de label para conservar su texto exacto. La suite administrativa histórica además capturaba `nuevo` como eventId porque su regex de URL aceptaba la página de creación antes de finalizar la mutación; ahora espera el heading del evento creado antes de extraer el ID. No se alteró el comportamiento de creación para acomodar el test.

La continuación por UI identificó otro defecto real: event-service entrega temporalStatus `upcoming` y frontend esperaba `UPCOMING`, deshabilitando inscribirse a eventos futuros. Nueva regresión falló por esa comparación y ahora pasa con schema/adaptación de enum en el cliente. Plan actualizado; sin cambio de reglas internas. Auth + administración E2E: 5/5 PASS tras estas correcciones; Vitest: 44/44 PASS.

## Cierre local de T043/T047/T049

Corrida completa Chromium producción: **26/26 PASS**, 45,2 s, incluido catálogo, registro/login/logout, inscripción y cancelación por interfaz, administración, recuperación, dashboard responsive y 80 aperturas de rendimiento. Targets del contenido de cuenta ≥44px comprobados; contraste y capturas revisados. User-service imagen final reconstruida: main.js y seed-admin.js presentes y CLI compilado declarado, UID arbitrario100123:0 verificado.

Gateway: build/lint PASS, 5/5 unitarias y 38/38 e2e. User-service: build/lint PASS y 23/23 e2e. Frontend: build/lint sin errores, 44/44 Vitest y 26/26 Playwright. Event/registration:19/19 y17/17 e2e en bases dedicadas. Constitución SHA256 coincide con gobernanza; git diff --check PASS. No tokens/Secrets leídos o incluidos en código/documentos; valores de tests son sintéticos y los de bootstrap se generan en memoria. Los gates post-hook siguen separados y no se declaran cumplidos por estas pruebas locales.

- npm audit frontend informa 7 advisories: Vitest crítico y Vite alto son herramientas de desarrollo (runtime desplegado es Nginx estático); React Router presenta moderados. Los fixes propuestos exigen cambios mayores fuera del plan. No se ejecutó audit fix --force ni se rebajó política; escaneo de plataforma mantiene autoridad sobre promoción.
- El broker/orquestador es responsable de la capacidad privada de acceso. Disponibilidad efectiva y FR-014 siguen PENDING_VALIDATION hasta evidencia real; no se leyeron Secrets ni se inventó mecanismo de recuperación.

Commit/digests/revisión GitOps/fecha/Route/workloads: PENDING_VALIDATION.
Smoke remoto real y preservación de datos: PENDING_VALIDATION.
Login/operación ADMIN y canal privado al destinatario: PENDING_VALIDATION; no conservar valores sensibles en evidencia.
