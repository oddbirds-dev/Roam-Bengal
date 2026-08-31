import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { TourCard } from "@/components/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { DhakaScene } from "@/components/art/dhaka-scene";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  listActivities,
  listPublishedTours,
  listTourThemes,
} from "@/lib/site-content.functions";
import { activityPreviewChannel } from "@/lib/activity-preview";

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

const BANNER_BG = "linear-gradient(160deg, #1E5F3B 0%, #123D26 100%)";
const DREAM_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";

/** `.tour-photo-frame` colours, cycled down the listing in reference order. */
const TOUR_FRAMES = [
  "linear-gradient(160deg,#F0791E,#C43B0E)",
  "linear-gradient(160deg,#22B57A,#0B6B47)",
  "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
  "linear-gradient(160deg,#F0791E,#C4390E)",
  "linear-gradient(160deg,#3E7A6E,#123D30)",
  "linear-gradient(160deg,#F2B705,#8C6A3D)",
  "linear-gradient(160deg,#7A2408,#2A0D02)",
  "linear-gradient(160deg,#1E5F3B,#0B2818)",
  "linear-gradient(160deg,#178C7A,#123D30)",
];

function ToursIndex() {
  const { tours, activities: savedActivities, themes } = Route.useLoaderData();
  const activityDraft = activityPreviewChannel.useDraft(true);
  const activities = activityDraft
    ? [activityDraft, ...savedActivities.filter((activity) => activity.id !== activityDraft.id)]
    : savedActivities;
  const { theme } = Route.useSearch();
  const navigate = useNavigate({ from: "/tours/" });
  const { tours_page, homepage } = useSiteSettings();

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
      {/* Page banner */}
      <div
        className="relative flex min-h-[460px] flex-col overflow-hidden text-white"
        style={{ background: BANNER_BG }}
      >
        <PhotoFrame
          src={tours_page.banner_image}
          alt="Person walking a forest railway track in Bangladesh at sunrise"
          gradientCss="transparent"
          priority
          placeholderLabel="images/tours-banner.jpg"
          className="absolute inset-0 z-0 h-full w-full"
        />
        <div className="absolute inset-0 z-[1] bg-black/60" />  

        <SiteHeader logo="light" />

        <div className="relative z-[2] flex flex-1 items-center justify-center p-10">
          <h1 className="max-w-[900px] text-center font-body text-[clamp(1.5rem,3.4vw,2.4rem)] font-light tracking-[0.06em] uppercase [text-shadow:0_4px_20px_rgba(0,0,0,0.4)]">
            {tours_page.banner_title}
          </h1>
        </div>
      </div>

      <main id="main">
        {/* Intro */}
        <section className="pt-[70px] pb-5">
          <div className="wrap">
            <h2 className="mb-6 font-kalam text-[clamp(1.7rem,3vw,2.3rem)] leading-[1.3] font-bold uppercase">
              <span className="text-green">{tours_page.intro_heading_1}</span>
              <br />
              <span className="text-accent">{tours_page.intro_heading_2}</span>
            </h2>
              {tours_page.intro_paragraphs.map((p) => (
                <p key={p} className="mb-4 max-w-[900px] text-[0.98rem] leading-[1.7] text-ink">
                  <FormatText>{p}</FormatText>
                </p>
              ))}
            <p className="mb-4 max-w-[900px] text-[0.98rem] leading-[1.7] font-bold text-ink">
              {tours_page.intro_bold}
            </p>
          </div>
        </section>

        {/* Filter pills are driven by `activities` (the theme axis), not tours.category
            (the duration axis). The active theme lives in the URL so it is linkable. */}
        <section className="shell pt-[60px] pb-5">
          <div className="wide mb-10 flex flex-wrap justify-center gap-3">
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
          <p className="mb-[30px] text-center text-[0.85rem] text-muted" aria-live="polite">
            {active === "all"
              ? `Showing all ${visible.length} tours`
              : `Showing ${visible.length} ${activeName} tour${visible.length === 1 ? "" : "s"}`}
          </p>
        </section>

        {visible.length ? (
          <div className="wide grid gap-[26px] px-5 pb-[60px] nav:grid-cols-3 nav:px-10 nav:pb-[90px]">
            {visible.map((tour, i) => (
              <TourCard
                key={tour.id}
                tour={tour}
                gradientCss={TOUR_FRAMES[i % TOUR_FRAMES.length]}
              />
            ))}
          </div>
        ) : (
          <div className="wide px-5 pb-[60px] nav:px-10 nav:pb-[90px]">
            <div className="rounded-[18px] border border-dashed border-rule py-20 text-center">
              <p className="text-center font-display text-xl font-bold text-green">
                No tours in this category yet.
              </p>
              <p className="mt-2 text-center text-[0.9rem] text-muted">
                Try another theme, or tell us what you have in mind and we will build it.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setTheme("all")}
                  className="inline-flex items-center rounded-[30px] border-[1.5px] border-green px-[26px] py-3 text-[0.86rem] font-semibold text-green transition-colors hover:bg-green hover:text-white"
                >
                  Show all tours
                </button>
                <ButtonLink to="/contact" variant="green-dark">
                  Plan a custom trip
                </ButtonLink>
              </div>
            </div>
          </div>
        )}

        {/* Dream CTA — shared with the homepage */}
        <section id="contact" className="py-[70px]" style={{ background: DREAM_BG }}>
          <div className="wrap grid items-center gap-10 nav:grid-cols-2">
            <div>
              <h2 className="mb-[22px] font-kalam text-[clamp(1.9rem,3.4vw,2.5rem)] leading-[1.3] font-bold">
                <span className="text-green">{homepage.cta_heading_1}</span>
                <br />
                About <span className="text-accent">{homepage.cta_heading_2}</span>
              </h2>
                {homepage.cta_paragraphs.map((p) => (
                  <p
                    key={p}
                    className="mb-[18px] max-w-[480px] text-[0.95rem] leading-[1.6] text-ink"
                  >
                    <FormatText>{p}</FormatText>
                  </p>
                ))}
              <ButtonLink to={homepage.cta_link} variant="green-dark">
                {homepage.cta_label}
              </ButtonLink>
            </div>
            <DhakaScene className="h-auto w-full" />
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

/** `.filter-pill` — orange when active, per the tours reference. */
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
      className={`cursor-pointer rounded-[30px] border-[1.5px] px-[22px] py-2.5 text-[0.85rem] font-semibold transition-all duration-200 ${
        isActive
          ? "border-orange bg-orange text-white"
          : "border-[#E7DDD0] bg-paper text-muted hover:border-orange hover:text-orange"
      }`}
    >
      {label}
    </button>
  );
}
