const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
export function accountName(value: unknown, fallback = 'Tu cuenta'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}
export function formatAccountDate(value: unknown): string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? dateFormat.format(new Date(value)) : 'Fecha no disponible';
}
export function isFutureDate(value: unknown): boolean {
  return typeof value === 'string' && Date.parse(value) > Date.now();
}
