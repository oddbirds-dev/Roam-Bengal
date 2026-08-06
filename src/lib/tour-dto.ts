import type { TourCategory, TourDTO, TourFacts } from "@/lib/content-types";

/**
 * Row → DTO for a `tours` record.
 *
 * This lives outside `site-content.functions.ts` because it has to run on the client as
 * well: the admin editor maps unsaved form state through it to drive the live preview.
 * A second, hand-written mapper over there is exactly how a preview drifts from the page
 * it claims to preview.
 *
 * Everything is coerced rather than trusted. Postgres `numeric` arrives over the wire as
 * a string, `null` array columns become `[]`, and a column from a migration that has not
 * been applied comes back `undefined` — which slips past a plain `!== null` guard and
 * becomes NaN.
 */
export type TourRowLike = Record<string, unknown>;

const CATEGORIES: TourCategory[] = ["day-tour", "multi-day", "holiday"];

export function toTourDTO(row: TourRowLike): TourDTO {
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    // The DB CHECK constraint enforces this, but a legacy value would otherwise widen
    // the union and break exhaustive handling downstream.
    category: CATEGORIES.includes(row.category as TourCategory)
      ? (row.category as TourCategory)
      : "multi-day",
    summary: text(row.summary),
    heroImage: text(row.hero_image),
    images: strArr(row.images),
    durationLabel: text(row.duration_label),
    durationDays: intOr(row.duration_days, 1),
    priceUsd: num(row.price_usd),
    priceBdt: num(row.price_bdt),
    discountPriceUsd: num(row.discount_price_usd),
    childPriceUsd: num(row.child_price_usd),
    discountChildPriceUsd: num(row.discount_child_price_usd),
    priceNote: text(row.price_note),
    priceTiers: arr(row.price_tiers),
    rating: num(row.rating),
    reviewsCount: intOr(row.reviews_count, 0),
    destinationLabel: text(row.destination_label),
    activityLabel: text(row.activity_label),
    primaryDestinationSlug: text(row.primary_destination_slug),
    isFeatured: Boolean(row.is_featured),
    activitiesCount: num(row.activities_count),
    groupSizeMax: num(row.group_size_max),
    stopsCount: num(row.stops_count),
    facts: jsonObject(row.facts) as TourFacts,
    overview: arr<string>(row.overview),
    overviewTip: text(row.overview_tip),
    highlights: strArr(row.highlights),
    glance: arr(row.glance),
    addons: arr(row.addons),
    itinerary: arr(row.itinerary),
    offers: arr(row.offers),
    inclusions: strArr(row.inclusions),
    exclusions: strArr(row.exclusions),
    accessibility: arr(row.accessibility),
    advice: arr(row.advice),
    pledge: strArr(row.pledge),
    whyItems: strArr(row.why_items),
    faqs: arr(row.faqs),
    mapEmbed: text(row.map_embed),
    videoUrl: text(row.video_url),
    relatedSlugs: strArr(row.related_slugs),
  };
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function intOr(value: unknown, fallback: number): number {
  return num(value) ?? fallback;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Empty strings collapse to null so the page falls back instead of rendering a blank. */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function arr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function strArr(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

function jsonObject(value: unknown): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, string>;
  }
  return {};
}
