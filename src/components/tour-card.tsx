import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { PhotoFrame, FRAME_GRADIENTS, gradientFor } from "@/components/ui/photo-frame";
import type { TourDTO } from "@/lib/content-types";

/** Generic value props shown on every card — not tour-specific data. */
const TRUST_BADGES = [
  { icon: "🛡️", label: "Safe & Reliable" },
  { icon: "🧑‍✈️", label: "Expert Guide" },
  { icon: "💧", label: "Water Included" },
  { icon: "🎧", label: "24/7 Support" },
];

/** Shared by the homepage, /tours, and the tour page's related rail. */
export function TourCard({
  tour,
  gradientCss,
}: {
  tour: TourDTO;
  /** Overrides the slug-hashed frame colour, so a grid can follow a fixed sequence. */
  gradientCss?: string;
}) {
  // Purely a visual toggle — there is no wishlist backend to persist this to.
  const [saved, setSaved] = useState(false);

  return (
    <article className="overflow-hidden rounded-[22px] border border-rule bg-paper shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-250 hover:-translate-y-1.5">
      <PhotoFrame
        src={tour.heroImage ?? tour.images[0]}
        alt={tour.title}
        gradientCss={gradientCss ?? FRAME_GRADIENTS[gradientFor(tour.slug)]}
        placeholderLabel={`images/tour-${tour.slug}.jpg`}
        className="aspect-4/3 w-full"
      >
        {tour.isFeatured ? (
          <span className="absolute top-4 left-4 z-3 inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-1.75 text-[0.78rem] font-bold whitespace-nowrap text-white shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
            ⭐ Featured
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved tours" : "Save tour"}
          className="absolute top-4 right-4 z-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[1.05rem] shadow-[0_6px_14px_rgba(0,0,0,0.18)] transition-transform hover:scale-105"
        >
          {saved ? "❤️" : "🤍"}
        </button>
      </PhotoFrame>

      <div className="px-[22px] pt-5 pb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {tour.destinationLabel ? (
            <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
              📍 {tour.destinationLabel}
            </span>
          ) : (
            <span />
          )}
          {tour.activityLabel ? (
            <span className="rounded-full bg-mint px-3 py-1 text-[0.75rem] font-medium whitespace-nowrap text-green">
              🏷️ {tour.activityLabel}
            </span>
          ) : null}
        </div>

        <h4 className="mb-2 font-display text-[1.25rem] font-bold text-green">{tour.title}</h4>

        {tour.summary ? (
          <p className="mb-5 line-clamp-3 text-[0.85rem] leading-[1.6] text-muted">
            {tour.summary}
          </p>
        ) : null}

        <div className="mb-5 grid grid-cols-3 gap-2 border-y border-rule py-4 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-[1rem]">
              🕐
            </span>
            <span className="text-[0.66rem] text-muted">Duration</span>
            <span className="text-[0.82rem] font-semibold text-ink">
              {tour.durationLabel ?? `${tour.durationDays} Day${tour.durationDays === 1 ? "" : "s"}`}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-[1rem]">
              👥
            </span>
            <span className="text-[0.66rem] text-muted">Group Size</span>
            <span className="text-[0.82rem] font-semibold text-ink">
              {tour.groupSizeMax ? `Up to ${tour.groupSizeMax}` : "Flexible"}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mint text-[1rem]">
              ⭐
            </span>
            <span className="text-[0.66rem] text-muted">Rating</span>
            <span className="text-[0.82rem] font-semibold text-ink">
              {tour.rating ? tour.rating.toFixed(1) : "New"} ({tour.reviewsCount})
            </span>
          </div>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3.5">
          <div className="text-[0.76rem] leading-[1.3] text-muted">
            From
            <span className="block font-display text-[1.35rem] font-bold text-ink">
              {formatPrice(tour.discountPriceUsd ?? tour.priceUsd)}
            </span>
            per person
          </div>
          <Link
            to="/tours/$slug"
            params={{ slug: tour.slug }}
            className="inline-flex items-center justify-center gap-2 rounded-[30px] bg-green px-5 py-2.75 text-[0.8rem] font-semibold whitespace-nowrap text-white transition-colors hover:bg-green-dark"
          >
            Book Now →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-3 sm:grid-cols-4">
          {TRUST_BADGES.map((b) => (
            <div key={b.label} className="flex items-center gap-1.5 text-[0.7rem] text-muted">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-[0.85rem]">
                {b.icon}
              </span>
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function formatPrice(usd: number | null): string {
  if (usd === null) return "On request";
  return `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}`;
}
