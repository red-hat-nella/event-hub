export interface AvatarProps {
  name: string | null | undefined;
  size?: number;
  className?: string;
}

function initialsOf(name: string | null | undefined): string {
  if (typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

/** Avatar de iniciales (sin dependencia de imágenes de perfil en este alcance). */
export function Avatar({ name, size = 36, className = "" }: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name || 'Tu cuenta'}
      className={`inline-flex shrink-0 items-center justify-center rounded-pill bg-secondary-olive-hover text-text-inverse font-display font-medium ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsOf(name)}
    </span>
  );
}
