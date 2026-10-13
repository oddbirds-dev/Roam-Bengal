/**
 * Alt text, meta title and meta description for images stored in `site_settings`.
 *
 * Settings values are free-form JSON, so an image's metadata lives beside its URL under
 * sibling keys: the URL key minus a trailing `_url`, plus `_alt` / `_title` /
 * `_description`. That is the convention the older keys already followed
 * (`logo_url` → `logo_alt`, `background_url` → `background_alt`, `cta_image` →
 * `cta_image_alt`), so every stored alt text keeps working without a migration.
 */

export interface ImageMetaKeys {
  alt: string;
  title: string;
  description: string;
}

export function imageMetaKeys(urlKey: string): ImageMetaKeys {
  const base = urlKey.replace(/_url$/, "");
  return { alt: `${base}_alt`, title: `${base}_title`, description: `${base}_description` };
}

export interface ImageMeta {
  alt: string;
  title: string;
  description: string;
}

/** Reads an image's metadata off a settings object (or a repeater row). Missing keys read as "". */
export function imageMeta(source: object | null | undefined, urlKey: string): ImageMeta {
  const record = (source ?? {}) as Record<string, unknown>;
  const keys = imageMetaKeys(urlKey);
  const read = (key: string) => (typeof record[key] === "string" ? (record[key] as string) : "");
  return { alt: read(keys.alt), title: read(keys.title), description: read(keys.description) };
}
