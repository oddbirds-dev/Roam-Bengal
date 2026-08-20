/* Gradients the reference sets inline or per-nth-child, kept verbatim, shared by the
 * individual homepage section components below `registry.ts`. */

export const TOUR_FRAMES = [
  "linear-gradient(160deg,#F0791E,#C43B0E)",
  "linear-gradient(160deg,#22B57A,#0B6B47)",
  "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
];
export const GALLERY_FRAMES = [
  "linear-gradient(160deg,#3E7A6E,#123D30)",
  "linear-gradient(160deg,#C4390E,#7A2408)",
  "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
  "linear-gradient(160deg,#F0791E,#C43B0E)",
];
export const BLOG_FRAMES = [
  "linear-gradient(160deg,#F0791E,#C43B0E)",
  "linear-gradient(160deg,#22B57A,#0B6B47)",
  "linear-gradient(160deg,#C4390E,#7A2408)",
];
/** Brand colours for the review platforms the logo map in `reviews-section.tsx` knows.
 *  A platform the map has never heard of falls back to its `colour` from site settings. */
export const PLATFORM_BRANDS: Record<string, string> = {
  tripadvisor: "#00AA6C",
  google: "#EA9C1B",
  trustpilot: "#00B67A",
  facebook: "#1877F2",
};

/** Card tint paired with its avatar fill, cycled across the testimonial cards so a row
 *  of three reads as three distinct cards rather than one repeated block. */
export const REVIEW_CARD_TINTS = [
  { bg: "#EDF3ED", avatar: "#1E9E63" },
  { bg: "#FBF1DC", avatar: "#E0A612" },
  { bg: "#EEF1F8", avatar: "#4A7EBB" },
];

export const FEATURE_BG = "linear-gradient(120deg,#FCEFD9,#F7E2C0)";
export const TOURS_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
export const STORY_BG = "linear-gradient(120deg,#FDF0E4,#EAF4EC)";
export const DREAM_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
/** The reviews band is the one homepage section on bare paper-cream: the white platform
 *  badges, the tinted quote cards, and the green shoreline supply all of its colour. */
export const REVIEWS_BG = "linear-gradient(180deg,#FBF7EF,#F7F2E6 55%,#F5F0E4)";
/** Colour of the contour lines drifting behind the reviews heading. */
export const REVIEWS_TOPO_LINE = "#1E5F3B";
