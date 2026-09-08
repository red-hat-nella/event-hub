import { z } from "zod";
import {
  EVENT_CATEGORY_LABELS,
  EVENT_CATEGORY_VALUES,
  isEventCategoryValue,
  type EventCategoryValue,
} from "../../lib/event-categories";

export { EVENT_CATEGORY_LABELS, EVENT_CATEGORY_VALUES };
export type { EventCategoryValue };

/**
 * Espeja V-001..V-005 (`spec.md`) y las reglas de `CreateEventDto` del
 * Gateway: nombre/descripción/ubicación no vacíos, fecha+hora futura,
 * capacidad entera > 0, categoría opcional de un catálogo fijo, imagen
 * opcional con formato URL. `date`/`time` se combinan en `startsAt` recién
 * al enviar (ver `toStartsAtIso`).
 */
export const eventFormSchema = z
  .object({
    name: z.string().trim().min(1, "El nombre es obligatorio"),
    description: z.string().trim().min(1, "La descripción es obligatoria"),
    date: z.string().min(1, "La fecha es obligatoria"),
    time: z.string().min(1, "La hora es obligatoria"),
    location: z.string().trim().min(1, "La ubicación es obligatoria"),
    maxCapacity: z
      .number({ invalid_type_error: "Ingresa un número" })
      .int("Debe ser un número entero")
      .min(1, "Debe ser mayor a cero"),
    category: z.enum(EVENT_CATEGORY_VALUES).optional().or(z.literal("")),
    imageUrl: z.string().trim().url("Ingresa una URL válida").optional().or(z.literal("")),
  })
  .refine(
    (values) => {
      if (!values.date || !values.time) return true;
      const startsAt = new Date(`${values.date}T${values.time}`);
      return !Number.isNaN(startsAt.getTime()) && startsAt.getTime() > Date.now();
    },
    {
      message: "La fecha y hora deben ser posteriores al momento actual",
      path: ["date"],
    },
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;

/** Combina `date`+`time` del formulario (hora local) en el `startsAt` ISO-8601 UTC que espera el API. */
export function toStartsAtIso(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

/** Inversa de `toStartsAtIso`: separa un `startsAt` ISO en `date`/`time` locales para precargar `EventForm`. */
export function splitStartsAt(startsAt: string): { date: string; time: string } {
  const value = new Date(startsAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  const time = `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  return { date, time };
}

/**
 * `EventSummary.category` y `EVENT_CATEGORY_VALUES` usan el mismo catálogo
 * (mayúsculas, ver `lib/event-categories.ts`). Se valida aquí en vez de
 * asumirlo a ciegas; si el valor no es reconocido, precarga "Sin
 * categoría" en lugar de fallar silenciosamente.
 */
export function normalizeCategory(category: string | null | undefined): EventCategoryValue | "" {
  return isEventCategoryValue(category) ? category : "";
}
