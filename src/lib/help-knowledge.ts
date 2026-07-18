import type { HelpActionId } from "./help-actions";

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: HelpCategory;
  keywords: string[];
  answer: string;
  steps?: string[];
  actions?: HelpActionId[];
  tourId?: string;
  lastUpdated: string;
  contextRoutes?: string[];
}

export type HelpCategory =
  | "start"
  | "account"
  | "profile"
  | "feed"
  | "networks"
  | "search"
  | "messages"
  | "calls"
  | "files"
  | "privacy"
  | "notifications"
  | "reporting"
  | "faq";

export const HELP_CATEGORIES: { id: HelpCategory; label: string; icon: string }[] = [
  { id: "start", label: "Aan de slag", icon: "Rocket" },
  { id: "account", label: "Account en inloggen", icon: "KeyRound" },
  { id: "profile", label: "Bedrijfsprofiel", icon: "Building2" },
  { id: "feed", label: "Feed en berichten", icon: "Newspaper" },
  { id: "networks", label: "Netwerken", icon: "Users" },
  { id: "search", label: "Zoeken", icon: "Search" },
  { id: "messages", label: "Berichten en gesprekken", icon: "MessageSquare" },
  { id: "calls", label: "Audio- en videobellen", icon: "Phone" },
  { id: "files", label: "Bestanden en media", icon: "Paperclip" },
  { id: "privacy", label: "Privacy en veiligheid", icon: "ShieldCheck" },
  { id: "notifications", label: "Meldingen", icon: "Bell" },
  { id: "reporting", label: "Rapporteren en blokkeren", icon: "Flag" },
  { id: "faq", label: "Veelgestelde vragen", icon: "HelpCircle" },
];

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: "edit-company-logo",
    title: "Bedrijfslogo wijzigen",
    category: "profile",
    keywords: [
      "logo wijzigen",
      "profielfoto aanpassen",
      "bedrijfsfoto",
      "logo uploaden",
      "logo veranderen",
      "bedrijfslogo aanpassen",
      "afbeelding profiel",
    ],
    answer:
      "Je wijzigt je bedrijfslogo via de instellingen. Open de bedrijfsgegevens en upload een nieuwe afbeelding.",
    steps: [
      "Open Instellingen.",
      "Klik op 'Bedrijfsgegevens'.",
      "Klik op het huidige logo of de placeholder.",
      "Upload een nieuwe afbeelding.",
      "Sla de wijziging op.",
    ],
    actions: ["EDIT_COMPANY_LOGO"],
    tourId: "edit-logo",
    lastUpdated: "2025-01-15",
    contextRoutes: ["/settings", "/company"],
  },
  {
    id: "edit-company-profile",
    title: "Bedrijfsprofiel bewerken",
    category: "profile",
    keywords: [
      "profiel bewerken",
      "bedrijfsgegevens wijzigen",
      "bedrijf aanpassen",
      "profiel aanpassen",
      "gegevens wijzigen",
      "bedrijfsprofiel wijzigen",
      "waar wijzig ik mijn bedrijfsprofiel",
      "bedrijf gegevens aanpassen",
      "mijn profiel aanpassen",
    ],
    answer:
      "Je kunt je bedrijfsgegevens bewerken via Instellingen > Bedrijfsgegevens. Pas naam, omschrijving, contactgegevens en meer aan.",
    steps: [
      "Open Instellingen.",
      "Klik op 'Bedrijfsgegevens'.",
      "Pas de gewenste velden aan.",
      "Klik op 'Opslaan'.",
    ],
    actions: ["EDIT_COMPANY_PROFILE"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/settings", "/company"],
  },
  {
    id: "create-post",
    title: "Een bericht plaatsen",
    category: "feed",
    keywords: [
      "bericht plaatsen",
      "post maken",
      "bericht maken",
      "plaatsen",
      "nieuw bericht",
      "bericht aanmaken",
      "feed bericht",
      "plaats bericht",
      "post op feed",
      "plaatsen op feed",
      "posten op feed",
      "waar post ik",
      "waar plaats ik",
      "openbaar bericht",
      "iets plaatsen op feed",
      "hoe post ik",
      "op de feed",
      "op mn feed",
      "op mijn feed",
      "feed plaatsen",
      "feed posten",
    ],
    answer:
      "Open 'Plaats bericht' en kies het type bericht. Vul de inhoud in, kies je netwerken en plaats het bericht.",
    steps: [
      "Klik op 'Plaats bericht' (de plusknop).",
      "Kies het berichttype (bijv. Aanbod, Vraag, Vacature).",
      "Schrijf een titel en beschrijving.",
      "Voeg eventueel media toe.",
      "Kies in welke netwerken het bericht zichtbaar is.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_POST"],
    tourId: "first-offer",
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "create-vacancy",
    title: "Een vacature plaatsen",
    category: "feed",
    keywords: [
      "vacature plaatsen",
      "vacature maken",
      "baan aanbieden",
      "werken bij",
      "functie plaatsen",
      "job posting",
      "werving",
      "vacature aanmaken",
      "personeel zoeken",
      "werknemer zoeken",
    ],
    answer:
      "Open 'Plaats bericht' en kies 'Vacature'. Vul de functie, beschrijving en het gewenste bereik in.",
    steps: [
      "Klik op 'Plaats bericht'.",
      "Kies 'Vacature' als berichttype.",
      "Vul de functietitel in.",
      "Beschrijf de functie, vereisten en wat je biedt.",
      "Kies in welke netwerken de vacature zichtbaar moet zijn.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_VACANCY"],
    tourId: "first-vacancy",
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "create-offer",
    title: "Een aanbod plaatsen",
    category: "feed",
    keywords: [
      "aanbod plaatsen",
      "product aanbieden",
      "dienst aanbieden",
      "verkoop",
      "aanbieding maken",
      "product plaatsen",
      "aanbod op feed",
      "aanbod posten",
      "product op feed",
      "dienst op feed",
      "wat ik aanbied",
      "verkoop op feed",
    ],
    answer:
      "Open 'Plaats bericht' en kies 'Aanbod'. Beschrijf wat je aanbiedt en in welke netwerken het zichtbaar moet zijn.",
    steps: [
      "Klik op 'Plaats bericht'.",
      "Kies 'Aanbod' als berichttype.",
      "Schrijf een duidelijke titel.",
      "Beschrijf het product of de dienst.",
      "Voeg eventueel foto's of video's toe.",
      "Kies relevante netwerken.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_OFFER"],
    tourId: "first-offer",
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "create-question",
    title: "Een vraag plaatsen",
    category: "feed",
    keywords: [
      "vraag plaatsen",
      "vraag posten",
      "vraag op feed",
      "vraag stellen op feed",
      "vraag stellen",
      "vraag maken",
    ],
    answer:
      "Open 'Plaats bericht' en kies 'Vraag'. Stel je vraag, kies je netwerken en plaats het bericht.",
    steps: [
      "Klik op 'Plaats bericht'.",
      "Kies 'Vraag' als berichttype.",
      "Schrijf je vraag duidelijk op.",
      "Kies in welke netwerken de vraag zichtbaar moet zijn.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_QUESTION"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "create-news",
    title: "Een nieuwsbericht plaatsen",
    category: "feed",
    keywords: [
      "nieuws plaatsen",
      "nieuws posten",
      "nieuws delen",
      "nieuws op feed",
      "update plaatsen",
      "nieuwsbericht",
      "nieuwsbericht plaatsen",
    ],
    answer:
      "Open 'Plaats bericht' en kies 'Update' of 'Nieuws'. Deel je nieuws en kies in welke netwerken het zichtbaar moet zijn.",
    steps: [
      "Klik op 'Plaats bericht'.",
      "Kies 'Update' als berichttype.",
      "Schrijf je nieuwsbericht.",
      "Voeg eventueel media toe.",
      "Kies relevante netwerken.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_UPDATE"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "create-event",
    title: "Een evenement plaatsen",
    category: "feed",
    keywords: [
      "evenement plaatsen",
      "event plaatsen",
      "evenement posten",
      "event maken",
      "evenement maken",
      "evenement op feed",
    ],
    answer:
      "Open 'Plaats bericht' en kies 'Evenement'. Vul de details in en kies je netwerken.",
    steps: [
      "Klik op 'Plaats bericht'.",
      "Kies 'Evenement' als berichttype.",
      "Vul de titel, datum en beschrijving in.",
      "Voeg eventueel een locatie of link toe.",
      "Kies relevante netwerken.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_EVENT"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "create-opportunity",
    title: "Een zakelijke kans plaatsen",
    category: "feed",
    keywords: [
      "kans plaatsen",
      "opportunity",
      "zakelijke kans",
      "samenwerking zoeken",
      "project aanbieden",
      "opdracht plaatsen",
      "opdracht aanbieden",
      "samenwerkingskans",
      "zakelijke kans plaatsen",
    ],
    answer:
      "Open 'Plaats bericht' en kies 'Aanbod' of 'Vraag' om een zakelijke kans te delen. Beschrijf de kans en in welke netwerken deze zichtbaar moet zijn.",
    steps: [
      "Klik op 'Plaats bericht'.",
      "Kies 'Aanbod' (als jij iets aanbiedt) of 'Vraag' (als jij iets zoekt).",
      "Beschrijf de zakelijke kans duidelijk.",
      "Kies relevante netwerken.",
      "Klik op 'Plaatsen'.",
    ],
    actions: ["CREATE_OFFER"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed", "/opportunities"],
  },
  {
    id: "edit-company-banner",
    title: "Bedrijfsbanner wijzigen",
    category: "profile",
    keywords: [
      "banner wijzigen",
      "banner veranderen",
      "cover",
      "omslagfoto",
      "achtergrond profiel",
      "banner aanpassen",
      "banner uploaden",
      "mijn banner",
    ],
    answer:
      "Je wijzigt je bedrijfsbanner via de instellingen. Open de bedrijfsgegevens en upload een nieuwe bannerafbeelding.",
    steps: [
      "Open Instellingen.",
      "Klik op 'Bedrijfsgegevens'.",
      "Klik op de huidige banner of de placeholder.",
      "Upload een nieuwe afbeelding.",
      "Sla de wijziging op.",
    ],
    actions: ["EDIT_COMPANY_PROFILE"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/settings", "/company"],
  },
  {
    id: "networks-explained",
    title: "Hoe werken netwerken?",
    category: "networks",
    keywords: [
      "netwerken uitleg",
      "hoe werken netwerken",
      "wat zijn netwerken",
      "netwerk deelnemen",
      "netwerk joinen",
      "gemeente netwerk",
      "provincie netwerk",
      "branche netwerk",
      "zichtbaarheid netwerk",
      "netwerk gebruiken",
      "netwerken gebruiken",
      "wat is een netwerk",
    ],
    answer:
      "Netwerken bepalen waar je bedrijven ontmoet en waar je berichten zichtbaar kunnen worden. Er zijn netwerken per gemeente, provincie, branche en heel Nederland. Deelnemen aan een netwerk betekent niet dat elk bericht automatisch overal wordt geplaatst — je kiest per bericht in welke netwerken het verschijnt.",
    steps: [
      "Ga naar Netwerken.",
      "Bekijk de aanbevolen netwerken voor jouw bedrijf.",
      "Klik op 'Deelnemen' bij de netwerken die relevant zijn.",
      "Bij het plaatsen van een bericht kies je in welke netwerken het zichtbaar is.",
    ],
    actions: ["OPEN_NETWORKS"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/networks", "/feed"],
  },
  {
    id: "join-network",
    title: "Deelnemen aan een netwerk",
    category: "networks",
    keywords: [
      "deelnemen netwerk",
      "join netwerk",
      "lid worden netwerk",
      "netwerk toevoegen",
      "aanmelden netwerk",
    ],
    answer:
      "Ga naar Netwerken, zoek het gewenste netwerk en klik op 'Deelnemen'. Je kunt altijd weer verlaten.",
    steps: [
      "Open Netwerken.",
      "Zoek of blader naar het gewenste netwerk.",
      "Klik op 'Deelnemen'.",
    ],
    actions: ["JOIN_NETWORK"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/networks"],
  },
  {
    id: "leave-network",
    title: "Een netwerk verlaten",
    category: "networks",
    keywords: [
      "netwerk verlaten",
      "uit netwerk stappen",
      "netwerk verwijderen",
      "stoppen netwerk",
    ],
    answer:
      "Ga naar Netwerken, vind het netwerk en klik op 'Verlaten'. Je berichten in dat netwerk blijven zichtbaar tot ze verlopen.",
    steps: [
      "Open Netwerken.",
      "Vind het netwerk dat je wilt verlaten.",
      "Klik op 'Verlaten'.",
    ],
    actions: ["LEAVE_NETWORK"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/networks"],
  },
  {
    id: "send-message",
    title: "Een bedrijf een bericht sturen",
    category: "messages",
    keywords: [
      "bericht sturen",
      "bericht naar bedrijf",
      "dm sturen",
      "dm bedrijf",
      "bericht verzenden",
      "contact opnemen",
      "contacteer bedrijf",
      "gesprek starten",
      "bericht bedrijf",
      "bedrijf berichten",
      "bedrijf chat",
      "bericht sturen bedrijf",
      "hoe dm ik een bedrijf",
      "waar stuur ik bericht",
      "hoe contacteer ik iemand",
      "hoe stuur ik bedrijf een chat",
    ],
    answer:
      "Open het bedrijfsprofiel en klik op 'Bericht'. Of ga naar Berichten en start een nieuw gesprek.",
    steps: [
      "Open het profiel van het bedrijf waarnaar je een bericht wilt sturen.",
      "Klik op de knop 'Bericht'.",
      "Schrijf je bericht.",
      "Verzend het bericht.",
    ],
    actions: ["START_CONVERSATION"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/messages", "/company"],
  },
  {
    id: "search-companies",
    title: "Bedrijven zoeken",
    category: "search",
    keywords: [
      "zoeken bedrijf",
      "bedrijf vinden",
      "zoeken",
      "search",
      "bedrijven opzoeken",
      "leverancier zoeken",
      "klant zoeken",
    ],
    answer:
      "Gebruik de zoekfunctie om bedrijven, producten, diensten, vacatures en zakelijke kansen te vinden.",
    steps: [
      "Klik op 'Zoeken' in het menu.",
      "Voer je zoekterm in.",
      "Filter eventueel op branche, locatie of type.",
    ],
    actions: ["OPEN_SEARCH"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/search"],
  },
  {
    id: "notifications-settings",
    title: "Meldingen wijzigen",
    category: "notifications",
    keywords: [
      "meldingen aanpassen",
      "notificaties wijzigen",
      "push berichten",
      "meldingen uitzetten",
      "meldingen aanzetten",
      "notificatie instellingen",
    ],
    answer:
      "Je kunt je meldingen beheren via Instellingen > Meldingen. Kies welke meldingen je wilt ontvangen.",
    steps: [
      "Open Instellingen.",
      "Klik op 'Meldingen'.",
      "Pas de gewenste instellingen aan.",
    ],
    actions: ["OPEN_SETTINGS"],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/settings", "/notifications"],
  },
  {
    id: "change-theme",
    title: "Thema wijzigen (licht/donker)",
    category: "account",
    keywords: [
      "thema wijzigen",
      "donker thema",
      "licht thema",
      "dark mode",
      "light mode",
      "nachtmodus",
      "weergave aanpassen",
    ],
    answer:
      "Je kunt het thema wijzigen via Instellingen > Weergave, of via de themaknop in het menu.",
    steps: [
      "Open Instellingen.",
      "Kies 'Weergave'.",
      "Selecteer Licht, Donker of Systeem.",
    ],
    actions: ["TOGGLE_THEME"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "sign-out",
    title: "Uitloggen",
    category: "account",
    keywords: [
      "uitloggen",
      "log out",
      "afmelden",
      "sessie beëindigen",
    ],
    answer: "Je kunt uitloggen via Instellingen > Uitloggen.",
    steps: [
      "Open Instellingen.",
      "Scroll naar onderen.",
      "Klik op 'Uitloggen'.",
    ],
    actions: ["SIGN_OUT"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "post-visibility",
    title: "Wat betekent 'Zichtbaar in'?",
    category: "feed",
    keywords: [
      "zichtbaar in",
      "bereik",
      "zichtbaarheid bericht",
      "netwerk selectie",
      "bericht netwerken",
      "waar verschijnt bericht",
    ],
    answer:
      "Hier kies je in welke netwerken jouw bericht verschijnt. Kies alleen netwerken waarvoor het bericht relevant is.",
    steps: [
      "Bij het maken van een bericht, zie je het veld 'Zichtbaar in'.",
      "Selecteer de netwerken waar het bericht relevant is.",
      "Plaats het bericht.",
    ],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "post-types",
    title: "Welke berichttypen zijn er?",
    category: "feed",
    keywords: [
      "berichttypen",
      "soorten berichten",
      "type post",
      "wat kan ik plaatsen",
      "bericht soort",
    ],
    answer:
      "Vynta ondersteunt verschillende berichttypen: Aanbod, Vraag, Vacature, Update, Evenement en Mijlpaal. Elk type heeft een eigen icoon en weergave.",
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "post-expiry",
    title: "Hoe lang blijft een bericht open?",
    category: "feed",
    keywords: [
      "openhoudperiode",
      "vervaldatum",
      "hoelang bericht open",
      "bericht verlopen",
      "expiratie",
      "duur bericht",
    ],
    answer:
      "Je kunt bij het plaatsen instellen hoe lang een bericht open blijft. Na deze periode verloopt het automatisch.",
    lastUpdated: "2025-01-15",
    contextRoutes: ["/feed"],
  },
  {
    id: "drafts",
    title: "Concepten opslaan en bewerken",
    category: "feed",
    keywords: [
      "concept opslaan",
      "draft bewaren",
      "concept bewerken",
      "klad bericht",
      "onafgemaakt bericht",
    ],
    answer:
      "Je kunt een bericht als concept opslaan en later verder bewerken. Concepten vind je via Instellingen > Mijn concepten.",
    steps: [
      "Bij het maken van een bericht, klik op 'Opslaan als concept'.",
      "Later kun je het terugvinden via Instellingen > Mijn concepten.",
      "Klik op het concept om verder te gaan.",
    ],
    actions: ["OPEN_DRAFTS"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "follow-company",
    title: "Een bedrijf volgen",
    category: "profile",
    keywords: [
      "bedrijf volgen",
      "volgen",
      "follow",
      "abonneren bedrijf",
      "bedrijf abonneren",
    ],
    answer:
      "Open het profiel van een bedrijf en klik op 'Volgen'. Je ziet hun berichten in je feed.",
    steps: [
      "Open het bedrijfsprofiel.",
      "Klik op 'Volgen'.",
    ],
    actions: ["FOLLOW_COMPANY"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "saved-posts",
    title: "Berichten opslaan",
    category: "feed",
    keywords: [
      "bericht opslaan",
      "opgeslagen berichten",
      "save post",
      "bookmark bericht",
      "favoriet",
    ],
    answer:
      "Je kunt berichten opslaan om later terug te bekijken. Opgeslagen berichten vind je via Opgeslagen in het menu.",
    steps: [
      "Klik op het bladwijzer-icoon bij een bericht.",
      "Opgeslagen berichten vind je via Opgeslagen in het menu.",
    ],
    actions: ["OPEN_SAVED_POSTS"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "verification",
    title: "Profielverificatie",
    category: "profile",
    keywords: [
      "verificatie",
      "geverifieerd",
      "badge",
      "blauwe vink",
      "verifiëren",
      "echtheid bedrijf",
    ],
    answer:
      "Geverifieerde bedrijven hebben een verificatiebadge. Dit wekt meer vertrouwen bij andere ondernemers. Neem contact op met Vynta om te verifiëren.",
    lastUpdated: "2025-01-15",
  },
  {
    id: "report-block",
    title: "Rapporteren en blokkeren",
    category: "reporting",
    keywords: [
      "rapporteren",
      "blokkeren",
      "klacht",
      "misbruik melden",
      "ongewenst bedrijf",
      "blocken",
    ],
    answer:
      "Je kunt een bedrijf of bericht rapporteren via het menu (drie puntjes). Je kunt een bedrijf blokkeren om geen contact meer te ontvangen.",
    lastUpdated: "2025-01-15",
  },
  {
    id: "privacy-security",
    title: "Privacy en veiligheid",
    category: "privacy",
    keywords: [
      "privacy",
      "veiligheid",
      "gegevens beschermen",
      "data veilig",
      "privacy instellingen",
    ],
    answer:
      "Vynta neemt privacy serieus. Je gegevens worden alleen gebruikt om je te verbinden met andere bedrijven. Bekijk onze privacyverklaring voor details.",
    lastUpdated: "2025-01-15",
  },
  {
    id: "audio-video-calls",
    title: "Audio- en videobellen",
    category: "calls",
    keywords: [
      "bellen",
      "video bellen",
      "audio call",
      "video call",
      "vergaderen",
      "bel functie",
    ],
    answer:
      "Je kunt rechtstreeks audio- of videogesprekken starten vanuit een berichtengesprek met een ander bedrijf.",
    steps: [
      "Open een gesprek met een bedrijf.",
      "Klik op het telefoon- of camera-icoon.",
      "Wacht tot de andere partij accepteert.",
    ],
    lastUpdated: "2025-01-15",
    contextRoutes: ["/messages"],
  },
  {
    id: "upload-files",
    title: "Bestanden en media uploaden",
    category: "files",
    keywords: [
      "bestand uploaden",
      "foto uploaden",
      "video uploaden",
      "document toevoegen",
      "bijlage",
      "media toevoegen",
    ],
    answer:
      "Je kunt foto's, video's en documenten toevoegen aan berichten en in gesprekken. Klik op het paperclip- of foto-icoon.",
    lastUpdated: "2025-01-15",
  },
  {
    id: "onboarding-skip",
    title: "Onboarding overslaan of hervatten",
    category: "start",
    keywords: [
      "onboarding overslaan",
      "onboarding hervatten",
      "onboarding later",
      "instellen later",
      "onboarding stoppen",
    ],
    answer:
      "Je kunt de onboarding overslaan. Je kunt dit later altijd afronden via Instellingen > Uitleg en begeleiding > Onboarding opnieuw openen.",
    actions: ["OPEN_ONBOARDING"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "product-tour",
    title: "Producttour bekijken",
    category: "start",
    keywords: [
      "rondleiding",
      "tour",
      "uitleg interface",
      "rondleiding vynta",
      "tour starten",
      "producttour",
    ],
    answer:
      "Bekijk een korte interactieve rondleiding door de belangrijkste onderdelen van Vynta.",
    actions: ["START_PRODUCT_TOUR"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "checklist",
    title: "Aan-de-slag checklist",
    category: "start",
    keywords: [
      "checklist",
      "aan de slag",
      "profiel compleet",
      "taken lijst",
      "voortgang",
    ],
    answer:
      "Met de aan-de-slag checklist maak je je Vynta-profiel stap voor stap compleet. Elke taak heeft een directe knop om meteen naar de juiste functie te gaan.",
    actions: ["OPEN_CHECKLIST"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "assistant-help",
    title: "De Vynta Assistent gebruiken",
    category: "start",
    keywords: [
      "assistent",
      "hulp",
      "help",
      "vraag stellen",
      "chatbot",
      "vynta assistent",
      "hulp nodig",
    ],
    answer:
      "De Vynta Assistent is rechtsonder beschikbaar. Stel een vraag of kies een van de snelle opties. De assistent kan je direct naar de juiste pagina brengen of stap voor stap meelopen.",
    actions: ["OPEN_ASSISTANT"],
    lastUpdated: "2025-01-15",
  },
  {
    id: "guided-mode",
    title: "Begeleid mij modus",
    category: "start",
    keywords: [
      "begeleid mij",
      "geleide modus",
      "stap voor stap",
      "begeleide taak",
      "interactieve uitleg",
    ],
    answer:
      "Met 'Begeleid mij' loop je stap voor stap door een taak. De assistent markeert steeds één element, geeft een korte instructie en wacht op jouw actie.",
    lastUpdated: "2025-01-15",
  },
  {
    id: "experience-level",
    title: "Uitlegniveau aanpassen",
    category: "start",
    keywords: [
      "uitleg detail",
      "ervaringsniveau",
      "uitlegniveau",
      "hoeveel uitleg",
      "begeleiding niveau",
    ],
    answer:
      "Bij onboarding kies je hoe uitgebreid je uitleg wilt. Dit kun je later aanpassen via Instellingen > Uitleg en begeleiding.",
    lastUpdated: "2025-01-15",
  },
];

const SYNONYMS: Record<string, string[]> = {
  sturen: ["versturen", "verzenden", "zenden", "dm", "dm'en", "bericht sturen"],
  bericht: ["message", "chat", "dm", "berichtje", "bericht"],
  bedrijf: ["bedrijven", "organisatie", " onderneming"],
  zoeken: ["vinden", "opzoeken", "zoeken", "search"],
  wijzigen: ["aanpassen", "veranderen", "bewerken", "wijzig", "verander"],
  profiel: ["profiel", "gegevens", "pagina"],
  logo: ["profielfoto", "afbeelding", "icon", "icoon"],
  banner: ["cover", "omslagfoto", "achtergrond"],
  netwerk: ["netwerken", "groep", "community"],
  plaatsen: ["maken", "aanmaken", "posten", "publiceren", "delen"],
  vacature: ["baan", "functie", "job", "werving", "werken bij"],
  aanbod: ["product", "dienst", "verkoop", "aanbieding"],
  melding: ["notificatie", "push", "meldingen", "notificaties"],
  bellen: ["videobellen", "audio", "video call", "telefoon", "vergaderen"],
  blokkeren: ["blocken", "blok", "uitschakelen"],
  contact: ["contacteer", "benaderen", "bereiken"],
};

function expandWithSynonyms(terms: string[]): string[] {
  const expanded = new Set(terms);
  for (const term of terms) {
    const syn = SYNONYMS[term];
    if (syn) syn.forEach((s) => expanded.add(s));
  }
  return Array.from(expanded);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function isFuzzyMatch(term: string, keyword: string): boolean {
  if (term === keyword) return true;
  if (keyword.includes(term) || term.includes(keyword)) return true;
  // Typo tolerance: allow 1-2 char difference for words >= 4 chars
  if (term.length >= 4 && keyword.length >= 4) {
    const dist = levenshtein(term, keyword);
    return dist <= 2 && dist < Math.min(term.length, keyword.length) / 2;
  }
  return false;
}

export function searchKnowledgeBase(query: string): KnowledgeArticle[] {
  return searchKnowledgeBaseWithIntent(query);
}

export function searchKnowledgeBaseWithIntent(
  query: string,
  intentArticleId?: string | null,
  penalizeArticleIds?: string[]
): KnowledgeArticle[] {
  const q = normalizeText(query);
  if (!q) return [];

  const terms = q.split(/\s+/).filter(Boolean);
  const expandedTerms = expandWithSynonyms(terms);
  const scored: { article: KnowledgeArticle; score: number }[] = [];

  // Feed vs private message disambiguation keywords
  const feedIndicators = ["feed", "openbaar", "plaatsen op", "posten op", "op de feed", "op mn feed", "op mijn feed"];
  const privateIndicators = ["dm", "privé", "prive", "sturen naar", "chat met", "bericht sturen naar", "bedrijf een bericht", "bericht bedrijf"];

  const hasFeedIndicator = feedIndicators.some((ind) => q.includes(normalizeText(ind)));
  const hasPrivateIndicator = privateIndicators.some((ind) => q.includes(normalizeText(ind)));

  for (const article of KNOWLEDGE_BASE) {
    let score = 0;
    const titleNorm = normalizeText(article.title);
    const answerNorm = normalizeText(article.answer);

    if (titleNorm.includes(q)) score += 100;
    if (answerNorm.includes(q)) score += 30;

    for (const keyword of article.keywords) {
      const kwNorm = normalizeText(keyword);
      if (kwNorm === q) score += 80;
      else if (kwNorm.includes(q)) score += 50;
      else if (q.includes(kwNorm)) score += 40;
      else {
        for (const term of expandedTerms) {
          if (kwNorm.includes(term)) score += 15;
          else if (isFuzzyMatch(term, kwNorm)) score += 10;
        }
      }
    }

    for (const term of expandedTerms) {
      if (titleNorm.includes(term)) score += 10;
      if (answerNorm.includes(term)) score += 5;
    }

    // Disambiguation: feed vs private message
    if (article.id === "send-message" && hasFeedIndicator && !hasPrivateIndicator) {
      score -= 30;
    }
    if (
      (article.id === "create-post" || article.id === "create-offer" || article.id === "create-vacancy" ||
       article.id === "create-question" || article.id === "create-news" || article.id === "create-event" ||
       article.id === "create-opportunity") &&
      hasPrivateIndicator && !hasFeedIndicator
    ) {
      score -= 30;
    }

    // Intent boost
    if (intentArticleId && article.id === intentArticleId) {
      score += 50;
    }

    // Penalize articles that were previously given as wrong answers
    if (penalizeArticleIds && penalizeArticleIds.includes(article.id)) {
      score -= 40;
    }

    if (score > 0) {
      scored.push({ article, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((s) => s.article);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function getArticleById(id: string): KnowledgeArticle | undefined {
  return KNOWLEDGE_BASE.find((a) => a.id === id);
}

export function getArticlesByCategory(category: HelpCategory): KnowledgeArticle[] {
  return KNOWLEDGE_BASE.filter((a) => a.category === category);
}

export const allArticleIds = KNOWLEDGE_BASE.map((a) => a.id);
