import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFloat } from "@/components/whatsapp-float";
import { ButtonLink } from "@/components/ui/button";
import { FormatText } from "@/components/ui/format-text";
import type { PolicyPage } from "@/content/policy-defaults";

/** Shared by /policies/:slug and the standalone info pages. */
export function PolicyLayout({ page }: { page: PolicyPage }) {
  return (
    <>
      <div className="bg-green-dark">
        <SiteHeader />
        <div className="wrap py-14 text-center">
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

      <main id="main" className="wrap max-w-3xl py-14">
        <p className="font-display text-[1.2rem] leading-8 text-green-dark">
          {page.subhead}
        </p>

        <div className="mt-10 flex flex-col gap-10">
          {page.blocks.map((block) => (
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
                      <FormatText>{item}</FormatText>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          {page.blocks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-rule p-8 text-center text-[0.92rem] text-muted">
              This page is being written. Message us in the meantime — we will answer
              directly.
            </p>
          ) : null}
        </div>

        <div className="mt-12 rounded-2xl bg-mint p-7 text-center">
          <h3 className="font-display text-[1.2rem] text-green">{page.contact_heading}</h3>
          <p className="mx-auto mt-2 max-w-md text-[0.9rem] leading-7 text-muted">
            {page.contact_body}
          </p>
          <div className="mt-5">
            <ButtonLink to="/contact" variant="green-dark">
              Contact Us →
            </ButtonLink>
          </div>
        </div>
      </main>

      <SiteFooter />
      <WhatsAppFloat />
    </>
  );
}
