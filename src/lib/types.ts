export type PostType =
  | "update"
  | "question"
  | "offer"
  | "hiring"
  | "milestone"
  | "poll"
  | "event"
  // legacy values still stored in older rows
  | "sourcing"
  | "selling"
  | "service"
  | "partnership"
  | "capacity"
  | "announcement"
  | "investment";

/** @deprecated use PostType */
export type NeedType = PostType;

export type NetworkType = "municipality" | "province" | "industry" | "national";

export interface Company {
  id: string;
  name: string;
  handle: string;
  logoColor: string; // hex/gradient seed for monogram
  industry: string;
  city: string;
  province: string;
  country: string;
  municipality?: string;
  municipalityId?: string;
  address?: string;
  postcode?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  kvkNumber?: string;
  vatNumber?: string;
  logoUrl?: string;
  bannerUrl?: string;
  bannerCropData?: { x: number; y: number; zoom: number } | null;
  logoCropData?: { x: number; y: number; zoom: number } | null;
  verified: boolean;
  rating: number; // 0-5
  ratingCount: number;
  followers: number;
  following: number;
  memberSince: string; // ISO
  products: { id: string; name: string; description: string }[];
  networks: string[]; // network ids
}

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  html?: string;
  provider?: string;
}

export interface PostAttachment {
  id?: string;
  type: "image" | "video" | "document";
  url: string;
  filename?: string;
  position: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  isPrimary?: boolean;
}

export interface DraftData {
  type?: PostType;
  body?: string;
  quantity?: string;
  budget?: string;
  networkIds?: string[];
  attachments?: PostAttachment[];
  linkUrl?: string;
  linkData?: LinkPreviewData;
  expiresDays?: number | null;
}

export interface Draft {
  id: string;
  companyId: string;
  data: DraftData;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  id: string;
  companyId: string;
  type: PostType;
  body: string;
  quantity?: string;
  budget?: string;
  imageUrl?: string;
  videoUrl?: string;
  documentUrl?: string;
  attachments: PostAttachment[];
  linkUrl?: string;
  linkData?: LinkPreviewData;
  networks: string[]; // network ids
  status: "open" | "in_conversation" | "fulfilled";
  reactions: number;
  comments: number;
  views: number;
  saved?: boolean;
  liked?: boolean;
  createdAt: string; // ISO
  expiresAt?: string; // ISO
}

/** @deprecated use Post */
export type Need = Post;

export interface PostComment {
  id: string;
  companyId: string;
  companyName: string;
  logoColor: string;
  body: string;
  createdAt: string; // ISO
}

export interface Network {
  id: string;
  name: string;
  type: NetworkType;
  slug: string;
  description: string;
  provinceId?: string;
  members: number;
  activeToday: number;
}


export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface MessageAttachment {
  id?: string;
  storageKey?: string;
  url: string;
  type: "image" | "video" | "document" | "voice";
  mimeType?: string;
  originalName?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface Message {
  id: string;
  fromMe: boolean;
  kind: "text" | "image" | "video" | "document" | "voice" | "location" | "card" | "system";
  body: string;
  meta?: string;
  time: string; // ISO
  status: MessageStatus;
  readAt?: string;
  editedAt?: string;
  deleted?: boolean;
  replyToId?: string;
  attachments?: MessageAttachment[];
}

export interface Conversation {
  id: string;
  companyId: string;
  needId?: string;
  unread: number;
  messages: Message[];
}

export type NotificationType =
  | "response"
  | "match"
  | "follow"
  | "network"
  | "expiry";

export interface AppNotification {
  id: string;
  type: NotificationType;
  companyId?: string;
  title: string;
  body: string;
  time: string; // ISO
  read: boolean;
  needId?: string;
}

/* ─────────────────────── Opportunities ─────────────────────── */

export type OpportunityType =
  | "request"
  | "job"
  | "sourcing"
  | "offer"
  | "capacity"
  | "partnership"
  | "urgent";

export type OpportunityStatus =
  | "draft"
  | "active"
  | "matching"
  | "responses_received"
  | "in_conversation"
  | "party_selected"
  | "preparing_deal"
  | "completed"
  | "cancelled"
  | "expired";

export type UrgencyLevel = "normal" | "week" | "hours_48" | "urgent_today";

export type BudgetType =
  | "fixed"
  | "range"
  | "per_hour"
  | "per_unit"
  | "per_project"
  | "open"
  | "discuss";

export type LocationType = "on_site" | "remote" | "delivery";

export type RecurrenceType = "one_time" | "recurring";

export type VisibilityMode = "public" | "matched_only" | "after_interest";

export type AccountType = "business" | "consumer";

export type AvailabilityStatus =
  | "available"
  | "limited"
  | "urgent_only"
  | "available_from"
  | "unavailable";

export type NotificationFrequency =
  | "instant"
  | "hourly"
  | "twice_daily"
  | "daily"
  | "urgent_only"
  | "paused"
  | "disabled";

export type MatchStatus =
  | "pending"
  | "delivered"
  | "opened"
  | "interested"
  | "dismissed"
  | "not_relevant"
  | "expired";

export type ResponseStatus =
  | "interested"
  | "question"
  | "selected"
  | "not_selected"
  | "withdrawn";

export type DistributionRoundStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export interface ServiceCategory {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  level: number;
  sortOrder: number;
  active: boolean;
}

export interface CompanyService {
  id: string;
  companyId: string;
  categoryId: string | null;
  keywords: string[];
  active: boolean;
}

export interface CompanyServiceArea {
  id: string;
  companyId: string;
  serviceId: string | null;
  areaType: "radius" | "municipality" | "province" | "national" | "international";
  municipality?: string;
  province?: string;
  radiusKm?: number;
  country: string;
}

export interface CompanyOpportunityPreferences {
  minBudget?: number;
  maxDistanceKm: number;
  minProjectSize?: string;
  maxProjectSize?: string;
  acceptsUrgent: boolean;
  acceptsBusiness: boolean;
  acceptsConsumer: boolean;
  acceptsRecurring: boolean;
  availabilityStatus: AvailabilityStatus;
  availableFrom?: string;
  maxNotificationsPerDay: number;
  notificationFrequency: NotificationFrequency;
  quietHoursStart: string;
  quietHoursEnd: string;
  active: boolean;
}

export interface Opportunity {
  id: string;
  companyId: string;
  opportunityType: OpportunityType;
  title: string;
  description?: string;
  categoryId?: string;
  status: OpportunityStatus;
  urgency: UrgencyLevel;
  budgetType: BudgetType;
  budgetMin?: number;
  budgetMax?: number;
  currency: string;
  quantity?: string;
  unit?: string;
  locationType: LocationType;
  municipality?: string;
  province?: string;
  country: string;
  startDate?: string;
  endDate?: string;
  responseDeadline?: string;
  recurrenceType: RecurrenceType;
  visibilityMode: VisibilityMode;
  accountType: AccountType;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
}

export interface OpportunityMatch {
  id: string;
  opportunityId: string;
  companyId: string;
  totalScore: number;
  categoryScore: number;
  locationScore: number;
  availabilityScore: number;
  budgetScore: number;
  timingScore: number;
  preferenceScore: number;
  qualityScore: number;
  historyScore: number;
  reasons: string[];
  ruleVersion: string;
  roundNumber: number;
  status: MatchStatus;
  matchedAt: string;
  deliveredAt?: string;
  openedAt?: string;
  dismissedAt?: string;
}

export interface OpportunityResponse {
  id: string;
  opportunityId: string;
  respondingCompanyId: string;
  status: ResponseStatus;
  message: string;
  priceType?: BudgetType;
  priceMin?: number;
  priceMax?: number;
  availableFrom?: string;
  createdAt: string;
  withdrawnAt?: string;
}

export interface DistributionRound {
  id: string;
  opportunityId: string;
  roundNumber: number;
  startedAt: string;
  completedAt?: string;
  targetCount: number;
  minimumScore: number;
  radiusKm?: number;
  status: DistributionRoundStatus;
  triggerReason?: string;
}

export interface OpportunityCard extends Opportunity {
  companyName: string;
  companyLogoColor: string;
  companyLogoUrl?: string;
  companyVerified: boolean;
  categoryPath: string;
  responseCount: number;
  matchScore?: number;
  matchReasons?: string[];
  matchStatus?: MatchStatus;
  distanceKm?: number;
}

export interface OpportunityDraft {
  id: string;
  companyId: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
