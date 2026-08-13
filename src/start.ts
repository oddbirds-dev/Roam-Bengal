import { createStart, createCsrfMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { createMiddleware } from "@tanstack/react-start";
import { serverClient } from "@/integrations/supabase/client";
import { renderErrorPage } from "@/lib/error-page";

/**
 * Global middleware.
 *
 * `csrfMiddleware` is filtered to `handlerType === "serverFn"` on purpose. Document
 * requests must NOT be blocked — an inbound link from Google, Facebook, or a WhatsApp
 * share is legitimately cross-site. Server function RPCs are a different matter: they
 * are the two public writes (`submitInquiry`, `subscribeNewsletter`) plus, later, every
 * admin mutation, and none of those should ever be invocable from another origin.
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === "serverFn",
});

/**
 * Catches anything thrown further down the chain that isn't already HTTP-shaped and turns
 * it into a friendly 500 page instead of a raw crash or an opaque host error.
 *
 * Three things must pass through untouched, not just get logged-and-replaced:
 *   - `httpError()` (auth-middleware.ts) throws a plain `Response` — every admin 401/403
 *     depends on that JSON body and status code reaching the caller unchanged.
 *   - `redirect()` throws an object with `.statusCode`.
 *   - `notFound()` throws an object with `.isNotFound`.
 * Only a genuinely unexpected exception (a bug, a DB outage) should hit the catch-all below.
 */
const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof Response) throw error;
    if (
      error != null &&
      typeof error === "object" &&
      ("statusCode" in error || "isNotFound" in error)
    ) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

type RedirectRow = { to_path: string; status_code: number };

/**
 * Redirect lookups are cached per path for a minute.
 *
 * This middleware runs on every document request, so an uncached miss is one database
 * round trip added to every page view — and misses are the common case, which is why they
 * are cached too.
 */
const REDIRECT_TTL_MS = 60_000;
const redirectCache = new Map<string, { row: RedirectRow | null; expires: number }>();

async function lookupRedirect(path: string): Promise<RedirectRow | null> {
  const cached = redirectCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.row;

  const { data, error } = await serverClient()
    .from("redirects" as never)
    .select("to_path, status_code")
    .eq("from_path", path)
    .maybeSingle();

  if (error) {
    // Never fail a page load over the redirect table; just don't cache the failure.
    console.error("[redirects]", error.message);
    return null;
  }

  const row = (data as RedirectRow | null) ?? null;
  redirectCache.set(path, { row, expires: Date.now() + REDIRECT_TTL_MS });
  return row;
}

const redirectsMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // We skip fetching redirects for static assets and API routes
  if (path.startsWith("/_") || path.includes(".")) {
    return next();
  }

  const match = await lookupRedirect(path);
  if (match) {
    // Build the destination URL preserving query string
    const toUrl = new URL(match.to_path, url.origin);
    toUrl.search = url.search;

    return new Response(null, {
      status: match.status_code || 301,
      headers: { Location: toUrl.toString() },
    });
  }

  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, redirectsMiddleware, csrfMiddleware],
  // Runs on the CLIENT before every server function call, attaching the caller's JWT.
  // Removing this breaks every admin RPC — see auth-attacher.ts.
  functionMiddleware: [attachSupabaseAuth],
}));

