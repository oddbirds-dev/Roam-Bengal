import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { Button, ButtonLink } from "@/components/ui/button";
import { ContactScene } from "@/components/art/dhaka-scene";
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

const WA_STRIP_BG = "linear-gradient(120deg,#E9FBF0,#FDF0E4)";
const MAP_BG = "linear-gradient(155deg,#DCE9DF,#EAF4EC 60%,#F5EEE0)";

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
      <SiteHeader variant="solid" />

      <main id="main">
        {/* Hero */}
        <div className="shell mx-auto max-w-[760px] pt-16 pb-5 text-center">
          <span className="mb-4 inline-block text-[0.78rem] font-bold tracking-[0.1em] text-orange uppercase">
            {contact.hero_eyebrow}
          </span>
          <h1 className="mb-4 font-display text-[clamp(2rem,4.2vw,2.8rem)] leading-[1.2] font-bold">
            {contact.banner_title}
          </h1>
          <p className="text-center text-[1rem] leading-[1.7] text-muted">{contact.hero_intro}</p>
        </div>

        {/* Info cards */}
        <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-5 px-5 pt-[46px] pb-2.5 min-[640px]:grid-cols-2 min-[640px]:px-10 min-[980px]:grid-cols-4">
          <InfoCard icon="📧" title="Email Us" link={contact.email} href={`mailto:${contact.email}`} />
          <InfoCard icon="💬" title="WhatsApp" link={contact.phone} href={whatsapp.link} />
          <InfoCard icon="📍" title="Our Office" body={contact.address} />
          <InfoCard icon="🕒" title={contact.office_hours_label} body={contact.office_hours} />
        </div>

        {/* Form + art */}
        <div className="mx-auto grid max-w-[1160px] items-center gap-10 px-5 pt-14 pb-[90px] min-[640px]:px-10 min-[980px]:grid-cols-[1.1fr_1fr] min-[980px]:gap-[60px]">
          <div>
            <h2 className="mb-2.5 font-display text-[1.7rem] font-bold">
              {contact.form_heading}
            </h2>
            <p className="mb-7 text-[0.92rem] text-muted">{contact.form_intro}</p>

            {state === "done" ? (
              <div className="rounded-2xl border border-green-bright/40 bg-mint p-7 text-center">
                <div className="text-[2rem]" aria-hidden="true">
                  ✅
                </div>
                <h3 className="mt-2 font-display text-[1.2rem] font-bold text-green">
                  Message received.
                </h3>
                <p className="mt-2 text-center text-[0.9rem] leading-7 text-muted">
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
              <form onSubmit={onSubmit}>
                <div className="grid grid-cols-1 gap-4 min-[640px]:grid-cols-2">
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

                  <div className="mb-4">
                    <label htmlFor="tour_slug" className={LABEL}>
                      Interested Tour
                    </label>
                    <select
                      id="tour_slug"
                      name="tour_slug"
                      defaultValue={preselected ?? ""}
                      className={CONTROL}
                    >
                      <option value="">Not sure yet — help me choose</option>
                      {tours.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 col-span-full">
                    <label htmlFor="message" className={LABEL}>
                      Your Message <span className="text-rust">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      placeholder="Tell us your travel dates, group size, and anything else we should know"
                      className={`${CONTROL} resize-y`}
                    />
                  </div>
                </div>

                {state === "error" ? (
                  <p role="alert" className="mb-3 text-[0.84rem] text-rust">
                    {error}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="green-dark"
                  disabled={state === "sending"}
                  className="mt-1.5 w-full py-3.5"
                >
                  {state === "sending" ? "Sending…" : contact.form_cta}
                </Button>
              </form>
            )}
          </div>

          <div className="order-first mx-auto w-full max-w-[340px] min-[980px]:order-none min-[980px]:max-w-none">
            <ContactScene className="h-auto w-full" />
            <p className="mt-3.5 text-center font-script text-[1.3rem] font-bold text-green-dark">
              “{contact.art_note}”
            </p>
          </div>
        </div>

        {/* WhatsApp strip */}
        <div className="px-5 pb-[90px] min-[640px]:px-10">
          <div
            className="mx-auto flex max-w-[1160px] flex-col flex-wrap items-start justify-between gap-6 rounded-[20px] px-7 py-9 min-[980px]:flex-row min-[980px]:items-center min-[980px]:px-[46px]"
            style={{ background: WA_STRIP_BG }}
          >
            <div>
              <h3 className="mb-1.5 font-display text-[1.2rem] font-bold">
                {whatsapp.strip_heading}
              </h3>
              <p className="text-[0.86rem] text-muted">{whatsapp.strip_body}</p>
            </div>
            <ButtonLink to={whatsapp.link} variant="whatsapp">
              {whatsapp.strip_cta}
            </ButtonLink>
          </div>
        </div>

        {/* Map */}
        <div className="mx-auto mb-[90px] max-w-[1160px] px-5 min-[640px]:px-10">
          {contact.map_embed ? (
            <div className="aspect-[21/7] overflow-hidden rounded-[18px] border border-rule">
              <iframe
                src={contact.map_embed}
                title={contact.map_label}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div
              className="flex aspect-[21/7] items-center justify-center rounded-[18px] border border-rule px-6 text-center text-[0.88rem] font-semibold text-muted"
              style={{ background: MAP_BG }}
            >
              🗺️ {contact.map_label}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}

const LABEL = "mb-1.5 block text-[0.82rem] font-semibold text-ink";
const CONTROL =
  "w-full rounded-[10px] border-[1.5px] border-rule bg-paper px-3.5 py-3 " +
  "font-body text-[0.9rem] text-ink outline-none focus:border-green";

/** `.info-card` — cream tile with an emoji, a heading, and either a link or plain text. */
function InfoCard({
  icon,
  title,
  body,
  link,
  href,
}: {
  icon: string;
  title: string;
  body?: string;
  link?: string;
  href?: string;
}) {
  return (
    <div className="rounded-2xl border border-rule bg-cream px-[22px] py-7 text-center transition-transform duration-200 hover:-translate-y-1">
      <div className="mb-3.5 text-[1.6rem]" aria-hidden="true">
        {icon}
      </div>
      <h4 className="mb-1.5 text-[0.98rem] font-bold">{title}</h4>
      {body ? <p className="text-[0.84rem] leading-[1.5] text-muted">{body}</p> : null}
      {link && href ? (
        <a
          href={href}
          className="mt-1 block text-[0.84rem] font-semibold text-green-dark hover:text-orange"
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
        >
          {link}
        </a>
      ) : null}
    </div>
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
    <div className="mb-4">
      <label htmlFor={name} className={LABEL}>
        {label} {required ? <span className="text-rust">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={CONTROL}
      />
    </div>
  );
}
