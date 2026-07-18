import { normalizeText } from "./help-knowledge";

export type Intent =
  | "CREATE_FEED_POST"
  | "CREATE_NEWS_POST"
  | "CREATE_QUESTION_POST"
  | "CREATE_OFFER_POST"
  | "CREATE_VACANCY_POST"
  | "CREATE_EVENT_POST"
  | "CREATE_OPPORTUNITY"
  | "SEND_PRIVATE_MESSAGE"
  | "START_AUDIO_CALL"
  | "START_VIDEO_CALL"
  | "EDIT_COMPANY_PROFILE"
  | "CHANGE_COMPANY_LOGO"
  | "CHANGE_COMPANY_BANNER"
  | "OPEN_NETWORKS"
  | "JOIN_NETWORK"
  | "SEARCH_COMPANY"
  | "MANAGE_NOTIFICATIONS"
  | "MANAGE_OPPORTUNITY_PREFERENCES"
  | "UNKNOWN";

export interface IntentMatch {
  intent: Intent;
  confidence: number;
  articleId: string | null;
  isCorrection: boolean;
  needsClarification: boolean;
  clarificationOptions?: { label: string; intent: Intent }[];
}

export interface ConversationTurn {
  role: "user" | "assistant";
  text: string;
}

const CORRECTION_PATTERNS = [
  "nee", "niet", "ik bedoel", "je begrijpt me verkeerd",
  "ik heb het over", "geen prive", "geen privé", "niet dat",
  "niet een bericht sturen", "ik bedoel de feed", "verkeerd begrepen",
  "fout begrepen", "niet privé", "geen chat", "geen dm",
  "niet sturen", "niet privebericht", "openbaar bericht",
  "niet prive", "geen privebericht",
];

const FEED_INTENTS: Intent[] = [
  "CREATE_FEED_POST", "CREATE_OFFER_POST", "CREATE_VACANCY_POST",
  "CREATE_NEWS_POST", "CREATE_QUESTION_POST", "CREATE_EVENT_POST",
  "CREATE_OPPORTUNITY",
];

interface IntentRule {
  intent: Intent;
  patterns: string[];
  antiPatterns?: string[];
  articleId: string;
  contextRoutes?: string[];
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: "CREATE_OFFER_POST",
    patterns: [
      "aanbod", "aanbieding", "product plaatsen", "dienst aanbieden",
      "product aanbieden", "aanbod op feed", "aanbod plaatsen",
      "aanbod posten", "wat ik aanbied", "verkoop op feed",
      "product op feed", "dienst op feed",
    ],
    antiPatterns: ["privé", "prive", "dm", "sturen naar", "chat met"],
    articleId: "create-offer",
    contextRoutes: ["/feed"],
  },
  {
    intent: "CREATE_VACANCY_POST",
    patterns: [
      "vacature", "baan", "functie plaatsen", "werknemer zoeken",
      "personeel zoeken", "personeel", "werving", "werken bij",
      "baan aanbieden", "vacature plaatsen", "vacature posten",
      "functie", "werknemer", "personeel nodig", "mensen zoeken",
      "twee werknemers", "werkkracht",
    ],
    antiPatterns: ["privé", "prive", "dm", "sturen naar", "chat met"],
    articleId: "create-vacancy",
    contextRoutes: ["/feed"],
  },
  {
    intent: "CREATE_QUESTION_POST",
    patterns: [
      "vraag plaatsen", "vraag posten", "vraag op feed",
      "vraag stellen op feed", "vraag stellen",
    ],
    antiPatterns: ["privé", "prive", "dm"],
    articleId: "create-question",
    contextRoutes: ["/feed"],
  },
  {
    intent: "CREATE_NEWS_POST",
    patterns: [
      "nieuws plaatsen", "nieuws posten", "nieuws delen",
      "nieuws op feed", "update plaatsen", "nieuwsbericht",
    ],
    antiPatterns: ["privé", "prive", "dm"],
    articleId: "create-news",
    contextRoutes: ["/feed"],
  },
  {
    intent: "CREATE_EVENT_POST",
    patterns: [
      "evenement plaatsen", "event plaatsen", "evenement posten",
      "event maken", "evenement maken", "evenement op feed",
    ],
    antiPatterns: ["privé", "prive", "dm"],
    articleId: "create-event",
    contextRoutes: ["/feed"],
  },
  {
    intent: "CREATE_OPPORTUNITY",
    patterns: [
      "kans plaatsen", "opportunity", "zakelijke kans",
      "samenwerking zoeken", "project aanbieden", "opdracht plaatsen",
      "opdracht aanbieden", "samenwerkingskans",
    ],
    antiPatterns: ["privé", "prive", "dm"],
    articleId: "create-opportunity",
    contextRoutes: ["/feed", "/opportunities"],
  },
  {
    intent: "CREATE_FEED_POST",
    patterns: [
      "plaats bericht", "post op feed", "plaatsen op feed",
      "posten op feed", "waar post ik", "waar plaats ik",
      "nieuw bericht", "feed bericht", "openbaar bericht",
      "openbare post", "iets plaatsen op feed", "hoe post ik",
      "feed plaatsen", "feed posten", "post maken", "bericht maken",
      "bericht aanmaken", "plaatsen", "posten",
    ],
    antiPatterns: [
      "privé", "prive", "dm", "sturen naar bedrijf",
      "chat met bedrijf", "bericht sturen naar",
      "aanbod", "vacature", "vraag", "nieuws", "evenement",
      "event", "opportunity", "logo", "banner", "profiel",
      "netwerk", "bellen", "video", "melding", "notificatie",
    ],
    articleId: "create-post",
    contextRoutes: ["/feed"],
  },
  {
    intent: "SEND_PRIVATE_MESSAGE",
    patterns: [
      "dm", "privébericht", "privebericht", "bericht sturen naar",
      "chat met bedrijf", "bedrijf berichten", "bedrijf een bericht",
      "bericht bedrijf", "contact opnemen", "contacteer",
      "gesprek starten met", "bericht sturen bedrijf",
      "hoe stuur ik bedrijf", "hoe dm ik", "bericht verzenden",
      "bericht naar bedrijf", "prive chat", "privé chat",
      "een bedrijf een bericht sturen", "bedrijf een chat",
      "bericht sturen naar een bedrijf", "hoe stuur ik een bedrijf",
      "bedrijf contacteren", "een bericht sturen",
    ],
    antiPatterns: [
      "feed", "openbaar", "plaatsen op", "posten op",
      "aanbod", "vacature", "op de feed", "op mn feed",
    ],
    articleId: "send-message",
    contextRoutes: ["/messages", "/company"],
  },
  {
    intent: "START_AUDIO_CALL",
    patterns: [
      "bellen", "audio call", "telefoon", "audio gesprek",
      "bel bedrijf", "hoe bel ik", "audio bellen",
    ],
    antiPatterns: ["video", "vergaderen", "camera"],
    articleId: "audio-video-calls",
    contextRoutes: ["/messages"],
  },
  {
    intent: "START_VIDEO_CALL",
    patterns: [
      "video bellen", "video call", "videogesprek", "vergaderen",
      "video gesprek", "camera", "videobellen",
    ],
    articleId: "audio-video-calls",
    contextRoutes: ["/messages"],
  },
  {
    intent: "EDIT_COMPANY_PROFILE",
    patterns: [
      "profiel bewerken", "bedrijfsgegevens", "bedrijf aanpassen",
      "profiel aanpassen", "gegevens wijzigen", "bedrijfsprofiel wijzigen",
      "waar wijzig ik mijn bedrijfsprofiel", "mijn profiel aanpassen",
      "bedrijf gegevens aanpassen", "omschrijving aanpassen",
      "beschrijving wijzigen", "bedrijfsprofiel aanpassen",
    ],
    articleId: "edit-company-profile",
    contextRoutes: ["/settings", "/company"],
  },
  {
    intent: "CHANGE_COMPANY_LOGO",
    patterns: [
      "logo wijzigen", "logo veranderen", "profielfoto",
      "bedrijfslogo", "logo aanpassen", "logo uploaden",
      "afbeelding profiel", "waar verander ik mijn logo",
      "logo verander", "mijn logo",
    ],
    articleId: "edit-company-logo",
    contextRoutes: ["/settings", "/company"],
  },
  {
    intent: "CHANGE_COMPANY_BANNER",
    patterns: [
      "banner wijzigen", "banner veranderen", "cover",
      "omslagfoto", "achtergrond profiel", "banner aanpassen",
      "banner uploaden", "mijn banner",
    ],
    articleId: "edit-company-banner",
    contextRoutes: ["/settings", "/company"],
  },
  {
    intent: "OPEN_NETWORKS",
    patterns: [
      "netwerken uitleg", "hoe werken netwerken", "wat zijn netwerken",
      "netwerk deelnemen", "netwerk joinen", "gemeente netwerk",
      "provincie netwerk", "branche netwerk", "zichtbaarheid netwerk",
      "netwerk gebruiken", "netwerken gebruiken", "wat is een netwerk",
      "netwerken", "hoe werken netwerk",
    ],
    articleId: "networks-explained",
    contextRoutes: ["/networks", "/feed"],
  },
  {
    intent: "JOIN_NETWORK",
    patterns: [
      "deelnemen netwerk", "join netwerk", "lid worden netwerk",
      "netwerk toevoegen", "aanmelden netwerk", "netwerk kiezen",
      "netwerk selecteren",
    ],
    articleId: "join-network",
    contextRoutes: ["/networks"],
  },
  {
    intent: "SEARCH_COMPANY",
    patterns: [
      "zoeken bedrijf", "bedrijf vinden", "bedrijven opzoeken",
      "leverancier zoeken", "klant zoeken", "zoek bedrijf",
      "bedrijf zoeken", "leverancier vinden",
    ],
    articleId: "search-companies",
    contextRoutes: ["/search"],
  },
  {
    intent: "MANAGE_NOTIFICATIONS",
    patterns: [
      "meldingen aanpassen", "notificaties wijzigen", "push berichten",
      "meldingen uitzetten", "meldingen aanzetten",
      "notificatie instellingen", "meldingen", "notificaties",
    ],
    articleId: "notifications-settings",
    contextRoutes: ["/settings", "/notifications"],
  },
];

export function isCorrection(query: string): boolean {
  const q = normalizeText(query);
  return CORRECTION_PATTERNS.some((p) => q.includes(normalizeText(p)));
}

export function classifyIntent(
  query: string,
  contextRoute?: string,
  conversationHistory?: ConversationTurn[]
): IntentMatch {
  const q = normalizeText(query);
  const correction = isCorrection(query);

  // For corrections, strip the correction phrases to get the actual intent
  let matchQuery = q;
  if (correction) {
    // Remove correction phrases to get the real intent
    const correctionPhrases = [
      "nee", "niet", "ik bedoel", "je begrijpt me verkeerd",
      "ik heb het over", "geen prive", "geen privé", "niet dat",
      "niet een bericht sturen", "ik bedoel de feed", "verkeerd begrepen",
      "fout begrepen", "niet prive", "geen chat", "geen dm",
      "niet sturen", "niet privebericht", "openbaar bericht",
      "niet prive", "geen privebericht", "privébericht",
      "privebericht", "dm", "prive", "privé",
      "iemand een bericht", "een bericht sturen", "bericht sturen",
      "bericht verzenden", "chat met bedrijf", "bedrijf berichten",
    ];
    let stripped = q;
    for (const phrase of correctionPhrases) {
      const pNorm = normalizeText(phrase);
      stripped = stripped.replace(pNorm, " ");
    }
    matchQuery = stripped.replace(/\s+/g, " ").trim();

    // If after stripping we still have content, use it
    if (matchQuery.length < 3) {
      matchQuery = q;
    }
  }

  // Score each intent
  const scores: { rule: IntentRule; score: number }[] = [];

  for (const rule of INTENT_RULES) {
    let score = 0;

    for (const pattern of rule.patterns) {
      const pNorm = normalizeText(pattern);
      if (matchQuery.includes(pNorm)) {
        // Longer phrase match = higher score
        score += Math.max(5, Math.min(20, pNorm.split(/\s+/).length * 5));
      } else {
        // Check individual words for partial matches
        const words = pNorm.split(/\s+/).filter((w) => w.length >= 3);
        for (const word of words) {
          if (matchQuery.includes(word)) {
            score += 2;
          }
        }
      }
    }

    // Penalize anti-patterns heavily — use matchQuery for corrections
    if (rule.antiPatterns) {
      for (const anti of rule.antiPatterns) {
        const aNorm = normalizeText(anti);
        if (matchQuery.includes(aNorm)) {
          score -= 15;
        }
      }
    }

    // Context route boost
    if (contextRoute && rule.contextRoutes) {
      for (const route of rule.contextRoutes) {
        if (contextRoute.startsWith(route)) {
          score += 3;
          break;
        }
      }
    }

    if (score > 0) {
      scores.push({ rule, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0 || scores[0].score <= 0) {
    // If correction but no intent found, check conversation history for context
    if (correction && conversationHistory && conversationHistory.length > 0) {
      // Look at the original question that was corrected
      const lastUser = [...conversationHistory].reverse().find((m) => m.role === "user");
      if (lastUser) {
        const reclassified = classifyIntent(lastUser.text, contextRoute);
        // If the original question had a feed intent and the correction mentions "openbaar" or "feed",
        // override to feed post
        const correctionText = normalizeText(query);
        if (correctionText.includes("openbaar") || correctionText.includes("feed") || correctionText.includes("post")) {
          return {
            intent: "CREATE_FEED_POST",
            confidence: 0.7,
            articleId: "create-post",
            isCorrection: correction,
            needsClarification: false,
          };
        }
      }
    }
    return {
      intent: "UNKNOWN",
      confidence: 0,
      articleId: null,
      isCorrection: correction,
      needsClarification: false,
    };
  }

  const top = scores[0];
  const second = scores[1];
  const confidence = Math.min(1, top.score / 20);

  // Check for feed vs private message ambiguity
  if (second && top.score - second.score <= 4) {
    const topIsFeed = FEED_INTENTS.includes(top.rule.intent);
    const secondIsFeed = FEED_INTENTS.includes(second.rule.intent);
    const topIsPrivate = top.rule.intent === "SEND_PRIVATE_MESSAGE";
    const secondIsPrivate = second.rule.intent === "SEND_PRIVATE_MESSAGE";

    if ((topIsFeed && secondIsPrivate) || (topIsPrivate && secondIsFeed)) {
      return {
        intent: "UNKNOWN",
        confidence: confidence,
        articleId: null,
        isCorrection: correction,
        needsClarification: true,
        clarificationOptions: [
          {
            label: "Post op de feed",
            intent: topIsFeed ? top.rule.intent : second.rule.intent,
          },
          { label: "Privébericht", intent: "SEND_PRIVATE_MESSAGE" },
        ],
      };
    }
  }

  // Low confidence — ask for clarification
  if (confidence < 0.35 && !correction) {
    return {
      intent: "UNKNOWN",
      confidence,
      articleId: null,
      isCorrection: correction,
      needsClarification: false,
    };
  }

  return {
    intent: top.rule.intent,
    confidence,
    articleId: top.rule.articleId,
    isCorrection: correction,
    needsClarification: false,
  };
}
