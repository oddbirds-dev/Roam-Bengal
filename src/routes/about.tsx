import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { SectionHead, Eyebrow, Stars, InitialAvatar } from "@/components/sections";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { listPublishedTestimonials } from "@/lib/site-content.functions";

export const Route = createFileRoute("/about")({
  loader: () => listPublishedTestimonials(),
  head: () => ({
    meta: [
      { title: "About Us — Roam Bengal" },
      {
        name: "description",
        content:
          "A small team of local guides and planners crafting private journeys through Bangladesh's rivers, hills, and tea gardens.",
      },
    ],
  }),
  component: About,
});

function About() {
  const testimonials = Route.useLoaderData();
  const { about, homepage } = useSiteSettings();
  const shown = testimonials.slice(0, 3);

  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader />
      </div>

      <main id="main">
        <section className="wrap grid items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <Eyebrow>{about.eyebrow}</Eyebrow>
            <h1 className="font-display text-[clamp(2rem,4.6vw,3rem)] leading-tight text-green">
              {about.heading_1} <span className="text-accent">{about.heading_2}</span>
            </h1>
            {about.intro_paragraphs.map((p) => (
              <p key={p} className="mt-4 text-[0.94rem] leading-7 text-muted">
                {p}
              </p>
            ))}
            <div className="mt-7">
              <ButtonLink to={about.cta_link} variant="green-dark">
                {about.cta_label}
              </ButtonLink>
            </div>
          </div>
          <PhotoFrame
            src={about.hero_image}
            alt="Roam Bengal guide on a Sundarbans river boat"
            gradient="green"
            priority
            placeholderLabel="images/about-hero.jpg"
            className="aspect-[4/3] rounded-2xl"
          />
        </section>

        <section className="bg-mint py-12">
          <div className="wrap max-w-4xl text-center text-[0.98rem] leading-8 text-ink/85">
            <FormatText>{about.intro_strip}</FormatText>
          </div>
        </section>

        <section id="founder-story" className="bg-cream py-16 sm:py-20">
          <div className="wrap grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] lg:gap-16">
            <div>
              <Eyebrow>{about.founder_eyebrow}</Eyebrow>
              <h2 className="max-w-2xl font-display text-[clamp(1.8rem,3.6vw,2.65rem)] leading-tight text-green">
                {about.founder_heading} <span className="text-accent">{about.founder_heading_accent}</span>
              </h2>
              <div className="mt-6 max-w-3xl space-y-4 text-[0.94rem] leading-7 text-muted">
                {about.founder_paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mx-auto w-full max-w-sm text-center lg:mx-0 lg:justify-self-end">
              <PhotoFrame
                src={about.founder_image || about.hero_image}
                alt="Roam Bengal founder in Bangladesh"
                gradient="green"
                placeholderLabel="images/founder.jpg"
                className="aspect-[4/5] rounded-2xl"
              />
              <div className="mt-5">
                <h3 className="font-display text-[1.2rem] font-bold text-green-dark">
                  {about.founder_name}
                </h3>
                <p className="mt-1 text-[0.82rem] text-muted">{about.founder_role}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="py-14">
          <div className="wrap grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {about.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-rule bg-cream p-7 text-center"
              >
                <div className="font-display text-[2.2rem] leading-none font-bold text-green">
                  {stat.value}
                </div>
                <div className="mt-2 text-[0.84rem] text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="py-14">
          <div className="wrap">
            <SectionHead kicker={about.mvv_kicker}>{about.mvv_heading}</SectionHead>
            <p className="mx-auto mt-4 max-w-2xl text-center text-[0.92rem] leading-7 text-muted">
              <FormatText>{about.mvv_intro}</FormatText>
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {about.pillars.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-rule bg-paper p-7 text-center"
                >
                  <div className="text-[2rem]" aria-hidden="true">
                    {p.icon}
                  </div>
                  <h3 className="mt-3 font-display text-[1.15rem] font-bold text-green-dark">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-center text-[0.88rem] leading-7 text-muted">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream py-16">
          <div className="wrap">
            <SectionHead kicker={about.why_kicker}>{about.why_heading}</SectionHead>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {about.why_items.map((item) => (
                <div key={item.title} className="rounded-2xl bg-paper p-6">
                  <h3 className="font-display text-[1.02rem] font-bold text-green-dark">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.86rem] leading-6 text-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {shown.length ? (
          <section className="py-16">
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
                        <span className="block text-[0.86rem] font-semibold">
                          {t.author}
                        </span>
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
        ) : null}

        <section className="bg-mint py-16">
          <div className="wrap max-w-3xl text-center">
            <h2 className="font-display text-[clamp(1.6rem,3.2vw,2.2rem)] leading-tight text-green">
              {homepage.cta_heading_1}
              <br />
              About <span className="text-accent">{homepage.cta_heading_2}</span>
            </h2>
            <div className="mt-7">
              <ButtonLink to="/contact" variant="green-dark">
                {homepage.cta_label}
              </ButtonLink>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
