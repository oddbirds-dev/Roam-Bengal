import type { BlogPostDTO } from "@/lib/content-types";

/**
 * Row → DTO for a `blog_posts` record.
 *
 * Lives outside `site-content.functions.ts`, same reason as `tour-dto.ts`: the admin post
 * editor's live preview maps unsaved form state through this exact function, so the
 * preview cannot drift from what the public page renders from a saved row.
 */
export type PostRowLike = Record<string, unknown>;

export function toPostDTO(row: PostRowLike): BlogPostDTO {
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    excerpt: text(row.excerpt),
    body: strArr(row.body),
    category: text(row.category),
    dateLabel: text(row.date_label),
    readTime: text(row.read_time),
    coverImage: text(row.cover_image),
    authorName: text(row.author_name),
    authorRole: text(row.author_role),
    authorAvatar: text(row.author_avatar),
    isFeatured: Boolean(row.is_featured),
    relatedSlugs: strArr(row.related_slugs),
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Empty strings collapse to null so the page falls back instead of rendering a blank. */
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function strArr(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}
