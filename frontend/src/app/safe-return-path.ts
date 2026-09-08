export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\') || [...value].some(char => char.charCodeAt(0) <= 32) || /%(?:2f|5c|25|0[0-9a-f])/i.test(value)) return '/mi-cuenta';
  return value;
}
