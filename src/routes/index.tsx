import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { useSiteSettings, useHomeLayout } from "@/hooks/use-site-settings";
import {
  listPublishedPosts,
  listPublishedTestimonials,
  listPublishedTours,
} from "@/lib/site-content.functions";
import { HOME_SECTIONS } from "@/components/home/registry";

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
const HERO_BG = "linear-gradient(160deg, #7A2408 0%, #C4390E 35%, #F0791E 65%, #F2B705 100%)";
const HERO_OVERLAY =
  "linear-gradient(180deg, rgba(10,20,15,0.55) 0%, rgba(10,20,15,0.15) 45%, rgba(10,20,15,0.7) 100%)";

function Home() {
  const { tours, testimonials, posts } = Route.useLoaderData();
  const { hero } = useSiteSettings();
  const layout = useHomeLayout();

  return (
    <>
      {/* Hero — always first, not reorderable. */}
      <div id="section-hero" className="relative min-h-[640px] overflow-hidden text-white" style={{ background: HERO_BG }}>
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

        {/* `pb` runs the hero photo on past the buttons, which is what sets where the
            feature strip below starts. */}
        <main id="main" className="wrap relative z-[4] pt-[60px] pb-[290px]">
          <span className="block font-script text-[clamp(1.8rem,3.4vw,2.6rem)] leading-tight font-bold -mb-1.5 text-gold">
            {hero.script}
          </span>
          <h1 className="mt-0.5 mb-[18px] font-marker text-[clamp(2.4rem,5.6vw,4.1rem)] leading-[1.08] font-normal tracking-[0.01em] [text-shadow:0_4px_24px_rgba(0,0,0,0.3)]">
            {hero.headline}
          </h1>
          <p className="mb-[30px] max-w-[480px] text-[1.02rem] opacity-[0.92]"><FormatText>{hero.subtext}</FormatText></p>
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

      {layout
        .filter((entry) => entry.visible)
        .map((entry) => {
          const { Component } = HOME_SECTIONS[entry.id];
          return <Component key={entry.id} tours={tours} testimonials={testimonials} posts={posts} />;
        })}

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
