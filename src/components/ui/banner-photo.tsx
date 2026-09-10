import { PhotoFrame } from "@/components/ui/photo-frame";

/**
 * Optional hero photo behind a page banner.
 *
 * Every page banner ships with its own painted background (a gradient, `bg-cream`,
 * `bg-green-dark`). A photo is opt-in per page from the admin panel — Settings →
 * the page → "Banner photo" — so this renders nothing at all when the field is
 * empty and the banner keeps the look it shipped with.
 *
 * Callers own the positioning context and the text colour swap; this only paints
 * the two layers that sit behind the copy: the photo, then a scrim dark enough to
 * keep white text readable over an arbitrary upload.
 */
export function BannerPhoto({
  src,
  alt,
  overlayClassName = "bg-black/60",
}: {
  src?: string | null;
  alt: string;
  /** Scrim over the photo. Raise the opacity for banners with small or thin type. */
  overlayClassName?: string;
}) {
  if (!src?.trim()) return null;

  return (
    <>
      <PhotoFrame
        src={src}
        alt={alt}
        gradientCss="transparent"
        priority
        className="absolute inset-0 z-0 h-full w-full"
      />
      <div className={`absolute inset-0 z-0 ${overlayClassName}`} aria-hidden="true" />
    </>
  );
}

/** True when a banner photo is set, so callers can swap their banner's text colours. */
export function hasBannerPhoto(src?: string | null): boolean {
  return Boolean(src?.trim());
}
