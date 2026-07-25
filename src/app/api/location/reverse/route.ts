import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ReverseDoc = {
  woonplaatsnaam?: string;
  gemeentenaam?: string;
  provincienaam?: string;
};

const NETHERLANDS_BOUNDS = {
  minLatitude: 50.6,
  maxLatitude: 53.8,
  minLongitude: 3.1,
  maxLongitude: 7.3,
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && requestHost) && new URL(origin as string).host === requestHost;
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) {
    return NextResponse.json({ ok: false, error: "Dit locatieverzoek is niet toegestaan." }, { status: 403 });
  }

  let body: { latitude?: unknown; longitude?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Ongeldige locatie." }, { status: 400 });
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ ok: false, error: "Ongeldige locatie." }, { status: 400 });
  }

  const inTheNetherlands =
    latitude >= NETHERLANDS_BOUNDS.minLatitude &&
    latitude <= NETHERLANDS_BOUNDS.maxLatitude &&
    longitude >= NETHERLANDS_BOUNDS.minLongitude &&
    longitude <= NETHERLANDS_BOUNDS.maxLongitude;
  if (!inTheNetherlands) {
    return NextResponse.json(
      { ok: false, error: "Deze locatie ligt niet in Nederland. Vul je vestigingsplaats handmatig in." },
      { status: 422 },
    );
  }

  const endpoint = new URL("https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse");
  // Circa 10 meter nauwkeurigheid is ruim voldoende voor plaats en provincie.
  endpoint.searchParams.set("lat", latitude.toFixed(4));
  endpoint.searchParams.set("lon", longitude.toFixed(4));
  endpoint.searchParams.set("rows", "1");
  endpoint.searchParams.set("type", "adres");
  endpoint.searchParams.set("fl", "woonplaatsnaam,gemeentenaam,provincienaam");

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`PDOK returned ${response.status}`);

    const payload = (await response.json()) as { response?: { docs?: ReverseDoc[] } };
    const location = payload.response?.docs?.[0];
    const city = location?.woonplaatsnaam?.trim();
    const municipality = location?.gemeentenaam?.trim();
    const province = location?.provincienaam?.trim();
    if (!city || !province) {
      return NextResponse.json(
        { ok: false, error: "We konden hier geen Nederlandse plaats bij vinden. Vul je locatie handmatig in." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        city,
        municipality: municipality || city,
        province,
        country: "Nederland",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "De locatieservice reageert niet. Vul je locatie handmatig in of probeer het opnieuw." },
      { status: 502 },
    );
  }
}
