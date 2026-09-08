# Quickstart: Event Hub

Guía de validación local, independiente del clúster (constitución §
`specify/clarify/plan/tasks` deben ejecutarse sin `oc` ni conectividad a
OpenShift). Sirve para comprobar que la implementación cumple el
*smoke test* funcional descrito en `spec.md`.

## Prerrequisitos

- Node.js 20.x, npm 10.x
- Docker + Docker Compose v2
- Puertos libres en `localhost`: `5173` (frontend dev), `8080` (gateway),
  `3001`–`3003` (user/event/registration en desarrollo), `5432`–`5434`
  (Postgres × 3)

## 1. Levantar dependencias e infraestructura local

```bash
docker compose -f docker-compose.dev.yml up -d db-users db-events db-registrations
```

Cada base se crea vacía; las migraciones Prisma de cada servicio la
inicializan en el paso siguiente.

## 2. Instalar y migrar cada servicio (independiente entre sí)

```bash
for svc in user-service event-service registration-service api-gateway; do
  (cd backend/$svc && npm install)
done

(cd backend/user-service && npx prisma migrate deploy)          # crea User + seed admin
(cd backend/event-service && npx prisma migrate deploy)         # crea Event
(cd backend/registration-service && npx prisma migrate deploy)  # crea Registration + IdempotencyKey
```

`user-service` crea automáticamente la cuenta `ADMIN` a partir de
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (ver `.env.example` de cada
servicio) — necesaria para el *smoke test* de administración.

## 3. Ejecutar los cuatro servicios backend

```bash
(cd backend/user-service && npm run start:dev) &
(cd backend/event-service && npm run start:dev) &
(cd backend/registration-service && npm run start:dev) &
(cd backend/api-gateway && npm run start:dev) &
```

Verificar salud:

```bash
curl -sf localhost:3001/internal/healthz  # user-service
curl -sf localhost:3002/internal/healthz  # event-service
curl -sf localhost:3003/internal/healthz  # registration-service
curl -sf localhost:8080/healthz           # api-gateway
```

## 4. Ejecutar el frontend

```bash
(cd frontend && npm install && npm run dev)
```

Abrir `http://localhost:5173`. En desarrollo, Vite proxya `/api/*` hacia
`http://localhost:8080` (equivalente al `proxy_pass` de Nginx en
producción — ver `plan.md` § Frontend Architecture).

## 5. Pruebas automatizadas

```bash
# Backend: unitarias + integración (incluye la prueba de concurrencia de reserve)
for svc in user-service event-service registration-service api-gateway; do
  (cd backend/$svc && npm test)
done

# Frontend: componentes + hooks
(cd frontend && npm run test)

# E2E del flujo dorado (requiere el stack completo corriendo, pasos 1-4)
(cd frontend && npm run test:e2e)
```

## 6. Smoke test funcional manual (equivalente al descrito en `spec.md`)

Capacidad de prueba = 1, dos usuarios, valida BR-001, BR-002, BR-004,
SC-004 de punta a punta vía el Gateway (puerto `8080`):

```bash
# 6.1 Login como admin (usa las credenciales del seed)
ADMIN_COOKIE=$(curl -s -c - -X POST localhost:8080/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@event-hub.local","password":"<SEED_ADMIN_PASSWORD>"}' | grep access_token)

# 6.2 Crear evento con capacidad máxima 1
EVENT_ID=$(curl -s -X POST localhost:8080/api/events \
  -H 'content-type: application/json' -b "$ADMIN_COOKIE" \
  -d '{"name":"Taller de cerámica","description":"Prueba de humo","startsAt":"2099-01-01T18:00:00Z","location":"Taller Central","maxCapacity":1}' \
  | jq -r .id)

# 6.3 Registrar y loguear a dos usuarios de prueba (usuario1, usuario2) vía /api/auth/register + /api/auth/login

# 6.4 Usuario 1 se inscribe -> 201
curl -s -X POST localhost:8080/api/events/$EVENT_ID/registrations -b "$USER1_COOKIE" -i | head -1

# 6.5 Usuario 2 intenta inscribirse -> 409 CAPACITY_EXCEEDED (sin cupo)
curl -s -X POST localhost:8080/api/events/$EVENT_ID/registrations -b "$USER2_COOKIE" -i | head -1

# 6.6 Usuario 1 cancela su inscripción -> 200, cupo se libera
REG_ID=$(curl -s localhost:8080/api/registrations/me -b "$USER1_COOKIE" | jq -r '.items[0].id')
curl -s -X DELETE localhost:8080/api/registrations/$REG_ID -b "$USER1_COOKIE" -i | head -1

# 6.7 Confirmar que el cupo volvió a estar disponible
curl -s localhost:8080/api/events/$EVENT_ID | jq '.availableSlots'   # => 1
```

Resultado esperado: 6.4 devuelve `201`, 6.5 devuelve `409` con
`code: CAPACITY_EXCEEDED`, 6.6 devuelve `200`, 6.7 devuelve `1`. Esto
reproduce exactamente el escenario de `spec.md` § Smoke test.

## 7. Prueba de concurrencia (evidencia de SC-004)

Incluida como prueba de integración automatizada en
`backend/event-service/test/reserve.concurrency.spec.ts`: crea un evento
con `maxCapacity = 10` y dispara 100 llamadas `POST /internal/events/:id/reserve`
en paralelo (`Promise.all`); la aserción verifica que exactamente 10
respondan `200` y 90 respondan `409 CAPACITY_EXCEEDED`, y que
`availableSlots` final sea `0` (nunca negativo).

## 8. Referencias

- Contratos completos: `contracts/api-gateway.md`,
  `contracts/user-service.md`, `contracts/event-service.md`,
  `contracts/registration-service.md`.
- Modelo de datos y reglas: `data-model.md`.
- Decisiones técnicas: `research.md`.
- Arquitectura completa y despliegue en OpenShift: `plan.md`.
