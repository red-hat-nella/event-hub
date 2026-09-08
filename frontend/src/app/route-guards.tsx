import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth-context";
import { Spinner } from "../design-system/atoms";

/** Pantalla de espera mientras se resuelve `GET /api/auth/me`. */
function AuthResolving() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size={28} label="Verificando sesión" />
    </div>
  );
}

/**
 * Exige sesión activa. Si no hay sesión, redirige a `/login?from=<ruta>`
 * para conservar la intención original (ux-design.md §13/route research).
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AuthResolving />;

  if (status === "anonymous") {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  return <>{children}</>;
}

/** Exige sesión activa y rol `ADMIN`. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") return <AuthResolving />;

  if (status === "anonymous") {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
