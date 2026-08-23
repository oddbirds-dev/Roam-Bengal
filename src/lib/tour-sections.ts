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
  | "pricing"
  | "rating"
  | "images"
  | "themes"
  | "facts"
  | "overview"
  | "itinerary"
  | "included"
  | "advice"
  | "extras";

/**
 * The parts of the tour form the content checks read. Declared structurally so this module
 * does not import from the route it serves — the editor's `TourForm` satisfies it.
 */
export interface TourSectionFields {
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
    id: "pricing",
    label: "Pricing",
    hint: "Prices, discounts, and group price tiers.",
    hasContent: (f) =>
      f.price_usd !== null ||
      f.price_bdt !== null ||
      f.discount_price_usd !== null ||
      f.child_price_usd !== null ||
      f.discount_child_price_usd !== null ||
      f.price_note.trim() !== "" ||
      f.price_tiers.length > 0,
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
    label: "Overview & highlights",
    hint: "The opening description, the good-to-know tip, and the highlight list.",
    hasContent: (f) =>
      f.overview.trim() !== "" || f.overview_tip.trim() !== "" || some(f.highlights),
  },
  {
    id: "itinerary",
    label: "Itinerary",
    hint: "Day-by-day plan, the at-a-glance schedule, and add-ons. Rarely needed on a day tour.",
    hasContent: (f) => f.itinerary.length > 0 || f.glance.length > 0 || f.addons.length > 0,
  },
  {
    id: "included",
    label: "What's included",
    hint: "Inclusions, exclusions, and the offer cards.",
    hasContent: (f) => some(f.inclusions) || some(f.exclusions) || f.offers.length > 0,
  },
  {
    id: "advice",
    label: "Advice & responsibilities",
    hint: "Travel advice blocks, accessibility notes, the pledge, and why-choose-us lines.",
    hasContent: (f) =>
      f.advice.length > 0 ||
      f.accessibility.length > 0 ||
      some(f.pledge) ||
      some(f.why_items),
  },
  {
    id: "extras",
    label: "FAQs, map & video",
    hint: "Tour FAQs, the map embed, a video, and related tours.",
    hasContent: (f) =>
      f.faqs.length > 0 ||
      f.map_embed.trim() !== "" ||
      f.video_url.trim() !== "" ||
      f.related_slugs.length > 0,
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
