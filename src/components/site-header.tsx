import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ButtonLink, normalizePath } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/use-site-settings";

const TOUR_MENU_ITEMS = [
  { label: "Day Tour", category: "day-tour" },
  { label: "Multi-Day Tour", category: "multi-day" },
  { label: "Holiday Tour", category: "holiday" },
] as const;

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
  const [mobileToursOpen, setMobileToursOpen] = useState(false);
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
          {header.nav.map((item) => {
            const isTours = normalizePath(item.to) === "/tours";
            if (isTours) {
              return (
                <div key={item.to} className="group relative pb-1.5">
                  <button
                    type="button"
                    className={`flex items-center gap-1 transition-colors ${
                      pathname.startsWith("/tours")
                        ? onDark
                          ? "text-white"
                          : "font-semibold text-orange"
                        : onDark
                          ? "text-white/90 hover:text-white"
                          : "text-ink hover:text-green"
                    }`}
                    aria-haspopup="menu"
                  >
                    {item.label}
                    <svg className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {pathname.startsWith("/tours") && onDark ? (
                    <span className="absolute inset-x-0 -bottom-0.5 h-[2px] bg-orange" />
                  ) : null}
                  <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 translate-y-2 pt-4 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="overflow-hidden rounded-xl border border-black/10 bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.2)]" role="menu">
                      {TOUR_MENU_ITEMS.map((tourItem) => (
                        <Link
                          key={tourItem.category}
                          to="/tours"
                          search={{ category: tourItem.category }}
                          className="block rounded-lg px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-orange hover:text-white focus:bg-orange focus:text-white focus:outline-none"
                          role="menuitem"
                          onClick={(event) => event.currentTarget.blur()}
                        >
                          {tourItem.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            return (
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
            );
          })}
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

            {header.nav.map((item) => {
              const isTours = normalizePath(item.to) === "/tours";
              if (isTours) {
                return (
                  <div key={item.to} className="border-b border-rule">
                    <button
                      type="button"
                      onClick={() => setMobileToursOpen((value) => !value)}
                      className={`flex w-full items-center justify-between py-3 text-left text-[1.05rem] font-medium ${pathname.startsWith("/tours") ? "font-semibold text-green" : ""}`}
                      aria-expanded={mobileToursOpen}
                    >
                      {item.label}
                      <svg className={`transition-transform ${mobileToursOpen ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    {mobileToursOpen ? (
                      <div className="mb-3 grid gap-1 pl-3">
                        {TOUR_MENU_ITEMS.map((tourItem) => (
                          <Link
                            key={tourItem.category}
                            to="/tours"
                            search={{ category: tourItem.category }}
                            className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-orange/10 hover:text-orange"
                            onClick={() => setOpen(false)}
                          >
                            {tourItem.label}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={normalizePath(item.to)}
                  className="border-b border-rule py-3 text-[1.05rem] font-medium"
                  activeProps={{ className: "text-green font-semibold" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              );
            })}

            <ButtonLink to={header.cta_link} variant="green-dark" className="mt-4 w-full">
              {header.cta_label}
            </ButtonLink>
          </div>
        </div>
      ) : null}
    </header>
  );
}
