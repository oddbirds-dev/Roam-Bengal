import { Link } from "@tanstack/react-router";
import { LogoMark } from "@/components/art/logo-mark";
import { isExternal } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SiteFooter() {
  const { footer } = useSiteSettings();

  return (
    <footer className="bg-green-dark text-white/80">
      <div className="wrap grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.6fr_repeat(5,1fr)]">
        <div className="max-w-sm">
          <span className="mb-4 flex items-center gap-2.5">
            <LogoMark className="h-10 w-10 shrink-0" />
            <span className="font-display text-xl leading-none font-bold">
              <span className="text-white">Roam</span>
              <span className="text-orange">Bengal</span>
            </span>
          </span>
          <p className="text-[0.86rem] leading-7">{footer.intro}</p>
        </div>

        {footer.columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 font-display text-[0.98rem] font-bold text-white">
              {col.title}
            </h4>
            <div className="flex flex-col gap-2.5">
              {col.links.map((link) =>
                isExternal(link.to) ? (
                  <a
                    key={link.label}
                    href={link.to}
                    className="text-[0.84rem] transition-colors hover:text-gold"
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
                    className="text-[0.84rem] transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/15">
        <div className="wrap flex flex-col gap-2 py-5 text-[0.78rem] sm:flex-row sm:items-center sm:justify-between">
          <span>{footer.copyright}</span>
          <span>{footer.site_label}</span>
        </div>
      </div>
    </footer>
  );
}
