import { KNOWN_STATIC_PATHS, type LinkTargetKind } from "@/lib/link-targets";

/**
 * Builds the site's internal link graph from raw content rows.
 *
 * Pure and dependency-free so it can be unit-tested and run server-side, where the whole
 * content corpus is already in memory and only the small report needs to cross the wire.
 *
 * The walker deliberately does not know the shape of a tour. Tours carry seventeen
 * array/JSON columns and blog bodies are a string array; enumerating them by name would
 * silently miss every column added afterwards. Instead every string leaf of every row is
 * scanned, so new fields are covered the day they appear.
 */

export type LinkSource = "body" | "nav" | "related";

export interface LinkNode {
  kind: LinkTargetKind;
  path: string;
  title: string;
  slug: string;
  published: boolean;
}

export interface LinkEdge {
  /** Path of the page containing the link, or "site" for header/footer navigation. */
  from: string;
  /** Raw href as authored. */
  to: string;
  anchor: string;
  source: LinkSource;
}

export interface ContentRow {
  slug: string;
  title: string;
  is_published?: boolean | null;
  related_slugs?: unknown;
  [key: string]: unknown;
}

/** Fields that hold identifiers or URLs rather than prose — scanning them yields noise. */
const SKIP_KEYS = new Set([
  "id",
  "slug",
  "created_at",
  "updated_at",
  "cover_image",
  "hero_image",
  "author_avatar",
  "avatar_url",
  "images",
  "map_embed_url",
  "video_url",
  "canonical_url",
  "og_image",
]);

/** Every string leaf of a JSON value, minus the keys above. */
export function collectStrings(value: unknown, key?: string): string[] {
  if (key && SKIP_KEYS.has(key)) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((v) => collectStrings(v));
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
      collectStrings(v, k),
    );
  }
  return [];
}

/** `[anchor](/path "title")` — the shape the link picker writes. */
const MD_LINK = /\[([^\]\n]*)\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;
/** Hand-authored HTML anchors, which the toolbar's raw-HTML mode allows. */
const HTML_LINK = /<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

export function extractLinks(text: string): { href: string; anchor: string }[] {
  const out: { href: string; anchor: string }[] = [];
  // Fast path: most strings in a tour row contain no link at all, and the walker feeds
  // this every string leaf on every row.
  if (!text) return out;
  if (!text.includes("](") && !/<a\s/i.test(text)) return out;

  MD_LINK.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MD_LINK.exec(text)) !== null) {
    out.push({ href: m[2] ?? "", anchor: (m[1] ?? "").trim() });
  }

  HTML_LINK.lastIndex = 0;
  while ((m = HTML_LINK.exec(text)) !== null) {
    out.push({ href: m[1] ?? "", anchor: (m[2] ?? "").replace(/<[^>]*>/g, "").trim() });
  }

  return out;
}

export interface LinkGraph {
  nodes: LinkNode[];
  edges: LinkEdge[];
}

export function buildLinkGraph({
  tours,
  posts,
  settings,
}: {
  tours: ContentRow[];
  posts: ContentRow[];
  settings: Record<string, unknown>;
}): LinkGraph {
  const nodes: LinkNode[] = [
    ...tours.map((t) => toNode(t, "tour", `/tours/${t.slug}`)),
    ...posts.map((p) => toNode(p, "post", `/blog/${p.slug}`)),
  ];

  const edges: LinkEdge[] = [];

  const walk = (row: ContentRow, from: string, prefix: string) => {
    for (const text of collectStrings(row)) {
      for (const { href, anchor } of extractLinks(text)) {
        edges.push({ from, to: href, anchor, source: "body" });
      }
    }
    for (const slug of asStringArray(row.related_slugs)) {
      edges.push({ from, to: `${prefix}${slug}`, anchor: "", source: "related" });
    }
  };

  tours.forEach((t) => walk(t, `/tours/${t.slug}`, "/tours/"));
  posts.forEach((p) => walk(p, `/blog/${p.slug}`, "/blog/"));

  // Header and footer navigation. Counted separately so "reachable only from the footer"
  // still registers as an orphan — which is the entire point of the orphan report.
  for (const { to, label } of collectNavLinks(settings)) {
    edges.push({ from: "site", to, anchor: label, source: "nav" });
  }

  return { nodes, edges };
}

function toNode(row: ContentRow, kind: LinkTargetKind, path: string): LinkNode {
  return {
    kind,
    path,
    slug: row.slug,
    title: row.title,
    published: row.is_published !== false,
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

/** `{ label, to }` pairs anywhere in site_settings — the shape LinkListField writes. */
function collectNavLinks(value: unknown): { to: string; label: string }[] {
  const out: { to: string; label: string }[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    // A row saved with a blank URL is kept on purpose: it still renders as a link, so the
    // audit has to see it. `label` is what distinguishes a link row from any other object
    // that happens to carry a `to` key.
    if (typeof record.to === "string" && (record.to || typeof record.label === "string")) {
      out.push({ to: record.to, label: typeof record.label === "string" ? record.label : "" });
    }
    Object.values(record).forEach(visit);
  };
  visit(value);
  return out;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

export interface LinkCount {
  path: string;
  title: string;
  kind: LinkTargetKind;
  published: boolean;
  inbound: number;
  outboundInternal: number;
  outboundExternal: number;
}

export interface LinkReport {
  broken: { from: string; fromTitle: string; to: string; anchor: string }[];
  orphans: { path: string; title: string; kind: LinkTargetKind }[];
  counts: LinkCount[];
  suggestions: { from: string; fromTitle: string; to: string; toTitle: string; mentions: number }[];
  totals: { internal: number; external: number; pages: number };
}

function isInternal(href: string): boolean {
  return href.startsWith("/");
}

/** Strips query and hash so `/tours/x?a=1#top` matches the `/tours/x` node. */
function normalizePath(href: string): string {
  const path = href.split(/[?#]/)[0] ?? href;
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

export function buildReport(graph: LinkGraph, bodies: Map<string, string>): LinkReport {
  const { nodes, edges } = graph;
  const nodeByPath = new Map(nodes.map((n) => [n.path, n]));
  const titleByPath = new Map<string, string>(nodes.map((n) => [n.path, n.title]));

  const broken: LinkReport["broken"] = [];
  const inbound = new Map<string, number>();
  const outInternal = new Map<string, number>();
  const outExternal = new Map<string, number>();
  const linkedPairs = new Set<string>();
  let internalTotal = 0;
  let externalTotal = 0;

  for (const edge of edges) {
    // A nav row with a blank URL renders as `<Link to="">`, which resolves to "/" — it
    // looks like a working link in the footer but drops the visitor on the homepage.
    if (!edge.to.trim()) {
      internalTotal++;
      broken.push({
        from: edge.from,
        fromTitle:
          edge.from === "site"
            ? "Header / footer navigation"
            : (titleByPath.get(edge.from) ?? edge.from),
        to: edge.to,
        anchor: edge.anchor,
      });
      continue;
    }
    if (!isInternal(edge.to)) {
      externalTotal++;
      if (edge.from !== "site") bump(outExternal, edge.from);
      continue;
    }
    internalTotal++;
    const to = normalizePath(edge.to);
    if (edge.from !== "site") {
      bump(outInternal, edge.from);
      linkedPairs.add(`${edge.from}→${to}`);
    }

    if (nodeByPath.has(to)) {
      // Nav links must not count toward "someone links to this".
      if (edge.source !== "nav") bump(inbound, to);
    } else if (!KNOWN_STATIC_PATHS.has(to)) {
      broken.push({
        from: edge.from,
        fromTitle: edge.from === "site" ? "Header / footer navigation" : (titleByPath.get(edge.from) ?? edge.from),
        to: edge.to,
        anchor: edge.anchor,
      });
    }
  }

  const counts: LinkCount[] = nodes
    .map((n) => ({
      path: n.path,
      title: n.title,
      kind: n.kind,
      published: n.published,
      inbound: inbound.get(n.path) ?? 0,
      outboundInternal: outInternal.get(n.path) ?? 0,
      outboundExternal: outExternal.get(n.path) ?? 0,
    }))
    .sort((a, b) => a.inbound - b.inbound || a.title.localeCompare(b.title));

  const orphans = counts
    .filter((c) => c.published && c.inbound === 0)
    .map(({ path, title, kind }) => ({ path, title, kind }));

  return {
    broken,
    orphans,
    counts,
    suggestions: buildSuggestions(nodes, bodies, linkedPairs),
    totals: { internal: internalTotal, external: externalTotal, pages: nodes.length },
  };
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/**
 * Pages that name a tour in their prose but never link to it.
 *
 * Whole-word, case-insensitive matches on the title only — matching on slug words too
 * produced obvious false positives ("tour", "day", "bengal"). Advisory: nothing is
 * rewritten, the editor decides.
 */
function buildSuggestions(
  nodes: LinkNode[],
  bodies: Map<string, string>,
  linkedPairs: Set<string>,
): LinkReport["suggestions"] {
  const out: LinkReport["suggestions"] = [];
  const tours = nodes.filter((n) => n.kind === "tour" && n.published);

  for (const [from, text] of bodies) {
    const haystack = text.toLowerCase();
    for (const tour of tours) {
      if (tour.path === from) continue;
      if (linkedPairs.has(`${from}→${tour.path}`)) continue;

      const needle = tour.title.trim().toLowerCase();
      if (needle.length < 5 || !haystack.includes(needle)) continue;

      const mentions = countWholeWord(haystack, needle);
      if (!mentions) continue;

      out.push({
        from,
        fromTitle: nodes.find((n) => n.path === from)?.title ?? from,
        to: tour.path,
        toTitle: tour.title,
        mentions,
      });
    }
  }

  return out.sort((a, b) => b.mentions - a.mentions).slice(0, 20);
}

function countWholeWord(haystack: string, needle: string): number {
  const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(needle)}(?![a-z0-9])`, "g");
  return (haystack.match(pattern) ?? []).length;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Prose per page, for the suggestion pass. Same walker, so same field coverage. */
export function collectBodies(tours: ContentRow[], posts: ContentRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const t of tours) map.set(`/tours/${t.slug}`, collectStrings(t).join("\n"));
  for (const p of posts) map.set(`/blog/${p.slug}`, collectStrings(p).join("\n"));
  return map;
}
