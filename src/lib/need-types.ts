import {
  Newspaper,
  HelpCircle,
  Tag,
  Users,
  Trophy,
  BarChart3,
  CalendarDays,
  Search,
  Wrench,
  Handshake,
  Warehouse,
  Megaphone,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { PostType } from "./types";

export interface PostTypeMeta {
  label: string;
  verb: string;
  icon: LucideIcon;
  /** css color var name */
  color: string;
  placeholder: string;
}

/** @deprecated use POST_TYPES */
export const NEED_TYPES: Record<PostType, PostTypeMeta> = {
  update: {
    label: "Nieuws",
    verb: "deelt",
    icon: Newspaper,
    color: "var(--type-sourcing)",
    placeholder: "Wat is er nieuw bij je bedrijf?",
  },
  question: {
    label: "Vraag",
    verb: "vraagt",
    icon: HelpCircle,
    color: "var(--type-partnership)",
    placeholder: "Waar zit je mee? Vraag het je netwerk…",
  },
  offer: {
    label: "Aanbod",
    verb: "biedt aan",
    icon: Tag,
    color: "var(--type-selling)",
    placeholder: "Wat heb je te bieden? Product, dienst of capaciteit…",
  },
  hiring: {
    label: "Vacature",
    verb: "werft",
    icon: Users,
    color: "var(--type-hiring)",
    placeholder: "Wie zoek je? Functie, locatie, capaciteit…",
  },
  milestone: {
    label: "Mijlpaal",
    verb: "viert",
    icon: Trophy,
    color: "var(--type-investment)",
    placeholder: "Welke mijlpaal wil je delen?",
  },
  poll: {
    label: "Poll",
    verb: "vraagt",
    icon: BarChart3,
    color: "var(--type-capacity)",
    placeholder: "Waar wil je de mening van anderen over?",
  },
  event: {
    label: "Event",
    verb: "organiseert",
    icon: CalendarDays,
    color: "var(--type-service)",
    placeholder: "Welk evenement, beurs of bijeenkomst deel je?",
  },
  // legacy marketplace types mapped to social labels
  sourcing: {
    label: "Inkoop",
    verb: "zoekt",
    icon: Search,
    color: "var(--type-sourcing)",
    placeholder: "Beschrijf wat je zoekt — product, aantal, specificaties…",
  },
  selling: {
    label: "Verkoop",
    verb: "verkoopt",
    icon: Tag,
    color: "var(--type-selling)",
    placeholder: "Wat verkoop je? Vermeld aantal, staat en prijs…",
  },
  service: {
    label: "Dienst",
    verb: "biedt aan",
    icon: Wrench,
    color: "var(--type-service)",
    placeholder: "Beschrijf de dienst die je aanbiedt…",
  },
  partnership: {
    label: "Samenwerking",
    verb: "zoekt partner",
    icon: Handshake,
    color: "var(--type-partnership)",
    placeholder: "Wat voor samenwerking zoek je?",
  },
  capacity: {
    label: "Capaciteit",
    verb: "heeft capaciteit",
    icon: Warehouse,
    color: "var(--type-capacity)",
    placeholder: "Welke capaciteit is beschikbaar?",
  },
  announcement: {
    label: "Aankondiging",
    verb: "kondigt aan",
    icon: Megaphone,
    color: "var(--type-announcement)",
    placeholder: "Deel je mijlpaal, uitbreiding of evenement…",
  },
  investment: {
    label: "Investering",
    verb: "investeert",
    icon: TrendingUp,
    color: "var(--type-investment)",
    placeholder: "Kapitaal ophalen of investeren? Deel de kans…",
  },
};

export const POST_TYPES = NEED_TYPES;

export const POST_TYPE_ORDER: PostType[] = [
  "update",
  "question",
  "offer",
  "hiring",
  "milestone",
  "poll",
  "event",
];

/** @deprecated use POST_TYPE_ORDER */
export const NEED_TYPE_ORDER = POST_TYPE_ORDER;
