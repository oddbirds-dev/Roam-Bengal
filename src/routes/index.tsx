import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { TourCard } from "@/components/tour-card";
import { SectionHead, Eyebrow, Stars, InitialAvatar } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  listPublishedPosts,
  listPublishedTestimonials,
  listPublishedTours,
} from "@/lib/site-content.functions";
import { FeatureIcon, WhyIcon } from "@/components/art/icons";

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

function Home() {
  const { tours, testimonials, posts } = Route.useLoaderData();
  const settings = useSiteSettings();
  const { hero, homepage, gallery, reviews } = settings;

  const featuredTours = [...tours]
    .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured))
    .slice(0, 6);
  const featuredReviews = testimonials.filter((t) => t.isFeatured).slice(0, 3);
  const homeReviews = featuredReviews.length ? featuredReviews : testimonials.slice(0, 3);
  const journalPosts = posts.slice(0, 3);

  return (
    <>
      {/* 1 — Hero */}
      <div className="relative min-h-[86vh] overflow-hidden bg-green-dark">
        <PhotoFrame
          src={hero.background_url}
          alt={hero.background_alt}
          gradient="deepGreen"
          priority
          className="absolute inset-0 h-full w-full"
          placeholderLabel="images/hero-boat.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/35 to-ink/70" />

        <div className="relative z-10 flex min-h-[86vh] flex-col">
          <SiteHeader />
          <main id="main" className="wrap flex flex-1 flex-col justify-center py-16">
            <div className="max-w-2xl">
              <span className="block font-script text-[clamp(1.8rem,3.4vw,2.6rem)] text-gold">
                {hero.script}
              </span>
              <h1 className="mt-[-6px] font-display text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.05] text-white">
                {hero.headline}
              </h1>
              <p className="mt-5 max-w-xl text-[1rem] leading-7 text-white/85">
                {hero.subtext}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink to={hero.primary_link} variant="green">
                  {hero.primary_label}
                </ButtonLink>
                {hero.secondary_label ? (
                  <ButtonLink
                    to={hero.secondary_link || "/tours"}
                    variant="outline-light"
                  >
                    {hero.secondary_label}
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* 2 — Feature strip */}
      <section className="bg-green-dark py-10">
        <div className="wrap grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {homepage.features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10">
                <FeatureIcon name={f.icon} />
              </span>
              <div>
                <h4 className="font-display text-[0.98rem] font-bold text-white">
                  {f.title}
                </h4>
                <p className="mt-0.5 text-[0.76rem] leading-5 text-white/70">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 — Popular tours */}
      <section id="packages" className="py-20">
        <div className="wrap">
          <SectionHead kicker={homepage.popular_kicker}>
            {homepage.popular_heading}
          </SectionHead>
          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink to="/tours" variant="outline-dark">
              View All Tours →
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 4 — Gallery */}
      <section className="bg-cream py-20">
        <div className="wrap flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">
              <span className="text-green">{gallery.heading_1}</span>
              <br />
              <span className="text-orange">{gallery.heading_2}</span>
            </h2>
            <p className="mt-4 text-[0.92rem] leading-7 text-muted">{gallery.blurb}</p>
            <p className="mt-2 font-semibold text-green-dark">{gallery.bold}</p>
          </div>
          <ButtonLink to={gallery.cta_link} variant="green-dark">
            {gallery.cta_label}
          </ButtonLink>
        </div>

        <div className="wrap mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.photos.map((photo) => (
            <PhotoFrame
              key={photo.tag}
              src={photo.image_url}
              alt={photo.tag}
              gradient={gradientFor(photo.tag)}
              placeholderLabel={photo.tag}
              className="aspect-[4/5] rounded-2xl"
            >
              <span className="absolute bottom-3 left-3 rounded-full bg-ink/60 px-3 py-1 text-[0.72rem] font-medium text-white">
                {photo.tag}
              </span>
            </PhotoFrame>
          ))}
        </div>
      </section>

      {/* 5 — Why travellers keep faith */}
      <section className="py-20">
        <div className="wrap grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <div className="absolute -top-6 -left-6 h-56 w-56 rounded-full bg-mint" />
            <PhotoFrame
              src=""
              alt="Bird native to the Sundarbans wetlands"
              gradient="teal"
              placeholderLabel="images/wildlife-1.jpg"
              className="relative aspect-[4/3] rounded-2xl"
            />
            <PhotoFrame
              src=""
              alt="Royal Bengal tiger in the Sundarbans"
              gradient="orange"
              placeholderLabel="images/wildlife-2.jpg"
              className="relative -mt-16 ml-auto aspect-square w-1/2 rounded-2xl border-4 border-paper"
            />
            <span className="absolute right-4 bottom-4 rounded-full bg-paper px-4 py-2 text-[0.76rem] font-semibold shadow-md">
              {homepage.faith_pin}
            </span>
          </div>

          <div>
            <Eyebrow>{homepage.faith_kicker}</Eyebrow>
            <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight text-green">
              {homepage.faith_heading_1}
              <br />
              <span className="text-orange">{homepage.faith_heading_2}</span>
            </h2>
            <ul className="mt-6 flex flex-col gap-3">
              {homepage.faith_list.map((item) => (
                <li key={item} className="flex gap-3 text-[0.9rem] leading-6 text-ink">
                  <span className="mt-1 text-green-bright">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-4">
              {homepage.faith_callouts.map((c) => (
                <div
                  key={c.lead}
                  className="flex gap-3 rounded-xl border-l-4 border-gold bg-mint p-4"
                >
                  <span className="font-bold text-green">→</span>
                  <p className="text-[0.85rem] leading-6">
                    <strong className="text-green-dark">{c.lead}</strong> {c.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 — Journal */}
      <section className="bg-cream py-20">
        <div className="wrap">
          <SectionHead kicker={homepage.journal_kicker}>
            {homepage.journal_heading}
          </SectionHead>
          <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {journalPosts.map((post) => (
              <Link
                key={post.id}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-rule bg-paper transition-shadow hover:shadow-lg"
              >
                <PhotoFrame
                  src={post.coverImage}
                  alt={post.title}
                  gradient={gradientFor(post.slug)}
                  placeholderLabel={`images/blog-${post.slug}.jpg`}
                  className="aspect-[16/10] w-full"
                >
                  {post.category ? (
                    <span className="absolute top-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-[0.68rem] font-semibold text-green-dark">
                      {post.category}
                    </span>
                  ) : null}
                </PhotoFrame>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-[1.05rem] leading-snug font-bold text-green-dark group-hover:text-green">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-[0.84rem] leading-6 text-muted">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-2 pt-4 text-[0.76rem] text-muted">
                    {post.authorName ? (
                      <>
                        <InitialAvatar name={post.authorName} className="h-6 w-6" />
                        {post.authorName}
                      </>
                    ) : null}
                    {post.dateLabel ? <span>· 📅 {post.dateLabel}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7 — Reviews */}
      <section id="reviews" className="bg-green-dark py-20 text-white">
        <div className="wrap">
          <h2 className="text-center font-display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight">
            {homepage.reviews_heading_1}
            <br />
            <span className="text-gold">{homepage.reviews_heading_2}</span>
          </h2>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            {reviews.platforms.map((p) => (
              <div
                key={p.name}
                className="rounded-xl bg-white/10 px-5 py-3 text-center backdrop-blur"
              >
                <div className="text-[0.86rem] font-semibold">
                  <span style={{ color: p.colour }}>{p.icon}</span> {p.name}
                </div>
                <div className="mt-1 text-[0.76rem] text-white/70">
                  ★★★★★ {p.score}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {homeReviews.map((t) => (
              <figure
                key={t.id}
                className="flex flex-col rounded-2xl bg-white/8 p-6 text-center backdrop-blur"
              >
                <blockquote className="flex-1 text-[0.9rem] leading-7 text-white/90">
                  “{t.headline ?? t.quote}”
                </blockquote>
                <div className="mt-4">
                  <Stars rating={t.rating} />
                </div>
                <figcaption className="mt-4 flex items-center justify-center gap-3">
                  <InitialAvatar name={t.author} className="h-9 w-9" />
                  <span className="text-left">
                    <span className="block text-[0.86rem] font-semibold">{t.author}</span>
                    <span className="block text-[0.74rem] text-white/60">
                      {t.location ?? "Guest Review"}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <div className="mt-10 text-center">
            <ButtonLink to={homepage.reviews_cta_link} variant="rust">
              {homepage.reviews_cta_label}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 8 — Why you choose our company */}
      <section className="py-20">
        <div className="wrap grid items-center gap-14 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight text-green">
              Why You Choose <span className="text-orange">Our Company</span>
            </h2>
            <p className="mt-4 text-[0.92rem] leading-7 text-muted">
              {homepage.why_intro}
            </p>
            <div className="mt-8 flex flex-col gap-6">
              {homepage.why_items.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <WhyIcon name={item.icon} />
                  <div>
                    <h3 className="font-display text-[1.02rem] font-bold text-green-dark">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-[0.86rem] leading-6 text-muted">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <PhotoFrame
            src=""
            alt="Traveller hiking a forest trail in Bangladesh"
            gradient="green"
            placeholderLabel="images/why-choose-us.jpg"
            className="aspect-[4/5] rounded-2xl"
          />
        </div>
      </section>

      {/* 9 — Dream CTA */}
      <section id="contact" className="bg-mint py-20">
        <div className="wrap grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-[clamp(1.7rem,3.4vw,2.4rem)] leading-tight text-green">
              {homepage.cta_heading_1}
              <br />
              About <span className="text-orange">{homepage.cta_heading_2}</span>
            </h2>
            {homepage.cta_paragraphs.map((p) => (
              <p key={p} className="mt-4 text-[0.92rem] leading-7 text-ink/80">
                {p}
              </p>
            ))}
            <div className="mt-7">
              <ButtonLink to={homepage.cta_link} variant="green-dark">
                {homepage.cta_label}
              </ButtonLink>
            </div>
          </div>
          <PhotoFrame
            src=""
            alt="Illustration of Dhaka landmarks and rickshaws"
            gradient="gold"
            placeholderLabel="illustration"
            className="aspect-[4/3] rounded-2xl"
          />
        </div>
      </section>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
