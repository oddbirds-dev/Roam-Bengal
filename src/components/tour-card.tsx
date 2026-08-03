import { Link } from "@tanstack/react-router";
import { PhotoFrame, FRAME_GRADIENTS, gradientFor } from "@/components/ui/photo-frame";
import type { TourDTO } from "@/lib/content-types";

/** Shared by the homepage, /tours, and the tour page's related rail. */
export function TourCard({
  tour,
  gradientCss,
}: {
  tour: TourDTO;
  /** Overrides the slug-hashed frame colour, so a grid can follow a fixed sequence. */
  gradientCss?: string;
}) {
  return (
    <article className="overflow-hidden rounded-[18px] border border-[#E7E7E7] bg-paper shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-[250ms] hover:-translate-y-1.5">
      <PhotoFrame
        src={tour.heroImage ?? tour.images[0]}
        alt={tour.title}
        gradientCss={gradientCss ?? FRAME_GRADIENTS[gradientFor(tour.slug)]}
        placeholderLabel={`images/tour-${tour.slug}.jpg`}
        className="aspect-[4/3.2] w-full"
      >
        {tour.isFeatured ? (
          <span className="absolute top-4 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-1.5 rounded-[20px] bg-orange px-[18px] py-[7px] text-[0.78rem] font-bold whitespace-nowrap text-white shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
            👑 Featured
          </span>
        ) : null}
      </PhotoFrame>

      <div className="px-[22px] pt-[22px] pb-6">
        <h4 className="mb-2 font-display text-[1.25rem] font-bold text-green">
          {tour.title}
        </h4>
        {tour.destinationLabel ? (
          <div className="mb-3.5 flex items-center gap-1.5 text-[0.82rem] text-muted">
            📍 {tour.destinationLabel}
          </div>
        ) : null}

        {tour.summary ? (
          <p className="mb-[18px] line-clamp-4 text-[0.85rem] leading-[1.6] text-muted">
            {tour.summary}
          </p>
        ) : null}

        <div className="mb-5 grid grid-cols-2 gap-x-3.5 gap-y-2.5 border-y border-dashed border-[#E4E4E4] py-4 text-[0.8rem] text-ink">
          <div className="flex items-center gap-1.5">🕐 Days: {tour.durationDays}</div>
          {tour.activitiesCount ? (
            <div className="flex items-center gap-1.5">
              🚶 Activities: {tour.activitiesCount}+
            </div>
          ) : null}
          {tour.groupSizeMax ? (
            <div className="flex items-center gap-1.5">👥 Group: {tour.groupSizeMax}</div>
          ) : null}
          {tour.stopsCount ? (
            <div className="flex items-center gap-1.5">📍 Stops: {tour.stopsCount}+</div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-[0.76rem] leading-[1.3] text-muted">
            From
            <span className="block font-display text-[1.35rem] font-bold text-ink">
              {formatPrice(tour.discountPriceUsd ?? tour.priceUsd)}
            </span>
          </div>
          <Link
            to="/tours/$slug"
            params={{ slug: tour.slug }}
            className="inline-flex items-center justify-center gap-2 rounded-[30px] bg-orange px-5 py-[11px] text-[0.8rem] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#D96A15]"
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}

export function formatPrice(usd: number | null): string {
  if (usd === null) return "On request";
  return `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}`;
}
