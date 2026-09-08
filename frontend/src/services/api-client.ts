/**
 * Cliente HTTP tipado para el API Gateway (`/api/*`, mismo origen).
 *
 * Convenciones para el resto de la app:
 * - Nunca se construyen URLs a microservicios internos: todo pasa por `/api`.
 * - Todas las peticiones usan `credentials: "same-origin"` para que las
 *   cookies httpOnly de sesión (`access_token`/`refresh_token`) viajen
 *   automáticamente; el frontend nunca lee ni almacena esos tokens.
 * - Cualquier respuesta no-2xx lanza `ApiError` con `{code, message, fields}`
 *   tal como los define `contracts/api-gateway.md`. Los componentes de
 *   pantalla capturan `ApiError` para mostrar mensajes de campo o banners.
 */

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "INVALID_CREDENTIALS"
  | "SESSION_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "EMAIL_IN_USE"
  | "ALREADY_REGISTERED"
  | "CAPACITY_EXCEEDED"
  | "EVENT_ALREADY_STARTED"
  | "CAPACITY_BELOW_ACTIVE_REGISTRATIONS"
  | string;

export class ApiError extends Error {
  code: ErrorCode;
  fields: Record<string, string>;
  status: number;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Mensaje amigable de respaldo cuando el backend no da uno (BR-009). */
export const ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR: "Revisa los campos marcados.",
  UNAUTHENTICATED: "Inicia sesión para continuar.",
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  SESSION_EXPIRED: "Tu sesión expiró, vuelve a iniciar sesión.",
  FORBIDDEN: "No tienes permisos para esta acción.",
  NOT_FOUND: "Este recurso ya no está disponible.",
  EMAIL_IN_USE: "Ese correo ya está registrado.",
  ALREADY_REGISTERED: "Ya estás inscrito en este evento.",
  CAPACITY_EXCEEDED: "El evento alcanzó su capacidad máxima.",
  EVENT_ALREADY_STARTED: "Las inscripciones para este evento están cerradas.",
  CAPACITY_BELOW_ACTIVE_REGISTRATIONS:
    "La nueva capacidad es menor que los inscritos activos.",
};

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const errBody = data?.error ?? {};
    const code: ErrorCode = errBody.code ?? "UNKNOWN_ERROR";
    const message: string =
      errBody.message ?? ERROR_MESSAGES[code] ?? "Ocurrió un error inesperado.";
    throw new ApiError(response.status, code, message, errBody.fields ?? {});
  }

  return data as T;
}

function toQueryString(params: object | undefined): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// Tipos del dominio (reflejan contracts/api-gateway.md)
// ---------------------------------------------------------------------------

export type Role = "USER" | "ADMIN";

export type TemporalStatus = "UPCOMING" | "ONGOING" | "FINISHED";

export interface EventSummary {
  id: string;
  name: string;
  startsAt: string;
  location: string;
  category: string | null;
  imageUrl: string | null;
  maxCapacity: number;
  availableSlots: number;
  temporalStatus: TemporalStatus;
}

export interface EventDetail extends EventSummary {
  description: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GetEventsParams {
  search?: string;
  category?: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}

export interface CreateEventDto {
  name: string;
  description: string;
  startsAt: string;
  location: string;
  maxCapacity: number;
  category?: string;
  imageUrl?: string;
}

export type UpdateEventDto = Partial<CreateEventDto>;

export type RegistrationStatus = "ACTIVE" | "CANCELLED";

export interface RegistrationSummary {
  id: string;
  eventId: string;
  eventName: string;
  eventStartsAt: string;
  eventLocation: string;
  status: RegistrationStatus;
  createdAt: string;
}

export interface RegistrationDetail extends RegistrationSummary {
  cancelledAt: string | null;
}

export interface AdminRegistration {
  registrationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: RegistrationStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export interface AdminRegistrationsResponse {
  items: AdminRegistration[];
  capacity: number;
  occupied: number;
  available: number;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

export function register(dto: RegisterDto): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function login(dto: LoginDto): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function me(): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me", { method: "GET" });
}

// ---------------------------------------------------------------------------
// Catálogo de eventos
// ---------------------------------------------------------------------------

export function getEvents(
  params?: GetEventsParams,
): Promise<Paginated<EventSummary>> {
  return request<Paginated<EventSummary>>(`/events${toQueryString(params)}`);
}

export function getEvent(id: string): Promise<EventDetail> {
  return request<EventDetail>(`/events/${id}`);
}

export function createEvent(dto: CreateEventDto): Promise<EventDetail> {
  return request<EventDetail>("/events", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export function updateEvent(
  id: string,
  dto: UpdateEventDto,
): Promise<EventDetail> {
  return request<EventDetail>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export function deleteEvent(id: string): Promise<void> {
  return request<void>(`/events/${id}`, { method: "DELETE" });
}

export function getEventRegistrations(
  id: string,
  status?: RegistrationStatus,
): Promise<AdminRegistrationsResponse> {
  return request<AdminRegistrationsResponse>(
    `/events/${id}/registrations${toQueryString({ status })}`,
  );
}

// ---------------------------------------------------------------------------
// Inscripciones
// ---------------------------------------------------------------------------

export function createRegistration(
  eventId: string,
  idempotencyKey?: string,
): Promise<RegistrationDetail> {
  return request<RegistrationDetail>(`/events/${eventId}/registrations`, {
    method: "POST",
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
  });
}

export function getMyRegistrations(
  status?: RegistrationStatus,
): Promise<{ items: RegistrationSummary[] }> {
  return request<{ items: RegistrationSummary[] }>(
    `/registrations/me${toQueryString({ status })}`,
  );
}

export function getRegistration(id: string): Promise<RegistrationDetail> {
  return request<RegistrationDetail>(`/registrations/${id}`);
}

export function cancelRegistration(id: string): Promise<RegistrationDetail> {
  return request<RegistrationDetail>(`/registrations/${id}`, {
    method: "DELETE",
  });
}
