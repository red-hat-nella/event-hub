/** Skeleton de `EventCard`: preserva el layout final (evita layout shift). */
export function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse overflow-hidden rounded-lg border border-border-subtle bg-bg-surface"
    >
      <div className="aspect-[4/3] w-full bg-bg-surface-alt" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-5 w-3/4 rounded-sm bg-bg-surface-alt" />
        <div className="h-4 w-1/2 rounded-sm bg-bg-surface-alt" />
        <div className="h-4 w-2/3 rounded-sm bg-bg-surface-alt" />
        <div className="mt-2 h-9 w-full rounded-md bg-bg-surface-alt" />
      </div>
    </div>
  );
}
