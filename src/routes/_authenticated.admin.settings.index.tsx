import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/admin-ui";
import { AdminIcon } from "@/components/admin/icons";
import { PAGE_SETTINGS_ORDER, SETTINGS_ORDER, SETTINGS_SCHEMA } from "@/components/admin/settings-form";
import { HOME_LAYOUT_KEY } from "@/lib/home-layout";

export const Route = createFileRoute("/_authenticated/admin/settings/")({
  component: SettingsHub,
});

type SettingsRow = { id: string; key: string; value: unknown; description: string | null };

/**
 * Site content, edited as forms rather than JSON.
 *
 * The shape of each key lives in settings-form.tsx; this screen is a menu of named
 * sections, each opening its own editor at `/admin/settings/$group`. Any key the schema
 * does not describe still appears at the bottom and opens the same route's raw-JSON
 * fallback, so nothing in the table is unreachable.
 */
function SettingsHub() {
  const settings = useLoaderData({ from: "/_authenticated/admin/settings" }) as SettingsRow[];

  // homepage_layout has its own reorder-focused builder, not a schema form or the raw JSON
  // fallback — keep it out of "Other content" so there's exactly one place to edit it.
  const extras = settings.filter((row) => !(row.key in SETTINGS_SCHEMA) && row.key !== HOME_LAYOUT_KEY);

  return (
    <>
      <PageHeader
        title="Site content"
        subtitle="Pick a part of the website to change its wording, photos, and links. Everything here is public — never put a password or private note in it."
      />

      <Link
        to="/admin/settings/homepage-sections"
        className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-paper p-5 transition-colors hover:border-green"
      >
        <div>
          <h3 className="font-display text-[1.05rem] font-bold text-green-dark">
            Homepage sections
          </h3>
          <p className="mt-1 text-[0.82rem] text-muted">
            Reorder or hide whole blocks of the homepage — the feature strip, popular tours,
            gallery, and the rest.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-semibold text-green">
          Open builder
          <AdminIcon name="chevron" className="h-4 w-4" />
        </span>
      </Link>

      <SectionGrid
        heading="Around the site"
        blurb="Wording and pictures that appear on the homepage or on every page."
        keys={SETTINGS_ORDER}
      />

      <SectionGrid
        heading="Standalone pages"
        blurb="Full pages of text — the ones your footer links to, and your booking policies."
        keys={PAGE_SETTINGS_ORDER}
      />

      {extras.length ? (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-[1.05rem] font-bold text-green-dark">
            Other content
          </h2>
          <p className="mb-4 text-[0.82rem] text-muted">
            These entries have no form yet, so they open in a technical editor. Ask your
            developer before changing them.
          </p>
          <div className="flex flex-col gap-3">
            {extras.map((row) => (
              <Link
                key={row.key}
                to="/admin/settings/$group"
                params={{ group: row.key }}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rule bg-paper p-4 transition-colors hover:border-green"
              >
                <div>
                  <span className="font-mono text-[0.86rem] font-bold text-green-dark">
                    {row.key}
                  </span>
                  {row.description ? (
                    <p className="mt-0.5 text-[0.78rem] text-muted">{row.description}</p>
                  ) : null}
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-semibold text-green">
                  Edit
                  <AdminIcon name="chevron" className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function SectionGrid({
  heading,
  blurb,
  keys,
}: {
  heading: string;
  blurb: string;
  keys: readonly string[];
}) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-[1.15rem] font-bold text-green-dark">{heading}</h2>
      <p className="mt-1 mb-4 text-[0.82rem] text-muted">{blurb}</p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {keys.map((key) => {
          const schema = SETTINGS_SCHEMA[key];
          if (!schema) return null;
          return (
            <Link
              key={key}
              to="/admin/settings/$group"
              params={{ group: key }}
              className="flex h-full flex-col rounded-2xl border border-rule bg-paper p-5 text-left transition-colors hover:border-green"
            >
              <h3 className="font-display text-[1.05rem] font-bold text-green-dark">
                {schema.title}
              </h3>
              <p className="mt-1.5 flex-1 text-[0.82rem] leading-6 text-muted">
                {schema.description}
              </p>
              <span className="mt-4 flex items-center justify-between gap-2">
                <span className="rounded-full bg-cream px-2.5 py-1 text-[0.7rem] font-medium text-muted">
                  {schema.where}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[0.8rem] font-semibold text-green">
                  Edit
                  <AdminIcon name="chevron" className="h-4 w-4" />
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
