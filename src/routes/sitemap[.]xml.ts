import { createFileRoute } from "@tanstack/react-router";
import { listSitemapEntries } from "@/lib/seo.functions";
import { SITE_URL } from "@/lib/seo-head";
import { STATIC_LINK_TARGETS } from "@/lib/link-targets";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const dyn = await listSitemapEntries();
        const now = new Date().toISOString();
        const urls: Array<{ loc: string; lastmod: string; priority: string }> = [];

        for (const page of STATIC_LINK_TARGETS) {
          urls.push({
            loc: `${SITE_URL}${page.path}`,
            lastmod: now,
            priority: page.path === "/" ? "1.0" : "0.7",
          });
        }
        for (const t of dyn.tours) {
          urls.push({
            loc: `${SITE_URL}/tours/${t.slug}`,
            lastmod: t.updated_at ?? now,
            priority: "0.8",
          });
        }
        for (const p of dyn.posts) {
          urls.push({
            loc: `${SITE_URL}/blog/${p.slug}`,
            lastmod: p.updated_at ?? now,
            priority: "0.6",
          });
        }
        const body =
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          urls
            .map(
              (u) =>
                `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`,
            )
            .join("\n") +
          `\n</urlset>`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
