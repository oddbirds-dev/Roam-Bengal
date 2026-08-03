import { Link } from "@tanstack/react-router";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import type { TourDTO } from "@/lib/content-types";

/** Shared by the homepage, /tours, and the tour page's related rail. */
export function TourCard({ tour }: { tour: TourDTO }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_2px_14px_rgba(32,41,31,0.06)] transition-shadow hover:shadow-[0_8px_28px_rgba(32,41,31,0.12)]">
      <PhotoFrame
        src={tour.heroImage ?? tour.images[0]}
        alt={tour.title}
        gradient={gradientFor(tour.slug)}
        placeholderLabel={`images/tour-${tour.slug}.jpg`}
        className="aspect-[4/3] w-full"
      >
        {tour.isFeatured ? (
          <span className="absolute top-3 left-3 rounded-full bg-gold px-3 py-1 text-[0.68rem] font-semibold text-ink">
            👑 Featured
          </span>
        ) : null}
      </PhotoFrame>

      <div className="flex flex-1 flex-col p-5">
        <h4 className="font-display text-[1.15rem] font-bold text-green-dark">
          {tour.title}
        </h4>
        {tour.destinationLabel ? (
          <div className="mt-1 text-[0.8rem] text-muted">📍 {tour.destinationLabel}</div>
        ) : null}

        {tour.summary ? (
          <p className="mt-3 line-clamp-3 text-[0.86rem] leading-6 text-muted">
            {tour.summary}
          </p>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2 border-y border-rule py-3 text-[0.76rem] text-muted">
          <div>🕐 Days: {tour.durationDays}</div>
          {tour.activitiesCount ? <div>🚶 Activities: {tour.activitiesCount}+</div> : null}
          {tour.groupSizeMax ? <div>👥 Group: {tour.groupSizeMax}</div> : null}
          {tour.stopsCount ? <div>📍 Stops: {tour.stopsCount}+</div> : null}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3 pt-1">
          <div className="text-[0.72rem] text-muted">
            From
            <br />
            <span className="font-display text-[1.4rem] font-bold text-green">
              {formatPrice(tour.discountPriceUsd ?? tour.priceUsd)}
            </span>
          </div>
          <Link
            to="/tours/$slug"
            params={{ slug: tour.slug }}
            className="inline-flex items-center justify-center rounded-[30px] border-[1.5px] border-transparent bg-green-dark px-5 py-2.5 text-[0.82rem] font-semibold text-white transition-colors hover:bg-green"
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
