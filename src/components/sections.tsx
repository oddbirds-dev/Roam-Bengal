import type { ReactNode } from "react";

/** Kicker + centred heading + short gold rule, repeated across the reference designs. */
export function SectionHead({
  kicker,
  children,
  className = "",
}: {
  kicker?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
      <h2 className="mb-4 font-display text-[clamp(1.9rem,3.4vw,2.5rem)] leading-tight text-ink">
        {children}
      </h2>
      <Divider />
    </div>
  );
}

/** 70×4 orange→gold rule under every centred section heading. */
export function Divider() {
  return (
    <div className="mx-auto mb-11 h-1 w-[70px] rounded-[2px] bg-gradient-to-r from-orange to-gold" />
  );
}

export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`mb-2 block text-[0.78rem] font-bold tracking-[0.14em] text-orange uppercase ${className}`}
    >
      {children}
    </span>
  );
}

/** Star row. Renders filled/empty to the rating rather than a hardcoded "★★★★★". */
export function Stars({ rating }: { rating: number | null }) {
  const filled = Math.round(rating ?? 5);
  return (
    <span className="tracking-[2px] text-gold" aria-label={`${filled} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="text-gold/30">{"★".repeat(Math.max(0, 5 - filled))}</span>
    </span>
  );
}

/** Circular initial used where the designs show an avatar placeholder. */
export function InitialAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-green text-[0.8rem] font-semibold text-white ${className}`}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
