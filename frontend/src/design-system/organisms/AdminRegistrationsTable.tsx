import type { AdminRegistration } from "../../services/api-client";
import { Badge } from "../atoms/Badge";
import type { BadgeVariant } from "../atoms/Badge";

export interface AdminRegistrationsTableProps {
  registrations: AdminRegistration[];
  className?: string;
}

const STATUS_BADGE: Record<AdminRegistration["status"], BadgeVariant> = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
};

const STATUS_LABEL: Record<AdminRegistration["status"], string> = {
  ACTIVE: "Activa",
  CANCELLED: "Cancelada",
};

import { formatAccountDate, accountName } from "../account-formatters";

/**
 * Tabla de inscritos de un evento (US6, T116): usuario, correo, estado y
 * fechas de inscripción/cancelación. Recibe la lista completa tal cual la
 * devuelve `GET /api/events/:id/registrations` (`AdminRegistration[]`).
 */
export function AdminRegistrationsTable({ registrations, className = "" }: AdminRegistrationsTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-border-subtle ${className}`}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-bg-surface-alt text-text-secondary">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Nombre
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Correo
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Estado
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Fecha de inscripción
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Fecha de cancelación
            </th>
          </tr>
        </thead>
        <tbody>
          {registrations.map((registration) => (
            <tr key={registration.registrationId} className="border-t border-border-subtle">
              <td className="px-4 py-3 text-text-primary">{accountName(registration.userName, "Nombre no disponible")}</td>
              <td className="px-4 py-3 text-text-secondary">{accountName(registration.userEmail, "Correo no disponible")}</td>
              <td className="px-4 py-3">
                <Badge variant={STATUS_BADGE[registration.status]}>
                  {STATUS_LABEL[registration.status]}
                </Badge>
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {formatAccountDate(registration.createdAt)}
              </td>
              <td className="px-4 py-3 text-text-secondary">
                {registration.cancelledAt
                  ? formatAccountDate(registration.cancelledAt)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
