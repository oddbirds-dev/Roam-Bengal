import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { Stars, InitialAvatar } from "@/components/sections";
import { useSiteSettings } from "@/hooks/use-site-settings";
import type { TestimonialDTO } from "@/lib/content-types";

/**
 * Two shared strips that sit below every policy / standalone info page, just above the
 * footer. Lighter than the homepage `GallerySection` / `ReviewsSection` — no carousel,
 * no decorative map art — so they read as a quiet footer to a legal page rather than a
 * second homepage.
 */

/** Compact 4-up photo grid, wired to the same `gallery` settings the homepage uses. */
export function PolicyGallery() {
  const { gallery } = useSiteSettings();
  const photos = gallery.photos.slice(0, 4);
  if (!photos.length) return null;

  return (
    <section className="border-t border-rule bg-cream py-16">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <span className="block text-[0.72rem] font-semibold tracking-[0.2em] text-orange uppercase">
              {gallery.heading_1}
            </span>
            <h2 className="mt-2 font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight text-green">
              {gallery.heading_2}
            </h2>
          </div>
          <ButtonLink
            to={gallery.cta_link}
            variant="green-dark"
            className="whitespace-nowrap"
          >
            {gallery.cta_label}
          </ButtonLink>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-4 md:grid-cols-4">
          {photos.map((photo) => (
            <PhotoFrame
              key={photo.tag}
              src={photo.image_url}
              alt={photo.tag}
              gradient={gradientFor(photo.tag)}
              placeholderLabel={photo.tag}
              className="aspect-square rounded-xl transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-black/55" />
              <span className="absolute bottom-0 left-0 p-3 text-[0.75rem] font-semibold text-white">
                {photo.tag}
              </span>
            </PhotoFrame>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Up to three testimonial cards, matching the strip on /about. */
export function PolicyReviews({ testimonials }: { testimonials: TestimonialDTO[] }) {
  const featured = testimonials.filter((t) => t.isFeatured);
  const shown = (featured.length ? featured : testimonials).slice(0, 3);
  if (!shown.length) return null;

  return (
    <section className="border-t border-rule py-16">
      <div className="wrap">
        <h2 className="text-center font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight text-green">
          Don't Take Our Word For It.
          <br />
          <span className="text-orange">Travellers</span> Say It Best
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {shown.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-2xl border border-rule bg-cream p-6 text-center"
            >
              <blockquote className="flex-1 text-[0.9rem] leading-7 text-ink/85">
                “{t.headline ?? t.quote}”
              </blockquote>
              <div className="mt-4">
                <Stars rating={t.rating} />
              </div>
              <figcaption className="mt-4 flex items-center justify-center gap-3">
                <InitialAvatar name={t.author} className="h-9 w-9" />
                <span className="text-left">
                  <span className="block text-[0.86rem] font-semibold">{t.author}</span>
                  <span className="block text-[0.74rem] text-muted">
                    {t.location ?? "Guest Review"}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
