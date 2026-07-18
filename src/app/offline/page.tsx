export const metadata = {
  title: "Offline — Vynta",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <img src="/logo.png" alt="Vynta" className="mb-8 h-12 w-12 object-contain" />
      <h1 className="text-2xl font-semibold tracking-tight">Je bent offline</h1>
      <p className="mt-3 max-w-sm text-muted">
        Controleer je internetverbinding en probeer het opnieuw. Vynta is terug
        zodra je weer verbinding hebt.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        Opnieuw proberen
      </button>
    </div>
  );
}
