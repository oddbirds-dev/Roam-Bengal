import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { TourCard } from "@/components/tour-card";
import { SectionHead, Eyebrow } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  listPublishedPosts,
  listPublishedTestimonials,
  listPublishedTours,
} from "@/lib/site-content.functions";
import { FeatureIcon, WhyIcon } from "@/components/art/icons";
import { DhakaScene } from "@/components/art/dhaka-scene";

export const Route = createFileRoute("/")({
  // Parallel, not sequential — four round trips in series is four times the latency.
  loader: async () => {
    const [tours, testimonials, posts] = await Promise.all([
      listPublishedTours(),
      listPublishedTestimonials(),
      listPublishedPosts(),
    ]);
    return { tours, testimonials, posts };
  },
  component: Home,
});

/* Gradients the reference sets inline or per-nth-child, kept verbatim. */
const HERO_BG =
  "linear-gradient(160deg, #7A2408 0%, #C4390E 35%, #F0791E 65%, #F2B705 100%)";
const HERO_OVERLAY =
  "linear-gradient(180deg, rgba(10,20,15,0.55) 0%, rgba(10,20,15,0.15) 45%, rgba(10,20,15,0.7) 100%)";
const FEATURE_BG = "linear-gradient(120deg,#FCEFD9,#F7E2C0)";
const TOURS_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
const STORY_BG = "linear-gradient(120deg,#FDF0E4,#EAF4EC)";
const DREAM_BG = "linear-gradient(120deg,#EAF4EC,#FDF0E4)";
const REVIEWS_BG = "linear-gradient(160deg,#0B2818,#123D26 55%,#0B2818)";
const REVIEWS_BLOBS = [
  "radial-gradient(ellipse 420px 300px at 12% 15%, #22B57A, transparent 70%)",
  "radial-gradient(ellipse 380px 320px at 90% 10%, #F2B705, transparent 70%)",
  "radial-gradient(ellipse 400px 340px at 85% 90%, #C4390E, transparent 70%)",
  "radial-gradient(ellipse 320px 300px at 8% 90%, #D9450F, transparent 70%)",
].join(",");
const REVIEWS_MAP_MASK = [
  "radial-gradient(ellipse 70% 60% at 20% 20%, black 40%, transparent 75%)",
  "radial-gradient(ellipse 60% 50% at 80% 15%, black 40%, transparent 75%)",
  "radial-gradient(ellipse 55% 60% at 75% 75%, black 40%, transparent 75%)",
  "radial-gradient(ellipse 40% 40% at 10% 80%, black 40%, transparent 75%)",
].join(",");

const TOUR_FRAMES = [
  "linear-gradient(160deg,#F0791E,#C43B0E)",
  "linear-gradient(160deg,#22B57A,#0B6B47)",
  "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
];
const GALLERY_FRAMES = [
  "linear-gradient(160deg,#3E7A6E,#123D30)",
  "linear-gradient(160deg,#C4390E,#7A2408)",
  "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
  "linear-gradient(160deg,#F0791E,#C43B0E)",
];
const BLOG_FRAMES = [
  "linear-gradient(160deg,#F0791E,#C43B0E)",
  "linear-gradient(160deg,#22B57A,#0B6B47)",
  "linear-gradient(160deg,#C4390E,#7A2408)",
];
/** The rating mark under each platform name, per `.pb-dots` / `.pb-star` / `.pb-square`. */
const PLATFORM_MARKS = [
  { glyph: "●●●●●", colour: "#00A870" },
  { glyph: "★", colour: "#F2B705" },
  { glyph: "■", colour: "#00B67A" },
  { glyph: "★", colour: "#D9450F" },
];
const AVATAR_FRAMES = [
  "linear-gradient(150deg,#22B57A,#0B6B47)",
  "linear-gradient(150deg,#C4390E,#5C1C05)",
  "linear-gradient(150deg,#D9450F,#7A2408)",
];

function Home() {
  const { tours, testimonials, posts } = Route.useLoaderData();
  const settings = useSiteSettings();
  const { hero, homepage, gallery, reviews } = settings;

  const featuredTours = [...tours]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 3);
  const featuredReviews = testimonials.filter((t) => t.isFeatured).slice(0, 3);
  const homeReviews = featuredReviews.length ? featuredReviews : testimonials.slice(0, 3);
  const journalPosts = posts.slice(0, 3);

  return (
    <>
      {/* 1 — Hero */}
      <div
        className="relative min-h-[640px] overflow-hidden text-white"
        style={{ background: HERO_BG }}
      >
        <PhotoFrame
          src={hero.background_url}
          alt={hero.background_alt}
          gradientCss="transparent"
          priority
          className="absolute inset-0 z-0 h-full w-full"
          placeholderLabel="images/hero-boat.png"
        />
        <div className="absolute inset-0 z-[1]" style={{ background: HERO_OVERLAY }} />

        <SiteHeader />

        <main id="main" className="wrap relative z-[4] pt-[60px]">
          <span className="block font-script text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight font-bold -mb-1.5 text-gold">
            {hero.script}
          </span>
          <h1 className="mt-0.5 mb-[18px] font-marker text-[clamp(2.4rem,5.6vw,4.1rem)] leading-[1.08] font-normal tracking-[0.01em] [text-shadow:0_4px_24px_rgba(0,0,0,0.3)]">
            {hero.headline}
          </h1>
          <p className="mb-[30px] max-w-[480px] text-[1.02rem] opacity-[0.92]">
            {hero.subtext}
          </p>
          <div className="mb-14 flex flex-wrap gap-3.5">
            <ButtonLink to={hero.primary_link} variant="green">
              {hero.primary_label}
            </ButtonLink>
            {hero.secondary_label ? (
              <ButtonLink to={hero.secondary_link || "/tours"} variant="outline-light">
                {hero.secondary_label}
              </ButtonLink>
            ) : null}
          </div>
        </main>
      </div>

      {/* 2 — Feature strip */}
      <section
        className="shell pt-[70px] pb-[60px] nav:pt-[60px]"
        style={{ background: FEATURE_BG }}
      >
        <div className="wide grid grid-cols-3 gap-6 nav:grid-cols-6 nav:gap-2.5">
          {homepage.features.map((f) => (
            <div key={f.title} className="text-center">
              <span className="mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-orange text-white">
                <FeatureIcon name={f.icon} />
              </span>
              <h4 className="mb-1 font-body text-[0.85rem] font-semibold">{f.title}</h4>
              <p className="text-[0.72rem] text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — Popular tours */}
      <section
        id="packages"
        className="shell pt-20 pb-[60px] text-center"
        style={{ background: TOURS_BG }}
      >
        <SectionHead kicker={homepage.popular_kicker}>
          {homepage.popular_heading}
        </SectionHead>

        <div className="wide grid gap-[26px] text-left nav:grid-cols-3">
          {featuredTours.map((tour, i) => (
            <TourCard key={tour.id} tour={tour} gradientCss={TOUR_FRAMES[i % 3]} />
          ))}
        </div>

        <div className="mt-11 mb-[90px]">
          <ButtonLink to="/tours" variant="outline-dark">
            View All Tours →
          </ButtonLink>
        </div>
      </section>

      {/* 4 — Gallery */}
      <section className="pt-5 pb-[90px]">
        <div className="wrap mb-9 flex flex-wrap items-end justify-between gap-[30px]">
          <div>
            <h2 className="mb-3.5 font-kalam text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.3] font-bold">
              <span className="text-green">{gallery.heading_1}</span>
              <br />
              <span className="text-gold">{gallery.heading_2}</span>
            </h2>
            <p className="max-w-[520px] text-[0.92rem] text-muted">{gallery.blurb}</p>
            <p className="mt-2 max-w-[520px] text-[0.92rem] font-bold text-ink">
              {gallery.bold}
            </p>
          </div>
          <ButtonLink to={gallery.cta_link} variant="green-dark" className="whitespace-nowrap">
            {gallery.cta_label}
          </ButtonLink>
        </div>

        <div className="wrap grid grid-cols-2 gap-[18px] nav:grid-cols-4">
          {gallery.photos.map((photo, i) => (
            <PhotoFrame
              key={photo.tag}
              src={photo.image_url}
              alt={photo.tag}
              gradientCss={GALLERY_FRAMES[i % GALLERY_FRAMES.length]}
              placeholderLabel={photo.tag}
              className="group aspect-square rounded-[14px] transition-transform duration-300 hover:-translate-y-1.5"
            >
              <span className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent from-55% to-black/55" />
              <span className="absolute bottom-0 left-0 z-[3] p-3.5 text-[0.78rem] font-semibold text-white">
                {photo.tag}
              </span>
            </PhotoFrame>
          ))}
        </div>
      </section>

      {/* 5 — Why travellers keep faith */}
      <section className="pt-[100px] pb-[90px]">
        <div className="wrap grid items-center gap-10 nav:grid-cols-[0.85fr_1.15fr] nav:gap-[70px]">
          <div className="relative mx-auto min-h-[340px] w-full max-w-[340px] nav:mx-0 nav:min-h-[440px] nav:max-w-none">
            <div className="absolute -top-5 -left-[30px] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle,rgba(34,181,122,0.18),transparent_70%)]" />
            <PhotoFrame
              src=""
              alt="Bird native to the Sundarbans wetlands"
              gradientCss="linear-gradient(150deg,#3E7A6E,#123D30)"
              placeholderLabel="images/wildlife-1.jpg"
              className="absolute top-0 left-0 z-[1] aspect-[4/4.6] w-[78%] rotate-[-3deg] rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
            />
            <PhotoFrame
              src=""
              alt="Royal Bengal tiger in the Sundarbans"
              gradientCss="linear-gradient(150deg,#F0791E,#8C3D0C)"
              placeholderLabel="images/wildlife-2.jpg"
              className="absolute right-0 -bottom-[30px] z-[2] aspect-[4/4.6] w-[60%] rotate-[3deg] rounded-[22px] shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
            />
            <span className="absolute top-3.5 -right-1.5 z-[3] rounded-[20px] bg-paper px-3 py-1.5 text-[0.72rem] font-bold text-ink shadow-[0_6px_14px_rgba(0,0,0,0.15)]">
              {homepage.faith_pin}
            </span>
          </div>

          <div>
            <Eyebrow className="text-left">{homepage.faith_kicker}</Eyebrow>
            <h2 className="mt-2 mb-[22px] font-kalam text-[clamp(1.9rem,3.2vw,2.5rem)] leading-[1.3] font-bold text-green">
              {homepage.faith_heading_1}
              <br />
              <span className="text-orange">{homepage.faith_heading_2}</span>
            </h2>

            <ul className="mb-[30px] flex flex-col gap-3">
              {homepage.faith_list.map((item) => (
                <li
                  key={item}
                  className="relative pl-[26px] text-[0.92rem] leading-[1.5] text-ink"
                >
                  <span className="absolute top-px left-0 font-bold text-green">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            {homepage.faith_callouts.map((c) => (
              <div key={c.lead} className="mb-[18px] flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-[1.1rem] font-bold text-gold">→</span>
                <p className="text-[0.88rem] leading-[1.6] text-muted">
                  <strong className="text-ink">{c.lead}</strong> {c.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Journal */}
      <section id="blog" className="shell pt-20 pb-[30px] text-center">
        <SectionHead kicker={homepage.journal_kicker}>
          {homepage.journal_heading}
        </SectionHead>

        <div className="wide grid gap-[26px] nav:grid-cols-3">
          {journalPosts.map((post, i) => (
            <Link
              key={post.id}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="overflow-hidden rounded-[18px] bg-paper pb-[26px] shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-[250ms] hover:-translate-y-1.5"
            >
              <PhotoFrame
                src={post.coverImage}
                alt={post.title}
                gradientCss={BLOG_FRAMES[i % BLOG_FRAMES.length]}
                placeholderLabel={`images/blog-${post.slug}.jpg`}
                className="mb-5 aspect-[4/3] w-full"
              />
              <h3 className="mx-[22px] mb-3.5 font-display text-[1.15rem] leading-[1.3] font-bold text-green">
                {post.title}
              </h3>
              {post.excerpt ? (
                <p className="mx-[22px] mb-5 line-clamp-3 text-[0.85rem] leading-[1.6] text-muted">
                  {post.excerpt}
                </p>
              ) : null}
              <div className="mx-[22px] flex items-center justify-between border-t border-dashed border-[#E4E4E4] pt-4">
                <span className="border-b-2 border-green pb-0.5 text-[0.85rem] font-semibold text-green">
                  Read More
                </span>
                <span className="text-[0.76rem] text-muted">
                  📅 {post.readTime ?? post.dateLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-11 mb-[90px]">
          <ButtonLink to="/blog" variant="outline-dark">
            View All Articles →
          </ButtonLink>
        </div>
      </section>

      {/* 7 — Reviews */}
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
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.5) 1.6px, transparent 1.8px)",
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
                    <span
                      className="text-[0.7rem] tracking-[1px]"
                      style={{ color: mark.colour }}
                    >
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
                    <span className="block text-[0.9rem] font-bold text-white">
                      {t.author}
                    </span>
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
                  i === 0
                    ? "h-2 w-[22px] rounded-[5px] bg-gold"
                    : "h-2 w-2 rounded-full bg-white/30"
                }
              />
            ))}
          </div>

          <ButtonLink to={homepage.reviews_cta_link} variant="blue">
            {homepage.reviews_cta_label}
          </ButtonLink>
        </div>
      </section>

      {/* 8 — Why you choose our company */}
      <section className="py-[90px]" style={{ background: STORY_BG }}>
        <div className="wrap grid items-center gap-10 nav:grid-cols-2 nav:gap-[60px]">
          <div>
            <h2 className="mb-[18px] font-display text-[clamp(2rem,3.6vw,2.7rem)] leading-[1.15] font-bold text-ink">
              Why You Choose <span className="text-orange">Our Company</span>
            </h2>
            <p className="mb-[30px] max-w-[480px] text-[0.95rem] text-muted">
              {homepage.why_intro}
            </p>
            <div className="flex flex-col gap-[26px]">
              {homepage.why_items.map((item) => (
                <div key={item.title} className="flex items-start gap-[18px]">
                  <WhyIcon name={item.icon} />
                  <div>
                    <h3 className="mb-1 font-display text-[1.1rem] font-bold text-ink">
                      {item.title}
                    </h3>
                    <p className="max-w-[420px] text-[0.86rem] text-muted">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PhotoFrame
            src=""
            alt="Traveller hiking a forest trail in Bangladesh"
            gradientCss="linear-gradient(150deg,#22B57A,#F2B705 60%,#C4390E)"
            placeholderLabel="images/why-choose-us.jpg"
            className="order-first aspect-[4/4.6] w-full rounded-[20px] shadow-[0_20px_46px_rgba(0,0,0,0.16)] nav:order-none"
          />
        </div>
      </section>

      {/* 9 — Dream CTA */}
      <section id="contact" className="py-[70px]" style={{ background: DREAM_BG }}>
        <div className="wrap grid items-center gap-10 nav:grid-cols-2">
          <div>
            <h2 className="mb-[22px] font-kalam text-[clamp(1.9rem,3.4vw,2.5rem)] leading-[1.3] font-bold">
              <span className="text-green">{homepage.cta_heading_1}</span>
              <br />
              About <span className="text-gold">{homepage.cta_heading_2}</span>
            </h2>
            {homepage.cta_paragraphs.map((p) => (
              <p
                key={p}
                className="mb-[18px] max-w-[480px] text-[0.95rem] leading-[1.6] text-ink"
              >
                {p}
              </p>
            ))}
            <ButtonLink to={homepage.cta_link} variant="green-dark">
              {homepage.cta_label}
            </ButtonLink>
          </div>
          <DhakaScene className="h-auto w-full" />
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
