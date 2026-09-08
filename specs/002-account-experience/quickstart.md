# Validación después de implementar

Esta guía describe pruebas futuras, no resultados aprobados. Desde raíz, usar Node/npm de lockfiles, Docker Compose, bases exclusivamente desechables y Chromium Playwright. npm ci en cada workload. No credenciales del clúster en pruebas locales.

## Preparación

En este entorno usar `podman-compose` en lugar de `docker compose`. Para suites destructivas se crearon bases aisladas `account_experience_test` en cada instancia PostgreSQL: sustituir users/events/registrations por ese nombre en DATABASE_URL (conservar puertos 5432/5433/5434). Las bases principales existentes no son desechables y no se limpian.

Playwright acepta BASE_URL para destino remoto y no arranca webServer en ese caso. Seleccionar únicamente smoke autorizado; no ejecutar suites con limpieza global. Trace/video/screenshot automáticos deshabilitados para no capturar secretos; capturas visuales explícitas solo sobre fixtures sin credenciales.

`docker compose -f docker-compose.dev.yml up -d` crea PostgreSQL en5432/5433/5434. Cargar configuración privada local según .env.example de cada servicio. Defaults de tests de eventos/inscripciones usan otros puertos/bases: DATABASE_URL explícita es obligatoria para coherencia con compose.

```bash
DATABASE_URL='postgresql://dev:dev@localhost:5432/users?schema=public' npm --prefix backend/user-service run prisma:migrate:deploy
DATABASE_URL='postgresql://dev:dev@localhost:5433/events?schema=public' npm --prefix backend/event-service run prisma:migrate:deploy
DATABASE_URL='postgresql://dev:dev@localhost:5434/registrations?schema=public' npm --prefix backend/registration-service run prisma:migrate:deploy
```

Estos son valores solo del compose de prueba. Migrate deploy NO ejecuta seed. Con DATABASE_URL y SEED_ADMIN_EMAIL/PASSWORD locales cargados por canal privado ejecutar `npm --prefix backend/user-service run db:seed`, repetir y verificar identidad única sin cambio de hash.

Ejecutar primero `npm --prefix backend/user-service run build`: db:seed llama al ejecutable compilado `dist/bootstrap/seed-admin.js`, también presente en la imagen. La configuración privada no tiene valores de respaldo.

Runner integrado reproducible: compilar los cuatro backends y frontend; ejecutar `node tools/run-account-test-stack.mjs account-recovery.spec.ts account-lifecycle.spec.ts admin-bootstrap.spec.ts account-dashboard.spec.ts --workers=1`. El runner usa las bases account_experience_test, crea credenciales aleatorias solo en memoria, ejecuta bootstrap dos veces, arranca los servicios y sirve build de producción; al finalizar detiene sus procesos y elimina su identidad administrativa sintética. No ejecutarlo mientras suites destructivas estén usando esas mismas bases.

User-service usa test/env.setup.ts para configurar tokens efímeros antes de importar AppModule. No usar defaults tardíos de beforeAll. El runner requiere Chromium instalado (`npx --prefix frontend playwright install chromium`).

En terminales separadas ejecutar npm run start:dev para user/event/registration con PORT3001/3002/3003 y DATABASE_URL correspondiente; Gateway PORT8080 con URLs de esos servicios; registration apunta a event3002. JWT/internal token de prueba coherentes entre participantes. Frontend npm run dev en5173 con proxy existente. Nunca imprimir esos valores.

## Comandos de validación

```bash
npm --prefix backend/api-gateway run lint
npm --prefix backend/api-gateway run build
npm --prefix backend/api-gateway run test:e2e -- --runInBand
npm --prefix backend/user-service run lint
npm --prefix backend/user-service run build
DATABASE_URL='postgresql://dev:dev@localhost:5432/users?schema=public' npm --prefix backend/user-service run test:e2e -- --runInBand
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix frontend test
npm --prefix frontend run test:e2e
```

Jest src no sustituye suites test/. Conservar concurrencia/cancelación event/registration con DATABASE_URL explícita. Nuevos tests seed usan bases desechables, sin consola sensible.

## Casos

1. Nueva cuenta: login, cuenta/lista/perfil, vacío sin excepción.
2. 21 y100 registros mixtos: conteos completos, top3 futuro, detalle y propiedad.
3. Stack real: ADMIN crea evento sintético; usuario se inscribe, consulta cuenta/lista/detalle, cancela y ve resumen actualizado. Limpiar solo fixture identificada.
4. Interceptación en tests: items ausente/null/tipo inválido→error; []→vacío; metadata inválida→fallback.
5. A→logout→B con respuesta tardía: sin datos/toasts de A. 401 vigente→login,403 conserva sesión; from externo rechazado.
6. Excepción de render→fallback sin traza; retry conserva filtro.
7. Seed nuevo/repetido/concurrente/conflicto USER/password/configuración según contrato.
8. Capturas/teclado de ux-design; 20 aperturas por vista con100 registros y red10Mbps/100ms para SC-005.

## Entrega

Durante implementación parametrizar Playwright con BASE_URL y omitir webServer cuando remoto; localhost es default. Orquestador ejecuta smoke remoto autorizado y facilita fixtures/acceso privado. No suites destructivas contra datos existentes.

Render Kustomize base/dev, Conftest, ausencia de secretos y digests duplicados; preservar OpenSSL/probes. Tras tareas completas: sdd-deliver.sh preflight→publish→watch. Evidencia: workloads, Route, recorridos reales y handoff privado. /healthz solo no acredita cuenta ni ADMIN.
