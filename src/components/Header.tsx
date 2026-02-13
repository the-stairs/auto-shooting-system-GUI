export function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
          <span className="font-mono text-sm font-bold text-primary-foreground">
            V
          </span>
        </div>
        <h1 className="text-sm font-bold tracking-tight text-foreground">
          VisualVibe
        </h1>
      </div>
      <span className="text-xs text-muted-foreground">for POC</span>
    </header>
  );
}
