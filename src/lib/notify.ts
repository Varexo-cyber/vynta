/**
 * Berichten aan de beheerder. Eerst opslaan, dan pas proberen te versturen.
 *
 * HET PROBLEEM DAT DIT OPLOST. info@vynta.nl bestaat nog niet. Zou dit alleen
 * mailen, dan zijn alle aanmeldingen tot de dag dat die mailbox er is
 * stilzwijgend verdwenen -- en dat merk je pas als je je afvraagt waarom er
 * niemand langskomt.
 *
 * Dus: elk bericht gaat EERST de database in. Versturen is een tweede stap die
 * mag mislukken. Zodra de mailbox er is staat de hele achterstand er nog, en
 * `/owner` laat hem zien ook zonder dat er ooit een mail uit is gegaan.
 *
 * GEEN NIEUWE AFHANKELIJKHEID. Er zit geen nodemailer of SDK in dit project en
 * die hoeft er ook niet in: Resend heeft een gewone HTTP-API en `fetch` zit in
 * Node. Staat `RESEND_API_KEY` niet in de omgeving, dan blijft het bericht
 * netjes op `queued` staan en gebeurt er verder niets.
 */

import { sql } from "@/lib/db";
import { ADMIN_EMAILS } from "@/lib/kvk";

export type AdminNotification = {
  kind: string;
  subject: string;
  body: string;
  companyId?: string | null;
  recipients?: readonly string[];
};

/**
 * Zet het bericht klaar en probeer het te versturen.
 *
 * Gooit NOOIT. Een aanmelding mag niet stuklopen omdat een mailserver eruit
 * ligt -- de gebruiker heeft daar niets mee te maken en het bericht staat al
 * veilig in de database.
 */
export async function notifyAdmins(input: AdminNotification): Promise<void> {
  const recipients = [...(input.recipients ?? ADMIN_EMAILS)];
  let id: string | null = null;

  try {
    const [row] = await sql`
      INSERT INTO admin_notifications (kind, subject, body, recipients, company_id, status)
      VALUES (${input.kind}, ${input.subject}, ${input.body},
              ${recipients}, ${input.companyId ?? null}, 'queued')
      RETURNING id`;
    id = row?.id as string;
  } catch (error) {
    // Lukt zelfs het opslaan niet, dan is er iets grondig mis met de database.
    // Dat mag de aanmelding niet slopen, maar het moet wel in de logs staan.
    console.error("[notify] kon bericht niet opslaan", error);
    return;
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM ?? "Vynta <onboarding@resend.dev>";
  if (!key) {
    // Nog geen mailbox. Het bericht staat klaar; niets verloren.
    await markeer(id, "skipped", "RESEND_API_KEY ontbreekt");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject: input.subject,
        text: input.body,
      }),
    });
    if (!res.ok) {
      await markeer(id, "failed", `HTTP ${res.status}: ${await res.text()}`);
      return;
    }
    await markeer(id, "sent", null);
  } catch (error) {
    await markeer(id, "failed", String(error));
  }
}

async function markeer(id: string | null, status: string, error: string | null) {
  if (!id) return;
  try {
    await sql`
      UPDATE admin_notifications
         SET status = ${status},
             error = ${error},
             attempts = attempts + 1,
             sent_at = CASE WHEN ${status} = 'sent' THEN now() ELSE sent_at END
       WHERE id = ${id}`;
  } catch (e) {
    console.error("[notify] kon status niet bijwerken", e);
  }
}

/**
 * Het bericht dat de beheerder krijgt bij een account zonder KVK.
 *
 * Alles wat nodig is om het te beoordelen staat erin, zodat niemand eerst hoeft
 * in te loggen om te zien waar het over gaat.
 */
export function reviewBericht(bedrijf: {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
  adres: string;
  postcode: string;
  stad: string;
  provincie: string;
  sector: string;
  website?: string | null;
  kvkRuw?: string | null;
  reden: string;
}): AdminNotification {
  const regels = [
    `Nieuw account onder review: ${bedrijf.naam}`,
    "",
    `Reden        : ${bedrijf.reden}`,
    `Bedrijf      : ${bedrijf.naam}`,
    `E-mail       : ${bedrijf.email}`,
    `Telefoon     : ${bedrijf.telefoon}`,
    `Adres        : ${bedrijf.adres}, ${bedrijf.postcode} ${bedrijf.stad}`,
    `Provincie    : ${bedrijf.provincie}`,
    `Sector       : ${bedrijf.sector}`,
    `Website      : ${bedrijf.website || "-"}`,
    `KVK ingevuld : ${bedrijf.kvkRuw || "-"}`,
    "",
    `Bedrijfs-ID  : ${bedrijf.id}`,
    "",
    "Het account werkt gewoon; beoordelen kan in het ownerpaneel.",
  ];
  return {
    kind: "company_review",
    subject: `[Vynta] Account onder review — ${bedrijf.naam}`,
    body: regels.join("\n"),
    companyId: bedrijf.id,
  };
}
