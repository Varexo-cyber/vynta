import type { HelpActionId } from "./help-actions";

export interface TourStep {
  tourId: string;
  title: string;
  description: string;
  selector: string;
  placement?: "bottom" | "top" | "left" | "right" | "center";
  actionId?: HelpActionId;
  waitForAction?: boolean;
  completeOnRecovery?: boolean;
}

export interface TourDef {
  id: string;
  title: string;
  description: string;
  steps: TourStep[];
}

export const PRODUCT_TOUR: TourDef = {
  id: "product-tour",
  title: "Welkom bij Vynta",
  description: "Een korte rondleiding door de belangrijkste onderdelen.",
  steps: [
    {
      tourId: "feed",
      title: "Feed",
      description: "Hier zie je berichten uit jouw netwerken.",
      selector: "[data-tour-id='feed']",
      placement: "right",
    },
    {
      tourId: "create-post",
      title: "Plaats bericht",
      description:
        "Deel een vraag, aanbod, vacature, nieuwsbericht, evenement of mijlpaal.",
      selector: "[data-tour-id='create-post']",
      placement: "bottom",
    },
    {
      tourId: "networks",
      title: "Netwerken",
      description:
        "Ontdek bedrijven per gemeente, provincie, branche of heel Nederland.",
      selector: "[data-tour-id='networks']",
      placement: "right",
    },
    {
      tourId: "search",
      title: "Zoeken",
      description:
        "Zoek naar bedrijven, producten, diensten, vacatures en zakelijke kansen.",
      selector: "[data-tour-id='search']",
      placement: "right",
    },
    {
      tourId: "messages",
      title: "Berichten",
      description: "Neem rechtstreeks contact op met andere bedrijven.",
      selector: "[data-tour-id='messages']",
      placement: "right",
    },
    {
      tourId: "company-profile",
      title: "Bedrijfsprofiel",
      description: "Beheer hier hoe jouw bedrijf op Vynta zichtbaar is.",
      selector: "[data-tour-id='company-profile']",
      placement: "top",
    },
  ],
};

export const GUIDED_TOURS: Record<string, TourDef> = {
  "first-offer": {
    id: "first-offer",
    title: "Eerste aanbod plaatsen",
    description: "Stap voor stap begeleid door je eerste aanbod.",
    steps: [
      {
        tourId: "create-post",
        title: "Plaats bericht",
        description: "Klik op 'Plaats bericht' om een nieuw bericht te maken.",
        selector: "[data-tour-id='create-post']",
        placement: "bottom",
        actionId: "CREATE_POST",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "post-type-offer",
        title: "Kies Aanbod",
        description: "Selecteer 'Aanbod' als berichttype.",
        selector: "[data-tour-id='post-type-offer']",
        placement: "bottom",
        waitForAction: true,
      },
      {
        tourId: "post-body",
        title: "Voeg beschrijving toe",
        description: "Beschrijf wat je aanbiedt.",
        selector: "[data-tour-id='post-body']",
        placement: "top",
        waitForAction: true,
      },
      {
        tourId: "post-media",
        title: "Voeg eventueel media toe",
        description: "Voeg foto's of video's toe om je aanbod aantrekkelijker te maken.",
        selector: "[data-tour-id='post-media']",
        placement: "top",
      },
      {
        tourId: "post-networks",
        title: "Kies relevante netwerken",
        description: "Selecteer in welke netwerken je aanbod zichtbaar moet zijn.",
        selector: "[data-tour-id='post-networks']",
        placement: "top",
        waitForAction: true,
      },
      {
        tourId: "post-submit",
        title: "Plaats bericht",
        description: "Controleer je bericht en klik op 'Plaatsen' om het te publiceren.",
        selector: "[data-tour-id='post-submit']",
        placement: "top",
        waitForAction: true,
      },
    ],
  },
  "first-vacancy": {
    id: "first-vacancy",
    title: "Vacature plaatsen",
    description: "Stap voor stap begeid door je eerste vacature.",
    steps: [
      {
        tourId: "create-post",
        title: "Plaats bericht",
        description: "Klik op 'Plaats bericht' om een nieuw bericht te maken.",
        selector: "[data-tour-id='create-post']",
        placement: "bottom",
        actionId: "CREATE_VACANCY",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "post-type-hiring",
        title: "Kies Vacature",
        description: "Selecteer 'Vacature' als berichttype.",
        selector: "[data-tour-id='post-type-hiring']",
        placement: "bottom",
        waitForAction: true,
      },
      {
        tourId: "post-body",
        title: "Functiebeschrijving",
        description: "Beschrijf de functie, vereisten en wat je biedt.",
        selector: "[data-tour-id='post-body']",
        placement: "top",
        waitForAction: true,
      },
      {
        tourId: "post-networks",
        title: "Kies bereik",
        description: "Selecteer in welke netwerken de vacature zichtbaar moet zijn.",
        selector: "[data-tour-id='post-networks']",
        placement: "top",
        waitForAction: true,
      },
      {
        tourId: "post-submit",
        title: "Plaats vacature",
        description: "Controleer en klik op 'Plaatsen' om de vacature te publiceren.",
        selector: "[data-tour-id='post-submit']",
        placement: "top",
        waitForAction: true,
      },
    ],
  },
  "edit-logo": {
    id: "edit-logo",
    title: "Bedrijfslogo wijzigen",
    description: "Leer hoe je je bedrijfslogo aanpast.",
    steps: [
      {
        tourId: "company-profile",
        title: "Open bedrijfsprofiel",
        description: "Ga naar je bedrijfsprofiel.",
        selector: "[data-tour-id='company-profile']",
        placement: "top",
        actionId: "OPEN_COMPANY_PROFILE",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "company-logo-upload",
        title: "Logo wijzigen",
        description: "Klik op het huidige logo om een nieuwe afbeelding te uploaden.",
        selector: "[data-tour-id='company-logo-upload']",
        placement: "bottom",
        actionId: "OPEN_COMPANY_PROFILE",
        waitForAction: true,
      },
    ],
  },
  "edit-description": {
    id: "edit-description",
    title: "Bedrijfsomschrijving invullen",
    description: "Leer hoe je je bedrijfsomschrijving aanpast.",
    steps: [
      {
        tourId: "company-profile",
        title: "Open bedrijfsprofiel",
        description: "Ga naar je bedrijfsprofiel.",
        selector: "[data-tour-id='company-profile']",
        placement: "top",
        actionId: "OPEN_COMPANY_PROFILE",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "company-edit",
        title: "Open de bedrijfsgegevens",
        description: "Kies 'Profiel bewerken' om je bedrijfsgegevens te openen.",
        selector: "[data-tour-id='company-edit']",
        placement: "bottom",
        actionId: "OPEN_COMPANY_PROFILE",
        waitForAction: true,
      },
      {
        tourId: "company-description",
        title: "Omschrijving invullen",
        description: "Vul een duidelijke omschrijving in van wat je bedrijf doet.",
        selector: "[data-tour-id='company-description']",
        placement: "bottom",
        actionId: "EDIT_COMPANY_PROFILE",
        waitForAction: true,
      },
    ],
  },
  "edit-contact": {
    id: "edit-contact",
    title: "Contactgegevens controleren",
    description: "Leer hoe je je contactgegevens aanpast.",
    steps: [
      {
        tourId: "company-profile",
        title: "Open bedrijfsprofiel",
        description: "Ga naar je bedrijfsprofiel.",
        selector: "[data-tour-id='company-profile']",
        placement: "top",
        actionId: "OPEN_COMPANY_PROFILE",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "company-edit",
        title: "Open de bedrijfsgegevens",
        description: "Kies 'Profiel bewerken' om je contactgegevens te openen.",
        selector: "[data-tour-id='company-edit']",
        placement: "bottom",
        actionId: "OPEN_COMPANY_PROFILE",
        waitForAction: true,
      },
      {
        tourId: "company-contact",
        title: "Contactgegevens invullen",
        description: "Controleer en vul je telefoonnummer en website in.",
        selector: "[data-tour-id='company-contact']",
        placement: "bottom",
        actionId: "EDIT_COMPANY_PROFILE",
        waitForAction: true,
      },
    ],
  },
  "join-network": {
    id: "join-network",
    title: "Deelnemen aan netwerken",
    description: "Leer hoe je deelneemt aan je gemeente-, provincie- en branchenetwerken.",
    steps: [
      {
        tourId: "networks",
        title: "Open Netwerken",
        description: "Ga naar de Netwerken pagina.",
        selector: "[data-tour-id='networks']",
        placement: "right",
        actionId: "OPEN_NETWORKS",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "network-join",
        title: "Netwerk volgen",
        description: "Klik op 'Volgen' bij een branche of gemeente.",
        selector: "[data-tour-id='network-join']",
        placement: "bottom",
        actionId: "OPEN_NETWORKS",
        waitForAction: true,
      },
    ],
  },
  "first-post": {
    id: "first-post",
    title: "Eerste bericht plaatsen",
    description: "Stap voor stap begeleid door je eerste bericht.",
    steps: [
      {
        tourId: "create-post",
        title: "Plaats bericht",
        description: "Klik op 'Plaats bericht' om een nieuw bericht te maken.",
        selector: "[data-tour-id='create-post']",
        placement: "bottom",
        actionId: "CREATE_POST",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "post-body",
        title: "Voeg beschrijving toe",
        description: "Beschrijf wat je wilt delen.",
        selector: "[data-tour-id='post-body']",
        placement: "top",
        actionId: "CREATE_POST",
        waitForAction: true,
      },
      {
        tourId: "post-networks",
        title: "Kies relevante netwerken",
        description: "Selecteer in welke netwerken je bericht zichtbaar moet zijn.",
        selector: "[data-tour-id='post-networks']",
        placement: "top",
        actionId: "CREATE_POST",
        waitForAction: true,
      },
      {
        tourId: "post-submit",
        title: "Plaats bericht",
        description: "Controleer je bericht en klik op 'Plaatsen' om het te publiceren.",
        selector: "[data-tour-id='post-submit']",
        placement: "top",
        actionId: "CREATE_POST",
        waitForAction: true,
      },
    ],
  },
  "first-follow": {
    id: "first-follow",
    title: "Eerste bedrijf volgen",
    description: "Leer hoe je een bedrijf volgt.",
    steps: [
      {
        tourId: "search",
        title: "Open Zoeken",
        description: "Ga naar de Zoeken pagina.",
        selector: "[data-tour-id='search']",
        placement: "right",
        actionId: "OPEN_SEARCH",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "search-query",
        title: "Zoek een bedrijf",
        description: "Typ de naam van een bedrijf dat je wilt volgen.",
        selector: "[data-tour-id='search-query']",
        placement: "bottom",
        waitForAction: true,
      },
      {
        tourId: "company-result",
        title: "Open het bedrijf",
        description: "Open een bedrijfsprofiel uit de zoekresultaten.",
        selector: "[data-tour-id='company-result']",
        placement: "bottom",
        waitForAction: true,
      },
      {
        tourId: "company-follow",
        title: "Volgen",
        description: "Klik op 'Volgen' op het bedrijfsprofiel.",
        selector: "[data-tour-id='company-follow']",
        placement: "bottom",
        waitForAction: true,
      },
    ],
  },
  "first-conversation": {
    id: "first-conversation",
    title: "Eerste zakelijk gesprek starten",
    description: "Leer hoe je een bedrijf een bericht stuurt.",
    steps: [
      {
        tourId: "search",
        title: "Zoek een bedrijf",
        description: "Open Zoeken om het bedrijf te vinden waarmee je wilt praten.",
        selector: "[data-tour-id='search']",
        placement: "right",
        actionId: "OPEN_SEARCH",
        waitForAction: true,
        completeOnRecovery: true,
      },
      {
        tourId: "search-query",
        title: "Vul de bedrijfsnaam in",
        description: "Typ de naam van het bedrijf dat je een bericht wilt sturen.",
        selector: "[data-tour-id='search-query']",
        placement: "bottom",
        waitForAction: true,
      },
      {
        tourId: "company-result",
        title: "Open het bedrijf",
        description: "Open het juiste bedrijfsprofiel.",
        selector: "[data-tour-id='company-result']",
        placement: "bottom",
        waitForAction: true,
      },
      {
        tourId: "company-message",
        title: "Start het gesprek",
        description: "Klik op 'Bericht' om direct een gesprek te openen.",
        selector: "[data-tour-id='company-message']",
        placement: "bottom",
        waitForAction: true,
      },
    ],
  },
};

export const allTourIds: string[] = [
  ...PRODUCT_TOUR.steps.map((s) => s.tourId),
  ...Object.values(GUIDED_TOURS).flatMap((t) => t.steps.map((s) => s.tourId)),
];

export function getTour(id: string): TourDef | undefined {
  if (id === PRODUCT_TOUR.id) return PRODUCT_TOUR;
  return GUIDED_TOURS[id];
}
