import type { SeoMetaRow } from "./seo.functions";

/**
 * Fallback values to use if the database doesn't have a specific SEO override.
 */
export interface SeoFallbacks {
  title: string;
  description: string;
  image?: string;
  urlPath?: string;
}

/**
 * Reads SITE_URL from process.env on the server or import.meta.env in the browser,
 * falling back to a sensible default if neither is set.
 */
function getSiteUrl(): string {
  // Vite injects this during build for the client bundle
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }
  // Server-side environment
  if (typeof process !== "undefined" && process.env && process.env.VITE_SITE_URL) {
    return process.env.VITE_SITE_URL;
  }
  return "https://roambengal.com";
}

export const SITE_URL = getSiteUrl();

/**
 * Builds the array of `<meta>` tags for TanStack Router's `head()` function.
 *
 * It merges the explicitly authored `seo_meta` from the database with the entity's
 * default fallbacks (e.g., using the tour's title if no custom SEO title was written).
 */
export function buildSeoMeta(seo: SeoMetaRow | null, fallbacks: SeoFallbacks) {
  const title = seo?.meta_title || fallbacks.title;
  const description = seo?.meta_description || fallbacks.description;
  const canonicalPath = seo?.canonical_url || fallbacks.urlPath || "";
  
  // Make sure canonical URL is absolute
  const canonicalUrl = canonicalPath.startsWith("http") 
    ? canonicalPath 
    : `${SITE_URL}${canonicalPath.startsWith("/") ? canonicalPath : `/${canonicalPath}`}`;

  const ogTitle = seo?.og_title || title;
  const ogDescription = seo?.og_description || description;
  const ogImage = seo?.og_image || fallbacks.image;

  const twitterTitle = seo?.twitter_title || ogTitle;
  const twitterDescription = seo?.twitter_description || ogDescription;
  const twitterImage = seo?.twitter_image || ogImage;

  const metaTags: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:type", content: "website" },
    { property: "og:url", content: canonicalUrl },
    { name: "twitter:card", content: twitterImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: twitterTitle },
    { name: "twitter:description", content: twitterDescription },
  ];

  if (ogImage) {
    metaTags.push({ property: "og:image", content: ogImage });
  }
  
  if (twitterImage) {
    metaTags.push({ name: "twitter:image", content: twitterImage });
  }

  if (seo?.robots_noindex) {
    metaTags.push({ name: "robots", content: "noindex, nofollow" });
  }

  const links = [
    { rel: "canonical", href: canonicalUrl }
  ];

  return {
    meta: metaTags,
    links
  };
}
