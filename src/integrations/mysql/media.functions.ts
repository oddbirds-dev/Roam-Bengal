import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { assertAdmin, requireMySqlAuth } from "./auth-middleware";
import { execute } from "./client.server";

const UploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]),
  base64: z.string().min(1).max(11_200_000),
});

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireMySqlAuth])
  .validator(UploadSchema)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const bytes = Buffer.from(data.base64, "base64");
    if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new Error("Images must be no larger than 8 MB");
    const id = randomUUID();
    await execute("INSERT INTO media (id, filename, content_type, bytes) VALUES (?, ?, ?, ?)", [id, data.filename, data.contentType, bytes]);
    return { url: `/media/${id}` };
  });
