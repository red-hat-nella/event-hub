import { useSearchParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useEvents } from "./hooks";
import { EventFilterBar } from "./EventFilterBar";
import type { EventFilterBarValues } from "./EventFilterBar";
import { EventCard } from "../../design-system/organisms/EventCard";
import { SkeletonCard } from "../../design-system/molecules/SkeletonCard";
import { EmptyState } from "../../design-system/molecules/EmptyState";
import { Pagination } from "../../design-system/molecules/Pagination";
import { Button } from "../../design-system/atoms/Button";

const PAGE_SIZE = 12;

function readFilters(searchParams: URLSearchParams): EventFilterBarValues {
  return {
    search: searchParams.get("search") ?? "",
    category: searchParams.get("category") ?? "",
    location: searchParams.get("location") ?? "",
    dateFrom: searchParams.get("dateFrom") ?? "",
    dateTo: searchParams.get("dateTo") ?? "",
  };
}

/**
 * Exploración de eventos y resultados de búsqueda comparten esta única
 * ruta (`/eventos`): los filtros viven en la query string, así que
 * recargar/compartir la URL conserva el estado de búsqueda.
 */
export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = readFilters(searchParams);
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const { data, isLoading, isError, refetch } = useEvents({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  });

  function applyFilters(next: EventFilterBarValues) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("page", "1");
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams({});
  }

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(nextPage));
    setSearchParams(params);
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl text-text-primary">Explorar eventos</h1>
        <p className="mt-1 text-text-secondary">
          Busca por nombre, categoría, ubicación o fecha.
        </p>
      </div>

      <EventFilterBar values={filters} onSubmit={applyFilters} onClear={clearFilters} />

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: PAGE_SIZE }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<AlertTriangle size={40} strokeWidth={1.5} />}
          title="No pudimos cargar los eventos"
          description="Tus filtros se mantuvieron. Intenta nuevamente en unos segundos."
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length === 0 && !hasActiveFilters && (
        <EmptyState
          title="Aún no hay eventos publicados"
          description="Vuelve más tarde: los administradores están preparando el catálogo."
        />
      )}

      {!isLoading && !isError && data && data.items.length === 0 && hasActiveFilters && (
        <EmptyState
          title="Sin resultados para estos filtros"
          description="Prueba con otro texto, categoría, ubicación o rango de fechas."
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <>
          <p role="status" className="text-sm text-text-secondary">
            {data.total} {data.total === 1 ? "evento encontrado" : "eventos encontrados"}
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={goToPage} />
        </>
      )}
    </div>
  );
}
