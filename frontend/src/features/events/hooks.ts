import { useQuery } from "@tanstack/react-query";
import * as api from "../../services/api-client";
import type { GetEventsParams } from "../../services/api-client";

/**
 * Convención de hooks de "estado de servidor" para el resto de features:
 * un hook por recurso, `queryKey` como array `[recurso, ...params]`, y se
 * exponen directamente los campos de `useQuery` (`data`/`isLoading`/
 * `isError`/`error`/`refetch`) para que cada página decida su propio
 * layout de carga/vacío/error (ux-design.md §6).
 */
export function useEvents(params: GetEventsParams) {
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => api.getEvents(params),
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => api.getEvent(id as string),
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      if (error instanceof api.ApiError && error.status === 404) return false;
      return failureCount < 1;
    },
  });
}
