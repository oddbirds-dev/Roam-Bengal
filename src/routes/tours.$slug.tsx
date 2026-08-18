import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { TourCard, formatPrice } from "@/components/tour-card";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { TourPricing } from "@/components/tour/tour-pricing";
import { BestValueTours } from "@/components/tour/best-value-tours";
import { getTourBySlug, listPublishedTours } from "@/lib/site-content.functions";
import { getSeoMeta } from "@/lib/seo.functions";
import { buildSeoMeta } from "@/lib/seo-head";
import { toTourDTO } from "@/lib/tour-dto";
import { useTourDraft } from "@/lib/tour-preview";
import {
  TOUR_FACT_KEYS,
  TOUR_FACT_META,
  type TourDTO,
  type TourFactKey,
} from "@/lib/content-types";

export const Route = createFileRoute("/tours/$slug")({
  /**
   * `?preview=1` puts the page in admin-preview mode: it takes its content from the
   * editor ver postMessage instead of the database. Nothing else on the site links
   * here with a search param, so anything unrecognised is simply dropped.
   */
  // The router JSON-parses search values, so `?preview=1` arrives as the number 1.
  validateSearch: (search: Record<string, unknown>): { preview?: true } => {
    const raw = search.preview;
    const on = raw === 1 || raw === "1" || raw === true || raw === "true";
    return on ? { preview: true } : {};
  },
  loaderDeps: ({ search }) => ({ preview: search.preview === true }),
  loader: async ({ params, deps }) => {
    const [tour, allTours] = await Promise.all([
      getTourBySlug({ data: { slug: params.slug } }),
      listPublishedTours(),
    ]);
    // A previewed tour is usually a draft, and a brand-new one has no row at all —
    // in preview mode the real content arrives from the parent window, so an empty
    // shell is the correct starting state rather than a 404.
    if (!tour) {
      if (deps.preview) return { tour: blankTour(params.slug), allTours, seoMeta: null };
      throw notFound();
    }

    const seoMeta = await getSeoMeta({ data: { entity_type: "tour", entity_id: tour.id } });

    return { tour, allTours, seoMeta };
  },
  head: ({ loaderData }) => {
    const tour = loaderData?.tour;
    if (!tour) return {};
    
    return buildSeoMeta(loaderData.seoMeta, {
      title: `${tour.title} — Roam Bengal`,
      description: tour.summary ?? "",
      image: tour.heroImage ?? tour.images[0] ?? undefined,
      urlPath: `/tours/${tour.slug}`
    });
  },
  component: TourDetail,
});

const TABS = [
  ["overview", "Overview"],
  ["highlights", "Highlights"],
  ["itinerary", "Itinerary"],
  ["cost", "Cost"],
  ["inclusions", "Inclusions"],
  ["advice", "Advise"],
  ["faq", "FAQs"],
  ["map", "Map"],
  ["video", "Video"],
] as const;

function TourDetail() {
  const { tour: saved, allTours } = Route.useLoaderData();
  const { preview } = Route.useSearch();

  // In preview mode the editor's unsaved form wins over whatever is in the database.
  const draft = useTourDraft(preview === true);
  const tour = draft ?? saved;

  const related = resolveRelated(tour, allTours);
  const bestValuePicks = allTours
    .filter((t) => t.slug !== tour.slug && !related.some((r) => r.slug === t.slug))
    .sort((a, b) => (a.priceUsd ?? Infinity) - (b.priceUsd ?? Infinity));
  const facts = TOUR_FACT_KEYS.map((key) => [key, factValue(tour, key)] as const).filter(
    (entry): entry is readonly [TourFactKey, string] => Boolean(entry[1]),
  );

  // No gallery yet: show the hero image in the main tile rather than leaving every
  // tile blank, mirroring how tour cards fall back to heroImage elsewhere.
  const gallery = tour.images.length ? tour.images : [tour.heroImage, null, null, null];

  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader logo="light" />
      </div>

      {/* Everything between the header and the footer sits on the sand page background. */}
      <div className="bg-sand">
        {/* Gallery mosaic: 1 large + 3.
            The grid gets a fixed height and the tiles fill their tracks, matching
            `.pkg-gallery` in the reference design. Per-tile aspect ratios cannot work
            here: the two rows are equal `1fr`, so the wide top-right tile's ratio would
            set both row heights and the row-spanning big tile would end up twice as tall
            as the column beside it. Ratios still drive the stacked mobile layout. */}
        <div className="wrap grid gap-3 py-6 md:h-[400px] md:grid-cols-4 md:grid-rows-2 lg:h-[440px]">
          <PhotoFrame
            src={gallery[0]}
            alt={`${tour.title} — main photograph`}
            gradient={gradientFor(tour.slug)}
            priority
            placeholderLabel={`images/pkg-${tour.slug}-1.jpg`}
            className="aspect-[16/10] rounded-2xl md:col-span-2 md:row-span-2 md:aspect-auto"
          />
          {[1, 2, 3].map((i) => (
            <PhotoFrame
              key={i}
              src={gallery[i]}
              alt={`${tour.title} — photograph ${i + 1}`}
              gradient={gradientFor(`${tour.slug}-${i}`)}
              placeholderLabel={`images/pkg-${tour.slug}-${i + 1}.jpg`}
              className={`aspect-[4/3] rounded-2xl md:aspect-auto ${i === 1 ? "md:col-span-2" : ""}`}
            />
          ))}
        </div>

        <div className="wrap grid gap-10 pb-20 lg:grid-cols-[1fr_340px]">
          <main id="main" className="min-w-0">
            <nav className="text-[0.78rem] text-muted" aria-label="Breadcrumb">
              <Link to="/" className="hover:text-green">
                Home
              </Link>
              {" / "}
              <Link to="/tours" className="hover:text-green">
                Tours
              </Link>
              {" / "}
              <span className="text-ink">{tour.title}</span>
            </nav>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <h1 className="font-display text-[clamp(1.8rem,4vw,2.7rem)] leading-tight text-green">
                {tour.title}
              </h1>
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-gold text-ink">
                <span className="font-display text-xl leading-none font-bold">
                  {tour.durationDays}
                </span>
                <span className="text-[0.62rem] font-semibold">Days</span>
              </div>
            </div>

            <div className="mt-5 h-px bg-rule" />

            {facts.length ? (
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {facts.map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2.5">
                    <span aria-hidden="true">{TOUR_FACT_META[key].icon}</span>
                    <div>
                      <div className="text-[0.68rem] tracking-wide text-muted uppercase">
                        {TOUR_FACT_META[key].label}
                      </div>
                      <div className="text-[0.86rem] font-semibold text-ink">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="sticky top-0 z-20 -mx-1 mt-8 overflow-x-auto border-y border-rule bg-sand/95 backdrop-blur">
              <div className="flex gap-1 px-1 py-2">
                {TABS.filter(([id]) => hasSection(tour, id)).map(([id, label]) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="rounded-full px-4 py-2 text-[0.8rem] font-medium whitespace-nowrap text-muted hover:bg-mint hover:text-green"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-12">
              {tour.overview.length ? (
                <Section id="overview" title="📜 Trip Overview">
                  {tour.overview.map((p) => (
                      <p key={p} className="text-[0.92rem] leading-7 text-ink/85">
                        <FormatText>{p}</FormatText>
                      </p>
                  ))}
                  {tour.overviewTip ? (
                      <div className="rounded-xl border-l-4 border-gold bg-mint p-4 text-[0.88rem] leading-6">
                        💡 <strong>Good to know:</strong> <FormatText>{tour.overviewTip}</FormatText>
                      </div>
                  ) : null}
                </Section>
              ) : null}

              {tour.highlights.length ? (
                <Section id="highlights" title="⭐ Trip Highlights">
                  <ul className="flex flex-col gap-2.5">
                    {tour.highlights.map((h) => (
                      <li key={h} className="flex gap-3 text-[0.9rem] leading-6">
                        <span className="mt-0.5 text-green-bright">✓</span>
                        <FormatText>{h}</FormatText>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {tour.glance.length ? (
                <Section id="glance" title="📍 Journey at a Glance">
                  <ul className="flex flex-col gap-2.5">
                    {tour.glance.map((g) => (
                      <li key={g.when} className="text-[0.9rem] leading-6">
                        <strong className="text-green-dark">{g.when}</strong> — <FormatText>{g.detail}</FormatText>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {tour.addons.length ? (
                <Section id="addons" title="➕ Optional Add-Ons">
                  <div className="flex flex-col gap-3">
                    {tour.addons.map((a) => (
                      <div
                        key={a.title}
                        className="rounded-xl border border-rule p-4 text-[0.9rem] leading-6"
                      >
                        <span aria-hidden="true">{a.icon}</span>{" "}
                        <strong className="text-green-dark">{a.title}:</strong> <FormatText>{a.detail}</FormatText>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {tour.itinerary.length ? (
                <Section id="itinerary" title="🗺️ Day-by-Day Itinerary">
                  <ol className="flex flex-col gap-6">
                    {tour.itinerary.map((day, i) => (
                      <li key={day.day} className="relative flex gap-4">
                        {i < tour.itinerary.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-10 -bottom-6 left-5 w-0 border-l-2 border-dashed border-green/35"
                          />
                        ) : null}
                        <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green text-[0.95rem] font-bold text-white">
                          {day.day}
                        </span>
                        <div>
                          <h3 className="font-display text-[1.05rem] font-bold text-green-dark">
                            {day.title}
                          </h3>
                          <p className="mt-1.5 text-[0.9rem] leading-7 text-ink/85">
                            <FormatText>{day.detail}</FormatText>
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </Section>
              ) : null}

              {tour.offers.length || (tour.priceUsd !== null && !tour.priceTiers.length) ? (
                <Section
                  id={tour.priceTiers.length ? "offers" : "cost"}
                  title="💵 Tour Price & Offers"
                >
                  {tour.priceUsd !== null && !tour.priceTiers.length ? (
                    <p className="text-[0.92rem] leading-7">
                      <strong className="text-green-dark">
                        From {formatPrice(tour.priceUsd)} per person
                      </strong>
                      {tour.priceNote ? ` ${tour.priceNote}.` : "."} Larger groups reduce the
                      per-person rate — message us for a group quote.
                    </p>
                  ) : null}
                  {tour.offers.length ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      {tour.offers.map((offer) => (
                        <div
                          key={offer.title}
                          className="rounded-xl border border-rule bg-cream p-5"
                        >
                          <h4 className="font-display text-[0.98rem] font-bold text-green-dark">
                            {offer.title}
                          </h4>
                          <ul className="mt-3 flex flex-col gap-2 text-[0.82rem] leading-6 text-muted">
                            {offer.items.map((i) => (
                              <li key={i}>• <FormatText>{i}</FormatText></li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Section>
              ) : null}

              {/* Price tiers, promises and the booking CTA. Renders nothing until a tour
                  has tiers, so the prose fallback above still covers older tours. */}
              <TourPricing tour={tour} />

              {tour.inclusions.length || tour.exclusions.length ? (
                <Section id="inclusions" title="🛑 What's Included">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="rounded-xl border border-green-bright/40 bg-mint p-5">
                      <h3 className="font-display text-[0.98rem] font-bold text-green-dark">
                        ✅ Included
                      </h3>
                      <ul className="mt-3 flex flex-col gap-2 text-[0.86rem] leading-6">
                        {tour.inclusions.map((i) => (
                          <li key={i}>• <FormatText>{i}</FormatText></li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl border border-rust/30 bg-rust/5 p-5">
                      <h3 className="font-display text-[0.98rem] font-bold text-rust">
                        ❌ Not Included
                      </h3>
                      <ul className="mt-3 flex flex-col gap-2 text-[0.86rem] leading-6">
                        {tour.exclusions.map((i) => (
                          <li key={i}>• <FormatText>{i}</FormatText></li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Section>
              ) : null}

              {tour.accessibility.length ? (
                <Section id="accessibility" title="♿ Accessibility & Special Requests">
                  <ul className="flex flex-col gap-2.5 rounded-xl bg-cream p-5">
                    {tour.accessibility.map((a) => (
                      <li key={a.label} className="text-[0.88rem] leading-6">
                        <strong className="text-green-dark">{a.label}:</strong> <FormatText>{a.detail}</FormatText>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {tour.advice.length ? (
                <Section id="advice" title="🎯 Trip Advice & Responsibilities">
                  <div className="flex flex-col gap-5">
                    {tour.advice.map((block) => (
                      <div key={block.title} className="rounded-xl border border-rule p-5">
                        <h3 className="font-display text-[0.98rem] font-bold text-green-dark">
                          {block.title}
                        </h3>
                        <ul className="mt-3 flex flex-col gap-2 text-[0.86rem] leading-6">
                          {block.items.map((i) => (
                            <li key={i}>• <FormatText>{i}</FormatText></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {tour.pledge.length ? (
                <Section id="pledge" title="🌍 Responsible Travel Pledge">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tour.pledge.map((p) => (
                      <div
                        key={p}
                        className="rounded-xl bg-mint p-4 text-[0.86rem] leading-6"
                      >
                        {p}
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}

              {tour.faqs.length ? (
                <Section id="faq" title="❓ Frequently Asked Questions">
                  <div className="flex flex-col gap-3">
                    {tour.faqs.map((faq) => (
                      <details
                        key={faq.question}
                        className="group rounded-xl border border-rule p-5"
                      >
                        <summary className="cursor-pointer list-none font-display text-[0.98rem] font-bold text-green-dark">
                          {faq.question}
                        </summary>
                        <p className="mt-3 text-[0.88rem] leading-7 text-ink/85">
                          <FormatText>{faq.answer}</FormatText>
                        </p>
                      </details>
                    ))}
                  </div>
                </Section>
              ) : null}

              {tour.mapEmbed ? (
                <Section id="map" title="🗺️ Tour Map">
                  <div className="aspect-video overflow-hidden rounded-xl border border-rule">
                    <iframe
                      src={tour.mapEmbed}
                      title={`${tour.title} route map`}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </Section>
              ) : null}

              {tour.videoUrl ? (
                <Section id="video" title="📽️ Tour Video">
                  <div className="aspect-video overflow-hidden rounded-xl border border-rule">
                    <iframe
                      src={tour.videoUrl}
                      title={`${tour.title} video`}
                      className="h-full w-full"
                      loading="lazy"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </Section>
              ) : null}

              {tour.whyItems.length ? (
                <Section id="why-tour" title="🌟 Why Choose Roam Bengal for This Tour">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {tour.whyItems.map((w) => (
                      <div
                        key={w}
                        className="rounded-xl border border-rule p-4 text-[0.86rem] leading-6"
                      >
                        {w}
                      </div>
                    ))}
                  </div>
                </Section>
              ) : null}
            </div>
          </main>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <div className="rounded-2xl border border-rule bg-cream p-6 shadow-sm">
              <div className="text-[0.72rem] tracking-wide text-muted uppercase">
                Tour Cost
              </div>
              <div className="mt-1 font-display text-[2rem] leading-none font-bold text-green">
                {formatPrice(tour.discountPriceUsd ?? tour.priceUsd)}
                <span className="ml-1 text-[0.78rem] font-normal text-muted">
                  / Adult* From
                </span>
              </div>

              {tour.childPriceUsd !== null ? (
                <div className="mt-2 text-[0.86rem] font-semibold text-ink">
                  {formatPrice(tour.discountChildPriceUsd ?? tour.childPriceUsd)}
                  <span className="ml-1 text-[0.75rem] font-normal text-muted">/ Child</span>
                </div>
              ) : null}

              {tour.priceBdt !== null ? (
                <div className="mt-1.5 text-[0.78rem] text-muted">
                  ৳{tour.priceBdt.toLocaleString("en-BD")} for Bangladeshi nationals
                </div>
              ) : null}

              <ul className="mt-5 flex flex-col gap-2.5 text-[0.82rem] leading-5">
                {PROMISES.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-green-bright">✓</span>
                    <strong className="font-semibold text-ink">{p}</strong>
                  </li>
                ))}
              </ul>

              <ButtonLink
                to="/contact"
                variant="ember"
                className="mt-6 w-full"
                search={{ tour: tour.slug }}
              >
                Book Now
              </ButtonLink>
            </div>

            {bestValuePicks.length ? (
              <div className="mt-6">
                <BestValueTours tours={bestValuePicks} />
              </div>
            ) : null}
          </aside>
        </div>

        {related.length ? (
          <section className="bg-cream py-16">
            <div className="wrap">
              <h2 className="mb-8 font-display text-[1.6rem] text-green">
                You Might Also Like
              </h2>
              <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <TourCard key={r.id} tour={r} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

const PROMISES = [
  "100% Exclusive Private Tours",
  "Fully Flexible & Customisable",
  "Transparent Pricing Promise",
  "Expert, Knowledgeable Guides",
  "No Shopping Detours, Ever",
  "Direct Booking Savings",
];

/** Empty shell for preview mode, replaced the moment the editor's draft arrives. */
function blankTour(slug: string): TourDTO {
  return toTourDTO({ slug, title: "Untitled tour" });
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 font-display text-[1.35rem] text-green">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function hasSection(tour: TourDTO, id: string): boolean {
  switch (id) {
    case "overview":
      return tour.overview.length > 0;
    case "highlights":
      return tour.highlights.length > 0;
    case "itinerary":
      return tour.itinerary.length > 0;
    // `#cost` is the pricing block when tiers exist, and the older price/offers prose
    // otherwise — either way the tab has somewhere to scroll to.
    case "cost":
      return (
        tour.priceTiers.length > 0 || tour.offers.length > 0 || tour.priceUsd !== null
      );
    case "inclusions":
      return tour.inclusions.length > 0 || tour.exclusions.length > 0;
    case "advice":
      return tour.advice.length > 0;
    case "faq":
      return tour.faqs.length > 0;
    case "map":
      return Boolean(tour.mapEmbed);
    case "video":
      return Boolean(tour.videoUrl);
    default:
      return false;
  }
}

/**
 * Facts fall back to values derived from other columns, so a tour with an empty `facts`
 * object still renders a useful grid rather than nothing.
 */
function factValue(tour: TourDTO, key: TourFactKey): string | undefined {
  const stored = tour.facts[key];
  if (stored) return stored;
  switch (key) {
    case "tour_type":
      return tour.activityLabel ?? undefined;
    case "departure":
    case "arrival":
      return tour.destinationLabel ?? undefined;
    case "group_size":
      return tour.groupSizeMax ? `Up to ${tour.groupSizeMax}` : undefined;
    case "accommodation":
      return tour.category === "day-tour" ? "Not required" : undefined;
    default:
      return undefined;
  }
}

/** Explicit `related_slugs` win; otherwise fall back to other tours, nearest first. */
function resolveRelated(tour: TourDTO, all: TourDTO[]): TourDTO[] {
  const others = all.filter((t) => t.slug !== tour.slug);
  if (tour.relatedSlugs.length) {
    const picked = tour.relatedSlugs
      .map((slug) => others.find((t) => t.slug === slug))
      .filter((t): t is TourDTO => Boolean(t));
    if (picked.length) return picked.slice(0, 3);
  }
  return others.slice(0, 3);
}
