import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { Stars } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame, gradientFor } from "@/components/ui/photo-frame";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { listPublishedTestimonials } from "@/lib/site-content.functions";

export const Route = createFileRoute("/reviews")({
  loader: () => listPublishedTestimonials(),
  head: () => ({
    meta: [
      { title: "Guest Reviews — What Travellers Say | Roam Bengal" },
      {
        name: "description",
        content:
          "Real feedback from travellers who have toured Bangladesh with Roam Bengal — collected across every platform we are reviewed on.",
      },
    ],
  }),
  component: Reviews,
});

function Reviews() {
  const testimonials = Route.useLoaderData();
  const { reviews } = useSiteSettings();

  return (
    <>
      <div className="relative bg-green-dark">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#22B57A_1px,transparent_1px)] bg-[length:26px_26px] opacity-10" />
        <div className="relative z-10">
          <SiteHeader />
          <div className="wrap py-16 text-center">
            <h1 className="font-display text-[clamp(1.9rem,4.6vw,3rem)] leading-tight text-white">
              {reviews.heading_1}
              <br />
              {reviews.heading_2}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[0.94rem] leading-7 text-white/75">
              {reviews.subtext}
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-[3.4rem] leading-none font-bold text-gold">
                  {reviews.score}
                </span>
                <span className="text-[1rem] text-white/60">/ {reviews.score_out_of}</span>
              </div>
              <div className="text-left">
                <div className="text-[1.05rem] tracking-[3px] text-gold">★★★★★</div>
                <div className="mt-1 text-[0.84rem] text-white/70">
                  {reviews.count_label}
                </div>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap justify-center gap-4">
              {reviews.platforms.map((p) => (
                <div key={p.name} className="rounded-xl bg-white/10 px-5 py-3 text-center">
                  <div className="text-[0.86rem] font-semibold text-white">
                    <span style={{ color: p.colour }}>{p.icon}</span> {p.name}
                  </div>
                  <div className="mt-1 text-[0.76rem] text-white/70">★★★★★ {p.score}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main id="main" className="bg-cream">
        <div className="wrap flex flex-col gap-6 py-16">
          {testimonials.map((t) => (
            <article
              key={t.id}
              className="grid gap-5 rounded-2xl border border-rule bg-paper p-6 sm:grid-cols-[120px_1fr]"
            >
              <PhotoFrame
                src={t.avatarUrl ?? t.images[0]}
                alt={`${t.author} on tour with Roam Bengal`}
                gradient={gradientFor(t.author)}
                placeholderLabel={t.author.split(" ")[0]?.toLowerCase()}
                className="aspect-square w-full rounded-xl sm:w-[120px]"
              />

              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[0.92rem] font-semibold text-ink">
                    — {t.author}
                    {t.location ? `, ${t.location}` : ""}
                  </span>
                  <Stars rating={t.rating} />
                </div>
                {t.tourLabel ? (
                  <div className="mt-0.5 text-[0.82rem] text-muted">{t.tourLabel}</div>
                ) : null}

                {t.headline ? (
                  <p className="mt-3 font-display text-[1.08rem] leading-snug text-green">
                    “{t.headline}”
                  </p>
                ) : null}
                <p className="mt-2 text-[0.92rem] leading-8 text-ink/85">“{t.quote}”</p>
              </div>
            </article>
          ))}
        </div>

        <div className="wrap pb-16">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-green-dark p-8 text-white">
            <div>
              <h3 className="font-display text-[1.4rem]">{reviews.cta_heading}</h3>
              <p className="mt-2 max-w-lg text-[0.88rem] leading-6 text-white/75">
                {reviews.cta_body}
              </p>
            </div>
            <ButtonLink to={reviews.cta_link} variant="green">
              {reviews.cta_label}
            </ButtonLink>
          </div>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
