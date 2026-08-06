import {
  INFO_SLUGS,
  POLICY_SLUGS,
  infoDefaults,
  policyDefaults,
} from "@/content/policy-defaults";

/**
 * The set of things an editor can link to, in one shape.
 *
 * Tours and posts are fetched at runtime (`adminListLinkTargets`); the static pages are
 * derived here from the same slug tables the routes use, so adding a policy or info page
 * adds a link target with no extra work. The link audit reads the same registry to decide
 * whether an internal href is broken.
 */

export type LinkTargetKind = "tour" | "post" | "page";

export interface LinkTarget {
  kind: LinkTargetKind;
  /** Resolved public path, e.g. "/tours/sundarbans-3d2n". Unique key. */
  path: string;
  label: string;
  /** Section heading in the picker. */
  group: string;
  /** Present for tour/post. The related-content picker returns this, not `path`. */
  slug?: string;
  /** Extra text to match against — category, excerpt, eyebrow. */
  keywords?: string[];
  published?: boolean;
}

/** Top-level routes with no slug table behind them. */
const FIXED_PAGES: LinkTarget[] = [
  { kind: "page", path: "/", label: "Home", group: "Pages" },
  { kind: "page", path: "/tours", label: "All Tours", group: "Pages" },
  { kind: "page", path: "/blog", label: "Blog", group: "Pages" },
  { kind: "page", path: "/about", label: "About Us", group: "Pages" },
  { kind: "page", path: "/contact", label: "Contact", group: "Pages" },
  { kind: "page", path: "/reviews", label: "Reviews", group: "Pages" },
];

const POLICY_PAGES: LinkTarget[] = POLICY_SLUGS.map((slug) => ({
  kind: "page" as const,
  path: `/policies/${slug}`,
  label: policyDefaults[slug].title,
  group: "Policies",
  keywords: [slug, policyDefaults[slug].eyebrow],
}));

// Info pages sit at the root via the `$infoSlug` catch-all, not under a prefix.
const INFO_PAGES: LinkTarget[] = INFO_SLUGS.map((slug) => ({
  kind: "page" as const,
  path: `/${slug}`,
  label: infoDefaults[slug].title,
  group: "Information",
  keywords: [slug, infoDefaults[slug].eyebrow],
}));

export const STATIC_LINK_TARGETS: LinkTarget[] = [
  ...FIXED_PAGES,
  ...POLICY_PAGES,
  ...INFO_PAGES,
];

/** Every path that resolves without a database lookup — the audit's "not broken" set. */
export const KNOWN_STATIC_PATHS: ReadonlySet<string> = new Set(
  STATIC_LINK_TARGETS.map((t) => t.path),
);

function haystack(target: LinkTarget): string {
  return [target.label, target.path, ...(target.keywords ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Ranked substring search. A prefix match on the label beats a match at a word boundary,
 * which beats a match anywhere — so typing "sun" puts "Sundarbans" above "Rangamati Sun
 * Trek". Ties keep the incoming order, which is title-sorted from the server.
 */
export function searchTargets(targets: LinkTarget[], query: string): LinkTarget[] {
  const q = query.trim().toLowerCase();
  if (!q) return targets.slice(0, 60);

  const scored: { target: LinkTarget; score: number; index: number }[] = [];
  targets.forEach((target, index) => {
    const label = target.label.toLowerCase();
    let score: number;
    if (label.startsWith(q)) score = 0;
    else if (new RegExp(`\\b${escapeRegex(q)}`).test(label)) score = 1;
    else if (haystack(target).includes(q)) score = 2;
    else return;
    scored.push({ target, score, index });
  });

  return scored
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .slice(0, 60)
    .map((s) => s.target);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
