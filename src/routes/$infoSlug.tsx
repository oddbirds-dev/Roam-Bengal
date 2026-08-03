import { createFileRoute, getRouteApi, notFound } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/policy-layout";
import { INFO_SLUGS, infoDefaults, type InfoSlug } from "@/content/policy-defaults";
import { mergeSettings } from "@/hooks/use-site-settings";
import { listPublishedFaqs } from "@/lib/site-content.functions";
import type { SettingsMap } from "@/lib/content-types";

const rootRoute = getRouteApi("__root__");

/**
 * Standalone info pages the footer links to: /visa-information, /embassy-directory,
 * /travel-faqs, /responsible-travel, /guides, /careers.
 *
 * This is a catch-all at the root, so it must be the last thing that matches — any
 * unknown path falls through to notFound().
 */
export const Route = createFileRoute("/$infoSlug")({
  loader: async ({ params }) => {
    const slug = params.infoSlug as InfoSlug;
    if (!INFO_SLUGS.includes(slug)) throw notFound();
    // /travel-faqs is the one info page with real data behind it.
    const faqs = slug === "travel-faqs" ? await listPublishedFaqs() : [];
    return { slug, faqs };
  },
  head: ({ loaderData }) => {
    const page = loaderData ? infoDefaults[loaderData.slug] : undefined;
    if (!page) return {};
    return {
      meta: [
        { title: `${page.title} — Roam Bengal` },
        { name: "description", content: page.subhead },
      ],
    };
  },
  component: InfoRoute,
});

function InfoRoute() {
  const { slug, faqs } = Route.useLoaderData();
  const stored = rootRoute.useLoaderData() as SettingsMap | undefined;

  const page = mergeSettings(infoDefaults[slug], stored?.[`info_${slug}`] ?? {});

  // The FAQ page builds its blocks from the `faqs` table rather than static copy.
  const withFaqs =
    slug === "travel-faqs" && faqs.length
      ? {
          ...page,
          blocks: faqs.map((f) => ({
            heading: f.question,
            paragraphs: [f.answer],
          })),
        }
      : page;

  return <PolicyLayout page={withFaqs} />;
}
