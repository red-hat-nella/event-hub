import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthForm } from "./AuthForm";
import type { AuthFormValues } from "./AuthForm";
import { useAuth } from "../../app/auth-context";
import { useToast } from "../../design-system/molecules/Toast";
import { safeReturnPath } from '../../app/safe-return-path';

/** `/login`: respeta `?from=` para regresar al flujo interrumpido (p. ej. detalle de evento). */
export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const from = searchParams.get("from");

  async function handleSubmit(values: AuthFormValues) {
    const user = await login({ email: values.email, password: values.password });
    showToast(`Bienvenido, ${user.name}`, "success");
    navigate(safeReturnPath(from), { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[400px] flex-col justify-center gap-6 px-4 py-12 sm:px-0">
      <div className="text-center">
        <h1 className="font-display text-2xl text-text-primary">Inicia sesión</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Bienvenido de nuevo a Event Hub.
        </p>
      </div>

      <AuthForm mode="login" submitLabel="Iniciar sesión" onSubmit={handleSubmit} />

      <p className="text-center text-sm text-text-secondary">
        ¿No tienes cuenta?{" "}
        <Link to="/registro" className="font-medium text-accent-terracotta hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
