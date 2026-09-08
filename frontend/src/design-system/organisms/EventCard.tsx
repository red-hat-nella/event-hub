import { Link } from "react-router-dom";
import { MapPin, CalendarDays } from "lucide-react";
import type { EventSummary } from "../../services/api-client";
import { eventCategoryIcon, eventCategoryLabel } from "../../lib/event-categories";
import { Badge } from "../atoms/Badge";
import { buttonClassNames } from "../atoms/Button";

export interface EventCardProps {
  event: EventSummary;
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "medium",
  timeStyle: "short",
});

/**
 * Tarjeta de evento reutilizable (catálogo, home, dashboards). Convención
 * de props para el siguiente agente: recibe el `EventSummary` completo tal
 * cual lo devuelve `/api/events`, no props sueltas por campo.
 */
export function EventCard({ event, className = "" }: EventCardProps) {
  const isSoldOut = event.availableSlots <= 0;
  const Icon = eventCategoryIcon(event.category);
  const categoryLabel = eventCategoryLabel(event.category);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-surface shadow-sm transition-shadow duration-150 ease-out hover:shadow-md ${className}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-surface-alt">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Ilustración de categoría ${categoryLabel ?? "general"}`}
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-clay/30 to-secondary-olive/20"
          >
            <Icon size={40} strokeWidth={1.5} className="text-accent-terracotta" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-lg leading-snug text-text-primary">
          {event.name}
        </h3>

        <div className="flex flex-col gap-1 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
            {dateFormatter.format(new Date(event.startsAt))}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={16} strokeWidth={1.5} aria-hidden="true" />
            {event.location}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categoryLabel && (
            <span className="inline-flex items-center rounded-pill bg-bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
              {categoryLabel}
            </span>
          )}
          {isSoldOut ? (
            <Badge variant="soldout">Agotado</Badge>
          ) : (
            <Badge variant="available">
              {event.availableSlots} de {event.maxCapacity} cupos
            </Badge>
          )}
        </div>

        <Link
          to={`/eventos/${event.id}`}
          className={`${buttonClassNames("primary", "sm")} mt-auto`}
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
