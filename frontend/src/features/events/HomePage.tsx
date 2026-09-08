import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { useEvents } from "./hooks";
import { EventCard } from "../../design-system/organisms/EventCard";
import { SkeletonCard } from "../../design-system/molecules/SkeletonCard";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";

/** Landing (`/`): propuesta de valor + próximos destacados. */
export function HomePage() {
  const { data, isLoading, isError, refetch } = useEvents({
    sort: "startsAt",
    pageSize: 4,
  });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6">
      <section className="flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
        <div className="flex flex-1 flex-col items-center gap-4 lg:items-start">
          <h1 className="font-display text-3xl leading-tight text-text-primary sm:text-4xl">
            Descubre eventos que se sienten como una invitación
          </h1>
          <p className="max-w-xl text-lg text-text-secondary">
            Talleres, ferias, exposiciones y encuentros con carácter propio.
            Explora el catálogo y reserva tu lugar en un par de clics.
          </p>
          <Link to="/eventos" className={buttonClassNames("primary", "md")}>
            Explorar todos los eventos
            <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="flex aspect-[4/3] flex-1 items-center justify-center rounded-lg bg-gradient-to-br from-accent-clay/30 to-secondary-olive/20"
        >
          <Sparkles size={64} strokeWidth={1} className="text-accent-terracotta" />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-2xl text-text-primary">
          Próximos destacados
        </h2>

        {isLoading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={<AlertTriangle size={40} strokeWidth={1.5} />}
            title="No pudimos cargar los eventos destacados"
            description="Ocurrió un problema al conectar con el servidor. Intenta de nuevo."
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          />
        )}

        {!isLoading && !isError && data && data.items.length === 0 && (
          <EmptyState
            title="Aún no hay eventos publicados"
            description="Vuelve pronto: estamos preparando la primera tanda de eventos."
            action={
              <Link to="/eventos" className={buttonClassNames("secondary", "sm")}>
                Ver el catálogo
              </Link>
            }
          />
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
