import { Link } from "@tanstack/react-router";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { ButtonLink } from "@/components/ui/button";
import type { BlogPostDTO, TourDTO } from "@/lib/content-types";

export function BlogSidebar({
  relatedBlogs,
  tours,
}: {
  relatedBlogs: BlogPostDTO[];
  tours: TourDTO[];
}) {
  return (
    <aside className="flex flex-col gap-10">
      {relatedBlogs.length ? (
        <div className="rounded-2xl border border-rule bg-paper p-6 shadow-sm">
          <h3 className="mb-5 font-display text-[1.2rem] text-green-dark">
            Related Blogs For Updated Info
          </h3>
          <div className="flex flex-col gap-5">
            {relatedBlogs.map((r) => (
              <Link
                key={r.id}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="group flex flex-col gap-3 transition-colors"
              >
                <PhotoFrame
                  src={r.coverImage}
                  alt={r.title}
                  gradient={gradientFor(r.slug)}
                  className="aspect-[16/10] w-full rounded-xl"
                />
                <h4 className="font-display text-[0.95rem] leading-snug font-bold text-ink group-hover:text-green text-center">
                  {r.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-rule bg-paper p-6 text-center shadow-sm">
        <h3 className="mb-5 font-display text-[1.2rem] text-green-dark">
          Best Value Tours For First Timers
        </h3>
        <div className="flex flex-col gap-6">
          {tours.slice(0, 2).map((tour) => (
            <div
              key={tour.id}
              className="flex flex-col overflow-hidden rounded-xl border border-rule transition-shadow hover:shadow-md"
            >
              <PhotoFrame
                src={tour.heroImage ?? tour.images[0]}
                alt={tour.title}
                gradient={gradientFor(tour.slug)}
                className="aspect-[4/3] w-full"
              />
              <div className="p-4 text-left">
                <h4 className="font-display text-[1.1rem] leading-snug font-bold text-green">
                  {tour.title}
                </h4>
                <div className="my-3 grid grid-cols-2 gap-2 text-[0.75rem] text-muted">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg leading-none">🕐</span> {tour.durationDays} {tour.durationDays === 1 ? "Day" : "Days"}
                  </div>
                  {tour.activitiesCount ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg leading-none">🚶</span> {tour.activitiesCount}+ Activities
                    </div>
                  ) : null}
                  {tour.groupSizeMax ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg leading-none">👥</span> {tour.groupSizeMax} People
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="text-[0.7rem] text-muted">
                    From
                    <span className="block font-display text-[1.1rem] font-bold text-ink leading-tight">
                      ${tour.discountPriceUsd ?? tour.priceUsd}
                    </span>
                  </div>
                  <ButtonLink
                    to={`/tours/${tour.slug}`}
                    variant="green"
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
    </aside>
  );
}
