import { useSiteSettings } from "@/hooks/use-site-settings";
import { ButtonLink } from "@/components/ui/button";
import { AVATAR_FRAMES, PLATFORM_MARKS, REVIEWS_BG, REVIEWS_BLOBS, REVIEWS_MAP_MASK } from "./palette";
import type { HomeSectionProps } from "./registry";

export function ReviewsSection({ testimonials }: HomeSectionProps) {
  const { homepage, reviews } = useSiteSettings();
  const featuredReviews = testimonials.filter((t) => t.isFeatured).slice(0, 3);
  const homeReviews = featuredReviews.length ? featuredReviews : testimonials.slice(0, 3);

  return (
    <section
      id="reviews"
      className="shell relative overflow-hidden py-20 text-center"
      style={{ background: REVIEWS_BG }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{ background: REVIEWS_BLOBS }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1.6px, transparent 1.8px)",
          backgroundSize: "16px 16px",
          WebkitMaskImage: REVIEWS_MAP_MASK,
          maskImage: REVIEWS_MAP_MASK,
        }}
        aria-hidden="true"
      />

      <div className="relative z-[2] mx-auto max-w-[1160px]">
        <h2 className="mb-[34px] font-display text-[clamp(1.9rem,3.6vw,2.7rem)] leading-[1.25] font-bold text-white">
          {homepage.reviews_heading_1}
          <br />
          <span className="text-gold">{homepage.reviews_heading_2}</span>
        </h2>

        <div className="mb-[50px] flex flex-wrap justify-center gap-4">
          {reviews.platforms.map((p, i) => {
            const mark = PLATFORM_MARKS[i % PLATFORM_MARKS.length]!;
            return (
              <div
                key={p.name}
                className="min-w-[190px] rounded-xl bg-paper px-[26px] py-4 text-left shadow-[0_6px_18px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-2 flex items-center gap-2 text-[1rem] font-bold text-ink">
                  <span className="text-[1.1rem]" style={{ color: p.colour }}>
                    {p.icon}
                  </span>
                  {p.name}
                </div>
                <div className="flex items-center gap-1.5 text-[0.82rem] text-muted">
                  <span className="text-[0.7rem] tracking-[1px]" style={{ color: mark.colour }}>
                    {mark.glyph}
                  </span>
                  Reviews {p.score}/5
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-[22px] nav:grid-cols-3">
          {homeReviews.map((t, i) => (
            <figure key={t.id} className="px-5 py-4 text-center">
              <blockquote className="mb-[18px] text-[0.98rem] leading-[1.6] text-[#F2F5F2]">
                “{t.headline ?? t.quote}”
              </blockquote>
              <div
                className="mb-4 text-[0.95rem] text-gold"
                aria-label={`${Math.round(t.rating ?? 5)} out of 5 stars`}
              >
                {"★".repeat(Math.round(t.rating ?? 5))}
                <span className="text-white/25">
                  {"★".repeat(Math.max(0, 5 - Math.round(t.rating ?? 5)))}
                </span>
              </div>
              <figcaption className="flex flex-col items-center gap-2">
                <span
                  className="flex h-[52px] w-[52px] items-center justify-center rounded-full font-display text-[1.1rem] font-bold text-white"
                  style={{ background: AVATAR_FRAMES[i % AVATAR_FRAMES.length] }}
                  aria-hidden="true"
                >
                  {t.author.trim().charAt(0).toUpperCase()}
                </span>
                <span>
                  <span className="block text-[0.9rem] font-bold text-white">{t.author}</span>
                  <span className="block text-[0.76rem] text-white/60">
                    {t.location ?? "Guest Review"}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-9 mb-[26px] flex justify-center gap-2" aria-hidden="true">
          {homeReviews.map((t, i) => (
            <span
              key={t.id}
              className={
                i === 0 ? "h-2 w-[22px] rounded-[5px] bg-gold" : "h-2 w-2 rounded-full bg-white/30"
              }
            />
          ))}
        </div>

        <ButtonLink to={homepage.reviews_cta_link} variant="blue">
          {homepage.reviews_cta_label}
        </ButtonLink>
      </div>
    </section>
  );
}
