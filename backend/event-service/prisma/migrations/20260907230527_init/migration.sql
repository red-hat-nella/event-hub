-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('MUSIC', 'ART', 'FOOD', 'COMMUNITY', 'WORKSHOP', 'OTHER');

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "max_capacity" INTEGER NOT NULL,
    "available_slots" INTEGER NOT NULL,
    "category" "EventCategory" NOT NULL DEFAULT 'OTHER',
    "image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
