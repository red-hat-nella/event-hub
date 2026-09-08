import { Button } from '../atoms/Button';
export function QueryErrorState({ onRetry }: { onRetry: () => void }) {
  return <section role="alert" className="rounded-lg border border-border-subtle bg-bg-surface p-6">
    <h2 className="font-display text-xl">Información no disponible</h2>
    <p className="my-3 text-text-secondary">No pudimos cargar esta sección. Puedes intentarlo de nuevo.</p>
    <Button variant="secondary" onClick={onRetry}>Reintentar</Button>
  </section>;
}
