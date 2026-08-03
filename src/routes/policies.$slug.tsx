import { createFileRoute, notFound } from "@tanstack/react-router";
import { PolicyLayout } from "@/components/policy-layout";
import {
  POLICY_SLUGS,
  policyDefaults,
  type PolicySlug,
} from "@/content/policy-defaults";
import { mergeSettings, useSiteSettings } from "@/hooks/use-site-settings";
import { getRouteApi } from "@tanstack/react-router";
import type { SettingsMap } from "@/lib/content-types";

const rootRoute = getRouteApi("__root__");

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

  const stored = rootRoute.useLoaderData() as SettingsMap | undefined;
  // Stored JSON merges field-by-field over the shipped copy, so a partial edit in the
  // admin panel can never blank out a section it did not touch.
  const page = mergeSettings(policyDefaults[slug], stored?.[`policy_${slug}`] ?? {});

  return <PolicyLayout page={page} />;
}
