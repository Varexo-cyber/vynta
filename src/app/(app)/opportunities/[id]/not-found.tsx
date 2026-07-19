import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function OpportunityNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <SearchX size={32} className="text-muted" />
      <h1 className="mt-4 text-xl font-semibold">Deze kans is niet beschikbaar</h1>
      <p className="mt-2 text-sm leading-6 text-muted">De kans bestaat niet, is privé of je hebt niet de juiste toegang.</p>
      <Link href="/opportunities" className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"><ArrowLeft size={15} /> Naar kansen</Link>
    </div>
  );
}
