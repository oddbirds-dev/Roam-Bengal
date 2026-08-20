import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Quote, Send } from "lucide-react";
import { FaStar } from "react-icons/fa";
import { SiFacebook, SiGoogle, SiTripadvisor, SiTrustpilot } from "react-icons/si";
import type { IconType } from "react-icons/lib";
import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { buttonClass } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import type { TestimonialDTO } from "@/lib/content-types";
import { PLATFORM_BRANDS, REVIEWS_BG, REVIEWS_TOPO_LINE, REVIEW_CARD_TINTS } from "./palette";
import type { HomeSectionProps } from "./registry";

/** Three cards per slide, three slides at most — past that the dots stop reading as a
 *  position indicator and start reading as decoration. */
const PER_SLIDE = 3;
const MAX_REVIEWS = PER_SLIDE * 3;

/** Real marks for the platforms we know. Anything else keeps the glyph the editor typed
 *  into site settings, so adding a platform never needs a code change. */
const PLATFORM_LOGOS: Record<string, IconType> = {
  tripadvisor: SiTripadvisor,
  google: SiGoogle,
  trustpilot: SiTrustpilot,
  facebook: SiFacebook,
};

export function ReviewsSection({ testimonials }: HomeSectionProps) {
  const { homepage, reviews } = useSiteSettings();
  const featured = testimonials.filter((t) => t.isFeatured);
  const pool = (featured.length ? featured : testimonials).slice(0, MAX_REVIEWS);
  const slides = chunk(pool, PER_SLIDE);

  const [slide, setSlide] = useState(0);
  // Clamped on read rather than corrected in an effect: under the admin's live preview
  // the testimonial list can shrink while a later slide is showing.
  const current = slides.length ? Math.min(slide, slides.length - 1) : 0;
  const go = (next: number) => setSlide((next + slides.length) % slides.length);

  return (
    <section
      id="reviews"
      className="relative overflow-hidden pt-[86px]"
      style={{ background: REVIEWS_BG }}
    >
      <TopoField />
      <EdgePhoto
        side="left"
        src={homepage.reviews_photo_left}
        alt="Traveller photograph from a Roam Bengal trip"
        placeholderLabel="images/reviews-print-left.jpg"
      />
      <EdgePhoto
        side="right"
        src={homepage.reviews_photo_right}
        alt="Traveller photograph from a Roam Bengal trip"
        placeholderLabel="images/reviews-print-right.jpg"
      />
      <Shoreline />

      <div className="shell relative z-[2]">
        <div className="mx-auto max-w-[1160px] text-center">
          <span className="block font-script text-[clamp(1.5rem,2.8vw,2.05rem)] leading-tight font-bold text-gold">
            {homepage.reviews_eyebrow}
          </span>
          <h2 className="mt-1 font-display text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.16] font-bold text-green-dark">
            {homepage.reviews_heading_1}
            <br />
            <span className="text-gold">{homepage.reviews_heading_2}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-center text-[0.95rem] text-muted">
            {homepage.reviews_subtext}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {reviews.platforms.map((p) => {
              const key = p.name.toLowerCase().replace(/[^a-z]/g, "");
              const Logo = PLATFORM_LOGOS[key];
              // A known platform paints in its own brand colour — the settings colour is
              // the fallback for platforms this file has never heard of.
              const colour = PLATFORM_BRANDS[key] ?? p.colour;
              return (
                <div
                  key={p.name}
                  className="flex min-w-[190px] items-center gap-3 rounded-[14px] bg-paper px-[18px] py-3.5 text-left shadow-[0_6px_20px_rgba(32,41,31,0.07)]"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center text-[1.55rem]"
                    style={{ color: colour }}
                    aria-hidden="true"
                  >
                    {Logo ? <Logo /> : p.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.95rem] font-semibold text-ink">{p.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5">
                      <ScoreStars
                        score={Number(p.score) || 5}
                        colour={colour}
                        className="text-[0.72rem]"
                      />
                      <span className="text-[0.78rem] text-muted">
                        {p.score}/{reviews.score_out_of}
                      </span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {slides.length ? (
            <div className="relative mt-[46px]">
              {slides.length > 1 ? (
                <>
                  <ArrowButton
                    direction="prev"
                    onClick={() => go(current - 1)}
                    className="absolute top-1/2 left-0 z-[3] hidden -translate-x-1/2 -translate-y-1/2 nav:flex"
                  />
                  <ArrowButton
                    direction="next"
                    onClick={() => go(current + 1)}
                    className="absolute top-1/2 right-0 z-[3] hidden translate-x-1/2 -translate-y-1/2 nav:flex"
                  />
                </>
              ) : null}

              <div className="overflow-hidden nav:mx-10">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${current * 100}%)` }}
                >
                  {slides.map((group, i) => (
                    <div
                      key={i}
                      className="grid w-full shrink-0 items-stretch gap-[22px] nav:grid-cols-3"
                      // Off-screen slides are inert, so tabbing never lands on a card
                      // nobody can see.
                      inert={i !== current}
                    >
                      {group.map((t, j) => (
                        <ReviewCard key={t.id} review={t} tint={i * PER_SLIDE + j} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {slides.length > 1 ? (
                <div className="mt-7 flex items-center justify-center gap-2">
                  <ArrowButton
                    direction="prev"
                    onClick={() => go(current - 1)}
                    className="mr-1 flex nav:hidden"
                  />
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlide(i)}
                      aria-label={`Show reviews ${i + 1} of ${slides.length}`}
                      aria-current={i === current}
                      className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${
                        i === current ? "w-[26px] bg-gold" : "w-2 bg-ink/15 hover:bg-ink/25"
                      }`}
                    />
                  ))}
                  <ArrowButton
                    direction="next"
                    onClick={() => go(current + 1)}
                    className="ml-1 flex nav:hidden"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="pt-11 pb-[150px]">
            <Link
              // `to` is a runtime string from site_settings, as elsewhere on this page.
              to={homepage.reviews_cta_link as never}
              className={buttonClass(
                "green-dark",
                "px-8 py-3.5 text-[0.92rem] shadow-[0_10px_26px_rgba(18,61,38,0.28)]",
              )}
            >
              <Send className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
              {homepage.reviews_cta_label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function ReviewCard({ review, tint }: { review: TestimonialDTO; tint: number }) {
  const palette = REVIEW_CARD_TINTS[tint % REVIEW_CARD_TINTS.length]!;
  return (
    <figure
      className="flex h-full flex-col items-center rounded-[18px] px-7 pt-8 pb-7 text-center"
      style={{ background: palette.bg }}
    >
      <Quote className="h-7 w-7 fill-gold text-gold" strokeWidth={0} aria-hidden="true" />
      <blockquote className="mt-4 flex-1 text-center text-[0.98rem] leading-[1.6] text-ink/85">
        ‘{review.headline ?? review.quote}’
      </blockquote>
      <ScoreStars score={review.rating ?? 5} colour="#F2B705" className="mt-4 text-[0.9rem]" />
      <figcaption className="mt-5 flex flex-col items-center gap-2.5">
        {review.avatarUrl ? (
          <img
            src={review.avatarUrl}
            alt=""
            loading="lazy"
            className="h-[46px] w-[46px] rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full font-display text-[1.15rem] font-bold text-white"
            style={{ background: palette.avatar }}
            aria-hidden="true"
          >
            {review.author.trim().charAt(0).toUpperCase()}
          </span>
        )}
        <span>
          <span className="block text-[0.92rem] font-bold text-ink">{review.author}</span>
          <span className="block text-[0.78rem] text-muted">
            {review.location ?? "Guest Review"}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/**
 * Five stars filled to `score`, part-star included — a 4.8 shows four and four-fifths
 * rather than rounding up to a clean five it hasn't earned.
 */
function ScoreStars({
  score,
  colour,
  className = "",
}: {
  score: number;
  colour: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, score / 5)) * 100;
  return (
    <span
      className={`relative inline-flex w-fit ${className}`}
      role="img"
      aria-label={`Rated ${score} out of 5`}
    >
      <span className="flex gap-[2px] text-[#D9D3C4]" aria-hidden="true">
        {STAR_SLOTS.map((i) => (
          <FaStar key={i} className="shrink-0" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-[2px] overflow-hidden"
        style={{ width: `${pct}%`, color: colour }}
        aria-hidden="true"
      >
        {STAR_SLOTS.map((i) => (
          <FaStar key={i} className="shrink-0" />
        ))}
      </span>
    </span>
  );
}

function ArrowButton({
  direction,
  onClick,
  className = "",
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous reviews" : "Next reviews"}
      className={`h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-paper text-green-dark shadow-[0_6px_18px_rgba(32,41,31,0.14)] transition-colors duration-200 hover:bg-green-dark hover:text-white ${className}`}
    >
      <Icon className="h-5 w-5" strokeWidth={2.2} />
    </button>
  );
}

/**
 * A tilted print taped to the edge of the band, half off-page. Decorative, so it only
 * appears where there is margin to hold it without crowding the cards.
 */
function EdgePhoto({
  side,
  src,
  alt,
  placeholderLabel,
}: {
  side: "left" | "right";
  src?: string;
  alt: string;
  placeholderLabel: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-[14%] z-[1] hidden w-[210px] xl:block ${
        side === "left" ? "-left-16 -rotate-[9deg]" : "-right-16 rotate-[7deg]"
      }`}
    >
      <PhotoFrame
        src={src}
        alt={alt}
        gradientCss={
          side === "left"
            ? "linear-gradient(160deg,#3E7A6E,#123D30)"
            : "linear-gradient(160deg,#F0791E,#C4390E)"
        }
        placeholderLabel={placeholderLabel}
        className="aspect-[3/4] w-full rounded-[6px] border-[10px] border-paper shadow-[0_18px_40px_rgba(32,41,31,0.18)]"
      />
    </div>
  );
}

/** Faint contour lines and a dotted route, as on a walking map. */
function TopoField() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      aria-hidden="true"
    >
      <g stroke={REVIEWS_TOPO_LINE} strokeWidth="1.4" opacity="0.08">
        {TOPO_CLUSTERS.map((c) =>
          TOPO_RINGS.map((ring) => (
            <ellipse
              key={`${c.cx}-${ring}`}
              cx={c.cx}
              cy={c.cy}
              rx={46 + ring * 36}
              ry={30 + ring * 23}
              transform={`rotate(${c.rotate} ${c.cx} ${c.cy})`}
            />
          )),
        )}
      </g>
      <path
        d="M1160 120 C1235 78 1318 118 1330 176 C1341 231 1272 254 1236 226"
        stroke={REVIEWS_TOPO_LINE}
        strokeWidth="2"
        strokeDasharray="7 9"
        strokeLinecap="round"
        opacity="0.26"
      />
    </svg>
  );
}

/** The green shore the band closes on, with map pins dotted along it. */
function Shoreline() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[190px]"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 190"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0,72 C210,8 400,116 700,84 C980,54 1180,124 1440,58 L1440,190 L0,190 Z"
          fill="#1E5F3B"
          opacity="0.35"
        />
        <path
          d="M0,104 C230,44 420,146 700,112 C990,78 1190,150 1440,92 L1440,190 L0,190 Z"
          fill="#123D26"
        />
      </svg>
      <MapPin className="absolute bottom-[52px] left-[7%] h-7 w-7 text-white/30" strokeWidth={1.6} />
      <svg
        className="absolute bottom-[34px] left-[11%] h-10 w-[220px] text-white/25"
        viewBox="0 0 220 40"
        fill="none"
      >
        <path
          d="M4 30 C60 4 130 46 214 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 8"
          strokeLinecap="round"
        />
      </svg>
      <MapPin
        className="absolute right-[12%] bottom-[74px] h-6 w-6 text-white/25"
        strokeWidth={1.6}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STAR_SLOTS = [0, 1, 2, 3, 4];
const TOPO_RINGS = [0, 1, 2, 3, 4, 5];

const TOPO_CLUSTERS = [
  { cx: 195, cy: 130, rotate: -18 },
  { cx: 1255, cy: 205, rotate: 14 },
  { cx: 720, cy: 700, rotate: -6 },
];

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
