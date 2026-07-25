"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { ArrowRight, Check, Building2, Globe, LoaderCircle, LocateFixed, Map, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { signUp, signUpWithGoogle, joinNetworks } from "@/lib/actions";
import { initials, cn } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/constants";
import { getMunicipalityByName, getProvinceByName } from "@/lib/dutch-networks";
import type { Network } from "@/lib/types";
import { VyntaBrand } from "@/components/vynta-brand";
import { GoogleIcon } from "@/components/google-icon";
import { GoogleAuthButton } from "@/components/google-auth-button";
import type { PendingGoogleProfile } from "@/lib/google-auth";

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

class OnboardingTimeoutError extends Error {}

const GOOGLE_ONBOARDING_DRAFT_KEY = "vynta:google-onboarding-draft:v1";

type GoogleOnboardingDraft = {
  name: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  city: string;
  place: string;
  province: string;
  country: string;
  municipality: string;
  municipalityId?: string;
  industry: string;
  kvkNumber: string;
  vatNumber: string;
};

type LocationStatus = "idle" | "loading" | "success" | "error";

function withTimeout<T>(promise: Promise<T>, timeoutMs = 25_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new OnboardingTimeoutError()), timeoutMs);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function onboardingErrorMessage(error: unknown) {
  if (error instanceof OnboardingTimeoutError) {
    return "Dit duurt langer dan normaal. Controleer je verbinding en probeer het over een minuut opnieuw. Is je account al aangemaakt? Log dan in via Google.";
  }
  return "Er ging technisch iets mis. Je gegevens zijn niet verloren; probeer het opnieuw.";
}

export function OnboardingClient({ networks, googleProfile }: { networks: Network[]; googleProfile: PendingGoogleProfile | null }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(googleProfile?.email ?? "");
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
  const [accountCreated, setAccountCreated] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!googleProfile) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const saved = window.sessionStorage.getItem(GOOGLE_ONBOARDING_DRAFT_KEY);
        if (!saved) return;
        const draft = JSON.parse(saved) as Partial<GoogleOnboardingDraft>;
        setName(draft.name ?? "");
        setEmail(googleProfile.email);
        setPhone(draft.phone ?? "");
        setAddress(draft.address ?? "");
        setPostcode(draft.postcode ?? "");
        setCity(draft.city ?? "");
        setPlace(draft.place ?? "");
        setProvince(draft.province ?? "");
        setCountry(draft.country || "Nederland");
        setMunicipality(draft.municipality ?? "");
        setMunicipalityId(draft.municipalityId);
        setIndustry(draft.industry ?? "");
        setKvkNumber(draft.kvkNumber ?? "");
        setVatNumber(draft.vatNumber ?? "");
        setStep(3);
      } catch {
        window.sessionStorage.removeItem(GOOGLE_ONBOARDING_DRAFT_KEY);
      }
    });
    return () => {
      active = false;
    };
  }, [googleProfile]);

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

  const saveGoogleDraft = () => {
    const draft: GoogleOnboardingDraft = {
      name,
      email,
      phone,
      address,
      postcode,
      city,
      place,
      province,
      country,
      municipality,
      municipalityId,
      industry,
      kvkNumber,
      vatNumber,
    };
    window.sessionStorage.setItem(GOOGLE_ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  };

  const fillCurrentLocation = async (latitude: number, longitude: number) => {
    const response = await fetch("/api/location/reverse", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });
    const result = (await response.json()) as {
      ok?: boolean;
      city?: string;
      municipality?: string;
      province?: string;
      country?: string;
      error?: string;
    };
    if (!response.ok || !result.ok || !result.city || !result.province) {
      throw new Error(result.error || "Je locatie kon niet worden bepaald.");
    }

    setCity(result.city);
    setProvince(result.province);
    setCountry(result.country || "Nederland");
    setMunicipality(result.municipality || result.city);
    setMunicipalityId(getMunicipalityByName(result.municipality || result.city)?.id);
    setLocationStatus("success");
    setLocationMessage(`${result.city}, ${result.province} is ingevuld. Controleer of dit je vestigingsplaats is.`);
  };

  const useCurrentLocation = async () => {
    setLocationMessage(null);
    setLocationStatus("loading");

    if (Capacitor.getPlatform() === "android") {
      try {
        const permission = await Geolocation.requestPermissions({ permissions: ["coarseLocation"] });
        if (permission.coarseLocation !== "granted" && permission.location !== "granted") {
          setLocationStatus("error");
          setLocationMessage("Locatietoegang is geweigerd. Je kunt je plaats hieronder handmatig invullen.");
          return;
        }
        const { coords } = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 12_000,
          maximumAge: 5 * 60_000,
        });
        await fillCurrentLocation(coords.latitude, coords.longitude);
      } catch (locationError) {
        const code =
          locationError && typeof locationError === "object" && "code" in locationError
            ? String(locationError.code)
            : "";
        setLocationStatus("error");
        setLocationMessage(
          code === "OS-PLUG-GLOC-0003"
            ? "Locatietoegang is geweigerd. Je kunt je plaats hieronder handmatig invullen."
            : code === "OS-PLUG-GLOC-0007" || code === "OS-PLUG-GLOC-0017"
              ? "Locatie staat uit op je telefoon. Zet locatie aan of vul je plaats handmatig in."
              : locationError instanceof Error
                ? locationError.message
                : "Je locatie is niet beschikbaar. Vul je plaats hieronder handmatig in.",
        );
      }
      return;
    }

    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationMessage("Locatie delen wordt niet ondersteund in deze browser. Vul je plaats handmatig in.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void fillCurrentLocation(coords.latitude, coords.longitude).catch((locationError) => {
          setLocationStatus("error");
          setLocationMessage(
            locationError instanceof Error
              ? locationError.message
              : "Je locatie kon niet worden bepaald. Vul je plaats handmatig in.",
          );
        });
      },
      (locationError) => {
        setLocationStatus("error");
        if (locationError.code === locationError.PERMISSION_DENIED) {
          setLocationMessage("Locatietoegang is geweigerd. Je kunt je plaats hieronder handmatig invullen.");
        } else if (locationError.code === locationError.TIMEOUT) {
          setLocationMessage("Het bepalen van je locatie duurde te lang. Probeer het opnieuw of vul je plaats handmatig in.");
        } else {
          setLocationMessage("Je locatie is niet beschikbaar. Vul je plaats hieronder handmatig in.");
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 5 * 60_000 },
    );
  };

  const canNext =
    step === 0 ? name.trim().length > 1 && !!industry :
    step === 1 ? !!country && !!province && !!city :
    step === 2 ? !!address && !!postcode && !!phone :
    step === 3 ? Boolean(googleProfile) || (!!email && password.length >= 10) :
    step === 4 ? true :
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
      try {
        const companyInput = {
          companyName: name,
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
        };
        const res = await withTimeout(
          googleProfile
            ? signUpWithGoogle(companyInput)
            : signUp({ ...companyInput, email, password })
        );
        if (!res.ok) {
          setError(res.error ?? "Account aanmaken mislukt");
          return;
        }
        window.sessionStorage.removeItem(GOOGLE_ONBOARDING_DRAFT_KEY);
        setAccountCreated(true);
        setSelectedNetworks(recommendedNetworks.map((n) => n.id));
        setStep(4);
      } catch (actionError) {
        setError(onboardingErrorMessage(actionError));
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 4) {
      setStep(5);
      return;
    }
    if (step === 5) {
      setLoading(true);
      setError(null);
      try {
        const joined = await withTimeout(joinNetworks(selectedNetworks));
        if (!joined.ok) {
          setError(joined.error ?? "Je netwerken konden niet worden opgeslagen.");
          return;
        }
        try {
          const { completeOnboarding } = await import("@/lib/help-actions-server");
          await withTimeout(completeOnboarding(goals, experienceLevel), 15_000);
        } catch {
          // De persoonlijke rondleiding mag een succesvol account niet blokkeren.
        }
        router.replace("/feed");
        router.refresh();
      } catch (actionError) {
        setError(onboardingErrorMessage(actionError));
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  return (
    <div
      className="native-onboarding relative flex min-h-screen flex-col bg-background text-foreground"
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
      <div className="native-onboarding__header relative flex items-center justify-between px-6 py-5">
        <VyntaBrand size={34} className="min-h-11" textClassName="native-onboarding__brand-text" />
        <div className="flex items-center gap-3">
          <span className="native-onboarding__step-label">Stap {step + 1} van 6</span>
          <Link href={step === 0 ? "/" : "/auth"} className="native-onboarding__close" aria-label="Aanmelden sluiten">
            <X size={18} />
          </Link>
        </div>
      </div>

      <div className="native-onboarding__progress mx-auto flex w-full max-w-md gap-2 px-6">
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

      <div className="native-onboarding__content flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-8">
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
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locationStatus === "loading"}
                  data-testid="use-current-location"
                  className="mt-7 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2 disabled:cursor-wait disabled:opacity-70"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background">
                    {locationStatus === "loading" ? <LoaderCircle size={19} className="animate-spin" /> : <LocateFixed size={19} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">
                      {locationStatus === "loading" ? "Locatie bepalen…" : locationStatus === "success" ? "Locatie opnieuw bepalen" : "Gebruik mijn locatie"}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-muted">
                      Alleen om stad, gemeente en provincie in te vullen
                    </span>
                  </span>
                </button>
                {locationMessage && (
                  <p
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "mt-3 rounded-xl border px-3.5 py-3 text-sm leading-5",
                      locationStatus === "success"
                        ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-200",
                    )}
                  >
                    {locationMessage}
                  </p>
                )}
                <div className="mt-8 grid gap-3">
                  <input
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
                {googleProfile ? (
                  <div className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white"><GoogleIcon size={20} /></span>
                    <div className="min-w-0"><p className="font-semibold text-foreground">Google is gekoppeld</p><p className="truncate text-sm text-muted">{googleProfile.email}</p></div>
                    <Check size={18} className="ml-auto shrink-0 text-emerald-500" />
                  </div>
                ) : (
                  <>
                    <GoogleAuthButton
                      className="mt-8 border border-border"
                      onBeforeStart={saveGoogleDraft}
                      onError={(message) => setError(message || null)}
                    />
                    <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />of met e-mail<span className="h-px flex-1 bg-border" /></div>
                  </>
                )}
                {!googleProfile && <div className="grid gap-3">
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
                    placeholder="Wachtwoord (min. 10 tekens)"
                    className="w-full rounded-2xl bg-surface px-4 py-3.5 text-[17px] outline-none placeholder:text-muted focus:ring-1 focus:ring-inset focus:ring-border-strong"
                  />
                </div>}
                {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
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
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="native-onboarding__actions mx-auto flex w-full max-w-md gap-3 px-6 pb-10">
        {step > 0 && !(accountCreated && step >= 4) && (
          <Button
            onClick={() => setStep((s) => s - 1)}
            size="lg"
            variant="outline"
            className="native-onboarding__back-action"
          >
            Terug
          </Button>
        )}
        <Button
          onClick={next}
          size="lg"
          disabled={!canNext || loading}
          className={step > 0 ? "native-onboarding__primary-action min-w-0 flex-1 px-3" : "w-full"}
          variant="accent"
        >
          {step === 3 ? (loading ? "Bezig…" : "Account aanmaken") : step === 5 ? (loading ? "Bezig…" : "Klaar met instellen") : step === 4 ? "Verder" : "Doorgaan"}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
