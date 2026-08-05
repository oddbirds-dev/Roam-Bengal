import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type SeoMetaRow = Database["public"]["Tables"]["seo_meta"]["Row"];

const GetSeoMetaSchema = z.object({
  entity_type: z.enum(["tour", "destination", "blog", "activity", "page"]),
  entity_id: z.string(),
});

/**
 * Fetches SEO metadata for a specific entity.
 * Uses the anon client since `seo_meta` allows public reads.
 */
export const getSeoMeta = createServerFn({ method: "GET" })
  .validator(GetSeoMetaSchema)
  .handler(async ({ data }): Promise<SeoMetaRow | null> => {
    // We cast to `never` because types.ts might be slightly behind the live DB schema in some environments,
    // though it seems to have `seo_meta` in this branch.
    const { data: row, error } = await serverClient()
      .from("seo_meta" as never)
      .select("*")
      .eq("entity_type", data.entity_type)
      .eq("entity_id", data.entity_id)
      .maybeSingle();

    if (error) {
      console.error("[seo] getSeoMeta:", error.message);
      return null;
    }
    return row as SeoMetaRow | null;
  });
