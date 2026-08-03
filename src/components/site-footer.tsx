import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/art/logo-mark";
import { isExternal } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SiteFooter() {
  const { footer } = useSiteSettings();

  return (
    <footer
      className="pt-14 pb-6 text-white"
      style={{ background: "linear-gradient(160deg,#123D26,#B5810A)" }}
    >
      <div className="wrap mb-10 grid grid-cols-2 gap-8 nav:grid-cols-[1.3fr_repeat(5,0.9fr)]">
        <div className="col-span-2 nav:col-span-1">
          <span className="flex items-center gap-2.5 leading-none">
            <LogoMark className="h-[38px] w-[38px] shrink-0" />
            <span className="font-kalam text-[1.6rem] leading-none font-bold tracking-[-0.01em]">
              <span className="text-white">Roam</span>
              <span className="ml-[5px] text-orange">Bengal</span>
            </span>
          </span>
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

      <div className="wrap flex flex-wrap justify-between gap-2.5 border-t border-white/15 pt-[22px] text-[0.78rem] opacity-60">
        <span>{footer.copyright}</span>
        <span>{footer.site_label}</span>
      </div>
    </footer>
  );
}
