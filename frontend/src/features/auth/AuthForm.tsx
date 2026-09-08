import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle } from "lucide-react";
import { ApiError } from "../../services/api-client";
import { FormField, fieldA11yProps } from "../../design-system/molecules/FormField";
import { Input } from "../../design-system/atoms/Input";
import { Button } from "../../design-system/atoms/Button";

export type AuthFormMode = "login" | "register";

export interface AuthFormValues {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthFormProps {
  mode: AuthFormMode;
  /** Lanza `ApiError` en caso de fallo; `AuthForm` la traduce a errores por campo/banner. */
  onSubmit: (values: AuthFormValues) => Promise<void>;
  submitLabel: string;
}

function buildSchema(mode: AuthFormMode) {
  return z
    .object({
      name:
        mode === "register"
          ? z.string().trim().min(1, "El nombre es obligatorio")
          : z.string().optional(),
      email: z
        .string()
        .trim()
        .min(1, "El correo es obligatorio")
        .email("Ingresa un correo válido"),
      password:
        mode === "register"
          ? z.string().min(8, "La contraseña debe tener al menos 8 caracteres")
          : z.string().min(1, "La contraseña es obligatoria"),
      confirmPassword:
        mode === "register"
          ? z.string().min(1, "Confirma tu contraseña")
          : z.string().optional(),
    })
    .refine((data) => mode !== "register" || data.password === data.confirmPassword, {
      message: "Las contraseñas no coinciden",
      path: ["confirmPassword"],
    });
}

/**
 * Estructura compartida por Login y Registro (React Hook Form + Zod,
 * validación en vivo por campo — research.md §12). Convención para el
 * siguiente agente: los errores 400 `VALIDATION_ERROR` del backend se
 * mapean a `setError(field, ...)` por campo aquí mismo, no en la página.
 */
export function AuthForm({ mode, onSubmit, submitLabel }: AuthFormProps) {
  const [serverError, setServerError] = useState<string | undefined>(undefined);
  const schema = useMemo(() => buildSchema(mode), [mode]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    // El esquema depende del modo en tiempo de ejecución; los tipos de
    // salida son estables (AuthFormValues) en ambos casos.
    resolver: zodResolver(schema) as never,
  });

  async function submit(values: AuthFormValues) {
    setServerError(undefined);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === "EMAIL_IN_USE") {
          setError("email", { message: error.message });
          return;
        }
        if (error.code === "VALIDATION_ERROR" && Object.keys(error.fields).length > 0) {
          Object.entries(error.fields).forEach(([field, message]) => {
            setError(field as keyof AuthFormValues, { message });
          });
          return;
        }
        setServerError(error.message);
        return;
      }
      setServerError("Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      {serverError && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-sm border border-error/30 bg-error/5 px-3 py-2 text-sm text-error"
        >
          <AlertCircle size={16} strokeWidth={1.5} aria-hidden="true" />
          {serverError}
        </p>
      )}

      {mode === "register" && (
        <FormField htmlFor="name" label="Nombre" error={errors.name?.message} required>
          <Input
            {...fieldA11yProps("name", errors.name?.message)}
            {...register("name")}
            autoComplete="name"
          />
        </FormField>
      )}

      <FormField htmlFor="email" label="Correo electrónico" error={errors.email?.message} required>
        <Input
          {...fieldA11yProps("email", errors.email?.message)}
          {...register("email")}
          type="email"
          autoComplete="email"
        />
      </FormField>

      <FormField htmlFor="password" label="Contraseña" error={errors.password?.message} required>
        <Input
          {...fieldA11yProps("password", errors.password?.message)}
          {...register("password")}
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
        />
      </FormField>

      {mode === "register" && (
        <FormField
          htmlFor="confirmPassword"
          label="Confirmar contraseña"
          error={errors.confirmPassword?.message}
          required
        >
          <Input
            {...fieldA11yProps("confirmPassword", errors.confirmPassword?.message)}
            {...register("confirmPassword")}
            type="password"
            autoComplete="new-password"
          />
        </FormField>
      )}

      <Button type="submit" size="md" loading={isSubmitting} className="mt-2">
        {submitLabel}
      </Button>
    </form>
  );
}
