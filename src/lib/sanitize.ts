/**
 * Minimal HTML/href hardening.
 *
 * This is deliberately NOT a general sanitizer. Content here is authored only by admins
 * behind `assertAdmin` + RLS, and the formatting toolbar's whole job is to emit raw
 * `<span class="...">` that `FormatText`/`FormatDocument` render — so a strict allowlist would break
 * the feature it is protecting. What these two functions buy is a choke point: the
 * scripting vectors are blocked in one place, on every write and on every rendered link.
 *
 * If a lower-trust editor role is ever added, replace this with DOMPurify — do not extend
 * these regexes to try to cover the gap.
 */

const UNSAFE_SCHEMES = ["javascript:", "vbscript:", "data:text/html"];

/**
 * Decodes numeric HTML entities, then drops every character at or below U+0020 plus
 * U+007F, so `java&#115;cript:`, `javascript\t:` and `java\0script:` all collapse to the
 * same string before the prefix test. Entities are *decoded*, not deleted — deleting them
 * turns `java&#115;cript:` into a harmless-looking `javacript:` that the browser would
 * still have executed.
 *
 * Written as a codepoint filter rather than a regex range because a literal
 * control-character class in source is easy to mangle in transit.
 */
function normalizeHref(href: string): string {
  const decoded = href.replace(/&#(x[0-9a-f]+|\d+);?/gi, (_match, code: string) => {
    const value = code.toLowerCase().startsWith("x")
      ? Number.parseInt(code.slice(1), 16)
      : Number.parseInt(code, 10);
    return Number.isFinite(value) && value >= 0 && value <= 0x10ffff
      ? String.fromCodePoint(value)
      : "";
  });

  let out = "";
  for (const char of decoded) {
    const code = char.codePointAt(0) ?? 0;
    if (code <= 0x20 || code === 0x7f) continue;
    out += char;
  }
  return out.toLowerCase();
}

/** Schemes that execute rather than navigate. */
export function isUnsafeHref(href: string): boolean {
  if (!href) return false;
  const normalized = normalizeHref(href);
  return UNSAFE_SCHEMES.some((scheme) => normalized.startsWith(scheme));
}

/**
 * Removes executable markup while leaving the toolbar's presentational tags intact.
 * Applied on write via the shared zod text helpers, so it runs once per save rather than
 * on every render.
 */
export function stripUnsafeHtml(value: string): string {
  if (!value) return value;
  return (
    value
      .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "")
      .replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, "")
      // Unclosed variants of the same tags, which the pairs above miss.
      .replace(/<\/?(?:script|style|iframe)\b[^>]*>/gi, "")
      // Inline event handlers: onclick=..., onerror='...', onload=x
      .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      // href/src pointing at an executable scheme.
      .replace(
        /\s(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
        (match, attr, dq, sq, bare) =>
          isUnsafeHref(dq ?? sq ?? bare ?? "") ? ` ${attr}="#"` : match,
      )
  );
}

/**
 * Same choke point as `stripUnsafeHtml`, but for the free-form JSON that `site_settings` rows
 * hold. Every rich-text field an admin can format now goes through here on save, however deep it
 * sits in a `sections`/`list`/`rows` structure — the per-field zod helpers only reach the fields
 * the schema happens to describe, and a settings row can carry keys it does not.
 */
export function deepStripUnsafeHtml<T>(value: T): T {
  if (typeof value === "string") return stripUnsafeHtml(value) as T;
  if (Array.isArray(value)) return value.map(deepStripUnsafeHtml) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepStripUnsafeHtml(v);
    }
    return out as T;
  }
  return value;
}
