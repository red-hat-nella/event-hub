-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "event_name_snapshot" TEXT NOT NULL,
    "event_starts_at_snapshot" TIMESTAMP(3) NOT NULL,
    "event_location_snapshot" TEXT NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "key" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response_body" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "registrations_user_id_event_id_idx" ON "registrations"("user_id", "event_id");

-- Índice único parcial (BR-001, no expresable en schema.prisma): garantiza
-- a nivel de base de datos que un usuario no puede tener dos inscripciones
-- ACTIVE al mismo evento, incluso si dos solicitudes concurrentes pasan la
-- verificación previa en la capa de aplicación (ver data-model.md § Registration
-- y contracts/registration-service.md § Flujo de creación).
CREATE UNIQUE INDEX registrations_active_unique ON registrations (user_id, event_id) WHERE status = 'ACTIVE';
