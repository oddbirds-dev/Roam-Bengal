import { isUnsafeHref } from "@/lib/sanitize";
import { slugify } from "@/lib/slugify";

/**
 * Admin-managed web fonts.
 *
 * This used to be one `{ font_url, font_family }` pair driving one `.font-custom` class.
 * That pair is still honoured — content already in the database carries `font-custom` — it
 * is just the first entry of a list now, and this module is the only place that knows the
 * difference. Everything else (the `<head>`, the editor's Font menu) works off the
 * resolved list.
 */

export interface CustomFontEntry {
  /** What the admin calls it; becomes the Font menu label and the class suffix. */
  label: string;
  font_url: string;
  font_family: string;
}

export interface CustomFontSettings {
  font_url?: string;
  font_family?: string;
  fonts?: readonly Partial<CustomFontEntry>[];
}

export interface CustomFont {
  /** The class the editor writes and the site styles: `font-custom`, `font-custom-lora`… */
  className: string;
  label: string;
  url: string;
  family: string;
}

/** The original single font keeps the bare class, so content written before the list
 *  still renders. */
const LEGACY_CLASS = "font-custom";

/**
 * Class suffixes come from the label rather than the row's position, because the list is
 * reorderable: an index would silently re-point every span in the database the first time
 * someone dragged a row.
 */
function fontSlug(value: string): string {
  return slugify(value).slice(0, 40);
}

/**
 * A family name is dropped straight into a `<style>` block, where a stray `}` would end
 * the rule and let whatever followed become CSS of its own. Only admins can reach this
 * field, but the cost of being certain is one regex.
 */
function safeFamily(value: string): string {
  return value.replace(/[{}<>;@]/g, "").trim();
}

export function resolveCustomFonts(settings: CustomFontSettings | undefined): CustomFont[] {
  const fonts: CustomFont[] = [];
  const taken = new Set<string>();

  const add = (base: string, label: string, url: string, family: string) => {
    let className = base;
    for (let i = 2; taken.has(className); i++) className = `${base}-${i}`;
    taken.add(className);
    const href = url.trim();
    fonts.push({ className, label, url: isUnsafeHref(href) ? "" : href, family });
  };

  const legacy = safeFamily(settings?.font_family ?? "");
  if (legacy) add(LEGACY_CLASS, "Custom", settings?.font_url ?? "", legacy);

  for (const entry of settings?.fonts ?? []) {
    const family = safeFamily(entry?.font_family ?? "");
    if (!family) continue;
    const label = (entry?.label ?? "").trim() || family;
    const slug = fontSlug(label) || fontSlug(family) || String(fonts.length + 1);
    add(`${LEGACY_CLASS}-${slug}`, label, entry?.font_url ?? "", family);
  }

  return fonts;
}

/** Stylesheet URLs to load, de-duplicated — one Google Fonts request often carries several
 *  families, so two rows can legitimately share a URL. */
export function customFontUrls(fonts: readonly CustomFont[]): string[] {
  return [...new Set(fonts.map((font) => font.url).filter(Boolean))];
}

export function customFontCss(fonts: readonly CustomFont[]): string {
  return fonts.map((font) => `.${font.className} { font-family: ${font.family}; }`).join("\n");
}
