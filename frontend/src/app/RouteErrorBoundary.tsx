export function RouteErrorBoundary() {
  return <section role="alert" className="mx-auto max-w-xl space-y-4 px-4 py-12 text-text-primary">
    <h1 className="font-display text-3xl">No pudimos mostrar esta página</h1>
    <p>Tu información sigue guardada. Vuelve al inicio o recarga para intentarlo de nuevo.</p>
    <div className="flex flex-wrap gap-4">
      <a className="inline-flex min-h-11 items-center underline" href="/">Volver al inicio</a>
      <button className="min-h-11 underline" onClick={() => window.location.reload()}>Recargar página</button>
    </div>
  </section>;
}
