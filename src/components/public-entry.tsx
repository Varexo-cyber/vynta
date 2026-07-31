import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Landing } from "@/components/landing";
import { VyntaBrand } from "@/components/vynta-brand";

export function PublicEntry() {
  return (
    <>
      <div className="web-public-entry">
        <Landing />
      </div>
      <div className="native-public-entry">
        <NativeWelcome />
      </div>
    </>
  );
}

function NativeWelcome() {
  return (
    <main className="native-first-run">
      <section className="native-first-run__hero" aria-labelledby="native-first-run-title">
        <VyntaBrand size={72} className="native-first-run__brand" />
        <h1 id="native-first-run-title">Waar Nederlandse bedrijven elkaar vinden.</h1>
        <p className="native-first-run__intro">
          Deel waar je aan werkt, ontdek zakelijke kansen en kom direct in contact.
        </p>
      </section>

      <footer className="native-first-run__actions">
        <Link href="/onboarding" className="native-first-run__primary press">
          Account maken <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link href="/auth" className="native-first-run__secondary press">
          Inloggen
        </Link>
        <p>Voor bedrijven in Nederland.</p>
      </footer>
    </main>
  );
}
