import { useState } from "react";

/**
 * Every image in reference design/ is a placeholder: a gradient-filled frame, a visible
 * "📷 images/foo.jpg" label, and <img onerror="this.style.display='none'">.
 *
 * This reproduces that behaviour with two differences the PRD calls for (§12):
 *   - `alt` is required, not optional
 *   - the "📷 path" debug label renders in development only
 */

export const FRAME_GRADIENTS = {
  green: "linear-gradient(160deg,#22B57A,#0B6B47)",
  deepGreen: "linear-gradient(160deg,#1E5F3B,#0B2818)",
  orange: "linear-gradient(160deg,#F0791E,#C4390E)",
  brown: "linear-gradient(160deg,#8C6A3D,#5A3E1B)",
  teal: "linear-gradient(160deg,#3E7A6E,#123D30)",
  gold: "linear-gradient(160deg,#F2B705,#8C6A3D)",
} as const;

export type FrameGradient = keyof typeof FRAME_GRADIENTS;

/** Stable gradient per slug, so a tour keeps the same fallback colour across pages. */
export function gradientFor(seed: string): FrameGradient {
  const keys = Object.keys(FRAME_GRADIENTS) as FrameGradient[];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return keys[Math.abs(hash) % keys.length]!;
}

interface PhotoFrameProps {
  src?: string | null;
  alt: string;
  gradient?: FrameGradient;
  /** Raw CSS gradient, for the one-off frames the reference styles inline. */
  gradientCss?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Hero images should not be lazy — it delays LCP. */
  priority?: boolean;
  /** Shown in dev when `src` is empty, mirroring the reference placeholder label. */
  placeholderLabel?: string;
  children?: React.ReactNode;
}

export function PhotoFrame({
  src,
  alt,
  gradient = "green",
  gradientCss,
  className = "",
  style,
  priority = false,
  placeholderLabel,
  children,
}: PhotoFrameProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  // The frame needs a positioned box for the absolute <img>, but Tailwind emits
  // `.relative` after `.absolute`, so hardcoding it would silently beat a caller's
  // `absolute`/`fixed` no matter the class order. Only add it when nothing else sets one.
  const positioned = /(?:^|\s)(?:absolute|fixed|sticky)(?:\s|$)/.test(className);

  return (
    <div
      className={`${positioned ? "" : "relative"} overflow-hidden ${className}`}
      style={{ background: gradientCss ?? FRAME_GRADIENTS[gradient], ...style }}
    >
      {import.meta.env.DEV && !showImage && placeholderLabel ? (
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-3 text-center text-[0.66rem] font-medium tracking-wide text-white/80">
          📷 {placeholderLabel}
        </span>
      ) : null}

      {showImage ? (
        <img
          src={src!}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {children}
    </div>
  );
}
