import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { isExternal } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SiteFooter() {
  const { footer, header } = useSiteSettings();

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
            src={header.logo_url || "/logo.png"}
            alt="Roam Bengal"
            className="h-11 w-auto rounded bg-white/95 px-2 py-1.5"
          />
          <p className="mt-3.5 max-w-[260px] text-[0.85rem] opacity-70">{footer.intro}</p>
        </div>

        {footer.columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3.5 text-[0.8rem] font-bold tracking-[0.06em] text-gold uppercase">
              {col.title}
            </h4>
            {col.links.map((link) =>
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
                  to={link.to}
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
