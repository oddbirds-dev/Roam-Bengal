import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser-side Supabase client, anon/publishable key, RLS enforced.
 *
 * Reads `import.meta.env` first and falls back to `process.env` so the same module works
 * in the browser and during SSR.
 */

function readEnv(viteKey: string, nodeKey: string): string | undefined {
  const fromVite = (import.meta.env as Record<string, string | undefined>)[viteKey];
  if (fromVite) return fromVite;
  if (typeof process !== "undefined" && process.env) return process.env[nodeKey];
  return undefined;
}

export function supabaseUrl(): string {
  const url = readEnv("VITE_SUPABASE_URL", "SUPABASE_URL");
  if (!url) {
    throw new Error(
      "Missing Supabase URL. Set VITE_SUPABASE_URL (browser) and SUPABASE_URL (server).",
    );
  }
  return url;
}

export function supabasePublishableKey(): string {
  const key = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY");
  if (!key) {
    throw new Error(
      "Missing Supabase publishable key. Set VITE_SUPABASE_PUBLISHABLE_KEY (browser) " +
        "and SUPABASE_PUBLISHABLE_KEY (server).",
    );
  }
  return key;
}

/**
 * The newer `sb_publishable_` / `sb_secret_` keys are opaque strings, not JWTs.
 * supabase-js still sends them as `Authorization: Bearer <key>`, which GoTrue rejects as
 * a malformed token. Strip that header and pass the key via `apikey` only — but leave a
 * real user JWT alone when one is present.
 */
export function createSupabaseFetch(key: string): typeof fetch {
  const isOpaqueKey = key.startsWith("sb_");
  if (!isOpaqueKey) return fetch;

  return (input, init) => {
    const headers = new Headers(init?.headers);
    const auth = headers.get("Authorization");
    if (auth === `Bearer ${key}`) headers.delete("Authorization");
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

let browserClient: SupabaseClient<Database> | undefined;

function getBrowserClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const key = supabasePublishableKey();
    browserClient = createClient<Database>(supabaseUrl(), key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "roam-bengal-auth",
      },
      global: { fetch: createSupabaseFetch(key) },
    });
  }
  return browserClient;
}

/**
 * Lazy proxy: the underlying client is constructed on first property access, so importing
 * this module never throws at import time even if the env is not wired yet.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    return Reflect.get(getBrowserClient(), prop, receiver);
  },
});

/** Anon-key client for server-side public reads. RLS applies as `anon`. */
export function serverClient(): SupabaseClient<Database> {
  const key = supabasePublishableKey();
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: createSupabaseFetch(key) },
  });
}
