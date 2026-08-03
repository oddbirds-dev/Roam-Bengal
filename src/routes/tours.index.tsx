import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { TourCard } from "@/components/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  listActivities,
  listPublishedTours,
  listTourThemes,
} from "@/lib/site-content.functions";

const searchSchema = z.object({
  theme: z.string().optional(),
});

export const Route = createFileRoute("/tours/")({
  validateSearch: searchSchema,
  loader: async () => {
    const [tours, activities, themes] = await Promise.all([
      listPublishedTours(),
      listActivities(),
      listTourThemes(),
    ]);
    return { tours, activities, themes };
  },
  head: () => ({
    meta: [
      { title: "Signature Private Tours of Bangladesh | Roam Bengal" },
      {
        name: "description",
        content:
          "Private, locally-guided tours across Bangladesh — wildlife, nature, beach, hills and culture. Fair prices and no shopping detours.",
      },
    ],
  }),
  component: ToursIndex,
});

function ToursIndex() {
  const { tours, activities, themes } = Route.useLoaderData();
  const { theme } = Route.useSearch();
  const navigate = useNavigate({ from: "/tours/" });
  const { tours_page } = useSiteSettings();

  const active = theme ?? "all";
  const visible =
    active === "all"
      ? tours
      : tours.filter((t) => (themes[t.slug] ?? []).includes(active));

  const activeName = activities.find((a) => a.slug === active)?.name ?? active;

  function setTheme(slug: string) {
    navigate({
      search: () => (slug === "all" ? {} : { theme: slug }),
      replace: true,
      resetScroll: false,
    });
  }

  return (
    <>
      <div className="relative bg-green-dark">
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 to-ink/60" />
        <div className="relative z-10">
          <SiteHeader />
          <div className="wrap py-20 text-center">
            <h1 className="font-display text-[clamp(2rem,5vw,3.2rem)] leading-tight text-white">
              {tours_page.banner_title}
            </h1>
          </div>
        </div>
      </div>

      <main id="main">
        <section className="py-16">
          <div className="wrap max-w-3xl text-center">
            <h2 className="font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight">
              <span className="text-green">{tours_page.intro_heading_1}</span>
              <br />
              <span className="text-orange">{tours_page.intro_heading_2}</span>
            </h2>
            {tours_page.intro_paragraphs.map((p) => (
              <p key={p} className="mt-4 text-[0.92rem] leading-7 text-muted">
                {p}
              </p>
            ))}
            <p className="mt-4 font-semibold text-green-dark">{tours_page.intro_bold}</p>
          </div>
        </section>

        {/* Filter pills are driven by `activities` (the theme axis), not tours.category
            (the duration axis). The active theme lives in the URL so it is linkable. */}
        <section className="pb-6">
          <div className="wrap flex flex-wrap justify-center gap-3">
            <FilterPill
              label="All Tours"
              isActive={active === "all"}
              onClick={() => setTheme("all")}
            />
            {activities.map((a) => (
              <FilterPill
                key={a.slug}
                label={a.name}
                isActive={active === a.slug}
                onClick={() => setTheme(a.slug)}
              />
            ))}
          </div>
          <p className="mt-5 text-center text-[0.84rem] text-muted" aria-live="polite">
            {active === "all"
              ? `Showing all ${visible.length} tours`
              : `Showing ${visible.length} ${activeName} tour${visible.length === 1 ? "" : "s"}`}
          </p>
        </section>

        <section className="pb-20">
          <div className="wrap">
            {visible.length ? (
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((tour) => (
                  <TourCard key={tour.id} tour={tour} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-rule py-20 text-center">
                <p className="font-display text-xl text-green">
                  No tours in this category yet.
                </p>
                <p className="mt-2 text-[0.9rem] text-muted">
                  Try another theme, or tell us what you have in mind and we will build it.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("all")}
                    className="inline-flex items-center rounded-[30px] border-[1.5px] border-green-dark px-5 py-2.5 text-[0.84rem] font-semibold text-green-dark"
                  >
                    Show all tours
                  </button>
                  <ButtonLink to="/contact" variant="green-dark">
                    Plan a custom trip
                  </ButtonLink>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

function FilterPill({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`rounded-[30px] border-[1.5px] px-5 py-2.5 text-[0.84rem] font-semibold transition-colors ${
        isActive
          ? "border-green-dark bg-green-dark text-white"
          : "border-rule bg-paper text-ink hover:border-green"
      }`}
    >
      {label}
    </button>
  );
}
