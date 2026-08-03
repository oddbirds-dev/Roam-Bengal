import { getRouteApi } from "@tanstack/react-router";
import { siteDefaults, type SiteDefaults } from "@/content/site-defaults";
import type { SettingsMap } from "@/lib/content-types";

const rootRoute = getRouteApi("__root__");

/**
 * Deep-merges stored `site_settings` JSON over the code defaults.
 *
 * Objects merge key by key; arrays replace wholesale. A partial edit in the admin panel
 * is therefore always safe — anything the editor left out falls back to the shipped
 * default rather than rendering blank.
 */
export function mergeSettings<T>(defaults: T, stored: unknown): T {
  if (stored === null || stored === undefined) return defaults;
  if (Array.isArray(defaults) || Array.isArray(stored)) return stored as T;
  if (!isPlainObject(defaults) || !isPlainObject(stored)) return stored as T;

  const out: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(stored)) {
    out[key] = key in defaults ? mergeSettings((defaults as never)[key], value) : value;
  }
  return out as T;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Site chrome and page copy: the `site_settings` rows loaded by the root route, merged
 * over the shipped defaults.
 */
export function useSiteSettings(): SiteDefaults {
  const stored = rootRoute.useLoaderData() as SettingsMap | undefined;
  return mergeSettings(siteDefaults, stored ?? {});
}
