import { createFileRoute, notFound } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/policy-layout";
import { INFO_SLUGS, infoDefaults, type InfoSlug } from "@/content/policy-defaults";
import { useSettingGroup } from "@/hooks/use-site-settings";
import { listPublishedFaqs } from "@/lib/site-content.functions";
import { faqPreviewChannel } from "@/lib/faq-preview";

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
  const { slug, faqs: saved } = Route.useLoaderData();

  const page = useSettingGroup(`info_${slug}`, infoDefaults[slug]);

  // Same splice the reviews page uses: an unsaved FAQ from the admin editor replaces the saved
  // row with its id, or is prepended when it has none yet. No `?preview=1` gate needed — there is
  // no per-FAQ detail route to 404 on, so being in an iframe at all is signal enough.
  const draft = faqPreviewChannel.useDraft(true);
  const faqs = draft ? [draft, ...saved.filter((f) => f.id !== draft.id)] : saved;

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
