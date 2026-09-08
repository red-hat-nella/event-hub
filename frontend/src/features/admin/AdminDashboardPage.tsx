import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarClock, LayoutGrid, TriangleAlert } from "lucide-react";
import { useEvents } from "../events/hooks";
import { Button, buttonClassNames } from "../../design-system/atoms/Button";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { SkeletonCard } from "../../design-system/molecules/SkeletonCard";

const ADMIN_PAGE_SIZE = 100;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const LOW_CAPACITY_RATIO = 0.1;

interface SummaryCardProps {
  icon: ReactNode;
  label: string;
  value: number;
}

function SummaryCard({ icon, label, value }: SummaryCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-surface p-5">
      <span className="text-accent-terracotta" aria-hidden="true">
        {icon}
      </span>
      <span className="font-display text-3xl text-text-primary">{value}</span>
      <span className="text-sm text-text-secondary">{label}</span>
    </div>
  );
}

/**
 * Dashboard administrativo (`/admin`, US5, T105). Sin endpoint de
 * agregación dedicado (ux-design.md §10): se calcula en el cliente sobre
 * la página actual de `GET /api/events` con un `pageSize` alto.
 */
export function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useEvents({
    page: 1,
    pageSize: ADMIN_PAGE_SIZE,
    sort: "startsAt",
  });

  const items = data?.items ?? [];
  const now = Date.now();
  const upcomingWithin7Days = items.filter((event) => {
    const startsAt = new Date(event.startsAt).getTime();
    return startsAt >= now && startsAt <= now + SEVEN_DAYS_MS;
  }).length;
  const lowCapacity = items.filter(
    (event) => event.maxCapacity > 0 && event.availableSlots / event.maxCapacity < LOW_CAPACITY_RATIO,
  ).length;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-text-primary">Panel de administración</h1>
          <p className="mt-1 text-text-secondary">Resumen operativo del catálogo de eventos.</p>
        </div>
        <Link to="/admin/eventos" className={buttonClassNames("primary", "sm")}>
          Gestionar eventos
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title="No pudimos cargar el resumen"
          description="Ocurrió un problema de conexión. Intenta nuevamente."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Aún no hay eventos"
          description="Crea el primer evento del catálogo para empezar."
          action={
            <Link to="/admin/eventos/nuevo" className={buttonClassNames("primary", "sm")}>
              Crear el primer evento
            </Link>
          }
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<LayoutGrid size={24} strokeWidth={1.5} />}
            label="Total de eventos"
            value={data?.total ?? items.length}
          />
          <SummaryCard
            icon={<CalendarClock size={24} strokeWidth={1.5} />}
            label="Próximos 7 días"
            value={upcomingWithin7Days}
          />
          <SummaryCard
            icon={<TriangleAlert size={24} strokeWidth={1.5} />}
            label="Con menos del 10% de cupo"
            value={lowCapacity}
          />
        </div>
      )}
    </div>
  );
}
