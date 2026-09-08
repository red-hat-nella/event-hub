import { useAuth } from "../../app/auth-context";
import { Avatar } from "../../design-system/atoms/Avatar";
import { Spinner } from "../../design-system/atoms/Spinner";

import { accountName } from "../../design-system/account-formatters";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Persona usuaria",
};

/**
 * Perfil de solo lectura (`/mi-cuenta/perfil`, US4). `ux-design.md §9`
 * sugiere mostrar también la fecha de creación de cuenta, pero
 * `GET /api/auth/me` (`contracts/api-gateway.md`) no expone ese campo en
 * `CurrentUser`; se omite en vez de inventar un dato que el backend no
 * entrega. Edición de perfil está fuera del alcance de `spec.md`.
 */
export function ProfilePage() {
  const { user, status } = useAuth();

  if (status === "loading" || !user) {
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-xl items-center justify-center px-4 py-10 sm:px-6">
        <Spinner size={28} label="Cargando perfil" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-text-primary">Mi perfil</h1>

      <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-bg-surface p-6">
        <div className="flex items-center gap-4">
          <Avatar name={accountName(user.name)} size={56} />
          <div>
            <p className="font-display text-xl text-text-primary">{accountName(user.name)}</p>
            <p className="text-sm text-text-secondary">{ROLE_LABEL[user.role] ?? user.role}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-text-primary">Nombre</dt>
            <dd className="text-text-secondary">{accountName(user.name)}</dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">Correo electrónico</dt>
            <dd className="text-text-secondary">{user.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-text-primary">Rol</dt>
            <dd className="text-text-secondary">{ROLE_LABEL[user.role] ?? user.role}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
