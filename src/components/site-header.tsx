import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ButtonLink, normalizePath } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

/**
 * Site header.
 *
 * `variant="overlay"` sits transparently on top of a hero photo (homepage, tours
 * banner, tour detail). `variant="solid"` is for pages with no hero image.
 *
 * The reference designs simply did `.navlinks{display:none}` below 980px with no
 * replacement — the site was unnavigable on a phone (PRD §16). The drawer below is new
 * work, built to match the existing visual language.
 */
export function SiteHeader({
  variant = "overlay",
  logo = "default",
}: {
  variant?: "overlay" | "solid";
  /** "light" is for pages with a photo banner behind the header, e.g. Tours. */
  logo?: "default" | "light";
}) {
  const settings = useSiteSettings();
  const { header } = settings;
  const logoSrc =
    logo === "light"
      ? header.logo_url_light || "/logo-white.png"
      : header.logo_url || "/logo.png";
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Close the drawer on navigation, and lock body scroll while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const onDark = variant === "overlay";

  return (
    <header
      className={
        onDark
          ? "relative z-30 w-full"
          : "relative z-30 w-full border-b border-[#EEE7DA] bg-paper"
      }
    >
      <nav className="wrap flex items-center justify-between gap-6 py-[22px]">
        <Link to="/" className="block leading-none" aria-label={header.logo_alt}>
          <img
            src={logoSrc}
            alt={header.logo_alt}
            className="h-[52px] w-auto shrink-0 drop-shadow-[0_3px_8px_rgba(0,0,0,0.25)]"
          />
        </Link>

        <div className="hidden items-center gap-[30px] text-[0.9rem] font-medium nav:flex">
          {header.nav.map((item) => (
            <Link
              key={item.to}
              to={normalizePath(item.to)}
              className={`relative pb-1.5 transition-colors ${
                onDark ? "text-white/90 hover:text-white" : "text-ink hover:text-green"
              }`}
              activeProps={{
                // Overlay pages mark the active link with an orange rule; the solid
                // header on /blog and the package pages colours the label instead.
                className: onDark
                  ? "text-white after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-orange"
                  : "text-orange font-semibold",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden nav:block">
          <ButtonLink to={header.cta_link} variant="green">
            {header.cta_label}
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className={`nav:hidden inline-flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] ${
            onDark ? "border-white/50 text-white" : "border-rule text-ink"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </nav>

      {open ? (
        <div className="fixed inset-0 z-50 nav:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/60"
          />
          <div
            id="mobile-nav"
            className="absolute inset-y-0 right-0 flex w-[min(320px,85vw)] flex-col gap-2 bg-paper p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-kalam text-[1.4rem] font-bold">
                <span className="text-ink">{header.wordmark_1}</span>
                <span className="ml-[5px] text-orange">{header.wordmark_2}</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-rule"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {header.nav.map((item) => (
              <Link
                key={item.to}
                to={normalizePath(item.to)}
                className="border-b border-rule py-3 text-[1.05rem] font-medium"
                activeProps={{ className: "text-green font-semibold" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}

            <ButtonLink to={header.cta_link} variant="green-dark" className="mt-4 w-full">
              {header.cta_label}
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
