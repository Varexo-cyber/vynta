"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Building2, Globe, Map, MapPin } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { signUp, joinNetworks } from "@/lib/actions";
import { initials, cn } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/constants";
import { getMunicipalityByName, getProvinceByName } from "@/lib/dutch-networks";
import type { Network } from "@/lib/types";
import { ThemedLogo } from "@/components/themed-logo";

function formatPostcode(pc: string) {
  return pc.replace(/^(\d{4})([A-Z]{2})$/i, "$1 $2").toUpperCase();
}

function parseDisplayAddress(display: string) {
  const parts = display.split(", ");
  if (parts.length < 2) return null;
  const [addressPart, locationPart] = parts;
  const locParts = locationPart.split(" ");
  const postcode = locParts[0] ?? "";
  const city = locParts.slice(1).join(" ");
  return { address: addressPart ?? "", postcode: formatPostcode(postcode), city };
}

function industryNetworkId(industry: string) {
  return `ind-${industry.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

function networkIcon(type: string) {
  if (type === "national") return <Globe size={20} />;
  if (type === "province") return <Map size={20} />;
  if (type === "municipality") return <MapPin size={20} />;
  return <Building2 size={20} />;
}

export function OnboardingClient({ networks }: { networks: Network[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [place, setPlace] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("Nederland");
  const [municipality, setMunicipality] = useState("");
  const [municipalityId, setMunicipalityId] = useState<string | undefined>(undefined);
  const [industry, setIndustry] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<string>("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommendedNetworks = useMemo(() => {
    const m = municipality ? getMunicipalityByName(municipality) : undefined;
    const p = province ? getProvinceByName(province) : undefined;
    const industryId = industry ? industryNetworkId(industry) : undefined;
    const ids = new Set([m?.id, p ? `prov-${p.code}` : undefined, industryId, "nat-nl"].filter(Boolean) as string[]);
    return networks.filter((n) => ids.has(n.id));
  }, [municipality, province, industry, networks]);

  const toggleNetwork = (id: string) => {
    setSelectedNetworks((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const canNext =
    step === 0 ? name.trim().length > 1 && !!industry :
    step === 1 ? !!country && !!province && !!city :
    step === 2 ? !!address && !!postcode && !!phone :
    step === 3 ? !!email && password.length >= 6 :
    step === 4 ? selectedNetworks.length > 0 :
    step === 5 ? goals.length > 0 :
    true;

  const next = async () => {
    if (step < 3) {
      setStep((s) => s + 1);
      return;
    }
    if (step === 3) {
      setLoading(true);
      setError(null);
      const res = await signUp({
        companyName: name,
        email,
        password,
        phone,
        address,
        postcode,
        city: place || city,
        province,
        country,
        municipality,
        municipalityId,
        industry,
        kvkNumber: kvkNumber || undefined,
        vatNumber: vatNumber || undefined,
      });
      setLoading(false);
      if (!res.ok) {
        setError(res.error ?? "Account aanmaken mislukt");
        return;
      }
      setSelectedNetworks(recommendedNetworks.map((n) => n.id));
      setStep(4);
      return;
    }
    if (step === 4) {
      setStep(5);
      return;
    }
    if (step === 5) {
      setLoading(true);
      setError(null);
      await joinNetworks(selectedNetworks);
      try {
        const { completeOnboarding } = await import("@/lib/help-actions-server");
        await completeOnboarding(goals, experienceLevel);
      } catch {}
      setLoading(false);
      router.push("/feed");
      return;
    }
  };

  return (
    <div
      className="dark relative flex min-h-screen flex-col bg-background text-foreground"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--x", `${e.clientX - rect.left}px`);
        e.currentTarget.style.setProperty("--y", `${e.clientY - rect.top}px`);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), rgba(255,90,60,0.12), transparent 40%)",
        }}
      />
      <div className="relative flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center">
          <ThemedLogo
            height={32}
            fallbackSrc="/logoaa.png"
            className="h-8 w-8 object-cover mix-blend-screen drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
          />
          <span className="-ml-1 text-base font-bold leading-none text-foreground drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]">
            ynta
          </span>
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-md gap-2 px-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i <= step ? "bg-foreground" : "bg-border"
            )}
          />
        ))}
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {step === 0 && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Hoe heet je bedrijf?</h1>
                <p className="mt-2 text-base text-muted">In welke sector zit je?</p>
                <div className="mt-8 flex items-center gap-4">
                  <div
                    className="grid h-16 w-16 shrink-0 place-items-center rounded-[30%] text-xl font-semibold text-white"
                    style={{ background: "#111" }}
                  >
                    {name ? initials(name) : <Building2 size={24} />}
                  </div>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bedrijfsnaam"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-all",
                        industry === ind
                          ? "bg-foreground text-background"
                          : "bg-surface text-muted hover:text-foreground"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Waar zit je?</h1>
                <p className="mt-2 text-base text-muted">We koppelen je automatisch aan lokale netwerken.</p>
                <div className="mt-8 grid gap-3">
                  <input
                    autoFocus
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Stad"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                  <input
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Provincie"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Land"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Adres & contact</h1>
                <p className="mt-2 text-base text-muted">Zodat andere bedrijven je direct kunnen bereiken.</p>
                <div className="mt-8 grid gap-3">
                  <AddressAutocomplete
                    value={address}
                    onChange={setAddress}
                    onSelect={(s) => {
                      const parsed = parseDisplayAddress(s.display);
                      setAddress(s.shortAddress || parsed?.address || s.display);
                      setPostcode(s.postcode || parsed?.postcode || "");
                      setPlace(s.city || parsed?.city || "");
                      setProvince(s.province);
                      setMunicipality(s.municipality);
                      const m = getMunicipalityByName(s.municipality);
                      setMunicipalityId(m?.id);
                    }}
                  />
                  <input
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Postcode"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                  <input
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="Plaats"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobiel nummer"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    value={kvkNumber}
                    onChange={(e) => setKvkNumber(e.target.value)}
                    placeholder="KVK (optioneel)"
                    className="rounded-2xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                  <input
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="BTW (optioneel)"
                    className="rounded-2xl bg-surface px-4 py-3 text-sm outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Account</h1>
                <p className="mt-2 text-base text-muted">Maak je zakelijk account aan.</p>
                <div className="mt-8 grid gap-3">
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Zakelijk e-mailadres"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Wachtwoord (min. 6 tekens)"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Dit zijn jouw netwerken</h1>
                <p className="mt-2 text-base text-muted">
                  Jouw bedrijf is automatisch verbonden op basis van {place || city}, {province} en {industry}.
                </p>
                <div className="mt-8 grid gap-3">
                  {recommendedNetworks.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-4"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-muted">
                        {networkIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{n.name}</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                            <Check size={10} /> Verbonden
                          </span>
                        </div>
                        <p className="text-sm text-muted">{n.description}</p>
                      </div>
                    </div>
                  ))}
                  {recommendedNetworks.length === 0 && (
                    <p className="text-sm text-muted">
                      Vul eerst je adres en sector in zodat wij je netwerken kunnen voorstellen.
                    </p>
                  )}
                </div>

                <p className="mt-8 text-base font-semibold">Meer branches kiezen</p>
                <p className="text-sm text-muted">Optioneel: voeg extra branches toe die ook bij je bedrijf passen.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {networks
                    .filter((n) => n.type === "industry" && !recommendedNetworks.some((r) => r.id === n.id))
                    .map((n) => {
                      const active = selectedNetworks.includes(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => toggleNetwork(n.id)}
                          className={cn(
                            "rounded-full px-4 py-2 text-sm font-medium transition-all",
                            active
                              ? "bg-foreground text-background"
                              : "bg-surface text-muted hover:text-foreground border border-border"
                          )}
                        >
                          {active && <Check size={12} className="mr-1 inline" />}
                          {n.name}
                        </button>
                      );
                    })}
                </div>
                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
              </div>
            )}

            {/* Step 5: Goals + Experience */}
            {step === 5 && (
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Wat wil je bereiken?</h2>
                <p className="mt-1 text-sm text-muted">
                  Kies een of meer doelen. Hiermee stemmen we Vynta op je af.
                </p>
                <div className="mt-5 space-y-2">
                  {[
                    "Nieuwe klanten vinden",
                    "Leveranciers vinden",
                    "Mijn bedrijf zichtbaarder maken",
                    "Vacatures plaatsen",
                    "Samenwerkingen vinden",
                    "Bedrijven in mijn gemeente leren kennen",
                  ].map((goal) => {
                    const active = goals.includes(goal);
                    return (
                      <button
                        key={goal}
                        onClick={() =>
                          setGoals((g) =>
                            g.includes(goal) ? g.filter((x) => x !== goal) : [...g, goal]
                          )
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-surface text-muted hover:text-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2",
                            active ? "border-background" : "border-border"
                          )}
                        >
                          {active && <Check size={12} />}
                        </span>
                        {goal}
                      </button>
                    );
                  })}
                </div>

                <h3 className="mt-8 text-base font-semibold">Hoeveel uitleg wil je?</h3>
                <div className="mt-3 flex gap-2">
                  {[
                    { key: "basic", label: "Alleen de basis" },
                    { key: "normal", label: "Normaal" },
                    { key: "extensive", label: "Uitgebreid" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setExperienceLevel(opt.key)}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all",
                        experienceLevel === opt.key
                          ? "bg-foreground text-background"
                          : "bg-surface text-muted hover:text-foreground border border-border"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">
                  Dit kun je later altijd aanpassen via Instellingen.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mx-auto flex w-full max-w-md gap-3 px-6 pb-10">
        {step > 0 && (
          <Button
            onClick={() => setStep((s) => s - 1)}
            size="lg"
            variant="outline"
            className="flex-1"
          >
            Terug
          </Button>
        )}
        <Button
          onClick={next}
          size="lg"
          disabled={!canNext || loading}
          className={step > 0 ? "flex-1" : "w-full"}
          variant="accent"
        >
          {step === 3 ? (loading ? "Bezig…" : "Account aanmaken") : step === 5 ? (loading ? "Bezig…" : "Klaar met instellen") : step === 4 ? (loading ? "Bezig…" : "Start op Vynta") : "Doorgaan"}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
