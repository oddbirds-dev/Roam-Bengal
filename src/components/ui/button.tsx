import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

/**
 * Pill button from the reference CSS: 30px radius, 12/24 padding, 600 weight,
 * .88rem, 1.5px transparent border so outline variants do not shift layout.
 */
export type ButtonVariant =
  | "green"
  | "green-dark"
  | "ember"
  | "outline-light"
  | "outline-dark"
  | "blue"
  | "rust"
  | "whatsapp";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[30px] px-6 py-3 " +
  "font-semibold text-[0.88rem] cursor-pointer border-[1.5px] border-transparent " +
  "transition-all duration-200 text-center";

/* Colours are the reference `.btn-*` rules verbatim. `.btn-green` is a misnomer
   inherited from the source CSS — it paints orange (`--orange`), not green. */
const VARIANTS: Record<ButtonVariant, string> = {
  green: "bg-orange text-white hover:bg-[#D9600F]",
  "green-dark": "bg-orange text-white hover:bg-[#D9600F]",
  // Booking CTA. Hover darkens by the same ratio `.btn-green` uses for `--orange`.
  ember: "bg-ember text-white hover:bg-[#D55E18]",
  "outline-light": "border-white/60 text-white hover:bg-white/15",
  // `.btn-line`
  "outline-dark": "border-green text-green hover:bg-green hover:text-white",
  blue: "bg-[#3EA8E0] text-white hover:bg-[#2384B8]",
  rust: "bg-rust text-white hover:bg-rust-dark",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1FBE5A]",
};

export function buttonClass(variant: ButtonVariant = "green", extra = "") {
  return `${BASE} ${VARIANTS[variant]} ${extra}`.trim();
}

type ButtonLinkProps = {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
  /** Forwarded to the router Link; ignored for external hrefs. */
  search?: Record<string, unknown>;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

/**
 * Renders a router <Link> for in-app paths and a plain <a> for external ones
 * (mailto:, tel:, https://wa.me/…), which the reference designs mix freely.
 */
export function ButtonLink({
  to,
  variant = "green",
  className = "",
  children,
  search,
  ...rest
}: ButtonLinkProps) {
  const cls = buttonClass(variant, className);
  if (isExternal(to)) {
    return (
      <a
        href={to}
        className={cls}
        {...(to.startsWith("http") ? { target: "_blank", rel: "noreferrer noopener" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    // `to` is a runtime string from site_settings, so it cannot be statically checked
    // against the route tree. Unknown paths land on the 404 page.
    <Link to={normalizePath(to) as never} search={search as never} className={cls} {...rest}>
      {children}
    </Link>
  );
}

export function isExternal(to: string) {
  return (
    to.startsWith("http") ||
    to.startsWith("mailto:") ||
    to.startsWith("tel:") ||
    to.startsWith("#")
  );
}

/**
 * Admin-entered paths (site_settings nav/footer/CTA links) are free-text, so a link
 * saved without its leading "/" (e.g. "blog" instead of "/blog") resolves relative to
 * whatever page it's clicked from instead of the intended route, landing on the 404
 * page everywhere except the homepage. Normalize before handing it to `<Link to>`.
 */
export function normalizePath(to: string) {
  const trimmed = to.trim();
  if (!trimmed || isExternal(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `/${trimmed}`;
}

/** Same pill, as a real <button> — for form submits and filter pills. */
export function Button({
  variant = "green",
  className = "",
  children,
  ...rest
}: { variant?: ButtonVariant; className?: string } & ComponentProps<"button">) {
  return (
    <button className={buttonClass(variant, className)} {...rest}>
      {children}
    </button>
  );
}
