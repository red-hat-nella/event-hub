import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api-client";
import { ApiError } from "../../services/api-client";
import type {
  CreateEventDto,
  EventDetail,
  EventSummary,
  RegistrationStatus,
  UpdateEventDto,
} from "../../services/api-client";
import { useToast } from "../../design-system/molecules/Toast";
import { useAuth } from '../../app/auth-context';
import { privateQueryKey } from '../../app/private-query-keys';
async function currentSessionResult<T>(operation: () => Promise<T>): Promise<T> {
  const generation = api.getSessionGeneration();
  const result = await operation();
  if (generation !== api.getSessionGeneration()) throw new DOMException('Sesión reemplazada', 'AbortError');
  return result;
}

/**
 * Mutaciones/consultas administrativas de eventos (US5/US6). Igual que
 * `features/events/hooks.ts` y `features/registrations/hooks.ts`: se
 * exponen los campos crudos de `useQuery`/`useMutation`; cada página
 * decide su propio layout de carga/error/éxito.
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (dto: CreateEventDto) => currentSessionResult(() => api.createEvent(dto)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Evento creado.", "success");
    },
  });
}

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (dto: UpdateEventDto) => currentSessionResult(() => api.updateEvent(id, dto)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Evento actualizado.", "success");
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (id: string) => currentSessionResult(() => api.deleteEvent(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showToast("Evento eliminado.", "success");
    },
  });
}

export function useEventRegistrations(id: string | undefined, status?: RegistrationStatus) {
  const auth = useAuth();
  return useQuery({
    queryKey: privateQueryKey(auth.user?.id, auth.generation, 'admin-registrations', id, status),
    queryFn: ({ signal }) => api.getEventRegistrations(id as string, status, signal),
    enabled: auth.status === 'authenticated' && auth.isAdmin && Boolean(id),
    retry: false,
  });
}

export interface DeleteEventDialogState {
  event: EventSummary | EventDetail;
  /** `undefined` mientras se consulta `GET /api/events/:id/registrations`. */
  activeRegistrations?: number;
  loadError?: string;
}

/**
 * Estado compartido del diálogo "eliminar evento" (`EventsListPage` y
 * `AdminEventDetailPage`): antes de confirmar, consulta cuántas
 * inscripciones activas se perderían (ux-design.md §3, "journey 4") para
 * que `ConfirmDialog` muestre la consecuencia concreta (NFR-011).
 */
export function useDeleteEventDialog() {
  const [target, setTarget] = useState<DeleteEventDialogState | undefined>(undefined);
  const deleteEvent = useDeleteEvent();

  async function request(event: EventSummary | EventDetail) {
    const generation = api.getSessionGeneration();
    setTarget({ event });
    try {
      const registrations = await api.getEventRegistrations(event.id, "ACTIVE");
      if (generation !== api.getSessionGeneration()) return;
      setTarget({ event, activeRegistrations: registrations.items.length });
    } catch (error) {
      if (generation !== api.getSessionGeneration()) return;
      setTarget({
        event,
        loadError:
          error instanceof ApiError
            ? error.message
            : "No pudimos consultar las inscripciones de este evento.",
      });
    }
  }

  function close() {
    if (deleteEvent.isPending) return;
    setTarget(undefined);
  }

  function confirm(onDeleted?: () => void) {
    if (!target) return;
    deleteEvent.mutate(target.event.id, {
      onSuccess: () => {
        setTarget(undefined);
        onDeleted?.();
      },
    });
  }

  const countLoading = Boolean(target) && target?.activeRegistrations === undefined && !target?.loadError;

  return { target, request, close, confirm, deleteEvent, countLoading };
}
