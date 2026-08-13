import { createFileRoute } from "@tanstack/react-router";
import { getRobotsPublic } from "@/lib/seo.functions";
import { SITE_URL } from "@/lib/seo-head";

const DEFAULT_ROBOTS = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /auth\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const { content } = await getRobotsPublic();
        const body = content && content.trim().length > 0 ? content : DEFAULT_ROBOTS;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
