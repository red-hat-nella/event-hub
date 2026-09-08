export function AppFooter() {
  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center sm:px-6">
        <p className="font-display text-lg text-text-primary">Event Hub</p>
        <p className="text-sm text-text-secondary">
          Descubre, explora e inscríbete a eventos culturales, artísticos y
          comunitarios.
        </p>
        <p className="text-xs text-text-secondary">
          © {new Date().getFullYear()} Event Hub.
        </p>
      </div>
    </footer>
  );
}
