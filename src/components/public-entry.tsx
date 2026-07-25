import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  MapPin,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";
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
    <main className="native-welcome">
      <div className="native-welcome__glow native-welcome__glow--one" />
      <div className="native-welcome__glow native-welcome__glow--two" />

      <header className="native-welcome__header">
        <VyntaBrand
          size={38}
          markSrc="/logoaa.png"
          textClassName="text-white"
          className="relative z-10"
        />
        <span className="native-welcome__free">
          <Check size={13} strokeWidth={2.5} />
          Gratis
        </span>
      </header>

      <section className="native-welcome__hero" aria-labelledby="native-welcome-title">
        <p className="native-welcome__eyebrow">
          <Sparkles size={14} />
          Zakelijk Nederland, op één plek
        </p>
        <h1 id="native-welcome-title">
          Vind het bedrijf dat je <span>verder helpt.</span>
        </h1>
        <p className="native-welcome__intro">
          Deel wat je zoekt, ontdek zakelijke kansen en praat direct met de juiste bedrijven.
        </p>
      </section>

      <section className="native-welcome__preview" aria-label="Voorbeeld van Vynta">
        <div className="native-welcome__search">
          <Search size={18} />
          <span>Wat heeft jouw bedrijf nodig?</span>
        </div>

        <article className="native-preview-card native-preview-card--primary">
          <div className="native-preview-card__top">
            <span className="native-preview-card__avatar">NH</span>
            <span>
              <strong>Noordhaven Verpakkingen</strong>
              <small><MapPin size={11} /> Rotterdam · 12 min</small>
            </span>
            <span className="native-preview-card__match">Nieuwe kans</span>
          </div>
          <p>Gezocht: vaste logistieke partner voor wekelijkse distributie.</p>
          <div className="native-preview-card__footer">
            <span>Logistiek</span>
            <span>Zuid-Holland</span>
            <span className="native-preview-card__response"><MessageCircle size={13} /> Reageren</span>
          </div>
        </article>

        <div className="native-welcome__mini-grid">
          <article className="native-mini-card">
            <span className="native-mini-card__icon"><Building2 size={18} /></span>
            <strong>Bedrijven</strong>
            <small>Vind lokale expertise</small>
          </article>
          <article className="native-mini-card native-mini-card--accent">
            <span className="native-mini-card__icon"><Sparkles size={18} /></span>
            <strong>Kansen</strong>
            <small>Relevant voor jou</small>
          </article>
        </div>
      </section>

      <footer className="native-welcome__actions">
        <Link href="/onboarding" className="native-welcome__primary press">
          Gratis aanmelden <ArrowRight size={19} />
        </Link>
        <Link href="/auth" className="native-welcome__secondary press">
          Ik heb al een account
        </Link>
        <p>Voor Nederlandse bedrijven · Geen abonnement nodig</p>
      </footer>
    </main>
  );
}
