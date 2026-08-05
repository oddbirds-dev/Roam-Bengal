import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toTourDTO } from "@/lib/tour-dto";
import type {
  ActivityDTO,
  BlogPostDTO,
  FaqDTO,
  JsonValue,
  SettingsMap,
  TestimonialDTO,
  TourDTO,
} from "@/lib/content-types";

type TourRow = Database["public"]["Tables"]["tours"]["Row"];
type PostRow = Database["public"]["Tables"]["blog_posts"]["Row"];
type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
type FaqRow = Database["public"]["Tables"]["faqs"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activities"]["Row"];

/**
 * Postgres `numeric` arrives over the wire as a string, and a column from a migration
 * that has not been applied comes back `undefined` — which slips past a plain
 * `!== null` guard and becomes NaN. Treat both `undefined` and non-finite as "no value"
 * so the UI falls back instead of rendering NaN.
 */
function num(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function arr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function strArr(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Tours map through the shared mapper — the admin preview runs the same code. */
const toTour = (row: TourRow): TourDTO => toTourDTO(row);

function toPost(row: PostRow): BlogPostDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: arr<string>(row.body),
    category: row.category,
    dateLabel: row.date_label,
    readTime: row.read_time,
    coverImage: row.cover_image,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorAvatar: row.author_avatar,
    isFeatured: Boolean(row.is_featured),
  };
}

function toTestimonial(row: TestimonialRow): TestimonialDTO {
  return {
    id: row.id,
    author: row.author,
    location: row.location,
    headline: row.headline,
    quote: row.quote,
    tourLabel: row.tour_label,
    platform: row.platform,
    avatarUrl: row.avatar_url,
    images: strArr(row.images),
    rating: num(row.rating),
    isFeatured: Boolean(row.is_featured),
  };
}

function toFaq(row: FaqRow): FaqDTO {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
  };
}

function toActivity(row: ActivityRow): ActivityDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
  };
}

/** Supabase errors on public reads are logged server-side, never surfaced raw. */
function unwrap<T>(
  label: string,
  data: T[] | null,
  error: { message: string } | null,
): T[] {
  if (error) {
    console.error(`[site-content] ${label}:`, error.message);
    return [];
  }
  return data ?? [];
}

const slugInput = z.object({ slug: z.string().min(1).max(200) });

export const listPublishedTours = createServerFn({ method: "GET" }).handler(
  async (): Promise<TourDTO[]> => {
    const { data, error } = await serverClient()
      .from("tours")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return unwrap("listPublishedTours", data, error).map(toTour);
  },
);

export const getTourBySlug = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data: { slug } }): Promise<TourDTO | null> => {
    const { data, error } = await serverClient()
      .from("tours")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) {
      console.error("[site-content] getTourBySlug:", error.message);
      return null;
    }
    return data ? toTour(data) : null;
  });

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<BlogPostDTO[]> => {
    const { data, error } = await serverClient()
      .from("blog_posts")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return unwrap("listPublishedPosts", data, error).map(toPost);
  },
);

export const getPostBySlug = createServerFn({ method: "GET" })
  .validator(slugInput)
  .handler(async ({ data: { slug } }): Promise<BlogPostDTO | null> => {
    const { data, error } = await serverClient()
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) {
      console.error("[site-content] getPostBySlug:", error.message);
      return null;
    }
    return data ? toPost(data) : null;
  });

export const listPublishedTestimonials = createServerFn({ method: "GET" }).handler(
  async (): Promise<TestimonialDTO[]> => {
    const { data, error } = await serverClient()
      .from("testimonials")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return unwrap("listPublishedTestimonials", data, error).map(toTestimonial);
  },
);

export const listPublishedFaqs = createServerFn({ method: "GET" }).handler(
  async (): Promise<FaqDTO[]> => {
    const { data, error } = await serverClient()
      .from("faqs")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    return unwrap("listPublishedFaqs", data, error).map(toFaq);
  },
);

export const listActivities = createServerFn({ method: "GET" }).handler(
  async (): Promise<ActivityDTO[]> => {
    const { data, error } = await serverClient()
      .from("activities")
      .select("*")
      .order("sort_order", { ascending: true });
    return unwrap("listActivities", data, error).map(toActivity);
  },
);

/**
 * Tour slugs grouped by activity slug — this is what drives the /tours filter pills.
 * `activities` is the theme axis (wildlife, nature, beach, hills, culture);
 * `tours.category` is the unrelated duration axis (day-tour, multi-day, holiday).
 */
export const listTourThemes = createServerFn({ method: "GET" }).handler(
  async (): Promise<Record<string, string[]>> => {
    const { data, error } = await serverClient()
      .from("tour_activities")
      .select("tours(slug), activities(slug)");
    if (error) {
      console.error("[site-content] listTourThemes:", error.message);
      return {};
    }
    const map: Record<string, string[]> = {};
    for (const row of data ?? []) {
      const tourSlug = (row.tours as { slug: string } | null)?.slug;
      const activitySlug = (row.activities as { slug: string } | null)?.slug;
      if (!tourSlug || !activitySlug) continue;
      (map[tourSlug] ??= []).push(activitySlug);
    }
    return map;
  },
);

export const getAllSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SettingsMap> => {
    const { data, error } = await serverClient()
      .from("site_settings")
      .select("key, value");
    if (error) {
      console.error("[site-content] getAllSettings:", error.message);
      return {};
    }
    const map: SettingsMap = {};
    for (const row of data ?? []) {
      if (row.value && typeof row.value === "object" && !Array.isArray(row.value)) {
        map[row.key] = row.value as JsonValue;
      }
    }
    return map;
  },
);
