import { createFileRoute, notFound } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/policy-layout";
import { INFO_SLUGS, infoDefaults, type InfoSlug } from "@/content/policy-defaults";
import { useSettingGroup } from "@/hooks/use-site-settings";
import { listPublishedFaqs, listPublishedTestimonials } from "@/lib/site-content.functions";
import { faqPreviewChannel } from "@/lib/faq-preview";

/**
 * Standalone info pages the footer links to: /visa-information, /embassy-directory,
 * /travel-faqs, /responsible-travel, /guides, /careers, /rentals-tickets,
 * /customer-support, /licensed-tour-operator, /secure-payment-gateway,
 * /destinations, /b2b-partners, /photo-gallery, /privacy-policy, /terms-conditions.
 *
 * This is a catch-all at the root, so it must be the last thing that matches — any
 * unknown path falls through to notFound().
 */
export const Route = createFileRoute("/$infoSlug")({
  loader: async ({ params }) => {
    const slug = params.infoSlug as InfoSlug;
    if (!INFO_SLUGS.includes(slug)) throw notFound();
    // /travel-faqs is the one info page with real data behind it; every info page
    // shows the shared reviews strip above the footer.
    const [faqs, testimonials] = await Promise.all([
      slug === "travel-faqs" ? listPublishedFaqs() : Promise.resolve([]),
      listPublishedTestimonials(),
    ]);
    return { slug, faqs, testimonials };
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
  const { slug, faqs: saved, testimonials } = Route.useLoaderData();

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
          // `PolicyLayout` prefers `body` over `blocks`, so a rich-text body saved for this key
          // would hide the questions entirely. The table is the content here, so drop it.
          body: undefined,
          blocks: faqs.map((f) => ({
            heading: f.question,
            paragraphs: [f.answer],
          })),
        }
      : page;

  return (
    <PolicyLayout
      page={withFaqs}
      faqPage={slug === "travel-faqs"}
      testimonials={testimonials}
    />
  );
}
