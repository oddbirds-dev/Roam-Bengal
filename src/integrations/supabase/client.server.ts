import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseFetch, supabaseUrl } from "./client";
import type { Database } from "./types";

/**
 * Service-role Supabase client. **RLS is bypassed entirely.**
 *
 * NEVER import this at the top level of a `*.functions.ts` or route file — those are
 * bundled for the browser and the key would ship with them. Import it dynamically
 * *inside* a handler, or only from another `.server.ts` module:
 *
 *   const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
 *
 * Nothing in the public site needs this: `submitInquiry` and `subscribeNewsletter`
 * insert through the anon client so the RLS `WITH CHECK` clause stays the authority.
 * It exists for admin operations that legitimately must see across users — creating
 * auth users, and reading the inquiry queue if that ever moves off the user-scoped
 * client.
 */

function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Get it from the Supabase dashboard " +
        "(Settings → API) and supply it at runtime — never as a build arg, because " +
        "build args are baked into the image.",
    );
  }
  return key;
}

let adminClient: SupabaseClient<Database> | undefined;

function getAdminClient(): SupabaseClient<Database> {
  if (!adminClient) {
    const key = serviceRoleKey();
    adminClient = createClient<Database>(supabaseUrl(), key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: createSupabaseFetch(key) },
    });
  }
  return adminClient;
}

/** Lazy proxy so importing this module never throws when the key is absent. */
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getAdminClient(), prop, receiver);
  },
});

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
