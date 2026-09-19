/**
 * KVK-nummers: normaliseren, controleren, en één account per nummer.
 *
 * WAAROM DIT EEN EIGEN BESTAND IS. Een KVK-nummer komt op drie plekken binnen
 * (aanmelden met wachtwoord, aanmelden met Google, bedrijf bewerken) en moet op
 * alle drie precies hetzelfde behandeld worden. Zodra dezelfde regel op drie
 * plekken staat, gaan er twee wegdrijven -- dat is het patroon dat dit project
 * al vaker gezien heeft.
 */

/** De twee adressen die bericht krijgen bij een account onder review. */
export const ADMIN_EMAILS = ["info@varexo.nl", "info@vynta.nl"] as const;

/**
 * Alleen de cijfers overhouden. `null` als er niets overblijft.
 *
 * Mensen tikken "KVK 12345678", "1234.5678" of met een spatie erin. Dat is
 * allemaal hetzelfde nummer, en zonder normaliseren levert elke schrijfwijze
 * een eigen account op -- precies wat de unieke index moet voorkomen.
 */
export function normalizeKvk(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

/**
 * Een Nederlands KVK-nummer is ACHT CIJFERS. Meer niet.
 *
 * Er zit geen controlegetal in zoals bij een BSN, dus verder dan de lengte
 * kunnen we niet komen zonder het Handelsregister te bevragen. Doen alsof we
 * meer kunnen controleren zou een zekerheid suggereren die er niet is.
 */
export function isValidKvk(normalized: string | null): boolean {
  return normalized !== null && /^\d{8}$/.test(normalized);
}

/** Leesbaar terugtonen: 12345678. Geen streepjes, zo staat het ook bij de KVK. */
export function formatKvk(normalized: string | null): string {
  return normalized ?? "";
}

export type KvkCheck =
  | { ok: true; normalized: string }
  | { ok: false; reden: "vorm" | "bezet"; melding: string };

/**
 * De foutmeldingen staan HIER en niet in de formulieren.
 *
 * Elke melding zegt wat er mis is EN wat de gebruiker nu moet doen. Een
 * melding als "KVK ongeldig" laat iemand met lege handen achter; dan sluit hij
 * het tabblad en komt hij niet terug. De verwijzing naar /help hoort erin,
 * want daar staat de uitleg voor het geval dat iemand anders jouw KVK al heeft
 * gebruikt -- en dat is precies het moment waarop mensen afhaken.
 */
export const KVK_MELDINGEN = {
  vorm:
    "Een KVK-nummer bestaat uit acht cijfers. Controleer het nummer op je " +
    "uittreksel, of ga verder zonder KVK — dan kijken wij het na.",
  bezet:
    "Er bestaat al een Vynta-account met dit KVK-nummer. Per bedrijf is er één " +
    "account. Ben jij de eigenaar en heb je geen toegang? Kijk op de hulppagina " +
    "of neem contact op via info@vynta.nl, dan zetten wij het over.",
} as const;

export function checkKvkVorm(raw: string | null | undefined): KvkCheck {
  const normalized = normalizeKvk(raw);
  if (normalized === null) {
    return { ok: false, reden: "vorm", melding: KVK_MELDINGEN.vorm };
  }
  if (!isValidKvk(normalized)) {
    return { ok: false, reden: "vorm", melding: KVK_MELDINGEN.vorm };
  }
  return { ok: true, normalized };
}
