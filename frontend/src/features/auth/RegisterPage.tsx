import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthForm } from "./AuthForm";
import type { AuthFormValues } from "./AuthForm";
import { useAuth } from "../../app/auth-context";
import { useToast } from "../../design-system/molecules/Toast";

/** `/registro`: auto-login tras crear la cuenta para minimizar pasos (SC-001). */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const from = searchParams.get("from");

  async function handleSubmit(values: AuthFormValues) {
    const user = await register({
      name: values.name ?? "",
      email: values.email,
      password: values.password,
    });
    showToast(`Cuenta creada. Bienvenido, ${user.name}`, "success");
    navigate(from ? decodeURIComponent(from) : "/mi-cuenta", { replace: true });
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-[400px] flex-col justify-center gap-6 px-4 py-12 sm:px-0">
      <div className="text-center">
        <h1 className="font-display text-2xl text-text-primary">Crea tu cuenta</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Únete para inscribirte a los eventos que te interesan.
        </p>
      </div>

      <AuthForm mode="register" submitLabel="Crear cuenta" onSubmit={handleSubmit} />

      <p className="text-center text-sm text-text-secondary">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-accent-terracotta hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
