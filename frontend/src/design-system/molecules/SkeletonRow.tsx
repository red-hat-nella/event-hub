/** Skeleton de una fila de tabla/lista (inscripciones, eventos admin, etc.). */
export function SkeletonRow() {
  return (
    <div
      aria-hidden="true"
      className="flex animate-pulse items-center gap-4 border-b border-border-subtle px-4 py-3"
    >
      <div className="h-4 w-1/4 rounded-sm bg-bg-surface-alt" />
      <div className="h-4 w-1/6 rounded-sm bg-bg-surface-alt" />
      <div className="h-4 w-1/4 rounded-sm bg-bg-surface-alt" />
      <div className="h-4 w-1/6 rounded-sm bg-bg-surface-alt" />
    </div>
  );
}
