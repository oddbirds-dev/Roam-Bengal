import { createFileRoute } from "@tanstack/react-router";
import { queryOne } from "@/integrations/mysql/client.server";

export const Route = createFileRoute("/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const media = await queryOne<{ content_type: string; bytes: Buffer }>(
          "SELECT content_type, bytes FROM media WHERE id = ? LIMIT 1",
          [params.id],
        );
        if (!media) return new Response("Not found", { status: 404 });
        return new Response(new Uint8Array(media.bytes), {
          headers: { "Content-Type": media.content_type, "Cache-Control": "public, max-age=31536000, immutable" },
        });
      },
    },
  },
});
