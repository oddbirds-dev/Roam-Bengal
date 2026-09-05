/**
 * The tour editor's optional sections.
 *
 * These toggles are about the editor form, not the website. The public tour page already
 * hides any section it has no content for (see `hasSection` in routes/tours.$slug.tsx), so
 * switching one off here cannot remove anything from the live site — it just stops a
 * one-day tour having to scroll past the fields for a day-by-day itinerary it will never
 * have. `hasContent` exists so the editor can say plainly when a section being switched
 * off is not actually empty.
 *
 * The stored value is the list of sections that are OFF. A section added to this file
 * later is therefore visible everywhere by default, rather than silently missing from
 * every tour saved before it existed.
 */

export type TourSectionId =
  | "seo"
  | "pricing"
  | "rating"
  | "images"
  | "themes"
  | "facts"
  | "overview"
  | "highlights"
  | "glance"
  | "itinerary"
  | "included"
  | "key_notes"
  | "why_us"
  | "faq"
  | "extras"
  | "blog_suggestions";

/**
 * The parts of the tour form the content checks read. Declared structurally so this module
 * does not import from the route it serves — the editor's `TourForm` satisfies it.
 */
export interface TourSectionFields {
  meta_title: string;
  meta_description: string;
  price_usd: number | null;
  price_bdt: number | null;
  discount_price_usd: number | null;
  child_price_usd: number | null;
  discount_child_price_usd: number | null;
  price_note: string;
  price_tiers: readonly unknown[];
  rating: number | null;
  reviews_count: number;
  activities_count: number | null;
  group_size_max: number | null;
  stops_count: number | null;
  sort_order: number;
  hero_image: string;
  images: readonly unknown[];
  facts: Record<string, string>;
  overview: string;
  overview_tip: string;
  highlights: readonly string[];
  itinerary: readonly unknown[];
  glance: readonly unknown[];
  addons: readonly unknown[];
  inclusions: readonly string[];
  exclusions: readonly string[];
  offers: readonly unknown[];
  advice: readonly unknown[];
  accessibility: readonly unknown[];
  pledge: readonly string[];
  why_items: readonly string[];
  faqs: readonly unknown[];
  map_embed: string;
  video_url: string;
  related_slugs: readonly string[];
  related_post_slugs: readonly string[];
}

export interface TourSection {
  id: TourSectionId;
  label: string;
  /** One line on what the section is for, shown beside its toggle. */
  hint: string;
  /** Whether this tour has anything saved in the section. `themeCount` is passed
   *  separately because theme links live in their own table, not on the tour row. */
  hasContent: (form: TourSectionFields, themeCount: number) => boolean;
}

/** Ignores blank entries — a list field left with one empty row is not content. */
const some = (values: readonly string[]) => values.some((v) => v.trim() !== "");

export const TOUR_SECTIONS: readonly TourSection[] = [
  {
    id: "seo",
    label: "Meta SEO",
    hint: "The search-result title and description for this tour's page.",
    hasContent: (f) => f.meta_title.trim() !== "" || f.meta_description.trim() !== "",
  },
  {
    id: "pricing",
    label: "Pricing",
    hint: "Prices, discounts, group price tiers, and the offer cards.",
    hasContent: (f) =>
      f.price_usd !== null ||
      f.price_bdt !== null ||
      f.discount_price_usd !== null ||
      f.child_price_usd !== null ||
      f.discount_child_price_usd !== null ||
      f.price_note.trim() !== "" ||
      f.price_tiers.length > 0 ||
      f.offers.length > 0,
  },
  {
    id: "rating",
    label: "Rating & ordering",
    hint: "Star score, review count, the numbers in the fact strip, and sort order.",
    hasContent: (f) =>
      f.rating !== null ||
      f.reviews_count > 0 ||
      f.activities_count !== null ||
      f.group_size_max !== null ||
      f.stops_count !== null ||
      f.sort_order > 0,
  },
  {
    id: "images",
    label: "Images",
    hint: "Hero image and gallery.",
    hasContent: (f) => f.hero_image.trim() !== "" || f.images.length > 0,
  },
  {
    id: "themes",
    label: "Themes",
    hint: "The filter pills this tour appears under on /tours.",
    hasContent: (_f, themeCount) => themeCount > 0,
  },
  {
    id: "facts",
    label: "Trip facts",
    hint: "The labelled fact grid — duration, group size, pickup, and the rest.",
    hasContent: (f) => Object.values(f.facts).some((v) => v.trim() !== ""),
  },
  {
    id: "overview",
    label: "Tour Introduction / Overview",
    hint: "The opening description and the good-to-know tip.",
    hasContent: (f) => f.overview.trim() !== "" || f.overview_tip.trim() !== "",
  },
  {
    id: "highlights",
    label: "Tour Highlights",
    hint: "The short bullet list of what makes this tour worth booking.",
    hasContent: (f) => some(f.highlights),
  },
  {
    id: "glance",
    label: "Itinerary at a Glance",
    hint: "The quick when/what schedule, and optional add-ons.",
    hasContent: (f) => f.glance.length > 0 || f.addons.length > 0,
  },
  {
    id: "itinerary",
    label: "Full-Day Itinerary (Step by Step)",
    hint: "The day-by-day (or step-by-step) plan. Rarely needed on a short day tour.",
    hasContent: (f) => f.itinerary.length > 0,
  },
  {
    id: "included",
    label: "Inclusions & Exclusions",
    hint: "What's covered by the price, and what isn't.",
    hasContent: (f) => some(f.inclusions) || some(f.exclusions),
  },
  {
    id: "key_notes",
    label: "Key Notes",
    hint: "Travel advice blocks, accessibility notes, and the responsible-travel pledge.",
    hasContent: (f) => f.advice.length > 0 || f.accessibility.length > 0 || some(f.pledge),
  },
  {
    id: "why_us",
    label: "Why Choose Roam Bengal for This Tour?",
    hint: "The short list of reasons to book this tour with us.",
    hasContent: (f) => some(f.why_items),
  },
  {
    id: "faq",
    label: "Package-Specific FAQ",
    hint: "Questions and answers specific to this tour.",
    hasContent: (f) => f.faqs.length > 0,
  },
  {
    id: "extras",
    label: "Map, video & related tours",
    hint: "The map embed, a video, and the “You Might Also Like” tours.",
    hasContent: (f) =>
      f.map_embed.trim() !== "" || f.video_url.trim() !== "" || f.related_slugs.length > 0,
  },
  {
    id: "blog_suggestions",
    label: "Blog Suggestions (for SEO & Internal Linking)",
    hint: "Blog posts to cross-link from this tour, shown as “From the Blog”.",
    hasContent: (f) => f.related_post_slugs.length > 0,
  },
];

/** For the settings form's toggle list. */
export const TOUR_SECTION_OPTIONS = TOUR_SECTIONS.map((section) => ({
  value: section.id,
  label: section.label,
  hint: section.hint,
}));

export function isSectionHidden(
  hidden: readonly string[] | undefined,
  id: TourSectionId,
): boolean {
  return hidden?.includes(id) ?? false;
}

/** Adds or removes one id, keeping the list free of duplicates. */
export function setSectionHidden(
  hidden: readonly string[],
  id: TourSectionId,
  isHidden: boolean,
): string[] {
  if (!isHidden) return hidden.filter((h) => h !== id);
  return hidden.includes(id) ? [...hidden] : [...hidden, id];
}
