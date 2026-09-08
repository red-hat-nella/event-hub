import {
  CalendarDays,
  Music,
  Palette,
  UtensilsCrossed,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Catálogo cerrado de categorías de evento. DEBE coincidir exactamente
 * (mismos valores, misma mayúscula/minúscula) con:
 * - `EventCategory` en `backend/event-service/prisma/schema.prisma`
 * - `EVENT_CATEGORIES` en `backend/api-gateway/src/events/dto/create-event.dto.ts`
 *
 * Única fuente de verdad en el frontend para valores/etiquetas/íconos de
 * categoría — no dupliques esta lista en otro componente.
 */
export const EVENT_CATEGORY_VALUES = [
  "MUSIC",
  "ART",
  "FOOD",
  "COMMUNITY",
  "WORKSHOP",
  "OTHER",
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategoryValue, string> = {
  MUSIC: "Música",
  ART: "Arte",
  FOOD: "Gastronomía",
  COMMUNITY: "Comunidad",
  WORKSHOP: "Taller",
  OTHER: "Otro",
};

export const EVENT_CATEGORY_ICONS: Record<EventCategoryValue, LucideIcon> = {
  MUSIC: Music,
  ART: Palette,
  FOOD: UtensilsCrossed,
  COMMUNITY: Users,
  WORKSHOP: Wrench,
  OTHER: CalendarDays,
};

export function isEventCategoryValue(
  value: string | null | undefined,
): value is EventCategoryValue {
  return (
    !!value &&
    (EVENT_CATEGORY_VALUES as readonly string[]).includes(value)
  );
}

export function eventCategoryLabel(category: string | null | undefined): string | null {
  return isEventCategoryValue(category) ? EVENT_CATEGORY_LABELS[category] : null;
}

export function eventCategoryIcon(category: string | null | undefined): LucideIcon {
  return isEventCategoryValue(category)
    ? EVENT_CATEGORY_ICONS[category]
    : CalendarDays;
}
