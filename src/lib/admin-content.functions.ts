import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  assertAdmin,
  requireSupabaseAuth,
  httpError,
  type SupabaseAuthContext,
} from "@/integrations/supabase/auth-middleware";
import { stripUnsafeHtml } from "@/lib/sanitize";

/**
 * Admin write API.
 *
 * Every function here:
 *   1. runs `requireSupabaseAuth` (verifies the JWT, builds a user-scoped client),
 *   2. validates its input with Zod,
 *   3. calls `assertAdmin(context)` as the first statement of the handler,
 *   4. writes through `context.supabase` — the USER-scoped client, so the
 *      "admins manage X" RLS policy is the final authority.
 *
 * Step 4 is the important one. If step 3 is ever forgotten in a new function, the
 * database still refuses the write. Using the service-role client here would remove that
 * safety net.
 *
 * All mutations are POST, including deletes: TanStack Start reserves GET for cacheable
 * reads.
 */

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const uuid = z.object({ id: z.string().uuid() });
const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens");

/**
 * Every free-text field on every table flows through these two helpers, which makes them
 * the one place to strip script/style/iframe/on*= before it reaches the database. Body
 * copy is rendered as raw HTML by markdown-to-jsx (that is how the toolbar's
 * `<span class>` works), so the scrub happens on write rather than on every render.
 */
const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => (typeof v === "string" ? stripUnsafeHtml(v) : v));
const textArray = (max = 400) =>
  z
    .array(z.string().max(max))
    .default([])
    .transform((v) => v.map(stripUnsafeHtml));

/** Surfaces the Postgres message to the admin UI — acceptable behind the admin gate,
 *  where a constraint name is genuinely the most useful thing to show. */
function orThrow(label: string, error: { message: string; code?: string } | null): void {
  if (!error) return;
  console.error(`[admin] ${label}:`, error.message);
  // 42501 is an RLS/permission denial: the caller passed assertAdmin but the database
  // still said no, which means the app and the policies disagree.
  httpError(error.code === "42501" ? 403 : 400, error.message);
}

// ---------------------------------------------------------------------------
// Tours
// ---------------------------------------------------------------------------

const ItineraryDay = z.object({
  // Starts at 0: day-tour itineraries are numbered steps that begin at zero, and the
  // editor seeds each new row with the current row count.
  day: z.coerce.number().int().min(0).max(365),
  title: z.string().max(200),
  detail: z.string().max(4000),
});

const GlanceEntry = z.object({
  when: z.string().max(120),
  detail: z.string().max(600),
});

const AddonEntry = z.object({
  icon: z.string().max(8).default(""),
  title: z.string().max(200),
  detail: z.string().max(1000),
});

const OfferCard = z.object({
  title: z.string().max(120),
  items: textArray(400),
});

/** One per-group-size rate. `badge` empty means no corner ribbon on that card. */
const PriceTier = z.object({
  label: z.string().max(80),
  persons: z.coerce.number().int().min(1).max(99).nullable().default(null),
  price: z.coerce.number().min(0).max(1_000_000).nullable().default(null),
  note: z.string().max(160).default(""),
  badge: z.string().max(40).default(""),
});

const AccessibilityEntry = z.object({
  label: z.string().max(120),
  detail: z.string().max(1000),
});

const AdviceBlock = z.object({
  title: z.string().max(120),
  items: textArray(600),
});

const TourFaq = z.object({
  question: z.string().max(300),
  answer: z.string().max(3000),
});

/**
 * The effective write contract for `tours`, deliberately stricter than the database:
 * `category` is an exact enum, `duration_days` is bounded, and `slug` is shape-checked.
 */
const TourInput = z.object({
  slug,
  title: z.string().min(1).max(240),
  category: z.enum(["day-tour", "multi-day", "holiday"]),
  hero_image: optionalText(1000),
  images: textArray(1000),
  duration_label: optionalText(120),
  duration_days: z.coerce.number().int().min(1).max(365),
  price_usd: z.coerce.number().min(0).max(1_000_000).nullish(),
  price_bdt: z.coerce.number().min(0).max(100_000_000).nullish(),
  discount_price_usd: z.coerce.number().min(0).max(1_000_000).nullish(),
  child_price_usd: z.coerce.number().min(0).max(1_000_000).nullish(),
  discount_child_price_usd: z.coerce.number().min(0).max(1_000_000).nullish(),
  price_note: optionalText(400),
  price_tiers: z.array(PriceTier).max(8).default([]),
  rating: z.coerce.number().min(0).max(5).nullish(),
  reviews_count: z.coerce.number().int().min(0).default(0),
  destination_label: optionalText(160),
  activity_label: optionalText(160),
  primary_destination_slug: optionalText(160),
  is_featured: z.boolean().default(false),
  activities_count: z.coerce.number().int().min(0).max(999).nullish(),
  group_size_max: z.coerce.number().int().min(1).max(999).nullish(),
  stops_count: z.coerce.number().int().min(0).max(999).nullish(),
  facts: z.record(z.string().max(40), z.string().max(200)).default({}),
  overview: optionalText(8000),
  overview_tip: optionalText(1000),
  highlights: textArray(600),
  glance: z.array(GlanceEntry).default([]),
  addons: z.array(AddonEntry).default([]),
  itinerary: z.array(ItineraryDay).default([]),
  offers: z.array(OfferCard).default([]),
  inclusions: textArray(400),
  exclusions: textArray(400),
  accessibility: z.array(AccessibilityEntry).default([]),
  advice: z.array(AdviceBlock).default([]),
  pledge: textArray(400),
  why_items: textArray(400),
  faqs: z.array(TourFaq).default([]),
  map_embed: optionalText(2000),
  video_url: optionalText(2000),
  related_slugs: z.array(slug).max(12).default([]),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminListTours = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("tours")
      .select(
        "id, slug, title, category, destination_label, duration_days, price_usd, is_published, is_featured, sort_order, updated_at",
      )
      .order("sort_order", { ascending: true });
    orThrow("adminListTours", error);
    return data ?? [];
  });

export const adminGetTour = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { data: row, error } = await context.supabase
      .from("tours")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    orThrow("adminGetTour", error);
    if (!row) httpError(404, "Tour not found");
    return row;
  });

export const adminUpsertTour = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), tour: TourInput }))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    await assertAdmin(context);
    const sb = context.supabase;

    if (data.id) {
      const { data: row, error } = await sb
        .from("tours")
        .update(data.tour as never)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      orThrow("adminUpsertTour(update)", error);
      // An update filtered to zero rows by RLS returns success with no row — that is a
      // silent no-op, not a save, so surface it.
      if (!row) httpError(404, "Tour not found, or you do not have permission to edit it");
      return { id: row.id };
    }

    const { data: row, error } = await sb
      .from("tours")
      .insert(data.tour as never)
      .select("id")
      .maybeSingle();
    orThrow("adminUpsertTour(insert)", error);
    if (!row) httpError(500, "Tour was not created");
    return { id: row.id };
  });

export const adminDeleteTour = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("tours").delete().eq("id", data.id);
    orThrow("adminDeleteTour", error);
    return { ok: true as const };
  });

/** Replaces a tour's theme links (the /tours filter pills) in one shot. */
export const adminSetTourThemes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ tourId: z.string().uuid(), activityIds: z.array(z.string().uuid()).max(20) }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const sb = context.supabase;

    const { error: delError } = await sb
      .from("tour_activities")
      .delete()
      .eq("tour_id", data.tourId);
    orThrow("adminSetTourThemes(clear)", delError);

    if (data.activityIds.length) {
      const rows = data.activityIds.map((activity_id) => ({
        tour_id: data.tourId,
        activity_id,
      }));
      const { error } = await sb.from("tour_activities").insert(rows);
      orThrow("adminSetTourThemes(insert)", error);
    }
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

const DestinationInput = z.object({
  slug,
  name: z.string().min(1).max(200),
  tagline: optionalText(300),
  region: optionalText(120),
  image_url: optionalText(1000),
  intro: optionalText(4000),
  highlights: textArray(400),
  best_time: optionalText(200),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminListDestinations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("destinations")
      .select("*")
      .order("sort_order", { ascending: true });
    orThrow("adminListDestinations", error);
    return data ?? [];
  });

export const adminUpsertDestination = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), destination: DestinationInput }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return upsert(context, "destinations", data.id, data.destination);
  });

export const adminDeleteDestination = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "destinations", data.id);
  });

// ---------------------------------------------------------------------------
// Activities (the /tours filter themes)
// ---------------------------------------------------------------------------

const ActivityInput = z.object({
  slug,
  name: z.string().min(1).max(120),
  description: optionalText(1000),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminListActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("activities")
      .select("*")
      .order("sort_order", { ascending: true });
    orThrow("adminListActivities", error);
    return data ?? [];
  });

export const adminUpsertActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), activity: ActivityInput }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return upsert(context, "activities", data.id, data.activity);
  });

export const adminDeleteActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "activities", data.id);
  });

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

const PostInput = z.object({
  slug,
  title: z.string().min(1).max(240),
  excerpt: optionalText(1000),
  body: textArray(8000),
  category: optionalText(80),
  date_label: optionalText(60),
  read_time: optionalText(40),
  cover_image: optionalText(1000),
  author_name: optionalText(120),
  author_role: optionalText(120),
  author_avatar: optionalText(1000),
  related_slugs: z.array(slug).max(12).default([]),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select("*")
      .order("sort_order", { ascending: true });
    orThrow("adminListPosts", error);
    return data ?? [];
  });

export const adminUpsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), post: PostInput }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return upsert(context, "blog_posts", data.id, data.post);
  });

export const adminDeletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "blog_posts", data.id);
  });

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

const TestimonialInput = z.object({
  author: z.string().min(1).max(160),
  location: optionalText(120),
  headline: optionalText(400),
  quote: z.string().min(1).max(4000),
  tour_label: optionalText(200),
  platform: z.enum(["tripadvisor", "google", "trustpilot", "facebook", "direct"]).nullish(),
  avatar_url: optionalText(1000),
  images: textArray(1000),
  rating: z.coerce.number().int().min(1).max(5).nullish(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminListTestimonials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    orThrow("adminListTestimonials", error);
    return data ?? [];
  });

export const adminUpsertTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), testimonial: TestimonialInput }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return upsert(context, "testimonials", data.id, data.testimonial);
  });

export const adminDeleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "testimonials", data.id);
  });

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const FaqInput = z.object({
  question: z.string().min(1).max(400),
  answer: z.string().min(1).max(4000),
  category: optionalText(80),
  is_published: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export const adminListFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("faqs")
      .select("*")
      .order("sort_order", { ascending: true });
    orThrow("adminListFaqs", error);
    return data ?? [];
  });

export const adminUpsertFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ id: z.string().uuid().optional(), faq: FaqInput }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return upsert(context, "faqs", data.id, data.faq);
  });

export const adminDeleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "faqs", data.id);
  });

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

const JsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValue),
    z.record(z.string(), JsonValue),
  ]),
);

export const adminListSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("site_settings")
      .select("*")
      .order("key", { ascending: true });
    orThrow("adminListSettings", error);
    return data ?? [];
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      key: z.string().min(1).max(120),
      value: z.record(z.string(), JsonValue),
      description: optionalText(400),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert(
        {
          key: data.key,
          value: data.value as never,
          ...(data.description === undefined ? {} : { description: data.description }),
        },
        { onConflict: "key" },
      );
    orThrow("adminSaveSetting", error);
    return { ok: true as const };
  });

export const adminDeleteSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ key: z.string().min(1).max(120) }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("site_settings")
      .delete()
      .eq("key", data.key);
    orThrow("adminDeleteSetting", error);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Inquiries (the lead queue)
// ---------------------------------------------------------------------------

export const adminListInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    orThrow("adminListInquiries", error);
    return data ?? [];
  });

export const adminUpdateInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "read", "handled"]).optional(),
      admin_note: optionalText(4000),
    }),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);

    const patch: Record<string, unknown> = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      // Stamp when it reaches `handled`, and clear the stamp if it moves back out —
      // otherwise a reopened lead keeps a stale "handled at" date.
      patch.handled_at = data.status === "handled" ? new Date().toISOString() : null;
    }
    if (data.admin_note !== undefined) patch.admin_note = data.admin_note;
    if (Object.keys(patch).length === 0) httpError(400, "Nothing to update");

    const { data: row, error } = await context.supabase
      .from("inquiries")
      .update(patch as never)
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    orThrow("adminUpdateInquiry", error);
    if (!row) httpError(404, "Inquiry not found");
    return { ok: true as const };
  });

export const adminDeleteInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "inquiries", data.id);
  });

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

export const adminListSubscribers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    orThrow("adminListSubscribers", error);
    return data ?? [];
  });

export const adminDeleteSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(uuid)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    return remove(context, "newsletter_subscribers", data.id);
  });

// ---------------------------------------------------------------------------
// Link targets
// ---------------------------------------------------------------------------

/**
 * Everything the link picker can offer, minus the static pages (those are derived in
 * `link-targets.ts` and need no round trip).
 *
 * Reads through the admin-scoped client on purpose, so unpublished rows come back too —
 * an editor writing a post should be able to link to a tour that goes live the same day.
 * The picker badges them "Draft". Four columns over a few dozen rows: no pagination.
 */
export const adminListLinkTargets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const [tours, posts] = await Promise.all([
      context.supabase
        .from("tours")
        .select("slug, title, category, is_published")
        .order("title", { ascending: true }),
      context.supabase
        .from("blog_posts")
        .select("slug, title, category, is_published")
        .order("title", { ascending: true }),
    ]);
    orThrow("adminListLinkTargets(tours)", tours.error);
    orThrow("adminListLinkTargets(posts)", posts.error);
    return { tours: tours.data ?? [], posts: posts.data ?? [] };
  });

// ---------------------------------------------------------------------------
// Shared insert/update/delete
// ---------------------------------------------------------------------------

async function upsert(
  context: SupabaseAuthContext,
  table: string,
  id: string | undefined,
  values: unknown,
): Promise<{ id: string }> {
  const sb = context.supabase;

  if (id) {
    const { data: row, error } = await sb
      .from(table as never)
      .update(values as never)
      .eq("id", id)
      .select("id")
      .maybeSingle();
    orThrow(`upsert(${table}, update)`, error);
    if (!row) httpError(404, `Not found in ${table}, or you cannot edit it`);
    return { id: (row as { id: string }).id };
  }

  const { data: row, error } = await sb
    .from(table as never)
    .insert(values as never)
    .select("id")
    .maybeSingle();
  orThrow(`upsert(${table}, insert)`, error);
  if (!row) httpError(500, `Row was not created in ${table}`);
  return { id: (row as { id: string }).id };
}

async function remove(
  context: SupabaseAuthContext,
  table: string,
  id: string,
): Promise<{ ok: true }> {
  const { error } = await context.supabase
    .from(table as never)
    .delete()
    .eq("id", id);
  orThrow(`remove(${table})`, error);
  return { ok: true };
}
