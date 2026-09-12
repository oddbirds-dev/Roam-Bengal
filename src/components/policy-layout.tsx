import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { ButtonLink } from "@/components/ui/button";
import { FaqAccordion } from "@/components/ui/faq-accordion";
import { FormatDocument, FormatText } from "@/components/ui/format-text";
import { BannerPhoto } from "@/components/ui/banner-photo";
import { PolicyGallery, PolicyReviews } from "@/components/policy-extras";
import type { PolicyPage } from "@/content/policy-defaults";
import type { TestimonialDTO } from "@/lib/content-types";

/** Shared by /policies/:slug and the standalone info pages. */
export function PolicyLayout({
  page,
  faqPage = false,
  testimonials = [],
}: {
  page: PolicyPage;
  faqPage?: boolean;
  testimonials?: TestimonialDTO[];
}) {
  return (
    <>
      <div className="full-bleed relative isolate bg-green-dark">
        <BannerPhoto src={page.banner_image} alt={page.title} />
        <SiteHeader />
        <div className="relative z-[1] wrap py-14 text-center">
          <span className="text-[0.72rem] font-semibold tracking-[0.2em] text-gold uppercase">
            {page.eyebrow}
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,4.4vw,2.9rem)] leading-tight text-white">
            {page.title}
          </h1>
          <nav className="mt-4 text-[0.78rem] text-white/60" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-gold">
              Home
            </Link>
            {" / "}
            <span className="text-white/85">{page.title}</span>
          </nav>
        </div>
      </div>

      <main id="main" className="wrap py-14">
        <p className="font-display text-[1.2rem] leading-8 text-green-dark">
          <FormatText>{page.subhead}</FormatText>
        </p>

        {/* `body` is what the admin editor writes now; `blocks` is the shape these pages shipped
            in and is still what the code defaults carry, so both have to render. */}
        {page.body?.trim() ? (
          // `blog-body` is the shared typography for admin-authored rich text, not blog-only —
          // it already covers every tag the editor emits, so a second near-identical block of
          // CSS would just be another thing to keep in sync.
          <div className="blog-body mt-10">
            <FormatDocument>{page.body}</FormatDocument>
          </div>
        ) : (
        <div className="mt-10 flex flex-col gap-10">
          {faqPage ? (
            <FaqAccordion
              items={page.blocks.map((block) => ({
                question: block.heading,
                answer: block.paragraphs?.join("\n\n") ?? block.items?.join("\n\n") ?? "",
              }))}
            />
          ) : (
            page.blocks.map((block) => (
              <section key={block.heading}>
                <h2 className="font-display text-[1.25rem] text-green">{block.heading}</h2>
                {block.paragraphs?.map((p) => (
                  <p key={p} className="mt-3 text-[0.94rem] leading-8 text-ink/85">
                    <FormatText>{p}</FormatText>
                  </p>
                ))}
                {block.items?.length ? (
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {block.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-3 text-[0.92rem] leading-7 text-ink/85"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        <span>
                          <FormatText>{item}</FormatText>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))
          )}

          {page.blocks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-rule p-8 text-center text-[0.92rem] text-muted">
              This page is being written. Message us in the meantime — we will answer
              directly.
            </p>
          ) : null}
        </div>
        )}

        <div className="mt-12 rounded-2xl bg-mint p-7 text-center">
          <h3 className="font-display text-[1.2rem] text-green">{page.contact_heading}</h3>
          <p className="mx-auto mt-2 max-w-md text-center text-[0.9rem] leading-7 text-muted">
            <FormatText>{page.contact_body}</FormatText>
          </p>
          <div className="mt-5">
            <ButtonLink to="/contact" variant="green-dark">
              Contact Us →
            </ButtonLink>
          </div>
        </div>
      </main>

      <PolicyGallery />
      <PolicyReviews testimonials={testimonials} />

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
