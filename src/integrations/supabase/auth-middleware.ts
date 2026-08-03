import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseFetch, supabasePublishableKey, supabaseUrl } from "./client";
import type { Database } from "./types";

/**
 * Server-side auth gate for every admin server function.
 *
 * Deliberately builds a client scoped to the **caller's JWT**, not the service role.
 * Every admin write therefore still passes through RLS, so the database remains the
 * last line of defence even if an `assertAdmin` call is ever forgotten in a new
 * function. Admin-ness is checked twice on purpose: once in app code (fast, gives a
 * clean `Forbidden`) and once in Postgres (authoritative).
 */

export interface SupabaseAuthContext {
  supabase: SupabaseClient<Database>;
  userId: string;
  email: string | null;
}

/**
 * Throw a real HTTP response rather than a bare Error.
 *
 * A plain `throw new Error(...)` from inside a server function gets swallowed by h3 and
 * surfaces as an opaque `500 {"unhandled":true,"message":"HTTPError"}` — the caller
 * cannot tell "not signed in" from "the database is down", and a client cannot react by
 * redirecting to the sign-in page.
 */
export function httpError(status: number, message: string): never {
  throw new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function looksLikeJwt(token: string): boolean {
  return token.split(".").length === 3;
}

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const header = getRequestHeader("authorization") ?? getRequestHeader("Authorization");

    if (!header?.startsWith("Bearer ")) {
      httpError(401, "Unauthorized: No authorization header provided");
    }

    const token = header.slice("Bearer ".length).trim();
    // Reject the shape before spending a network round trip on it. It also stops the
    // publishable key itself being passed off as a session token.
    if (!token || !looksLikeJwt(token)) {
      httpError(401, "Unauthorized: Malformed access token");
    }

    const key = supabasePublishableKey();
    const supabase = createClient<Database>(supabaseUrl(), key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: createSupabaseFetch(key),
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Verifies the signature — decoding alone would trust whatever the caller sent.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      httpError(401, "Unauthorized: Invalid or expired session");
    }

    return next({
      context: {
        supabase,
        userId: data.user.id,
        email: data.user.email ?? null,
      } satisfies SupabaseAuthContext,
    });
  },
);

/**
 * Reads `user_roles` through the **user-scoped** client, so the "users read own roles"
 * RLS policy applies here too.
 */
export async function isAdmin(context: SupabaseAuthContext): Promise<boolean> {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("[auth] isAdmin lookup failed:", error.message);
    return false;
  }
  return Boolean(data);
}

/** First line of every admin handler. */
export async function assertAdmin(context: SupabaseAuthContext): Promise<void> {
  if (!(await isAdmin(context))) {
    httpError(403, "Forbidden: Admin role required");
  }
}
