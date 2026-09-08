import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../../services/api-client";
import type { RegistrationStatus } from "../../services/api-client";
import { useToast } from "../../design-system/molecules/Toast";

export interface UseMyRegistrationsOptions {
  /** Permite deshabilitar la consulta (p. ej. mientras la sesión no está confirmada). */
  enabled?: boolean;
}

/**
 * Convención de hooks de "estado de servidor" (ver `features/events/hooks.ts`):
 * un hook por recurso, `queryKey` como array, se exponen los campos crudos
 * de `useQuery`/`useMutation` para que cada página module su propio layout.
 */
export function useMyRegistrations(
  status?: RegistrationStatus,
  options?: UseMyRegistrationsOptions,
) {
  return useQuery({
    queryKey: ["registrations", "me", status],
    queryFn: () => api.getMyRegistrations(status),
    enabled: options?.enabled ?? true,
  });
}

export function useRegistration(id: string | undefined) {
  return useQuery({
    queryKey: ["registrations", "detail", id],
    queryFn: () => api.getRegistration(id as string),
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      if (error instanceof api.ApiError && (error.status === 404 || error.status === 403)) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

/**
 * Confirma la inscripción (US3). Genera un `Idempotency-Key` por intento
 * (E-007, contracts/api-gateway.md) y en éxito invalida tanto el detalle
 * del evento (cambia `availableSlots`) como "mis inscripciones".
 */
export function useCreateRegistration(eventId: string) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => api.createRegistration(eventId, crypto.randomUUID()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", "detail", eventId] });
      queryClient.invalidateQueries({ queryKey: ["registrations", "me"] });
      showToast("Inscripción confirmada.", "success");
    },
  });
}

/**
 * `id` puede llegar `undefined` mientras no hay una inscripción
 * seleccionada (p. ej. en un listado donde el objetivo se fija recién al
 * abrir el `ConfirmDialog`); `mutate()` nunca se invoca en ese estado.
 */
export function useCancelRegistration(id: string | undefined) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => api.cancelRegistration(id as string),
    onSuccess: (registration) => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["events", "detail", registration.eventId] });
      showToast("Inscripción cancelada.", "success");
    },
  });
}
