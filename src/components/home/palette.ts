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
/** The rating mark under each platform name, per `.pb-dots` / `.pb-star` / `.pb-square`. */
export const PLATFORM_MARKS = [
  { glyph: "●●●●●", colour: "#00A870" },
  { glyph: "★", colour: "#F2B705" },
  { glyph: "■", colour: "#00B67A" },
  { glyph: "★", colour: "#D9450F" },
];
export const AVATAR_FRAMES = [
  "linear-gradient(150deg,#22B57A,#0B6B47)",
  "linear-gradient(150deg,#C4390E,#5C1C05)",
  "linear-gradient(150deg,#D9450F,#7A2408)",
];

export const FEATURE_BG = "linear-gradient(120deg,#FCEFD9,#F7E2C0)";
export const TOURS_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
export const STORY_BG = "linear-gradient(120deg,#FDF0E4,#EAF4EC)";
export const DREAM_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
export const REVIEWS_BG = "linear-gradient(160deg,#0B2818,#123D26 55%,#0B2818)";
export const REVIEWS_BLOBS = [
  "radial-gradient(ellipse 420px 300px at 12% 15%, #22B57A, transparent 70%)",
  "radial-gradient(ellipse 380px 320px at 90% 10%, #F2B705, transparent 70%)",
  "radial-gradient(ellipse 400px 340px at 85% 90%, #C4390E, transparent 70%)",
  "radial-gradient(ellipse 320px 300px at 8% 90%, #D9450F, transparent 70%)",
].join(",");
export const REVIEWS_MAP_MASK = [
  "radial-gradient(ellipse 70% 60% at 20% 20%, black 40%, transparent 75%)",
  "radial-gradient(ellipse 60% 50% at 80% 15%, black 40%, transparent 75%)",
  "radial-gradient(ellipse 55% 60% at 75% 75%, black 40%, transparent 75%)",
  "radial-gradient(ellipse 40% 40% at 10% 80%, black 40%, transparent 75%)",
].join(",");
