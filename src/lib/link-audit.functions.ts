import { createServerFn } from "@tanstack/react-start";
import { assertAdmin, requireMySqlAuth as requireSupabaseAuth } from "@/integrations/mysql/auth-middleware";
import {
  buildLinkGraph,
  buildReport,
  collectBodies,
  type ContentRow,
  type LinkReport,
} from "@/lib/link-graph";

/**
 * Internal-link health for the whole site.
 *
 * The graph is built server-side on purpose: it needs every string of every tour, post and
 * settings blob, and shipping that to the browser to compute a few hundred report rows
 * would be absurd. Only the report crosses the wire.
 */
export const adminLinkAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<LinkReport> => {
    await assertAdmin(context);

    const [tours, posts, settings] = await Promise.all([
      context.supabase.from("tours").select("*"),
      context.supabase.from("blog_posts").select("*"),
      context.supabase.from("site_settings").select("key, value"),
    ]);

    // A partial read would report healthy pages as broken, which is worse than no report.
    const failure = tours.error ?? posts.error ?? settings.error;
    if (failure) {
      console.error("[link-audit]", failure.message);
      throw new Error(`Could not read content for the link audit: ${failure.message}`);
    }

    const tourRows = (tours.data ?? []) as unknown as ContentRow[];
    const postRows = (posts.data ?? []) as unknown as ContentRow[];

    const settingsMap: Record<string, unknown> = {};
    for (const row of settings.data ?? []) settingsMap[row.key] = row.value;

    const graph = buildLinkGraph({ tours: tourRows, posts: postRows, settings: settingsMap });
    return buildReport(graph, collectBodies(tourRows, postRows));
  });
