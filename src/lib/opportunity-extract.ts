import type { ServiceCategory } from "./types";

export interface ExtractedData {
  title: string;
  categoryId?: string;
  opportunityType: string;
  quantity?: string;
  unit?: string;
  municipality?: string;
  startDate?: string;
  duration?: string;
  budgetType?: string;
  keywords: string[];
  confidence: "high" | "medium" | "low";
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  job: ["personeel", "medewerker", "medewerkers", "vacature", "functie", "kracht", "krachten", "uitzend", "detachering", "vast", "tijdelijk", "magazijn", "chauffeur", "schoonmaak", "administratief", "horeca", "bouwer", "elektricien", "schilder", "vakman"],
  sourcing: ["inkopen", "inkoop", "bestellen", "leverancier", "kopen", "gezocht", "zoeken", "nodig", "bestelling", "voorraad", "materiaal", "grondstof", "producten"],
  offer: ["bieden", "aanbod", "beschikbaar", "restpartij", "overtollig", "overschot", "te koop", "leveren", "capaciteit", "retourvracht"],
  capacity: ["capaciteit", "opslag", "ruimte", "magazijnruimte", "koelruimte", "productiecapaciteit"],
  partnership: ["samenwerking", "partner", "samenwerken", "onderaannemer", "onderaanneming", "distributiepartner"],
  transport: ["transport", "vervoer", "levering", "bezorgen", "distributie", "logistiek", "vracht", "spoedtransport"],
  urgent: ["spoed", "dringend", "vandaag", "nu", "direct", "zo snel mogelijk"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "cat-bouw-groen": ["hovenier", "tuin", "groen", "groenvoorziening", "terras", "beplanting", "bomen", "struiken", "gazon"],
  "cat-bouw-terras": ["terras", "terrasaanleg", "vlonder", "bestrating terras", "tuinverharding"],
  "cat-bouw-bestrating": ["bestrating", "klinkers", "tegels", "asfalt", "wegwerk", "parkeerplaats"],
  "cat-bouw-verbouw": ["verbouw", "renovatie", "verbouwing", "aanbouw", "uitbouw", "interieur"],
  "cat-bouw-schilder": ["schilder", "schilderwerk", "verf", "lakken", "coating"],
  "cat-bouw-dak": ["dak", "dakwerk", "dakbedekking", "goot", "daklekkage"],
  "cat-bouw-installatie": ["installatie", "elektricien", "elektra", "sanitair", "leiding", "verwarming", "cv", "ventilatie", "airco"],
  "cat-pers-magazijn": ["magazijn", "magazijnmedewerker", "magazijnmedewerkers", "orderpicker", "heftruck", "reachtruck", "inpakker"],
  "cat-pers-chauffeur": ["chauffeur", "chauffeurs", "vrachtwagen", "bestelbus", "bezorger", "chauffeurs"],
  "cat-pers-admin": ["administratief", "administratie", "office", "receptioniste", "secretaresse", "boekhouder"],
  "cat-pers-tech": ["technisch", "technicus", "monteur", "onderhoudsmonteur", "service technician"],
  "cat-pers-horeca": ["horeca", "kok", "chef", "bediening", "barista", "ober", "keukenhulp"],
  "cat-pers-schoonmaak": ["schoonmaak", "schoonmaker", "schoonmaakmedewerker", "reiniging", "cleaning"],
  "cat-inkoop-verpakking": ["verpakking", "dozen", "karton", "golfkarton", "folie", "pallets", "verpakkingsmateriaal", "dubbelwandig"],
  "cat-inkoop-grondstof": ["grondstof", "grondstoffen", "metaal", "staal", "aluminium", "plastic", "hout", "chemie"],
  "cat-inkoop-kantoor": ["kantoor", "kantoorbenodigdheden", "papier", "printers", "bureaubenodigdheden"],
  "cat-inkoop-voeding": ["voeding", "eten", "drinken", "voedsel", "ingrediënten", "dranken", "biologisch"],
  "cat-inkoop-restpartij": ["restpartij", "overtollig", "overschot", "restant", "clearance", "partij"],
  "cat-trans-spoed": ["spoedtransport", "spoed levering", "express", "courier", "zelfde dag"],
  "cat-trans-distributie": ["distributie", "levering", "bezorgen", "distribueren", "route"],
  "cat-trans-internationaal": ["internationaal", "export", "import", "grens", "europa", "benelux"],
  "cat-trans-koel": ["koel", "koeltransport", "gekoeld", "vries", "koelketen"],
  "cat-opslag-tijdelijk": ["opslag", "tijdelijke opslag", "magazijnruimte", "opslagruimte", "ruimte"],
  "cat-opslag-koud": ["koelopslag", "koelruimte", "vriesruimte", "gekoelde opslag"],
  "cat-opslag-capaciteit": ["productiecapaciteit", "machinecapaciteit", "vrije capaciteit"],
  "cat-samen-onderaannemer": ["onderaannemer", "onderaanneming", "uitbesteden", "inhuur"],
  "cat-samen-partner": ["samenwerking", "partner", "strategisch", "joint venture"],
  "cat-prod-metaal": ["metaalbewerking", "cnc", "verspaning", "lassen", "buigen", "metaal"],
  "cat-prod-hout": ["houtbewerking", "hout", "timmeren", "schragen", "houtwerk"],
  "cat-prod-plastic": ["plastic", "kunststof", "spuitgieten", "plasticverwerking"],
  "cat-tech-website": ["website", "webshop", "ecommerce", "webshop", "online store", "site"],
  "cat-tech-software": ["software", "app", "applicatie", "systeem", "programmeer", "ontwikkeling", "developer"],
  "cat-tech-it": ["it", "infrastructuur", "server", "netwerk", "cloud", "cybersecurity"],
  "cat-mkt-design": ["design", "branding", "logo", "huisstijl", "ontwerp"],
  "cat-mkt-content": ["content", "social media", "instagram", "linkedin", "facebook", "video"],
  "cat-mkt-seo": ["seo", "google", "online marketing", "adwords", "zoekmachine"],
  "cat-fin-boekhouding": ["boekhouding", "administratie", "belasting", "btw", "jaarrekening"],
  "cat-fin-juridisch": ["juridisch", "advocaat", "advocaat", "contract", "jurist"],
  "cat-fin-verzekering": ["verzekering", "verzekeraar", "polis", "dekking"],
  "cat-overig-catering": ["catering", "buffet", "diner", "lunch", "hapjes", "borrel"],
  "cat-overig-beveiliging": ["beveiliging", "bewaking", "beveiliger", "alarm"],
  "cat-overig-schoonmaak": ["schoonmaakbedrijf", "schoonmaakdienst", "reinigingsbedrijf", "glazenwasser"],
};

const DUTCH_CITIES = [
  "amsterdam", "rotterdam", "den haag", "utrecht", "eindhoven", "tilburg", "groningen",
  "almere", "breda", "nijmegen", "enschede", "apeldoorn", "haarlem", "arnhem", "amersfoort",
  "zaandam", "'s-hertogenbosch", "den bosch", "leiden", "dordrecht", "zoetermeer", "zwolle",
  "deventer", "lelystad", "alkmaar", "leeuwarden", "maastricht", "delft", "heerlen",
  "purmerend", "vlaardingen", "schiedam", "capelle aan den ijssel", "kerkrade", "gouda",
  "wageningen", "veenendaal", "houten", "nieuwegein", "ijsselstein", "maassluis",
];

const DURATION_PATTERNS = [
  { regex: /(\d+)\s*weken?/i, label: (m: RegExpMatchArray) => `${m[1]} weken` },
  { regex: /(\d+)\s*maanden?/i, label: (m: RegExpMatchArray) => `${m[1]} maanden` },
  { regex: /(\d+)\s*dagen?/i, label: (m: RegExpMatchArray) => `${m[1]} dagen` },
  { regex: /(\d+)\s*uren?/i, label: (m: RegExpMatchArray) => `${m[1]} uren` },
  { regex: /(\d+)\s*jaar/i, label: (m: RegExpMatchArray) => `${m[1]} jaar` },
  { regex: /ongeveer\s*(\d+)\s*(weken?|maanden?|dagen?)/i, label: (m: RegExpMatchArray) => `circa ${m[1]} ${m[2]}` },
];

const START_PATTERNS = [
  { regex: /volgende\s*week/i, label: "Volgende week" },
  { regex: /deze\s*week/i, label: "Deze week" },
  { regex: /morgen/i, label: "Morgen" },
  { regex: /vandaag/i, label: "Vandaag" },
  { regex: /volgende\s*maand/i, label: "Volgende maand" },
  { regex: /in\s*januari/i, label: "Januari" },
  { regex: /in\s*februari/i, label: "Februari" },
  { regex: /in\s*maart/i, label: "Maart" },
  { regex: /in\s*april/i, label: "April" },
  { regex: /in\s*mei/i, label: "Mei" },
  { regex: /in\s*juni/i, label: "Juni" },
  { regex: /in\s*juli/i, label: "Juli" },
  { regex: /in\s*augustus/i, label: "Augustus" },
  { regex: /in\s*september/i, label: "September" },
  { regex: /in\s*oktober/i, label: "Oktober" },
  { regex: /in\s*november/i, label: "November" },
  { regex: /in\s*december/i, label: "December" },
  { regex: /vanaf\s*maandag/i, label: "Vanaf maandag" },
  { regex: /direct/i, label: "Direct" },
  { regex: /zo\s*snel\s*mogelijk/i, label: "Zo snel mogelijk" },
  { regex: /binnen\s*(\d+)\s*dagen?/i, label: (m: RegExpMatchArray) => `Binnen ${m[1]} dagen` },
  { regex: /binnen\s*(\d+)\s*weken?/i, label: (m: RegExpMatchArray) => `Binnen ${m[1]} weken` },
];

const QUANTITY_PATTERNS = [
  { regex: /(\d+)\s*(magazijnmedewerkers?|medewerkers?|personen|krachten?|mannen|vrouwen)/i, unit: "personen" },
  { regex: /(\d+)\s*(stuks?|stuk|st\.?)/i, unit: "stuks" },
  { regex: /(\d[\d.]*)\s*(m²|m2|vierkante\s*meter)/i, unit: "m²" },
  { regex: /(\d[\d.]*)\s*(m³|m3|kubieke\s*meter)/i, unit: "m³" },
  { regex: /(\d[\d.]*)\s*(kg|kilo|kilogram)/i, unit: "kg" },
  { regex: /(\d[\d.]*)\s*(ton)/i, unit: "ton" },
  { regex: /(\d[\d.]*)\s*(liter|l\b)/i, unit: "liter" },
  { regex: /(\d[\d.]*)\s*(pallets?|pallet)/i, unit: "pallets" },
  { regex: /(\d[\d.]*)\s*(dozen?|doos)/i, unit: "dozen" },
  { regex: /(\d[\d.]*)\s*(meter|m\b)/i, unit: "meter" },
];

const BUDGET_PATTERNS = [
  { regex: /€\s*(\d[\d.]*)/i, type: "fixed" },
  { regex: /(\d[\d.]*)\s*euro/i, type: "fixed" },
  { regex: /budget\s*(in\s*overleg|nog\s*bespreken)/i, type: "open" },
  { regex: /prijs\s*(in\s*overleg|nog\s*bespreken)/i, type: "discuss" },
];

function matchFirst<T extends { regex: RegExp }>(patterns: T[], text: string): { match: RegExpMatchArray; pattern: T } | null {
  for (const p of patterns) {
    const m = text.match(p.regex);
    if (m) return { match: m, pattern: p };
  }
  return null;
}

export function extractFromText(text: string, categories: ServiceCategory[]): ExtractedData {
  const lower = text.toLowerCase();
  const keywords: string[] = [];

  // Detect opportunity type
  let opportunityType = "request";
  let typeScore = 0;
  for (const [type, words] of Object.entries(TYPE_KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      if (lower.includes(w)) score++;
    }
    if (score > typeScore) {
      typeScore = score;
      opportunityType = type;
    }
  }
  if (opportunityType === "urgent") {
    opportunityType = "request";
  }

  // Detect category
  let categoryId: string | undefined;
  let catScore = 0;
  for (const [catId, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      if (lower.includes(w)) {
        score++;
        keywords.push(w);
      }
    }
    if (score > catScore) {
      catScore = score;
      categoryId = catId;
    }
  }

  // Detect city
  let municipality: string | undefined;
  for (const city of DUTCH_CITIES) {
    if (lower.includes(city)) {
      municipality = city.charAt(0).toUpperCase() + city.slice(1);
      break;
    }
  }

  // Detect duration
  let duration: string | undefined;
  const durMatch = matchFirst(DURATION_PATTERNS, text);
  if (durMatch) {
    const p = durMatch.pattern as { label: string | ((m: RegExpMatchArray) => string) };
    duration = typeof p.label === "function" ? p.label(durMatch.match) : p.label;
  }

  // Detect start date
  let startDate: string | undefined;
  const startMatch = matchFirst(START_PATTERNS, text);
  if (startMatch) {
    const p = startMatch.pattern as { label: string | ((m: RegExpMatchArray) => string) };
    startDate = typeof p.label === "function" ? p.label(startMatch.match) : p.label;
  }

  // Detect quantity
  let quantity: string | undefined;
  let unit: string | undefined;
  const qtyMatch = matchFirst(QUANTITY_PATTERNS, text);
  if (qtyMatch) {
    quantity = qtyMatch.match[1].replace(/\./g, "");
    unit = (qtyMatch.pattern as { unit: string }).unit;
  }

  // Detect budget
  let budgetType: string | undefined;
  const budgetMatch = matchFirst(BUDGET_PATTERNS, text);
  if (budgetMatch) {
    budgetType = (budgetMatch.pattern as { type: string }).type;
  }

  // Generate title from text
  const title = generateTitle(text, opportunityType, quantity, unit, municipality);

  // Confidence
  const dataPoints = [categoryId, municipality, startDate, quantity, duration].filter(Boolean).length;
  const confidence: "high" | "medium" | "low" =
    dataPoints >= 3 ? "high" : dataPoints >= 2 ? "medium" : "low";

  return {
    title,
    categoryId,
    opportunityType,
    quantity,
    unit,
    municipality,
    startDate,
    duration,
    budgetType,
    keywords: [...new Set(keywords)],
    confidence,
  };
}

function generateTitle(text: string, type: string, quantity?: string, unit?: string, city?: string): string {
  // Try to create a concise title from the input
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 60) return cleaned;

  // Try to extract key parts
  const parts: string[] = [];
  if (quantity && unit) {
    parts.push(`${quantity} ${unit}`);
  }

  // For personnel
  if (type === "job") {
    const jobMatch = text.match(/(\d+)\s*(magazijnmedewerkers?|chauffeurs?|schoonmakers?|schilders?|bouwwerkers?|elektriciens?|kok|koks|ober|bediening)/i);
    if (jobMatch) {
      parts.push(jobMatch[2].toLowerCase());
    }
  }

  if (city) parts.push(city);

  if (parts.length > 0) {
    const title = parts.join(" · ");
    if (title.length <= 60) return title;
  }

  return cleaned.slice(0, 57) + "...";
}

export function getCategoryPath(categoryId: string, categories: ServiceCategory[]): string {
  const path: string[] = [];
  let current = categories.find((c) => c.id === categoryId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? categories.find((c) => c.id === current!.parentId) : undefined;
  }
  return path.join(" → ");
}

export function formatSummary(data: ExtractedData, categories: ServiceCategory[]): string[] {
  const parts: string[] = [];
  if (data.municipality) parts.push(data.municipality);
  if (data.startDate) parts.push(`Start ${data.startDate.toLowerCase()}`);
  if (data.duration) parts.push(`Circa ${data.duration.toLowerCase()}`);
  if (data.quantity && data.unit) parts.push(`${data.quantity} ${data.unit}`);
  return parts;
}
