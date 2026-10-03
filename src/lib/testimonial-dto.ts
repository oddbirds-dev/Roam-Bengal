import type { TestimonialDTO, TestimonialImage } from "@/lib/content-types";

/**
 * Row → DTO for a `testimonials` record.
 *
 * Lives outside `site-content.functions.ts`, same reason as `tour-dto.ts`: the admin
 * testimonial editor's live preview maps unsaved form state through this exact function,
 * so the preview cannot drift from what the public page renders from a saved row.
 */
export type TestimonialRowLike = Record<string, unknown>;

export function toTestimonialDTO(row: TestimonialRowLike): TestimonialDTO {
  return {
    id: str(row.id),
    author: str(row.author),
    location: text(row.location),
    headline: text(row.headline),
    quote: str(row.quote),
    tourLabel: text(row.tour_label),
    platform: text(row.platform),
    avatarUrl: text(row.avatar_url),
    avatarAlt: text(row.avatar_alt),
    avatarTitle: text(row.avatar_title),
    avatarDescription: text(row.avatar_description),
    images: imageArr(row.images),
    rating: num(row.rating),
    isFeatured: Boolean(row.is_featured),
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Empty strings collapse to null so the page falls back instead of rendering a blank. */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** `images` is jsonb `{url, alt, title, description}[]`; older rows still carry plain URL
 *  strings. */
function imageArr(value: unknown): TestimonialImage[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) =>
    typeof entry === "string"
      ? { url: entry, alt: "", title: "", description: "" }
      : {
          url: str((entry as Record<string, unknown>)?.url),
          alt: str((entry as Record<string, unknown>)?.alt),
          title: str((entry as Record<string, unknown>)?.title),
          description: str((entry as Record<string, unknown>)?.description),
        },
  );
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
