import { Link } from "@tanstack/react-router";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { BestValueTours } from "@/components/tour/best-value-tours";
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

      <BestValueTours tours={tours} />
    </aside>
  );
}
