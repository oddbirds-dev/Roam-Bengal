import { useSiteSettings } from "@/hooks/use-site-settings";
import { ButtonLink } from "@/components/ui/button";
import { PhotoFrame } from "@/components/ui/photo-frame";
import { FormatText } from "@/components/ui/format-text";
import { GALLERY_FRAMES } from "./palette";
import type { HomeSectionProps } from "./registry";
import { destinationPreviewChannel } from "@/lib/destination-preview";

export function GallerySection(_props: HomeSectionProps) {
  const { gallery } = useSiteSettings();
  const destinationDraft = destinationPreviewChannel.useDraft(true);
  const photos = destinationDraft?.imageUrl
    ? [
        { image_url: destinationDraft.imageUrl, tag: destinationDraft.name || "Destination" },
        ...gallery.photos.filter((photo) => photo.image_url !== destinationDraft.imageUrl),
      ].slice(0, gallery.photos.length || 1)
    : gallery.photos;
  return (
    <section id="section-gallery" className="pt-[90px] pb-[90px]">
      <div className="wrap mb-9 flex flex-wrap items-end justify-between gap-[30px]">
        <div>
          <h2 className="mb-3.5 font-kalam text-[clamp(1.9rem,3.4vw,2.6rem)] leading-[1.3] font-bold">
            <span className="text-green">{gallery.heading_1}</span>
            <br />
            <span className="text-accent">{gallery.heading_2}</span>
          </h2>
          <p className="max-w-[520px] text-[0.92rem] text-muted">
            <FormatText>{gallery.blurb}</FormatText>
          </p>
          <p className="mt-2 max-w-[520px] text-[0.92rem] font-bold text-ink">
            <FormatText>{gallery.bold}</FormatText>
          </p>
        </div>
        <ButtonLink to={gallery.cta_link} variant="green-dark" className="whitespace-nowrap">
          {gallery.cta_label}
        </ButtonLink>
      </div>

      <div className="wrap grid grid-cols-2 gap-[18px] nav:grid-cols-4">
        {photos.map((photo, i) => (
          <PhotoFrame
            key={photo.tag}
            src={photo.image_url}
            alt={photo.tag}
            gradientCss={GALLERY_FRAMES[i % GALLERY_FRAMES.length]}
            placeholderLabel={photo.tag}
            className="group aspect-square rounded-[14px] transition-transform duration-300 hover:-translate-y-1.5"
          >
            <span className="absolute inset-0 z-[2] bg-gradient-to-b from-transparent from-55% to-black/55" />
            <span className="absolute bottom-0 left-0 z-[3] p-3.5 text-[0.78rem] font-semibold text-white">
              {photo.tag}
            </span>
          </PhotoFrame>
        ))}
      </div>
    </section>
  );
}
