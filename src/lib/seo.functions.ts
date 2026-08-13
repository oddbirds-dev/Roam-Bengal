import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "@/integrations/supabase/client";
import {
  assertAdmin,
  requireSupabaseAuth,
  httpError,
} from "@/integrations/supabase/auth-middleware";
import { STATIC_LINK_TARGETS } from "@/lib/link-targets";
import type { Database } from "@/integrations/supabase/types";

export type SeoMetaRow = Database["public"]["Tables"]["seo_meta"]["Row"];
export type RedirectRow = Database["public"]["Tables"]["redirects"]["Row"];

/** Surfaces the Postgres message to the admin UI — acceptable behind the admin gate. */
function orThrow(label: string, error: { message: string; code?: string } | null): void {
  if (!error) return;
  console.error(`[seo] ${label}:`, error.message);
  httpError(error.code === "42501" ? 403 : 400, error.message);
}

// Kept broad (matches the original schema) even though only tour/blog/page currently have
// a public page to attach meta tags to — destinations and activities have no detail route
// in this app (activities are just a `/tours?theme=` filter), so they're never surfaced as
// admin SEO targets below, but a stray existing row with that entity_type still validates.
const ENTITY_TYPES = ["tour", "destination", "blog", "activity", "page"] as const;
export type SeoEntityType = (typeof ENTITY_TYPES)[number];

const GetSeoMetaSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string(),
});

/**
 * Fetches SEO metadata for a specific entity.
 * Uses the anon client since `seo_meta` allows public reads.
 */
export const getSeoMeta = createServerFn({ method: "GET" })
  .validator(GetSeoMetaSchema)
  .handler(async ({ data }): Promise<SeoMetaRow | null> => {
    const { data: row, error } = await serverClient()
      .from("seo_meta")
      .select("*")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .maybeSingle();

    if (error) {
      console.error("[seo] getSeoMeta:", error.message);
      return null;
    }
    return row;
  });

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

export interface SitemapEntry {
  slug: string;
  updated_at: string | null;
}

export interface SitemapEntries {
  tours: SitemapEntry[];
  posts: SitemapEntry[];
}

/**
 * Public — slugs + `updated_at` for every route the sitemap needs to enumerate.
 *
 * Activities have no detail route of their own (they're a `/tours?theme=` filter, not a
 * page), so they're intentionally not part of the sitemap.
 */
export const listSitemapEntries = createServerFn({ method: "GET" }).handler(
  async (): Promise<SitemapEntries> => {
    const client = serverClient();
    const [tours, posts] = await Promise.all([
      client
        .from("tours")
        .select("slug, updated_at")
        .eq("is_published", true),
      client
        .from("blog_posts")
        .select("slug, updated_at")
        .eq("is_published", true),
    ]);
    return {
      tours: tours.data ?? [],
      posts: posts.data ?? [],
    };
  },
);

// ---------------------------------------------------------------------------
// Robots
// ---------------------------------------------------------------------------

/** Public — the raw `robots.txt` body, if an admin has set one. */
export const getRobotsPublic = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ content: string | null }> => {
    const { data } = await serverClient()
      .from("site_settings")
      .select("value")
      .eq("key", "robots")
      .maybeSingle();
    const value = data?.value as { content?: string } | null;
    return { content: typeof value?.content === "string" ? value.content : null };
  },
);

// ---------------------------------------------------------------------------
// SEO targets (admin)
// ---------------------------------------------------------------------------

export interface SeoTarget {
  entity_type: SeoEntityType;
  entity_id: string;
  title: string;
  path: string;
  seo: SeoMetaRow | null;
}

/**
 * Admin — every tour/post/static page joined with its `seo_meta` row, if any.
 *
 * Activities aren't included: they have no detail route of their own (see
 * `listSitemapEntries`), so there's no page for an SEO row to take effect on.
 */
export const adminListAllSeoTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SeoTarget[]> => {
    await assertAdmin(context);

    const [tours, posts, seoRows] = await Promise.all([
      context.supabase.from("tours").select("id, slug, title").order("title"),
      context.supabase.from("blog_posts").select("id, slug, title").order("title"),
      context.supabase.from("seo_meta").select("*"),
    ]);
    orThrow("adminListAllSeoTargets(tours)", tours.error);
    orThrow("adminListAllSeoTargets(posts)", posts.error);
    orThrow("adminListAllSeoTargets(seo_meta)", seoRows.error);

    const seoByKey = new Map<string, SeoMetaRow>();
    for (const row of seoRows.data ?? []) {
      seoByKey.set(`${row.entity_type}:${row.entity_id}`, row);
    }
    const lookup = (type: SeoEntityType, id: string) => seoByKey.get(`${type}:${id}`) ?? null;

    const targets: SeoTarget[] = [];
    for (const t of tours.data ?? []) {
      targets.push({
        entity_type: "tour",
        entity_id: t.id,
        title: t.title,
        path: `/tours/${t.slug}`,
        seo: lookup("tour", t.id),
      });
    }
    for (const p of posts.data ?? []) {
      targets.push({
        entity_type: "blog",
        entity_id: p.id,
        title: p.title,
        path: `/blog/${p.slug}`,
        seo: lookup("blog", p.id),
      });
    }
    for (const page of STATIC_LINK_TARGETS) {
      if (page.kind !== "page") continue;
      targets.push({
        entity_type: "page",
        entity_id: page.path,
        title: page.label,
        path: page.path,
        seo: lookup("page", page.path),
      });
    }
    return targets;
  });

const SaveSeoMetaSchema = z.object({
  entity_type: z.enum(ENTITY_TYPES),
  entity_id: z.string().min(1).max(200),
  focus_keyphrase: z.string().max(160).nullish(),
  extra_keyphrases: z.array(z.string().max(80)).max(20).default([]),
  synonyms: z.array(z.string().max(80)).max(20).default([]),
  meta_title: z.string().max(160).nullish(),
  meta_description: z.string().max(320).nullish(),
  canonical_url: z.string().max(500).nullish(),
  og_title: z.string().max(160).nullish(),
  og_description: z.string().max(320).nullish(),
  og_image: z.string().max(500).nullish(),
  twitter_title: z.string().max(160).nullish(),
  twitter_description: z.string().max(320).nullish(),
  twitter_image: z.string().max(500).nullish(),
  robots_noindex: z.boolean().default(false),
  cornerstone: z.boolean().default(false),
  schema_type: z.string().max(60).nullish(),
});

/** Admin — upsert on `(entity_type, entity_id)`. */
export const adminSaveSeoMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(SaveSeoMetaSchema)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("seo_meta")
      .upsert(data, { onConflict: "entity_type,entity_id" });
    orThrow("adminSaveSeoMeta", error);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Redirects (admin)
// ---------------------------------------------------------------------------

export const adminListRedirects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RedirectRow[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("redirects")
      .select("*")
      .order("from_path", { ascending: true });
    orThrow("adminListRedirects", error);
    return data ?? [];
  });

const SaveRedirectSchema = z.object({
  id: z.string().uuid().optional(),
  from_path: z
    .string()
    .min(1)
    .max(300)
    .regex(/^\//, "from_path must start with /"),
  to_path: z.string().min(1).max(500),
  status_code: z.union([z.literal(301), z.literal(302)]).default(301),
});

export const adminSaveRedirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(SaveRedirectSchema)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { id, ...row } = data;
    const { error } = id
      ? await context.supabase.from("redirects").update(row).eq("id", id)
      : await context.supabase.from("redirects").insert(row);
    orThrow("adminSaveRedirect", error);
    return { ok: true as const };
  });

export const adminDeleteRedirect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("redirects").delete().eq("id", data.id);
    orThrow("adminDeleteRedirect", error);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Orphaned posts (admin)
// ---------------------------------------------------------------------------

export interface OrphanedPost {
  id: string;
  slug: string;
  title: string;
}

/** Admin — blog posts that no other post's body links to via `/blog/<slug>`. */
export const adminOrphanedPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OrphanedPost[]> => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select("id, slug, title, body");
    orThrow("adminOrphanedPosts", error);
    const posts = data ?? [];

    const bodies = posts.map((p) => ({
      id: p.id,
      text: Array.isArray(p.body) ? p.body.filter((b) => typeof b === "string").join("\n") : "",
    }));

    return posts
      .filter((post) => {
        const mention = `/blog/${post.slug}`;
        return !bodies.some((b) => b.id !== post.id && b.text.includes(mention));
      })
      .map(({ id, slug, title }) => ({ id, slug, title }));
  });
