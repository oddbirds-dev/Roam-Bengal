import { useSiteSettings } from "@/hooks/use-site-settings";
import { TourCard } from "@/components/tour-card";
import { SectionHead } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import toursBg from "@/assets/a.jpg.jpeg";
import { SECTION_SEAM, TOUR_FRAMES } from "./palette";
import type { HomeSectionProps } from "./registry";

export function PopularToursSection({ tours }: HomeSectionProps) {
  const { homepage } = useSiteSettings();
  const featuredTours = [...tours]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 3);

  return (
    <section id="packages" className="shell relative overflow-hidden pt-20 pb-[60px] text-center">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${homepage.popular_bg_image || toursBg})`, opacity: 1 }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/60" />

      {/* Seams into the neighbouring bands — the cream feature strip above, the white
          gallery below — where the torn paper edges used to be. */}
      <div
        aria-hidden
        className="home-section-seam pointer-events-none absolute inset-x-0 top-0 z-[5] h-[6px]"
        style={{ background: SECTION_SEAM }}
      />
      <div
        aria-hidden
        className="home-section-seam pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[6px]"
        style={{ background: SECTION_SEAM }}
      />

      <div className="relative z-10">
        <SectionHead kicker={homepage.popular_kicker} className="[&>h2]:text-white">
          {homepage.popular_heading}
        </SectionHead>

        <div className="wide grid gap-[26px] text-left nav:grid-cols-3">
          {featuredTours.map((tour, i) => (
            <TourCard key={tour.id} tour={tour} gradientCss={TOUR_FRAMES[i % 3]} />
          ))}
        </div>

        <div className="mt-11 mb-[90px]">
          <ButtonLink to="/tours" variant="outline-light">
            View All Tours →
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
