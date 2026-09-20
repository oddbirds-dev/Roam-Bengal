import { useSiteSettings } from "@/hooks/use-site-settings";
import { TourCard } from "@/components/tour-card";
import { SectionHead } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { TOUR_FRAMES } from "./palette";
import type { HomeSectionProps } from "./registry";

/**
 * Holiday shelf: the same card grid as the Popular Tours band, but filtered to
 * `category: "holiday"` and on the light cream background, so the two tour bands don't
 * stack as two identical dark photo panels.
 */
export function HolidayToursSection({ tours }: Pick<HomeSectionProps, "tours">) {
  const { homepage } = useSiteSettings();
  const holidayTours = tours
    .filter((tour) => tour.category === "holiday" && tour.isFeatured)
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 3);
return (
    <section id="holiday-tours" className="shell pt-20 pb-[30px] text-center">
      <SectionHead kicker={homepage.holiday_kicker}>{homepage.holiday_heading}</SectionHead>

      {holidayTours.length ? (
        <div className="wide grid gap-[26px] text-left nav:grid-cols-3">
          {holidayTours.map((tour, i) => (
            <TourCard key={tour.id} tour={tour} gradientCss={TOUR_FRAMES[i % 3]} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-2xl rounded-2xl border border-rule bg-cream px-8 py-10 text-center">
          <h3 className="font-display text-2xl font-bold text-ink">Holiday Tour</h3>
          <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-7 text-ink">Explore Bangladesh at a slower pace with thoughtfully planned journeys, local guides, and memorable stays.</p>
        </div>
      )}

      <div className="mt-11 mb-[90px]">
        <ButtonLink to="/tours" search={{ category: "holiday" }} variant="outline-dark">
          View All Holiday Tours →
        </ButtonLink>
      </div>
    </section>
  );
}
