import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { Button, ButtonLink } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { listPublishedTours } from "@/lib/site-content.functions";
import { submitInquiry } from "@/lib/capture.functions";

export const Route = createFileRoute("/contact")({
  // `?tour=<slug>` pre-selects the tour — this is what "Book Now" on a tour page links to.
  validateSearch: z.object({ tour: z.string().optional() }),
  loader: () => listPublishedTours(),
  head: () => ({
    meta: [
      { title: "Contact Us — Plan Your Trip | Roam Bengal" },
      {
        name: "description",
        content:
          "Tell us the trip you are picturing — dates, group size, must-sees — and we will come back with a plan. Every message gets a real reply.",
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const tours = Route.useLoaderData();
  const { tour: preselected } = Route.useSearch();
  const { contact, whatsapp } = useSiteSettings();
  const send = useServerFn(submitInquiry);

  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    try {
      await send({
        data: {
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          phone: String(form.get("phone") ?? ""),
          country: String(form.get("country") ?? ""),
          tour_slug: String(form.get("tour_slug") ?? ""),
          message: String(form.get("message") ?? ""),
        },
      });
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader />
        <div className="wrap py-16 text-center">
          <h1 className="font-display text-[clamp(1.9rem,4.6vw,3rem)] leading-tight text-white">
            {contact.banner_title}
          </h1>
        </div>
      </div>

      <main id="main">
        <section className="wrap grid gap-6 py-12 sm:grid-cols-3">
          <ContactCard icon="📞" title="Call or WhatsApp" body={contact.phone} href={whatsapp.link} />
          <ContactCard
            icon="✉️"
            title="Email"
            body={contact.email}
            href={`mailto:${contact.email}`}
          />
          <ContactCard icon="🕐" title={contact.office_hours_label} body={contact.office_hours} />
        </section>

        <section className="wrap grid gap-12 pb-16 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-rule bg-cream p-8">
            <h2 className="font-display text-[1.5rem] text-green">{contact.form_heading}</h2>
            <p className="mt-2 text-[0.9rem] leading-7 text-muted">{contact.form_intro}</p>

            {state === "done" ? (
              <div className="mt-7 rounded-xl border border-green-bright/40 bg-mint p-7 text-center">
                <div className="text-[2rem]" aria-hidden="true">
                  ✅
                </div>
                <h3 className="mt-2 font-display text-[1.2rem] text-green">
                  Message received.
                </h3>
                <p className="mt-2 text-[0.9rem] leading-7 text-muted">
                  We reply to every message personally — usually the same day. If it is
                  urgent, WhatsApp is faster.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <ButtonLink to={whatsapp.link} variant="whatsapp">
                    {whatsapp.strip_cta}
                  </ButtonLink>
                  <ButtonLink to="/tours" variant="outline-dark">
                    Keep Browsing Tours
                  </ButtonLink>
                </div>
              </div>
            ) : (
              <form className="mt-7" onSubmit={onSubmit}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Full Name" name="name" required placeholder="Your name" />
                  <Field
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    placeholder="you@email.com"
                  />
                  <Field
                    label="Phone / WhatsApp"
                    name="phone"
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                  />
                  <Field
                    label="Country"
                    name="country"
                    placeholder="Where are you travelling from?"
                  />

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="tour_slug"
                      className="mb-1.5 block text-[0.82rem] font-semibold text-ink"
                    >
                      Interested Tour
                    </label>
                    <select
                      id="tour_slug"
                      name="tour_slug"
                      defaultValue={preselected ?? ""}
                      className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-4 py-3 text-[0.88rem] outline-none focus:border-green"
                    >
                      <option value="">Not sure yet — help me choose</option>
                      {tours.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-[0.82rem] font-semibold text-ink"
                    >
                      Your Message <span className="text-rust">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder="Tell us your travel dates, group size, and anything else we should know"
                      className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-4 py-3 text-[0.88rem] outline-none focus:border-green"
                    />
                  </div>
                </div>

                {state === "error" ? (
                  <p role="alert" className="mt-4 text-[0.84rem] text-rust">
                    {error}
                  </p>
                ) : null}

                <div className="mt-6">
                  <Button type="submit" variant="green-dark" disabled={state === "sending"}>
                    {state === "sending" ? "Sending…" : contact.form_cta}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="flex flex-col justify-center rounded-2xl bg-mint p-8 text-center">
            <div className="text-[3rem]" aria-hidden="true">
              🛺
            </div>
            <p className="mt-4 font-script text-[1.5rem] leading-snug text-green-dark">
              “{contact.art_note}”
            </p>
          </div>
        </section>

        <section className="bg-cream py-14">
          <div className="wrap flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-green-dark p-8 text-white">
            <div>
              <h3 className="font-display text-[1.4rem]">{whatsapp.strip_heading}</h3>
              <p className="mt-2 max-w-lg text-[0.88rem] leading-6 text-white/75">
                {whatsapp.strip_body}
              </p>
            </div>
            <ButtonLink to={whatsapp.link} variant="whatsapp">
              {whatsapp.strip_cta}
            </ButtonLink>
          </div>
        </section>

        <section className="wrap pb-16">
          {contact.map_embed ? (
            <div className="aspect-[21/9] overflow-hidden rounded-2xl border border-rule">
              <iframe
                src={contact.map_embed}
                title={contact.map_label}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="flex aspect-[21/9] items-center justify-center rounded-2xl border border-dashed border-rule text-[0.9rem] text-muted">
              🗺️ {contact.map_label}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

function ContactCard({
  icon,
  title,
  body,
  href,
}: {
  icon: string;
  title: string;
  body: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="text-[1.6rem]" aria-hidden="true">
        {icon}
      </div>
      <h4 className="mt-2 font-display text-[1rem] font-bold text-green-dark">{title}</h4>
      <p className="mt-1 text-[0.86rem] text-muted">{body}</p>
    </>
  );
  const className =
    "rounded-2xl border border-rule bg-paper p-6 text-center transition-colors hover:border-green";
  return href ? (
    <a href={href} className={className} target="_blank" rel="noreferrer noopener">
      {inner}
    </a>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-[0.82rem] font-semibold text-ink">
        {label} {required ? <span className="text-rust">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border-[1.5px] border-rule bg-paper px-4 py-3 text-[0.88rem] outline-none focus:border-green"
      />
    </div>
  );
}
