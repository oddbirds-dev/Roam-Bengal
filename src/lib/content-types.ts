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
  "tour_duration",
  "tour_location",
  "best_season",
  "group_size",
  "accommodation",
  "transportation",
  "meals",
  "guiding_method",
  "language",
  "min_age",
  "fitness_level",
  "pickup_drop",
  "arrival",
  "departure",
  "max_age",
  "max_altitude",
] as const;

export type TourFactKey = (typeof TOUR_FACT_KEYS)[number];

/** Facts a single-day tour rarely needs — hidden behind a toggle in the admin editor. */
export const TOUR_FACT_KEYS_EXTRA: readonly TourFactKey[] = [
  "accommodation",
  "arrival",
  "departure",
];

/** Label + icon per fact key. Shared by the public page and the admin editor so the
 *  two cannot drift. */
export const TOUR_FACT_META: Record<TourFactKey, { label: string; icon: string }> = {
  tour_type: { label: "Tour Type", icon: "🚶" },
  tour_duration: { label: "Tour Duration", icon: "🕒" },
  tour_location: { label: "Tour Location", icon: "📍" },
  best_season: { label: "Best Season", icon: "🌤️" },
  group_size: { label: "Group Type", icon: "👥" },
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

/**
 * House defaults for the fact grid, taken from the Dhaka day tour the reference design
 * was drawn from. A new tour starts with these in the admin editor, and a tour saved
 * before a key existed still renders one on the public page — whatever the tour itself
 * stores, or can derive from its own columns, wins over the value here.
 *
 * `max_age` and `max_altitude` are deliberately absent: there is no sensible house value.
 */
export const TOUR_FACT_DEFAULTS: TourFacts = {
  tour_type: "Cultural",
  tour_duration: "8 +/- Hours",
  tour_location: "Dhaka",
  best_season: "Year Round",
  group_size: "Private",
  accommodation: "Excluded",
  transportation: "Private",
  meals: "Included",
  guiding_method: "Full Time",
  language: "English",
  min_age: "12+ Years",
  fitness_level: "Moderate",
  pickup_drop: "Included",
  arrival: "Dhaka",
  departure: "Dhaka",
};

/** `overview` stores its paragraphs as one string, separated by a blank line. */
export function overviewParagraphs(overview: string | null): string[] {
  if (!overview) return [];
  return overview
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Strips the markup `overview` copy carries — the admin toolbar's raw `<span>`/`<b>` tags
 * plus markdown emphasis — for the places that print it as plain text instead of running
 * it through `FormatText`: card teasers and SEO meta descriptions.
 */
export function plainText(markup: string): string {
  return markup
    .replace(/<[^>]*>/g, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*\*|\*\*|\*|___|__|_|~~|`)/g, "")
    .replace(/^\s*#{1,6}\s*/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

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

/**
 * One per-group-size rate in the tour pricing block, in display order.
 *
 * Editorial numbers rather than a formula: a solo supplement is not a fixed multiple of
 * the four-person rate. `badge` doubles as the corner ribbon text, so an empty string
 * means "no ribbon" and there is no separate boolean to keep in sync.
 */
export interface PriceTier {
  label: string;
  persons: number | null;
  price: number | null;
  note: string;
  badge: string;
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
  heroImage: string | null;
  images: string[];
  durationLabel: string | null;
  durationDays: number;
  priceUsd: number | null;
  priceBdt: number | null;
  discountPriceUsd: number | null;
  /** Blank hides the child row in the booking box. */
  childPriceUsd: number | null;
  discountChildPriceUsd: number | null;
  priceNote: string | null;
  priceTiers: PriceTier[];
  rating: number | null;
  reviewsCount: number;
  destinationLabel: string | null;
  activityLabel: string | null;
  primaryDestinationSlug: string | null;
  isFeatured: boolean;
  activitiesCount: number | null;
  groupSizeMax: number | null;
  stopsCount: number | null;
  facts: TourFacts;
  /** Multiple paragraphs are blank-line separated within the one string; see `FormatDocument`. */
  overview: string | null;
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
  /** Curated "read next" slugs. Empty means fall back to the newest other posts. */
  relatedSlugs: string[];
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
