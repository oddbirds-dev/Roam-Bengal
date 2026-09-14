import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/components/tour-card";
import type { TourDTO } from "@/lib/content-types";

/**
 * Sidebar upsell: a handful of hand-picked tours styled for a first-time visitor to book
 * quickly. Shared by the blog sidebar and the tour page's own sidebar.
 */
export function BestValueTours({ tours, limit = 4 }: { tours: TourDTO[]; limit?: number }) {
  const picks = tours.slice(0, limit);
  if (!picks.length) return null;

  return (
    <div className="rounded-2xl border border-rule bg-paper p-6 text-center shadow-sm">
      <h3 className="mb-5 font-display text-[1.2rem] text-green-dark">
        Best Value Tours For First Timers
      </h3>
      <div className="flex flex-col gap-6">
        {picks.map((tour) => (
          <div
            key={tour.id}
            className="flex flex-col overflow-hidden rounded-xl border border-rule transition-shadow hover:shadow-md"
          >
            <PhotoFrame
              src={tour.heroImage ?? tour.images[0]?.url}
              alt={tour.heroImage ? tour.heroImageAlt || tour.title : tour.images[0]?.alt || tour.title}
              gradient={gradientFor(tour.slug)}
              className="aspect-[4/3] w-full"
            />
            <div className="p-4 text-left">
              <h4 className="font-display text-[1.1rem] leading-snug font-bold text-green">
                {tour.title}
              </h4>
              <p className="mt-0.5 text-[0.78rem] text-muted">Private Guided Visit</p>

              <div className="my-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.78rem] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="text-base leading-none">📅</span>
                  {tour.durationDays} Full {tour.durationDays === 1 ? "Day" : "Days"}
                </span>
                {tour.stopsCount ? (
                  <span className="flex items-center gap-1.5">
                    <span className="text-base leading-none">📍</span> {tour.stopsCount}+ Marvels
                  </span>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-[0.7rem] text-muted">
                  From*
                  <span className="block font-display text-[1.1rem] font-bold text-ink leading-tight">
                    {formatPrice(tour.discountPriceUsd ?? tour.priceUsd)}
                  </span>
                </div>
                <ButtonLink
                  to={`/tours/${tour.slug}`}
                  variant="green-dark"
                  className="px-4 py-1.5 text-[0.75rem] min-h-0"
                >
                  View Details →
                </ButtonLink>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
