import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { listPublishedTestimonials } from "@/lib/site-content.functions";
import { testimonialPreviewChannel } from "@/lib/testimonial-preview";

export const Route = createFileRoute("/reviews")({
  validateSearch: z.object({ tour: z.string().optional() }),
  loader: () => listPublishedTestimonials(),
  head: () => ({
    meta: [
      { title: "Guest Reviews — What Travellers Say | Roam Bengal" },
      {
        name: "description",
        content:
          "Real feedback from travellers who have toured Bangladesh with Roam Bengal — collected across every platform we are reviewed on.",
      },
    ],
  }),
  component: Reviews,
});

const HERO_BG = "linear-gradient(160deg,#3A1408,#5C2410 55%,#3A1408)";
const CTA_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
/** `.rr-photo` colours, cycled down the list in reference order. */
const PHOTO_FRAMES = [
  "linear-gradient(150deg,#22B57A,#0B6B47)",
  "linear-gradient(150deg,#C4390E,#5C1C05)",
  "linear-gradient(150deg,#D9450F,#7A2408)",
  "linear-gradient(150deg,#8C6A3D,#5A3E1B)",
  "linear-gradient(150deg,#F0791E,#C43B0E)",
  "linear-gradient(150deg,#1E5F3B,#0B2818)",
];

function Reviews() {
  const saved = Route.useLoaderData();
  const { tour } = Route.useSearch();
  const navigate = useNavigate({ from: "/reviews" });
  const { reviews } = useSiteSettings();

  // No `?preview=1` needed here, unlike tours/posts: reviews has no per-item detail
  // route to 404 on, so being embedded in an iframe at all (the draft channel's own
  // check) is a sufficient signal. A previewed testimonial is spliced to the front of
  // the real list, replacing any saved row with the same id.
  const draft = testimonialPreviewChannel.useDraft(true);
  const testimonials = draft
    ? [draft, ...saved.filter((t) => t.id !== draft.id)]
    : saved;

  // The rail filters on the tour a review is attached to, shortened to the name
  // before the em dash ("Sundarbans Wildlife Tour — 4 Days" → "Sundarbans Wildlife Tour").
  const tourNames = [
    ...new Set(testimonials.map((t) => shortTour(t.tourLabel)).filter(Boolean)),
  ] as string[];
  const active = tour ?? "all";
  const visible =
    active === "all"
      ? testimonials
      : testimonials.filter((t) => shortTour(t.tourLabel) === active);

  function setTour(name: string) {
    navigate({
      search: () => (name === "all" ? {} : { tour: name }),
      replace: true,
      resetScroll: false,
    });
  }

  return (
    <div className="relative bg-cream">
      {/* Page-wide dot grid, per `body::before` in the reference. */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle, #1E5F3B 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-[1]">
        <SiteHeader variant="solid" />

        <main id="main">
          {/* Hero */}
          <section
            className="shell relative overflow-hidden pt-[70px] pb-[60px] text-center text-white"
            style={{ background: HERO_BG }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
                backgroundSize: "22px 22px",
              }}
              aria-hidden="true"
            />
            <RiverArt className="absolute bottom-[-10px] left-5 z-[1] h-[190px] w-[190px] opacity-90 max-[900px]:hidden" />
            <LeafArt className="absolute top-[-10px] right-5 z-[1] h-[190px] w-[190px] opacity-90 max-[900px]:hidden" />

            <div className="relative z-[2] mx-auto max-w-[900px]">
              <h1 className="mb-4 font-display text-[clamp(2rem,4.2vw,3rem)] leading-[1.2] font-bold">
                {reviews.heading_1}
                <br />
                {reviews.heading_2}
              </h1>
              <p className="mx-auto mb-10 max-w-[520px] text-[1rem] text-[#DDEBE1]">
                <FormatText>{reviews.subtext}</FormatText>
              </p>

              <div className="mb-10 flex flex-col flex-wrap items-center justify-center gap-5 min-[640px]:flex-row min-[640px]:gap-9">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[3.4rem] leading-none font-black text-gold">
                    {reviews.score}
                  </span>
                  <span className="text-[1.1rem] text-[#DDEBE1]">
                    / {reviews.score_out_of}
                  </span>
                </div>
                <div className="text-left text-[0.84rem] leading-[1.5] text-[#DDEBE1]">
                  <div className="text-[1.1rem] tracking-[2px] text-gold">★★★★★</div>
                  <div>{reviews.count_label}</div>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {reviews.platforms.map((p) => (
                  <div
                    key={p.name}
                    className="min-w-[130px] rounded-[14px] border border-white/15 bg-white/8 px-[22px] py-3.5 backdrop-blur-[2px]"
                  >
                    <div className="mb-1.5 flex items-center gap-[7px] text-[0.88rem] font-semibold text-white">
                      <span style={{ color: p.colour }}>{p.icon}</span> {p.name}
                    </div>
                    <div className="text-[0.8rem] text-[#DDEBE1]">★★★★★ {p.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Filter rail */}
          <div className="mx-auto flex max-w-[1240px] flex-nowrap justify-start gap-2.5 overflow-x-auto px-5 pt-9 pb-1.5 min-[640px]:flex-wrap min-[640px]:justify-center min-[640px]:overflow-visible min-[640px]:px-10 min-[640px]:pb-0">
            <FilterPill
              label="All Reviews"
              isActive={active === "all"}
              onClick={() => setTour("all")}
            />
            {tourNames.map((name) => (
              <FilterPill
                key={name}
                label={name}
                isActive={active === name}
                onClick={() => setTour(name)}
              />
            ))}
          </div>

          {/* Review list */}
          <div className="mx-auto max-w-[1160px] px-5 pt-9 pb-5 min-[640px]:px-10">
            {visible.map((t, i) => (
              <article
                key={t.id}
                className="flex flex-col flex-wrap items-start justify-between gap-5 border-b border-rule py-[34px] first:pt-1.5 min-[640px]:flex-row"
              >
                <div className="flex items-center gap-3.5">
                  <PhotoFrame
                    src={t.avatarUrl ?? t.images[0]}
                    alt={`${t.author} on tour with Roam Bengal`}
                    gradientCss={PHOTO_FRAMES[i % PHOTO_FRAMES.length]}
                    placeholderLabel={`${t.author.split(" ")[0]?.toLowerCase()}.jpg`}
                    className="h-[66px] w-[66px] shrink-0 rounded-xl"
                  />
                </div>

                <div className="text-left text-[0.92rem] leading-[1.55] text-ink min-[640px]:text-right">
                  <div>
                    — {t.author}
                    {t.location ? `, ${t.location}` : ""}
                  </div>
                  {t.tourLabel ? <div className="text-muted">{t.tourLabel}</div> : null}
                  <div className="mt-1 text-[0.95rem] tracking-[2px] text-gold">
                    {stars(t.rating)}
                  </div>
                </div>

                {t.headline ? (
                  <div className="mt-1.5 mb-3 w-full font-body text-[1.15rem] font-bold text-green-dark">
                    “{t.headline}”
                  </div>
                ) : null}
                <p className="w-full text-[0.95rem] leading-[1.8] text-ink">“{t.quote}”</p>
              </article>
            ))}

            {visible.length === 0 ? (
              <p className="border-b border-rule py-16 text-center text-muted">
                No reviews for this tour yet.
              </p>
            ) : null}

            <div className="mt-11 mb-[90px]" />
          </div>

          {/* CTA strip */}
          <div className="px-5 pb-[90px] min-[640px]:px-10">
            <div
              className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-[30px] rounded-[20px] px-7 py-9 min-[980px]:px-14 min-[980px]:py-[50px]"
              style={{ background: CTA_BG }}
            >
              <div>
                <h3 className="mb-2 font-display text-[1.4rem] font-bold">
                  {reviews.cta_heading}
                </h3>
                <p className="max-w-[400px] text-[0.88rem] text-muted"><FormatText>{reviews.cta_body}</FormatText></p>
              </div>
              <ButtonLink to={reviews.cta_link} variant="green-dark">
                {reviews.cta_label}
              </ButtonLink>
            </div>
          </div>
        </main>

        <SiteFooter />
        <WhatsAppFloat />
      </div>
    </div>
  );
}

function shortTour(label: string | null): string {
  return (label ?? "").split("—")[0]!.trim();
}

/** `★★★★☆` — filled to the rating, hollow for the rest, as in the reference. */
function stars(rating: number | null): string {
  const filled = Math.min(5, Math.max(0, Math.round(rating ?? 5)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

/** `.filter-pill` — ink when active. */
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
      className={`cursor-pointer rounded-[30px] border-[1.5px] px-5 py-[9px] text-[0.82rem] font-semibold whitespace-nowrap transition-all duration-200 ${
        isActive
          ? "border-ink bg-ink text-white"
          : "border-rule text-muted hover:border-orange hover:text-orange"
      }`}
    >
      {label}
    </button>
  );
}

/** Boat-on-the-river line art, bottom-left of the hero. */
function RiverArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" fill="none" className={className} aria-hidden="true">
      <path d="M20 150 Q60 130 100 150 T180 150" stroke="#F2B705" strokeWidth="1.3" opacity="0.5" />
      <path d="M40 150 L40 110 Q40 95 55 90 L55 150" stroke="#F2B705" strokeWidth="1.3" opacity="0.6" />
      <path d="M55 95 L95 78" stroke="#F2B705" strokeWidth="1.3" opacity="0.6" />
      <path d="M15 160 Q60 145 105 160 Q150 175 195 160" stroke="#fff" strokeWidth="1.5" opacity="0.55" />
      <path d="M10 172 Q60 158 110 172 Q160 186 205 172" stroke="#fff" strokeWidth="1.2" opacity="0.35" />
      <circle cx="150" cy="45" r="22" stroke="#F2B705" strokeWidth="1.3" opacity="0.45" />
      <path d="M30 40 Q34 20 30 5" stroke="#22B57A" strokeWidth="1.2" opacity="0.4" />
      <path d="M30 15 Q42 10 48 0" stroke="#22B57A" strokeWidth="1.2" opacity="0.4" />
      <path d="M30 25 Q18 20 12 8" stroke="#22B57A" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

/** Leaf-and-stem line art, top-right of the hero. */
function LeafArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" fill="none" className={className} aria-hidden="true">
      <path
        d="M110 190 C 90 190 75 175 80 160 C 60 158 55 140 68 128 C 60 112 75 95 95 100 C 100 82 125 78 138 92 C 158 88 172 105 165 122 C 180 128 182 150 165 158 C 168 175 150 190 130 185 C 124 190 116 190 110 190 Z"
        stroke="#fff"
        strokeWidth="1.2"
        opacity="0.4"
      />
      <path d="M100 150 Q110 130 100 112" stroke="#F2B705" strokeWidth="1.2" opacity="0.5" />
      <path d="M115 158 Q128 132 118 100" stroke="#F2B705" strokeWidth="1.2" opacity="0.5" />
      <path d="M135 152 L138 200" stroke="#22B57A" strokeWidth="1.4" opacity="0.5" />
      <path d="M138 200 Q160 195 172 178" stroke="#22B57A" strokeWidth="1.2" opacity="0.4" />
      <path d="M138 205 Q118 202 105 188" stroke="#22B57A" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}
