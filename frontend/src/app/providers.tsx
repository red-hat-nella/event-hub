import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "../design-system/molecules";
import { AuthProvider } from "./auth-context";

/**
 * TanStack Query para todo el estado de servidor (catálogo, detalle,
 * inscripciones); `React Context` (Auth/Toast) para sesión y notificaciones.
 * Sin Redux (research.md §10).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
