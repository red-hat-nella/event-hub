import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../../services/api-client';
import { useAuth } from '../../app/auth-context';
import { privateQueryKey } from '../../app/private-query-keys';
import { useToast } from '../../design-system/molecules/Toast';
export interface UseMyRegistrationsOptions { enabled?: boolean }
export function useMyRegistrations(status?: api.RegistrationStatus, options?: UseMyRegistrationsOptions) {
  const auth = useAuth();
  return useQuery({
    queryKey: privateQueryKey(auth.user?.id, auth.generation, 'registrations', 'me', status),
    queryFn: ({ signal }) => api.getMyRegistrations(status, signal),
    enabled: auth.status === 'authenticated' && options?.enabled !== false,
    retry: false,
  });
}
export function useRegistration(id: string | undefined) {
  const auth = useAuth();
  return useQuery({
    queryKey: privateQueryKey(auth.user?.id, auth.generation, 'registrations', 'detail', id),
    queryFn: ({ signal }) => api.getRegistration(id!, signal),
    enabled: auth.status === 'authenticated' && Boolean(id),
    retry: false,
  });
}
function useRegistrationMutation(operation: () => Promise<api.RegistrationDetail>, message: string) {
  const client = useQueryClient();
  const { showToast } = useToast();
  const auth = useAuth();
  return useMutation({
    mutationKey: privateQueryKey(auth.user?.id, auth.generation, 'registration-mutation'),
    mutationFn: async () => {
      const epoch = api.getSessionGeneration();
      if (auth.status !== 'authenticated' || epoch !== auth.generation) throw new DOMException('Sesión reemplazada', 'AbortError');
      const result = await operation();
      if (epoch !== api.getSessionGeneration()) throw new DOMException('Sesión reemplazada', 'AbortError');
      return result;
    },
    onSuccess: registration => {
      if (auth.generation !== api.getSessionGeneration()) return;
      void client.invalidateQueries({ queryKey: privateQueryKey(auth.user?.id, auth.generation, 'registrations') });
      void client.invalidateQueries({ queryKey: ['events', 'detail', registration.eventId] });
      showToast(message, 'success');
    },
    retry: false,
  });
}
export function useCreateRegistration(eventId: string) {
  return useRegistrationMutation(() => api.createRegistration(eventId, crypto.randomUUID()), 'Inscripción confirmada.');
}
export function useCancelRegistration(id: string | undefined) {
  return useRegistrationMutation(() => api.cancelRegistration(id!), 'Inscripción cancelada.');
}
