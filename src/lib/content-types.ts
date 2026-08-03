/**
 * DTO shapes shared between the server functions and the components.
 *
 * These mirror the Postgres schema in the `Roam Bengal` Supabase project
 * (ref `ctrqaotwumvsetnpflvd`) after normalisation: Postgres `numeric` arrives over the
 * wire as a string, and `null` array columns become `[]`, so every mapper coerces.
 */

export type TourCategory = "day-tour" | "multi-day" | "holiday";

/** Ordered fact keys for the tour page's icon grid. */
export const TOUR_FACT_KEYS = [
  "tour_type",
  "best_season",
  "group_size",
  "accommodation",
  "transportation",
  "meals",
  "guiding_method",
  "language",
  "min_age",
  "max_age",
  "fitness_level",
  "max_altitude",
  "pickup_drop",
  "arrival",
  "departure",
] as const;

export type TourFactKey = (typeof TOUR_FACT_KEYS)[number];

/** Label + icon per fact key. Shared by the public page and the admin editor so the
 *  two cannot drift. */
export const TOUR_FACT_META: Record<TourFactKey, { label: string; icon: string }> = {
  tour_type: { label: "Tour Type", icon: "🚶" },
  best_season: { label: "Best Season", icon: "🌤️" },
  group_size: { label: "Group Size", icon: "👥" },
  accommodation: { label: "Accommodation", icon: "🏨" },
  transportation: { label: "Transport", icon: "🚐" },
  meals: { label: "Tour Meals", icon: "🍽️" },
  guiding_method: { label: "Guiding Method", icon: "🧭" },
  language: { label: "Tour Language", icon: "🗣️" },
  min_age: { label: "Age Limit", icon: "📅" },
  max_age: { label: "Max Age", icon: "📆" },
  fitness_level: { label: "Fitness Level", icon: "💓" },
  max_altitude: { label: "Max Altitude", icon: "⛰️" },
  pickup_drop: { label: "Pickup & Drop", icon: "🚗" },
  arrival: { label: "Arrival On", icon: "🛬" },
  departure: { label: "Depart From", icon: "🛫" },
};

export type TourFacts = Partial<Record<TourFactKey, string>>;

export interface ItineraryDay {
  day: number;
  title: string;
  detail: string;
}

export interface GlanceEntry {
  when: string;
  detail: string;
}

export interface AddonEntry {
  icon: string;
  title: string;
  detail: string;
}

export interface OfferCard {
  title: string;
  items: string[];
}

export interface AccessibilityEntry {
  label: string;
  detail: string;
}

export interface AdviceBlock {
  title: string;
  items: string[];
}

export interface TourFaq {
  question: string;
  answer: string;
}

export interface TourDTO {
  id: string;
  slug: string;
  title: string;
  category: TourCategory;
  summary: string | null;
  heroImage: string | null;
  images: string[];
  durationLabel: string | null;
  durationDays: number;
  priceUsd: number | null;
  discountPriceUsd: number | null;
  priceNote: string | null;
  rating: number | null;
  reviewsCount: number;
  destinationLabel: string | null;
  activityLabel: string | null;
  isFeatured: boolean;
  activitiesCount: number | null;
  groupSizeMax: number | null;
  stopsCount: number | null;
  facts: TourFacts;
  overview: string[];
  overviewTip: string | null;
  highlights: string[];
  glance: GlanceEntry[];
  addons: AddonEntry[];
  itinerary: ItineraryDay[];
  offers: OfferCard[];
  inclusions: string[];
  exclusions: string[];
  accessibility: AccessibilityEntry[];
  advice: AdviceBlock[];
  pledge: string[];
  whyItems: string[];
  faqs: TourFaq[];
  mapEmbed: string | null;
  videoUrl: string | null;
  relatedSlugs: string[];
}

export interface ActivityDTO {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface BlogPostDTO {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string[];
  category: string | null;
  dateLabel: string | null;
  readTime: string | null;
  coverImage: string | null;
  authorName: string | null;
  authorRole: string | null;
  authorAvatar: string | null;
  isFeatured: boolean;
}

export interface TestimonialDTO {
  id: string;
  author: string;
  location: string | null;
  headline: string | null;
  quote: string;
  tourLabel: string | null;
  platform: string | null;
  avatarUrl: string | null;
  images: string[];
  rating: number | null;
  isFeatured: boolean;
}

export interface FaqDTO {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

/**
 * `site_settings` is a key/value table; each key has its own informal shape.
 *
 * Typed as JSON rather than `unknown` because server function return values must be
 * provably serializable — `unknown` fails that check.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SettingsMap = Record<string, JsonValue>;
