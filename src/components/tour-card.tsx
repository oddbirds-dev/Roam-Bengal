import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  FiCalendar,
  FiUsers,
  FiActivity,
  FiNavigation,
  FiMapPin,
  FiTag,
  FiHeart,
} from "react-icons/fi";
import { FaStar, FaHeart } from "react-icons/fa";
import { PhotoFrame, FRAME_GRADIENTS, gradientFor } from "@/components/ui/photo-frame";
import { overviewParagraphs, plainText, type TourDTO } from "@/lib/content-types";

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

  const price = tour.priceUsd;
  const discountPrice = tour.discountPriceUsd;
  const hasDiscount = price !== null && discountPrice !== null && discountPrice < price;
  const discountPct = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : null;
  // The overview is authored with markup, so the card strips it rather than printing tags.
  const teaser = overviewParagraphs(tour.overview).map(plainText).find(Boolean);

  return (
    <article className="overflow-hidden rounded-[22px] border border-rule bg-paper shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-250 hover:-translate-y-1.5">
      <PhotoFrame
        src={tour.heroImage ?? tour.images[0]}
        alt={tour.title}
        gradientCss={gradientCss ?? FRAME_GRADIENTS[gradientFor(tour.slug)]}
        placeholderLabel={`images/tour-${tour.slug}.jpg`}
        className="aspect-4/3 w-full"
      >
        <div className="absolute top-4 left-4 z-3 flex flex-col items-start gap-2">
          {tour.isFeatured ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-1.75 text-[0.78rem] font-bold whitespace-nowrap text-white shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
              <FaStar className="h-3 w-3" /> Featured
            </span>
          ) : null}
          {hasDiscount ? (
            <span className="inline-flex items-center rounded-full bg-orange px-4 py-1.75 text-[0.78rem] font-bold whitespace-nowrap text-white shadow-[0_6px_14px_rgba(0,0,0,0.18)]">
              {discountPct}% Off
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setSaved((s) => !s)}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved tours" : "Save tour"}
          className="absolute top-4 right-4 z-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[1.05rem] shadow-[0_6px_14px_rgba(0,0,0,0.18)] transition-transform hover:scale-105"
        >
          {saved ? (
            <FaHeart className="h-4.5 w-4.5 text-orange" />
          ) : (
            <FiHeart className="h-4.5 w-4.5 text-muted" />
          )}
        </button>
      </PhotoFrame>

      <div className="px-[22px] pt-4 pb-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          {tour.destinationLabel ? (
            <span className="flex items-center gap-1.5 text-[0.8rem] text-muted">
              <FiMapPin className="h-3.5 w-3.5" /> {tour.destinationLabel}
            </span>
          ) : (
            <span />
          )}
          {tour.activityLabel ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1 text-[0.75rem] font-medium whitespace-nowrap text-green">
              <FiTag className="h-3.5 w-3.5" /> {tour.activityLabel}
            </span>
          ) : null}
        </div>

        <h4 className="mb-1.5 font-display text-[1.25rem] font-bold text-green">{tour.title}</h4>

        {teaser ? (
          <p className="mb-4 line-clamp-2 text-[0.85rem] leading-[1.55] text-muted">
            {teaser}
          </p>
        ) : null}

        <div className="mb-4 grid grid-cols-4 gap-1.5 border-y border-rule py-3 text-center">
          <StatItem
            icon={<FiCalendar />}
            value={tour.durationLabel ?? `${tour.durationDays} Day${tour.durationDays === 1 ? "" : "s"}`}
            label="Duration"
          />
          <StatItem
            icon={<FiUsers />}
            value={tour.groupSizeMax ? `Up to ${tour.groupSizeMax}` : "Flexible"}
            label="Group Size"
          />
          <StatItem
            icon={<FiActivity />}
            value={tour.activitiesCount ? `${tour.activitiesCount} Activities` : "Custom"}
            label="Included"
          />
          <StatItem
            icon={<FiNavigation />}
            value={tour.stopsCount ? `${tour.stopsCount} Stops` : "Multiple"}
            label="Trip Stops"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="text-[0.76rem] leading-[1.3] text-muted">
              From
              <span className="block font-display text-[1.35rem] font-bold text-green">
                {formatPrice(discountPrice ?? price)}
              </span>
              per person
            </div>
            {hasDiscount ? (
              <div className="flex flex-col items-start gap-1 border-l border-rule pl-3">
                <span className="text-[0.8rem] text-muted line-through">{formatPrice(price)}</span>
                <span className="rounded-full border border-orange px-2 py-0.5 text-[0.68rem] font-semibold whitespace-nowrap text-orange">
                  {discountPct}% Off
                </span>
              </div>
            ) : null}
          </div>
          <Link
            to="/tours/$slug"
            params={{ slug: tour.slug }}
            className="inline-flex items-center justify-center gap-2 rounded-[30px] bg-orange px-5 py-2.75 text-[0.8rem] font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#D9600F]"
          >
            Book Now →
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatItem({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[1.05rem] text-orange">{icon}</span>
      <span className="text-[0.8rem] font-bold whitespace-nowrap text-ink">{value}</span>
      <span className="text-[0.64rem] text-muted">{label}</span>
    </div>
  );
}

export function formatPrice(usd: number | null): string {
  if (usd === null) return "On request";
  return `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}`;
}
