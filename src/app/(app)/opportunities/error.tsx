"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function OpportunitiesError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <AlertCircle size={32} className="text-brand" />
      <h1 className="mt-4 text-xl font-semibold">Kansen konden niet worden geladen</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Er ging iets mis bij het ophalen van de gegevens. Je invoer is niet gewijzigd.</p>
      <button type="button" onClick={unstable_retry} className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"><RotateCcw size={15} /> Opnieuw proberen</button>
    </div>
  );
}
