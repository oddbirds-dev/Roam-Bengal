import { Link } from "@tanstack/react-router";
import type { ComponentProps, ReactNode } from "react";

/**
 * Pill button from the reference CSS: 30px radius, 12/24 padding, 600 weight,
 * .88rem, 1.5px transparent border so outline variants do not shift layout.
 */
export type ButtonVariant =
  | "green"
  | "green-dark"
  | "outline-light"
  | "outline-dark"
  | "rust"
  | "whatsapp";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[30px] px-6 py-3 " +
  "font-semibold text-[0.88rem] cursor-pointer border-[1.5px] border-transparent " +
  "transition-all duration-200 text-center";

const VARIANTS: Record<ButtonVariant, string> = {
  green: "bg-green-bright text-white hover:bg-green-deep",
  "green-dark": "bg-green-dark text-white hover:bg-green",
  "outline-light": "border-white/70 text-white hover:bg-white hover:text-green-dark",
  "outline-dark": "border-green-dark text-green-dark hover:bg-green-dark hover:text-white",
  rust: "bg-rust text-white hover:bg-rust-dark",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1da851]",
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
    <Link to={to as never} search={search as never} className={cls} {...rest}>
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
