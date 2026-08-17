import type { ComponentType } from "react";
import type { TourDTO, BlogPostDTO, TestimonialDTO } from "@/lib/content-types";
import { FeaturesSection } from "./features-section";
import { PopularToursSection } from "./popular-tours-section";
import { GallerySection } from "./gallery-section";
import { FaithSection } from "./faith-section";
import { JournalSection } from "./journal-section";
import { ReviewsSection } from "./reviews-section";
import { WhyChooseUsSection } from "./why-choose-us-section";
import { DreamCtaSection } from "./dream-cta-section";

export interface HomeSectionProps {
  tours: TourDTO[];
  testimonials: TestimonialDTO[];
  posts: BlogPostDTO[];
}

/**
 * Every homepage section below the (always-first, non-reorderable) hero.
 *
 * Registered once here so the admin builder (`homepage-sections` route) and the public
 * homepage (`routes/index.tsx`) can't drift: adding a section means adding it to this map,
 * nowhere else.
 */
export const HOME_SECTION_IDS = [
  "features",
  "popularTours",
  "gallery",
  "faith",
  "journal",
  "reviews",
  "whyChooseUs",
  "dreamCta",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export interface HomeSectionMeta {
  label: string;
  blurb: string;
  Component: ComponentType<HomeSectionProps>;
}

export const HOME_SECTIONS: Record<HomeSectionId, HomeSectionMeta> = {
  features: {
    label: "Feature strip",
    blurb: "The row of small icons + labels just under the hero.",
    Component: FeaturesSection,
  },
  popularTours: {
    label: "Popular tours",
    blurb: "Up to three featured tours, with a link to the full tours page.",
    Component: PopularToursSection,
  },
  gallery: {
    label: "Photo gallery",
    blurb: "The grid of destination photos.",
    Component: GallerySection,
  },
  faith: {
    label: "Why travellers trust us",
    blurb: "Guide and traveller photos alongside the numbered trust list and callouts.",
    Component: FaithSection,
  },
  journal: {
    label: "Journal",
    blurb: "Up to three recent blog posts.",
    Component: JournalSection,
  },
  reviews: {
    label: "Reviews",
    blurb: "Platform ratings and featured testimonials on a dark band.",
    Component: ReviewsSection,
  },
  whyChooseUs: {
    label: "Why choose us",
    blurb: "The reasons-to-book list next to a photo.",
    Component: WhyChooseUsSection,
  },
  dreamCta: {
    label: "Dream trip CTA",
    blurb: "The closing call-to-action band with the Dhaka illustration.",
    Component: DreamCtaSection,
  },
};

export const DEFAULT_HOME_ORDER: HomeSectionId[] = [...HOME_SECTION_IDS];

/**
 * Which `site_settings` key's editor a section's wording/photos live under — for the
 * homepage-sections builder's per-row "Edit" link. Most sections share the `homepage` key;
 * gallery and reviews have their own.
 */
export const HOME_SECTION_SETTINGS_KEY: Record<HomeSectionId, string> = {
  features: "homepage",
  popularTours: "homepage",
  gallery: "gallery",
  faith: "homepage",
  journal: "homepage",
  reviews: "reviews",
  whyChooseUs: "homepage",
  dreamCta: "homepage",
};

export function isHomeSectionId(value: unknown): value is HomeSectionId {
  return typeof value === "string" && (HOME_SECTION_IDS as readonly string[]).includes(value);
}
