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

import { z } from 'zod';
import { registrationSchema, registrationListSchema, currentUserSchema, adminRegistrationsSchema } from './account-schemas';
import { eventDetailSchema, eventsPageSchema } from './event-schemas';
let sessionGeneration = 0;
const unauthorizedListeners = new Set<(generation: number) => void>();
export const getSessionGeneration = () => sessionGeneration;
export const advanceSession = () => ++sessionGeneration;
export function onPrivateUnauthorized(listener: (generation: number) => void) {
  unauthorizedListeners.add(listener);
  return () => { unauthorizedListeners.delete(listener); };
}
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
  schema?: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  const generation = sessionGeneration;
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 8000);
  try {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api${path}`, {
    ...init,
    signal: controller.signal,
    headers,
    credentials: "same-origin",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: any;
  try { data = text ? JSON.parse(text) : undefined; }
  catch { if (response.ok) throw new ApiError(0, 'INVALID_RESPONSE', 'La información recibida no es válida. Intenta nuevamente.'); }
  if (response.status === 401 && !path.startsWith('/auth/')) unauthorizedListeners.forEach(listener => listener(generation));

  if (!response.ok) {
    const errBody = data?.error ?? {};
    const code: ErrorCode = errBody.code ?? "UNKNOWN_ERROR";
    const message: string = ERROR_MESSAGES[code] ?? "No pudimos completar la solicitud. Intenta nuevamente.";
    throw new ApiError(response.status, code, message, errBody.fields ?? {});
  }

  if (schema) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) throw new ApiError(0, 'INVALID_RESPONSE', 'La información recibida no es válida. Intenta nuevamente.');
    return parsed.data;
  }
  return data as T;
  } catch (error) {
    if (timedOut) throw new ApiError(0, 'REQUEST_TIMEOUT', 'La solicitud tardó demasiado. Intenta nuevamente.');
    throw error;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
  }
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
  eventName: string | null;
  eventStartsAt: string | null;
  eventLocation: string | null;
  status: RegistrationStatus;
  createdAt: string;
}

export interface RegistrationDetail extends RegistrationSummary {
  cancelledAt: string | null;
}

export interface AdminRegistration {
  registrationId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
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
  name: string | null;
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
  }, currentUserSchema);
}

export function logout(): Promise<void> {
  return request<void>("/auth/logout", { method: "POST" });
}

export function me(signal?: AbortSignal): Promise<CurrentUser> {
  return request<CurrentUser>("/auth/me", { method: "GET", signal }, currentUserSchema);
}

// ---------------------------------------------------------------------------
// Catálogo de eventos
// ---------------------------------------------------------------------------

export function getEvents(
  params?: GetEventsParams,
): Promise<Paginated<EventSummary>> {
  return request<Paginated<EventSummary>>(`/events${toQueryString(params)}`, {}, eventsPageSchema);
}

export function getEvent(id: string): Promise<EventDetail> {
  return request<EventDetail>(`/events/${id}`, {}, eventDetailSchema);
}

export function createEvent(dto: CreateEventDto): Promise<EventDetail> {
  return request<EventDetail>("/events", {
    method: "POST",
    body: JSON.stringify(dto),
  }, eventDetailSchema);
}

export function updateEvent(
  id: string,
  dto: UpdateEventDto,
): Promise<EventDetail> {
  return request<EventDetail>(`/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  }, eventDetailSchema);
}

export function deleteEvent(id: string): Promise<void> {
  return request<void>(`/events/${id}`, { method: "DELETE" });
}

export function getEventRegistrations(
  id: string,
  status?: RegistrationStatus,
  signal?: AbortSignal,
): Promise<AdminRegistrationsResponse> {
  return request<AdminRegistrationsResponse>(
    `/events/${id}/registrations${toQueryString({ status })}`, { signal }, adminRegistrationsSchema,
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
  }, registrationSchema);
}

export function getMyRegistrations(
  status?: RegistrationStatus,
  signal?: AbortSignal,
): Promise<{ items: RegistrationSummary[] }> {
  return request<{ items: RegistrationSummary[] }>(
    `/registrations/me${toQueryString({ status })}`, { signal }, registrationListSchema,
  );
}

export function getRegistration(id: string, signal?: AbortSignal): Promise<RegistrationDetail> {
  return request<RegistrationDetail>(`/registrations/${id}`, { signal }, registrationSchema);
}

export function cancelRegistration(id: string): Promise<RegistrationDetail> {
  return request<RegistrationDetail>(`/registrations/${id}`, {
    method: "DELETE",
  }, registrationSchema);
}
