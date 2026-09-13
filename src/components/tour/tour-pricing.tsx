import { ButtonLink } from "@/components/ui/button";
import { FormatText } from "@/components/ui/format-text";
import { FeatureIcon } from "@/components/art/icons";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { formatPrice } from "@/components/tour-card";
import type { PriceTier, TourDTO } from "@/lib/content-types";

/**
 * "Choose Your Perfect Experience" — the per-group-size price cards, the promises panel
 * and the booking call to action.
 *
 * The rates come from `tour.price_tiers` (per tour); every word around them comes from
 * the `tour_pricing` site setting, because it is policy copy that has to read the same on
 * every tour. The whole block hides when a tour has no tiers.
 */

/**
 * One accent per card, cycled in order. All four are existing `@theme` tokens — the
 * mockup's blue and purple have no place in this palette, so the sequence runs
 * green → teal → brown → orange and keeps the same "each tier is visually distinct"
 * effect without importing colours the rest of the site never uses.
 */
const ACCENTS = [
  {
    ring: "border-green ring-1 ring-green/25",
    surface: "bg-mint/45",
    iconBg: "bg-mint",
    iconText: "text-green",
    numberBg: "bg-green",
    price: "text-green",
    noteBg: "bg-mint",
    noteText: "text-green-dark",
    ribbon: "bg-green",
  },
  {
    ring: "border-rule",
    surface: "bg-paper",
    iconBg: "bg-teal/20",
    iconText: "text-teal",
    numberBg: "bg-teal",
    price: "text-teal",
    noteBg: "bg-teal/15",
    noteText: "text-teal-dark",
    ribbon: "bg-teal",
  },
  {
    ring: "border-rule",
    surface: "bg-paper",
    iconBg: "bg-brown/20",
    iconText: "text-brown",
    numberBg: "bg-brown",
    price: "text-brown",
    noteBg: "bg-brown/15",
    noteText: "text-brown-dark",
    ribbon: "bg-brown",
  },
  {
    ring: "border-rule",
    surface: "bg-paper",
    iconBg: "bg-orange/20",
    iconText: "text-orange",
    numberBg: "bg-orange",
    price: "text-orange",
    noteBg: "bg-orange/15",
    noteText: "text-rust",
    ribbon: "bg-orange",
  },
] as const;

/**
 * Just the per-group-size price cards. Rendered inside {@link TourPricing} on the
 * main column and also in the booking sidebar (above the "Book Now" button), so it
 * lives in its own component. Returns nothing when the tour has no tiers.
 */
export function PriceTierCards({
  tour,
  className = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
  compact = false,
}: {
  tour: TourDTO;
  className?: string;
  compact?: boolean;
}) {
  const { tour_pricing: copy } = useSiteSettings();
  const tiers = tour.priceTiers.filter((t) => t.label || t.price !== null);

  if (!tiers.length) return null;

  return (
    <ul className={className}>
      {tiers.map((tier, i) => (
        <TierCard
          key={`${tier.label}-${i}`}
          tier={tier}
          index={i}
          perPersonLabel={copy.per_person_label}
          compact={compact}
        />
      ))}
    </ul>
  );
}

export function TourPricing({ tour }: { tour: TourDTO }) {
  const { tour_pricing: copy } = useSiteSettings();
  const tiers = tour.priceTiers.filter((t) => t.label || t.price !== null);

  if (!tiers.length) return null;

  return (
    <section id="cost" className="scroll-mt-24">
      <div className="rounded-2xl border border-rule bg-sand/60 p-6 md:p-8">
        <header className="text-center">
          {copy.eyebrow ? (
            <span className="inline-block rounded-full bg-mint px-4 py-1.5 text-[0.68rem] font-bold tracking-[0.14em] text-green uppercase">
              {copy.eyebrow}
            </span>
          ) : null}
          <h2 className="mt-4 font-display text-[clamp(1.5rem,3vw,2.1rem)] leading-tight font-bold text-green-dark">
            {copy.heading}
          </h2>
          {copy.subhead ? (
            <p className="mt-2 text-center text-[0.92rem] text-muted"><FormatText>{copy.subhead}</FormatText></p>
          ) : null}
          {/* Reference ornament: rule, dot, rule. */}
          <span aria-hidden="true" className="mt-5 flex items-center justify-center gap-2">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-green/40" />
            <span className="h-1.5 w-1.5 rounded-full bg-green" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-green/40" />
          </span>
        </header>

        {copy.promises.length ? (
          <div className="mt-8 rounded-2xl border border-rule bg-paper p-5 md:p-6">
            {copy.promises_heading ? (
              <h3 className="mb-5 flex items-center gap-3 font-display text-[1.05rem] font-bold text-green-dark">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green">
                  <FeatureIcon name="plane" />
                </span>
                {copy.promises_heading}
              </h3>
            ) : null}

            <div className="flex flex-col gap-3">
              {copy.promises.map((promise, i) => (
                <div
                  key={`${promise.title}-${i}`}
                  className="grid gap-3 rounded-xl border border-rule bg-cream/50 p-4 sm:grid-cols-[220px_1fr] sm:gap-5"
                >
                  <h4 className="flex items-start gap-3 font-display text-[0.95rem] font-bold text-green-dark">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        PROMISE_TONES[i % PROMISE_TONES.length]
                      }`}
                    >
                      <FeatureIcon name={promise.icon ?? "shield"} />
                    </span>
                    <span className="mt-1.5">{promise.title}</span>
                  </h4>
                  <ul className="flex flex-col gap-1.5 text-[0.86rem] leading-6">
                    {promise.items.map((item, j) => (
                      <li key={j} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-green" />
                        <span>
                          <FormatText>{item}</FormatText>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </section>
  );
}

export function TourBookingCta({ tour }: { tour: TourDTO }) {
  const { tour_pricing: copy } = useSiteSettings();

  return (
    <div className="rounded-2xl border border-rule bg-sand/60 p-2 md:p-3">
      <div className="relative overflow-hidden rounded-2xl bg-green-dark px-6 py-8 text-center">
        <FlightPathDoodle />
        <div className="relative">
          <h3 className="font-display text-[clamp(1.15rem,2.4vw,1.5rem)] font-bold text-white">
            {copy.cta_heading}
          </h3>
          <ButtonLink
            to="/contact"
            variant="ember"
            search={{ tour: tour.slug }}
            className="mt-5 w-full sm:w-auto sm:min-w-[320px]"
          >
            {copy.cta_label} →
          </ButtonLink>
          {copy.cta_footnote ? (
            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[0.8rem] text-white/75">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="shrink-0"
              >
                <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" />
              </svg>
              {copy.cta_footnote}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
/** Circle colours for the promise icons, matching the card accents. */
const PROMISE_TONES = ["bg-green", "bg-teal", "bg-orange"] as const;

function TierCard({
  tier,
  index,
  perPersonLabel,
  compact = false,
}: {
  tier: PriceTier;
  index: number;
  perPersonLabel: string;
  compact?: boolean;
}) {
  const accent = ACCENTS[index % ACCENTS.length]!;
  const people = tier.persons;

  return (
    <li
      className={`relative flex flex-col items-center overflow-hidden border text-center ${
        compact ? "rounded-xl p-2.5" : "rounded-2xl p-5"
      } ${accent.ring} ${accent.surface}`}
    >
      {tier.badge ? (
        // Diagonal corner ribbon, as in the reference.
        <span
          className={`absolute -top-px -right-px rotate-45 font-bold tracking-[0.1em] text-white uppercase ${
            compact
              ? "w-[100px] translate-x-[26px] translate-y-[20px] py-0.5 text-[0.5rem]"
              : "w-[132px] translate-x-[34px] translate-y-[26px] py-1 text-[0.6rem]"
          } ${accent.ribbon}`}
        >
          {tier.badge}
        </span>
      ) : null}

      <span
        className={`flex items-center justify-center rounded-full ${
          compact ? "h-8 w-8" : "h-14 w-14"
        } ${accent.iconBg} ${accent.iconText}`}
      >
        <GroupGlyph solo={people === 1} compact={compact} />
      </span>

      <span
        className={`flex items-center justify-center rounded-full font-bold text-white ${
          compact
            ? "-mt-2 h-5 min-w-5 px-1.5 text-[0.62rem]"
            : "-mt-3 h-6 min-w-6 px-2 text-[0.72rem]"
        } ${accent.numberBg}`}
      >
        {index + 1}
      </span>

      <h3
        className={`font-display font-bold text-ink ${
          compact ? "mt-1 text-[0.8rem] leading-tight" : "mt-2.5 text-[1rem]"
        }`}
      >
        {tier.label}
      </h3>
      {people !== null ? (
        <p
          className={`text-center text-muted ${
            compact ? "mt-0.5 text-[0.7rem]" : "mt-1 text-[0.82rem]"
          }`}
        >
          {people} {people === 1 ? "person" : "persons"}
        </p>
      ) : null}

      <p
        className={`text-center font-display leading-none font-bold ${
          compact ? "mt-1.5 text-[1.05rem]" : "mt-3 text-[2rem]"
        } ${accent.price}`}
      >
        {formatPrice(tier.price)}
      </p>
      {perPersonLabel ? (
        <p
          className={`text-center text-muted ${
            compact ? "mt-0.5 text-[0.62rem]" : "mt-1.5 text-[0.76rem]"
          }`}
        >
          {perPersonLabel}
        </p>
      ) : null}

      {tier.note ? (
        <p
          className={`w-full text-center font-medium ${
            compact
              ? "mt-1.5 rounded-md px-1.5 py-1 text-[0.62rem] leading-tight"
              : "mt-4 rounded-lg px-3 py-1.5 text-[0.74rem]"
          } ${accent.noteBg} ${accent.noteText}`}
        >
          {tier.note}
        </p>
      ) : null}
    </li>
  );
}

/** One silhouette for a solo traveller, two for a group. */
function GroupGlyph({ solo, compact = false }: { solo: boolean; compact?: boolean }) {
  return (
    <svg
      width={compact ? "16" : "26"}
      height={compact ? "16" : "26"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {solo ? (
        <>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5.5 19.5c1.2-3.3 3.9-4.8 6.5-4.8s5.3 1.5 6.5 4.8" />
        </>
      ) : (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 19.4c1.1-3.1 3.6-4.5 6-4.5s4.9 1.4 6 4.5" />
          <path d="M16.2 5.1a3.2 3.2 0 0 1 0 5.9M17.4 15.2c1.6.6 2.9 1.9 3.6 4.2" />
        </>
      )}
    </svg>
  );
}

/** Dashed flight path + plane, echoing the reference banner's corner doodle. */
function FlightPathDoodle() {
  return (
    <svg
      className="pointer-events-none absolute -right-2 -bottom-4 h-28 w-40 text-white/15"
      viewBox="0 0 160 112"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 90C40 80 70 95 100 70S150 20 156 8" strokeDasharray="4 6" strokeLinecap="round" />
      <path
        d="M156 8l-13 2 4 5 9-7Zm0 0l-2 13-5-4 7-9Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
