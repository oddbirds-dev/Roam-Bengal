import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { isExternal, normalizePath } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SiteFooter() {
  const { footer, header } = useSiteSettings();

  const policyLinks = [
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Terms & Conditions", to: "/terms-conditions" },
  ];

  const guestSupportLinks = [
    { label: "24/7 Customer Support", to: "/customer-support" },
    { label: "Licensed Tour Operator", to: "/licensed-tour-operator" },
    { label: "Secure Payment Gateway", to: "/secure-payment-gateway" },
  ];

  const travelEssentialLinks = [
    { label: "Rentals & Tickets", to: "/rentals-tickets" },
    { label: "Responsible Travel", to: "/responsible-travel" },
  ];

  return (
    <footer
      className="shell pt-14 pb-[26px] text-white"
      style={{ background: "linear-gradient(160deg,#123D26,#B5810A)" }}
    >
      <div
        className="wide foot-grid mb-10"
        style={{ "--foot-cols": footer.columns.length } as CSSProperties}
      >
        <div className="col-span-2 nav:col-span-1">
          <img
            src={footer.logo_url || "/logo-white.png"}
            alt={header.logo_alt}
            className="h-14 w-auto"
          />
          {/* Left-aligned against the base `p { text-align: justify }`: this column is only
              260px wide, and justifying prose that narrow stretches single spaces into
              rivers of whitespace across every line. */}
          <p className="mt-3.5 max-w-[260px] text-left text-[0.85rem] opacity-70">
            {footer.intro}
          </p>
        </div>

        {footer.columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3.5 text-[0.8rem] font-bold tracking-[0.06em] text-gold uppercase">
              {col.title}
            </h4>
            {[...col.links, ...(col.title.trim().toLowerCase() === "know more" ? policyLinks : col.title.trim().toLowerCase() === "guest support" ? guestSupportLinks : col.title.trim().toLowerCase() === "travel essential" ? travelEssentialLinks : [])]
              // A link saved without a destination renders as `<Link to="">`, which just
              // reloads the current page. Drop those (and fully blank rows) rather than
              // show a dead link.
              .filter((link) => link.label.trim() && link.to.trim())
              .map((link) =>
              isExternal(link.to) ? (
                <a
                  key={link.label}
                  href={link.to}
                  className="mb-2.5 block text-[0.87rem] opacity-85 transition-opacity hover:opacity-100"
                  {...(link.to.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={normalizePath(link.to)}
                  className="mb-2.5 block text-[0.87rem] opacity-85 transition-opacity hover:opacity-100"
                >
                  {link.label}
                </Link>
              ),
            )}
          </div>
        ))}
      </div>

      <div className="wide flex flex-wrap justify-between gap-2.5 border-t border-white/15 pt-[22px] text-[0.78rem] opacity-60">
        <span>{footer.copyright}</span>
        <span>{footer.site_label}</span>
      </div>
    </footer>
  );
}
