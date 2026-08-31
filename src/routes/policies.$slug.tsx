import { createFileRoute, notFound } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/policy-layout";
import {
  POLICY_SLUGS,
  policyDefaults,
  type PolicySlug,
} from "@/content/policy-defaults";
import { useSettingGroup, useSiteSettings } from "@/hooks/use-site-settings";

export const Route = createFileRoute("/policies/$slug")({
  loader: ({ params }) => {
    if (!POLICY_SLUGS.includes(params.slug as PolicySlug)) throw notFound();
    return { slug: params.slug as PolicySlug };
  },
  head: ({ loaderData }) => {
    const page = loaderData ? policyDefaults[loaderData.slug] : undefined;
    if (!page) return {};
    return {
      meta: [
        { title: `${page.title} — Roam Bengal` },
        { name: "description", content: page.subhead },
      ],
    };
  },
  component: PolicyRoute,
});

function PolicyRoute() {
  const { slug } = Route.useLoaderData();
  // Touch the settings hook so the header/footer share one source of truth.
  useSiteSettings();

  // Stored JSON merges field-by-field over the shipped copy, so a partial edit in the
  // admin panel can never blank out a section it did not touch. Going through
  // `useSettingGroup` also applies the admin editor's unsaved draft, which is what makes
  // the live preview update as you type.
  const page = useSettingGroup(`policy_${slug}`, policyDefaults[slug]);

  return <PolicyLayout page={page} />;
}
